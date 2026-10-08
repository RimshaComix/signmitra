'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  RotateCcw,
  Send,
  Check,
  GraduationCap,
  Landmark,
  HeartPulse,
  Bus,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'College Office',
    label: 'College Administration',
    icon: GraduationCap,
    desc: 'Practice student-service conversations at a college administration desk.',
    initialStaff:
      'Next please. Keep your student ID card and original fee slip ready on the counter.',
    checklist: [
      'Clearly state what you need from the college office',
      'Keep any relevant student or document details ready',
      'Ask staff to write down important requirements or next steps'
    ],
    fallback: {
      text: 'Please tell me what you need help with at the college office.',
      demeanor: 'College Office Staff',
      suggestions: [
        'I need help with an exam-related request.',
        'Could you please tell me what documents I need?',
        'Could you please write down the next step?'
      ]
    }
  },
  {
    id: 'Bank Branch',
    label: 'Bank Counter / KYC',
    icon: Landmark,
    desc: 'Practice banking, KYC, account, document, and counter-service conversations.',
    initialStaff:
      'Please submit Form 2A along with self-attested copies of your PAN and Aadhaar.',
    checklist: [
      'Clearly state the banking service you need',
      'Keep relevant account or identity details ready',
      'Ask staff to write down important requirements or next steps'
    ],
    fallback: {
      text: 'Please tell me what banking service you need help with.',
      demeanor: 'Bank Counter Staff',
      suggestions: [
        'I need help with a banking request.',
        'Could you please tell me what documents I need?',
        'Could I get an acknowledgement for my submission?'
      ]
    }
  },
  {
    id: 'Hospital OPD',
    label: 'Hospital Triage Desk',
    icon: HeartPulse,
    desc: 'Practice OPD, registration, appointment, lab, and patient-service conversations.',
    initialStaff:
      'Take this green slip to Room 104 for preliminary blood pressure check.',
    checklist: [
      'Clearly state what assistance you need',
      'Keep relevant patient or registration details ready',
      'Ask staff to write down the next step or location'
    ],
    fallback: {
      text: 'Please tell me what you need help with at the hospital desk.',
      demeanor: 'Hospital Desk Staff',
      suggestions: [
        'I need help with my OPD registration.',
        'Could you please tell me what I should do next?',
        'Could you please write down the next step?'
      ]
    }
  },
  {
    id: 'Public Transit',
    label: 'Railway / Transit Help Desk',
    icon: Bus,
    desc: 'Practice destinations, tickets, platforms, schedules, and boarding assistance.',
    initialStaff:
      'Suburban trains for Tambaram leave from Platform 3. The next fast local is at 10:45 AM.',
    checklist: [
      'Clearly state your destination or travel requirement',
      'Confirm important travel information before proceeding',
      'Ask staff to write down platform or other important instructions'
    ],
    fallback: {
      text: 'Please tell me what travel assistance you need.',
      demeanor: 'Transit Help Desk Staff',
      suggestions: [
        'Could you please help me with my destination?',
        'Could you please confirm the platform for my train?',
        'Could you please write down the travel information?'
      ]
    }
  }
];

