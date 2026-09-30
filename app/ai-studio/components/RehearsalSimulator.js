'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  RotateCcw,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  Check,
  Building,
  GraduationCap,
  Landmark,
  HeartPulse,
  Bus,
  FileCheck
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'College Office',
    label: 'College Administration',
    icon: GraduationCap,
    desc: 'Verify fee receipts, submit exam forms, or request verified transcripts.',
    initialStaff: 'Next please. Keep your student ID card and original fee slip ready on the counter.'
  },
  {
    id: 'Bank Branch',
    label: 'Bank Counter / KYC',
    icon: Landmark,
    desc: 'Resolve signature mismatch, update KYC address, or deposit cheques.',
    initialStaff: 'Please submit Form 2A along with self-attested copies of your PAN and Aadhaar.'
  },
  {
    id: 'Hospital OPD',
    label: 'Hospital Triage Desk',
    icon: HeartPulse,
    desc: 'Register for doctor consultation, obtain lab token, or collect medication.',
    initialStaff: 'Take this green slip to Room 104 for preliminary blood pressure check.'
  },
  {
    id: 'Public Transit',
    label: 'Railway / Transit Help Desk',
    icon: Bus,
    desc: 'Request boarding assistance or ask for platform indicator guidance.',
    initialStaff: 'Suburban trains for Tambaram leave from Platform 3. The next fast local is at 10:45 AM.'
  }
];

export default function RehearsalSimulator() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [turns, setTurns] = useState([
    {
      sender: 'staff',
      text: SCENARIOS[0].initialStaff,
      demeanor: 'Busy Counter Staff'
    }
  ]);
  const [userReply, setUserReply] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [rehearsalChecklist, setRehearsalChecklist] = useState([
    'Carry photo identification',
    'Prepare opening communication card introducing visual/written preference',
    'Request stamped acknowledgment copy before leaving counter'
  ]);

  const handleSelectScenario = (sc) => {
    setSelectedScenario(sc);
    setTurns([
      {
        sender: 'staff',
        text: sc.initialStaff,
        demeanor: 'Desk Official'
      }
    ]);
  };

  const handleSendTurn = async (replyText = null) => {
    const text = replyText || userReply;
    if (!text.trim()) return;

    const userTurn = { sender: 'user', text };
    const updatedTurns = [...turns, userTurn];
    setTurns(updatedTurns);
    if (!replyText) setUserReply('');
    setIsSimulating(true);

    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_rehearsal',
          scenario: selectedScenario.id,
          userTurn: text
        })
      });

      const data = await res.json();
      const staffTurn = {
        sender: 'staff',
        text: data.staffResponse || 'Please submit your documents at the counter and take a receipt.',
        demeanor: data.staffDemeanor || 'Desk Staff',
        suggestions: data.suggestedUserReplies || []
      };

      setTurns([...updatedTurns, staffTurn]);
      if (data.rehearsalChecklist) {
        setRehearsalChecklist(data.rehearsalChecklist);
      }
    } catch (e) {
      setTurns([
        ...updatedTurns,
        {
          sender: 'staff',
          text: 'Understood. Please present your verified slip at Window 2.',
          demeanor: 'Standard Response',
          suggestions: ['Which counter is Window 2?', 'Is there any fee?']
        }
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setTurns([
      {
        sender: 'staff',
        text: selectedScenario.initialStaff,
        demeanor: 'Desk Official'
      }
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}>
            FEATURE 19 · PRACTICE SIMULATION
          </span>
          <span className="text-xs font-mono opacity-70">
            Interactive Roleplay (Safe Sandbox)
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Conversation Rehearsal Simulator
        </h2>
        <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
          Practice typical counter conversations before real-life appointments. The simulated staff response helps you anticipate what documents or questions will be asked.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected ? 'border-[#655A7C] ring-2 ring-[#655A7C] ' + cardInnerBg : cardBg + ' ' + borderTone
              }`}
            >
              <Icon className="w-4 h-4 mb-2 opacity-80" />
              <div className="text-xs font-black uppercase tracking-tight truncate">{sc.label}</div>
              <p className="text-[10px] opacity-60 line-clamp-1 mt-0.5">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Interactive Dialogue Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Dialogue Stream */}
        <div className={`lg:col-span-8 p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between min-h-[420px]`}>
          
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            <div className="flex justify-between items-center pb-2 border-b border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
              <span className="text-xs font-mono font-bold opacity-70">Simulation Stream: {selectedScenario.label}</span>
              <button
                onClick={handleReset}
                className="text-[10px] font-mono font-bold flex items-center gap-1 opacity-60 hover:opacity-100"
              >
                <RotateCcw className="w-3 h-3" /> Reset Practice
              </button>
            </div>

            {turns.map((t, idx) => {
              const isStaff = t.sender === 'staff';
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    isStaff ? cardInnerBg + ' mr-auto max-w-[88%]' : accentSolid + ' ml-auto max-w-[80%]'
                  } ${borderTone} space-y-1.5`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-bold">{isStaff ? `SIMULATED STAFF (${t.demeanor})` : 'YOU (PRACTICE)'}</span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed">{t.text}</p>

                  {/* 1-Tap quick reply suggestions */}
                  {isStaff && t.suggestions?.length > 0 && idx === turns.length - 1 && (
                    <div className="pt-2 border-t border-dashed mt-2" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                      <span className="text-[10px] font-mono opacity-60 block mb-1">Quick Practice Replies:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {t.suggestions.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendTurn(s)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${cardBg} ${borderTone} hover:border-[#655A7C]`}
                          >
                            "{s}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isSimulating && (
              <div className={`p-3 rounded-xl border ${cardInnerBg} mr-auto animate-pulse text-xs font-mono`}>
                Simulated staff is reviewing your reply...
              </div>
            )}
          </div>

          {/* User Input Bar */}
          <div className="pt-3 border-t flex gap-2" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
            <input
              type="text"
              value={userReply}
              onChange={(e) => setUserReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTurn()}
              placeholder="Type your practice response or show a card..."
              className={`flex-1 p-3 rounded-xl font-bold text-xs border outline-none ${cardInnerBg} ${borderTone}`}
            />
            <button
              onClick={() => handleSendTurn()}
              disabled={!userReply.trim() || isSimulating}
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase ${accentSolid} hover:opacity-90 flex items-center gap-1.5`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </div>
        </div>

        {/* Rehearsal Checklist */}
        <div className={`lg:col-span-4 p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <FileCheck className="w-4 h-4 text-green-500" />
            <span>Rehearsal Checklist:</span>
          </div>

          <p className="text-[11px] opacity-70 leading-relaxed">
            Ensure you have these points clear in mind before approaching the actual desk:
          </p>

          <div className="space-y-2 pt-1">
            {rehearsalChecklist.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-bold ${cardInnerBg} ${borderTone}`}>
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-[10px] font-mono text-blue-900 dark:text-blue-200">
            Note: This simulation is an educational practice companion; actual counter staff responses will vary based on individual desk workload.
          </div>
        </div>

      </div>

    </div>
  );
}
