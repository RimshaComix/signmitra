'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  Compass,
  Building,
  GraduationCap,
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

// Maps user-friendly questions to your actual system intents
const WIZARD_MAP = {
  healthcare: {
    icon: Activity,
    label: 'Hospital or Clinic',
    questions: [
      { label: 'See a doctor or book an appointment', intent: 'appointment_request' },
      { label: 'Get medicines from the pharmacy', intent: 'medicine_query' },
      { label: 'Give blood or do a lab test', intent: 'diagnostic_test_request' },
      { label: 'Collect my medical reports', intent: 'medical_reports_request' },
      { label: 'I am not feeling well (Symptoms/Emergency)', intent: 'explain_symptoms' },
      { label: 'Change or cancel my appointment', intent: 'reschedule_cancel_appointment' },
      { label: 'Ask for a sign language interpreter/help', intent: 'communication_assist_request' }
    ]
  },
  banking: {
    icon: Building,
    label: 'Bank or Financial Office',
    questions: [
      { label: 'My UPI payment or online transfer failed', intent: 'upi_transfer_failure' },
      { label: 'ATM machine took my money but no cash came out', intent: 'transaction_issue' },
      { label: 'I lost my ATM card or need a new one', intent: 'card_problem' },
      { label: 'Update my phone number, email, or address (KYC)', intent: 'kyc_details_update' },
      { label: 'Ask about my loan or EMI deduction', intent: 'loan_emi_discrepancy' },
      { label: 'Order a new cheque book or stop a cheque', intent: 'cheque_services_query' },
      { label: 'Get my official bank statement printed', intent: 'statement_request' }
    ]
  },
  education: {
    icon: GraduationCap,
    label: 'College or University',
    questions: [
      { label: 'Issue with my exam marks or hall ticket', intent: 'exam_issue' },
      { label: 'Register for a subject or change my course', intent: 'course_registration' },
      { label: 'Pay fees or ask about my scholarship', intent: 'fee_scholarship_query' },
      { label: 'Meet a teacher or professor', intent: 'meet_faculty' },
      { label: 'They marked me absent by mistake', intent: 'attendance_issue' },
      { label: 'Get my transcript or official certificate', intent: 'certificate_request' },
      { label: 'Ask for accessibility help in class', intent: 'education_accessibility_request' }
    ]
  }
};

export default function GuidedWorkflowFinder() {
  const router = useRouter();
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid } = useTheme();

  const [step, setStep] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState(null);

  const handleDomainSelect = (domain) => {
    setSelectedDomain(domain);
    setSelectedIntent(null);
    setStep(2);
  };

  const handleIntentSelect = (intent) => {
    setSelectedIntent(intent);
    setStep(3);
  };

  const handleLaunch = () => {
    router.push(`/communication?domain=${selectedDomain}&intent=${selectedIntent}`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">GUIDED ASSISTANT</span>
        </div>
      </div>

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col">
        
        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-black/10 dark:bg-white/10 z-0"></div>
          {[1, 2, 3].map((num) => (
            <div 
              key={num} 
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300
                ${step >= num ? accentSolid + ' scale-110' : `${cardInnerBg}${borderTone} border opacity-50`}`}
            >
              {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
            </div>
          ))}
        </div>

        <header className="mb-10 text-center">
          <div className={`inline-flex items-center justify-center p-3 rounded-full mb-4 shadow-sm ${accentSolid}`}>
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            {step === 1 && "Where are you right now?"}
            {step === 2 && "What are you trying to do?"}
            {step === 3 && "Ready to communicate."}
          </h1>
          <p className={`text-sm sm:text-base mt-2 font-medium max-w-md mx-auto ${textSecondary}`}>
            {step === 1 && "Select the type of place you are visiting so we can prepare the right tools."}
            {step === 2 && "Choose the option that best matches what you need help with."}
            {step === 3 && "We found the perfect workflow for your situation."}
          </p>
        </header>

        {/* STEP 1: Select Domain */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(WIZARD_MAP).map(([domainKey, data]) => {
              const Icon = data.icon;
              return (
                <button
                  key={domainKey}
                  onClick={() => handleDomainSelect(domainKey)}
                  className={`p-6 rounded-2xl border ${borderTone} ${cardBg} shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center text-center gap-4`}
                >
                  <div className={`p-4 rounded-full border ${borderTone} ${cardInnerBg}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="font-bold uppercase tracking-wider text-sm">{data.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 2: Select Intent */}
        {step === 2 && selectedDomain && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {WIZARD_MAP[selectedDomain].questions.map((q) => (
              <button
                key={q.intent}
                onClick={() => handleIntentSelect(q.intent)}
                className={`w-full p-4 rounded-xl border text-left font-bold text-sm sm:text-base transition-all
                  ${cardBg} ${borderTone} hover:border-[#655A7C] flex items-center justify-between group active:scale-[0.99]`}
              >
                <span>{q.label}</span>
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
              </button>
            ))}
            
            <button 
              onClick={() => setStep(1)}
              className={`w-full p-4 mt-4 rounded-xl border border-dashed ${borderTone} ${cardInnerBg} text-xs font-mono font-bold uppercase tracking-wider text-center opacity-70 hover:opacity-100 transition-all`}
            >
              ← Go back and change location
            </button>
          </div>
        )}

        {/* STEP 3: Confirm & Launch */}
        {step === 3 && selectedIntent && (
          <div className="animate-in zoom-in-95 duration-300 text-center space-y-8">
            <div className={`p-8 rounded-2xl border ${borderTone} ${cardBg} shadow-sm`}>
              <div className="inline-flex items-center gap-2 mb-4">
                <Compass className="w-5 h-5 text-[#655A7C] dark:text-[#FDF1E2]" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-70">
                  Selected Workflow
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">
                {WIZARD_MAP[selectedDomain].questions.find(q => q.intent === selectedIntent)?.label}
              </h2>
              <div className={`inline-block px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest border ${borderTone} ${cardInnerBg}`}>
                Domain: {selectedDomain}
              </div>
            </div>

            <button
              onClick={handleLaunch}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${accentSolid}`}
            >
              <span>Start Communication Setup</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setStep(2)}
              className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all"
            >
              Wait, I need something else
            </button>
          </div>
        )}

      </main>
    </div>
  );
}