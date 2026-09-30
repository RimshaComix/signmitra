'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sparkles,
  Mic,
  MicOff,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  CalendarClock,
  Save,
  Maximize2,
  Copy,
  Building,
  HelpCircle,
  FileText,
  Sun,
  Moon,
  ArrowRight
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    label: 'College Fee Slip Notice',
    context: 'Education Office',
    text: 'Please take this requisition slip to Counter 4 in the Administrative Wing before 2:30 PM on Thursday. You will need your student ID card and the original fee receipt to collect the verified hall ticket.'
  },
  {
    label: 'Bank KYC Counter Reply',
    context: 'Bank Branch',
    text: 'Your current account needs a fresh KYC update because the signature does not match. Submit Form 12B along with a self-attested copy of your identity card at Window 2. Processing takes 48 hours.'
  },
  {
    label: 'Hospital OPD Prescription',
    context: 'Hospital Clinic',
    text: 'Take this green card to the 1st floor lab for a fasting blood test tomorrow at 8:00 AM. Do not eat after midnight. Bring the reports back to Room 108 by 11:30 AM.'
  }
];

export default function AIAssistPage() {
  const router = useRouter();
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme, toggleTheme } = useTheme();

  // Workflow Stages: 1. Input/Capture -> 2. Interpret & Clarify -> 3. Confirm & Plan
  const [stage, setStage] = useState(1);
  const [inputText, setInputText] = useState('');
  const [selectedContext, setSelectedContext] = useState('College Office');
  const [isProcessing, setIsProcessing] = useState(false);

  // Speech-to-Text State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // AI Interpretation Results
  const [analysis, setAnalysis] = useState(null);
  const [activeClarificationCard, setActiveClarificationCard] = useState(null);

  // Planner State
  const [plannedTask, setPlannedTask] = useState('');
  const [plannedDate, setPlannedDate] = useState('');

  useEffect(() => {
    // Check Web Speech API availability
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-IN';

      recognizer.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      recognizer.onerror = () => setIsRecording(false);
      recognizer.onend = () => setIsRecording(false);

      recognitionRef.current = recognizer;
      setSpeechSupported(true);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInputText('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: inputText, context: selectedContext })
      });

      const data = await res.json();
      setAnalysis(data);
      setPlannedTask(data.actionRequired || 'Follow up on interaction');
      if (data.keyDetails?.deadlineOrTime && data.keyDetails.deadlineOrTime !== 'Not specified') {
        setPlannedDate(new Date().toISOString().split('T')[0]);
      }
      setStage(2);
    } catch (err) {
      alert('Analysis failed. Using local fallback.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToPlannerAndHistory = () => {
    // 1. Save to History
    const historyItem = {
      id: `AI-ASSIST-${Date.now()}`,
      domain: selectedContext,
      intent: 'AI Interaction Assist',
      title: `${selectedContext} Interaction`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: plannedTask ? 'Follow-Up Scheduled' : 'Completed',
      verifiedByStaff: false,
      entities: {
        'Plain Explanation': analysis?.plainLanguageSummary || 'Processed',
        'Action Item': plannedTask || 'Completed'
      }
    };
    const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
    localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));

    // 2. Save to Followups Planner
    if (plannedTask.trim()) {
      const task = {
        id: `TASK-${Date.now()}`,
        title: `${selectedContext}: ${plannedTask}`,
        situation: 'AI Assist Action',
        category: selectedContext.includes('Hospital') ? 'Health' : selectedContext.includes('Bank') ? 'Finance' : 'Education',
        type: 'Action Step',
        nextAction: plannedTask,
        dueDate: plannedDate || new Date().toISOString().split('T')[0],
        priority: 'High',
        status: 'Planned'
      };
      const existingTasks = JSON.parse(localStorage.getItem('signmitra_followups') || '[]');
      localStorage.setItem('signmitra_followups', JSON.stringify([task, ...existingTasks]));
    }

    alert('Summary saved to History and Follow-Up Planner!');
    router.push('/communication-hub');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link 
            href="/communication-hub" 
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">AI INTERACTION ASSIST</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}>
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between border-b pb-4 mb-8" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
          {[
            { num: 1, label: 'Capture' },
            { num: 2, label: 'Explain & Clarify' },
            { num: 3, label: 'Confirm & Plan' }
          ].map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                stage === s.num ? accentSolid : stage > s.num ? 'bg-green-600 text-white' : `${cardInnerBg} border${borderTone}`
              }`}>
                {stage > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${stage >= s.num ? '' : 'opacity-40'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* STAGE 1: CAPTURE (Speech-to-Text, Paste, or Presets)     */}
        {/* ========================================================= */}
        {stage === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <header>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-3`}>
                <Sparkles className="w-3.5 h-3.5" />
                COGNITIVE INTERACTION COPILOT
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Capture & Simplify</h1>
              <p className={`text-sm mt-1 font-medium ${textSecondary}`}>
                Record staff speech, paste a complicated counter notice, or choose an example to simplify.
              </p>
            </header>

            {/* Context Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['College Office', 'Bank Branch', 'Hospital OPD', 'Public Transit'].map(ctx => (
                <button
                  key={ctx}
                  onClick={() => setSelectedContext(ctx)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                    selectedContext === ctx ? accentSolid : `${cardBg}${borderTone} hover:border-[#655A7C]`
                  }`}
                >
                  {ctx}
                </button>
              ))}
            </div>

            {/* Input Card */}
            <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">
                  Staff Response or Notice Text
                </label>
                {speechSupported && (
                  <button
                    onClick={toggleRecording}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all ${
                      isRecording ? 'bg-red-600 text-white animate-pulse' : `${cardInnerBg} border${borderTone} hover:border-[#655A7C]`
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isRecording ? 'Listening... Tap to Stop' : 'Live Caption Staff'}</span>
                  </button>
                )}
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste the message, type what staff wrote, or tap 'Live Caption Staff' above..."
                rows={5}
                className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] resize-none ${cardInnerBg} ${borderTone}`}
              />

              <div className="flex items-center justify-between text-[11px] font-mono opacity-60">
                <span>{inputText.length} characters</span>
                {isRecording && <span className="text-red-500 font-bold">● Audio capture active (Consent required)</span>}
              </div>
            </div>

            {/* Quick Demo Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block">
                Or try a realistic scenario:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRESET_SCENARIOS.map((sc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(sc.text);
                      setSelectedContext(sc.context);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    <span className="block text-[10px] opacity-60 uppercase font-mono">{sc.context}</span>
                    <span className="truncate block mt-0.5">{sc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim() || isProcessing}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 ${
                inputText.trim() && !isProcessing ? accentSolid + ' hover:opacity-90' : 'opacity-40 cursor-not-allowed border ' + borderTone
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>Simplifying Response...</span>
                </>
              ) : (
                <>
                  <span>Explain in Plain Language</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: INTERPRET & CLARIFY (Plain Language + Recovery) */}
        {/* ========================================================= */}
        {stage === 2 && analysis && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
            <header>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                {selectedContext} Interaction
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Plain-Language Breakdown</h2>
            </header>

            {/* Plain Language Card */}
            <div className={`p-6 rounded-2xl border-4 ${isDarkTheme ? 'border-[#FDF1E2]' : 'border-[#655A7C]'} ${cardBg} shadow-sm space-y-4`}>
              <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-70 block">
                WHAT THIS MEANS:
              </span>
              <p className="text-xl sm:text-2xl font-black leading-snug">
                {analysis.plainLanguageSummary}
              </p>
            </div>

            {/* Structured Facts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block">Location / Room</span>
                <span className="font-black text-sm block mt-1">{analysis.keyDetails?.locationOrCounter || 'Not specified'}</span>
              </div>
              <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block">Deadline / Time</span>
                <span className="font-black text-sm block mt-1">{analysis.keyDetails?.deadlineOrTime || 'Not specified'}</span>
              </div>
              <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block">Action Item</span>
                <span className="font-black text-sm block mt-1">{analysis.actionRequired || 'None'}</span>
              </div>
            </div>

            {/* Clarification Recovery (When details are missing) */}
            {analysis.clarificationCards?.length > 0 && (
              <div className={`p-5 rounded-2xl border-2 border-dashed ${borderTone} ${cardBg} space-y-3`}>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                  <HelpCircle className="w-4 h-4 text-orange-500" />
                  <span>Unclear or Missing details detected — Tap to show card:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysis.clarificationCards.map((cardText, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveClarificationCard(cardText)}
                      className={`p-3.5 rounded-xl border text-left font-bold text-xs flex items-center justify-between transition-all ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                    >
                      <span className="pr-2">"{cardText}"</span>
                      <Maximize2 className="w-4 h-4 opacity-50 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStage(1)}
                className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all`}
              >
                Back
              </button>
              <button
                onClick={() => setStage(3)}
                className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
              >
                <span>Continue to Confirm & Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 3: CONFIRM & PLAN (Planner and History Save)        */}
        {/* ========================================================= */}
        {stage === 3 && analysis && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
            <header>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Schedule & Save Action</h2>
              <p className={`text-sm mt-1 font-medium ${textSecondary}`}>
                Review the extracted next step. Confirmed tasks are added to your local planner and recorded in history.
              </p>
            </header>

            <div className={`p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">
                  Confirmed Next Action Step
                </label>
                <input
                  type="text"
                  value={plannedTask}
                  onChange={(e) => setPlannedTask(e.target.value)}
                  className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">
                  Target Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
              </div>
            </div>

            <div className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-start gap-3`}>
              <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Everything is saved strictly on this device in local storage. No conversation data is transferred or retained on external servers.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStage(2)}
                className={`py-4 px-6 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all`}
              >
                Back
              </button>
              <button
                onClick={handleSaveToPlannerAndHistory}
                className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
              >
                <Save className="w-4 h-4" />
                <span>Save Summary & Tasks</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* FULLSCREEN CLARIFICATION CARD DISPLAY */}
      {activeClarificationCard && (
        <div className={`fixed inset-0 z-[100] flex flex-col justify-between p-6 sm:p-12 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-lg border-2 ${borderTone} ${cardInnerBg}`}>
              CLARIFICATION CARD
            </span>
            <button
              onClick={() => setActiveClarificationCard(null)}
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${cardBg} font-black text-sm uppercase tracking-wider hover:opacity-80 transition-all`}
            >
              Close
            </button>
          </div>

          <div className="text-center my-auto space-y-6">
            <div className={`py-12 sm:py-20 px-6 rounded-3xl border-8 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#655A7C]/5'} shadow-2xl mx-auto max-w-3xl`}>
              <p className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                "{activeClarificationCard}"
              </p>
            </div>
          </div>

          <div className="text-center text-xs font-mono font-bold uppercase tracking-widest opacity-50">
            Show this screen directly to staff if the previous response was unclear
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t py-4 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardInnerBg}`}>
        <span>SignMitra AI Assist</span>
        <span className="opacity-70">Local-First Cognitive Pipeline</span>
      </footer>

    </div>
  );
}