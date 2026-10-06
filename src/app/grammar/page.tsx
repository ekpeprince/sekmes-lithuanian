'use client';

import React, { useState } from 'react';
import { NOUN_CASES, BUTI_CONJUGATION, COMMON_PHRASES } from '@/data/grammar';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { BookOpen, Sparkles, MessageSquare, Compass } from 'lucide-react';

export default function GrammarPage() {
  const [activeTab, setActiveTab] = useState<'cases' | 'verbs' | 'phrases'>('cases');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Title Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
              Grammar & Vocabulary Cheat Sheet
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Lietuvių Kalbos Pagrindai
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl font-medium">
            Everything you need to master Lithuanian A1: the 7 noun declensions (linksniai), verb conjugations, and essential survival phrases.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-md mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('cases')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'cases'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="h-4 w-4 text-emerald-600" />
            <span>Noun Cases</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verbs')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'verbs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Verb &quot;būti&quot;</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phrases')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'phrases'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-sky-500" />
            <span>Phrases</span>
          </button>
        </div>

        {/* TAB 1: NOUN CASES */}
        {activeTab === 'cases' && (
          <div className="flex flex-col gap-6 animate-pop">
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <span>
                Lithuanian nouns have 7 cases that change the word ending depending on what the noun does in the sentence! Below are the essential A1 cases.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {NOUN_CASES.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-1 rounded-xl text-white font-black text-xs shadow-xs"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.abbreviation}
                        </span>
                        <h3 className="font-black text-lg text-slate-800">
                          {item.name} ({item.lithuanianName})
                        </h3>
                      </div>
                    </div>

                    <div className="text-xs font-black text-slate-500 mb-2">
                      Question: <span className="text-slate-800 font-bold">{item.question}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-600 mb-4 leading-relaxed">
                      {item.purpose}
                    </p>

                    {/* Endings breakdown */}
                    <div className="space-y-2 rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs">
                      <div>
                        <strong className="text-slate-700">Masculine: </strong>
                        <span className="text-slate-600">{item.examples.masculine.base} → </span>
                        <span className="font-extrabold text-emerald-700">{item.examples.masculine.changed}</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">({item.examples.masculine.rule})</span>
                      </div>
                      <div className="border-t border-slate-200/60 pt-2">
                        <strong className="text-slate-700">Feminine: </strong>
                        <span className="text-slate-600">{item.examples.feminine.base} → </span>
                        <span className="font-extrabold text-emerald-700">{item.examples.feminine.changed}</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">({item.examples.feminine.rule})</span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Sentence */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        &quot;{item.examples.sampleSentence}&quot;
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 italic">
                        {item.examples.translation}
                      </p>
                    </div>
                    <AudioSpeaker text={item.examples.sampleSentence} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VERB "BŪTI" */}
        {activeTab === 'verbs' && (
          <div className="flex flex-col gap-6 animate-pop">
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    The Verb &quot;Būti&quot; (To Be)
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    The most fundamental irregular verb in Lithuanian language.
                  </p>
                </div>
                <AudioSpeaker text="Aš esu, tu esi, jis yra" size="md" />
              </div>

              {/* Present Tense Table */}
              <div className="mb-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">
                  Esamasis Laikas (Present Tense)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUTI_CONJUGATION.present.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-sm">{row.pronoun}</span>
                        <span className="text-emerald-700 font-extrabold text-base">{row.form}</span>
                        <span className="text-xs text-slate-400 font-medium">({row.english})</span>
                      </div>
                      <AudioSpeaker text={`${row.pronoun} ${row.form}`} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Tense Table */}
              <div className="mb-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">
                  Būtasis Kartinis Laikas (Past Tense - was/were)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUTI_CONJUGATION.past.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-sm">{row.pronoun}</span>
                        <span className="text-amber-700 font-extrabold text-base">{row.form}</span>
                        <span className="text-xs text-slate-400 font-medium">({row.english})</span>
                      </div>
                      <AudioSpeaker text={`${row.pronoun} ${row.form}`} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Future Tense Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-sky-600 mb-2">
                  Būsimasis Laikas (Future Tense - will be)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUTI_CONJUGATION.future.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/60 border border-sky-200/80 font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-sm">{row.pronoun}</span>
                        <span className="text-sky-700 font-extrabold text-base">{row.form}</span>
                        <span className="text-xs text-slate-400 font-medium">({row.english})</span>
                      </div>
                      <AudioSpeaker text={`${row.pronoun} ${row.form}`} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ESSENTIAL PHRASES */}
        {activeTab === 'phrases' && (
          <div className="flex flex-col gap-4 animate-pop">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {COMMON_PHRASES.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border-2 border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {item.lt}
                    </h4>
                    <p className="text-xs font-semibold text-emerald-600">
                      {item.en}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {item.note}
                    </p>
                  </div>
                  <AudioSpeaker text={item.lt} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
