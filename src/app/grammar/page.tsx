'use client';

import React, { useState } from 'react';
import {
  NOUN_CASES,
  VOCATIVE_RULES,
  LOCATIVE_RULES,
  PREPOSITION_RULES,
  TIME_EXPRESSION_RULES,
  VERB_CONJUGATIONS,
  COMMON_PHRASES,
} from '@/data/grammar';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { GrammarExerciseRunner } from '@/components/GrammarExerciseRunner';
import {
  BookOpen,
  Sparkles,
  MessageSquare,
  Compass,
  Bookmark,
  Brain,
  ArrowRight,
} from 'lucide-react';

export default function GrammarPage() {
  const [activeTab, setActiveTab] = useState<'cases' | 'rules' | 'verbs' | 'phrases' | 'drills'>('cases');
  const [drillCategory, setDrillCategory] = useState<'all' | 'cases' | 'vocative' | 'prepositions' | 'locative' | 'verbs' | 'time'>('all');

  const handleStartDrill = (category: 'all' | 'cases' | 'vocative' | 'prepositions' | 'locative' | 'verbs' | 'time') => {
    setDrillCategory(category);
    setActiveTab('drills');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Title Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
              Lithuanian A1 Curriculum Reference • Žinynas
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Gramatikos ir Žodyno Gidas
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl font-medium">
            Akademinė lietuvių kalbos programa (1–4 skyriai): 7 linksniai, šauksmininkas, vietininkas, prielinksniai, laiko reiškimas ir interaktyvios užduotys.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('cases')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'cases'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="h-4 w-4 text-emerald-600" />
            <span>7 Linksniai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="h-4 w-4 text-sky-600" />
            <span>Taisyklės (1–4 sk.)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verbs')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'verbs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Veiksmažodžiai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phrases')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'phrases'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-rose-500" />
            <span>Frazės ({COMMON_PHRASES.length})</span>
          </button>

          {/* NEW 5TH TAB: INTERACTIVE DRILLS */}
          <button
            type="button"
            onClick={() => handleStartDrill('all')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'drills'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 font-extrabold bg-emerald-100/60 hover:bg-emerald-100'
            }`}
          >
            <Brain className="h-4 w-4" />
            <span>Užduotys • Drills</span>
          </button>
        </div>

        {/* TAB 1: 7 LINKSNIAI / NOUN CASES */}
        {activeTab === 'cases' && (
          <div className="flex flex-col gap-6 animate-pop">
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <span>
                  Lietuvių kalbos daiktavardžiai turi 7 linksnius. Linksnis rodo žodžio vaidmenį sakinyje ir keičia jo galūnę!
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStartDrill('cases')}
                className="hidden sm:flex text-xs font-black text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 py-1.5 px-3 rounded-xl transition-all items-center gap-1.5 shrink-0"
              >
                <span>⚡ Test Cases</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
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
                          {item.lithuanianName}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {item.name}
                      </span>
                    </div>

                    {/* Question and purpose */}
                    <p className="text-sm font-extrabold text-slate-700 mb-1">
                      Klausimas: <span className="text-emerald-600">{item.question}</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                      {item.purpose}
                    </p>

                    {/* Rules Box */}
                    <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-500">Vyriškoji g. (m):</span>
                        <span className="font-mono font-bold text-slate-800">{item.examples.masculine.changed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-500">Moteriškoji g. (f):</span>
                        <span className="font-mono font-bold text-slate-800">{item.examples.feminine.changed}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Sentence with Audio */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-800">
                        {item.examples.sampleSentence}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {item.examples.translation}
                      </p>
                    </div>
                    <AudioSpeaker text={item.examples.sampleSentence} size="sm" as="button" />
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Callout Banner at bottom of Cases */}
            <div className="mt-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                    Interactive Drill
                  </span>
                </div>
                <h4 className="text-lg font-black">Test your knowledge of the 7 Noun Cases</h4>
                <p className="text-xs text-emerald-100 font-medium mt-1">
                  Practice identifying Genitive of origin, Accusative direct objects, and Instrumental transports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleStartDrill('cases')}
                className="btn-3d bg-white text-emerald-900 hover:bg-emerald-50 py-3 px-5 rounded-2xl text-xs font-black shrink-0 flex items-center gap-2 shadow-sm"
              >
                <span>PRACTICE NOUN CASES</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TEXTBOOK CHAPTER RULES */}
        {activeTab === 'rules' && (
          <div className="flex flex-col gap-8 animate-pop">
            {/* 1. Šauksmininkas */}
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-700 text-xs font-black uppercase">
                    2 skyrius
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Daiktavardžių vienaskaitos šauksmininkas (Vocative)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartDrill('vocative')}
                  className="text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>⚡ Test Vocative</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Vartojamas kreipiantis į asmenį:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VOCATIVE_RULES.map((r, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-rose-600 block">{r.ending}</span>
                      <span className="text-xs font-bold text-slate-700">{r.example}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{r.rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Vietininkas */}
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-100 text-cyan-700 text-xs font-black uppercase">
                    3 skyrius
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Vienaskaitos vietininkas (Locative – Kur?)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartDrill('locative')}
                  className="text-xs font-black text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>⚡ Test Locative</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Atsako į klausimą „Kur?“ (mieste, šalyje, pastate ar gatvėje):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LOCATIVE_RULES.map((r, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-cyan-600 block">{r.ending}</span>
                      <span className="text-xs font-bold text-slate-700">{r.example}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{r.rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Prielinksniai */}
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-black uppercase">
                    2, 3 ir 4 skyriai
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Svarbiausi prielinksniai ir linksniai
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartDrill('prepositions')}
                  className="text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>⚡ Test &quot;į vs pas&quot;</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {PREPOSITION_RULES.map((p, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-emerald-700">{p.preposition}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{p.chapter}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mb-2">{p.purpose}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.examples.map((ex, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Laiko reiškimas */}
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-700 text-xs font-black uppercase">
                    4 skyrius
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Laiko reiškimas galininku ir pusvalandžiai
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartDrill('time')}
                  className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>⚡ Test Time & Half-Hours</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {TIME_EXPRESSION_RULES.map((t, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h5 className="text-xs font-black text-slate-800 mb-2">{t.category}</h5>
                    <div className="flex flex-col gap-1">
                      {t.examples.map((ex, j) => (
                        <span key={j} className="text-xs font-bold text-slate-600">
                          • {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VEIKSMAŽODŽIAI / VERBS */}
        {activeTab === 'verbs' && (
          <div className="flex flex-col gap-6 animate-pop">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Object.entries(VERB_CONJUGATIONS).map(([key, item]) => (
                <div key={key} className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs">
                  <h3 className="font-black text-lg text-slate-900 mb-3 border-b border-slate-100 pb-2">
                    {item.title}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {item.present.map((row, i) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">{row.pronoun}</span>
                        <div className="text-right">
                          <span className="font-mono font-black text-emerald-600 block">{row.form}</span>
                          {row.negative && (
                            <span className="font-mono text-[10px] text-rose-500 block">({row.negative})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Verb Practice Callout */}
            <div className="mt-2 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                  Interactive Practice
                </span>
                <h4 className="text-lg font-black mt-0.5">Test Present Tense Conjugations</h4>
                <p className="text-xs text-amber-100 font-medium mt-1">
                  Conjugate &quot;būti / nebūti&quot;, &quot;gyventi&quot;, &quot;kalbėti&quot;, and &quot;dirbti&quot; with immediate feedback.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleStartDrill('verbs')}
                className="btn-3d bg-white text-amber-900 hover:bg-amber-50 py-3 px-5 rounded-2xl text-xs font-black shrink-0 flex items-center gap-2 shadow-sm"
              >
                <span>PRACTICE VERBS</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: AUTENTIŠKOS FRAZĖS / PHRASES */}
        {activeTab === 'phrases' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-pop">
            {COMMON_PHRASES.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border-2 border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {item.lt}
                  </h4>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    {item.en}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {item.note}
                  </p>
                </div>
                <AudioSpeaker text={item.lt} size="sm" as="button" />
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: INTERACTIVE GRAMMAR DRILLS */}
        {activeTab === 'drills' && (
          <div className="animate-pop">
            <GrammarExerciseRunner key={drillCategory} initialCategory={drillCategory} />
          </div>
        )}
      </div>
    </div>
  );
}
