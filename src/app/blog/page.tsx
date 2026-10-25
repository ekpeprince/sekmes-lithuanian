import type { Metadata } from 'next';
import Link from 'next/link';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lithuanian Learning Blog • Guides, Cases & Tips | LabasApp',
  description:
    'Free guides, pronunciation advice, noun cases, and vocabulary breakdowns for mastering Lithuanian online.',
  openGraph: {
    title: 'Lithuanian Learning Blog • LabasApp',
    description:
      'Free guides, pronunciation advice, noun cases, and vocabulary breakdowns for mastering Lithuanian online.',
    url: 'https://www.labasapp.com/blog',
    type: 'website',
  },
};

interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
}

async function getRecentPosts(): Promise<BlogPostSummary[]> {
  try {
    if (!db) return [];
    const q = query(collection(db, 'blog_posts'), orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || 'Untitled Post',
      slug: doc.data().slug || doc.id,
      excerpt: doc.data().excerpt || '',
      publishedAt: doc.data().publishedAt || '',
    }));
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    return [];
  }
}

export default async function BlogIndexPage() {
  const posts = await getRecentPosts();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6 sm:px-12 w-full">
      <div className="max-w-4xl mx-auto">
        {/* Navigation back to main app */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition">
            ← Back to LabasApp
          </Link>
          <span className="text-xs text-slate-400">LabasApp Publication Hub</span>
        </div>

        {/* Blog Header */}
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
            Insights & Guides
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-4 mb-3 text-white">
            Learn Lithuanian Insights
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Grammar breakdowns, pronunciation tips, and linguistic guides to fast-track your fluency in Europe&apos;s oldest living language.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <h2 className="text-xl font-bold text-white mb-2">New Articles Coming Soon</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Our linguists are crafting detailed breakdowns for Lithuanian noun cases, stress rules, and conversation mastery.
            </p>
            <Link
              href="/"
              className="inline-block bg-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-400 transition"
            >
              Start Interactive Lessons
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition group"
              >
                <div>
                  <span className="text-xs text-slate-400 block mb-2">{post.publishedAt || 'Recent'}</span>
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-6">
                    {post.excerpt}
                  </p>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition mt-auto"
                >
                  Read Article <span>→</span>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-900/20 border border-emerald-500/30 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Practice Speaking with Leonas AI</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto">
            Reading about Lithuanian is great—speaking it with instant AI pronunciation feedback makes it stick.
          </p>
          <Link
            href="/tutor"
            className="inline-block bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            Chat with Leonas AI
          </Link>
        </div>
      </div>
    </main>
  );
}
