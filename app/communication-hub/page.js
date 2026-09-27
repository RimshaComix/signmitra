'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  HeartPulse,
  Landmark,
  GraduationCap,
  ShieldAlert,
  ArrowRight,
  Sun,
  Moon,
  Layers,
  Sparkles,
  ListOrdered,
  MessageSquare,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
*/

const JOURNEYS = [
  {
    id: 'college_visit',
    title: 'College Office Visit',
    icon: GraduationCap,
    desc: 'Submit forms, request certificates, or resolve academic issues.',
    phases: [
      { name: 'Prepare', desc: 'Review the visual steps before approaching the desk.', href: '/steps', icon: ListOrdered },
      { name: 'Communicate', desc: 'Use live assist to talk to the clerk or faculty.', href: '/conversation', icon: MessageSquare },
      { name: 'Confirm & Plan', desc: 'Save the confirmed deadline or action to your planner.', href: '/followups', icon: CalendarClock }
    ]
  },
  {
    id: 'bank_visit',
    title: 'Bank Branch Visit',
    icon: Landmark,
    desc: 'Update KYC, deposit cash, or report transaction problems.',
    phases: [
      { name: 'Prepare', desc: 'Check required documents and procedures.', href: '/steps', icon: ListOrdered },
      { name: 'Communicate', desc: 'Hand device to the teller for two-way chat.', href: '/conversation', icon: MessageSquare },
      { name: 'Confirm & Plan', desc: 'Record reference numbers and follow-up dates.', href: '/followups', icon: CalendarClock }
    ]
  },
  {
    id: 'hospital_visit',
    title: 'Hospital OPD Visit',
    icon: HeartPulse,
    desc: 'Register for consultation, tests, or pharmacy pickup.',
    phases: [
      { name: 'Prepare', desc: 'Understand the registration and check-in flow.', href: '/steps', icon: ListOrdered },
      { name: 'Communicate', desc: 'Clarify instructions with reception or pharmacy.', href: '/conversation', icon: MessageSquare },
      { name: 'Confirm & Plan', desc: 'Save medicine dosages and next appointments.', href: '/followups', icon: CalendarClock }
    ]
  }
];

export default function CommunicationHub() {
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

  const [activeJourney, setActiveJourney] = useState(null);

  const domains = [
    {
      id: 'healthcare',
      title: 'Healthcare',
      icon: HeartPulse,
      badge: 'CLINICAL TRIAGE',
      desc: 'Generate structured cards for specific medical scenarios.',
      href: '/healthcare',
      status: 'Active Clinical Engine'
    },
    {
      id: 'banking',
      title: 'Banking & Finance',
      icon: Landmark,
      badge: 'FINANCIAL COUNTER',
      desc: 'Generate secure handover cards for bank tellers.',
      href: '/banking',
      status: 'Encrypted Counter State'
    },
    {
      id: 'education',
      title: 'Education & Faculty',
      icon: GraduationCap,
      badge: 'ACADEMIC DESK',
      desc: 'Generate formal requests for campus staff.',
      href: '/education',
      status: 'Academic Interaction Ready'
    }
  ];

  const toggleJourney = (id) => {
    setActiveJourney(activeJourney === id ? null : id);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Runtime Status Bar */}
      <div className={`w-full border-b py-2 px-4 sm:px-6 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity">
            ← Return to Overview
          </Link>
          <span className="opacity-40">•</span>
          <span className="opacity-80">COMMUNICATION WORKFLOW HUB</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 my-auto pb-28">
        
        {/* Header Section */}
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b pb-8 mb-10 ${borderTone}`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardBg} text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider mb-4`}>
              <Sparkles className="w-3.5 h-3.5" />
              ORCHESTRATION HUB
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-[1.08]">
              SignMitra Hub
            </h1>
            <p className={`text-sm sm:text-base mt-2.5 max-w-xl font-medium leading-relaxed ${textSecondary}`}>
              Select a complete interaction journey to prepare, communicate, and track your next steps, or generate a quick structured card.
            </p>
          </div>
          
          <Link 
            href="/emergency"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#655A7C] dark:text-[#FDF1E2]" />
            <span>Open Emergency</span>
          </Link>
        </header>

        {/* ========================================== */}
        {/* UNIFIED INTERACTION JOURNEYS (NEW) */}
        {/* ========================================== */}
        <section className="mb-14 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>Start an Interaction Journey</span>
            </h2>
          </div>
          
          <div className="space-y-4">
            {JOURNEYS.map((journey) => {
              const IconComponent = journey.icon;
              const isActive = activeJourney === journey.id;

              return (
                <div key={journey.id} className={`rounded-2xl border transition-all ${borderTone} ${isActive ? cardBg + ' shadow-md' : cardInnerBg + ' hover:opacity-90'}`}>
                  
                  {/* Journey Header (Click to expand) */}
                  <button 
                    onClick={() => toggleJourney(journey.id)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${isActive ? accentSolid : `border ${borderTone}${cardBg}`}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">{journey.title}</h3>
                        <p className={`text-xs sm:text-sm font-medium mt-1 ${textSecondary}`}>
                          {journey.desc}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      {isActive ? <ChevronUp className="w-5 h-5 opacity-70" /> : <ChevronDown className="w-5 h-5 opacity-70" />}
                    </div>
                  </button>

                  {/* Expanded Journey Timeline */}
                  {isActive && (
                    <div className={`px-5 sm:px-6 pb-6 pt-2 border-t ${borderTone} animate-in slide-in-from-top-2 duration-200`}>
                      <div className="mt-6 space-y-6 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-current before:to-transparent before:opacity-10">
                        {journey.phases.map((phase, idx) => {
                          const PhaseIcon = phase.icon;
                          return (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${cardInnerBg} ${borderTone} ${textPrimary}`}>
                                <span className="text-[10px] font-black">{idx + 1}</span>
                              </div>
                              <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border ${borderTone} ${cardBg} shadow-sm transition-all hover:scale-[1.02]`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <PhaseIcon className="w-4 h-4 opacity-70" />
                                    <h4 className="font-bold text-xs uppercase tracking-wider">{phase.name}</h4>
                                  </div>
                                </div>
                                <p className={`text-xs font-medium mb-3 ${textSecondary}`}>{phase.desc}</p>
                                <Link 
                                  href={phase.href}
                                  className={`inline-flex w-full py-2.5 items-center justify-center gap-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${accentSolid} hover:opacity-90`}
                                >
                                  Open {phase.name} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================== */}
        {/* DIRECT DOMAIN GENERATORS (LEGACY/QUICK) */}
        {/* ========================================== */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 opacity-80">
              <Layers className="w-4 h-4" />
              <span>Or Generate a Quick Structured Card</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {domains.map((domain) => {
              const IconComponent = domain.icon;
              return (
                <Link 
                  key={domain.id}
                  href={domain.href}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${cardInnerBg} ${borderTone} hover:border-[#655A7C] hover:-translate-y-1`}
                >
                  <div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mb-4 ${accentSolid}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight mb-1">
                      {domain.title}
                    </h3>
                    <p className={`text-[11px] leading-relaxed font-medium ${textSecondary}`}>
                      {domain.badge}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer / System Status Indicators */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">SignMitra • Privacy-Focused Accessibility Platform</p>
          <div className="flex items-center gap-2 font-medium">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`}></span>
            <span>Local State Engine Operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}