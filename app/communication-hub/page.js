'use client';

import React from 'react';
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
  Sparkles
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

export default function CommunicationHub() {
  // Global Theme Context Hook
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

  const domains = [
    {
      id: 'healthcare',
      title: 'Healthcare',
      icon: HeartPulse,
      badge: 'CLINICAL TRIAGE',
      desc: 'Book appointments, explain symptoms to doctors, or request pharmacy prescriptions through guided workflows.',
      href: '/healthcare',
      status: 'Active Clinical Engine'
    },
    {
      id: 'banking',
      title: 'Banking & Finance',
      icon: Landmark,
      badge: 'FINANCIAL COUNTER',
      desc: 'Resolve transaction issues, report card blockages, or handle account statements securely.',
      href: '/banking',
      status: 'Encrypted Counter State'
    },
    {
      id: 'education',
      title: 'Education & Faculty',
      icon: GraduationCap,
      badge: 'ACADEMIC DESK',
      desc: 'Coordinate with college faculty, discuss attendance issues, or submit administrative document requests.',
      href: '/education',
      status: 'Academic Interaction Ready'
    }
  ];

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

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 my-auto">
        
        {/* Header Section */}
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b pb-8 mb-10 ${borderTone}`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardBg} text-xs font-mono font-bold uppercase tracking-wider mb-4`}>
              <Sparkles className="w-3.5 h-3.5" />
              DOMAIN DISPATCH MATRIX
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-[1.08]">
              SignMitra Hub
            </h1>
            <p className={`text-sm sm:text-base mt-2.5 max-w-xl font-normal leading-relaxed ${textSecondary}`}>
              A structured communication companion for Indian Sign Language users. Select an environment to initialize a verified two-way interaction workflow.
            </p>
          </div>
          
          {/* Rapid Access Emergency Card Trigger */}
          <Link 
            href="/emergency"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all`}
            aria-label="Activate Emergency Mode"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Open Emergency Mode</span>
          </Link>
        </header>

        {/* Main Workflows Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Select Active Communication Workflow</span>
            </h2>
            <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${borderTone} ${cardBg}`}>
              3 Core Domains Ready
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {domains.map((domain) => {
              const IconComponent = domain.icon;
              return (
                <div 
                  key={domain.id}
                  className={`p-6 rounded-xl border transition-all flex flex-col justify-between ${cardBg} ${borderTone} hover:border-[#655A7C]`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${accentSolid}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}>
                        {domain.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                      {domain.title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed mb-6 font-normal ${textSecondary}`}>
                      {domain.desc}
                    </p>
                  </div>

                  <div>
                    <div className={`pt-3.5 border-t ${borderTone} mb-4 flex items-center text-xs font-mono font-bold`}>
                      <span className="opacity-75">{domain.status}</span>
                    </div>
                    <Link 
                      href={domain.href}
                      className={`w-full py-3 px-4 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all group ${accentSolid} hover:opacity-90`}
                    >
                      <span>Start Workflow</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer / System Status Indicators */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
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