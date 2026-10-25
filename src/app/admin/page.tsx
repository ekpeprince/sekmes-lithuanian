'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
}

// Fallback authorized admin emails if settings/admins document is initializing
const DEFAULT_ADMIN_EMAILS: string[] = [
  'sadman@labasapp.com',
  'ekpeprinceesor@gmail.com',
  'your-email@labasapp.com',
];

async function verifyAdminAuthorization(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  // Pre-configured fallback admins
  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
  const fallbackAdmins = [
    ...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()),
    ...envAdmins,
  ];

  // Dynamically check the Firestore admin whitelist document: settings/admins
  if (db) {
    try {
      const adminDocRef = doc(db, 'settings', 'admins');
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        const data = adminSnap.data();
        const allowedEmails: string[] = Array.isArray(data?.allowedEmails)
          ? data.allowedEmails.map((e: unknown) => String(e).toLowerCase().trim())
          : [];

        // Check against Firestore whitelist (with fallback safety)
        if (allowedEmails.includes(normalized) || fallbackAdmins.includes(normalized)) {
          return true;
        }
        return false;
      }
    } catch (err) {
      console.warn('Notice verifying admin status from Firestore settings/admins:', err);
    }
  }

  // Fallback if settings/admins document is not yet found in Firestore
  return fallbackAdmins.includes(normalized);
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(() => Boolean(auth));
  const [error, setError] = useState('');

  // Post Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Existing posts state
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  const fetchExistingPosts = React.useCallback(async () => {
    if (!db) return;
    setFetchingPosts(true);
    try {
      const q = query(collection(db, 'blog_posts'), orderBy('publishedAt', 'desc'));
      const snapshot = await getDocs(q);
      const loaded: BlogPostRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        title: d.data().title || 'Untitled',
        slug: d.data().slug || d.id,
        excerpt: d.data().excerpt || '',
        publishedAt: d.data().publishedAt || '',
      }));
      setPosts(loaded);
    } catch (err: unknown) {
      console.warn('Notice loading posts:', err);
    } finally {
      setFetchingPosts(false);
    }
  }, []);

  useEffect(() => {
    const currentAuth = auth;
    if (!currentAuth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(currentAuth, async (currentUser) => {
      if (currentUser) {
        try {
          const isAllowed = await verifyAdminAuthorization(currentUser.email);
          if (isAllowed) {
            setUser(currentUser); // Allow access
            fetchExistingPosts();
          } else {
            // Regular app user tried to access admin! Sign them out immediately.
            try {
              await signOut(currentAuth);
            } catch {}
            setUser(null);
            setError('Access Denied: You do not have administrator permissions.');
            alert('Access Denied: You do not have administrator permissions.');
          }
        } catch (err: unknown) {
          console.error('Error verifying admin status:', err);
          try {
            await signOut(currentAuth);
          } catch {}
          setUser(null);
          setError(
            'Verification error: ' + (err instanceof Error ? err.message : 'Unknown error')
          );
        } finally {
          setAuthLoading(false);
        }
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchExistingPosts]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // Auto generate slug if user hasn't typed a custom slug
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(newTitle));
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!auth) {
      setError('Firebase Auth is not initialized. Please verify environment keys.');
      return;
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const isAllowed = await verifyAdminAuthorization(cred.user.email);
      if (!isAllowed) {
        await signOut(auth);
        setUser(null);
        setError('Access Denied: You do not have administrator permissions.');
        alert('Access Denied: You do not have administrator permissions.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setError('');

    const isAllowed = await verifyAdminAuthorization(user?.email);
    if (!user || !isAllowed) {
      setError('Access Denied: You do not have administrator permissions.');
      setLoading(false);
      return;
    }

    if (!db) {
      setError('Firestore is not initialized.');
      setLoading(false);
      return;
    }

    try {
      const cleanSlug = slugify(slug || title);
      const postData = {
        title: title.trim(),
        slug: cleanSlug,
        excerpt: excerpt.trim(),
        content: content.trim(),
        publishedAt: new Date().toISOString().split('T')[0],
      };

      await addDoc(collection(db, 'blog_posts'), postData);
      setSuccessMsg(`Article published successfully! Live at /blog/${cleanSlug}`);
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent('');
      await fetchExistingPosts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to publish: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
  };

  const handleDelete = async (postId: string, postTitle: string) => {
    const isAllowed = await verifyAdminAuthorization(user?.email);
    if (!user || !isAllowed) {
      alert('Access Denied: You do not have administrator permissions.');
      return;
    }
    if (!db) return;
    if (!confirm(`Are you sure you want to delete "${postTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, 'blog_posts', postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: unknown) {
      alert('Failed to delete post: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="text-sm text-slate-400 animate-pulse">Checking credentials...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-md mb-4 flex items-center justify-between">
          <Link href="/" className="text-xs text-emerald-400 hover:underline">
            ← Return to LabasApp
          </Link>
          <span className="text-xs text-slate-500">Secure Access</span>
        </div>
        <form
          onSubmit={handleLogin}
          className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl"
        >
          <h1 className="text-2xl font-bold mb-2 text-white">LabasApp Admin</h1>
          <p className="text-sm text-slate-400 mb-6">Restricted access for content publishers.</p>
          {error && (
            <p className="bg-red-950/60 border border-red-500 text-red-300 p-3 rounded-lg text-xs mb-4">
              {error}
            </p>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Publisher Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="editor@labasapp.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-lg hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              Secure Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12 w-full">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Admin Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Publish SEO Article</h1>
              <p className="text-xs text-slate-400">Logged in as {user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/blog"
                target="_blank"
                className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-2 rounded-lg font-medium transition"
              >
                View Live Blog ↗
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition"
              >
                Sign Out
              </button>
            </div>
          </div>

          {error && (
            <p className="bg-red-950/60 border border-red-500 text-red-300 p-3 rounded-lg text-xs mb-4">
              {error}
            </p>
          )}
          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-300 p-4 rounded-lg text-xs mb-6 flex items-center justify-between">
              <span>{successMsg}</span>
              <Link
                href={`/blog/${slugify(slug || title)}`}
                target="_blank"
                className="underline font-bold text-emerald-300 hover:text-white"
              >
                Preview
              </Link>
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Article Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. How to Learn Lithuanian Noun Cases: The Complete Beginner Guide"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                <span className="text-[11px] text-slate-500">labasapp.com/blog/{slug || 'your-slug'}</span>
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. how-to-learn-lithuanian-noun-cases"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SEO Meta Excerpt (140-160 characters recommended)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="Master the 7 Lithuanian noun cases with clear examples, question endings, and native audio tips..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {excerpt.length} characters
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Content (HTML format supported)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="<h2>Why Learn Cases?</h2><p>Lithuanian noun endings indicate the role of the word in a sentence...</p>"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-slate-950 font-bold py-3.5 rounded-lg hover:bg-emerald-400 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Publishing to Firestore...' : 'Publish to Live Subdirectory'}
            </button>
          </form>
        </div>

        {/* Existing Articles Manager */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Published Articles ({posts.length})</h2>
            <button
              onClick={fetchExistingPosts}
              className="text-xs text-slate-400 hover:text-emerald-400 transition"
            >
              {fetchingPosts ? 'Refreshing...' : '↻ Refresh List'}
            </button>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No articles published yet. Publish your first article above!</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {posts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">/blog/{p.slug} • {p.publishedAt}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      className="text-xs text-emerald-400 hover:underline px-2 py-1"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-950/40 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
