'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sun,
  Moon,
  Activity,
  Play,
  Square,
  Sparkles,
  BarChart3,
  Clock,
  CheckCircle2,
  Trash2,
  Download,
  AlertTriangle,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  UserCheck,
  BookOpen,
  Sliders,
  TrendingDown,
  Info,
  Scale
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

const RESEARCH_PROTOCOLS = {
  'Healthcare: Specialist Booking': {
    domain: 'Healthcare',
    rules: 'Participant must specify specialty, preferred date, and follow-up reason without external verbal cues.',
    fidelityItems: [
      'Preserved medical specialty / target doctor',
      'Accurate appointment date and timeframe requested',
      'Chief clinical complaint / visit reason communicated',
      'Alternative slot preference selected without loss of intent'
    ]
  },
  'Healthcare: Explaining Symptoms': {
    domain: 'Healthcare',
    rules: 'Participant must communicate symptom location, onset time, pain severity, and current medications.',
    fidelityItems: [
      'Anatomical location of symptom communicated accurately',
      'Symptom duration and severity quantified',
      'Relevant pre-existing conditions or medications stated'
    ]
  },
  'Banking: Block Damaged Card': {
    domain: 'Banking',
    rules: 'Participant must identify account/card, verify reason for block, and confirm delivery address.',
    fidelityItems: [
      'Specific debit/credit card identifier isolated',
      'Reason for emergency card lock stated clearly',
      'Replacement card dispatch address verified'
    ]
  },
  'Education: Dispute Absence Mark': {
    domain: 'Education',
    rules: 'Participant must reference course code, disputed lecture date, and reason with medical certificate.',
    fidelityItems: [
      'Specific course code and lecture timestamp specified',
      'Reason for absence or institutional leave notice referenced',
      'Proof attachment or medical cert notice logged'
    ]
  }
};

const METRIC_DEFINITIONS = [
  {
    name: 'Task Completion Time (Seconds)',
    formula: 't_end - t_start',
    description: 'Wall-clock duration from initial stimulus presentation to final confirmation tap or written sign-off.'
  },
  {
    name: 'Interaction Steps / Hops',
    formula: 'Count of Discrete Turn Transitions',
    description: 'Each button tap, forward progression, or conversational turn taken to complete the task manifest.'
  },
  {
    name: 'Message Fidelity (%)',
    formula: '(Observed Preserved Criteria / Total Prescribed Criteria) * 100',
    description: 'Objective checklist scoring whether core clinical or administrative meaning was preserved without semantic loss.'
  },
  {
    name: 'Validation Errors',
    formula: 'Count of Invalid Submissions',
    description: 'Instances where missing mandatory fields, format mismatches, or schema errors prevented transition.'
  },
  {
    name: 'Manual Recovery Hops',
    formula: 'Count of Back / Edit Events',
    description: 'Intentional evaluator-observed corrections where the participant triggered navigation back to rectify an entry.'
  },
  {
    name: 'Funnel Milestone Retention',
    formula: 'Passing Participants at Stage / Initial Starters',
    description: 'Quantifies cumulative task progression across Started -> Info Collected -> Reviewed -> Confirmed -> Completed.'
  }
];

