import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy • LabasApp',
  description: 'Privacy Policy and Data Protection standards for LabasApp.',
};

export default function PrivacyPage() {
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
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-400 font-semibold">Effective date: October 9, 2026 • LabasApp (labasapp.com)</p>
          </div>
        </div>

        <div className="prose prose-slate text-sm leading-relaxed space-y-5 text-slate-700">
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">1. Overview</h2>
            <p>
              Welcome to <strong>LabasApp</strong> (accessible at <a href="https://labasapp.com" className="text-emerald-600 underline">https://labasapp.com</a>). We respect your privacy and are committed to protecting the personal data of our language learners. This Privacy Policy explains what information we collect, how we use it, and your rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account Credentials:</strong> When you sign in using Google or email, authentication is managed securely by Google Firebase Authentication. We receive your display name, email address, and profile picture URL. We never store or see your passwords.
              </li>
              <li>
                <strong>Learning Activity & Progress:</strong> Your completed lessons, streak count, XP points, Amber gems, and mistake review items are stored to track your language progress across devices.
              </li>
              <li>
                <strong>Multiplayer & Game Data:</strong> In 1v1 Battle Arena and Amber League rankings, only your chosen nickname, avatar emoji, and score are visible to other players.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">3. How We Use Your Information</h2>
            <p>We use your data solely to provide, personalize, and improve your language learning journey:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Syncing your study streak and progress across mobile and desktop.</li>
              <li>Displaying your ranking in weekly Amber League divisions.</li>
              <li>Providing personalized grammar suggestions via the AI Tutor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">4. Third-Party Services</h2>
            <p>We partner only with industry-leading, privacy-compliant providers:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Google Firebase:</strong> Secure authentication and encrypted cloud database storage.</li>
              <li><strong>Google Gemini AI:</strong> Powers conversational practice without retaining personal identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">5. Data Retention & Deletion</h2>
            <p>
              Your data is kept as long as your account is active. You may request deletion of your account and all associated study records at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">6. Contact Us</h2>
            <p>
              If you have any questions or requests regarding your personal data, please contact us at: <a href="mailto:ekpeprinceesor@gmail.com" className="text-emerald-600 font-bold underline">ekpeprinceesor@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
