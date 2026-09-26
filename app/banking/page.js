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
  Moon,
  ShieldAlert,
  UserCheck,
  Send,
  BookOpen,
  ReceiptText
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

  const bankingIntents = [
    // --- P0 Priority Banking Workflows ---
    {
      id: 'upi_transfer_failure',
      title: 'Report Failed UPI / Bank Transfer',
      icon: Send,
      badge: 'P0 • DIGITAL PAYMENTS',
      desc: 'Communicate debited-but-not-credited payments, timed-out UPI transfers, or pending IMPS/NEFT batches safely.',
      actionText: 'Report Transfer'
    },
    {
      id: 'kyc_details_update',
      title: 'Update KYC & Contact Details',
      icon: UserCheck,
      badge: 'P0 • ACCOUNT SERVICES',
      desc: 'Request updates to your residential address, registered mobile number, email ID, or periodic KYC re-verification.',
      actionText: 'Update Records'
    },
    {
      id: 'cheque_services_query',
      title: 'Cheque Book Request / Stop Cheque',
      icon: BookOpen,
      badge: 'P0 • CHEQUE SERVICES',
      desc: 'Prepare a service request to present to bank staff for a new cheque book or request a stop-payment order.',
      actionText: 'Cheque Request'
    },
    {
      id: 'loan_emi_discrepancy',
      title: 'Loan Account & EMI Discrepancy',
      icon: ReceiptText,
      badge: 'P0 • LOAN & REPAYMENTS',
      desc: 'Inquire about automated EMI deductions, loan account balance statements, interest certificates, or payment errors.',
      actionText: 'Loan Query'
    },

    // --- Foundational Banking Workflows ---
    {
      id: 'transaction_issue',
      title: 'Report ATM / Point-of-Sale Issue',
      icon: CircleDollarSign,
      badge: 'DISPUTE RESOLUTION',
      desc: 'Communicate failed ATM cash dispensations, double merchant swipe deductions, or POS hardware charge errors.',
      actionText: 'Dispute Charge'
    },
    {
      id: 'card_problem',
      title: 'Request Card Blocking / Replacement',
      icon: CreditCard,
      badge: 'CARD SECURITY',
      desc: 'Present an immediate security notice to a teller to request immediate card blocking or order a chip replacement.',
      actionText: 'Manage Card'
    },
    {
      id: 'statement_request',
      title: 'Request Certified Bank Statement',
      icon: FileText,
      badge: 'ACCOUNT RECORDS',
      desc: 'Request sealed physical transaction summaries or certified bank ledger statements for official visa/tax submissions.',
      actionText: 'Get Statement'
    }
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}
    >
      {/* Top Runtime Status Bar */}
      <div
        className={`w-full border-b py-2.5 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/communication-hub"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">BANKING & FINANCIAL DIRECTORY</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-bold">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            />
            <span>P0 FINANCIAL REGISTRY ACTIVE</span>
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

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 my-auto">
        {/* Security Advisory Callout */}
        <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} mb-6 flex items-start gap-3 text-xs font-mono`}>
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#655A7C] mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block uppercase font-bold tracking-wider">Privacy & Communication Notice:</strong>
            SignMitra assists with in-person branch communication only. It never requests or stores account passwords, PINs, CVVs, or OTPs. Generated cards are communication manifests for branch tellers, not automated bank transactions.
          </div>
        </div>

        <header className={`rounded-xl border ${borderTone} p-6 sm:p-7 mb-8 shadow-sm ${cardBg}`}>
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}
          >
            <Landmark className="w-3.5 h-3.5" />
            BANKING & BRANCH SERVICES
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Select Banking Interaction
          </h1>
          <p className={`text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed ${textSecondary}`}>
            Choose an account or teller transaction context below. Each workflow produces a clear, deterministic visual card for bank officials with structured two-way responses.
          </p>
        </header>

        {/* Intent Cards with Aligned, Uniform Buttons */}
        <div className="space-y-3.5">
          {bankingIntents.map((intent) => {
            const Icon = intent.icon;

            return (
              <div
                key={intent.id}
                className={`p-5 rounded-xl border ${borderTone} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-[#655A7C] shadow-sm`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${accentSolid}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-base font-black uppercase tracking-tight font-sans">
                        {intent.title}
                      </h2>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${accentSolid}`}
                      >
                        {intent.badge}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed max-w-xl font-sans ${textSecondary}`}>
                      {intent.desc}
                    </p>
                  </div>
                </div>

                {/* Sized Action Button Matching Healthcare Alignment (sm:w-48 h-9) */}
                <div className="w-full sm:w-auto shrink-0 flex justify-end">
                  <Link
                    href={`/communication?domain=banking&intent=${intent.id}`}
                    className={`w-full sm:w-48 h-9 px-4 rounded-lg text-xs font-bold font-sans uppercase tracking-wider shadow-sm transition-all hover:opacity-90 active:scale-[0.98] inline-flex items-center justify-between ${accentSolid}`}
                  >
                    <span className="truncate">{intent.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer System Boundary */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">SignMitra Engine • Banking Interaction Registry v2.4</p>
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            />
            <span>State Machine Deterministic Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}