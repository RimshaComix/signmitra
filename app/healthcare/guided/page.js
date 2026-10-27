'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sun,
  Moon,
  Type,
  Check,
  X,
  Share2,
  Printer,
  Volume2,
  Maximize2,
  Minimize2,
  Send,
  ShieldAlert,
  Calendar,
  FileText,
  FlaskConical,
  Pill,
  Accessibility,
  Stethoscope,
  MessageSquare,
  Clock,
  ChevronRight,
  CheckSquare,
  Sparkles,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

/*
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2   2. Amethyst: #AB92BF   3. Dolphin: #655A7C
*/

/* -------------------------------------------------------------------------- */
/* Switch this to true once /api/ai-studio is wired in aiPolishCard() below.   */
/* While false, everything runs on the deterministic templates.               */
/* -------------------------------------------------------------------------- */
const AI_POLISH_ENABLED = false;

async function aiPolishCard(text) {
  // TODO: call your existing AI Studio route here and return the simplified text.
  // Rules: keep every name, number and date unchanged; on any failure return `text`.
  return text;
}

/* ------------------------------- helpers ---------------------------------- */

const INTRO = 'Hello. I am Deaf or hard of hearing.';
const CLOSING = 'Please write your answer on this screen or on paper.';
const OTHER = 'Other';

/* Neutral replies only: none of these claim a booking, report, fee or clinical fact. */
const NEUTRAL_STAFF_REPLIES = [
  'I understand your request.',
  'Please wait. I will check.',
  'I need to ask another staff member.',
  'I will write the answer on paper.'
];

/* Health details for these intents are never saved locally or sent to the server. */
const SENSITIVE_INTENTS = ['explain_symptoms', 'medicine_query'];

/* Saved requests older than this are deleted from this device. */
const HISTORY_DAYS = 30;

const compose = (main, lines = []) =>
  [INTRO, main, ...lines.filter(Boolean).map((l) => `• ${l}`), CLOSING].join('\n');

const fmtDate = (d) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const resolveChip = (label) => {
  const d = new Date();
  if (label === 'Today') return fmtDate(d);
  if (label === 'Tomorrow') {
    d.setDate(d.getDate() + 1);
    return fmtDate(d);
  }
  return label;
};

const dateInputToText = (v) => (v ? fmtDate(new Date(`${v}T00:00:00`)) : '');

const to12h = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
};

/* Basic keyword heuristic (no AI). It catches common vague phrases only.
   It can miss unclear replies and cannot prove a reply is understandable. */
const CLOCK_RE = /\b\d{1,2}(:\d{2})?\s?(am|pm)\b|\b\d{1,2}:\d{2}\b/i;
const VAGUE_TIME_RE = /\b(tomorrow|today|tonight|morning|afternoon|evening|later|soon|next week|next month|some time|few days|in a while)\b/i;
const PLACE_NUM_RE = /\b(counter|desk|room|window|cabin|cubicle|floor|ward)\s*#?\s*\d+\b|\b#?[A-Z]{2,5}-\d+\b/i;
const VAGUE_PLACE_RE = /\b(that|the|this|other)\s+(counter|desk|window|room|department|office|cabin)\b|\bover there\b|\bdownstairs\b|\bupstairs\b|\bmain desk\b/i;
const AMOUNT_RE = /(₹|rs\.?|inr)\s?\d|\d+\s?(rupees|rs\b)/i;
const VAGUE_FEE_RE = /\b(nominal|small fee|some charges|charges apply|minimal|little fee|small charge)\b/i;

const findVague = (text) => {
  const issues = [];
  if (VAGUE_TIME_RE.test(text) && !CLOCK_RE.test(text)) issues.push('time');
  if (VAGUE_PLACE_RE.test(text) && !PLACE_NUM_RE.test(text)) issues.push('place');
  if (VAGUE_FEE_RE.test(text) && !AMOUNT_RE.test(text)) issues.push('fee');
  return issues;
};

/* ------------------------------ need tiles --------------------------------- */

const NEEDS = [
  {
    id: 'appointment',
    title: 'Appointment',
    hint: 'Book, change or cancel',
    icon: Calendar,
    options: [
      { label: 'Book a new appointment', intent: 'appointment_request' },
      { label: 'Change my appointment', intent: 'reschedule_cancel_appointment', preset: { actionType: 'Reschedule' } },
      { label: 'Cancel my appointment', intent: 'reschedule_cancel_appointment', preset: { actionType: 'Cancel' } }
    ]
  },
  { id: 'reports', title: 'Reports & documents', hint: 'Get a copy of my report', icon: FileText, intent: 'medical_reports_request' },
  { id: 'tests', title: 'Tests & scans', hint: 'Blood test, scan, ECG', icon: FlaskConical, intent: 'diagnostic_test_request' },
  { id: 'medicine', title: 'Medicine', hint: 'Refill or ask at pharmacy', icon: Pill, intent: 'medicine_query' },
  { id: 'help', title: 'Help communicating', hint: 'Interpreter or written notes', icon: Accessibility, intent: 'communication_assist_request' },
  { id: 'symptoms', title: 'Pain or symptoms', hint: 'Tell the nurse how I feel', icon: Stethoscope, intent: 'explain_symptoms' },
  { id: 'other', title: 'Something else', hint: 'Write my own request', icon: MessageSquare, intent: 'custom_request' }
];

/* -------------------------------- flows ------------------------------------ */

const FLOWS = {
  appointment_request: {
    title: 'Book a new appointment',
    questions: [
      { id: 'doctor', label: 'Which doctor?', type: 'choice', required: true, allowOther: true, options: ['General physician', 'Dentist', 'Cardiologist', 'Orthopedic', 'Pediatrician'] },
      { id: 'date', label: 'Which day?', type: 'when', required: true, chips: ['Today', 'Tomorrow', 'This week'] },
      { id: 'time', label: 'Preferred time (optional)', type: 'choice', options: ['Morning', 'Afternoon', 'Evening', 'Any time'] },
      { id: 'reason', label: 'Reason (optional)', type: 'text', placeholder: 'e.g., fever, check-up' }
    ],
    card: (a) =>
      compose('I would like to book an appointment.', [
        `Doctor: ${a.doctor}`,
        a.date && `Day: ${a.date}`,
        a.time && a.time !== 'Any time' && `Time: ${a.time}`,
        a.reason && `Reason: ${a.reason}`
      ]),
    summary: (a, r) => `Appointment request for ${a.doctor}. Staff reported: ${r}`
  },

  reschedule_cancel_appointment: {
    title: 'Change or cancel my appointment',
    questions: [
      { id: 'appointmentRef', label: 'Which doctor or booking?', type: 'text', required: true, placeholder: 'e.g., Dr. Ramanathan or #APT-904', recentKey: 'appointmentRef', quick: ["I do not remember the doctor's name"] },
      { id: 'newDate', label: 'New day (optional)', type: 'when', chips: ['Tomorrow', 'This week', 'Earliest available'], showIf: (a) => a.actionType === 'Reschedule' },
      { id: 'reason', label: 'Reason (optional)', type: 'choice', options: ['Personal schedule conflict', 'Travel problem', 'Feeling better', 'Doctor unavailable'], allowOther: true }
    ],
    card: (a) =>
      compose(a.actionType === 'Cancel' ? 'I would like to cancel my appointment.' : 'I would like to change my appointment.', [
        `Doctor / booking: ${a.appointmentRef}`,
        a.actionType === 'Reschedule' && `New day: ${a.newDate || 'Earliest available'}`,
        a.reason && `Reason: ${a.reason}`,
        'Please give me written confirmation.'
      ]),
    summary: (a, r) => `Appointment request noted for ${a.appointmentRef}. Staff reported: ${r}`
  },

  medical_reports_request: {
    title: 'Get a medical report',
    questions: [
      { id: 'recordType', label: 'Which report?', type: 'choice', required: true, allowOther: true, options: ['Blood test report', 'X-Ray / MRI / Scan', 'Discharge summary', 'Prescription copy', 'Final hospital bill'] },
      { id: 'visitDate', label: 'When was the visit or test? (optional)', type: 'when', chips: ['Today', 'This week', 'Last month', 'I do not remember'] },
      { id: 'deliveryMode', label: 'How should I get it? (optional)', type: 'choice', options: ['Printed copy', 'Send to my phone or email', 'Portal download'] }
    ],
    card: (a) =>
      compose('I would like a copy of my report.', [
        `Report: ${a.recordType}`,
        a.visitDate && `Visit / test date: ${a.visitDate}`,
        a.deliveryMode && `I would like: ${a.deliveryMode}`,
        'Please tell me where to collect it.'
      ]),
    summary: (a, r) => `Report request for ${a.recordType}. Staff reported: ${r}`
  },

  diagnostic_test_request: {
    title: 'Test or scan',
    questions: [
      { id: 'testType', label: 'Which test?', type: 'choice', required: true, allowOther: true, options: ['Blood test (CBC / lipid)', 'Urine test', 'Ultrasound / Chest X-ray', 'ECG / heart test', 'Blood sugar / HbA1c'] },
      { id: 'fastingStatus', label: 'Have I been fasting? (my own answer, optional)', type: 'choice', options: ['Yes, 8+ hours', 'Yes, 12+ hours', 'No, I have eaten', 'Not needed for this test'] },
      { id: 'referralDoctor', label: "Doctor's name (optional)", type: 'text', placeholder: 'e.g., Dr. S. Ramanathan', recentKey: 'referralDoctor' }
    ],
    card: (a) =>
      compose('I have a test prescribed by my doctor.', [
        `Test: ${a.testType}`,
        a.referralDoctor && `Doctor: ${a.referralDoctor}`,
        a.fastingStatus && `Fasting (my answer): ${a.fastingStatus}`,
        'Please tell me if the test can go ahead, and where to go.'
      ]),
    summary: (a, r) => `Test request for ${a.testType}. Staff reported: ${r}`
  },

  communication_assist_request: {
    title: 'Help communicating',
    questions: [
      { id: 'assistanceType', label: 'What help do I need?', type: 'choice', required: true, options: ['Please write everything down', 'In-person sign language interpreter', 'Video interpreter (online)', 'Let my family member come inside'] },
      { id: 'urgency', label: 'How urgent? (optional)', type: 'choice', options: ['Routine visit', 'Urgent visit', 'Emergency'] },
      { id: 'specialNotes', label: 'Note for staff (optional)', type: 'text', placeholder: 'e.g., I lip-read a little. Please face me.' }
    ],
    card: (a) =>
      compose('I need help to communicate.', [
        `Help needed: ${a.assistanceType}`,
        a.urgency && `Urgency: ${a.urgency}`,
        a.specialNotes || 'Please do not expect spoken answers. Use writing or gestures.'
      ]),
    summary: (a, r) => `Communication help requested (${a.assistanceType}). Staff reported: ${r}`
  },

  explain_symptoms: {
    title: 'Pain or symptoms',
    questions: [
      { id: 'symptom', label: 'What is the main problem?', type: 'choice', required: true, allowOther: true, options: ['Chest pain / breathing trouble', 'Severe headache', 'Stomach pain', 'High fever', 'Joint pain / swelling'] },
      { id: 'duration', label: 'Since when? (optional)', type: 'choice', options: ['A few hours', '1-2 days', 'More than a week', 'It keeps coming back'] },
      { id: 'severity', label: 'How strong is the pain? (optional)', type: 'choice', options: ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-8)', 'Extreme (9-10)'] }
    ],
    card: (a) =>
      compose('I want to tell you how I feel.', [
        `Problem: ${a.symptom}`,
        a.duration && `Since: ${a.duration}`,
        a.severity && `Pain level: ${a.severity}`,
        'Please tell a nurse or doctor.'
      ]),
    summary: (a, r) => `Symptoms shared with staff (${a.symptom}). Staff reported: ${r}`
  },

  medicine_query: {
    title: 'Medicine and pharmacy',
    questions: [
      { id: 'requestType', label: 'What do I need?', type: 'choice', required: true, options: ['Refill my medicine', 'Ask for a generic alternative', 'Ask how to take my medicine', 'Collect pre-ordered medicine'] },
      { id: 'prescriptionRef', label: 'Medicine name or prescription ID (optional)', type: 'text', placeholder: 'e.g., Albuterol inhaler or Rx-2026' },
      { id: 'quantity', label: 'How long? (optional)', type: 'choice', options: ['1 month', '2 months', '3 months', 'Single item only'] }
    ],
    card: (a) =>
      compose('I have a question at the pharmacy.', [
        `I need: ${a.requestType}`,
        a.prescriptionRef && `Medicine / prescription: ${a.prescriptionRef}`,
        a.quantity && `Supply: ${a.quantity}`,
        'Please write the instructions on the packet or on paper.'
      ]),
    summary: (a, r) => `Pharmacy question (${a.requestType}). Staff reported: ${r}`
  },

  custom_request: {
    title: 'My own request',
    questions: [
      { id: 'message', label: 'What do you want to say?', type: 'text', required: true, placeholder: 'Write one short sentence' }
    ],
    card: (a) => compose(a.message, []),
    summary: (a, r) => `Custom request: "${a.message}". Staff reported: ${r}`
  }
};