export default function RehearsalSimulator() {
  const {
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme
  } = useTheme();

  const [selectedScenario, setSelectedScenario] =
    useState(SCENARIOS[0]);

  const [turns, setTurns] = useState([
    {
      sender: 'staff',
      text: SCENARIOS[0].initialStaff,
      demeanor: 'Busy Counter Staff'
    }
  ]);

  const [userReply, setUserReply] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const [rehearsalChecklist, setRehearsalChecklist] =
    useState(SCENARIOS[0].checklist);

  const [simulationError, setSimulationError] =
    useState(false);

  // ---------------------------------------------------------------------------
  // Scenario selection
  // ---------------------------------------------------------------------------

  const handleSelectScenario = (scenario) => {
    if (isSimulating) return;

    setSelectedScenario(scenario);

    setTurns([
      {
        sender: 'staff',
        text: scenario.initialStaff,
        demeanor: 'Desk Official'
      }
    ]);

    setRehearsalChecklist(scenario.checklist);
    setUserReply('');
    setSimulationError(false);
  };

  // ---------------------------------------------------------------------------
  // Send practice turn
  // ---------------------------------------------------------------------------

  const handleSendTurn = async (replyText = null) => {
    if (isSimulating) return;

    const text = replyText ?? userReply;

    if (!text.trim()) return;

    const cleanText = text.trim();

    const userTurn = {
      sender: 'user',
      text: cleanText
    };

    const updatedTurns = [...turns, userTurn];

    const conversationHistory = updatedTurns.map((turn) => ({
      role: turn.sender === 'staff' ? 'staff' : 'user',
      text: turn.text
    }));

    setTurns(updatedTurns);
    setUserReply('');
    setIsSimulating(true);
    setSimulationError(false);

    try {
      const response = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'simulate_rehearsal',
          scenario: selectedScenario.id,
          scenario_id: selectedScenario.id,
          userTurn: cleanText,
          history: conversationHistory
        })
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            `Rehearsal simulation failed with status ${response.status}`
        );
      }

      const fallback = selectedScenario.fallback;

      const staffTurn = {
        sender: 'staff',
        text:
          typeof data?.staffResponse === 'string' &&
          data.staffResponse.trim()
            ? data.staffResponse.trim()
            : typeof data?.staff_response === 'string' &&
                data.staff_response.trim()
              ? data.staff_response.trim()
              : fallback.text,

        demeanor:
          typeof data?.staffDemeanor === 'string' &&
          data.staffDemeanor.trim()
            ? data.staffDemeanor.trim()
            : typeof data?.staff_demeanor === 'string' &&
                data.staff_demeanor.trim()
              ? data.staff_demeanor.trim()
              : fallback.demeanor,

        suggestions: Array.isArray(
          data?.suggestedUserReplies
        )
          ? data.suggestedUserReplies
              .filter(
                (reply) =>
                  typeof reply === 'string' &&
                  reply.trim()
              )
              .slice(0, 3)
          : fallback.suggestions
      };

      setTurns([
        ...updatedTurns,
        staffTurn
      ]);

      /*
       * Checklist remains deterministic.
       *
       * The LLM is never allowed to replace preparation
       * reminders because generated checklist items could
       * introduce unsupported documents, fees, procedures,
       * or guarantees.
       */
    } catch (error) {
      console.warn(
        'Rehearsal simulation provider unavailable:',
        error
      );

      const fallback = selectedScenario.fallback;

      setSimulationError(true);

      setTurns([
        ...updatedTurns,
        {
          sender: 'staff',
          text: fallback.text,
          demeanor: fallback.demeanor,
          suggestions: fallback.suggestions
        }
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Reset current practice
  // ---------------------------------------------------------------------------

  const handleReset = () => {
    if (isSimulating) return;

    setTurns([
      {
        sender: 'staff',
        text: selectedScenario.initialStaff,
        demeanor: 'Desk Official'
      }
    ]);

    setRehearsalChecklist(
      selectedScenario.checklist
    );

    setUserReply('');
    setSimulationError(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}
          >
            FEATURE 19 · PRACTICE SIMULATION
          </span>

          <span className="text-xs font-mono opacity-70">
            Interactive Roleplay · Safe Sandbox
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Conversation Rehearsal Simulator
        </h2>

        <p
          className={`text-xs sm:text-sm font-medium ${textSecondary}`}
        >
          Practice conversations across common college,
          banking, hospital, and transit situations before
          real-life interactions. Simulated staff responses
          help you rehearse how to ask questions, clarify
          information, and confirm next steps.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;

          const isSelected =
            selectedScenario.id === scenario.id;

          return (
            <button
              key={scenario.id}
              onClick={() =>
                handleSelectScenario(scenario)
              }
              disabled={isSimulating}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? `border-[#655A7C] ring-2 ring-[#655A7C] ${cardInnerBg}`
                  : `${cardBg} ${borderTone}`
              } ${
                isSimulating
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-[#655A7C]'
              }`}
            >
              <Icon className="w-4 h-4 mb-2 opacity-80" />

              <div className="text-xs font-black uppercase tracking-tight truncate">
                {scenario.label}
              </div>

              <p className="text-[10px] opacity-60 line-clamp-2 mt-0.5">
                {scenario.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive Dialogue Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Dialogue Stream */}
        <div
          className={`lg:col-span-8 p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between min-h-[420px]`}
        >
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">

            {/* Stream header */}
            <div
              className="flex justify-between items-center pb-2 border-b border-dashed"
              style={{
                borderColor: isDarkTheme
                  ? '#AB92BF30'
                  : '#655A7C20'
              }}
            >
              <span className="text-xs font-mono font-bold opacity-70">
                Simulation Stream: {selectedScenario.label}
              </span>

              <button
                onClick={handleReset}
                disabled={isSimulating}
                className={`text-[10px] font-mono font-bold flex items-center gap-1 transition-opacity ${
                  isSimulating
                    ? 'opacity-30 cursor-not-allowed'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                Reset Practice
              </button>
            </div>

            {/* Turns */}
            {turns.map((turn, index) => {
              const isStaff =
                turn.sender === 'staff';

              const isLatest =
                index === turns.length - 1;

              return (
                <div
                  key={`${turn.sender}-${index}`}
                  className={`p-3.5 rounded-xl border ${
                    isStaff
                      ? `${cardInnerBg} mr-auto max-w-[88%]`
                      : `${accentSolid} ml-auto max-w-[80%]`
                  } ${borderTone} space-y-1.5`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-bold">
                      {isStaff
                        ? `SIMULATED STAFF (${turn.demeanor})`
                        : 'YOU (PRACTICE)'}
                    </span>
                  </div>

                  <p className="text-sm font-bold leading-relaxed">
                    {turn.text}
                  </p>

                  {/* Quick replies */}
                  {isStaff &&
                    Array.isArray(turn.suggestions) &&
                    turn.suggestions.length > 0 &&
                    isLatest && (
                      <div
                        className="pt-2 border-t border-dashed mt-2"
                        style={{
                          borderColor: isDarkTheme
                            ? '#AB92BF30'
                            : '#655A7C20'
                        }}
                      >
                        <span className="text-[10px] font-mono opacity-60 block mb-1">
                          Quick Practice Replies:
                        </span>

                        <div className="flex flex-wrap gap-1.5">
                          {turn.suggestions.map(
                            (
                              suggestion,
                              suggestionIndex
                            ) => (
                              <button
                                key={suggestionIndex}
                                onClick={() =>
                                  handleSendTurn(
                                    suggestion
                                  )
                                }
                                disabled={
                                  isSimulating
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${cardBg} ${borderTone} ${
                                  isSimulating
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:border-[#655A7C] active:scale-95'
                                }`}
                              >
                                "{suggestion}"
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              );
            })}

            {/* Loading */}
            {isSimulating && (
              <div
                className={`p-3 rounded-xl border ${cardInnerBg} mr-auto animate-pulse text-xs font-mono`}
              >
                Simulated staff is preparing a
                practice response...
              </div>
            )}

            {/* Fallback notice */}
            {simulationError && (
              <div className="p-3 rounded-xl border border-orange-500/30 bg-orange-500/10 text-[10px] font-mono text-orange-900 dark:text-orange-200 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />

                <span>
                  Live simulation service was unavailable.
                  The response shown above is a predefined
                  practice fallback, not a live AI-generated
                  response.
                </span>
              </div>
            )}
          </div>

          {/* User Input */}
          <div
            className="pt-3 border-t flex gap-2"
            style={{
              borderColor: isDarkTheme
                ? '#AB92BF30'
                : '#655A7C20'
            }}
          >
            <input
              type="text"
              value={userReply}
              onChange={(event) =>
                setUserReply(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !isSimulating
                ) {
                  event.preventDefault();
                  handleSendTurn();
                }
              }}
              disabled={isSimulating}
              placeholder="Type your practice response..."
              className={`flex-1 p-3 rounded-xl font-bold text-xs border outline-none ${cardInnerBg} ${borderTone} ${
                isSimulating
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            />

            <button
              onClick={() =>
                handleSendTurn()
              }
              disabled={
                !userReply.trim() ||
                isSimulating
              }
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all ${
                userReply.trim() &&
                !isSimulating
                  ? `${accentSolid} hover:opacity-90`
                  : `${accentSolid} opacity-40 cursor-not-allowed`
              }`}
            >
              <Send className="w-3.5 h-3.5" />

              <span>
                {isSimulating
                  ? 'Thinking...'
                  : 'Reply'}
              </span>
            </button>
          </div>
        </div>

        {/* Rehearsal Checklist */}
        <div
          className={`lg:col-span-4 p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <FileCheck className="w-4 h-4 text-green-500" />

            <span>
              Rehearsal Checklist:
            </span>
          </div>

          <p className="text-[11px] opacity-70 leading-relaxed">
            These are general preparation reminders.
            They are not claims about actual desk
            requirements.
          </p>

          <div className="space-y-2 pt-1">
            {rehearsalChecklist.map(
              (item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-bold ${cardInnerBg} ${borderTone}`}
                >
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />

                  <span className="leading-snug">
                    {item}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-[10px] font-mono text-blue-900 dark:text-blue-200">
            Note: This is an educational practice
            sandbox. The opening message is only the
            starting situation. You can practice other
            valid requests within the selected domain.
            AI responses are safety-validated, but actual
            staff responses, requirements, fees, schedules,
            and procedures may vary.
          </div>
        </div>
      </div>
    </div>
  );
}