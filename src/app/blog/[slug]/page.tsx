import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

interface BlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (!db) return null;
    const q = query(collection(db, 'blog_posts'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as BlogPost;
  } catch (err) {
    console.error('Error fetching blog post:', err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: 'Post Not Found • LabasApp Blog',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${post.title} | LabasApp Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://www.labasapp.com/blog/${post.slug}`,
      type: 'article',
      siteName: 'LabasApp',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6 sm:px-12 w-full">
      <div className="max-w-3xl mx-auto">
        {/* Navigation back to main app / blog home */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition">
            ← Back to LabasApp
          </Link>
          <Link href="/blog" className="text-xs text-slate-400 hover:text-slate-200 transition">
            Lithuanian Learning Insights
          </Link>
        </div>

        {/* Article Header */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-sm text-slate-400 mb-8">Published on {post.publishedAt || 'Recent'}</p>

        {/* Article Body */}
        <article className="max-w-none text-slate-300 leading-relaxed space-y-5 text-base sm:text-lg [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_li]:text-slate-300 [&_a]:text-emerald-400 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-slate-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-emerald-300">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Bottom Conversion CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-900/20 border border-emerald-500/30 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to Master Lithuanian?</h3>
          <p className="text-slate-300 text-sm mb-6 max-w-lg mx-auto">
            Try interactive gamified lessons and practice with Leonas AI instantly with zero bloat.
          </p>
          <Link
            href="/"
            className="inline-block bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            Start Learning Free on LabasApp
          </Link>
        </div>
      </div>
    </main>
  );
}
