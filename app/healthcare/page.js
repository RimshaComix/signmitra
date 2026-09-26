'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Calendar,
  Stethoscope,
  Pill,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  HeartPulse,
  FileText,
  FlaskConical,
  Accessibility
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

export default function HealthcareWorkflow() {
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

  const healthcareIntents = [
    // --- P0 Priority Workflows ---
    {
      id: 'reschedule_cancel_appointment',
      title: 'Reschedule / Cancel Appointment',
      icon: Calendar,
      badge: 'P0 • SCHEDULING CYCLE',
      desc: 'Modify or release an existing consultation slot with specific reasons and preferred alternative timings.',
      actionText: 'Manage Slot'
    },
    {
      id: 'medical_reports_request',
      title: 'Request Medical Reports / Records',
      icon: FileText,
      badge: 'P0 • CLINICAL RECORDS',
      desc: 'Request physical hardcopies, lab transcripts, or discharge summaries from the hospital records desk.',
      actionText: 'Request Records'
    },
    {
      id: 'diagnostic_test_request',
      title: 'Request Diagnostic Lab Test',
      icon: FlaskConical,
      badge: 'P0 • PATHOLOGY & SCANS',
      desc: 'Present a doctor order for diagnostic blood work, scans, or pathology with fasting condition verification.',
      actionText: 'Request Test'
    },
    {
      id: 'communication_assist_request',
      title: 'Request Communication Accommodation',
      icon: Accessibility,
      badge: 'P0 • ACCESSIBILITY ASSIST',
      desc: 'Request an on-site or video ISL interpreter, or instruct hospital staff to communicate via written/visual prompts.',
      actionText: 'Request Assist'
    },

    // --- Foundational Workflows ---
    {
      id: 'appointment_request',
      title: 'Book New Appointment',
      icon: Calendar,
      badge: 'SCHEDULING',
      desc: 'Set up an outpatient consultation slot with a specific specialty doctor for an upcoming date.',
      actionText: 'Book Slot'
    },
    {
      id: 'explain_symptoms',
      title: 'Explain Symptoms & Pain Triage',
      icon: Stethoscope,
      badge: 'CLINICAL TRIAGE',
      desc: 'Communicate what you are experiencing, symptom duration, and pain thresholds clearly to clinical nurses.',
      actionText: 'State Symptoms'
    },
    {
      id: 'medicine_query',
      title: 'Prescription Refill & Pharmacy',
      icon: Pill,
      badge: 'PHARMACY DISPENSARY',
      desc: 'Submit a prescription for refill, clarify dosages, or ask about generic alternatives at the medicine counter.',
      actionText: 'Pharmacy Query'
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
          <span className="opacity-90 font-bold uppercase tracking-wide">HEALTHCARE CLINICAL DIRECTORY</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-bold">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            />
            <span>P0 CLINICAL REGISTRY ACTIVE</span>
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
        <header className={`rounded-xl border ${borderTone} p-6 sm:p-7 mb-8 shadow-sm ${cardBg}`}>
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            HEALTHCARE & CLINICAL TRIAGE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Select Healthcare Interaction
          </h1>
          <p className={`text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed ${textSecondary}`}>
            Choose a guided clinical workflow below. Each interaction generates an unambiguous, high-contrast visual card with structured staff response options.
          </p>
        </header>

        {/* Workflow Cards with Exact Button Alignment */}
        <div className="space-y-3.5">
          {healthcareIntents.map((intent) => {
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

                {/* Uniform-width button box: sm:w-48 with text centering and right arrow pin */}
                <div className="w-full sm:w-auto shrink-0 flex justify-end">
                  <Link
                    href={`/communication?domain=healthcare&intent=${intent.id}`}
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
          <p className="font-bold">SignMitra Engine • Clinical Interaction Registry v2.4</p>
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