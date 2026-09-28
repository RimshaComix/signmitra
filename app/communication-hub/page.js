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
  MessageSquare,
  Play,
  IdCard,
  Users,
  MessageSquareWarning,
  BellRing,
  Building,
  Bus,
  BookOpen
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
*/

// UPDATED TO DIRECT LINKS FOR UNIFIED JOURNEY BUILDER
const JOURNEYS = [
  {
    id: 'college_visit',
    title: 'College Office Visit',
    icon: GraduationCap,
    desc: 'Submit forms, request certificates, or resolve academic issues.',
    href: '/journey/college_visit' 
  },
  {
    id: 'bank_visit',
    title: 'Bank Branch Visit',
    icon: Landmark,
    desc: 'Update KYC, deposit cash, or report transaction problems.',
    href: '/journey/bank_visit' 
  },
  {
    id: 'hospital_visit',
    title: 'Hospital OPD Visit',
    icon: HeartPulse,
    desc: 'Register for consultation, tests, or pharmacy pickup.',
    href: '/journey/hospital_visit'
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

  // ALL 9 DOMAINS INCLUDED
  const domains = [
    {
      id: 'interpreter',
      title: 'Interpreter Request',
      icon: Users,
      badge: 'ACCESS HANDOFF',
      desc: 'Formally request an ISL interpreter from facility staff.',
      href: '/interpreter-handoff',
      status: 'Ready to dispatch'
    },
    {
      id: 'staff_handoff',
      title: 'Staff Quick Reply',
      icon: MessageSquare,
      badge: 'HAND DEVICE OVER',
      desc: 'Let staff tap a quick response on a large screen.',
      href: '/staff-response',
      status: 'Ready'
    },
    {
      id: 'transport',
      title: 'Public Transport',
      icon: Bus,
      badge: 'TRANSIT GUIDES',
      desc: 'Visual tips and communication cards for metro and buses.',
      href: '/transport',
      status: 'Local Guides Active'
    },
    {
      id: 'directory',
      title: 'Access Directory',
      icon: Building,
      badge: 'VERIFIED LOCATIONS',
      desc: 'Check if a hospital or bank has an interpreter or visual signs.',
      href: '/directory',
      status: 'Database Active'
    },
    {
      id: 'library',
      title: 'Info Library',
      icon: BookOpen,
      badge: 'ISLRTC & GUIDES',
      desc: 'Official ISL dictionaries and visual service guides.',
      href: '/library',
      status: 'Verified Resources'
    },
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
    },
    {
      id: 'accessibility_feedback',
      title: 'Rate Accessibility',
      icon: Layers,
      badge: 'COMMUNITY FEEDBACK',
      desc: 'Anonymously report if staff or signs were accessible.',
      href: '/feedback',
      status: 'Anonymous & Secure'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Runtime Status Bar */}
      <div className={`w-full border-b py-2 px-4 sm:px-6 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`} role="region" aria-label="Status Bar">
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
          >
            ← Return to Overview
          </Link>
          <span className="opacity-40" aria-hidden="true">•</span>
          <span className="opacity-80">COMMUNICATION WORKFLOW HUB</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" aria-hidden="true" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 my-auto pb-28">
        
        {/* Header Section (FIXED LAYOUT) */}
        <header className={`flex flex-col lg:flex-row justify-between items-start gap-8 border-b pb-8 mb-10 ${borderTone}`}>
          <div className="flex-1 lg:pr-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardBg} text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider mb-4`}>
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              ORCHESTRATION HUB
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-[1.08]">
              SignMitra Hub
            </h1>
            <p className={`text-sm sm:text-base mt-2.5 max-w-xl font-medium leading-relaxed ${textSecondary}`}>
              Select a complete interaction journey to prepare, communicate, and track your next steps, or generate a quick structured card.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            {/* Personal Communication Card Shortcut */}
            <Link 
              href="/communication-card"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all ${accentSolid} focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              aria-label="Open Personal Communication ID Card"
            >
              <IdCard className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">ID Card</span>
            </Link>

            {/* Queue & Appointment Companion Shortcut */}
            <Link 
              href="/queue-companion"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              aria-label="Open Queue & Appointment Companion"
            >
              <BellRing className="w-4 h-4 shrink-0 text-[#655A7C] dark:text-[#FDF1E2]" aria-hidden="true" />
              <span className="truncate">Queue Tracker</span>
            </Link>
            
            {/* Emergency Card Shortcut */}
            <Link 
              href="/emergency-card"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:outline-none`}
              aria-label="Open Emergency Phrases"
            >
              <MessageSquareWarning className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">SOS Phrases</span>
            </Link>

            {/* Existing Medical Vault Shortcut */}
            <Link 
              href="/emergency"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              aria-label="Open Medical Vault"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#655A7C] dark:text-[#FDF1E2]" aria-hidden="true" />
              <span className="truncate">Open Vault</span>
            </Link>
          </div>
        </header>

        {/* ========================================== */}
        {/* UNIFIED INTERACTION JOURNEYS */}
        {/* ========================================== */}
        <section className="mb-14 animate-in fade-in duration-300" aria-labelledby="interaction-journeys-heading">
          <div className="flex items-center justify-between mb-5">
            <h2 id="interaction-journeys-heading" className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>Start an Interaction Journey</span>
            </h2>
          </div>
          
          <div className="space-y-4">
            {JOURNEYS.map((journey) => {
              const IconComponent = journey.icon;

              return (
                <Link 
                  key={journey.id} 
                  href={journey.href}
                  className={`w-full p-5 sm:p-6 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded-2xl border transition-all ${borderTone} ${cardBg} hover:-translate-y-1 hover:border-[#655A7C] shadow-sm group`}
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${cardInnerBg} border ${borderTone}`} aria-hidden="true">
                      <IconComponent className="w-6 h-6 opacity-80" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">{journey.title}</h3>
                      <p className={`text-xs sm:text-sm font-medium mt-1 ${textSecondary}`}>
                        {journey.desc}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2">
                    <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ========================================== */}
        {/* DIRECT DOMAIN GENERATORS (QUICK ACTIONS) */}
        {/* ========================================== */}
        <section className="space-y-5" aria-labelledby="quick-generators-heading">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
            <h2 id="quick-generators-heading" className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 opacity-80">
              <Layers className="w-4 h-4" aria-hidden="true" />
              <span>Or Generate a Quick Structured Card</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => {
              const IconComponent = domain.icon;
              return (
                <Link 
                  key={domain.id}
                  href={domain.href}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${cardInnerBg} ${borderTone} hover:border-[#655A7C] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                  aria-label={`Generate quick card for ${domain.title}`}
                >
                  <div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mb-4 ${accentSolid}`} aria-hidden="true">
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
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`} role="contentinfo">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">SignMitra • Privacy-Focused Accessibility Platform</p>
          <div className="flex items-center gap-2 font-medium" role="status" aria-live="polite">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`} aria-hidden="true"></span>
            <span>Local State Engine Operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}