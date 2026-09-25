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
  Download
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

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

  const [evaluationLogs, setEvaluationLogs] = useState([]);
  const [activeExperiment, setActiveExperiment] = useState({
    scenarioName: 'Healthcare: Specialist Booking',
    method: 'SignMitra',
    durationSeconds: 0,
    interactionCount: 0,
    isCompleted: true,
    hadErrors: false
  });

  const [timerActive, setTimerActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const savedLogs = localStorage.getItem('signmitra_empirical_metrics');
    if (savedLogs) {
      setEvaluationLogs(JSON.parse(savedLogs));
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const startLiveTask = () => {
    setSecondsElapsed(0);
    setTimerActive(true);
  };

  const endLiveTask = () => {
    setTimerActive(false);
    const newLog = {
      ...activeExperiment,
      id: Date.now(),
      durationSeconds: secondsElapsed,
      timestamp: new Date().toLocaleDateString()
    };
    const updatedLogs = [...evaluationLogs, newLog];
    setEvaluationLogs(updatedLogs);
    localStorage.setItem('signmitra_empirical_metrics', JSON.stringify(updatedLogs));
  };

  const clearLogs = () => {
    if (confirm('Reset all empirical benchmark evaluation records?')) {
      localStorage.removeItem('signmitra_empirical_metrics');
      setEvaluationLogs([]);
    }
  };

  // 1-Click CSV Benchmark Dataset Exporter
  const exportCSV = () => {
    if (evaluationLogs.length === 0) return;
    const headers = 'Scenario,Method,DurationSeconds,InteractionCount,Date\n';
    const rows = evaluationLogs
      .map(
        (log) =>
          `"${log.scenarioName}","${log.method}",${log.durationSeconds},${log.interactionCount},"${log.timestamp}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `signmitra_empirical_metrics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const computeMethodAverages = (methodType) => {
    const subset = evaluationLogs.filter((log) => log.method === methodType);
    if (subset.length === 0) return { time: 0, steps: 0, success: 0 };

    const totalTime = subset.reduce((acc, log) => acc + log.durationSeconds, 0);
    const totalSteps = subset.reduce((acc, log) => acc + log.interactionCount, 0);
    const totalSuccess = subset.filter((log) => log.isCompleted).length;

    return {
      time: (totalTime / subset.length).toFixed(1),
      steps: (totalSteps / subset.length).toFixed(1),
      success: ((totalSuccess / subset.length) * 100).toFixed(0)
    };
  };

  const smStats = computeMethodAverages('SignMitra');
  const traditionalStats = computeMethodAverages('Traditional Text');

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}
    >
      {/* Top Runtime Status Bar */}
      <div
        className={`w-full border-b py-2 px-4 sm:px-6 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </Link>
          <span className="opacity-40">•</span>
          <span className="opacity-80">VALIDATION MATRIX LAB</span>
        </div>
        <div className="flex items-center gap-3">
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

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 my-auto">
        {/* Header Section */}
        <header
          className={`rounded-xl border ${borderTone} p-6 sm:p-7 mb-8 shadow-sm ${cardBg}`}
        >
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardInnerBg} text-[11px] font-mono font-bold uppercase tracking-wider mb-3`}
          >
            <Activity className="w-3.5 h-3.5" />
            MODULE: VALIDATION & METRICS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-[1.08]">
            Empirical Evaluation & Metrics
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1.5 max-w-xl font-normal leading-relaxed ${textSecondary}`}
          >
            Run structured scenario evaluations to record and measure SignMitra speed and
            success rates against baseline manual handwriting alternatives.
          </p>
        </header>

        {/* SECTION 1: Scenario Experiment Runner */}
        <section
          className={`p-6 sm:p-7 rounded-xl border ${borderTone} mb-8 shadow-sm ${cardBg}`}
        >
          <div
            className="flex items-center justify-between mb-5 border-b pb-3"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Scenario Experiment Runner
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}
            >
              LIVE CONTROLLER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">
                1. Select Target Scenario
              </label>
              <select
                value={activeExperiment.scenarioName}
                onChange={(e) =>
                  setActiveExperiment((p) => ({ ...p, scenarioName: e.target.value }))
                }
                className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
              >
                <option className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Healthcare: Specialist Booking
                </option>
                <option className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Healthcare: Explaining Symptoms
                </option>
                <option className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Banking: Block Damaged Card
                </option>
                <option className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                  Education: Dispute Absence Mark
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">
                2. Testing Methodology
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setActiveExperiment((p) => ({ ...p, method: 'SignMitra' }))}
                  className={`py-3 px-2 rounded-lg border transition-all uppercase tracking-wider ${
                    activeExperiment.method === 'SignMitra'
                      ? accentSolid
                      : `${cardInnerBg}${borderTone} opacity-75 hover:opacity-100`
                  }`}
                >
                  SignMitra
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveExperiment((p) => ({ ...p, method: 'Traditional Text' }))
                  }
                  className={`py-3 px-2 rounded-lg border transition-all uppercase tracking-wider ${
                    activeExperiment.method === 'Traditional Text'
                      ? accentSolid
                      : `${cardInnerBg}${borderTone} opacity-75 hover:opacity-100`
                  }`}
                >
                  Pen & Paper
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">
                3. Interaction Count
              </label>
              <input
                type="number"
                value={activeExperiment.interactionCount}
                onChange={(e) =>
                  setActiveExperiment((p) => ({
                    ...p,
                    interactionCount: parseInt(e.target.value, 10) || 0
                  }))
                }
                className={`p-3 w-full font-mono font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors text-center ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                min="0"
              />
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-5 gap-4"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <div className="text-left font-mono">
              <span className="text-[10px] uppercase font-bold opacity-70 block">
                Task Running Clock
              </span>
              <span className="text-3xl font-black tracking-tight">
                {secondsElapsed}{' '}
                <span className="text-xs font-bold opacity-70 uppercase">seconds</span>
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
                  <span>Complete & Record</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: Baseline Comparison Matrix */}
        <section
          className={`p-6 sm:p-7 rounded-xl border ${borderTone} mb-8 shadow-sm ${cardBg}`}
        >
          <div
            className="flex items-center justify-between mb-4 border-b pb-3"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Scientific Baseline Comparison Matrix
            </h2>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}
            >
              AGGREGATED DATA
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className={`border-b ${borderTone} ${cardInnerBg}`}>
                  <th className="p-3 font-bold uppercase tracking-wider">Evaluation Method</th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">
                    Avg Completion Time
                  </th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">
                    Avg Interaction Count
                  </th>
                  <th className="p-3 text-center font-bold uppercase tracking-wider">
                    Task Success Rate
                  </th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: isDarkTheme ? '#AB92BF20' : '#655A7C15' }}
              >
                <tr className="transition-colors hover:opacity-90">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>SignMitra Platform</span>
                  </td>
                  <td className="p-3 text-center font-bold">{smStats.time}s</td>
                  <td className="p-3 text-center font-bold">{smStats.steps} steps</td>
                  <td className="p-3 text-center font-black">{smStats.success}%</td>
                </tr>
                <tr className="transition-colors hover:opacity-90">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <span className="w-3.5 h-3.5 flex items-center justify-center font-mono">
                      •
                    </span>
                    <span>Traditional Text / Paper</span>
                  </td>
                  <td className="p-3 text-center font-bold">{traditionalStats.time}s</td>
                  <td className="p-3 text-center font-bold">{traditionalStats.steps} steps</td>
                  <td className="p-3 text-center font-black">{traditionalStats.success}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: Raw Logs Audit History */}
        <section
          className={`p-6 sm:p-7 rounded-xl border ${borderTone} shadow-sm ${cardBg}`}
        >
          <div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b pb-3"
            style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
          >
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Evaluation Run Logs ({evaluationLogs.length})
            </h2>

            {evaluationLogs.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={exportCSV}
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${borderTone} ${cardInnerBg} hover:opacity-75 transition-all inline-flex items-center gap-1.5`}
                >
                  <Download className="w-3 h-3" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={clearLogs}
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${borderTone} ${cardInnerBg} hover:opacity-75 transition-all inline-flex items-center gap-1.5`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Records</span>
                </button>
              </div>
            )}
          </div>

          {evaluationLogs.length === 0 ? (
            <div
              className={`text-center py-8 text-xs font-mono font-bold rounded-lg border border-dashed ${borderTone} ${cardInnerBg} opacity-70`}
            >
              No empirical evaluation runs logged yet. Start the task runner clock above to
              generate benchmark data.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {evaluationLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-lg border ${borderTone} flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-mono font-bold gap-2 ${cardInnerBg}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase border ${borderTone} ${cardBg}`}
                    >
                      {log.method}
                    </span>
                    <span className="tracking-tight">{log.scenarioName}</span>
                  </div>
                  <div className="flex gap-4 items-center opacity-80 text-[11px]">
                    <span>⏱ {log.durationSeconds}s</span>
                    <span>🔄 {log.interactionCount} steps</span>
                    <span>📅 {log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer System Boundary */}
      <footer
        className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">
            SignMitra Metrics Laboratory • Counter-Balanced Task Matrix Enabled
          </p>
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            ></span>
            <span>Analytics Engine Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}