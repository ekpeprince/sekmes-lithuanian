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
  DIACRITICS_GUIDE,
  LITHUANIAN_STRESS_CLASSES,
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
  Zap,
  Volume2,
  CheckCircle2,
  Info,
  Type,
  Award,
} from 'lucide-react';

/**
 * Reusable component to render hyphenated syllables (e.g. "TO-mas Y-ra stu-DEN-tas")
 * Highlighting UPPERCASE parts with amber stress badges.
 */
function SyllableStressBadge({
  syllables,
  className = '',
}: {
  syllables?: string;
  className?: string;
}) {
  if (!syllables) return null;
  const words = syllables.split(' ');

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {words.map((w, wIdx) => {
        const parts = w.split('-');
        return (
          <div
            key={wIdx}
            className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-lg shadow-2xs"
          >
            {parts.map((part, pIdx) => {
              const clean = part.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '');
              const isStressed =
                clean.length > 0 &&
                clean === clean.toUpperCase() &&
                /[A-ZĄČĘĖĮŠŲŪŽ]/.test(clean);
              return (
                <React.Fragment key={pIdx}>
                  {pIdx > 0 && (
                    <span className="text-amber-400 font-bold text-[10px] select-none">·</span>
                  )}
                  <span
                    className={`font-mono text-xs font-bold transition-transform ${
                      isStressed
                        ? 'text-amber-950 font-black px-1 rounded-sm bg-amber-200 border border-amber-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {part}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

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
        <div className="mb-6 px-1">
          {/* Small Category Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-3">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Lietuvių Kalbos Žinynas</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            <span>Grammar Reference</span>
          </div>

          {/* Clean Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
            Gramatikos ir Žodyno Gidas
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            Grammar &amp; Vocabulary Guide
          </p>

          {/* Concise Subtitle / Summary */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            Industry-standard curriculum: 7 noun cases, syllable stress, diacritics, and interactive audio drills.
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
            <span>7 Linksniai • Cases</span>
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
            <span>Taisyklės ir Rašyba • Rules</span>
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
            <span>Veiksmažodžiai • Verbs</span>
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
            <span>Frazės • Phrases ({COMMON_PHRASES.length})</span>
          </button>

          {/* 5TH TAB: INTERACTIVE DRILLS */}
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

        {/* ========================================================================= */}
        {/* TAB 1: 7 LINKSNIAI / NOUN CASES */}
        {/* ========================================================================= */}
        {activeTab === 'cases' && (
          <div className="flex flex-col gap-6 animate-pop">
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <span>
                  Lietuvių kalbos daiktavardžiai turi 7 linksnius. Kiekvienas linksnis turi specifinį vaidmenį, galūnes ir kirčio taisyklę!
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStartDrill('cases')}
                className="hidden sm:flex text-xs font-black text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 py-1.5 px-3 rounded-xl transition-all items-center gap-1.5 shrink-0 cursor-pointer"
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
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed font-medium">
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

                    {/* Stress Rule Hint */}
                    {item.stressRule && (
                      <p className="text-[11px] text-slate-400 font-medium italic mt-2.5">
                        <span className="font-bold text-slate-600 not-italic">Kirčio taisyklė:</span> {item.stressRule}
                      </p>
                    )}
                  </div>

                  {/* Sample Sentence with Syllable Breakdown and Dual-Speed Audio */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-800">
                          {item.examples.sampleSentence}
                        </p>
                        {item.phoneticHint && (
                          <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                            {item.phoneticHint}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {item.examples.translation}
                        </p>
                      </div>
                      <AudioSpeaker
                        text={item.examples.sampleSentence}
                        size="sm"
                        as="button"
                        showSlow={true}
                      />
                    </div>

                    {/* Syllable Stress Badge */}
                    {item.sampleSyllables && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                            Skiemenys ir Kirtis (Syllable Stress):
                          </span>
                        </div>
                        <SyllableStressBadge syllables={item.sampleSyllables} />
                        {item.sampleStressTip && (
                          <p className="text-[10px] text-amber-950 font-medium mt-1.5 leading-tight">
                            💡 {item.sampleStressTip}
                          </p>
                        )}
                      </div>
                    )}
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
                className="btn-3d bg-white text-emerald-900 hover:bg-emerald-50 py-3 px-5 rounded-2xl text-xs font-black shrink-0 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>PRACTICE NOUN CASES</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TEXTBOOK CHAPTER RULES & DIACRITICS MASTERCLASS */}
        {/* ========================================================================= */}
        {activeTab === 'rules' && (
          <div className="flex flex-col gap-8 animate-pop">
            {/* BRAND NEW: DIACRITICS & PRONUNCIATION MASTERCLASS */}
            <div className="rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 sm:p-7 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                  <Type className="w-5 h-5" />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                  Phonetics & Orthography Masterclass
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Lietuvių Rašyba, Tarimas ir Nosinės • Diacritics & Spelling Guide
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
                Master the golden rules of native Lithuanian speech: nosinės (ą, ę, į, ų), hushing sibilants (č, š, ž), and the soft sign palatalization rule.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {DIACRITICS_GUIDE.map((d, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-lg font-black text-amber-300">
                          {d.letter}
                        </span>
                        <span className="font-mono text-xs text-indigo-200 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-400/30">
                          {d.ipa}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white">{d.name}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed font-normal">
                        {d.description}
                      </p>
                      <div className="mt-2 text-[11px] bg-slate-900/60 p-2 rounded-xl border border-white/5 text-amber-200 font-medium">
                        🗣️ <span className="font-bold">Sound Tip:</span> {d.soundHint}
                      </div>
                    </div>

                    {/* Audible Sample Words */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                      {d.sampleWords.map((sw, swIdx) => (
                        <div
                          key={swIdx}
                          className="flex items-center gap-1.5 bg-white/15 px-2 py-1 rounded-lg text-xs"
                        >
                          <span className="font-bold text-white">{sw.word}</span>
                          <span className="text-[10px] text-amber-300 font-mono">({sw.syllables})</span>
                          <AudioSpeaker text={sw.word} size="sm" as="button" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 4 Accent Classes Summary */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Lietuvių Kalbos 4 Kirčiuotės (The 4 Accent Classes Overview)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  {LITHUANIAN_STRESS_CLASSES.map((ac, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="font-black text-amber-300 block mb-0.5">{ac.name}</span>
                      <p className="text-[11px] text-slate-300 leading-snug">{ac.rule}</p>
                      <span className="text-[10px] text-indigo-200 font-mono mt-1 block">Pvz.: {ac.example}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
                  className="text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>⚡ Test Vocative</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Vartojamas kreipiantis į asmenį:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOCATIVE_RULES.map((r, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-rose-600 block">{r.ending}</span>
                        <span className="text-sm font-black text-slate-800">{r.example}</span>
                      </div>
                      <AudioSpeaker text={r.example.split('→')[1]?.trim() || r.example} size="sm" as="button" />
                    </div>
                    {r.syllables && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <SyllableStressBadge syllables={r.syllables} />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">{r.rule}</span>
                      {r.stressTip && <span className="text-[10px] text-amber-800 font-medium">💡 {r.stressTip}</span>}
                    </div>
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
                  className="text-xs font-black text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>⚡ Test Locative</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Atsako į klausimą „Kur?“ (mieste, šalyje, pastate ar gatvėje):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LOCATIVE_RULES.map((r, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-cyan-600 block">{r.ending}</span>
                        <span className="text-xs font-bold text-slate-700">{r.example}</span>
                      </div>
                      <AudioSpeaker text={r.example.split('→')[1]?.trim() || r.example} size="sm" as="button" />
                    </div>
                    {r.syllables && (
                      <SyllableStressBadge syllables={r.syllables} />
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">{r.rule}</span>
                      {r.stressTip && <span className="text-[10px] text-cyan-800 font-medium">💡 {r.stressTip}</span>}
                    </div>
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
                  className="text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>⚡ Test &quot;į vs pas&quot;</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {PREPOSITION_RULES.map((p, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black text-emerald-700">{p.preposition}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{p.chapter}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mb-2">{p.purpose}</p>

                      {p.syllableExamples && (
                        <div className="flex flex-wrap gap-1.5 my-2">
                          {p.syllableExamples.map((syllableEx, sIdx) => (
                            <SyllableStressBadge key={sIdx} syllables={syllableEx} />
                          ))}
                        </div>
                      )}
                    </div>

                    {p.stressTip && (
                      <p className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200/70 mt-2 font-medium">
                        💡 {p.stressTip}
                      </p>
                    )}
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
                  className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>⚡ Test Time & Half-Hours</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {TIME_EXPRESSION_RULES.map((t, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-black text-slate-800 mb-2">{t.category}</h5>
                      {t.syllableExamples ? (
                        <div className="flex flex-wrap gap-1.5 my-1.5">
                          {t.syllableExamples.map((syllableEx, sIdx) => (
                            <SyllableStressBadge key={sIdx} syllables={syllableEx} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {t.examples.map((ex, j) => (
                            <span key={j} className="text-xs font-bold text-slate-600">
                              • {ex}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {t.stressTip && (
                      <p className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200/70 mt-2 font-medium">
                        💡 {t.stressTip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VEIKSMAŽODŽIAI / VERBS */}
        {/* ========================================================================= */}
        {activeTab === 'verbs' && (
          <div className="flex flex-col gap-6 animate-pop">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Object.entries(VERB_CONJUGATIONS).map(([key, item]) => (
                <div key={key} className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 mb-1 border-b border-slate-100 pb-2">
                      {item.title}
                    </h3>
                    {item.stressRule && (
                      <p className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-xl border border-amber-200/70 mb-3 font-medium leading-relaxed">
                        ⚡ {item.stressRule}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      {item.present.map((row, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-500 block">{row.pronoun}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{row.english}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-mono font-black text-emerald-600">{row.form}</span>
                                {row.syllables && <SyllableStressBadge syllables={row.syllables} />}
                              </div>
                              {row.negative && (
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <span className="font-mono text-[10px] text-rose-500">({row.negative})</span>
                                  {row.negativeSyllables && (
                                    <span className="text-[9px] font-mono text-rose-700 bg-rose-50 px-1 rounded border border-rose-200">
                                      {row.negativeSyllables}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <AudioSpeaker text={row.form} size="sm" as="button" />
                          </div>
                        </div>
                      ))}
                    </div>
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
                className="btn-3d bg-white text-amber-900 hover:bg-amber-50 py-3 px-5 rounded-2xl text-xs font-black shrink-0 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>PRACTICE VERBS</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AUTENTIŠKOS FRAZĖS / PHRASES */}
        {/* ========================================================================= */}
        {activeTab === 'phrases' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-pop">
            {COMMON_PHRASES.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border-2 border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-snug">
                        {item.lt}
                      </h4>
                      {item.phonetic && (
                        <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">
                          {item.phonetic}
                        </p>
                      )}
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        {item.en}
                      </p>
                    </div>
                    <AudioSpeaker text={item.lt} size="sm" as="button" showSlow={true} />
                  </div>

                  {/* Syllables and stress breakdown */}
                  {item.syllables && (
                    <div className="mt-2.5">
                      <SyllableStressBadge syllables={item.syllables} />
                    </div>
                  )}

                  {item.stressTip && (
                    <p className="text-[10px] text-amber-900 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/70 mt-2 font-medium">
                      💡 {item.stressTip}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: INTERACTIVE GRAMMAR DRILLS */}
        {/* ========================================================================= */}
        {activeTab === 'drills' && (
          <div className="animate-pop">
            <GrammarExerciseRunner key={drillCategory} initialCategory={drillCategory} />
          </div>
        )}
      </div>
    </div>
  );
}