/* ---------------------- structured staff reply types ------------------------ */

const REPLY_TYPES = [
  {
    id: 'done',
    label: 'Done / confirmed',
    fields: [],
    build: () => ({ text: 'Your request is done.', facts: [] })
  },
  {
    id: 'wait',
    label: 'Please wait',
    fields: [{ id: 'minutes', label: 'About how many minutes? (optional)', type: 'number', placeholder: 'e.g., 10' }],
    build: (f) => ({
      text: f.minutes ? `Please wait. About ${f.minutes} minutes.` : 'Please wait. I will call you.',
      facts: f.minutes ? [{ label: 'Wait', value: `About ${f.minutes} minutes` }] : []
    })
  },
  {
    id: 'go',
    label: 'Go to another place',
    fields: [
      { id: 'place', label: 'Which counter / room / department?', type: 'text', required: true, placeholder: 'e.g., Records Desk, Counter 4' },
      { id: 'floor', label: 'Floor (optional)', type: 'text', placeholder: 'e.g., Ground floor' }
    ],
    build: (f) => ({
      text: `Please go to: ${f.place}${f.floor ? `, ${f.floor}` : ''}.`,
      facts: [{ label: 'Go to', value: `${f.place}${f.floor ? `, ${f.floor}` : ''}` }]
    })
  },
  {
    id: 'return',
    label: 'Come back later',
    fields: [
      { id: 'date', label: 'Which day?', type: 'date', required: true },
      { id: 'time', label: 'What time?', type: 'time', required: true },
      { id: 'place', label: 'Where? (optional)', type: 'text', placeholder: 'e.g., Counter 4' }
    ],
    build: (f) => {
      const when = `${dateInputToText(f.date)} at ${to12h(f.time)}`;
      return {
        text: `Please come back on ${when}${f.place ? ` at ${f.place}` : ''}.`,
        facts: [
          { label: 'Come back', value: when },
          ...(f.place ? [{ label: 'Where', value: f.place }] : [])
        ]
      };
    }
  },
  {
    id: 'bring',
    label: 'Bring a document',
    fields: [{ id: 'docs', label: 'What should you bring?', type: 'text', required: true, placeholder: 'e.g., ID card, receipt, doctor order' }],
    build: (f) => ({ text: `Please bring: ${f.docs}.`, facts: [{ label: 'Bring', value: f.docs }] })
  },
  {
    id: 'fee',
    label: 'Fee to pay',
    fields: [
      { id: 'amount', label: 'Amount (₹)', type: 'number', required: true, placeholder: 'e.g., 250' },
      { id: 'where', label: 'Pay where? (optional)', type: 'text', placeholder: 'e.g., Billing Counter 2' }
    ],
    build: (f) => ({
      text: `Fee: ₹${f.amount}.${f.where ? ` Pay at: ${f.where}.` : ''}`,
      facts: [
        { label: 'Fee', value: `₹${f.amount}` },
        ...(f.where ? [{ label: 'Pay at', value: f.where }] : [])
      ]
    })
  },
  {
    id: 'no',
    label: 'Not possible',
    fields: [
      { id: 'reason', label: 'Reason (optional)', type: 'text', placeholder: 'e.g., Report not ready' },
      { id: 'alternative', label: 'What can the patient do instead? (optional)', type: 'text' }
    ],
    build: (f) => ({
      text: `Sorry, this is not possible.${f.reason ? ` Reason: ${f.reason}.` : ''}${f.alternative ? ` Instead: ${f.alternative}.` : ''}`,
      facts: [
        ...(f.reason ? [{ label: 'Reason', value: f.reason }] : []),
        ...(f.alternative ? [{ label: 'Instead', value: f.alternative }] : [])
      ]
    })
  }
];

/* ------------------------------ page body ----------------------------------- */

