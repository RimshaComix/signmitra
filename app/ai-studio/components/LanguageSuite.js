'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Sparkles,
  HelpCircle,
  Volume2,
  Maximize2,
  Copy,
  Check,
  Send,
  Languages,
  PenTool,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  FileText,
  BookmarkPlus
} from 'lucide-react';

export default function LanguageSuite() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  // Active Tool Sub-Tab
  const [activeTab, setActiveTab] = useState('composer'); // 'composer' | 'explainer' | 'gaps' | 'translator' | 'levels' | 'emergency'

  // Composer State (Feature 16)
  const [composerIntent, setComposerIntent] = useState('');
  const [composerTone, setComposerTone] = useState('polite'); // 'brief' | 'polite' | 'urgent' | 'detailed'
  const [composerResult, setComposerResult] = useState(null);

  // Explainer & Gap Detector State (Features 13, 14, 15)
  const [rawText, setRawText] = useState('Please take this requisition slip to Counter 4 in the Administrative Wing before 2:30 PM on Thursday. You will need your student ID card and original fee receipt.');
  const [explainerResult, setExplainerResult] = useState(null);
  const [gapResult, setGapResult] = useState(null);

  // Translation State (Feature 17)
  const [transSourceText, setTransSourceText] = useState('Where is the verification counter for student certificates?');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [transResult, setTransResult] = useState(null);

  // Reading Level State (Feature 18)
  const [readingMode, setReadingMode] = useState('simpler'); // 'simpler' | 'shorter' | 'step_by_step' | 'key_points' | 'formal'
  const [readingResult, setReadingResult] = useState(null);

  // Emergency SOS State (Feature 27)
  const [fullscreenCard, setFullscreenCard] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedToPhrasebook, setSavedToPhrasebook] = useState(false);

  // 1. Compose Card
  const handleCompose = async () => {
    if (!composerIntent.trim()) return;
    setIsProcessing(true);
    setSavedToPhrasebook(false);

    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compose_card',
          intent: composerIntent,
          tone: composerTone
        })
      });
      const data = await res.json();
      setComposerResult(data);
    } catch (e) {
      alert('Failed to compose card: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Explain & Detect Gaps
  const handleExplainAndGaps = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);

    try {
      const expRes = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'explain_plain_language', text: rawText })
      });
      const expData = await expRes.json();
      setExplainerResult(expData);

      const gapRes = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect_gaps', text: rawText })
      });
      const gapData = await gapRes.json();
      setGapResult(gapData);
    } catch (e) {
      alert('Analysis error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Translate
  const handleTranslate = async () => {
    if (!transSourceText.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          text: transSourceText,
          sourceLang,
          targetLang
        })
      });
      const data = await res.json();
      setTransResult(data);
    } catch (e) {
      alert('Translation error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Reading Level Simplify
  const handleReadingLevel = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simplify_reading_level',
          text: rawText,
          mode: readingMode
        })
      });
      const data = await res.json();
      setReadingResult(data);
    } catch (e) {
      alert('Simplification error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save to existing Phrasebook (`signmitra_phrasebook`)
  const handleSaveToPhrasebook = (textToSave, category = 'General') => {
    const existing = JSON.parse(localStorage.getItem('signmitra_phrasebook') || '[]');
    const newPhrase = {
      id: `phrase-${Date.now()}`,
      category,
      text: textToSave
    };
    localStorage.setItem('signmitra_phrasebook', JSON.stringify([newPhrase, ...existing]));
    setSavedToPhrasebook(true);
    setTimeout(() => setSavedToPhrasebook(false), 3000);
  };

  // Speak helper
  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Sub-Tab Navigation */}
      <div className={`p-2 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-wrap gap-2 shadow-sm`}>
        {[
          { id: 'composer', label: 'Card Composer', icon: PenTool },
          { id: 'explainer', label: 'Plain Explainer & Gaps', icon: Sparkles },
          { id: 'translator', label: 'Translation', icon: Languages },
          { id: 'levels', label: 'Reading Level Controls', icon: Sliders },
          { id: 'emergency', label: 'Emergency SOS Cards', icon: ShieldAlert }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isActive ? accentSolid : `${cardInnerBg} opacity-70 hover:opacity-100`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI COMMUNICATION CARD COMPOSER (Feature 16)       */}
      {/* ========================================================= */}
      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                Feature 16 · User to Staff
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight">AI Communication Card Composer</h3>
              <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
                Convert your goal into a high-visibility card tailored for busy counter clerks.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase opacity-80">
                What do you want to say or ask?
              </label>
              <textarea
                value={composerIntent}
                onChange={(e) => setComposerIntent(e.target.value)}
                placeholder="e.g., I need to get my college migration certificate signed by the registrar..."
                rows={3}
                className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase opacity-80">
                Communication Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['polite', 'brief', 'urgent', 'detailed'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setComposerTone(tone)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
                      composerTone === tone ? accentSolid : `${cardInnerBg} ${borderTone}`
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCompose}
              disabled={!composerIntent.trim() || isProcessing}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${
                composerIntent.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-40 cursor-not-allowed border ' + borderTone
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Compose Card Message</span>
            </button>
          </div>

          {/* Composed Output */}
          <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                Card Preview
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight">Ready for Display</h3>

              {composerResult ? (
                <div className="mt-4 space-y-4">
                  <div className={`p-6 rounded-2xl border-4 ${borderTone} ${cardInnerBg} shadow-inner`}>
                    <p className="text-xl sm:text-2xl font-black leading-snug">
                      "{composerResult.composedText}"
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} text-xs font-mono`}>
                    <span className="opacity-60 block text-[10px]">Predicted Follow-Up Question:</span>
                    <span className="font-bold">{composerResult.followUpQuestion}</span>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center opacity-50 space-y-2">
                  <PenTool className="w-8 h-8 mx-auto" />
                  <p className="text-xs font-mono font-bold uppercase">Enter your message on the left to compose a card</p>
                </div>
              )}
            </div>

            {composerResult && (
              <div className="pt-3 flex flex-wrap gap-2 border-t border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                <button
                  onClick={() => setFullscreenCard(composerResult.composedText)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 flex items-center justify-center gap-1.5`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Giant Fullscreen</span>
                </button>

                <button
                  onClick={() => speakText(composerResult.composedText)}
                  className={`p-3 rounded-xl font-bold text-xs border-2 ${borderTone} ${cardInnerBg} hover:opacity-80`}
                  title="Speak"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleSaveToPhrasebook(composerResult.composedText, 'Custom Cards')}
                  className={`py-3 px-4 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 ${accentSolid} hover:opacity-90`}
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{savedToPhrasebook ? 'Saved to Phrasebook!' : 'Save to Phrases'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EXPLAINER & GAP DETECTOR (Features 13, 14, 15)      */}
      {/* ========================================================= */}
      {activeTab === 'explainer' && (
        <div className="space-y-4">
          <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                Features 13, 14 & 15 · Administrative Simplification
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight">Plain-Language Explainer & Gap Detector</h3>
              <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
                Enter or paste complex counter text to extract facts and identify ambiguities with exact text citations.
              </p>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={3}
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
            />

            <button
              onClick={handleExplainAndGaps}
              disabled={!rawText.trim() || isProcessing}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Text & Detect Gaps</span>
            </button>
          </div>

          {/* Results Grid */}
          {explainerResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Plain Language & Facts */}
              <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
                <span className="text-xs font-mono font-bold uppercase opacity-70">
                  1. Plain-Language Breakdown
                </span>
                <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                  <p className="text-base font-black leading-snug">
                    {explainerResult.plainLanguageSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                    <span className="opacity-60 block text-[10px]">Location:</span>
                    <span className="font-bold">{explainerResult.keyDetails?.locationOrCounter}</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                    <span className="opacity-60 block text-[10px]">Deadline:</span>
                    <span className="font-bold">{explainerResult.keyDetails?.deadlineOrTime}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono`}>
                  <span className="opacity-60 block text-[10px]">Action Item:</span>
                  <span className="font-bold">{explainerResult.actionRequired}</span>
                </div>
              </div>

              {/* Detected Gaps & Questions */}
              <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold uppercase opacity-70">
                    2. Detected Communication Gaps
                  </span>
                  {gapResult && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${accentSolid}`}>
                      {gapResult.clarityScore}
                    </span>
                  )}
                </div>

                {gapResult?.gaps?.map((gap, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl border border-orange-500/40 bg-orange-500/10 space-y-1.5`}>
                    <div className="flex justify-between text-xs font-mono font-bold text-orange-700 dark:text-orange-300">
                      <span>{gap.label}</span>
                      <span className="opacity-60 text-[10px]">"{gap.quote}"</span>
                    </div>
                    <p className="text-xs font-bold text-orange-950 dark:text-orange-100">
                      {gap.issue}
                    </p>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[11px] font-mono italic">"{gap.suggestion}"</span>
                      <button
                        onClick={() => setFullscreenCard(gap.suggestion)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase"
                      >
                        Show Card
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CONTEXT-AWARE TRANSLATION (Feature 17)             */}
      {/* ========================================================= */}
      {activeTab === 'translator' && (
        <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Feature 17 · Multilingual Bridge
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight">Context-Aware Translation</h3>
            <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
              Translate user text for hearing staff while preserving numbers, dates, and locations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-bold uppercase opacity-70 block mb-1">Source Language</label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className={`w-full p-2.5 rounded-xl font-bold border ${cardInnerBg} ${borderTone}`}
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono font-bold uppercase opacity-70 block mb-1">Target Language</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className={`w-full p-2.5 rounded-xl font-bold border ${cardInnerBg} ${borderTone}`}
              >
                <option value="hi">Hindi (हिंदी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <textarea
            value={transSourceText}
            onChange={(e) => setTransSourceText(e.target.value)}
            rows={3}
            className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
          />

          <button
            onClick={handleTranslate}
            disabled={!transSourceText.trim() || isProcessing}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
          >
            <Languages className="w-4 h-4" />
            <span>Translate Text</span>
          </button>

          {transResult && (
            <div className={`p-5 rounded-2xl border-4 ${borderTone} ${cardInnerBg} space-y-3`}>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold opacity-70 uppercase">Translated Result:</span>
                <span className="text-[10px] opacity-50">{transResult.disclaimer}</span>
              </div>
              <p className="text-xl sm:text-2xl font-black leading-snug">
                {transResult.translatedText}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setFullscreenCard(transResult.translatedText)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase flex items-center gap-1 ${cardBg} ${borderTone}`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen Card</span>
                </button>
                <button
                  onClick={() => speakText(transResult.translatedText)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase flex items-center gap-1 ${cardBg} ${borderTone}`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: READING LEVEL & SIMPLIFICATION (Feature 18)        */}
      {/* ========================================================= */}
      {activeTab === 'levels' && (
        <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Feature 18 · Cognitive Accessibility
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight">Plain-Language & Reading-Level Controls</h3>
            <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
              Choose how you want text reformatted for easier comprehension.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'simpler', label: 'Simpler Wording' },
              { id: 'shorter', label: 'Shorter Sentences' },
              { id: 'step_by_step', label: 'Step-by-Step' },
              { id: 'key_points', label: 'Key Points Only' },
              { id: 'formal', label: 'Formal / Polite' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setReadingMode(m.id)}
                className={`py-2 px-2 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
                  readingMode === m.id ? accentSolid : `${cardInnerBg} ${borderTone}`
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={3}
            className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
          />

          <button
            onClick={handleReadingLevel}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
          >
            <Sliders className="w-4 h-4" />
            <span>Format Reading Level</span>
          </button>

          {readingResult && (
            <div className={`p-5 rounded-2xl border ${borderTone} ${cardInnerBg} space-y-3`}>
              <span className="text-xs font-mono font-bold uppercase opacity-70">
                Mode: {readingResult.mode}
              </span>
              <p className="text-base font-black whitespace-pre-line leading-relaxed">
                {readingResult.simplifiedText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: EMERGENCY SOS COMMUNICATION (Feature 27)           */}
      {/* ========================================================= */}
      {activeTab === 'emergency' && (
        <div className={`p-5 sm:p-6 rounded-2xl border-2 border-red-500/40 bg-red-500/10 space-y-4 shadow-sm`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
              Feature 27 · Emergency Accessibility Cards
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight text-red-900 dark:text-red-100">
              Immediate High-Priority Cards
            </h3>
            <p className="text-xs mt-1 text-red-800 dark:text-red-200">
              Display or speak essential accessibility cards instantly during urgent situations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Deaf Identity & Written Form',
                text: 'I am Deaf and communicate using Indian Sign Language. Please write down what you are saying.',
                priority: 'High Priority'
              },
              {
                title: 'Emergency Contact Assistance',
                text: 'I need immediate assistance. Please contact my emergency contact or write down instructions.',
                priority: 'Urgent'
              },
              {
                title: 'Hospital / Medical Emergency',
                text: 'I am seeking medical attention. Please communicate with me using written notes or visual gestures.',
                priority: 'Critical'
              },
              {
                title: 'Request ISL Interpreter',
                text: 'I formally request an Indian Sign Language (ISL) interpreter for this proceeding.',
                priority: 'Formal'
              }
            ].map((sos, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border border-red-500/30 ${cardInnerBg} space-y-2`}
              >
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-red-700 dark:text-red-400">{sos.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white">{sos.priority}</span>
                </div>
                <p className="text-sm font-black">"{sos.text}"</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setFullscreenCard(sos.text)}
                    className="flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase border bg-red-600 text-white flex items-center justify-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Giant Flash Screen</span>
                  </button>
                  <button
                    onClick={() => speakText(sos.text)}
                    className={`p-2 rounded-lg border text-xs ${cardBg} ${borderTone}`}
                    title="Speak"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-mono opacity-70 text-red-950 dark:text-red-200">
            Notice: This app displays communication cards on screen; it does not automatically call emergency services or dispatch personnel without an active integration.
          </p>
        </div>
      )}

      {/* FULLSCREEN CARD MODAL */}
      {fullscreenCard && (
        <div className={`fixed inset-0 z-[140] flex flex-col justify-between p-6 sm:p-12 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg}`}>
              HIGH-CONTRAST COMMUNICATION CARD
            </span>
            <button
              onClick={() => setFullscreenCard(null)}
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${accentSolid} font-black text-sm uppercase tracking-wider hover:opacity-90`}
            >
              Close [Esc]
            </button>
          </div>

          <div className="text-center my-auto px-4 max-w-4xl mx-auto">
            <div className={`py-12 sm:py-24 px-8 rounded-3xl border-8 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#655A7C]/5'} shadow-2xl`}>
              <p className="text-3xl sm:text-6xl font-black tracking-tight leading-tight">
                "{fullscreenCard}"
              </p>
            </div>
          </div>

          <div className="text-center text-xs font-mono font-bold uppercase tracking-widest opacity-60">
            Show directly to hearing staff
          </div>
        </div>
      )}

    </div>
  );
}
