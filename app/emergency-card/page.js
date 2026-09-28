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
  Info,
  ChevronRight
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
    borderTone
  } = useTheme();

  const [activeCategory, setActiveCategory] = useState(null); // Which category is open
  const [activePhrase, setActivePhrase] = useState(null); // Which specific phrase is showing fullscreen

  // Upgraded Data Structure: Categories contain multiple specific phrases
  const EMERGENCY_CATEGORIES = [
    {
      id: 'deaf_identity',
      label: 'Deaf Identity & ISL',
      icon: ShieldAlert,
      phrases: [
        'I am Deaf and communicate using Indian Sign Language (ISL).',
        'I am Hard-of-Hearing. Please speak clearly while facing me.',
        'I cannot hear you. Please write down what you are saying.'
      ]
    },
    {
      id: 'interpreter_request',
      label: 'Request Interpreter',
      icon: PhoneCall,
      phrases: [
        'I need an Indian Sign Language (ISL) interpreter immediately.',
        'Please help me contact a qualified ISL interpreter.',
        'I will connect via Video Relay Service for an interpreter now.'
      ]
    },
    {
      id: 'written_instructions',
      label: 'Written Communication',
      icon: PenTool,
      phrases: [
        'Please write down the most important information clearly.',
        'Please explain one step at a time so I can read it.',
        'Please face me directly when speaking so I can try to lip-read.'
      ]
    },
    {
      id: 'emergency_help',
      label: 'Emergency Services',
      icon: MessageSquareWarning,
      phrases: [
        'I need help contacting emergency services. Please call 112 for me.',
        'Please call an ambulance immediately.',
        'Please contact the police immediately.'
      ]
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
          <span className="text-red-600 dark:text-red-400 font-black uppercase tracking-wide">EMERGENCY SOS</span>
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
        
        {/* VIEW 1: Rapid Selection Menu (No active phrase selected) */}
        {!activePhrase && (
          <div className="animate-in fade-in duration-300 w-full max-w-2xl mx-auto space-y-6">
            <header className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
                <ShieldAlert className="w-8 h-8" aria-hidden="true" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                SOS Phrases
              </h1>
              <p className={`text-sm mt-2 font-medium ${textSecondary}`}>
                Select a category to display a high-visibility message to bystanders or responders.
              </p>
            </header>

            <div className="space-y-4" role="menu">
              {EMERGENCY_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isExpanded = activeCategory === category.id;

                return (
                  <div key={category.id} className="rounded-2xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 overflow-hidden transition-all">
                    {/* Category Header (Click to expand) */}
                    <button
                      onClick={() => setActiveCategory(isExpanded ? null : category.id)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between focus-visible:ring-4 focus-visible:ring-red-500 focus-visible:outline-none hover:bg-red-100 dark:hover:bg-red-900/40"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-4">
                         <Icon className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
                         <span className="font-black text-xl text-red-900 dark:text-red-200 leading-snug">
                           {category.label}
                         </span>
                      </div>
                      <ChevronRight className={`w-6 h-6 text-red-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Expanded Phrase List */}
                    {isExpanded && (
                      <div className="border-t border-red-200 dark:border-red-900/50 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                         {category.phrases.map((phrase, idx) => (
                           <button
                             key={idx}
                             onClick={() => setActivePhrase(phrase)}
                             className="w-full p-4 rounded-xl text-left bg-white dark:bg-black/40 border border-red-100 dark:border-red-900/30 font-bold text-red-900 dark:text-red-100 hover:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 transition-all shadow-sm flex items-center justify-between group"
                           >
                              <span className="pr-4">{phrase}</span>
                              <MessageSquareWarning className="w-5 h-5 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity shrink-0" />
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`p-4 mt-8 rounded-xl border ${borderTone} ${cardInnerBg} flex items-start gap-3 text-xs font-mono font-bold opacity-80`} role="alert">
               <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
               <p>This screen only displays text. It does NOT automatically dial 112 or contact emergency services on your behalf.</p>
            </div>
          </div>
        )}

        {/* VIEW 2: High-Visibility Presentation Screen */}
        {activePhrase && (
          <div 
            className="flex-1 flex flex-col justify-center animate-in zoom-in-95 duration-200 w-full"
            role="region" 
            aria-live="assertive"
          >
            <div className="w-full rounded-3xl border-4 border-red-600 bg-red-600 text-white shadow-2xl overflow-hidden flex flex-col min-h-[50vh]">
              
              <div className="p-6 sm:p-8 flex justify-between items-center bg-red-700/50">
                 <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest opacity-90 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" aria-hidden="true" /> URGENT MESSAGE
                 </span>
                 <button 
                   onClick={() => setActivePhrase(null)}
                   className="px-6 py-3 rounded-xl bg-white text-red-600 hover:bg-red-50 font-black text-sm uppercase tracking-wider transition-all focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none shadow-sm"
                 >
                   Close
                 </button>
              </div>

              <div className="p-8 sm:p-12 md:p-16 flex-1 flex flex-col justify-center items-center text-center">
                <p className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight whitespace-pre-line">
                  {activePhrase}
                </p>
              </div>
              
            </div>
            
            <p className="text-center text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest opacity-60 mt-6" aria-hidden="true">
              Show this screen directly to bystanders or responders
            </p>
          </div>
        )}

      </main>
    </div>
  );
}