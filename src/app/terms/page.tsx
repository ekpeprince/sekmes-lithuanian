import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service • LabasApp',
  description: 'Terms of Service and conditions of use for LabasApp.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-200 shadow-xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to LabasApp</span>
        </Link>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Terms of Service</h1>
            <p className="text-xs text-slate-400 font-semibold">Effective date: October 9, 2026 • LabasApp (labasapp.com)</p>
          </div>
        </div>

        <div className="prose prose-slate text-sm leading-relaxed space-y-5 text-slate-700">
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>LabasApp</strong> (<a href="https://labasapp.com" className="text-emerald-600 underline">https://labasapp.com</a>), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">2. Educational Use</h2>
            <p>
              LabasApp provides language learning tools, pronunciation practice, and interactive educational content for Lithuanian. All educational materials are provided for personal, non-commercial language study.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">3. User Conduct</h2>
            <p>
              When participating in multiplayer duels, community leaderboards, or using the AI language tutor, you agree not to submit offensive, defamatory, or abusive content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">4. Intellectual Property</h2>
            <p>
              All trademarks, curriculum designs, logos, software, and audio interfaces are the property of LabasApp or its licensors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">5. Contact Information</h2>
            <p>
              For any questions regarding these Terms, contact us at: <a href="mailto:ekpeprinceesor@gmail.com" className="text-emerald-600 font-bold underline">ekpeprinceesor@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
