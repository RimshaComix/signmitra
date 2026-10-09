'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Sparkles,
  Volume2,
  Maximize2,
  Languages,
  PenTool,
  Sliders,
  ShieldAlert,
  BookmarkPlus
} from 'lucide-react';

// =============================================================
// SUPPORTED LANGUAGES
// English + all 22 languages in the Eighth Schedule of India
// =============================================================

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ks', name: 'Kashmiri', native: 'کٲشُر' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ur', name: 'Urdu', native: 'اردو' }
];

export default function LanguageSuite() {
  const {
    bgCanvas,
    textPrimary,
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme
  } = useTheme();

  // =========================================================
  // ACTIVE TAB
  // =========================================================

  const [activeTab, setActiveTab] = useState('composer');

  // =========================================================
  // COMPOSER
  // =========================================================

  const [composerIntent, setComposerIntent] = useState('');
  const [composerTone, setComposerTone] = useState('polite');
  const [composerResult, setComposerResult] = useState(null);

  // =========================================================
  // EXPLAINER / GAP DETECTOR
  // =========================================================

  const [rawText, setRawText] = useState(
    'Please take this requisition slip to Counter 4 in the Administrative Wing before 2:30 PM on Thursday. You will need your student ID card and original fee receipt.'
  );

  const [explainerResult, setExplainerResult] = useState(null);
  const [gapResult, setGapResult] = useState(null);

  // =========================================================
  // TRANSLATION
  // =========================================================

  const [transSourceText, setTransSourceText] = useState(
    'Where is the verification counter for student certificates?'
  );

  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [transResult, setTransResult] = useState(null);

  // =========================================================
  // READING LEVEL
  // =========================================================

  const [readingMode, setReadingMode] = useState('simpler');
  const [readingResult, setReadingResult] = useState(null);

  // =========================================================
  // GLOBAL UI
  // =========================================================

  const [fullscreenCard, setFullscreenCard] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedToPhrasebook, setSavedToPhrasebook] = useState(false);

  useEffect(() => {
  if (!fullscreenCard) return;

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setFullscreenCard(null);
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [fullscreenCard]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getErrorMessage = (data, fallback) =>
    data?.error ||
    data?.detail ||
    data?.message ||
    fallback;

  const speakText = (text) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !text
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveToPhrasebook = (
    textToSave,
    category = 'General'
  ) => {
    if (!textToSave?.trim()) return;

    try {
      const existing = JSON.parse(
        localStorage.getItem('signmitra_phrasebook') || '[]'
      );

      const newPhrase = {
        id: `phrase-${Date.now()}`,
        category,
        text: textToSave
      };

      localStorage.setItem(
        'signmitra_phrasebook',
        JSON.stringify([
          newPhrase,
          ...existing
        ])
      );

      setSavedToPhrasebook(true);

      setTimeout(() => {
        setSavedToPhrasebook(false);
      }, 3000);
    } catch (e) {
      alert('Could not save phrase: ' + e.message);
    }
  };

  useEffect(() => {
  if (!fullscreenCard) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [fullscreenCard]);

  // =========================================================
  // 1. COMPOSE CARD
  // =========================================================

  const handleCompose = async () => {
    if (!composerIntent.trim()) return;

    setIsProcessing(true);
    setSavedToPhrasebook(false);

    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'compose_card',
          intent: composerIntent.trim(),
          tone: composerTone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'Failed to compose communication card.'
          )
        );
      }

      setComposerResult(data);
    } catch (e) {
      alert('Failed to compose card: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================
  // 2. EXPLAIN + DETECT GAPS
  // =========================================================

  const handleExplainAndGaps = async () => {
    if (!rawText.trim()) return;

    setIsProcessing(true);
    setExplainerResult(null);
    setGapResult(null);

    try {
      // -----------------------------------------
      // Plain-language explanation
      // -----------------------------------------

      const expRes = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'explain_plain_language',
          text: rawText.trim()
        })
      });

      const expData = await expRes.json();

      if (!expRes.ok) {
        throw new Error(
          getErrorMessage(
            expData,
            'Plain-language analysis failed.'
          )
        );
      }

      setExplainerResult(expData);

      // -----------------------------------------
      // Deterministic communication-gap analysis
      // -----------------------------------------

      const gapRes = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'detect_gaps',
          text: rawText.trim()
        })
      });

      const gapData = await gapRes.json();

      if (!gapRes.ok) {
        throw new Error(
          getErrorMessage(
            gapData,
            'Gap detection failed.'
          )
        );
      }

      setGapResult(gapData);
    } catch (e) {
      setExplainerResult(null);
      setGapResult(null);
      alert('Analysis error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================
  // 3. TRANSLATE
  // =========================================================

  const handleTranslate = async () => {
    const text = transSourceText.trim();

    if (!text) return;

    setIsProcessing(true);
    setTransResult(null);

    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'translate',
          text,
          sourceLang,
          targetLang,
          mode: 'ai'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'Translation API failed.'
          )
        );
      }

      const translatedText =
        data?.translatedText ||
        data?.translated_text ||
        data?.translation ||
        '';

      if (!translatedText.trim()) {
        throw new Error(
          'Translation service returned an empty translation.'
        );
      }

      setTransResult({
        ...data,
        translatedText
      });
    } catch (e) {
      setTransResult(null);
      alert('Translation error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================
  // 4. READING LEVEL
  // =========================================================

  const handleReadingLevel = async () => {
    if (!rawText.trim()) return;

    setIsProcessing(true);
    setReadingResult(null);

    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'simplify_reading_level',
          text: rawText.trim(),
          mode: readingMode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'Reading-level simplification failed.'
          )
        );
      }

      setReadingResult(data);
    } catch (e) {
      alert('Simplification error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ===================================================== */}
      {/* SUB-TAB NAVIGATION                                    */}
      {/* ===================================================== */}

      <div
        className={`p-2 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-wrap gap-2 shadow-sm`}
      >
        {[
          {
            id: 'composer',
            label: 'Card Composer',
            icon: PenTool
          },
          {
            id: 'explainer',
            label: 'Plain Explainer & Gaps',
            icon: Sparkles
          },
          {
            id: 'translator',
            label: 'Translation',
            icon: Languages
          },
          {
            id: 'levels',
            label: 'Reading Level Controls',
            icon: Sliders
          },
          {
            id: 'emergency',
            label: 'Emergency SOS Cards',
            icon: ShieldAlert
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? accentSolid
                  : `${cardInnerBg} opacity-70 hover:opacity-100`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================== */}
      {/* TAB 1: CARD COMPOSER                                  */}
      {/* ===================================================== */}

      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* INPUT */}

          <div
            className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                Feature 16 · User to Staff
              </span>

              <h3 className="text-xl font-black uppercase tracking-tight">
                AI Communication Card Composer
              </h3>

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
                onChange={(e) =>
                  setComposerIntent(e.target.value)
                }
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
                {[
                  'polite',
                  'brief',
                  'urgent',
                  'detailed'
                ].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setComposerTone(tone)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
                      composerTone === tone
                        ? accentSolid
                        : `${cardInnerBg} ${borderTone}`
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompose}
              disabled={
                !composerIntent.trim() ||
                isProcessing
              }
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${
                composerIntent.trim() && !isProcessing
                  ? `${accentSolid} hover:opacity-90`
                  : 'opacity-40 cursor-not-allowed border ' +
                    borderTone
              }`}
            >
              <Sparkles className="w-4 h-4" />

              <span>
                {isProcessing
                  ? 'Processing...'
                  : 'Compose Card Message'}
              </span>
            </button>
          </div>

          {/* OUTPUT */}

          <div
            className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                Card Preview
              </span>

              <h3 className="text-xl font-black uppercase tracking-tight">
                Ready for Display
              </h3>

              {composerResult ? (
                <div className="mt-4 space-y-4">

                  <div
                    className={`p-6 rounded-2xl border-4 ${borderTone} ${cardInnerBg} shadow-inner`}
                  >
                    <p className="text-xl sm:text-2xl font-black leading-snug">
                      "{composerResult.composedText}"
                    </p>
                  </div>

                  {composerResult.followUpQuestion && (
                    <div
                      className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} text-xs font-mono`}
                    >
                      <span className="opacity-60 block text-[10px]">
                        Predicted Follow-Up Question:
                      </span>

                      <span className="font-bold">
                        {composerResult.followUpQuestion}
                      </span>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-16 text-center opacity-50 space-y-2">
                  <PenTool className="w-8 h-8 mx-auto" />

                  <p className="text-xs font-mono font-bold uppercase">
                    Enter your message on the left to compose a card
                  </p>
                </div>
              )}
            </div>

            {composerResult?.composedText && (
              <div
                className="pt-3 flex flex-wrap gap-2 border-t border-dashed"
                style={{
                  borderColor: isDarkTheme
                    ? '#AB92BF30'
                    : '#655A7C20'
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setFullscreenCard(
                      composerResult.composedText
                    )
                  }
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 flex items-center justify-center gap-1.5`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Giant Fullscreen</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      composerResult.composedText
                    )
                  }
                  className={`p-3 rounded-xl font-bold text-xs border-2 ${borderTone} ${cardInnerBg} hover:opacity-80`}
                  title="Speak"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSaveToPhrasebook(
                      composerResult.composedText,
                      'Custom Cards'
                    )
                  }
                  className={`py-3 px-4 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 ${accentSolid} hover:opacity-90`}
                >
                  <BookmarkPlus className="w-4 h-4" />

                  <span>
                    {savedToPhrasebook
                      ? 'Saved to Phrasebook!'
                      : 'Save to Phrases'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 2: EXPLAINER & GAP DETECTOR                       */}
      {/* ===================================================== */}

      {activeTab === 'explainer' && (
        <div className="space-y-4">

          <div
            className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                Features 13, 14 & 15 · Administrative Simplification
              </span>

              <h3 className="text-xl font-black uppercase tracking-tight">
                Plain-Language Explainer & Gap Detector
              </h3>

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
              type="button"
              onClick={handleExplainAndGaps}
              disabled={!rawText.trim() || isProcessing}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${
                rawText.trim() && !isProcessing
                  ? `${accentSolid} hover:opacity-90`
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />

              <span>
                {isProcessing
                  ? 'Analyzing...'
                  : 'Analyze Text & Detect Gaps'}
              </span>
            </button>
          </div>

          {explainerResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* PLAIN LANGUAGE */}

              <div
                className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
              >
                <span className="text-xs font-mono font-bold uppercase opacity-70">
                  1. Plain-Language Breakdown
                </span>

                <div
                  className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}
                >
                  <p className="text-base font-black leading-snug">
                    {explainerResult.plainLanguageSummary ||
                      explainerResult.summary ||
                      'No summary available.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">

                  <div
                    className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                  >
                    <span className="opacity-60 block text-[10px]">
                      Location:
                    </span>

                    <span className="font-bold">
                      {explainerResult.keyDetails?.locationOrCounter ||
                        explainerResult.location ||
                        'Not specified'}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                  >
                    <span className="opacity-60 block text-[10px]">
                      Deadline:
                    </span>

                    <span className="font-bold">
                      {explainerResult.keyDetails?.deadline ||
                        explainerResult.deadline ||
                        'Not specified'}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono`}
                >
                  <span className="opacity-60 block text-[10px]">
                    Action Item:
                  </span>

                  <span className="font-bold">
                    {explainerResult.actionRequired ||
                      explainerResult.action_step ||
                      'No action specified'}
                  </span>
                </div>

                {explainerResult.keyDetails?.requiredDocuments?.length > 0 && (
                  <div
                    className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono`}
                  >
                    <span className="opacity-60 block text-[10px] mb-1">
                      Required Documents:
                    </span>

                    <ul className="list-disc pl-4 space-y-0.5 font-bold">
                      {explainerResult.keyDetails.requiredDocuments.map(
                        (document, index) => (
                          <li key={index}>{document}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* DETECTED GAPS */}

              <div
                className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}
              >
                <div className="flex justify-between items-center">

                  <span className="text-xs font-mono font-bold uppercase opacity-70">
                    2. Detected Communication Gaps
                  </span>

                  {gapResult && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${accentSolid}`}
                    >
                      {gapResult.gaps?.length || 0}{' '}
                      {gapResult.gaps?.length === 1
                        ? 'Gap'
                        : 'Gaps'}
                    </span>
                  )}
                </div>

                {gapResult?.gaps?.length ? (
                  <div className="space-y-3">
                    {gapResult.gaps.map((gap, idx) => (
                      <div
                        key={`${gap.category || 'gap'}-${idx}`}
                        className="p-3.5 rounded-xl border border-orange-500/40 bg-orange-500/10 space-y-1.5"
                      >
                        <div className="flex justify-between items-start gap-3 text-xs font-mono font-bold text-orange-700 dark:text-orange-300">

                          <span className="uppercase">
                            {gap.category ||
                              'Communication Gap'}
                          </span>

                          {gap.quote && (
                            <span className="opacity-60 text-[10px] text-right">
                              "{gap.quote}"
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-orange-950 dark:text-orange-100">
                          {gap.issue ||
                            'Potential ambiguity detected.'}
                        </p>

                        {gap.suggested_action && (
                          <div className="flex justify-between items-center gap-2 pt-1">

                            <span className="text-[11px] font-mono italic">
                              {gap.suggested_action}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setFullscreenCard(
                                  gap.suggested_action
                                )
                              }
                              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase"
                            >
                              Show Card
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center opacity-50">
                    <p className="text-xs font-mono font-bold uppercase">
                      No communication gaps detected.
                    </p>
                  </div>
                )}

                {gapResult?.relative_dates_detected?.length > 0 && (
                  <div
                    className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg}`}
                  >
                    <span className="block text-[10px] font-mono uppercase opacity-60 mb-1">
                      Relative Time Detected
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {gapResult.relative_dates_detected.map(
                        (date, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded-md border text-[10px] font-mono font-bold"
                          >
                            {date}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 3: TRANSLATION                                   */}
      {/* ===================================================== */}

      {activeTab === 'translator' && (
        <div
          className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
        >

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Feature 17 · Multilingual Bridge
            </span>

            <h3 className="text-xl font-black uppercase tracking-tight">
              Context-Aware Translation
            </h3>

            <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
              Translate user text for hearing staff while preserving numbers, dates, and locations.
            </p>
          </div>

          {/* LANGUAGES */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div>
              <label className="text-xs font-mono font-bold uppercase opacity-70 block mb-1">
                Source Language
              </label>

              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className={`w-full p-2.5 rounded-xl font-bold border ${cardInnerBg} ${borderTone}`}
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option
                    key={language.code}
                    value={language.code}
                  >
                    {language.name} ({language.native})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-bold uppercase opacity-70 block mb-1">
                Target Language
              </label>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className={`w-full p-2.5 rounded-xl font-bold border ${cardInnerBg} ${borderTone}`}
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option
                    key={language.code}
                    value={language.code}
                  >
                    {language.name} ({language.native})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            value={transSourceText}
            onChange={(e) => setTransSourceText(e.target.value)}
            rows={3}
            placeholder="Enter the message you want to translate..."
            className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
          />

          <button
            type="button"
            onClick={handleTranslate}
            disabled={!transSourceText.trim() || isProcessing}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${
              transSourceText.trim() && !isProcessing
                ? `${accentSolid} hover:opacity-90`
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Languages className="w-4 h-4" />

            <span>
              {isProcessing
                ? 'Translating...'
                : 'Translate Text'}
            </span>
          </button>

          {transResult && (
            <div
              className={`p-5 rounded-2xl border-4 ${borderTone} ${cardInnerBg} space-y-3`}
            >

              <div className="flex justify-between items-center text-xs font-mono gap-3">

                <span className="font-bold opacity-70 uppercase">
                  Translated Result:
                </span>

                <span className="text-[10px] opacity-50 text-right">
                  {transResult.disclaimer ||
                    'AI-assisted translation'}
                </span>
              </div>

              <p className="text-xl sm:text-2xl font-black leading-snug">
                {transResult.translatedText ||
                  transResult.translated_text ||
                  'Translation unavailable'}
              </p>

              <div className="flex flex-wrap gap-2 text-[10px] font-mono opacity-50">
                {transResult.sourceLanguage && (
                  <span>
                    Source: {transResult.sourceLanguage}
                  </span>
                )}

                {transResult.targetLanguage && (
                  <span>
                    Target: {transResult.targetLanguage}
                  </span>
                )}

                {transResult.engine && (
                  <span>
                    Engine: {transResult.engine}
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setFullscreenCard(
                      transResult.translatedText ||
                      transResult.translated_text
                    )
                  }
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase flex items-center gap-1 ${cardBg} ${borderTone}`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen Card</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      transResult.translatedText ||
                      transResult.translated_text
                    )
                  }
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

      {/* ===================================================== */}
      {/* TAB 4: READING LEVEL                                 */}
      {/* ===================================================== */}

      {activeTab === 'levels' && (
        <div
          className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
        >

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Feature 18 · Cognitive Accessibility
            </span>

            <h3 className="text-xl font-black uppercase tracking-tight">
              Plain-Language & Reading-Level Controls
            </h3>

            <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
              Choose how you want text reformatted for easier comprehension.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">

            {[
              {
                id: 'simpler',
                label: 'Simpler Wording'
              },
              {
                id: 'shorter',
                label: 'Shorter Sentences'
              },
              {
                id: 'step_by_step',
                label: 'Step-by-Step'
              },
              {
                id: 'key_points',
                label: 'Key Points Only'
              },
              {
                id: 'formal',
                label: 'Formal / Polite'
              }
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setReadingMode(mode.id)}
                className={`py-2 px-2 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
                  readingMode === mode.id
                    ? accentSolid
                    : `${cardInnerBg} ${borderTone}`
                }`}
              >
                {mode.label}
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
            type="button"
            onClick={handleReadingLevel}
            disabled={!rawText.trim() || isProcessing}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${
              rawText.trim() && !isProcessing
                ? `${accentSolid} hover:opacity-90`
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Sliders className="w-4 h-4" />

            <span>
              {isProcessing
                ? 'Formatting...'
                : 'Format Reading Level'}
            </span>
          </button>

          {readingResult && (
            <div
              className={`p-5 rounded-2xl border ${borderTone} ${cardInnerBg} space-y-3`}
            >

              <span className="text-xs font-mono font-bold uppercase opacity-70">
                Mode: {readingResult.mode || readingMode}
              </span>

              <p className="text-base font-black whitespace-pre-line leading-relaxed">
                {readingResult.simplifiedText ||
                  readingResult.simplified_text ||
                  'No simplified result available.'}
              </p>

            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 5: EMERGENCY SOS                                 */}
      {/* ===================================================== */}

      {activeTab === 'emergency' && (
        <div
          className="p-5 sm:p-6 rounded-2xl border-2 border-red-500/40 bg-red-500/10 space-y-4 shadow-sm"
        >

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

                  <span className="text-red-700 dark:text-red-400">
                    {sos.title}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white">
                    {sos.priority}
                  </span>

                </div>

                <p className="text-sm font-black">
                  "{sos.text}"
                </p>

                <div className="flex gap-2 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenCard(sos.text)
                    }
                    className="flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase border bg-red-600 text-white flex items-center justify-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Giant Flash Screen</span>
                  </button>

                  <button
                    type="button"
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

      {/* ===================================================== */}
      {/* FULLSCREEN COMMUNICATION CARD                        */}
      {/* ===================================================== */}

      {fullscreenCard && (
        <div
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: '#9ca3af #f3f4f6',
  }}
  className={`fixed inset-0 z-[140] flex flex-col justify-between overflow-y-auto overflow-x-hidden overscroll-contain p-6 sm:p-12 ${bgCanvas} ${textPrimary}`}
  role="dialog"
  aria-modal="true"
  aria-label="Fullscreen communication card"
>

          <div className="flex justify-between items-center">

            <span
              className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg}`}
            >
              HIGH-CONTRAST COMMUNICATION CARD
            </span>

            <button
              type="button"
              onClick={() => setFullscreenCard(null)}
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${accentSolid} font-black text-sm uppercase tracking-wider hover:opacity-90`}
            >
              Close [Esc]
            </button>

          </div>

          <div className="text-center my-auto px-4 max-w-4xl mx-auto">

            <div
              className={`py-12 sm:py-24 px-8 rounded-3xl border-8 ${
                isDarkTheme
                  ? 'border-[#FDF1E2] bg-[#AB92BF]/10'
                  : 'border-[#655A7C] bg-[#655A7C]/5'
              } shadow-2xl`}
            >

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