'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  FileText,
  BookOpen,
  ReceiptText,
  Hand,
  ShieldAlert
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

export default function EducationWorkflow() {
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

  const educationIntents = [
    // --- P0 Priority Academic Workflows ---
    {
      id: 'exam_issue',
      title: 'Exam / Internal Assessment Issue',
      icon: FileText,
      badge: 'P0 • EXAMINATION SUPPORT',
      desc: 'Communicate internal-mark discrepancies, exam schedule concerns, hall-ticket issues, or assessment-record questions.',
      actionText: 'Resolve Exam Query'
    },
    {
      id: 'course_registration',
      title: 'Course Registration / Subject Query',
      icon: BookOpen,
      badge: 'P0 • ACADEMIC ENROLLMENT',
      desc: 'Request clarification about course registration, elective selection, subject enrollment, or registration discrepancies.',
      actionText: 'Manage Enrollment'
    },
    {
      id: 'fee_scholarship_query',
      title: 'Fees / Scholarship Assistance',
      icon: ReceiptText,
      badge: 'P0 • STUDENT FINANCE DESK',
      desc: 'Prepare requests about fee-payment discrepancies, fee receipts, scholarship application status, or installment options for the relevant campus office.',
      actionText: 'Get Fee Assistance'
    },
    {
      id: 'education_accessibility_request',
      title: 'Request Accessibility Support',
      icon: Hand,
      badge: 'P0 • CAMPUS ACCESSIBILITY',
      desc: 'Request written instructions, visual communication support, accessible faculty interaction, or interpreter assistance where available.',
      actionText: 'Request Support'
    },

    // --- Foundational Academic Workflows ---
    {
      id: 'meet_faculty',
      title: 'Meet Faculty / Professor',
      icon: Users,
      badge: 'FACULTY CONSULTATION',
      desc: 'Request a meeting for project guidance, assignment clarification, academic concerns, or recommendation-letter discussions.',
      actionText: 'Schedule Meeting'
    },
    {
      id: 'attendance_issue',
      title: 'Attendance Discrepancy Query',
      icon: ClipboardCheck,
      badge: 'ATTENDANCE AUDIT',
      desc: 'Report an attendance mismatch with the relevant course and class date, and request verification from faculty or the academic office.',
      actionText: 'Check Attendance'
    },
    {
      id: 'certificate_request',
      title: 'Request Official Documents',
      icon: FileCheck,
      badge: 'REGISTRAR DESK',
      desc: 'Prepare requests for bonafide certificates, transcripts, academic certificates, or No Objection Certificates.',
      actionText: 'Request Documents'
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
          <span className="opacity-90 font-bold uppercase tracking-wide">EDUCATION & ACADEMIC DIRECTORY</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-bold">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            />
            <span>P0 ACADEMIC REGISTRY ACTIVE</span>
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
            SignMitra supports in-person campus communication. It does not require portal passwords, OTPs, or student login credentials. Generated cards are communication aids for presenting requests to faculty or campus staff; they do not submit or process institutional requests.
          </div>
        </div>

        <header className={`rounded-xl border ${borderTone} p-6 sm:p-7 mb-8 shadow-sm ${cardBg}`}>
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            EDUCATION & CAMPUS WORKFLOWS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Academic Operations Hub
          </h1>
          <p className={`text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed ${textSecondary}`}>
            Choose a guided academic workflow to communicate with faculty, examination staff, or campus offices. Each interaction generates a structured communication card with clear student requests and staff response options.
          </p>
        </header>

        {/* Intent Cards with Aligned, Uniform Buttons */}
        <div className="space-y-3.5">
          {educationIntents.map((intent) => {
            const Icon = intent.icon;

            return (
              <div
                key={intent.id}
                className={`p-5 rounded-xl border ${borderTone} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-[#655A7C] shadow-sm group`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${accentSolid}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-base font-black uppercase tracking-tight font-sans group-hover:underline">
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

                {/* Uniform-width button box (sm:w-48 h-9) */}
                <div className="w-full sm:w-auto shrink-0 flex justify-end">
                  <Link
                    href={`/communication?domain=education&intent=${intent.id}`}
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
          <p className="font-bold">SignMitra Engine • Education Interaction Registry v2.5</p>
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