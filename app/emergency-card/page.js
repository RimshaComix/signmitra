'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  PhoneCall,
  MessageSquareWarning,
  PenTool,
  ShieldAlert,
  Sun,
  Moon,
  Info
} from 'lucide-react';

export default function EmergencyCommunicationCard() {
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

  const [activePhrase, setActivePhrase] = useState(null);

  const EMERGENCY_PHRASES = [
    {
      id: 'deaf_identity',
      label: 'Deaf Identity & ISL',
      phrase: 'I am Deaf and communicate using Indian Sign Language (ISL).',
      icon: ShieldAlert
    },
    {
      id: 'interpreter_request',
      label: 'Request Interpreter',
      phrase: 'Please contact an ISL interpreter immediately.',
      icon: PhoneCall
    },
    {
      id: 'written_instructions',
      label: 'Written Communication',
      phrase: 'Please write down or show me the instructions clearly.',
      icon: PenTool
    },
    {
      id: 'emergency_help',
      label: 'Contact Emergency Services',
      phrase: 'I need help contacting emergency services. Please call 112.',
      icon: MessageSquareWarning
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`} role="region" aria-label="Navigation Header">
        <div className="flex items-center gap-3">
          <Link 
            href="/communication-hub" 
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none rounded px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40" aria-hidden="true">/</span>
          <span className="text-red-600 dark:text-red-400 font-black uppercase tracking-wide">EMERGENCY CARDS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        
        {!activePhrase ? (
          // VIEW 1: Rapid Selection Menu
          <div className="animate-in fade-in duration-300 w-full max-w-2xl mx-auto space-y-6">
            <header className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
                <ShieldAlert className="w-8 h-8" aria-hidden="true" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Emergency Phrases
              </h1>
              <p className={`text-sm mt-2 font-medium ${textSecondary}`}>
                Select a message below to display it in high-visibility mode. This is a communication aid for bystanders and responders.
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="menu">
              {EMERGENCY_PHRASES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePhrase(item.phrase)}
                    role="menuitem"
                    className="p-5 sm:p-6 rounded-2xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-left flex flex-col gap-3 focus-visible:ring-4 focus-visible:ring-red-500 focus-visible:outline-none"
                  >
                    <Icon className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <span className="font-black text-lg text-red-900 dark:text-red-200 leading-snug">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`p-4 mt-8 rounded-xl border ${borderTone} ${cardInnerBg} flex items-start gap-3 text-xs font-mono font-bold opacity-80`} role="alert">
               <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
               <p>For your Medical Vault and SOS Contacts, use the main Emergency Vault screen instead of these quick phrases.</p>
            </div>
          </div>
        ) : (
          // VIEW 2: High-Visibility Presentation Screen
          <div 
            className="flex-1 flex flex-col justify-center animate-in zoom-in-95 duration-200 w-full"
            role="region" 
            aria-live="assertive"
          >
            <div className="w-full rounded-3xl border-4 border-red-600 bg-red-600 text-white shadow-2xl overflow-hidden flex flex-col min-h-[50vh]">
              
              <div className="p-6 sm:p-8 flex justify-between items-center bg-red-700/50">
                 <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest opacity-90 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" aria-hidden="true" /> Urgent Communication
                 </span>
                 <button 
                   onClick={() => setActivePhrase(null)}
                   className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs uppercase tracking-wider transition-all focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none"
                 >
                   Close
                 </button>
              </div>

              <div className="p-8 sm:p-12 md:p-16 flex-1 flex flex-col justify-center items-center text-center">
                <p className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight">
                  {activePhrase}
                </p>
              </div>
              
            </div>
            
            <p className="text-center text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 mt-6" aria-hidden="true">
              Show this screen directly to bystanders or responders
            </p>
          </div>
        )}

      </main>
    </div>
  );
}