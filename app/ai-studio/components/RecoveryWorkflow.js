'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  CalendarClock,
  Save,
  Maximize2,
  Volume2,
  Copy,
  Check,
  Building,
  FileText,
  Clock,
  MapPin,
  Mic,
  MicOff,
  Send,
  Trash2,
  ChevronRight,
  ListChecks,
  UserCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export default function RecoveryWorkflow({ 
  initialContext = 'College Office',
  initialGoal = '',
  initialInstitution = '',
  onCompleteSession
}) {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  // Current step 1 to 10
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // STEP 1: START
  const [context, setContext] = useState(initialContext);
  const [goal, setGoal] = useState(initialGoal || 'Submit document and obtain verified acknowledgment');
  const [institution, setInstitution] = useState(initialInstitution || '');
  const [prefMode, setPrefMode] = useState('Visual Cards + Written Replies');

  // STEP 2: PREPARE (Copilot Plan)
  const [copilotPlan, setCopilotPlan] = useState(null);
  const [approvedPlan, setApprovedPlan] = useState(false);

  // STEP 3 & 4: COMMUNICATE & CAPTURE
  const [capturedText, setCapturedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  // STEP 5: UNDERSTAND (Plain Language)
  const [analysis, setAnalysis] = useState(null);

  // STEP 6: DETECT GAPS
  const [gaps, setGaps] = useState([]);

  // STEP 7: CLARIFY
  const [clarificationCards, setClarificationCards] = useState([]);
  const [selectedClarification, setSelectedClarification] = useState('');
  const [fullscreenCard, setFullscreenCard] = useState(null);

  // STEP 8: CONFIRM (User Confirmation Matrix)
  const [confirmationItems, setConfirmationItems] = useState([
    { id: 'conf-1', label: 'Counter or Room Number', value: '', status: 'unclear' }, // 'confirmed' | 'unclear' | 'na'
    { id: 'conf-2', label: 'Deadline or Collection Date', value: '', status: 'unclear' },
    { id: 'conf-3', label: 'Required Documents Checked', value: '', status: 'unclear' },
    { id: 'conf-4', label: 'Next Action Step', value: '', status: 'unclear' }
  ]);

  // STEP 9: SUMMARIZE
  const [summaryDraft, setSummaryDraft] = useState({
    title: '',
    confirmedFacts: [],
    unresolvedQuestions: [],
    explicitDates: [],
    aiSuggestions: []
  });

  // STEP 10: FOLLOW UP (Tasks & History)
  const [tasksToSchedule, setTasksToSchedule] = useState([]);
  const [isSessionSaved, setIsSessionSaved] = useState(false);

  // Web Speech Init for Step 4
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-IN';

        recognizer.onresult = (e) => {
          let interim = '';
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) final += e.results[i][0].transcript;
            else interim += e.results[i][0].transcript;
          }
          setInterimText(interim);
          if (final.trim()) {
            setCapturedText(prev => prev ? prev + ' ' + final.trim() : final.trim());
          }
        };

        recognizer.onerror = () => setIsRecording(false);
        recognizer.onend = () => setIsRecording(false);
        recognitionRef.current = recognizer;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      try { recognitionRef.current.stop(); } catch {}
      setIsRecording(false);
    } else {
      setInterimText('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // STEP 1 -> 2: Fetch Copilot Plan
  const handleGeneratePlan = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copilot_prepare',
          context,
          goal,
          institution,
          preferences: prefMode
        })
      });
      const data = await res.json();
      setCopilotPlan(data);
      setCurrentStep(2);
    } catch (err) {
      alert('Failed to generate copilot plan. Please check connectivity.');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 4 -> 5: Explain captured text
  const handleAnalyzeCaptured = async () => {
    if (!capturedText.trim()) return;
    setIsProcessing(true);

    try {
      // 1. Plain language explainer
      const expRes = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_plain_language',
          text: capturedText,
          context
        })
      });
      const expData = await expRes.json();
      setAnalysis(expData);

      // 2. Gap detection
      const gapRes = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'detect_gaps',
          text: capturedText,
          context
        })
      });
      const gapData = await gapRes.json();
      setGaps(gapData.gaps || []);

      // 3. Populate confirmation draft items
      setConfirmationItems([
        {
          id: 'conf-1',
          label: 'Counter or Room Number',
          value: expData.keyDetails?.locationOrCounter !== 'Not specified' ? expData.keyDetails?.locationOrCounter : '',
          status: expData.keyDetails?.locationOrCounter !== 'Not specified' ? 'confirmed' : 'unclear'
        },
        {
          id: 'conf-2',
          label: 'Deadline or Collection Date',
          value: expData.keyDetails?.deadlineOrTime !== 'Not specified' ? expData.keyDetails?.deadlineOrTime : '',
          status: expData.keyDetails?.deadlineOrTime !== 'Not specified' ? 'confirmed' : 'unclear'
        },
        {
          id: 'conf-3',
          label: 'Required Documents Checked',
          value: expData.keyDetails?.documentsNeeded?.join(', ') || '',
          status: expData.keyDetails?.documentsNeeded?.length ? 'confirmed' : 'unclear'
        },
        {
          id: 'conf-4',
          label: 'Next Action Step',
          value: expData.actionRequired || '',
          status: expData.actionRequired ? 'confirmed' : 'unclear'
        }
      ]);

      // Move to Step 5
      setCurrentStep(5);
    } catch (err) {
      alert('Analysis error. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 6 -> 7: Generate Clarification Cards
  const handleGenerateClarifications = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_clarifications',
          text: capturedText,
          context,
          specificGap: gaps.map(g => g.issue).join('; ')
        })
      });
      const data = await res.json();
      setClarificationCards(data.clarifications || []);
      if (data.clarifications?.[0]) {
        setSelectedClarification(data.clarifications[0].questionCard);
      }
      setCurrentStep(7);
    } catch (err) {
      alert('Failed to generate clarification questions.');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 8 -> 9: Build Summary
  const handleBuildSummary = () => {
    const confirmed = confirmationItems.filter(i => i.status === 'confirmed' && i.value.trim());
    const unresolved = confirmationItems.filter(i => i.status === 'unclear');

    setSummaryDraft({
      title: `${context}: ${goal}`,
      confirmedFacts: confirmed.map(i => `${i.label}: ${i.value}`),
      unresolvedQuestions: unresolved.map(i => `Missing ${i.label}`),
      explicitDates: confirmationItems.find(i => i.id === 'conf-2')?.value ? [confirmationItems.find(i => i.id === 'conf-2').value] : [],
      aiSuggestions: [
        'Obtain physical counter receipt before leaving desk',
        'Verify document verification stamp'
      ]
    });

    // Populate default task for follow-up
    const nextAct = confirmationItems.find(i => i.id === 'conf-4')?.value || 'Complete interaction follow-up';
    const due = confirmationItems.find(i => i.id === 'conf-2')?.value || '';
    
    setTasksToSchedule([
      {
        id: `TASK-${Date.now()}`,
        title: `${context}: ${nextAct}`,
        situation: `${institution || context} interaction`,
        category: context.includes('Hospital') ? 'Healthcare' : context.includes('Bank') ? 'Banking & Finance' : 'Education',
        type: 'Action Step',
        nextAction: nextAct,
        dueDate: due.includes(':') ? new Date().toISOString().split('T')[0] : due || new Date().toISOString().split('T')[0],
        priority: 'High',
        status: 'Planned',
        approved: true
      }
    ]);

    setCurrentStep(9);
  };

  // STEP 10: Save to History and Followups Planner
  const handleSaveAll = () => {
    // 1. Save to History
    const historyItem = {
      id: `AI-STUDIO-${Date.now()}`,
      domain: context,
      intent: goal,
      title: summaryDraft.title || `${context} AI Session`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: tasksToSchedule.length ? 'Follow-Up Scheduled' : 'Completed',
      verifiedByStaff: false, // Explicit user vs staff attribution
      entities: {
        'Confirmed Facts': summaryDraft.confirmedFacts.join(' | ') || 'None',
        'Unresolved Details': summaryDraft.unresolvedQuestions.join(' | ') || 'None',
        'Captured Response': capturedText.slice(0, 100) + '...'
      }
    };

    const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
    localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));

    // 2. Save approved tasks to Followups Planner
    const approvedTasks = tasksToSchedule.filter(t => t.approved);
    if (approvedTasks.length) {
      const existingTasks = JSON.parse(localStorage.getItem('signmitra_followups') || '[]');
      localStorage.setItem('signmitra_followups', JSON.stringify([...approvedTasks, ...existingTasks]));
    }

    // 3. Save to dedicated AI Sessions Ledger
    const sessionRecord = {
      id: historyItem.id,
      timestamp: Date.now(),
      context,
      goal,
      institution,
      capturedText,
      analysis,
      gaps,
      confirmedFacts: summaryDraft.confirmedFacts,
      unresolvedQuestions: summaryDraft.unresolvedQuestions,
      savedTasks: approvedTasks
    };
    const existingSessions = JSON.parse(localStorage.getItem('signmitra_ai_sessions') || '[]');
    localStorage.setItem('signmitra_ai_sessions', JSON.stringify([sessionRecord, ...existingSessions]));

    setIsSessionSaved(true);
    if (onCompleteSession) onCompleteSession(sessionRecord);
  };

  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    }
  };

  const STEP_TITLES = [
    '1. Start',
    '2. Prepare',
    '3. Communicate',
    '4. Capture',
    '5. Understand',
    '6. Detect Gaps',
    '7. Clarify',
    '8. Confirm',
    '9. Summarize',
    '10. Follow Up'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 10-Step Progress Indicator */}
      <div className={`p-4 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm overflow-x-auto`}>
        <div className="flex items-center min-w-[700px] justify-between text-xs font-mono">
          {STEP_TITLES.map((title, idx) => {
            const stepNum = idx + 1;
            const isCurrent = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <button
                key={title}
                onClick={() => isCompleted && setCurrentStep(stepNum)}
                disabled={!isCompleted && !isCurrent}
                className={`flex items-center gap-1.5 py-1 px-2 rounded-lg font-bold transition-all ${
                  isCurrent
                    ? accentSolid
                    : isCompleted
                    ? 'text-green-600 dark:text-green-400 cursor-pointer hover:opacity-80'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <span>{isCompleted ? '✓' : stepNum}</span>
                <span className="hidden sm:inline">{title.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: START INTERACTION                                                */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-5 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 1 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Define Interaction Context</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              Tell the copilot where you are going and what you want to achieve.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                Context / Domain
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone}`}
              >
                <option value="College Office">College Office / Academic</option>
                <option value="Bank Branch">Bank Branch / Finance</option>
                <option value="Hospital OPD">Hospital OPD / Healthcare</option>
                <option value="Public Transit">Public Transit / Railway</option>
                <option value="Government Office">Government Office / Public Services</option>
                <option value="General Interaction">Other Service Interaction</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                Institution or Facility Name (Optional)
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. City General Hospital, SBI Main Branch..."
                className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone}`}
              >
              </input>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
              Your Communication Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What do you need from the staff?"
              rows={2}
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
              Communication Preference
            </label>
            <select
              value={prefMode}
              onChange={(e) => setPrefMode(e.target.value)}
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone}`}
            >
              <option value="Visual Cards + Written Replies">Visual Cards + Written Replies</option>
              <option value="Large Captions + Spoken Output">Large Captions + Spoken Text-to-Speech</option>
              <option value="Step-by-Step Written Breakdown">Step-by-Step Written Breakdown</option>
            </select>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={!goal.trim() || isProcessing}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 transition-all ${
              goal.trim() && !isProcessing ? accentSolid + ' hover:opacity-90' : 'opacity-40 cursor-not-allowed border ' + borderTone
            }`}
          >
            {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isProcessing ? 'Generating Copilot Plan...' : 'Generate Preparation Plan →'}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PREPARE (Copilot Plan)                                           */}
      {/* ========================================================================= */}
      {currentStep === 2 && copilotPlan && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 2 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Interaction Preparation Plan</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              Review recommended documents, checklist tasks, and opening communication cards before approaching the counter.
            </p>
          </header>

          {/* Suggested Documents */}
          <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Recommended Documents to Carry [AI Suggestion]:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {copilotPlan.suggestedDocuments?.map((doc, idx) => (
                <span key={idx} className={`px-3 py-1 rounded-md text-xs font-bold border ${borderTone} ${cardBg}`}>
                  📄 {doc}
                </span>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase opacity-70">Preparation Tasks:</span>
            <div className="space-y-2">
              {copilotPlan.checklist?.map((c) => (
                <div key={c.id} className={`p-3 rounded-xl border flex items-center gap-3 ${cardInnerBg} ${borderTone}`}>
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-xs font-bold">{c.task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Opening Cards */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase opacity-70">Suggested Cards to Show Staff:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {copilotPlan.suggestedCards?.map((card, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${cardInnerBg} ${borderTone}`}>
                  <span>"{card}"</span>
                  <button
                    onClick={() => speakText(card)}
                    className="p-1 rounded opacity-60 hover:opacity-100"
                    title="Speak"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>Approve Plan & Proceed to Communicate →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3 & 4: COMMUNICATE & CAPTURE                                        */}
      {/* ========================================================================= */}
      {(currentStep === 3 || currentStep === 4) && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              {currentStep === 3 ? 'Step 3 of 10: Counter Communication' : 'Step 4 of 10: Capture Staff Response'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {currentStep === 3 ? 'Present Message & Receive Answer' : 'Record Staff Response'}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              Capture what staff said or wrote so the cognitive engine can check for missing details.
            </p>
          </header>

          {/* Quick Opening Card Presentation */}
          {currentStep === 3 && (
            <div className={`p-5 rounded-2xl border-4 ${borderTone} ${cardInnerBg} space-y-3 text-center`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block">
                Show this opening card across the counter:
              </span>
              <p className="text-xl sm:text-2xl font-black">
                "Hello, I am here regarding {goal}. Please speak into my phone or write down your reply."
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => speakText(`Hello, I am here regarding ${goal}. Please speak into my phone or write down your reply.`)}
                  className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${cardBg} ${borderTone}`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak Aloud</span>
                </button>
                <button
                  onClick={() => setFullscreenCard(`Hello, I am here regarding ${goal}. Please speak into my phone or write down your reply.`)}
                  className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${cardBg} ${borderTone}`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Giant Fullscreen</span>
                </button>
              </div>
            </div>
          )}

          {/* Capture Box */}
          <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4`}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                Staff Response / Counter Instructions
              </label>
              <button
                onClick={toggleRecording}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all ${
                  isRecording ? 'bg-red-600 text-white animate-pulse' : `${cardInnerBg} border ${borderTone} hover:border-[#655A7C]`
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Listening... Tap to Stop' : 'Live Caption Staff'}</span>
              </button>
            </div>

            <textarea
              value={capturedText}
              onChange={(e) => setCapturedText(e.target.value)}
              placeholder="Paste or type what staff wrote, or tap 'Live Caption Staff' above..."
              rows={4}
              className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
            />

            {isRecording && (
              <p className="text-xs font-mono italic text-red-500 animate-pulse">
                Live: {interimText || 'Listening...'}
              </p>
            )}

            {/* Realistic Scenario Presets for immediate demonstration */}
            <div className="pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block mb-1">
                Or fill with realistic staff response:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCapturedText('Take this requisition slip to Counter 4 in the Administrative Wing before 2:30 PM on Thursday. You will need your student ID card and original fee receipt.')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cardInnerBg} ${borderTone}`}
                >
                  College Desk Reply
                </button>
                <button
                  onClick={() => setCapturedText('Your account needs KYC update. Submit Form 12B along with self-attested identity proof at Window 2. Processing takes 48 hours.')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cardInnerBg} ${borderTone}`}
                >
                  Bank KYC Reply
                </button>
                <button
                  onClick={() => setCapturedText('Take this green card to the 1st floor lab for a fasting blood test tomorrow at 8:00 AM. Bring reports back to Room 108.')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cardInnerBg} ${borderTone}`}
                >
                  Hospital OPD Reply
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={handleAnalyzeCaptured}
              disabled={!capturedText.trim() || isProcessing}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${
                capturedText.trim() && !isProcessing ? accentSolid + ' hover:opacity-90' : 'opacity-40 cursor-not-allowed border ' + borderTone
              }`}
            >
              {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isProcessing ? 'Analyzing Response...' : 'Understand & Detect Gaps →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: UNDERSTAND (Plain Language)                                      */}
      {/* ========================================================================= */}
      {currentStep === 5 && analysis && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 5 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Plain-Language Understanding</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              Here is what the staff member's instructions mean in simple terms.
            </p>
          </header>

          {/* Simple Explanation Card */}
          <div className={`p-6 rounded-2xl border-4 ${borderTone} ${cardInnerBg} shadow-sm space-y-3`}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">
              WHAT THIS MEANS:
            </span>
            <p className="text-lg sm:text-2xl font-black leading-snug">
              {analysis.plainLanguageSummary}
            </p>
          </div>

          {/* Key Facts Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}>
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">Location / Counter</span>
              <span className="font-black text-sm block mt-1">{analysis.keyDetails?.locationOrCounter || 'Not stated'}</span>
            </div>
            <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}>
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">Deadline / Time</span>
              <span className="font-black text-sm block mt-1">{analysis.keyDetails?.deadlineOrTime || 'Not stated'}</span>
            </div>
            <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}>
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">Action Item</span>
              <span className="font-black text-sm block mt-1">{analysis.actionRequired || 'None'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(4)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(6)}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>Inspect Communication Gaps →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: DETECT GAPS                                                      */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 6 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Communication Gap Detector</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              The cognitive engine inspected the staff response for missing deadlines, documents, or ambiguous locations.
            </p>
          </header>

          <div className="space-y-3">
            {gaps.length === 0 ? (
              <div className={`p-6 rounded-xl border text-center ${cardInnerBg} ${borderTone}`}>
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-black text-sm uppercase">No Critical Gaps Detected</h4>
                <p className="text-xs opacity-70 mt-1">All key parameters appear to be present.</p>
              </div>
            ) : (
              gaps.map((gap, idx) => (
                <div key={idx} className={`p-4 rounded-xl border-2 border-orange-500/40 bg-orange-500/10 space-y-2`}>
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      {gap.label}
                    </span>
                    <span className="opacity-60 text-[10px] font-normal">Source: "{gap.quote}"</span>
                  </div>
                  <p className="text-xs font-bold text-orange-950 dark:text-orange-200">
                    {gap.issue}
                  </p>
                  <div className={`p-2.5 rounded-lg border ${borderTone} ${cardInnerBg} text-xs flex items-center justify-between`}>
                    <span className="font-bold">Clarification Card: "{gap.suggestion}"</span>
                    <button
                      onClick={() => setFullscreenCard(gap.suggestion)}
                      className="px-2 py-1 rounded text-[10px] font-mono font-bold border uppercase"
                    >
                      Show Card
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(5)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={handleGenerateClarifications}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>Generate Clarification Cards →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: CLARIFY                                                          */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 7 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Clarification Cards</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              Pick or edit a high-contrast question card to show the staff member if anything is still unclear.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clarificationCards.map((card) => (
              <div
                key={card.id}
                className={`p-4 rounded-xl border transition-all ${
                  selectedClarification === card.questionCard ? 'ring-2 ring-[#655A7C] ' + cardInnerBg : cardInnerBg + ' ' + borderTone
                } space-y-3`}
              >
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="opacity-70">{card.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${accentSolid}`}>{card.urgency}</span>
                </div>
                <p className="text-sm font-black">"{card.questionCard}"</p>
                <p className="text-[11px] opacity-60">{card.contextNote}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setFullscreenCard(card.questionCard)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase border ${borderTone} ${cardBg} hover:opacity-80 flex items-center justify-center gap-1`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Show Fullscreen</span>
                  </button>
                  <button
                    onClick={() => speakText(card.questionCard)}
                    className={`p-2 rounded-lg text-xs font-mono font-bold uppercase border ${borderTone} ${cardBg} hover:opacity-80`}
                    title="Speak Aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(6)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(8)}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>Proceed to User Confirmation →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 8: CONFIRM (User Confirmation Matrix)                               */}
      {/* ========================================================================= */}
      {currentStep === 8 && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 8 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Review & Confirm Parameters</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              You are in full control. Explicitly mark each extracted detail as Confirmed, Still Unclear, or Not Applicable.
            </p>
          </header>

          <div className="space-y-3">
            {confirmationItems.map((item, idx) => (
              <div key={item.id} className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-3`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {item.label}
                  </span>
                  
                  {/* Status Toggles: Confirmed | Unclear | N/A */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => {
                        const updated = [...confirmationItems];
                        updated[idx].status = 'confirmed';
                        setConfirmationItems(updated);
                      }}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        item.status === 'confirmed' ? 'bg-green-600 text-white' : `${cardBg} border ${borderTone}`
                      }`}
                    >
                      ✓ Confirmed
                    </button>

                    <button
                      onClick={() => {
                        const updated = [...confirmationItems];
                        updated[idx].status = 'unclear';
                        setConfirmationItems(updated);
                      }}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        item.status === 'unclear' ? 'bg-orange-500 text-white' : `${cardBg} border ${borderTone}`
                      }`}
                    >
                      ⚠️ Still Unclear
                    </button>

                    <button
                      onClick={() => {
                        const updated = [...confirmationItems];
                        updated[idx].status = 'na';
                        setConfirmationItems(updated);
                      }}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        item.status === 'na' ? accentSolid : `${cardBg} border ${borderTone}`
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => {
                    const updated = [...confirmationItems];
                    updated[idx].value = e.target.value;
                    setConfirmationItems(updated);
                  }}
                  placeholder={`Enter or edit ${item.label.toLowerCase()}...`}
                  className={`w-full p-2.5 rounded-lg border text-sm font-bold outline-none ${cardBg} ${borderTone}`}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(7)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={handleBuildSummary}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>Build Structured Summary →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 9: SUMMARIZE                                                        */}
      {/* ========================================================================= */}
      {currentStep === 9 && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 9 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Structured Interaction Summary</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              Review the verified session ledger. AI suggestions and confirmed facts are strictly distinguished.
            </p>
          </header>

          {/* Confirmed Facts Section */}
          <div className={`p-5 rounded-xl border-2 border-green-500/30 bg-green-500/10 space-y-2`}>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>User-Confirmed Facts:</span>
            </div>
            {summaryDraft.confirmedFacts.map((fact, idx) => (
              <p key={idx} className="text-xs font-bold text-green-950 dark:text-green-100">
                • {fact}
              </p>
            ))}
          </div>

          {/* Unresolved Questions */}
          {summaryDraft.unresolvedQuestions.length > 0 && (
            <div className={`p-5 rounded-xl border-2 border-orange-500/30 bg-orange-500/10 space-y-2`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-orange-700 dark:text-orange-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Unresolved Items (Requires Follow-Up):</span>
              </div>
              {summaryDraft.unresolvedQuestions.map((q, idx) => (
                <p key={idx} className="text-xs font-bold text-orange-950 dark:text-orange-100">
                  • {q}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(8)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(10)}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>Approve Tasks & Finalize Follow-Up →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 10: FOLLOW UP (Save to Planner and History)                         */}
      {/* ========================================================================= */}
      {currentStep === 10 && (
        <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}>
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Step 10 of 10</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Schedule Follow-Up Actions</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}>
              Confirmed action steps will be recorded into your local Planner (`signmitra_followups`) and Request History (`signmitra_history`).
            </p>
          </header>

          {/* Tasks List */}
          <div className="space-y-3">
            {tasksToSchedule.map((t, idx) => (
              <div key={t.id} className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.approved}
                      onChange={(e) => {
                        const up = [...tasksToSchedule];
                        up[idx].approved = e.target.checked;
                        setTasksToSchedule(up);
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs font-mono font-bold uppercase">{t.category} Task</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${accentSolid}`}>
                    {t.priority} Priority
                  </span>
                </div>

                <input
                  type="text"
                  value={t.nextAction}
                  onChange={(e) => {
                    const up = [...tasksToSchedule];
                    up[idx].nextAction = e.target.value;
                    up[idx].title = `${context}: ${e.target.value}`;
                    setTasksToSchedule(up);
                  }}
                  className={`w-full p-2.5 rounded-lg border text-sm font-bold outline-none ${cardBg} ${borderTone}`}
                />

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="opacity-60">Target Due Date:</span>
                  <input
                    type="date"
                    value={t.dueDate}
                    onChange={(e) => {
                      const up = [...tasksToSchedule];
                      up[idx].dueDate = e.target.value;
                      setTasksToSchedule(up);
                    }}
                    className={`p-1.5 rounded border text-xs font-mono font-bold outline-none ${cardBg} ${borderTone}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Save Status & Confirmation */}
          {isSessionSaved ? (
            <div className={`p-5 rounded-xl border border-green-500 bg-green-500/10 text-green-700 dark:text-green-300 font-bold text-xs space-y-2`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm">Session Successfully Saved to Planner & History!</span>
              </div>
              <p className="opacity-90">
                You can view the record anytime in "Requests" (/history) and your scheduled tasks in "Planner" (/followups).
              </p>
            </div>
          ) : (
            <button
              onClick={handleSaveAll}
              className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <Save className="w-4 h-4" />
              <span>Save to Follow-Up Planner & Request History</span>
            </button>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(9)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setIsSessionSaved(false);
              }}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase flex items-center gap-1.5`}
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Start New Session</span>
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN DISPLAY MODAL FOR CLARIFICATION CARDS */}
      {fullscreenCard && (
        <div className={`fixed inset-0 z-[130] flex flex-col justify-between p-6 sm:p-12 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg}`}>
              CLARIFICATION QUESTION CARD
            </span>
            <button
              onClick={() => setFullscreenCard(null)}
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${accentSolid} font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all`}
            >
              Close Card [Esc]
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
            Show this screen directly to staff to resolve missing information
          </div>
        </div>
      )}

    </div>
  );
}