function GuidedBody() {
  const {
    isDarkTheme,
    toggleTheme,
    isSimpleLanguage,
    toggleSimpleLanguage,
    bgCanvas,
    textPrimary,
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid
  } = useTheme();

  const searchParams = useSearchParams();
  const counterLabel = searchParams.get('counter') || '';
  const orgLabel = searchParams.get('org') || '';
  const intentParam = searchParams.get('intent') || '';
  const domain = 'healthcare';

  const [step, setStep] = useState('need'); // need | detail | review | handoff | done
  const [stack, setStack] = useState([]);
  const [needId, setNeedId] = useState(null);
  const [intent, setIntent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  const [cardText, setCardText] = useState('');
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [showA11yCheck, setShowA11yCheck] = useState(false);
  const [a11yChecks, setA11yChecks] = useState({ action: false, jargon: false });
  const [isPolishing, setIsPolishing] = useState(false);

  const [isLargeTextMode, setIsLargeTextMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTarget, setShareTarget] = useState('card'); // card | receipt
  const [printMode, setPrintMode] = useState('card');
  const [urgentOpen, setUrgentOpen] = useState(false);

  const [replyType, setReplyType] = useState(null);
  const [replyFields, setReplyFields] = useState({});
  const [replyError, setReplyError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const [guard, setGuard] = useState(null);
  const [vagueBlocked, setVagueBlocked] = useState(0);

  const [reply, setReply] = useState(null); // { text, facts, override }
  const [recordId, setRecordId] = useState(null);
  const [understood, setUnderstood] = useState(null);
  const [historyList, setHistoryList] = useState([]);

  const sessionIdRef = useRef(null);
  const sessionPromiseRef = useRef(null);
  const reopenOfRef = useRef(null);
  const startRef = useRef(null);
  const autoStartedRef = useRef(false);

  /* ------------------- two-way conversation engine state ------------------- */
  const [activeWorkflow, setActiveWorkflow] = useState(intentParam || 'appointment_request');
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false);
  const [chatMessages, setChatMessages] = useState([]); // [{id, role:'patient'|'staff', text, timestamp, origin:'preset'|'ai'|'manual', intent, edited:bool}]
  const [chatMode, setChatMode] = useState('patient'); // 'patient' | 'staff'
  const [chatInput, setChatInput] = useState('');
  const [aiDraft, setAiDraft] = useState(null); // {text, followUpQuestion, provider, isEdited:bool} | null
  const [isFetchingAi, setIsFetchingAi] = useState(false);
  const [aiDraftError, setAiDraftError] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatEndRef = useRef(null);
  const chatTextareaRef = useRef(null);
  const pendingAiRef = useRef(0);

  /* ------------------------------ derived ---------------------------------- */

  const flow = intent ? FLOWS[intent] : null;
  const titleFor = (key, a) =>
    key === 'reschedule_cancel_appointment'
      ? a.actionType === 'Cancel'
        ? 'Cancel my appointment'
        : 'Change my appointment'
      : FLOWS[key]?.title || 'Request';

  const normalize = (key, a) => {
    const out = { ...a };
    (FLOWS[key]?.questions || []).forEach((q) => {
      if (out[q.id] === OTHER) out[q.id] = out[`${q.id}_other`] || OTHER;
    });
    return out;
  };

  const stepNumber = { need: 1, detail: 2, review: 3, handoff: 3, done: 3 }[step];
  const receiptText = reply
    ? [
        'SignMitra visit record',
        `Request: ${flow ? titleFor(intent, normalize(intent, answers)) : ''}`,
        counterLabel && `Counter: ${counterLabel}${orgLabel ? ` (${orgLabel})` : ''}`,
        `Staff reply: ${reply.text}`,
        ...(reply.facts.length ? ['Confirmed details:', ...reply.facts.map((f) => `- ${f.label}: ${f.value}`)] : []),
        `Date: ${new Date().toLocaleString()}`
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  const printText = printMode === 'receipt' ? receiptText : cardText;

  /* ------------------------------ effects ---------------------------------- */

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      // Delete guided requests older than HISTORY_DAYS from this device.
      const cutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
      const kept = all.filter((r) => {
        if (!r.guided) return true;
        const ts = Number(String(r.id || '').replace('REQ-', ''));
        return !ts || ts >= cutoff;
      });
      if (kept.length !== all.length) localStorage.setItem('signmitra_history', JSON.stringify(kept));
      setHistoryList(kept.filter((r) => r.guided && r.domain === 'HEALTHCARE').slice(0, 30));
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (intentParam && ['appointment_request', 'reschedule_cancel_appointment', 'medical_reports_request', 'diagnostic_test_request', 'communication_assist_request', 'explain_symptoms', 'medicine_query', 'custom_request'].includes(intentParam)) {
      setActiveWorkflow(intentParam);
    }
  }, [intentParam]);

    useEffect(() => {
    if (autoStartedRef.current) return;
    if (intentParam && FLOWS[intentParam]) {
      autoStartedRef.current = true;
      const preset = intentParam === 'reschedule_cancel_appointment' ? { actionType: 'Reschedule' } : {};
      startFlow(intentParam, preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentParam]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  /* ------------------------------ session sync ------------------------------ */

  const syncServer = async (actionType, payload) => {
    try {
      // Wait for session creation to finish so transitions are never skipped by a race.
      if (sessionPromiseRef.current) await sessionPromiseRef.current;
      if (!sessionIdRef.current) return;
      const { signMitraAPI } = await import('@/components/api');
      const body = SENSITIVE_INTENTS.includes(intent) ? {} : payload;
      await signMitraAPI.transitionSession(sessionIdRef.current, actionType, body);
    } catch (err) {
      console.log('Running locally inside standalone PWA mode.');
    }
  };

  const createServerSession = (key) => {
    sessionIdRef.current = null;
    sessionPromiseRef.current = (async () => {
      try {
        const { signMitraAPI } = await import('@/components/api');
        const data = await signMitraAPI.createSession(domain, key);
        sessionIdRef.current = data.sessionId;
      } catch (err) {
        console.log('Running locally inside standalone PWA mode.');
      }
    })();
    return sessionPromiseRef.current;
  };

  /* ------------------------------ navigation -------------------------------- */

  const go = (next) => {
    setStack((s) => [...s, step]);
    setStep(next);
    if (next === 'handoff') syncServer('HANDOFF_STAFF', answers);
    else syncServer('SUBMIT_ENTITY', answers);
  };

  const goBack = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    setStack((s) => s.slice(0, -1));
    setStep(prev);
    setGuard(null);
    syncServer('BACK');
  };

  const resetAll = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setStep('need');
    setStack([]);
    setNeedId(null);
    setIntent(null);
    setAnswers({});
    setErrors({});
    setCardText('');
    setIsEditingCard(false);
    setReplyType(null);
    setReplyFields({});
    setReplyError('');
    setNoteText('');
    setGuard(null);
    setVagueBlocked(0);
    setReply(null);
    setRecordId(null);
    setUnderstood(null);
    sessionIdRef.current = null;
    sessionPromiseRef.current = null;
    reopenOfRef.current = null;
    // conversation reset
    setChatMessages([]);
    setChatMode('patient');
    setChatInput('');
    setAiDraft(null);
    setAiDraftError('');
    setShowWorkflowSelector(false);
    pendingAiRef.current++;
  };

  const startFlow = (key, preset = {}, prefill = null) => {
    setIntent(key);
    setActiveWorkflow(key);
    startRef.current = Date.now();
    createServerSession(key);
    const merged = { ...preset, ...(prefill || {}) };
    setAnswers(merged);
    setErrors({});
    if (prefill) {
      setCardText(FLOWS[key].card(normalize(key, merged)));
      setStack(['need', 'detail']);
      setStep('review');
    } else {
      setStack((s) => (s.length ? s : ['need']));
      setStep('detail');
    }
  };

  const clearSavedHistory = () => {
    if (!confirm('Delete your saved requests from this device?')) return;
    try {
      const all = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      localStorage.setItem('signmitra_history', JSON.stringify(all.filter((r) => !r.guided)));
    } catch (e) {
      /* ignore */
    }
    setHistoryList([]);
  };

  const repeatRecord = (rec) => {
    const q = FLOWS[rec.intent]?.questions || [];
    const keep = {};
    Object.keys(rec.answers || {}).forEach((k) => {
      const base = k.replace(/_other$/, '');
      const question = q.find((x) => x.id === base);
      if (question && question.type !== 'when') keep[k] = rec.answers[k];
      if (k === 'actionType') keep[k] = rec.answers[k];
    });
    const missingRequired = q.some((x) => x.required && x.type !== 'when' && !keep[x.id]);
    if (missingRequired) {
      startFlow(rec.intent, {}, null);
      setAnswers(keep);
      return;
    }
    const needsWhen = q.some((x) => x.required && x.type === 'when');
    if (needsWhen) {
      startFlow(rec.intent, {}, null);
      setAnswers(keep);
      return;
    }
    startFlow(rec.intent, {}, keep);
  };

  /* ------------------------------ detail step ------------------------------- */

  const setAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const recentValues = (key) => {
    if (!key) return [];
    const seen = [];
    historyList.forEach((r) => {
      const v = r.answers?.[key];
      if (v && !seen.includes(v)) seen.push(v);
    });
    return seen.slice(0, 3);
  };

  const submitDetails = (e) => {
    e.preventDefault();
    const newErrors = {};
    flow.questions.forEach((q) => {
      if (q.showIf && !q.showIf(answers)) return;
      const v = answers[q.id];
      if (q.required && !v) newErrors[q.id] = isSimpleLanguage ? 'Please choose one.' : `${q.label} is required.`;
      if (v === OTHER && !answers[`${q.id}_other`]) newErrors[q.id] = 'Please write it.';
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    const cleaned = {};
    flow.questions.forEach((q) => {
      if (q.showIf && !q.showIf(answers)) return;
      cleaned[q.id] = answers[q.id];
      if (answers[`${q.id}_other`]) cleaned[`${q.id}_other`] = answers[`${q.id}_other`];
    });
    if (answers.actionType) cleaned.actionType = answers.actionType;
    setAnswers(cleaned);
    setCardText(flow.card(normalize(intent, cleaned)));
    setA11yChecks({ action: false, jargon: false });
    go('review');
  };

  /* ------------------------------ card tools -------------------------------- */

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const savedVoiceURI = localStorage.getItem('signmitra_preferred_voice');
    if (savedVoiceURI) {
      const selected = voices.find((v) => v.voiceURI === savedVoiceURI);
      if (selected) utterance.voice = selected;
    } else {
      const preferred = voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB'));
      if (preferred) utterance.voice = preferred;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const openShare = (target) => {
    setShareTarget(target);
    setShowShareModal(true);
  };

  const handleNativeShare = async () => {
    const text = shareTarget === 'receipt' ? receiptText : cardText;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SignMitra', text });
        setShowShareModal(false);
      } catch (err) {
        console.log('Share cancelled or failed.', err);
      }
    } else {
      alert('Native sharing is not supported on this device/browser.');
    }
  };

  const handlePrintPDF = () => {
    setPrintMode(shareTarget);
    setShowShareModal(false);
    setTimeout(() => window.print(), 100);
  };

  const polishWithAI = async () => {
    setIsPolishing(true);
    try {
      const out = await aiPolishCard(cardText);
      if (out && out.trim()) setCardText(out);
    } catch (e) {
      /* keep template text */
    }
    setIsPolishing(false);
  };
  /* -------------------------------------------------------------------------- */
  /* STRUCTURED HEALTHCARE PHRASE LIBRARY & CONTEXTUAL ENGINE                   */
  /* -------------------------------------------------------------------------- */

  const WORKFLOW_METADATA = {
    appointment_request: {
      title: 'Book New Appointment',
      badge: 'Appointments',
      hint: 'Book a doctor consultation or specialist visit'
    },
    reschedule_cancel_appointment: {
      title: 'Change or Cancel Appointment',
      badge: 'Appointments',
      hint: 'Reschedule an existing booking date or cancel'
    },
    medical_reports_request: {
      title: 'Medical Reports & Records',
      badge: 'Records Desk',
      hint: 'Collect physical test reports and doctor summaries'
    },
    diagnostic_test_request: {
      title: 'Diagnostic Tests & Lab Scans',
      badge: 'Pathology & Scans',
      hint: 'Blood tests, scans, X-rays, ECG and fasting instructions'
    },
    communication_assist_request: {
      title: 'Communication Accommodation',
      badge: 'Accessibility',
      hint: 'Request written communication or ISL interpreter'
    },
    explain_symptoms: {
      title: 'Explain Symptoms & Pain Triage',
      badge: 'Triage / Emergency',
      hint: 'Describe pain and notify the triage nurse'
    },
    medicine_query: {
      title: 'Prescription Refill & Pharmacy',
      badge: 'Hospital Pharmacy',
      hint: 'Refill prescription, check stock, and get dosage instructions'
    },
    custom_request: {
      title: 'General Hospital Inquiry',
      badge: 'Hospital Counter',
      hint: 'General assistance, directions, and counter queries'
    }
  };

  /* Comprehensive phrase library by Workflow, Speaker Role, and Context */
  const PHRASE_DATABASE = {
    appointment_request: {
      patient: [
        'I would like to book a new doctor appointment.',
        'Which doctors or specialists are available today?',
        'What appointment dates and times are available this week?',
        'What documents or hospital ID cards should I bring?',
        'How much is the doctor consultation fee?'
      ],
      staff: [
        'Please show me your patient registration card or ID.',
        "Let me check the doctor's schedule for today. One moment please.",
        'We have an open slot today at 11:30 AM. Does that work for you?',
        'Please fill out this registration slip at Counter 1 first.',
        'Your appointment is confirmed. Please report 15 minutes before time.'
      ]
    },
    reschedule_cancel_appointment: {
      patient: [
        'I need to reschedule my existing appointment.',
        'I need to cancel my scheduled appointment.',
        'Can I change my appointment date to tomorrow or next week?',
        'Please check my appointment booking with my phone number.',
        'Is there any fee or penalty for changing my appointment?'
      ],
      staff: [
        'Please show me your appointment booking slip or SMS confirmation.',
        'I have cancelled your appointment. You will receive an SMS confirmation.',
        'We have openings tomorrow at 10:00 AM or 3:00 PM.',
        'There are no extra fees for rescheduling your appointment.',
        'Your new appointment has been rescheduled. Here is your updated slip.'
      ]
    },
    medical_reports_request: {
      patient: [
        'I am here to collect my medical reports and test results.',
        "Is my doctor's discharge summary or lab report ready?",
        'Which counter should I visit to collect my printed report?',
        'I need a stamped and signed physical copy of my records.',
        'Do I need to show my bill receipt or identification?'
      ],
      staff: [
        'Your report is ready. Please collect it from Counter 3.',
        'Please show me your test bill receipt and ID card.',
        'The report is still being verified by the doctor. Please wait 20 minutes.',
        'Please visit the Medical Records Department on the 1st Floor (Room 104).',
        'Here is your stamped report file. Please sign our collection register.'
      ]
    },
    diagnostic_test_request: {
      patient: [
        'I need to get a blood test or diagnostic lab test done.',
        'Where is the pathology lab or scan center located?',
        'Do I need to be fasting for this test?',
        'How much is the test fee, and when will the report be ready?',
        'Can I receive the report via SMS or WhatsApp?'
      ],
      staff: [
        'The pathology lab is in Room 12 on the Ground Floor.',
        'This test requires 8 to 10 hours of fasting. Are you fasting?',
        'Please pay the test fee of ₹250 at Billing Counter 2 first.',
        'Your test results will be ready today by 4:00 PM.',
        'Please take your test token number and have a seat outside Room 12.'
      ]
    },
    communication_assist_request: {
      patient: [
        'Hello. I am Deaf or hard of hearing. Please communicate in writing.',
        'I need an Indian Sign Language (ISL) interpreter if available.',
        'Please write down all instructions, numbers, and dates on this screen or paper.',
        'Please explain one step at a time in simple words.',
        'Please show me where to go next.'
      ],
      staff: [
        'I understand. I will write down all instructions clearly for you.',
        'We do not have an in-person ISL interpreter right now, but I will help in writing.',
        'Please take your time. Let me write the exact steps on paper.',
        'Please keep this screen open at every counter you visit today.',
        'I am here to help. Feel free to tap any question on this screen.'
      ]
    },
    explain_symptoms: {
      patient: [
        'I have severe pain and need to see a doctor or triage nurse.',
        'I have had a high fever and headache since yesterday.',
        'I feel dizzy, breathless, or unwell right now.',
        'I need urgent medical attention. Please notify emergency staff.',
        'The pain is getting worse. Please call the doctor quickly.'
      ],
      staff: [
        'Please wait right here. I am calling the triage nurse immediately.',
        'Please sit down in this wheelchair. I will take you to Emergency (Room 4).',
        'The on-duty doctor will examine you in Room 5 in a few moments.',
        'Are you experiencing chest pain, difficulty breathing, or severe bleeding?',
        'Do you have any known drug allergies or medical history with us?'
      ]
    },
    medicine_query: {
      patient: [
        "I need to get my doctor's prescription filled at the pharmacy.",
        'Where is the hospital pharmacy counter located?',
        'Is this prescribed medicine currently in stock?',
        'Please write down how and when I should take each medicine.',
        'Can I pay for the medicines using UPI or card at the counter?'
      ],
      staff: [
        'The pharmacy is at Counter 4, just past the entrance on the right.',
        "Please show me your doctor's stamped prescription slip.",
        'All medicines in this prescription are in stock. Total amount is ₹340.',
        'Take this tablet once in the morning after breakfast, and one at bedtime.',
        'This medicine is not in stock here; you can get it at the pharmacy outside.'
      ]
    },
    custom_request: {
      patient: [
        'Hello, I need general assistance at the hospital counter.',
        'Where can I find the hospital inquiry desk or reception?',
        'Which counter handles billing and patient registration?',
        'Please write down all directions and counter numbers.',
        'Thank you very much for your help.'
      ],
      staff: [
        'I understand your request. Please wait while I check.',
        'I will write down the exact room number and directions for you.',
        'Please take a token number and have a seat in the waiting area.',
        'Please go to Counter 2 on the 1st Floor for this service.',
        'Is there anything else I can assist you with today?'
      ]
    }
  };

  /* Keyword-driven contextual follow-up phrases */
  const getContextualPhrases = (role, workflow, lastMessageText) => {
    const text = (lastMessageText || '').toLowerCase();
    const wf = PHRASE_DATABASE[workflow] || PHRASE_DATABASE.custom_request;
    const basePhrases = wf[role] || [];

    if (role === 'patient') {
      // Patient replying to Staff
      if (text.includes('counter') || text.includes('room') || text.includes('floor') || text.includes('desk') || text.includes('cabin') || text.includes('wing')) {
        return [
          'Which floor or department is that counter located on?',
          'Could you please write down the room or counter number?',
          'Thank you. I will proceed to that counter now.',
          'Do I need to collect a token number before going there?',
          'Could you please show me the directions on a map or paper?'
        ];
      }
      if (text.includes('wait') || text.includes('minute') || text.includes('hour') || text.includes('schedule') || text.includes('delay') || text.includes('lobby') || text.includes('seat')) {
        return [
          'Thank you. Approximately how long will the wait be?',
          'I will wait in the seating area. Please wave when my turn comes.',
          'Is there a number token I need to keep ready?',
          'Is there an earlier time slot, or should I return tomorrow?',
          'Thank you. Where is the nearest waiting area?'
        ];
      }
      if (text.includes('fee') || text.includes('₹') || text.includes('cost') || text.includes('pay') || text.includes('rupee') || text.includes('bill') || text.includes('price')) {
        return [
          'Can I pay the fee using UPI (GPay/PhonePe) or debit card?',
          'Where is the billing desk located to make the payment?',
          'Please provide a printed payment receipt with the hospital stamp.',
          'Are there any concessions or insurance coverage applicable?',
          'Thank you. Here is the payment.'
        ];
      }
      if (text.includes('slip') || text.includes('id') || text.includes('card') || text.includes('receipt') || text.includes('document') || text.includes('prescript')) {
        return [
          'Here is my hospital registration card and ID.',
          "Here is my doctor's stamped prescription slip.",
          'Which other documents or receipts do I need to present?',
          'I have my previous medical file here in my bag.',
          'Thank you. Please check these documents.'
        ];
      }
      if (text.includes('emergency') || text.includes('triage') || text.includes('nurse') || text.includes('doctor') || text.includes('wheelchair')) {
        return [
          'The pain is quite severe. Please call the triage nurse.',
          'I am sitting right here. Please notify me when the doctor arrives.',
          'I have had these symptoms since yesterday. Thank you for checking.',
          'Please inform the examining doctor that I communicate in writing.',
          'Thank you for your quick help.'
        ];
      }
      if (text.includes('report') || text.includes('lab') || text.includes('test') || text.includes('blood') || text.includes('scan') || text.includes('ready')) {
        return [
          'Here is my lab test receipt. Please check my file.',
          'Can I get a stamped physical copy for my doctor consultation?',
          'Will the report also be available online or via SMS?',
          'Do I need to show this report to my doctor today?',
          'Thank you. I will collect it now.'
        ];
      }
      // Default patient follow-ups
      return [
        'Could you please explain that in simpler words?',
        'Please write down the exact room number, time, and instructions.',
        'Which counter should I go to next?',
        'Thank you very much. I understand.',
        ...basePhrases.slice(0, 2)
      ];
    } else {
      // Staff replying to Patient
      if (text.includes('appointment') || text.includes('book') || text.includes('reschedule') || text.includes('cancel')) {
        return [
          'Please show me your patient registration card or ID.',
          "Let me check the doctor's schedule for today. One moment please.",
          'We have an open slot today at 11:30 AM. Does that work for you?',
          'Please fill out this registration slip at Counter 1 first.',
          'Your appointment is confirmed. Please report 15 minutes early.'
        ];
      }
      if (text.includes('report') || text.includes('result') || text.includes('record') || text.includes('summary')) {
        return [
          'Your report is ready. Please collect it from Counter 3.',
          'Please show me your test bill receipt and ID card.',
          'The report is still being verified by the doctor. Please wait 20 minutes.',
          'Please visit the Medical Records Department on the 1st Floor (Room 104).',
          'Here is your stamped report file. Please sign our collection register.'
        ];
      }
      if (text.includes('test') || text.includes('blood') || text.includes('scan') || text.includes('x-ray') || text.includes('ecg') || text.includes('fasting')) {
        return [
          'The pathology lab is in Room 12 on the Ground Floor.',
          'This test requires 8 to 10 hours of fasting. Are you fasting?',
          'Please pay the test fee of ₹250 at Billing Counter 2 first.',
          'Your test results will be ready today by 4:00 PM.',
          'Please take your test token number and have a seat outside Room 12.'
        ];
      }
      if (text.includes('medicine') || text.includes('pharmacy') || text.includes('tablet') || text.includes('dose') || text.includes('refill')) {
        return [
          'The pharmacy is at Counter 4, just past the entrance on the right.',
          "Please show me your doctor's stamped prescription slip.",
          'All medicines in this prescription are in stock. Total amount is ₹340.',
          'Take this tablet once in the morning after breakfast, and one at bedtime.',
          'This medicine is not in stock here; you can get it at the pharmacy outside.'
        ];
      }
      if (text.includes('pain') || text.includes('hurt') || text.includes('symptom') || text.includes('fever') || text.includes('dizzy') || text.includes('emergency')) {
        return [
          'Please wait right here. I am calling the triage nurse immediately.',
          'Please sit down in this wheelchair. I will take you to Emergency (Room 4).',
          'The on-duty doctor will examine you in Room 5 in a few moments.',
          'Are you experiencing chest pain, difficulty breathing, or severe bleeding?',
          'Do you have any existing allergies or medicines you are taking?'
        ];
      }
      if (text.includes('where') || text.includes('counter') || text.includes('room') || text.includes('floor') || text.includes('direction')) {
        return [
          'Please go to Counter 3 on the 1st Floor (take the elevator on the left).',
          "The doctor's consultation room is Cabin 8 in Wing B.",
          'The billing and cash counter is right opposite this desk (Counter 1).',
          'Please follow the yellow line on the floor to reach the laboratory.',
          'The pharmacy is right next to the main hospital exit.'
        ];
      }
      if (text.includes('fee') || text.includes('cost') || text.includes('pay') || text.includes('rupee') || text.includes('₹') || text.includes('how much')) {
        return [
          'The consultation fee is ₹300, payable at Counter 2.',
          'We accept UPI (GPay/PhonePe), debit cards, and cash.',
          'Here is your stamped payment receipt. Please keep it safe.',
          'Government health scheme cards (Ayushman Bharat) are accepted at Counter 5.',
          'There are no additional charges for this service.'
        ];
      }
      if (text.includes('wait') || text.includes('how long') || text.includes('time') || text.includes('when')) {
        return [
          'The wait time is approximately 15 to 20 minutes.',
          'The doctor is currently attending an emergency. Please wait in the lobby.',
          'We will wave or display your token number on the screen.',
          'You are next in queue. Please wait near Room 6.',
          'The doctor has arrived and will call you in 5 minutes.'
        ];
      }
      // Default staff follow-ups
      return [
        'I understand your request. Please wait while I check.',
        'I will write down the exact room number and directions for you.',
        'Please take a seat in the waiting area. We will call you soon.',
        'Is there anything else I can assist you with today?',
        ...basePhrases.slice(0, 2)
      ];
    }
  };

  /* Auto-scroll chat to latest message */
  const scrollChatToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ONE-TAP SENDING for predefined phrases */
  const sendPresetMessage = (text) => {
    if (!text || isSendingMsg) return;
    setIsSendingMsg(true);
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: chatMode,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      origin: 'preset',
      intent: activeWorkflow,
      edited: false
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setAiDraft(null);
    setAiDraftError('');
    setIsSendingMsg(false);

    // Turn alternates immediately
    const nextRole = chatMode === 'patient' ? 'staff' : 'patient';
    setChatMode(nextRole);

    setTimeout(scrollChatToBottom, 60);
  };

  /* MANUAL SENDING for typed composer messages */
  const sendManualMessage = () => {
    const clean = (chatInput || '').trim();
    if (!clean || isSendingMsg) return;
    setIsSendingMsg(true);
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: chatMode,
      text: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      origin: 'manual',
      intent: activeWorkflow,
      edited: false
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setAiDraft(null);
    setAiDraftError('');
    setIsSendingMsg(false);

    // Turn alternates immediately
    const nextRole = chatMode === 'patient' ? 'staff' : 'patient';
    setChatMode(nextRole);

    setTimeout(scrollChatToBottom, 60);
  };

  /* CONFIRM & SEND for AI-generated drafts */
  const confirmAndSendAiDraft = () => {
    if (!aiDraft || !aiDraft.text.trim() || isSendingMsg) return;
    setIsSendingMsg(true);
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: chatMode,
      text: aiDraft.text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      origin: 'ai',
      intent: activeWorkflow,
      edited: Boolean(aiDraft.isEdited)
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setAiDraft(null);
    setAiDraftError('');
    setIsSendingMsg(false);

    // Turn alternates immediately
    const nextRole = chatMode === 'patient' ? 'staff' : 'patient';
    setChatMode(nextRole);

    setTimeout(scrollChatToBottom, 60);
  };

  /* Dismiss AI draft */
  const dismissAiDraft = () => {
    setAiDraft(null);
    setAiDraftError('');
  };

  /* Load AI draft into manual composer for extensive editing */
  const editAiDraftInComposer = () => {
    if (!aiDraft) return;
    setChatInput(aiDraft.text);
    setAiDraft(null);
    setAiDraftError('');
    chatTextareaRef.current?.focus();
  };

  /* Clear / Restart entire conversation */
  const handleClearConversation = () => {
    if (chatMessages.length === 0) return;
    if (typeof window !== 'undefined' && !window.confirm('Restart this conversation from the beginning? All messages will be cleared.')) {
      return;
    }
    setChatMessages([]);
    setChatInput('');
    setAiDraft(null);
    setAiDraftError('');
    setChatMode('patient');
    setShowWorkflowSelector(false);
  };

  /* Request AI-generated dynamic suggestions via existing /api/ai-studio compose_card */
  const fetchAiSuggestion = async () => {
    if (isFetchingAi) return;
    const reqId = ++pendingAiRef.current;
    setIsFetchingAi(true);
    setAiDraft(null);
    setAiDraftError('');
    try {
      const isSensitive = SENSITIVE_INTENTS.includes(activeWorkflow);
      const recentMsgs = chatMessages.slice(-5);
      const lastOtherMsg = [...recentMsgs].reverse().find((m) => m.role !== chatMode);
      const contextParts = [];

      if (!isSensitive && cardText) {
        contextParts.push(`Workflow topic: ${WORKFLOW_METADATA[activeWorkflow]?.title || activeWorkflow}`);
      }
      if (lastOtherMsg) {
        const roleLabel = lastOtherMsg.role === 'patient' ? 'Patient' : 'Hospital Staff';
        // Bound to 180 chars max to respect token limit
        contextParts.push(`${roleLabel} said: "${lastOtherMsg.text.slice(0, 180)}"`);
      }

      const intentText =
        chatMode === 'patient'
          ? `As a Deaf ISL patient, I want to respond to the hospital counter staff.${isSensitive ? '' : ` Topic: ${WORKFLOW_METADATA[activeWorkflow]?.title || 'hospital assistance'}.`}`
          : `As hospital reception staff, I want to respond clearly to the patient.${isSensitive ? ' Patient has a medical question.' : ` Topic: ${WORKFLOW_METADATA[activeWorkflow]?.title || 'hospital assistance'}.`}`;

      const context = contextParts.join(' | ') || `Hospital counter communication. Role: ${chatMode}.`;

      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compose_card',
          payload: { intent: intentText, tone: 'polite', context }
        })
      });

      if (!res.ok) throw new Error('API response error');
      const data = await res.json();

      if (reqId !== pendingAiRef.current) return; // Stale async guard

      if (data && data.composedText) {
        setAiDraft({
          text: data.composedText,
          followUpQuestion: data.followUpQuestion || '',
          provider: data.provider || 'AI Studio',
          isEdited: false
        });
      } else {
        setAiDraftError('Could not generate an AI draft. Please tap one of the instant phrases below.');
      }
    } catch (err) {
      if (reqId !== pendingAiRef.current) return;
      setAiDraftError('AI Studio is currently unavailable. Please tap one of the instant phrases below.');
    } finally {
      if (reqId === pendingAiRef.current) setIsFetchingAi(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* COMPLETE TWO-WAY CONVERSATION INTERFACE                                    */
  /* -------------------------------------------------------------------------- */

  const renderConversationSection = () => {
    const lastOtherMsg = [...chatMessages].reverse().find((m) => m.role !== chatMode);
    const contextualPhrases = getContextualPhrases(chatMode, activeWorkflow, lastOtherMsg?.text);
    const currentMeta = WORKFLOW_METADATA[activeWorkflow] || WORKFLOW_METADATA.appointment_request;

    return (
      <section
        aria-label="Two-Way AI-Assisted Conversation"
        className={`rounded-2xl border-2 ${borderTone} p-4 sm:p-6 shadow-md ${cardBg} space-y-4`}
      >
        {/* A. CONVERSATION HEADER */}
        <div
          className="flex flex-col gap-3 border-b pb-4"
          style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${accentSolid}`}>
                <MessageSquare className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  Two-Way Conversation
                </h2>
                <p className={`text-xs font-semibold ${textSecondary}`}>
                  Communicate clearly, one message at a time.
                </p>
              </div>
            </div>

            {/* Workflow Topic Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowWorkflowSelector(!showWorkflowSelector)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                title="Change active healthcare topic"
              >
                <span className="text-[10px] font-mono uppercase opacity-60">Topic:</span>
                <span className="truncate max-w-[150px] sm:max-w-[190px]">{currentMeta.title}</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${showWorkflowSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Inline Workflow Dropdown */}
              {showWorkflowSelector && (
                <div
                  className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl border-2 ${borderTone} ${cardBg} shadow-xl z-50 p-2 space-y-1.5`}
                >
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 opacity-60">
                    Switch Healthcare Topic:
                  </p>
                  {Object.entries(WORKFLOW_METADATA).map(([wfKey, meta]) => (
                    <button
                      key={wfKey}
                      type="button"
                      onClick={() => {
                        setActiveWorkflow(wfKey);
                        setShowWorkflowSelector(false);
                        setAiDraft(null);
                        setAiDraftError('');
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        activeWorkflow === wfKey
                          ? `${accentSolid} shadow-sm`
                          : `${cardInnerBg} hover:opacity-80`
                      }`}
                    >
                      <span className="truncate">{meta.title}</span>
                      {activeWorkflow === wfKey && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Role Switching & Turn Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            {/* Speaker Mode Switch */}
            <div
              className={`inline-flex rounded-xl border p-1 ${borderTone} ${cardInnerBg}`}
              role="group"
              aria-label="Speaker Role Selection"
            >
              <button
                type="button"
                onClick={() => {
                  setChatMode('patient');
                  setAiDraft(null);
                  setAiDraftError('');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  chatMode === 'patient' ? `${accentSolid} shadow-sm` : 'opacity-70 hover:opacity-100'
                }`}
                aria-pressed={chatMode === 'patient'}
              >
                <span>👤 Patient</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatMode('staff');
                  setAiDraft(null);
                  setAiDraftError('');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  chatMode === 'staff' ? `${accentSolid} shadow-sm` : 'opacity-70 hover:opacity-100'
                }`}
                aria-pressed={chatMode === 'staff'}
              >
                <span>🏥 Staff</span>
              </button>
            </div>

            {/* Turn Indicator & Reset Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    chatMode === 'patient' ? 'bg-[#AB92BF]' : 'bg-[#655A7C]'
                  }`}
                />
                <span className="font-bold">
                  {chatMode === 'patient' ? "Patient's Turn" : "Staff's Turn"}
                </span>
              </div>

              {chatMessages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearConversation}
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${borderTone} hover:border-[#655A7C] opacity-75 hover:opacity-100 transition-all flex items-center gap-1`}
                  title="Clear conversation and start over"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* B. SCROLLABLE CONVERSATION TRANSCRIPT */}
        <div
          className={`rounded-xl border ${borderTone} ${cardInnerBg} p-4 min-h-[260px] max-h-[420px] overflow-y-auto space-y-3.5 flex flex-col shadow-inner`}
          aria-live="polite"
          aria-label="Conversation Messages"
        >
          {chatMessages.length === 0 ? (
            <div className="my-auto text-center py-10 px-4 space-y-3">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center opacity-80 ${cardBg} border-2 ${borderTone} shadow-sm`}>
                <MessageSquare className="w-7 h-7 text-[#655A7C]" />
              </div>
              <p className="text-base font-black">No messages yet in this conversation.</p>
              <p className={`text-xs max-w-md mx-auto ${textSecondary} leading-relaxed`}>
                Current Topic: <strong>{currentMeta.title}</strong>.<br />
                Tap any <strong>instant response card below</strong> to send immediately, or type a custom message.
              </p>
            </div>
          ) : (
            <>
              {chatMessages.map((msg) => {
                const isStaff = msg.role === 'staff';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isStaff ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider opacity-65 px-1.5">
                      <span>{isStaff ? '🏥 Hospital Staff' : '👤 Patient'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.origin === 'ai' && (
                        <span className="text-[#AB92BF] border border-[#AB92BF]/40 rounded px-1 text-[9px]">
                          ✨ AI {msg.edited ? '(edited)' : ''}
                        </span>
                      )}
                      {msg.origin === 'preset' && (
                        <span className="opacity-60 text-[9px]">One-tap</span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line shadow-sm transition-all ${
                        isStaff
                          ? 'bg-[#655A7C] text-[#FDF1E2] rounded-tr-sm'
                          : 'bg-[#AB92BF]/30 text-inherit border-2 border-[#AB92BF]/50 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* C. CONTEXTUAL ONE-TAP QUICK REPLIES (THE CORE FEATURE) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#AB92BF]" />
              Tap to send immediately ({chatMode === 'patient' ? 'Patient options' : 'Staff options'}):
            </span>

            {/* AI Suggestion Trigger */}
            <button
              type="button"
              onClick={fetchAiSuggestion}
              disabled={isFetchingAi}
              className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-1.5 transition-all self-start sm:self-auto ${
                isFetchingAi ? 'opacity-50 cursor-wait' : 'hover:opacity-100 shadow-sm'
              }`}
              title="Generate a custom AI draft for this conversation"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#AB92BF]" />
              <span>{isFetchingAi ? 'Asking AI...' : '✨ Suggest with AI'}</span>
            </button>
          </div>

          {/* D. AI-GENERATED DRAFT CONFIRMATION PANEL (IF ACTIVE) */}
          {aiDraft && (
            <div
              className={`p-4 rounded-xl border-2 border-[#AB92BF] ${cardInnerBg} space-y-3 shadow-md animate-in fade-in duration-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#655A7C] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#AB92BF]" />
                  AI-Generated Suggestion (Review & Confirm):
                </span>
                <button
                  type="button"
                  onClick={dismissAiDraft}
                  className="text-[11px] font-mono uppercase underline opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>

              {/* Editable Draft Textarea */}
              <textarea
                rows={3}
                value={aiDraft.text}
                onChange={(e) =>
                  setAiDraft((prev) => ({ ...prev, text: e.target.value, isEdited: true }))
                }
                className={`w-full p-3 font-bold text-sm sm:text-base border-2 rounded-xl outline-none ${cardBg} ${borderTone} focus:border-[#655A7C] resize-none`}
                aria-label="Review AI generated text"
              />

              {aiDraft.followUpQuestion && (
                <p className={`text-xs font-mono ${textSecondary} italic`}>
                  Suggested follow-up: {aiDraft.followUpQuestion}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={confirmAndSendAiDraft}
                  disabled={!aiDraft.text.trim()}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all ${accentSolid} hover:opacity-90 active:scale-[0.98]`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Send</span>
                </button>
                <button
                  type="button"
                  onClick={editAiDraftInComposer}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border ${borderTone} ${cardBg} hover:opacity-80 transition-all`}
                >
                  Edit in Composer
                </button>
                <span className={`text-[11px] font-mono ${textSecondary} ml-auto`}>
                  Review required before sending.
                </span>
              </div>
            </div>
          )}

          {aiDraftError && (
            <p className="text-xs font-mono font-bold text-red-500 opacity-90 px-1">{aiDraftError}</p>
          )}

          {/* LARGE TOUCH-FRIENDLY ONE-TAP PRESET CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {contextualPhrases.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendPresetMessage(phrase)}
                className={`p-3.5 sm:p-4 rounded-xl border-2 text-left font-bold text-xs sm:text-sm leading-snug transition-all flex items-start gap-2.5 shadow-sm active:scale-[0.98] ${
                  cardInnerBg
                } ${borderTone} hover:border-[#655A7C] hover:shadow`}
              >
                <span className="text-base shrink-0 mt-0.5">💬</span>
                <span className="flex-1">{phrase}</span>
              </button>
            ))}
          </div>
        </div>

        {/* E. OPTIONAL CUSTOM CHAT COMPOSER */}
        <div
          className="space-y-2 pt-3 border-t"
          style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
        >
          <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-85">
            {chatMode === 'patient' ? 'Or type a custom patient message:' : 'Or type a custom staff reply:'}
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <textarea
              ref={chatTextareaRef}
              rows={2}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendManualMessage();
                }
              }}
              placeholder={
                chatMode === 'patient'
                  ? 'Type patient message... (Enter to send, Shift+Enter for new line)'
                  : 'Type hospital staff reply... (Enter to send, Shift+Enter for new line)'
              }
              className={`${inputClass} flex-1 resize-none min-h-[56px]`}
            />
            <button
              type="button"
              onClick={sendManualMessage}
              disabled={!chatInput.trim() || isSendingMsg}
              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all sm:self-stretch ${
                chatInput.trim() && !isSendingMsg
                  ? `${accentSolid} hover:opacity-90 active:scale-[0.98]`
                  : `${cardInnerBg} border ${borderTone} opacity-40 cursor-not-allowed`
              }`}
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className={`text-[10px] font-mono ${textSecondary}`}>
            Tip: Tapping preset cards above sends immediately. Manual text and AI suggestions require pressing Send or Confirm.
          </p>
        </div>
      </section>
    );
  };
  /* ------------------------------ staff reply ------------------------------- */

  const finalizeReply = async (text, facts = [], override = false) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    const id = `REQ-${Date.now()}`;
    const a = normalize(intent, answers);
    const duration = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : null;
    // Health details for sensitive intents are not stored on the device.
    const keepDetails = !SENSITIVE_INTENTS.includes(intent);
    const record = {
      id,
      domain: 'HEALTHCARE',
      intent,
      title: titleFor(intent, a),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: 'Staff Responded',
      entities: keepDetails ? a : {},
      staffResponse: keepDetails ? text : '',
      guided: true,
      answers: keepDetails ? answers : {},
      facts: keepDetails ? facts : [],
      counter: counterLabel || null,
      org: orgLabel || null,
      vagueBlocked,
      vagueOverride: override,
      durationSeconds: duration,
      understood: null,
      reopenOf: reopenOfRef.current
    };
    reopenOfRef.current = null;
    try {
      const existing = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      localStorage.setItem('signmitra_history', JSON.stringify([record, ...existing]));
      setHistoryList((h) => [record, ...h].slice(0, 30));
    } catch (err) {
      console.error('Local storage error:', err);
    }
    setReply({ text, facts, override });
    setRecordId(id);
    setUnderstood(null);
    setGuard(null);
    setStep('done');
    try {
      if (sessionPromiseRef.current) await sessionPromiseRef.current;
      if (sessionIdRef.current) {
        const { signMitraAPI } = await import('@/components/api');
        await signMitraAPI.submitStaffResponse(sessionIdRef.current, keepDetails ? text : 'Staff replied.', null);
      }
    } catch (err) {
      console.log('Local completion snapshot saved.');
    }
  };

  const submitStructuredReply = () => {
    const t = REPLY_TYPES.find((r) => r.id === replyType);
    if (!t) return;
    const missing = t.fields.filter((f) => f.required && !replyFields[f.id]);
    if (missing.length) {
      setReplyError(`Please fill: ${missing.map((m) => m.label).join(', ')}`);
      return;
    }
    setReplyError('');
    const { text, facts } = t.build(replyFields);
    finalizeReply(text, facts, false);
  };

  const submitFreeReply = (text) => {
    const clean = (text || '').trim();
    if (!clean) return;
    const issues = findVague(clean);
    if (issues.length) {
      setVagueBlocked((n) => n + 1);
      setGuard({ text: clean, issues, time: '', place: '', amount: '', error: '' });
      return;
    }
    finalizeReply(clean, [], false);
  };

  const applyGuardFix = () => {
    const extras = [];
    const facts = [];
    let missing = false;
    if (guard.issues.includes('time')) {
      if (!guard.time) missing = true;
      else {
        extras.push(`Time: ${to12h(guard.time)}`);
        facts.push({ label: 'Time', value: to12h(guard.time) });
      }
    }
    if (guard.issues.includes('place')) {
      if (!guard.place.trim()) missing = true;
      else {
        extras.push(`Place: ${guard.place.trim()}`);
        facts.push({ label: 'Place', value: guard.place.trim() });
      }
    }
    if (guard.issues.includes('fee')) {
      if (!guard.amount) missing = true;
      else {
        extras.push(`Fee: ₹${guard.amount}`);
        facts.push({ label: 'Fee', value: `₹${guard.amount}` });
      }
    }
    if (missing) {
      setGuard((g) => ({ ...g, error: 'Please fill every box above, or tap "Send anyway".' }));
      return;
    }
    finalizeReply(`${guard.text} (${extras.join('. ')}.)`, facts, false);
  };

  const markUnderstood = (value) => {
    setUnderstood(value);
    // Not "Resolved": this only records whether the visitor said they understood.
    const status = value ? 'Understood by visitor' : 'Needs clarification';
    try {
      const existing = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      const updated = existing.map((r) => (r.id === recordId ? { ...r, understood: value, status } : r));
      localStorage.setItem('signmitra_history', JSON.stringify(updated));
    } catch (e) {
      /* ignore */
    }
    setHistoryList((h) => h.map((r) => (r.id === recordId ? { ...r, understood: value, status } : r)));
    if (value === false) {
      reopenOfRef.current = recordId;
      setCardText(
        [
          INTRO,
          'I did not fully understand your answer.',
          '• Please write the exact time, the exact place, and what I need to bring.',
          CLOSING
        ].join('\n')
      );
      setReply(null);
      setReplyType(null);
      setReplyFields({});
      setNoteText('');
      setStep('handoff');
    }
  };

  /* ------------------------------ UI pieces --------------------------------- */

  const Chip = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all active:scale-[0.98] ${
        active ? `${accentSolid} border-transparent` : `${cardInnerBg} ${borderTone} hover:border-[#655A7C]`
      }`}
    >
      {children}
    </button>
  );

  const inputClass = `p-3 w-full font-bold border rounded-lg text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`;

  const renderQuestion = (q) => {
    if (q.showIf && !q.showIf(answers)) return null;
    const v = answers[q.id] || '';
    return (
      <div key={q.id} className="space-y-2">
        <label className="text-xs font-mono font-bold uppercase tracking-wider block">
          {q.label} {q.required && <span className="opacity-70">*</span>}
        </label>

        {q.type === 'choice' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt) => (
              <Chip key={opt} active={v === opt} onClick={() => setAnswer(q.id, v === opt ? '' : opt)}>
                {opt}
              </Chip>
            ))}
            {q.allowOther && (
              <Chip active={v === OTHER} onClick={() => setAnswer(q.id, v === OTHER ? '' : OTHER)}>
                Other
              </Chip>
            )}
          </div>
        )}
        {q.type === 'choice' && v === OTHER && (
          <input
            type="text"
            value={answers[`${q.id}_other`] || ''}
            onChange={(e) => setAnswers((p) => ({ ...p, [`${q.id}_other`]: e.target.value }))}
            placeholder="Write here..."
            className={inputClass}
          />
        )}

        {q.type === 'when' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {q.chips.map((c) => {
                const val = resolveChip(c);
                return (
                  <Chip key={c} active={v === val} onClick={() => setAnswer(q.id, v === val ? '' : val)}>
                    {c}
                  </Chip>
                );
              })}
            </div>
            <input
              type="date"
              onChange={(e) => setAnswer(q.id, dateInputToText(e.target.value))}
              onClick={(e) => e.target.showPicker?.()}
              className={`${inputClass} cursor-pointer`}
              aria-label="Pick a date"
            />
            {v && <p className={`text-xs font-mono ${textSecondary}`}>Selected: {v}</p>}
          </div>
        )}

        {q.type === 'text' && (
          <div className="space-y-2">
            {(q.quick || recentValues(q.recentKey).length > 0) && (
              <div className="flex flex-wrap gap-2">
                {[...(q.quick || []), ...recentValues(q.recentKey)].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAnswer(q.id, c)}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={v}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder={q.placeholder || 'Write here...'}
              className={inputClass}
            />
          </div>
        )}

        {errors[q.id] && <p className="text-[11px] font-mono font-bold">{errors[q.id]}</p>}
      </div>
    );
  };

  const staffQuickOptions = NEUTRAL_STAFF_REPLIES;
  const currentReplyType = REPLY_TYPES.find((r) => r.id === replyType);

  /* -------------------------------- render ---------------------------------- */

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}
    >
      {/* PRINT VIEW */}
      <div className="hidden print:block print:p-8 print:w-full print:bg-white print:text-black">
        <h1 className="text-3xl font-black mb-6 uppercase border-b-2 border-black pb-4">
          {printMode === 'receipt' ? 'SignMitra Visit Record' : 'SignMitra Communication Request'}
        </h1>
        <p className="text-2xl font-bold leading-relaxed whitespace-pre-line">{printText}</p>
        <div className="mt-12 text-sm font-mono opacity-50">Prepared on this device. If the SignMitra server is connected, request details may be sent to it.</div>
      </div>

      <div className="print:hidden flex flex-col min-h-screen w-full">
        {/* Top bar */}
        <div className={`w-full border-b py-2.5 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
          <div className="flex items-center gap-3">
            {step === 'need' || stack.length === 0 ? (
              <Link
                href="/healthcare"
                className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Link>
            ) : (
              <button
                onClick={goBack}
                className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            {(counterLabel || orgLabel) && (
              <>
                <span className="opacity-40 hidden sm:inline">/</span>
                <span className="opacity-80 hidden sm:inline font-bold uppercase">
                  {counterLabel}
                  {orgLabel ? ` · ${orgLabel}` : ''}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleSimpleLanguage}
              aria-label="Toggle Simple Text"
              title="Toggle Simple Text"
              className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all ${
                isSimpleLanguage ? 'bg-[#655A7C] text-[#FDF1E2] border-[#655A7C]' : ''
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span className="font-bold hidden sm:inline">{isSimpleLanguage ? 'Simple On' : 'Simple Text'}</span>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme Mode"
              className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
            >
              {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
            </button>
          </div>
        </div>

        {/* Share & Export modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 rounded-2xl border ${borderTone} ${bgCanvas} shadow-2xl space-y-5`}>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {shareTarget === 'receipt' ? 'Save Record' : 'Export Card'}
                </h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80`}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}>
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Privacy Warning
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Before exporting, check that nothing private (passwords, PINs, ID numbers) is included. If you export to PDF or share
                  with another app, this text leaves the local SignMitra sandbox.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleNativeShare}
                  className={`p-4 rounded-xl border ${borderTone} ${cardBg} hover:border-[#655A7C] transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm`}
                >
                  <Share2 className="w-6 h-6 mb-1 opacity-80" />
                  Share Text
                </button>
                <button
                  onClick={handlePrintPDF}
                  className={`p-4 rounded-xl border ${borderTone} ${cardBg} hover:border-[#655A7C] transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm`}
                >
                  <Printer className="w-6 h-6 mb-1 opacity-80" />
                  Save as PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Large text overlay */}
        {isLargeTextMode && (
          <div className={`fixed inset-0 z-[100] flex flex-col ${bgCanvas} ${textPrimary} p-6 sm:p-12 overflow-y-auto`}>
            <div className="flex justify-between items-center mb-12">
              <span className={`text-xs font-mono font-bold uppercase tracking-widest opacity-80 px-3 py-1 rounded-full border ${borderTone}`}>
                SignMitra High-Visibility Mode
              </span>
              <button
                onClick={() => setIsLargeTextMode(false)}
                className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
                aria-label="Close large text"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>
            <div className="my-auto">
              <p className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight whitespace-pre-line tracking-tight">{cardText}</p>
            </div>
          </div>
        )}

        {/* Urgent overlay */}
        {urgentOpen && (
          <div className={`fixed inset-0 z-[110] flex flex-col ${bgCanvas} ${textPrimary} p-6 sm:p-12 overflow-y-auto`}>
            <div className="flex justify-between items-center mb-10">
              <span className={`text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full ${accentSolid}`}>URGENT</span>
              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                  setUrgentOpen(false);
                }}
                className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
                aria-label="Close urgent card"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="my-auto space-y-8">
              <p className="text-4xl sm:text-6xl font-black leading-tight tracking-tight">
                I am Deaf.
                <br />I need medical help NOW.
                <br />Please call a doctor or nurse.
              </p>
              <button
                onClick={() => speakText('I am deaf. I need medical help now. Please call a doctor or nurse.')}
                className={`px-6 py-4 rounded-xl border ${borderTone} text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isSpeaking ? `${accentSolid} animate-pulse` : cardInnerBg
                }`}
              >
                <Volume2 className="w-5 h-5" />
                {isSpeaking ? 'Reading...' : 'Read aloud'}
              </button>
            </div>
          </div>
        )}

        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1">
          {/* Header */}
          <header className={`rounded-xl border ${borderTone} p-5 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${cardBg}`}>
            <div>
              <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
                <Sparkles className="w-3.5 h-3.5" />
                Hospital help
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.1]">
                {step === 'need' && 'What do you need today?'}
                {step === 'detail' && flow && titleFor(intent, normalize(intent, answers))}
                {step === 'review' && 'Your card is ready'}
                {step === 'handoff' && 'Show this to the staff'}
                {step === 'done' && 'All done'}
              </h1>
              <p className={`text-xs sm:text-sm mt-1 max-w-xl font-medium ${textSecondary}`}>
                {step === 'need' && 'Tap one. No typing needed.'}
                {step === 'detail' && 'Tap your answers. Only the first questions are needed.'}
                {step === 'review' && 'Check the card. Then show it to the staff.'}
                {step === 'handoff' && 'Staff: please reply using the buttons below.'}
                {step === 'done' && 'Here is what the staff said.'}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded border ${borderTone} ${cardInnerBg} uppercase tracking-wider`}>
                {step === 'done' ? 'Done' : `Step ${stepNumber} of 3`}
              </span>
              {step !== 'need' && step !== 'done' && (
                <button
                  onClick={() => {
                    if (confirm(isSimpleLanguage ? 'Cancel this request?' : 'Cancel this request and start over?')) resetAll();
                  }}
                  className={`p-2 rounded-lg border ${borderTone} hover:opacity-80 transition-all ${cardInnerBg}`}
                  title="Cancel"
                  aria-label="Cancel request"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>

          {/* STEP 1: need */}
          {step === 'need' && (
            <div className="space-y-6">
              <button
                onClick={() => setUrgentOpen(true)}
                className={`w-full p-5 rounded-xl border-2 border-[#655A7C] ${accentSolid} flex items-center justify-between font-black text-base sm:text-lg uppercase tracking-wide shadow-sm active:scale-[0.99] transition-all`}
              >
                <span className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6" />
                  I need urgent help
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* TWO-WAY AI-ASSISTED CONVERSATION SECTION (VISIBLE IMMEDIATELY) */}
              {renderConversationSection()}

              {/* Standard Guided Requests Divider */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 border-t opacity-30" style={{ borderColor: isDarkTheme ? '#AB92BF' : '#655A7C' }} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-75">
                    Or choose a standard request
                  </span>
                  <div className="h-px flex-1 border-t opacity-30" style={{ borderColor: isDarkTheme ? '#AB92BF' : '#655A7C' }} />
                </div>

              {!needId && historyList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">Same as last time</p>
                    <button
                      onClick={clearSavedHistory}
                      className="text-[11px] font-mono font-bold uppercase tracking-wider opacity-70 hover:opacity-100 underline"
                    >
                      Clear saved
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {historyList.slice(0, 3).map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => repeatRecord(rec)}
                        className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} text-left hover:border-[#655A7C] transition-all`}
                      >
                        <span className="flex items-center gap-2 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{rec.title}</span>
                        </span>
                        <span className={`block text-[11px] mt-1 truncate ${textSecondary}`}>{rec.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!needId && (
                <div className="grid grid-cols-2 gap-3">
                  {NEEDS.map((n) => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.id}
                        onClick={() => (n.options ? setNeedId(n.id) : startFlow(n.intent))}
                        className={`p-4 sm:p-5 rounded-xl border ${borderTone} ${cardBg} text-left flex flex-col gap-3 hover:border-[#655A7C] active:scale-[0.98] transition-all shadow-sm`}
                      >
                        <span className={`w-11 h-11 rounded-lg flex items-center justify-center ${accentSolid}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span>
                          <span className="block text-base font-black leading-tight">{n.title}</span>
                          <span className={`block text-xs mt-1 ${textSecondary}`}>{n.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {needId && (
                <div className="space-y-3">
                  <button
                    onClick={() => setNeedId(null)}
                    className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 hover:opacity-100 inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> All options
                  </button>
                  {NEEDS.find((n) => n.id === needId).options.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => startFlow(o.intent, o.preset || {})}
                      className={`w-full p-5 rounded-xl border ${borderTone} ${cardBg} text-left font-black text-base flex items-center justify-between hover:border-[#655A7C] active:scale-[0.99] transition-all`}
                    >
                      {o.label}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* STEP 2: details (taps) */}
          {step === 'detail' && flow && (
            <form onSubmit={submitDetails} className={`p-5 sm:p-7 rounded-xl border ${borderTone} shadow-sm space-y-6 ${cardBg}`}>
              {flow.questions.map(renderQuestion)}
              <button
                type="submit"
                className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-wider shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 ${accentSolid}`}
              >
                <span>{isSimpleLanguage ? 'Create card' : 'Make my card'}</span>
                <FileText className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3a: review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className={`p-6 sm:p-7 rounded-xl border ${borderTone} space-y-4 shadow-sm ${cardBg}`}>
                <div className="flex items-center justify-between border-b pb-3.5" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${borderTone} ${cardInnerBg} inline-block`}>
                    Your card
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openShare('card')}
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${borderTone} hover:opacity-80 transition-all flex items-center gap-1 bg-transparent`}
                      title="Export or share card"
                    >
                      <Share2 className="w-3 h-3" /> <span className="hidden sm:inline">Export</span>
                    </button>
                    <span className="text-[11px] font-mono font-bold opacity-75">Ready to show</span>
                  </div>
                </div>

                {isEditingCard ? (
                  <textarea
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    className={`w-full p-4 font-black text-lg sm:text-xl leading-relaxed border rounded-xl outline-none ${cardInnerBg} ${borderTone} focus:border-[#655A7C] transition-all`}
                    rows={7}
                  />
                ) : (
                  <p className="text-lg sm:text-xl font-black leading-relaxed whitespace-pre-line">"{cardText}"</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  {AI_POLISH_ENABLED && (
                    <button
                      onClick={polishWithAI}
                      disabled={isPolishing}
                      className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded border ${borderTone} ${cardInnerBg} hover:opacity-80`}
                    >
                      {isPolishing ? 'Working...' : 'Make it simpler (AI)'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingCard(!isEditingCard)}
                    className={`text-xs font-mono font-bold uppercase tracking-wider transition-all hover:opacity-100 ${
                      isEditingCard ? `opacity-100 ${accentSolid} px-3 py-1.5 rounded` : 'opacity-70'
                    }`}
                  >
                    {isEditingCard ? 'Save edits' : 'Edit text'}
                  </button>
                </div>
              </div>

              {/* Clarity check */}
              <div className={`p-5 rounded-xl border ${borderTone} ${cardInnerBg} shadow-sm`}>
                <button
                  onClick={() => setShowA11yCheck(!showA11yCheck)}
                  className="w-full flex items-center justify-between font-bold text-xs sm:text-sm uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Quick clarity check
                  </div>
                  {showA11yCheck ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                {showA11yCheck && (
                  <div className="mt-4 space-y-3 pt-4 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                    <label className="flex items-start gap-3">
                      <input type="checkbox" checked={cardText.split(/\s+/).filter(Boolean).length < 40} readOnly className="mt-1 w-4 h-4 accent-[#655A7C]" />
                      <div>
                        <span className="font-bold text-sm block">Is it short and clear? (Under 40 words)</span>
                        <span className="text-xs opacity-70">Current word count: {cardText.split(/\s+/).filter(Boolean).length}. Shorter is better.</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={a11yChecks.action}
                        onChange={(e) => setA11yChecks({ ...a11yChecks, action: e.target.checked })}
                        className="mt-1 w-4 h-4 accent-[#655A7C]"
                      />
                      <div>
                        <span className="font-bold text-sm block">Is the next action obvious?</span>
                        <span className="text-xs opacity-70">Make sure the staff knows exactly what you want them to do.</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={a11yChecks.jargon}
                        onChange={(e) => setA11yChecks({ ...a11yChecks, jargon: e.target.checked })}
                        className="mt-1 w-4 h-4 accent-[#655A7C]"
                      />
                      <div>
                        <span className="font-bold text-sm block">Are abbreviations explained?</span>
                        <span className="text-xs opacity-70">Avoid complex medical words if possible.</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={goBack}
                  className={`sm:w-1/3 py-4 rounded-lg border ${borderTone} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all ${cardBg}`}
                >
                  ← Change answers
                </button>
                <button
                  onClick={() => go('handoff')}
                  className={`sm:w-2/3 py-4 rounded-lg font-bold text-sm uppercase tracking-wider shadow-sm transition-all hover:opacity-90 ${accentSolid}`}
                >
                  {isSimpleLanguage ? 'Show to staff →' : 'Show to staff →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3b: handoff, staff replies */}
          {step === 'handoff' && (
            <div className="space-y-6">
              <div className={`p-2.5 rounded-xl border ${borderTone} flex items-center justify-between shadow-sm ${cardInnerBg}`}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 opacity-70">Communicate via:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLargeTextMode(true)}
                    className={`px-3 py-1.5 rounded-lg border ${borderTone} ${cardBg} text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-all flex items-center gap-1.5`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Large text</span>
                  </button>
                  <button
                    onClick={() => speakText(cardText)}
                    className={`px-3 py-1.5 rounded-lg border ${borderTone} text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      isSpeaking ? `${accentSolid} animate-pulse` : `${cardBg} hover:opacity-80`
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isSpeaking ? 'Reading...' : 'Read aloud'}</span>
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${borderTone} text-center font-bold text-xs sm:text-sm bg-[#AB92BF]/25 shadow-sm`}>
                👋 Hand this device across the counter to the receptionist or staff member.
              </div>

              <div className={`p-6 sm:p-7 rounded-xl border ${borderTone} space-y-3 shadow-sm ${cardInnerBg}`}>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${borderTone} ${cardBg} inline-block`}>
                  {isSimpleLanguage ? 'Message for you' : 'Message from the patient'}
                </span>
                <p className="text-xl sm:text-2xl font-black leading-snug whitespace-pre-line">"{cardText}"</p>
              </div>

              {/* Staff section */}
              {!guard && (
                <div className="space-y-4">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-85">
                    Staff: how can you help? Tap one.
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {REPLY_TYPES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setReplyType(r.id);
                          setReplyFields({});
                          setReplyError('');
                          if (r.fields.length === 0) {
                            const { text, facts } = r.build({});
                            finalizeReply(text, facts, false);
                          }
                        }}
                        className={`p-4 rounded-xl border text-sm font-black text-left transition-all active:scale-[0.98] ${
                          replyType === r.id ? `${accentSolid} border-transparent` : `${cardBg} ${borderTone} hover:border-[#655A7C]`
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {currentReplyType && currentReplyType.fields.length > 0 && (
                    <div className={`p-5 rounded-xl border ${borderTone} ${cardBg} space-y-4`}>
                      {currentReplyType.fields.map((f) => (
                        <div key={f.id} className="space-y-1.5">
                          <label className="text-xs font-mono font-bold uppercase tracking-wider block">
                            {f.label} {f.required && <span className="opacity-70">*</span>}
                          </label>
                          <input
                            type={f.type}
                            value={replyFields[f.id] || ''}
                            onChange={(e) => setReplyFields((p) => ({ ...p, [f.id]: e.target.value }))}
                            onClick={(e) => {
                              if (f.type === 'date' || f.type === 'time') e.target.showPicker?.();
                            }}
                            placeholder={f.placeholder || ''}
                            className={inputClass}
                            inputMode={f.type === 'number' ? 'numeric' : undefined}
                          />
                        </div>
                      ))}
                      {replyError && <p className="text-[11px] font-mono font-bold">{replyError}</p>}
                      <button
                        onClick={submitStructuredReply}
                        className={`w-full py-3.5 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${accentSolid}`}
                      >
                        Send reply <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Write a note */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-85">Or type a written note:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={isSimpleLanguage ? 'Type here...' : 'Type official reply or desk number...'}
                        className={`${inputClass} flex-1`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitFreeReply(noteText);
                        }}
                      />
                      <button
                        onClick={() => submitFreeReply(noteText)}
                        className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 flex items-center gap-1.5 ${accentSolid}`}
                      >
                        <span>Confirm</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick replies */}
                  <div>
                    <button
                      onClick={() => setShowQuick(!showQuick)}
                      className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 hover:opacity-100"
                    >
                      {showQuick ? 'Hide quick replies' : 'More quick replies'}
                    </button>
                    {showQuick && (
                      <div className="grid grid-cols-1 gap-2.5 mt-3">
                        {staffQuickOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => submitFreeReply(option)}
                            className={`w-full text-left p-4 rounded-xl font-bold text-xs sm:text-sm border transition-all ${cardBg} ${borderTone} hover:border-[#655A7C] active:scale-[0.99]`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TWO-WAY AI-ASSISTED CONVERSATION SECTION */}
              {renderConversationSection()}

              {/* Vague reply guard */}
              {guard && (
                <div className={`p-5 sm:p-6 rounded-xl border-2 border-[#655A7C] ${cardBg} space-y-4`}>
                  <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                    <ShieldAlert className="w-5 h-5" />
                    The patient needs exact details
                  </div>
                  <p className="text-sm font-bold">Your reply: "{guard.text}"</p>
                  <p className={`text-xs ${textSecondary}`}>
                    This could be misunderstood. Please add the missing detail so the patient does not have to return again.
                  </p>
                  {guard.issues.includes('time') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider block">What exact time?</label>
                      <input
                        type="time"
                        value={guard.time}
                        onChange={(e) => setGuard((g) => ({ ...g, time: e.target.value, error: '' }))}
                        onClick={(e) => e.target.showPicker?.()}
                        className={inputClass}
                      />
                    </div>
                  )}
                  {guard.issues.includes('place') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider block">Which counter or room number?</label>
                      <input
                        type="text"
                        value={guard.place}
                        onChange={(e) => setGuard((g) => ({ ...g, place: e.target.value, error: '' }))}
                        placeholder="e.g., Records Desk, Counter 4"
                        className={inputClass}
                      />
                    </div>
                  )}
                  {guard.issues.includes('fee') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider block">How much exactly (₹)?</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={guard.amount}
                        onChange={(e) => setGuard((g) => ({ ...g, amount: e.target.value, error: '' }))}
                        placeholder="e.g., 250"
                        className={inputClass}
                      />
                    </div>
                  )}
                  {guard.error && <p className="text-[11px] font-mono font-bold">{guard.error}</p>}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={applyGuardFix}
                      className={`sm:w-2/3 py-3.5 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${accentSolid}`}
                    >
                      Add details and send <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => finalizeReply(guard.text, [], true)}
                      className={`sm:w-1/3 py-3.5 rounded-lg border ${borderTone} font-bold text-xs uppercase tracking-wider hover:opacity-80 ${cardInnerBg}`}
                    >
                      Send anyway
                    </button>
                  </div>
                  <button
                    onClick={() => setGuard(null)}
                    className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 hover:opacity-100"
                  >
                    ← Edit my reply
                  </button>
                </div>
              )}

              <button
                onClick={goBack}
                className={`w-full border border-dashed ${borderTone} py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider hover:opacity-80 transition-all ${cardBg}`}
              >
                ← Return device to patient
              </button>
            </div>
          )}

          {/* STEP 4: done */}
          {step === 'done' && reply && (
            <div className="space-y-6 py-2">
              <div className="text-center space-y-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-sm ${accentSolid}`}>
                  <Check className="w-7 h-7" />
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${borderTone} max-w-xl mx-auto space-y-5 shadow-sm ${cardBg}`}>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">What the staff said</span>
                  <p className="text-xl sm:text-2xl font-black leading-snug">{reply.text}</p>
                  <p className={`text-[11px] font-mono mt-2 ${textSecondary}`}>
                    Reported by the staff member. SignMitra has not checked this against hospital records.
                  </p>
                </div>

                {reply.facts.length > 0 && (
                  <div className="border-t pt-4 space-y-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">Confirmed details</span>
                    <ul className="space-y-1.5">
                      {reply.facts.map((f) => (
                        <li key={f.label} className="flex justify-between gap-4 text-sm sm:text-base font-black">
                          <span className="opacity-70">{f.label}</span>
                          <span className="text-right">{f.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reply.override && (
                  <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-bold`}>
                    This reply was not fully specific. If you are unsure, tap "Not fully" below and ask again.
                  </div>
                )}

                <div className="border-t pt-4" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">Saved summary</span>
                  <p className={`text-xs sm:text-sm font-medium leading-relaxed ${textSecondary}`}>
                    {flow.summary(normalize(intent, answers), reply.text)}
                  </p>
                </div>
              </div>

              <div className={`p-5 rounded-xl border ${borderTone} max-w-xl mx-auto ${cardInnerBg} space-y-3`}>
                <p className="text-sm font-black">Did you understand everything?</p>
                {understood === null ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => markUnderstood(true)} className={`py-3 rounded-lg font-bold text-sm ${accentSolid}`}>
                      Yes, I understand
                    </button>
                    <button onClick={() => markUnderstood(false)} className={`py-3 rounded-lg border ${borderTone} font-bold text-sm ${cardBg} hover:border-[#655A7C]`}>
                      Not fully
                    </button>
                  </div>
                ) : (
                  <p className={`text-xs font-mono font-bold ${textSecondary}`}>Thank you. Your answer is saved.</p>
                )}
              </div>

              {chatMessages.length > 0 && (
                <div className={`p-5 rounded-xl border ${borderTone} max-w-xl mx-auto space-y-3 ${cardBg}`}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">
                    <MessageSquare className="w-3 h-3 inline mr-1" />Conversation transcript
                  </span>
                  <div className={`rounded-lg border ${borderTone} ${cardInnerBg} p-3 max-h-48 overflow-y-auto space-y-3`}>
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.role === 'staff' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-60">
                          {msg.role === 'patient' ? 'Patient' : 'Staff'} • {msg.timestamp}
                        </span>
                        <span
                          className={`inline-block max-w-[85%] px-3 py-2 rounded-xl text-sm font-bold leading-snug ${
                            msg.role === 'staff'
                              ? 'bg-[#655A7C] text-[#FDF1E2]'
                              : 'bg-[#AB92BF]/30 text-inherit'
                          }`}
                        >
                          {msg.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto">
                <button
                  onClick={() => openShare('receipt')}
                  className={`flex-1 px-6 py-3 rounded-lg border ${borderTone} ${cardBg} text-xs font-bold uppercase tracking-wider hover:border-[#655A7C] inline-flex items-center justify-center gap-2`}
                >
                  <Share2 className="w-4 h-4" /> Save or share record
                </button>
                <button
                  onClick={resetAll}
                  className={`flex-1 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-all ${accentSolid}`}
                >
                  Start something new
                </button>
              </div>
              <div className="text-center">
                <Link href="/healthcare" className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 hover:opacity-100">
                  Return to healthcare
                </Link>
              </div>
            </div>
          )}
        </main>

        <footer className={`border-t py-5 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg} mb-12 sm:mb-0`}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
            <p className="font-bold">SignMitra • Hospital help</p>
            <p className="opacity-70">An assistive tool, not a certified interpreter.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function GuidedHealthcarePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-wider bg-[#FDF1E2] text-[#655A7C] animate-pulse">
          Loading SignMitra...
        </div>
      }
    >
      <GuidedBody />
    </Suspense>
  );
}