export default function EmpiricalDashboard() {
  const {
    isDarkTheme,
    toggleTheme,
    bgCanvas,
    textPrimary,
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid
  } = useTheme();

  // Active Experiment Configuration
  const [activeExperiment, setActiveExperiment] = useState({
    participantId: 'P-01',
    scenarioName: 'Healthcare: Specialist Booking',
    method: 'SignMitra',
    counterbalanceOrder: 'SignMitra First', // 'SignMitra First' | 'Paper First'
    interactionCount: 3,
    errorCount: 0,
    correctionCount: 0,
    funnelDropPoint: 'Completed',
    usabilityEase: 4,
    usabilityConfidence: 5,
    usabilityFrustration: 1,
    fidelityChecks: [true, true, true, true],
    notes: ''
  });

  const [evaluationLogs, setEvaluationLogs] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeModal, setActiveModal] = useState(null); // 'protocols' | 'definitions' | null

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('signmitra_empirical_research_ledger_v4');
    if (saved) {
      setEvaluationLogs(JSON.parse(saved));
    } else {
      // Indicative baseline dataset (explicitly tagged as pilot seeds)
      const pilotSeed = [
        {
          id: 1001,
          participantId: 'P-01',
          scenarioName: 'Healthcare: Specialist Booking',
          method: 'SignMitra',
          counterbalanceOrder: 'SignMitra First',
          durationSeconds: 38,
          interactionCount: 4,
          errorCount: 0,
          correctionCount: 0,
          funnelDropPoint: 'Completed',
          usabilityEase: 5,
          usabilityConfidence: 5,
          usabilityFrustration: 1,
          fidelityPreserved: 4,
          fidelityTotal: 4,
          fidelityRate: 100,
          isPilotSeed: true,
          timestamp: 'Pilot Seed #01'
        },
        {
          id: 1002,
          participantId: 'P-01',
          scenarioName: 'Healthcare: Specialist Booking',
          method: 'Traditional Text',
          counterbalanceOrder: 'SignMitra First',
          durationSeconds: 114,
          interactionCount: 7,
          errorCount: 2,
          correctionCount: 3,
          funnelDropPoint: 'Completed',
          usabilityEase: 2,
          usabilityConfidence: 3,
          usabilityFrustration: 4,
          fidelityPreserved: 3,
          fidelityTotal: 4,
          fidelityRate: 75,
          isPilotSeed: true,
          timestamp: 'Pilot Seed #02'
        },
        {
          id: 1003,
          participantId: 'P-02',
          scenarioName: 'Banking: Block Damaged Card',
          method: 'SignMitra',
          counterbalanceOrder: 'Paper First',
          durationSeconds: 42,
          interactionCount: 3,
          errorCount: 0,
          correctionCount: 1,
          funnelDropPoint: 'Completed',
          usabilityEase: 4,
          usabilityConfidence: 5,
          usabilityFrustration: 1,
          fidelityPreserved: 3,
          fidelityTotal: 3,
          fidelityRate: 100,
          isPilotSeed: true,
          timestamp: 'Pilot Seed #03'
        },
        {
          id: 1004,
          participantId: 'P-02',
          scenarioName: 'Banking: Block Damaged Card',
          method: 'Traditional Text',
          counterbalanceOrder: 'Paper First',
          durationSeconds: 130,
          interactionCount: 6,
          errorCount: 1,
          correctionCount: 2,
          funnelDropPoint: 'Completed',
          usabilityEase: 2,
          usabilityConfidence: 2,
          usabilityFrustration: 4,
          fidelityPreserved: 2,
          fidelityTotal: 3,
          fidelityRate: 67,
          isPilotSeed: true,
          timestamp: 'Pilot Seed #04'
        }
      ];
      setEvaluationLogs(pilotSeed);
      localStorage.setItem('signmitra_empirical_research_ledger_v4', JSON.stringify(pilotSeed));
    }
  }, []);

  // Live Stopwatch
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => setSecondsElapsed((p) => p + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Sync fidelity checklist size when scenario changes
  useEffect(() => {
    const defaultChecks = new Array(
      RESEARCH_PROTOCOLS[activeExperiment.scenarioName]?.fidelityItems.length || 3
    ).fill(true);
    setActiveExperiment((prev) => ({ ...prev, fidelityChecks: defaultChecks }));
  }, [activeExperiment.scenarioName]);

  const startLiveTask = () => {
    setSecondsElapsed(0);
    setTimerActive(true);
  };

  const endLiveTask = () => {
    setTimerActive(false);

    const checkedCount = activeExperiment.fidelityChecks.filter(Boolean).length;
    const totalChecks = activeExperiment.fidelityChecks.length;
    const calculatedFidelity = Math.round((checkedCount / totalChecks) * 100);

    const newTrial = {
      ...activeExperiment,
      id: Date.now(),
      durationSeconds: secondsElapsed,
      fidelityPreserved: checkedCount,
      fidelityTotal: totalChecks,
      fidelityRate: calculatedFidelity,
      isPilotSeed: false,
      timestamp: new Date().toLocaleDateString()
    };

    const updated = [newTrial, ...evaluationLogs];
    setEvaluationLogs(updated);
    localStorage.setItem('signmitra_empirical_research_ledger_v4', JSON.stringify(updated));
  };

  const clearAllTrials = () => {
    if (confirm('Reset entire empirical study ledger? This clears all recorded trials.')) {
      localStorage.removeItem('signmitra_empirical_research_ledger_v4');
      setEvaluationLogs([]);
    }
  };

  // Comprehensive Research CSV Export Package (Feature 11)
  const exportResearchReport = () => {
    if (evaluationLogs.length === 0) return;
    const metaHeader = '# SignMitra Empirical Research Export v4\n# Scope: Pilot Evaluation Trial Ledger (Excluded artifacts < 5s)\n# Disclaimer: Self-reported & evaluator-observed task metrics\n';
    const headers =
      'Record_Class,Trial_ID,Participant_ID,Scenario_Name,Method,Assigned_Order,Duration_Seconds,Interaction_Hops,Validation_Errors,Recovery_Corrections,Fidelity_Preserved,Fidelity_Total,Fidelity_Pct,Drop_Milestone,Ease_Score,Confidence_Score,Frustration_Score,Timestamp\n';

    const rows = evaluationLogs
      .map(
        (log) =>
          `"${log.isPilotSeed ? 'PILOT_DEMO_SEED' : log.durationSeconds < 5 ? 'TEST_ARTIFACT' : 'LIVE_RECORDED_TRIAL'}","${log.id}","${log.participantId}","${log.scenarioName}","${log.method}","${log.counterbalanceOrder}",${log.durationSeconds},${log.interactionCount},${log.errorCount || 0},${log.correctionCount || 0},${log.fidelityPreserved || 0},${log.fidelityTotal || 0},${log.fidelityRate || 100},"${log.funnelDropPoint}","${log.usabilityEase}","${log.usabilityConfidence}","${log.usabilityFrustration}","${log.timestamp}"`
      )
      .join('\n');

    const blob = new Blob([metaHeader + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SignMitra_Research_Evaluation_Dataset_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistical Calculators with Distribution Ranges (Excludes Test Artifacts < 5s)
  const calculateMethodStats = (methodName) => {
    const trials = evaluationLogs.filter(
      (l) => l.method === methodName && (l.durationSeconds >= 5 || l.isPilotSeed)
    );

    if (trials.length === 0) {
      return {
        time: 0,
        medianTime: 0,
        minTime: 0,
        maxTime: 0,
        steps: 0,
        errors: 0,
        corrections: 0,
        fidelity: 0,
        ease: 0,
        frustration: 0,
        count: 0
      };
    }

    const times = trials.map((t) => t.durationSeconds).sort((a, b) => a - b);
    const median =
      times.length % 2 === 0
        ? ((times[times.length / 2 - 1] + times[times.length / 2]) / 2).toFixed(1)
        : times[Math.floor(times.length / 2)].toFixed(1);

    const avgTime = (trials.reduce((acc, t) => acc + t.durationSeconds, 0) / trials.length).toFixed(1);
    const avgSteps = (trials.reduce((acc, t) => acc + t.interactionCount, 0) / trials.length).toFixed(1);
    const avgErrors = (trials.reduce((acc, t) => acc + (t.errorCount || 0), 0) / trials.length).toFixed(1);
    const avgCorrections = (trials.reduce((acc, t) => acc + (t.correctionCount || 0), 0) / trials.length).toFixed(1);

    // Accurate mathematical fidelity weighted across checklist criteria
    const totalPreserved = trials.reduce((acc, t) => acc + (t.fidelityPreserved || 0), 0);
    const totalPossible = trials.reduce((acc, t) => acc + (t.fidelityTotal || 0), 0);
    const avgFidelity = totalPossible > 0 ? Math.round((totalPreserved / totalPossible) * 100) : 100;

    const avgEase = (trials.reduce((acc, t) => acc + (t.usabilityEase || 3), 0) / trials.length).toFixed(1);
    const avgFrustration = (trials.reduce((acc, t) => acc + (t.usabilityFrustration || 2), 0) / trials.length).toFixed(1);

    return {
      time: avgTime,
      medianTime: median,
      minTime: times[0],
      maxTime: times[times.length - 1],
      steps: avgSteps,
      errors: avgErrors,
      corrections: avgCorrections,
      fidelity: avgFidelity,
      ease: avgEase,
      frustration: avgFrustration,
      count: trials.length
    };
  };

  const smStats = calculateMethodStats('SignMitra');
  const paperStats = calculateMethodStats('Traditional Text');

  // Study Accounting Breakdowns
  const uniqueParticipantsCount = new Set(evaluationLogs.map((l) => l.participantId)).size;
  const uniqueScenariosEvaluated = new Set(evaluationLogs.map((l) => l.scenarioName)).size;
  const totalScenariosAvailable = Object.keys(RESEARCH_PROTOCOLS).length;

  // Counterbalance Adherence Auditing (Requires Trials On Both Methods)
  const smFirstCount = evaluationLogs.filter((l) => l.counterbalanceOrder === 'SignMitra First').length;
  const paperFirstCount = evaluationLogs.filter((l) => l.counterbalanceOrder === 'Paper First').length;
  const smTrialsCount = evaluationLogs.filter((l) => l.method === 'SignMitra').length;
  const paperTrialsCount = evaluationLogs.filter((l) => l.method === 'Traditional Text').length;

  const counterbalanceBalanced =
    smTrialsCount > 0 &&
    paperTrialsCount > 0 &&
    Math.abs(smFirstCount - paperFirstCount) <= 1 &&
    Math.abs(smTrialsCount - paperTrialsCount) <= 1;

  // Dynamic Evaluated Domains List
  const evaluatedDomains = Array.from(
    new Set(
      evaluationLogs.map((l) => RESEARCH_PROTOCOLS[l.scenarioName]?.domain).filter(Boolean)
    )
  );
  const evaluatedDomainsLabel =
    evaluatedDomains.length > 0 ? evaluatedDomains.join(' & ') : 'None';

  // Data Quality Flags (Feature 10)
  const isSampleSmall = evaluationLogs.length < 10;
  const parityDiscrepancy = Math.abs(smStats.count - paperStats.count);
  const isParityUneven = parityDiscrepancy >= 2 && evaluationLogs.length > 0;

  // Funnel Milestones (Feature 1 - Excludes artifacts < 5s)
  const funnelStages = ['Started', 'Info Collected', 'Reviewed', 'Confirmed', 'Completed'];
  const calculateFunnelPassRate = (methodName, stage) => {
    const trials = evaluationLogs.filter(
      (l) => l.method === methodName && (l.durationSeconds >= 5 || l.isPilotSeed)
    );
    if (trials.length === 0) return 0;
    const stageIdx = funnelStages.indexOf(stage);
    const passed = trials.filter((t) => {
      const dropIdx = funnelStages.indexOf(t.funnelDropPoint || 'Completed');
      return dropIdx >= stageIdx;
    }).length;
    return Math.round((passed / trials.length) * 100);
  };

  // Diagnostics Accounting
  const dropOffTrials = evaluationLogs.filter((t) => t.funnelDropPoint && t.funnelDropPoint !== 'Completed');
  const totalErrorsRecorded = evaluationLogs.reduce((acc, t) => acc + (t.errorCount || 0), 0);
  const totalCorrectionsRecorded = evaluationLogs.reduce((acc, t) => acc + (t.correctionCount || 0), 0);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}
    >
      {/* Top Runtime Telemetry Bar */}
      <div
        className={`w-full border-b py-2.5 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">EVALUATION & INSIGHTS LAB</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-bold">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            />
            <span>STUDY ENGINE ACTIVE</span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
          >
            {isDarkTheme ? (
              <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#655A7C]" />
            )}
          </button>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 my-auto">
        {/* ========================================================================= */}
        {/* MODULE 01: STUDY OVERVIEW & EVIDENCE STATUS */}
        {/* ========================================================================= */}
        <header className={`rounded-xl border ${borderTone} p-6 sm:p-7 shadow-sm ${cardBg}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
            <div>
              <div
                className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}
              >
                <Activity className="w-3.5 h-3.5 text-[#655A7C]" />
                EMPIRICAL EVALUATION SUITE
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Evaluation & Insights Lab
              </h1>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${textSecondary}`}>
                Measure workflow latency, error propagation, message fidelity, and task completion funnels
                against manual handwriting baselines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveModal('definitions')}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border ${borderTone} ${cardInnerBg} hover:opacity-80 inline-flex items-center gap-1.5`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Metric Definitions</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('protocols')}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border ${borderTone} ${cardInnerBg} hover:opacity-80 inline-flex items-center gap-1.5`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Protocol Library</span>
              </button>
              <button
                type="button"
                onClick={exportResearchReport}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-sm hover:opacity-90 inline-flex items-center gap-1.5 ${accentSolid}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dataset (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Granular Study Overview Accounting (Dynamic Labels) */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <span className="opacity-70 text-[10px] block uppercase font-bold">Total Trial Records</span>
              <span className="text-lg font-black">{evaluationLogs.length} Runs</span>
              <span className="text-[10px] opacity-70 block mt-0.5">{uniqueParticipantsCount} Unique Participants</span>
            </div>
            <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <span className="opacity-70 text-[10px] block uppercase font-bold">Scenarios Evaluated</span>
              <span className="text-lg font-black">
                {uniqueScenariosEvaluated} / {totalScenariosAvailable} Tested
              </span>
              <span className="text-[10px] opacity-70 block mt-0.5">{evaluatedDomainsLabel}</span>
            </div>
            <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <span className="opacity-70 text-[10px] block uppercase font-bold">Method Distribution</span>
              <span className="text-lg font-black">
                {smStats.count} SM vs {paperStats.count} Paper
              </span>
              <span className="text-[10px] opacity-70 block mt-0.5">
                {counterbalanceBalanced
                  ? '✓ Counterbalanced'
                  : smStats.count === 0 || paperStats.count === 0
                  ? 'Single Method Active'
                  : '⚠ Uneven Assignment'}
              </span>
            </div>
            <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <span className="opacity-70 text-[10px] block uppercase font-bold">Evidence Integrity Status</span>
              <div className="flex items-center gap-1.5 mt-1 font-bold text-[11px]">
                {isSampleSmall ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#655A7C] shrink-0" />
                    <span>Pilot Phase (N &lt; 10)</span>
                  </>
                ) : isParityUneven ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#655A7C] shrink-0" />
                    <span>Method Asymmetry</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#655A7C] shrink-0" />
                    <span>Controlled Dataset</span>
                  </>
                )}
              </div>
              <span className="text-[10px] opacity-70 block mt-0.5">Seed demonstrations demarcated</span>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MODULE 02: SCENARIO EXPERIMENT RUNNER & MESSAGE FIDELITY CHECKLIST */}
        {/* ========================================================================= */}
        <section className={`p-6 sm:p-7 rounded-xl border ${borderTone} shadow-sm space-y-6 ${cardBg}`}>
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Live Scenario Trial Controller
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}>
              PROTOCOL EXECUTOR
            </span>
          </div>

          {/* Configuration Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider">Participant Identifier</label>
              <input
                type="text"
                value={activeExperiment.participantId}
                onChange={(e) =>
                  setActiveExperiment((p) => ({ ...p, participantId: e.target.value }))
                }
                className={`p-2.5 rounded-lg border font-bold outline-none ${cardInnerBg} ${borderTone}`}
                placeholder="e.g., P-04"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider">Target Task Scenario</label>
              <select
                value={activeExperiment.scenarioName}
                onChange={(e) =>
                  setActiveExperiment((p) => ({ ...p, scenarioName: e.target.value }))
                }
                className={`p-2.5 rounded-lg border font-bold outline-none ${cardInnerBg} ${borderTone}`}
              >
                {Object.keys(RESEARCH_PROTOCOLS).map((scn) => (
                  <option key={scn} value={scn} className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                    {scn}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider">Evaluated Methodology</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['SignMitra', 'Traditional Text'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveExperiment((p) => ({ ...p, method: m }))}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all ${
                      activeExperiment.method === m
                        ? accentSolid
                        : `${cardInnerBg} ${borderTone} opacity-70 hover:opacity-100`
                    }`}
                  >
                    {m === 'SignMitra' ? 'SignMitra' : 'Pen & Paper'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider">Assigned Task Order</label>
              <select
                value={activeExperiment.counterbalanceOrder}
                onChange={(e) =>
                  setActiveExperiment((p) => ({ ...p, counterbalanceOrder: e.target.value }))
                }
                className={`p-2.5 rounded-lg border font-bold outline-none ${cardInnerBg} ${borderTone}`}
              >
                <option value="SignMitra First" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  SignMitra First (Order A)
                </option>
                <option value="Paper First" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Paper First (Order B)
                </option>
              </select>
            </div>
          </div>

          {/* Counts & Funnel Drop-off Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-mono">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider">Interaction Steps Count</label>
              <input
                type="number"
                value={activeExperiment.interactionCount}
                onChange={(e) =>
                  setActiveExperiment((p) => ({ ...p, interactionCount: parseInt(e.target.value, 10) || 0 }))
                }
                className={`p-2.5 rounded-lg border font-bold outline-none text-center ${cardInnerBg} ${borderTone}`}
                min="1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider">Errors & Recovery Corrections</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={activeExperiment.errorCount}
                  onChange={(e) =>
                    setActiveExperiment((p) => ({ ...p, errorCount: parseInt(e.target.value, 10) || 0 }))
                  }
                  className={`p-2.5 rounded-lg border font-bold outline-none text-center ${cardInnerBg} ${borderTone}`}
                  placeholder="Validation Errors"
                  title="Missing or invalid field transitions"
                  min="0"
                />
                <input
                  type="number"
                  value={activeExperiment.correctionCount}
                  onChange={(e) =>
                    setActiveExperiment((p) => ({ ...p, correctionCount: parseInt(e.target.value, 10) || 0 }))
                  }
                  className={`p-2.5 rounded-lg border font-bold outline-none text-center ${cardInnerBg} ${borderTone}`}
                  placeholder="Recovery Hops"
                  title="Observed back/edit navigations"
                  min="0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider">Observed Funnel Drop-off</label>
              <select
                value={activeExperiment.funnelDropPoint}
                onChange={(e) =>
                  setActiveExperiment((p) => ({ ...p, funnelDropPoint: e.target.value }))
                }
                className={`p-2.5 rounded-lg border font-bold outline-none ${cardInnerBg} ${borderTone}`}
              >
                <option value="Completed" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Resolved (Completed Task)
                </option>
                <option value="Confirmed" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Dropped at: Confirmation Step
                </option>
                <option value="Reviewed" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Dropped at: Review Stage
                </option>
                <option value="Info Collected" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Dropped at: Information Collection
                </option>
                <option value="Started" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Dropped at: Task Initiation
                </option>
              </select>
            </div>
          </div>

          {/* Interactive Usability Ratings */}
          <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg} space-y-3`}>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#655A7C]" />
                Post-Task Participant Usability Feedback (1-5 Likert Scale)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="opacity-80">Perceived Ease</span>
                  <span className="font-bold">{activeExperiment.usabilityEase} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={activeExperiment.usabilityEase}
                  onChange={(e) =>
                    setActiveExperiment((p) => ({ ...p, usabilityEase: parseInt(e.target.value, 10) }))
                  }
                  className="accent-[#655A7C] cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="opacity-80">Confidence in Response</span>
                  <span className="font-bold">{activeExperiment.usabilityConfidence} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={activeExperiment.usabilityConfidence}
                  onChange={(e) =>
                    setActiveExperiment((p) => ({ ...p, usabilityConfidence: parseInt(e.target.value, 10) }))
                  }
                  className="accent-[#655A7C] cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="opacity-80">Cognitive Frustration</span>
                  <span className="font-bold">{activeExperiment.usabilityFrustration} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={activeExperiment.usabilityFrustration}
                  onChange={(e) =>
                    setActiveExperiment((p) => ({ ...p, usabilityFrustration: parseInt(e.target.value, 10) }))
                  }
                  className="accent-[#655A7C] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Exact Math Message Fidelity Checklist */}
          <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg} space-y-2.5`}>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#655A7C]" />
                Message Fidelity Checklist (Exact Semantic Preservation)
              </span>
              <span className="opacity-70 text-[10px] font-bold">
                {activeExperiment.fidelityChecks.filter(Boolean).length} of{' '}
                {activeExperiment.fidelityChecks.length} Criteria Preserved (
                {Math.round(
                  (activeExperiment.fidelityChecks.filter(Boolean).length /
                    activeExperiment.fidelityChecks.length) *
                    100
                )}
                %)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {RESEARCH_PROTOCOLS[activeExperiment.scenarioName]?.fidelityItems.map((item, idx) => (
                <label
                  key={idx}
                  className={`p-2 rounded border cursor-pointer flex items-start gap-2 transition-all ${
                    activeExperiment.fidelityChecks[idx] ? borderTone : 'opacity-50 border-dashed'
                  } ${cardBg}`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(activeExperiment.fidelityChecks[idx])}
                    onChange={(e) => {
                      const updated = [...activeExperiment.fidelityChecks];
                      updated[idx] = e.target.checked;
                      setActiveExperiment((p) => ({ ...p, fidelityChecks: updated }));
                    }}
                    className="mt-0.5 accent-[#655A7C]"
                  />
                  <span className="leading-snug text-[11px]">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clock Controller Bar */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-5 gap-4"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <div className="text-left font-mono">
              <span className="text-[10px] uppercase font-bold opacity-70 block">
                Live Stopwatch Recorder
              </span>
              <span className="text-3xl font-black tracking-tight">
                {secondsElapsed} <span className="text-xs font-bold opacity-70 uppercase">Seconds</span>
              </span>
            </div>

            <div className="flex gap-2.5 w-full sm:w-auto">
              {!timerActive ? (
                <button
                  type="button"
                  onClick={startLiveTask}
                  className={`w-full sm:w-auto py-3 px-6 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 ${accentSolid}`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Task Timer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={endLiveTask}
                  className={`w-full sm:w-auto py-3 px-6 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:opacity-90 border ${borderTone} ${cardInnerBg} flex items-center justify-center gap-2`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Complete & Record Trial</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MODULE 03: PERFORMANCE & TIME DISTRIBUTION */}
        {/* ========================================================================= */}
        <section className={`p-6 sm:p-7 rounded-xl border ${borderTone} shadow-sm ${cardBg}`}>
          <div
            className="flex items-center justify-between mb-4 border-b pb-3"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance, Reliability & Time Distribution Matrix
              </h2>
              <span className={`text-[10px] font-mono ${textSecondary}`}>
                Aggregated experimental benchmarks with exact checklist scoring and observable ranges (excludes artifacts &lt;5s).
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}>
              AGGREGATED TRIALS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className={`border-b ${borderTone} ${cardInnerBg}`}>
                  <th className="p-3 font-bold uppercase tracking-wider">Methodology</th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">Mean Duration</th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">Median (Range)</th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">Mean Hops</th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">Validation Errors (Fixes)</th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">Fidelity Score</th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">Ease / Frustration</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDarkTheme ? '#AB92BF20' : '#655A7C15' }}>
                <tr className="hover:opacity-90">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>SignMitra Platform (N={smStats.count})</span>
                  </td>
                  <td className="p-3 text-center font-bold">{smStats.time}s</td>
                  <td className="p-3 text-center font-bold">{smStats.medianTime}s ({smStats.minTime}-{smStats.maxTime}s)</td>
                  <td className="p-3 text-center font-bold">{smStats.steps} hops</td>
                  <td className="p-3 text-center font-bold">{smStats.errors} ({smStats.corrections})</td>
                  <td className="p-3 text-center font-black">{smStats.fidelity}%</td>
                  <td className="p-3 text-center font-bold">{smStats.ease} / {smStats.frustration}</td>
                </tr>
                <tr className="hover:opacity-90">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <span className="w-3.5 h-3.5 flex items-center justify-center font-mono">•</span>
                    <span>Traditional Text / Paper (N={paperStats.count})</span>
                  </td>
                  <td className="p-3 text-center font-bold">{paperStats.time}s</td>
                  <td className="p-3 text-center font-bold">{paperStats.medianTime}s ({paperStats.minTime}-{paperStats.maxTime}s)</td>
                  <td className="p-3 text-center font-bold">{paperStats.steps} hops</td>
                  <td className="p-3 text-center font-bold">{paperStats.errors} ({paperStats.corrections})</td>
                  <td className="p-3 text-center font-black">{paperStats.fidelity}%</td>
                  <td className="p-3 text-center font-bold">{paperStats.ease} / {paperStats.frustration}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MODULE 04: TASK COMPLETION FUNNEL & DOMAIN-LEVEL COMPARISON */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Completion Funnel */}
          <section className={`p-6 rounded-xl border ${borderTone} shadow-sm space-y-4 ${cardBg}`}>
            <div
              className="flex justify-between items-center border-b pb-3"
              style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
            >
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Workflow Progression Funnel
              </h3>
              <span className="text-[10px] font-mono opacity-70">Pass-Through %</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {funnelStages.map((stage) => {
                const smPass = calculateFunnelPassRate('SignMitra', stage);
                const paperPass = calculateFunnelPassRate('Traditional Text', stage);

                return (
                  <div key={stage} className={`p-2.5 rounded-lg border ${borderTone} ${cardInnerBg} space-y-1.5`}>
                    <div className="flex justify-between items-center font-bold">
                      <span>{stage}</span>
                      <span className="text-[11px] opacity-80">
                        SM: {smPass}% | Paper: {paperPass}%
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden border ${borderTone} ${cardBg}`}>
                      <div
                        className={`h-full ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`}
                        style={{ width: `${smPass}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Scenario-Level Comparison Breakdown */}
          <section className={`p-6 rounded-xl border ${borderTone} shadow-sm space-y-4 ${cardBg}`}>
            <div
              className="flex justify-between items-center border-b pb-3"
              style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
            >
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Scenario-Level Duration Breakdown
              </h3>
              <span className="text-[10px] font-mono opacity-70">Task Breakdown</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {Object.keys(RESEARCH_PROTOCOLS).map((scn) => {
                const scnTrials = evaluationLogs.filter(
                  (t) => t.scenarioName === scn && (t.durationSeconds >= 5 || t.isPilotSeed)
                );
                const smSub = scnTrials.filter((t) => t.method === 'SignMitra');
                const paperSub = scnTrials.filter((t) => t.method === 'Traditional Text');

                const smAvg = smSub.length
                  ? (smSub.reduce((acc, t) => acc + t.durationSeconds, 0) / smSub.length).toFixed(0)
                  : '—';
                const paperAvg = paperSub.length
                  ? (paperSub.reduce((acc, t) => acc + t.durationSeconds, 0) / paperSub.length).toFixed(0)
                  : '—';

                return (
                  <div key={scn} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} flex justify-between items-center`}>
                    <div>
                      <span className="font-bold block truncate max-w-[200px]">{scn}</span>
                      <span className="text-[10px] opacity-70">
                        {scnTrials.length > 0 ? `N = ${scnTrials.length} recorded runs` : 'No empirical runs yet'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs block">SM: {smAvg}s vs Paper: {paperAvg}s</span>
                      <span className="text-[10px] opacity-75">Mean Duration</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* MODULE 05: DIAGNOSTICS & BOTTLENECK INSIGHTS */}
        {/* ========================================================================= */}
        <section className={`p-6 rounded-xl border ${borderTone} shadow-sm space-y-4 ${cardBg}`}>
          <div
            className="flex justify-between items-center border-b pb-3"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Recorded Diagnostics & Bottleneck Indicators
            </h3>
            <span className="text-[10px] font-mono opacity-70">Empirically Observed Failure Points</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <span className="opacity-70 text-[10px] block uppercase font-bold">Unfinished Drop-offs</span>
              <span className="text-base font-black">{dropOffTrials.length} Incomplete Trials</span>
              <span className="text-[10px] opacity-70 block mt-1">
                {dropOffTrials.length === 0
                  ? 'Zero task abandonments recorded across current runs.'
                  : 'Drop-offs clustered around confirmation step.'}
              </span>
            </div>

            <div className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <span className="opacity-70 text-[10px] block uppercase font-bold">Recorded Validation Failures</span>
              <span className="text-base font-black">{totalErrorsRecorded} Form Errors</span>
              <span className="text-[10px] opacity-70 block mt-1">
                Instances where missing mandatory parameters halted task progression.
              </span>
            </div>

            <div className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <span className="opacity-70 text-[10px] block uppercase font-bold">Manual Recovery Hops</span>
              <span className="text-base font-black">{totalCorrectionsRecorded} Correction Hops</span>
              <span className="text-[10px] opacity-70 block mt-1">
                Evaluator-observed backward transitions triggered to alter entries.
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MODULE 06: PARTICIPANT TRIAL HISTORY & AUDIT TRAIL */}
        {/* ========================================================================= */}
        <section className={`p-6 sm:p-7 rounded-xl border ${borderTone} shadow-sm ${cardBg}`}>
          <div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b pb-3"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Participant Trial Ledger & Traceability ({evaluationLogs.length})
              </h2>
              <span className={`text-[10px] font-mono ${textSecondary}`}>
                Individual trial records with solid high-contrast pilot seed vs. live recorded badges.
              </span>
            </div>

            {evaluationLogs.length > 0 && (
              <button
                type="button"
                onClick={clearAllTrials}
                className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${borderTone} ${cardInnerBg} hover:opacity-75 transition-all inline-flex items-center gap-1.5`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Ledger</span>
              </button>
            )}
          </div>

          {evaluationLogs.length === 0 ? (
            <div
              className={`text-center py-8 text-xs font-mono font-bold rounded-lg border border-dashed ${borderTone} ${cardInnerBg} opacity-70`}
            >
              No empirical evaluation runs logged yet. Start the task runner clock above to generate benchmark data.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {evaluationLogs.map((log) => {
                const isTestArtifact = !log.isPilotSeed && log.durationSeconds < 5;

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-lg border ${borderTone} flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-mono font-bold gap-2 ${cardInnerBg} ${
                      isTestArtifact ? 'opacity-85' : ''
                    }`}
                  >
                    {/* Left Side: Badges & Scenario */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Unified Solid High-Contrast Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${accentSolid}`}
                      >
                        {log.isPilotSeed ? 'PILOT SEED' : isTestArtifact ? 'TEST RUN' : 'LIVE TRIAL'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase border ${borderTone} ${cardBg}`}
                      >
                        {log.participantId || 'P-XX'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase border ${borderTone} ${cardBg}`}
                      >
                        {log.method === 'SignMitra' ? 'SIGNMITRA' : 'TRADITIONAL TEXT'}
                      </span>

                      <span className="tracking-tight">{log.scenarioName}</span>

                      {isTestArtifact && (
                        <span
                          title="Excluded from aggregate benchmarks (<5s)"
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${borderTone} ${cardBg} opacity-80 cursor-help`}
                        >
                          [Excluded: &lt;5s]
                        </span>
                      )}
                    </div>

                    {/* Right Side: Metrics Bar - Strictly single line */}
                    <div className="flex flex-wrap gap-3 items-center opacity-85 text-[11px] shrink-0">
                      <span>⏱ {log.durationSeconds}s</span>
                      <span>🔄 {log.interactionCount} hops</span>
                      <span>
                        🎯 {log.fidelityPreserved || 0}/{log.fidelityTotal || 0} ({log.fidelityRate}%)
                      </span>
                      <span>⭐ {log.usabilityEase || 4}/5 ease</span>
                      <span>📌 {log.funnelDropPoint || 'Completed'}</span>
                      <span className="opacity-60 text-[10px]">{log.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: Protocol Library Modal */}
      {activeModal === 'protocols' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 font-mono"
        >
          <div className={`w-full max-w-2xl rounded-2xl border ${borderTone} p-6 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${borderTone}`}>
              <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#655A7C]" />
                Evaluation Protocol Library & Task Rules
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded hover:opacity-75"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1 text-xs">
              {Object.entries(RESEARCH_PROTOCOLS).map(([scenario, data]) => (
                <div key={scenario} className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm">{scenario}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${borderTone} ${accentSolid}`}>
                      {data.domain}
                    </span>
                  </div>
                  <p className="opacity-80 leading-relaxed text-[11px]">
                    <strong>Task Rules:</strong> {data.rules}
                  </p>
                  <div>
                    <span className="font-bold block mb-1 text-[11px] opacity-90">Required Preserved Criteria:</span>
                    <ul className="list-disc pl-4 space-y-0.5 opacity-80 text-[11px]">
                      {data.fidelityItems.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${accentSolid} hover:opacity-90`}
            >
              Close Reference
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Metric Definitions Drawer */}
      {activeModal === 'definitions' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 font-mono"
        >
          <div className={`w-full max-w-2xl rounded-2xl border ${borderTone} p-6 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${borderTone}`}>
              <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                <Info className="w-4 h-4 text-[#655A7C]" />
                Operationalized Metric Definitions & Formulas
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded hover:opacity-75"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              {METRIC_DEFINITIONS.map((def, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1`}>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm">{def.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[#655A7C] font-bold opacity-80">
                      Formula: {def.formula}
                    </span>
                  </div>
                  <p className="opacity-80 leading-relaxed text-[11px] mt-1">{def.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${accentSolid} hover:opacity-90`}
            >
              Close Definitions
            </button>
          </div>
        </div>
      )}

      {/* Footer System Boundary */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">
            SignMitra Evaluation & Insights Lab • Traceable Empirical Research Matrix
          </p>
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            />
            <span>Evidence Framework v4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}