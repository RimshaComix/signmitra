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
  ExternalLink,
  XCircle
} from 'lucide-react';

export default function RecoveryWorkflow({
  initialContext = 'College Office',
  initialGoal = '',
  initialInstitution = '',
  onCompleteSession
}) {
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

  // ---------------------------------------------------------------------------
  // CORE WORKFLOW STATE
  // ---------------------------------------------------------------------------

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // STEP 1: START
  const [context, setContext] = useState(initialContext);
  const [goal, setGoal] = useState(
    initialGoal || 'Submit document and obtain verified acknowledgment'
  );
  const [institution, setInstitution] = useState(initialInstitution || '');
  const [prefMode, setPrefMode] = useState(
    'Visual Cards + Written Replies'
  );

  // STEP 2: PREPARE
  const [copilotPlan, setCopilotPlan] = useState(null);
  const [approvedPlan, setApprovedPlan] = useState(false);

  // STEP 3 & 4: COMMUNICATE / CAPTURE
  const [capturedText, setCapturedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  // STEP 5: UNDERSTAND
  const [analysis, setAnalysis] = useState(null);

  // STEP 6: DETECT GAPS
  const [gaps, setGaps] = useState([]);

  // STEP 7: CLARIFY
  const [clarificationCards, setClarificationCards] = useState([]);
  const [selectedClarification, setSelectedClarification] = useState('');
  const [fullscreenCard, setFullscreenCard] = useState(null);

  // STEP 8: CONFIRM
  const [confirmationItems, setConfirmationItems] = useState([
    {
      id: 'conf-1',
      label: 'Counter or Room Number',
      value: '',
      status: 'unclear'
    },
    {
      id: 'conf-2',
      label: 'Deadline or Collection Date',
      value: '',
      status: 'unclear'
    },
    {
      id: 'conf-3',
      label: 'Required Documents Checked',
      value: '',
      status: 'unclear'
    },
    {
      id: 'conf-4',
      label: 'Next Action Step',
      value: '',
      status: 'unclear'
    }
  ]);

  // STEP 9: SUMMARIZE
  const [summaryDraft, setSummaryDraft] = useState({
    title: '',
    confirmedFacts: [],
    unresolvedQuestions: [],
    explicitDates: [],
    aiSuggestions: []
  });

  // STEP 10: FOLLOW UP
  const [tasksToSchedule, setTasksToSchedule] = useState([]);
  const [isSessionSaved, setIsSessionSaved] = useState(false);

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  const safeJson = async (response) => {
    const text = await response.text();

    if (!text) {
      throw new Error('The service returned an empty response.');
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('The service returned an invalid response.');
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Request failed with status ${response.status}.`
      );
    }

    return data;
  };

  const parseStoredArray = (key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const normalizeValue = (value) => {
    if (
      !value ||
      typeof value !== 'string' ||
      value.trim().toLowerCase() === 'not specified' ||
      value.trim().toLowerCase() === 'not stated' ||
      value.trim().toLowerCase() === 'none'
    ) {
      return '';
    }

    return value.trim();
  };

  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const extractDateForPlanner = (value) => {
    if (!value) return getToday();

    // Already an HTML date value.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return value.trim();
    }

    // Try to extract a recognisable date from natural-language text.
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    // If only a time was extracted, don't pretend it is a date.
    return getToday();
  };

  const showError = (message) => {
    setErrorMessage(message);
  };

  const clearError = () => {
    setErrorMessage('');
  };

  // ---------------------------------------------------------------------------
  // WEB SPEECH INITIALISATION
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognizer = new SpeechRecognition();

    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'en-IN';

    recognizer.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        const transcript = event.results[i][0]?.transcript || '';

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);

      if (finalText.trim()) {
        setCapturedText((previous) =>
          previous
            ? `${previous} ${finalText.trim()}`
            : finalText.trim()
        );
      }
    };

    recognizer.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);

      if (event.error === 'not-allowed') {
        setErrorMessage(
          'Microphone access was denied. You can still type or paste the staff response.'
        );
      }
    };

    recognizer.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = recognizer;

    return () => {
      try {
        recognizer.stop();
      } catch {}

      recognizer.onresult = null;
      recognizer.onerror = null;
      recognizer.onend = null;

      recognitionRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // ESCAPE HANDLER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && fullscreenCard) {
        setFullscreenCard(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullscreenCard]);

  // ---------------------------------------------------------------------------
  // SPEECH
  // ---------------------------------------------------------------------------

  const speakText = (text) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !text
    ) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // RECORDING
  // ---------------------------------------------------------------------------

  const toggleRecording = () => {
    clearError();

    if (!recognitionRef.current) {
      setErrorMessage(
        'Live speech recognition is not supported in this browser. You can type or paste the response instead.'
      );
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {}

      setIsRecording(false);
      return;
    }

    setInterimText('');

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      setIsRecording(false);

      setErrorMessage(
        'Could not start live captioning. Please try again or enter the response manually.'
      );
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 1 -> STEP 2
  // ---------------------------------------------------------------------------

  const handleGeneratePlan = async () => {
    if (!goal.trim() || isProcessing) return;

    clearError();
    setIsProcessing(true);
    setApprovedPlan(false);

    try {
      const response = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'copilot_prepare',
          context,
          goal: goal.trim(),
          institution: institution.trim(),
          preferences: prefMode
        })
      });

      const data = await safeJson(response);

      if (!data || typeof data !== 'object') {
        throw new Error('No preparation plan was returned.');
      }

      setCopilotPlan(data);
      setCurrentStep(2);
    } catch (error) {
      console.error('Copilot preparation error:', error);

      showError(
        error?.message ||
          'Failed to generate the preparation plan. Please check connectivity and retry.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2 -> STEP 3
  // ---------------------------------------------------------------------------

  const handleApprovePlan = () => {
    setApprovedPlan(true);
    clearError();
    setCurrentStep(3);
  };

  // ---------------------------------------------------------------------------
  // STEP 4 -> STEP 5
  // ---------------------------------------------------------------------------

  const handleAnalyzeCaptured = async () => {
    if (!capturedText.trim() || isProcessing) return;

    clearError();
    setIsProcessing(true);

    try {
      // -----------------------------------------------------------------------
      // 1. Plain-language explanation
      // -----------------------------------------------------------------------

      const explainResponse = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'explain_plain_language',
          text: capturedText.trim(),
          context
        })
      });

      const explainData = await safeJson(explainResponse);

      // -----------------------------------------------------------------------
      // 2. Gap detection
      // -----------------------------------------------------------------------

      const gapResponse = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'detect_gaps',
          text: capturedText.trim(),
          context
        })
      });

      const gapData = await safeJson(gapResponse);

      const detectedGaps = Array.isArray(gapData?.gaps)
        ? gapData.gaps
        : [];

      setAnalysis(explainData);
      setGaps(detectedGaps);

      // -----------------------------------------------------------------------
      // IMPORTANT:
      // AI extraction is only a suggestion.
      // Do NOT automatically mark extracted values as confirmed.
      // -----------------------------------------------------------------------

      const locationValue = normalizeValue(
        explainData?.keyDetails?.locationOrCounter
      );

      const deadlineValue = normalizeValue(
        explainData?.keyDetails?.deadlineOrTime
      );

      const documentsValue = Array.isArray(
        explainData?.keyDetails?.documentsNeeded
      )
        ? explainData.keyDetails.documentsNeeded
            .filter(Boolean)
            .join(', ')
        : '';

      const actionValue = normalizeValue(
        explainData?.actionRequired
      );

      setConfirmationItems([
        {
          id: 'conf-1',
          label: 'Counter or Room Number',
          value: locationValue,
          status: 'unclear'
        },
        {
          id: 'conf-2',
          label: 'Deadline or Collection Date',
          value: deadlineValue,
          status: 'unclear'
        },
        {
          id: 'conf-3',
          label: 'Required Documents Checked',
          value: documentsValue,
          status: 'unclear'
        },
        {
          id: 'conf-4',
          label: 'Next Action Step',
          value: actionValue,
          status: 'unclear'
        }
      ]);

      setCurrentStep(5);
    } catch (error) {
      console.error('Response analysis error:', error);

      showError(
        error?.message ||
          'The response could not be analyzed. Please retry.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 6 -> STEP 7
  // ---------------------------------------------------------------------------

  const handleGenerateClarifications = async () => {
    if (isProcessing) return;

    clearError();
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate_clarifications',
          text: capturedText,
          context,
          specificGap:
            gaps.length > 0
              ? gaps
                  .map((gap) => gap?.issue)
                  .filter(Boolean)
                  .join('; ')
              : 'No critical gap was detected. Generate only if a useful confirmation question is appropriate.'
        })
      });

      const data = await safeJson(response);

      const clarifications = Array.isArray(data?.clarifications)
        ? data.clarifications
        : [];

      setClarificationCards(clarifications);

      if (clarifications[0]?.questionCard) {
        setSelectedClarification(clarifications[0].questionCard);
      } else {
        setSelectedClarification('');
      }

      setCurrentStep(7);
    } catch (error) {
      console.error('Clarification generation error:', error);

      showError(
        error?.message ||
          'Failed to generate clarification cards.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CONFIRMATION MATRIX
  // ---------------------------------------------------------------------------

  const updateConfirmationItem = (index, changes) => {
    setConfirmationItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...changes
            }
          : item
      )
    );
  };

  // ---------------------------------------------------------------------------
  // STEP 8 -> STEP 9
  // ---------------------------------------------------------------------------

  const handleBuildSummary = () => {
    clearError();

    const confirmed = confirmationItems.filter(
      (item) =>
        item.status === 'confirmed' &&
        item.value.trim()
    );

    const unresolved = confirmationItems.filter(
      (item) =>
        item.status === 'unclear' &&
        item.value.trim()
    );

    const notApplicable = confirmationItems.filter(
      (item) => item.status === 'na'
    );

    const confirmedFacts = confirmed.map(
      (item) => `${item.label}: ${item.value.trim()}`
    );

    const unresolvedQuestions = unresolved.map(
      (item) => `Please verify ${item.label}`
    );

    // N/A is not unresolved.
    const explicitDeadline = confirmationItems.find(
      (item) => item.id === 'conf-2'
    );

    const explicitDates =
      explicitDeadline?.status === 'confirmed' &&
      explicitDeadline?.value?.trim()
        ? [explicitDeadline.value.trim()]
        : [];

    const aiSuggestions = [
      'Obtain physical counter receipt before leaving desk',
      'Verify document verification stamp'
    ];

    setSummaryDraft({
      title: `${context}: ${goal}`,
      confirmedFacts,
      unresolvedQuestions,
      explicitDates,
      aiSuggestions
    });

    // -------------------------------------------------------------------------
    // Build follow-up task only from confirmed next action.
    // -------------------------------------------------------------------------

    const nextActionItem = confirmationItems.find(
      (item) => item.id === 'conf-4'
    );

    const deadlineItem = confirmationItems.find(
      (item) => item.id === 'conf-2'
    );

    const nextAction =
      nextActionItem?.status === 'confirmed'
        ? nextActionItem.value.trim()
        : '';

    const dueDate =
      deadlineItem?.status === 'confirmed'
        ? extractDateForPlanner(deadlineItem.value)
        : getToday();

    const category = context.includes('Hospital')
      ? 'Healthcare'
      : context.includes('Bank')
      ? 'Banking & Finance'
      : context.includes('College')
      ? 'Education'
      : context.includes('Government')
      ? 'Government'
      : context.includes('Transit')
      ? 'Travel'
      : 'Personal';

    if (nextAction) {
      setTasksToSchedule([
        {
          id: `TASK-${Date.now()}`,
          title: `${context}: ${nextAction}`,
          situation: `${institution || context} interaction`,
          category,
          type: 'Action Step',
          nextAction,
          dueDate,
          priority: 'High',
          status: 'Planned',
          approved: true,
          source: 'Recovery Workflow',
          requiresUserVerification: true
        }
      ]);
    } else {
      setTasksToSchedule([]);
    }

    setCurrentStep(9);
  };

  // ---------------------------------------------------------------------------
  // STEP 10: SAVE EVERYTHING
  // ---------------------------------------------------------------------------

  const handleSaveAll = () => {
    if (isSessionSaved) return;

    clearError();

    try {
      const approvedTasks = tasksToSchedule.filter(
        (task) => task.approved
      );

      const historyId = `AI-STUDIO-${Date.now()}`;

      const historyItem = {
        id: historyId,
        domain: context,
        intent: goal,
        title:
          summaryDraft.title ||
          `${context} AI Session`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: approvedTasks.length
          ? 'Follow-Up Scheduled'
          : 'Completed',

        // Important: this session was confirmed by the user,
        // not verified by staff.
        verifiedByStaff: false,
        userReviewed: true,

        entities: {
          'Confirmed Facts':
            summaryDraft.confirmedFacts.join(' | ') ||
            'None',

          'Unresolved Details':
            summaryDraft.unresolvedQuestions.join(' | ') ||
            'None',

          'Captured Response':
            capturedText
              ? capturedText.slice(0, 250)
              : 'None'
        }
      };

      // -----------------------------------------------------------------------
      // 1. Request History
      // -----------------------------------------------------------------------

      const existingHistory =
        parseStoredArray('signmitra_history');

      localStorage.setItem(
        'signmitra_history',
        JSON.stringify([
          historyItem,
          ...existingHistory
        ])
      );

      // -----------------------------------------------------------------------
      // 2. Follow-Up Planner
      // -----------------------------------------------------------------------

      if (approvedTasks.length > 0) {
        const existingTasks =
          parseStoredArray('signmitra_followups');

        localStorage.setItem(
          'signmitra_followups',
          JSON.stringify([
            ...approvedTasks,
            ...existingTasks
          ])
        );
      }

      // -----------------------------------------------------------------------
      // 3. Dedicated AI Sessions Ledger
      // -----------------------------------------------------------------------

      const sessionRecord = {
        id: historyId,
        timestamp: Date.now(),

        context,
        goal,
        institution,
        communicationPreference: prefMode,

        preparationPlan: copilotPlan,
        preparationPlanApproved: approvedPlan,

        capturedText,

        analysis,
        gaps,

        clarificationCards,

        confirmedFacts:
          summaryDraft.confirmedFacts,

        unresolvedQuestions:
          summaryDraft.unresolvedQuestions,

        aiSuggestions:
          summaryDraft.aiSuggestions,

        savedTasks: approvedTasks,

        userReviewed: true,
        verifiedByStaff: false,

        source: 'Recovery Workflow'
      };

      const existingSessions =
        parseStoredArray('signmitra_ai_sessions');

      localStorage.setItem(
        'signmitra_ai_sessions',
        JSON.stringify([
          sessionRecord,
          ...existingSessions
        ])
      );

      setIsSessionSaved(true);

      if (onCompleteSession) {
        onCompleteSession(sessionRecord);
      }
    } catch (error) {
      console.error('Recovery Workflow save error:', error);

      showError(
        'The session could not be saved locally. Please try again.'
      );
    }
  };

  // ---------------------------------------------------------------------------
  // NEW SESSION
  // ---------------------------------------------------------------------------

  const handleStartNewSession = () => {
    setCurrentStep(1);
    setIsSessionSaved(false);
    setErrorMessage('');

    setCopilotPlan(null);
    setApprovedPlan(false);

    setCapturedText('');
    setInterimText('');
    setIsRecording(false);

    setAnalysis(null);
    setGaps([]);

    setClarificationCards([]);
    setSelectedClarification('');
    setFullscreenCard(null);

    setConfirmationItems([
      {
        id: 'conf-1',
        label: 'Counter or Room Number',
        value: '',
        status: 'unclear'
      },
      {
        id: 'conf-2',
        label: 'Deadline or Collection Date',
        value: '',
        status: 'unclear'
      },
      {
        id: 'conf-3',
        label: 'Required Documents Checked',
        value: '',
        status: 'unclear'
      },
      {
        id: 'conf-4',
        label: 'Next Action Step',
        value: '',
        status: 'unclear'
      }
    ]);

    setSummaryDraft({
      title: '',
      confirmedFacts: [],
      unresolvedQuestions: [],
      explicitDates: [],
      aiSuggestions: []
    });

    setTasksToSchedule([]);
  };

  // ---------------------------------------------------------------------------
  // STEP TITLES
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* --------------------------------------------------------------------- */}
      {/* ERROR MESSAGE                                                         */}
      {/* --------------------------------------------------------------------- */}

      {errorMessage && (
        <div
          className={`p-4 rounded-xl border-2 border-red-500/40 bg-red-500/10 flex items-start gap-3`}
          role="alert"
        >
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />

          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wide text-red-700 dark:text-red-300">
              Recovery Workflow Error
            </p>

            <p className="text-xs font-medium mt-1 text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={clearError}
            className="p-1 rounded-lg hover:bg-red-500/10"
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 10-STEP PROGRESS                                                      */}
      {/* --------------------------------------------------------------------- */}

      <div
        className={`p-4 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm overflow-x-auto`}
      >
        <div className="flex items-center min-w-[700px] justify-between text-xs font-mono">
          {STEP_TITLES.map((title, idx) => {
            const stepNum = idx + 1;
            const isCurrent = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <button
                key={title}
                type="button"
                onClick={() =>
                  isCompleted && setCurrentStep(stepNum)
                }
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
                <span className="hidden sm:inline">
                  {title.split('. ')[1]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: START                                                            */}
      {/* ========================================================================= */}

      {currentStep === 1 && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-5 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 1 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Define Interaction Context
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
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
                onChange={(event) =>
                  setContext(event.target.value)
                }
                className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone}`}
              >
                <option value="College Office">
                  College Office / Academic
                </option>

                <option value="Bank Branch">
                  Bank Branch / Finance
                </option>

                <option value="Hospital OPD">
                  Hospital OPD / Healthcare
                </option>

                <option value="Public Transit">
                  Public Transit / Railway
                </option>

                <option value="Government Office">
                  Government Office / Public Services
                </option>

                <option value="General Interaction">
                  Other Service Interaction
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                Institution or Facility Name (Optional)
              </label>

              <input
                type="text"
                value={institution}
                onChange={(event) =>
                  setInstitution(event.target.value)
                }
                placeholder="e.g. City General Hospital, SBI Main Branch..."
                className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
              Your Communication Goal
            </label>

            <textarea
              value={goal}
              onChange={(event) =>
                setGoal(event.target.value)
              }
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
              onChange={(event) =>
                setPrefMode(event.target.value)
              }
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone}`}
            >
              <option value="Visual Cards + Written Replies">
                Visual Cards + Written Replies
              </option>

              <option value="Large Captions + Spoken Output">
                Large Captions + Spoken Text-to-Speech
              </option>

              <option value="Step-by-Step Written Breakdown">
                Step-by-Step Written Breakdown
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={!goal.trim() || isProcessing}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 transition-all ${
              goal.trim() && !isProcessing
                ? `${accentSolid} hover:opacity-90`
                : `opacity-40 cursor-not-allowed border ${borderTone}`
            }`}
          >
            {isProcessing ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}

            <span>
              {isProcessing
                ? 'Generating Copilot Plan...'
                : 'Generate Preparation Plan →'}
            </span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PREPARE                                                          */}
      {/* ========================================================================= */}

      {currentStep === 2 && copilotPlan && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 2 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Interaction Preparation Plan
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              Review recommended documents, checklist tasks, and opening communication cards before approaching the counter.
            </p>
          </header>

          <div
            className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
              <FileText className="w-4 h-4 text-purple-500" />
              <span>
                Recommended Documents to Carry [AI Suggestion]:
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Array.isArray(copilotPlan.suggestedDocuments) &&
                copilotPlan.suggestedDocuments.map(
                  (doc, index) => (
                    <span
                      key={`${doc}-${index}`}
                      className={`px-3 py-1 rounded-md text-xs font-bold border ${borderTone} ${cardBg}`}
                    >
                      📄 {doc}
                    </span>
                  )
                )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase opacity-70">
              Preparation Tasks:
            </span>

            <div className="space-y-2">
              {Array.isArray(copilotPlan.checklist) &&
                copilotPlan.checklist.map((item, index) => (
                  <div
                    key={item?.id || `check-${index}`}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${cardInnerBg} ${borderTone}`}
                  >
                    <span className="text-green-500 font-bold">
                      ✓
                    </span>

                    <span className="text-xs font-bold">
                      {item?.task || 'Preparation item'}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase opacity-70">
              Suggested Cards to Show Staff:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.isArray(copilotPlan.suggestedCards) &&
                copilotPlan.suggestedCards.map(
                  (card, index) => (
                    <div
                      key={`${card}-${index}`}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${cardInnerBg} ${borderTone}`}
                    >
                      <span>"{card}"</span>

                      <button
                        type="button"
                        onClick={() => speakText(card)}
                        className="p-1 rounded opacity-60 hover:opacity-100"
                        title="Speak"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleApprovePlan}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Approve Plan & Proceed to Communicate →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3 & 4                                                              */}
      {/* ========================================================================= */}

      {(currentStep === 3 || currentStep === 4) && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              {currentStep === 3
                ? 'Step 3 of 10: Counter Communication'
                : 'Step 4 of 10: Capture Staff Response'}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {currentStep === 3
                ? 'Present Message & Receive Answer'
                : 'Record Staff Response'}
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              Capture what staff said or wrote so the cognitive engine can check for missing details.
            </p>
          </header>

          {currentStep === 3 && (
            <div
              className={`p-5 rounded-2xl border-4 ${borderTone} ${cardInnerBg} space-y-3 text-center`}
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block">
                Show this opening card across the counter:
              </span>

              <p className="text-xl sm:text-2xl font-black">
                "Hello, I am here regarding {goal}. Please speak into my phone or write down your reply."
              </p>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      `Hello, I am here regarding ${goal}. Please speak into my phone or write down your reply.`
                    )
                  }
                  className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${cardBg} ${borderTone}`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak Aloud</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFullscreenCard(
                      `Hello, I am here regarding ${goal}. Please speak into my phone or write down your reply.`
                    )
                  }
                  className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${cardBg} ${borderTone}`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Giant Fullscreen</span>
                </button>
              </div>
            </div>
          )}

          <div
            className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4`}
          >
            <div className="flex justify-between items-center gap-3">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                Staff Response / Counter Instructions
              </label>

              <button
                type="button"
                onClick={toggleRecording}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : `${cardInnerBg} border ${borderTone} hover:border-[#655A7C]`
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}

                <span>
                  {isRecording
                    ? 'Listening... Tap to Stop'
                    : 'Live Caption Staff'}
                </span>
              </button>
            </div>

            <textarea
              value={capturedText}
              onChange={(event) =>
                setCapturedText(event.target.value)
              }
              placeholder="Paste or type what staff wrote, or tap 'Live Caption Staff' above..."
              rows={4}
              className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none ${cardInnerBg} ${borderTone} resize-none`}
            />

            {isRecording && (
              <p className="text-xs font-mono italic text-red-500 animate-pulse">
                Live: {interimText || 'Listening...'}
              </p>
            )}

            <div className="pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block mb-1">
                Or fill with realistic staff response:
              </span>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCapturedText(
                      'Take this requisition slip to Counter 4 in the Administrative Wing before 2:30 PM on Thursday. You will need your student ID card and original fee receipt.'
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cardInnerBg} ${borderTone}`}
                >
                  College Desk Reply
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCapturedText(
                      'Your account needs KYC update. Submit Form 12B along with self-attested identity proof at Window 2. Processing takes 48 hours.'
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cardInnerBg} ${borderTone}`}
                >
                  Bank KYC Reply
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCapturedText(
                      'Take this green card to the 1st floor lab for a fasting blood test tomorrow at 8:00 AM. Bring reports back to Room 108.'
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cardInnerBg} ${borderTone}`}
                >
                  Hospital OPD Reply
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                setCurrentStep(currentStep - 1)
              }
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleAnalyzeCaptured}
              disabled={!capturedText.trim() || isProcessing}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${
                capturedText.trim() && !isProcessing
                  ? `${accentSolid} hover:opacity-90`
                  : `opacity-40 cursor-not-allowed border ${borderTone}`
              }`}
            >
              {isProcessing ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}

              <span>
                {isProcessing
                  ? 'Analyzing Response...'
                  : 'Understand & Detect Gaps →'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: UNDERSTAND                                                       */}
      {/* ========================================================================= */}

      {currentStep === 5 && analysis && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 5 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Plain-Language Understanding
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              Here is what the staff member's instructions mean in simple terms.
            </p>
          </header>

          <div
            className={`p-6 rounded-2xl border-4 ${borderTone} ${cardInnerBg} shadow-sm space-y-3`}
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">
              WHAT THIS MEANS:
            </span>

            <p className="text-lg sm:text-2xl font-black leading-snug">
              {analysis.plainLanguageSummary ||
                'No plain-language summary was returned.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}
            >
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                Location / Counter
              </span>

              <span className="font-black text-sm block mt-1">
                {analysis.keyDetails?.locationOrCounter ||
                  'Not stated'}
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}
            >
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                Deadline / Time
              </span>

              <span className="font-black text-sm block mt-1">
                {analysis.keyDetails?.deadlineOrTime ||
                  'Not stated'}
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg}`}
            >
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                Action Item
              </span>

              <span className="font-black text-sm block mt-1">
                {analysis.actionRequired || 'None'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>
                Inspect Communication Gaps →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: DETECT GAPS                                                      */}
      {/* ========================================================================= */}

      {currentStep === 6 && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 6 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Communication Gap Detector
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              The cognitive engine inspected the staff response for missing deadlines, documents, or ambiguous locations.
            </p>
          </header>

          <div className="space-y-3">
            {gaps.length === 0 ? (
              <div
                className={`p-6 rounded-xl border text-center ${cardInnerBg} ${borderTone}`}
              >
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />

                <h4 className="font-black text-sm uppercase">
                  No Critical Gaps Detected
                </h4>

                <p className="text-xs opacity-70 mt-1">
                  All key parameters appear to be present.
                </p>
              </div>
            ) : (
              gaps.map((gap, index) => (
                <div
                  key={gap?.id || index}
                  className="p-4 rounded-xl border-2 border-orange-500/40 bg-orange-500/10 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-mono font-bold">
                    <span className="text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      {gap?.label || 'Communication Gap'}
                    </span>

                    {gap?.quote && (
                      <span className="opacity-60 text-[10px] font-normal text-right">
                        Source: "{gap.quote}"
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-orange-950 dark:text-orange-200">
                    {gap?.issue || 'Additional information may be required.'}
                  </p>

                  {gap?.suggestion && (
                    <div
                      className={`p-2.5 rounded-lg border ${borderTone} ${cardInnerBg} text-xs flex items-center justify-between gap-3`}
                    >
                      <span className="font-bold">
                        Clarification Card: "{gap.suggestion}"
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setFullscreenCard(gap.suggestion)
                        }
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold border uppercase shrink-0"
                      >
                        Show Card
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleGenerateClarifications}
              disabled={isProcessing}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${
                isProcessing
                  ? 'opacity-50 cursor-not-allowed'
                  : `${accentSolid} hover:opacity-90`
              }`}
            >
              {isProcessing && (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              )}

              <span>
                {isProcessing
                  ? 'Generating Cards...'
                  : 'Generate Clarification Cards →'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: CLARIFY                                                          */}
      {/* ========================================================================= */}

      {currentStep === 7 && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 7 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Clarification Cards
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              Pick or edit a high-contrast question card to show the staff member if anything is still unclear.
            </p>
          </header>

          {clarificationCards.length === 0 ? (
            <div
              className={`p-6 rounded-xl border text-center ${cardInnerBg} ${borderTone}`}
            >
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />

              <h4 className="font-black text-sm uppercase">
                No Additional Clarification Card Returned
              </h4>

              <p className="text-xs opacity-70 mt-1">
                You can continue to the confirmation step and review the extracted details yourself.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clarificationCards.map((card, index) => (
                <div
                  key={card?.id || index}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedClarification === card?.questionCard
                      ? `ring-2 ring-[#655A7C] ${cardInnerBg}`
                      : `${cardInnerBg} ${borderTone}`
                  } space-y-3`}
                >
                  <div className="flex justify-between items-center gap-2 text-xs font-mono font-bold">
                    <span className="opacity-70">
                      {card?.title || 'Clarification'}
                    </span>

                    {card?.urgency && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${accentSolid}`}
                      >
                        {card.urgency}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-black">
                    "{card?.questionCard || 'Please clarify this detail.'}"
                  </p>

                  {card?.contextNote && (
                    <p className="text-[11px] opacity-60">
                      {card.contextNote}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClarification(
                          card?.questionCard || ''
                        );
                        setFullscreenCard(
                          card?.questionCard || ''
                        );
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase border ${borderTone} ${cardBg} hover:opacity-80 flex items-center justify-center gap-1`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Show Fullscreen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        speakText(card?.questionCard || '')
                      }
                      className={`p-2 rounded-lg text-xs font-mono font-bold uppercase border ${borderTone} ${cardBg} hover:opacity-80`}
                      title="Speak Aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(8)}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <UserCheck className="w-4 h-4" />
              <span>
                Proceed to User Confirmation →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 8: CONFIRM                                                          */}
      {/* ========================================================================= */}

      {currentStep === 8 && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 8 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Review & Confirm Parameters
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              AI-extracted details are suggestions only. Explicitly mark each detail as Confirmed, Still Unclear, or Not Applicable.
            </p>
          </header>

          <div
            className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-medium`}
          >
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />

              <span>
                Only details you explicitly mark as <strong>Confirmed</strong>
                will be written to the confirmed-facts section of the session record.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {confirmationItems.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-3`}
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {item.label}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfirmationItem(index, {
                          status: 'confirmed'
                        })
                      }
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        item.status === 'confirmed'
                          ? 'bg-green-600 text-white'
                          : `${cardBg} border ${borderTone}`
                      }`}
                    >
                      ✓ Confirmed
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateConfirmationItem(index, {
                          status: 'unclear'
                        })
                      }
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        item.status === 'unclear'
                          ? 'bg-orange-500 text-white'
                          : `${cardBg} border ${borderTone}`
                      }`}
                    >
                      ⚠️ Still Unclear
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateConfirmationItem(index, {
                          status: 'na'
                        })
                      }
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        item.status === 'na'
                          ? accentSolid
                          : `${cardBg} border ${borderTone}`
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={item.value}
                  onChange={(event) =>
                    updateConfirmationItem(index, {
                      value: event.target.value,
                      // Editing an extracted value should require
                      // an explicit confirmation again.
                      status: 'unclear'
                    })
                  }
                  placeholder={`Enter or edit ${item.label.toLowerCase()}...`}
                  className={`w-full p-2.5 rounded-lg border text-sm font-bold outline-none ${cardBg} ${borderTone}`}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(7)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleBuildSummary}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>
                Build Structured Summary →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 9: SUMMARIZE                                                        */}
      {/* ========================================================================= */}

      {currentStep === 9 && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 9 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Structured Interaction Summary
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              Review the session ledger. User-confirmed facts, unresolved items, and AI suggestions are kept separate.
            </p>
          </header>

          <div
            className={`p-5 rounded-xl border-2 border-green-500/30 bg-green-500/10 space-y-2`}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>User-Confirmed Facts:</span>
            </div>

            {summaryDraft.confirmedFacts.length === 0 ? (
              <p className="text-xs font-bold opacity-70">
                No facts were explicitly confirmed.
              </p>
            ) : (
              summaryDraft.confirmedFacts.map(
                (fact, index) => (
                  <p
                    key={index}
                    className="text-xs font-bold text-green-950 dark:text-green-100"
                  >
                    • {fact}
                  </p>
                )
              )
            )}
          </div>

          {summaryDraft.unresolvedQuestions.length > 0 && (
            <div
              className={`p-5 rounded-xl border-2 border-orange-500/30 bg-orange-500/10 space-y-2`}
            >
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-orange-700 dark:text-orange-300">
                <AlertTriangle className="w-4 h-4" />

                <span>
                  Unresolved Items (Requires Follow-Up):
                </span>
              </div>

              {summaryDraft.unresolvedQuestions.map(
                (question, index) => (
                  <p
                    key={index}
                    className="text-xs font-bold text-orange-950 dark:text-orange-100"
                  >
                    • {question}
                  </p>
                )
              )}
            </div>
          )}

          <div
            className={`p-5 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase opacity-70">
              <Sparkles className="w-4 h-4" />
              <span>AI Suggestions — Not User Confirmed:</span>
            </div>

            {summaryDraft.aiSuggestions.map(
              (suggestion, index) => (
                <p
                  key={index}
                  className="text-xs font-bold opacity-80"
                >
                  • {suggestion}
                </p>
              )
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(8)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(10)}
              className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <span>
                Approve Tasks & Finalize Follow-Up →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 10: FOLLOW UP                                                       */}
      {/* ========================================================================= */}

      {currentStep === 10 && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-6 shadow-sm`}
        >
          <header>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              Step 10 of 10
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Schedule Follow-Up Actions
            </h2>

            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSecondary}`}
            >
              Review the proposed action before saving it to the local Planner and Request History.
            </p>
          </header>

          {tasksToSchedule.length === 0 ? (
            <div
              className={`p-6 rounded-xl border text-center ${cardInnerBg} ${borderTone}`}
            >
              <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-50" />

              <h4 className="font-black text-sm uppercase">
                No Follow-Up Task Was Generated
              </h4>

              <p className="text-xs opacity-70 mt-1">
                No next action was explicitly confirmed. You can save the session without creating a planner task.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksToSchedule.map((task, index) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-3`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(task.approved)}
                        onChange={(event) => {
                          const updated = [...tasksToSchedule];

                          updated[index] = {
                            ...updated[index],
                            approved: event.target.checked
                          };

                          setTasksToSchedule(updated);
                        }}
                        className="w-4 h-4 rounded"
                      />

                      <span className="text-xs font-mono font-bold uppercase">
                        {task.category} Task
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${accentSolid}`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <input
                    type="text"
                    value={task.nextAction}
                    onChange={(event) => {
                      const updated = [...tasksToSchedule];

                      updated[index] = {
                        ...updated[index],
                        nextAction: event.target.value,
                        title: `${context}: ${event.target.value}`
                      };

                      setTasksToSchedule(updated);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-sm font-bold outline-none ${cardBg} ${borderTone}`}
                  />

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="opacity-60">
                      Target Due Date:
                    </span>

                    <input
                      type="date"
                      value={task.dueDate || getToday()}
                      onChange={(event) => {
                        const updated = [...tasksToSchedule];

                        updated[index] = {
                          ...updated[index],
                          dueDate: event.target.value
                        };

                        setTasksToSchedule(updated);
                      }}
                      className={`p-1.5 rounded border text-xs font-mono font-bold outline-none ${cardBg} ${borderTone}`}
                    />
                  </div>

                  <div
                    className={`text-[10px] font-mono font-bold uppercase opacity-50`}
                  >
                    Source: Recovery Workflow · User review required
                  </div>
                </div>
              ))}
            </div>
          )}

          {isSessionSaved ? (
            <div
              className={`p-5 rounded-xl border border-green-500 bg-green-500/10 text-green-700 dark:text-green-300 font-bold text-xs space-y-2`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />

                <span className="text-sm">
                  Session Successfully Saved
                </span>
              </div>

              <p className="opacity-90">
                The reviewed session is available in Request History, and approved action tasks are available in the Follow-Up Planner.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSaveAll}
              className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
            >
              <Save className="w-4 h-4" />

              <span>
                Save to Follow-Up Planner & Request History
              </span>
            </button>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(9)}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-xs uppercase`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleStartNewSession}
              className={`py-3.5 px-5 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase flex items-center gap-1.5`}
            >
              <RefreshCcw className="w-3.5 h-3.5" />

              <span>
                Start New Session
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN CARD                                                          */}
      {/* ========================================================================= */}

      {fullscreenCard && (
        <div
          className={`fixed inset-0 z-[130] flex flex-col justify-between p-6 sm:p-12 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}
          role="dialog"
          aria-modal="true"
          aria-label="Communication card"
        >
          <div className="flex justify-between items-center gap-4">
            <span
              className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg}`}
            >
              COMMUNICATION QUESTION CARD
            </span>

            <button
              type="button"
              onClick={() => setFullscreenCard(null)}
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${accentSolid} font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all`}
            >
              Close Card [Esc]
            </button>
          </div>

          <div className="text-center my-auto px-4 max-w-4xl mx-auto w-full">
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

            <div className="flex justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => speakText(fullscreenCard)}
                className={`px-5 py-3 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase flex items-center gap-2`}
              >
                <Volume2 className="w-4 h-4" />
                Speak Aloud
              </button>
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