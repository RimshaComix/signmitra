'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Landmark,
  CircleDollarSign,
  CreditCard,
  FileText,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

export default function BankingWorkflow() {
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

  const intents = [
    {
      id: 'transaction_issue',
      title: 'Report a Transaction Issue',
      icon: CircleDollarSign,
      badge: 'DISPUTE RESOLUTION',
      desc: 'Communicate failed ATM withdrawals, double-deductions, or uncredited money transfers directly to branch counters.',
      actionText: 'Resolve Issue'
    },
    {
      id: 'card_problem',
      title: 'Block / Replace ATM Card',
      icon: CreditCard,
      badge: 'CARD SECURITY',
      desc: 'Instantly notify a teller that your debit/credit card is lost, damaged, stolen, or requires immediate suspension.',
      actionText: 'Manage Card'
    },
    {
      id: 'statement_request',
      title: 'Request Bank Statement',
      icon: FileText,
      badge: 'ACCOUNT RECORDS',
      desc: 'Ask for official physical printouts of your transaction histories for specific time durations (e.g., last 6 months).',
      actionText: 'Request Statement'
    }
  ];

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
            href="/communication-hub"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </Link>
          <span className="opacity-40">•</span>
          <span className="opacity-80">BANKING DISPATCH ENGINE</span>
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
            <Landmark className="w-3.5 h-3.5" />
            DOMAIN: BANKING & FINANCIAL WORKFLOWS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-[1.08]">
            Select Your Account Query
          </h1>
          <p className={`text-xs sm:text-sm mt-1.5 max-w-xl font-normal leading-relaxed ${textSecondary}`}>
            Choose an interaction context below to deploy an end-to-end communication card with a branch teller.
          </p>
        </header>

        {/* Intent Selectors */}
        <div className="space-y-4">
          {intents.map((intent) => {
            const Icon = intent.icon;
            return (
              <div
                key={intent.id}
                className={`p-5 sm:p-6 rounded-xl border ${borderTone} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 transition-all hover:border-[#655A7C] shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${accentSolid}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                        {intent.title}
                      </h2>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}
                      >
                        {intent.badge}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed max-w-xl ${textSecondary}`}>
                      {intent.desc}
                    </p>
                  </div>
                </div>

                {/* Session Route Link */}
                <Link
                  href={`/communication?domain=banking&intent=${intent.id}`}
                  className={`w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:opacity-90 group ${accentSolid}`}
                >
                  <span>{intent.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer System Boundary */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">SignMitra Engine • Banking Module v2.4</p>
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            ></span>
            <span>Deterministic Templates Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}