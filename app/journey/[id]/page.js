'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  ListOrdered,
  MessageSquare,
  CheckCircle2,
  CalendarClock,
  Save,
  PenTool,
  ThumbsUp,
  RefreshCcw,
  Info,
  CheckSquare
} from 'lucide-react';

const JOURNEY_TEMPLATES = {
  'college_visit': {
    title: 'College Office Visit',
    intent: 'Submit forms, request certificates, or resolve academic issues.',
    checklist: ['Student ID Card', 'Required application forms', 'Fee receipt or pen'],
    cards: [
      { id: 'c1', label: 'Submit Form', text: 'I am here to submit this form. Is anything else required?' },
      { id: 'c2', label: 'Request Certificate', text: 'I need to request a certificate. What is the process and fee?' },
      { id: 'c3', label: 'Check Status', text: 'I want to check the status of my previous request. Here is my ID.' }
    ]
  },
  'bank_visit': {
    title: 'Bank Branch Visit',
    intent: 'Update KYC, deposit cash, or report transaction problems.',
    checklist: ['Government ID (Aadhaar/PAN)', 'Passbook or Account Number', 'Relevant forms'],
    cards: [
      { id: 'b1', label: 'Update KYC', text: 'I need to update my KYC. Here are my documents.' },
      { id: 'b2', label: 'Deposit Cash', text: 'I want to deposit this cash into my account.' },
      { id: 'b3', label: 'Report Issue', text: 'I have an issue with a recent transaction. Please look at my statement.' }
    ]
  },
  'hospital_visit': {
    title: 'Hospital OPD Visit',
    intent: 'Register for consultation, tests, or pharmacy pickup.',
    checklist: ['Previous Medical Records', 'Prescription Slip', 'Government ID'],
    cards: [
      { id: 'h1', label: 'OPD Registration', text: 'I am here for a new OPD consultation. Where do I pay the fee?' },
      { id: 'h2', label: 'Show Prescription', text: 'Please see this prescription. Do I need to go to the pharmacy or lab next?' },
      { id: 'h3', label: 'Pharmacy Pickup', text: 'I need to collect these medicines. Are they all available?' }
    ]
  }
};

export default function UnifiedJourneyFlow() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id;
  const template = JOURNEY_TEMPLATES[journeyId];

  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [stage, setStage] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [staffResponse, setStaffResponse] = useState('');
  const [confirmationStatus, setConfirmationStatus] = useState(null); 
  const [followUpTask, setFollowUpTask] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  if (!template) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgCanvas} ${textPrimary}`}>
        <div className="text-center">
          <h1 className="font-bold mb-4">Journey not found.</h1>
          <Link href="/communication-hub" className="underline font-bold">Return to Hub</Link>
        </div>
      </div>
    );
  }

  const handleSaveSummary = () => {
    const historyItem = {
      id: `REQ-${Date.now()}`,
      domain: template.title,
      intent: selectedCard ? selectedCard.label : 'General Inquiry',
      title: `${template.title} Summary`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: followUpTask ? 'Follow-Up Planned' : 'Completed',
      verifiedByStaff: false,
      entities: {
        "Staff Response (User Recorded)": staffResponse.trim() ? staffResponse : "No response recorded",
        "Understanding": confirmationStatus === 'understood' ? "Clear" : "Needed Clarification"
      }
    };

    const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
    localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));

    if (followUpTask.trim()) {
       const task = {
          id: `FOLLOW-${Date.now()}`,
          title: `Follow-up: ${template.title}`,
          situation: 'Journey Action Item',
          category: 'Other',
          type: 'General Task',
          nextAction: followUpTask,
          dueDate: followUpDate || new Date().toISOString().split('T')[0],
          priority: 'Normal',
          status: 'Planned'
       };
       const existingTasks = JSON.parse(localStorage.getItem('signmitra_followups') || '[]');
       localStorage.setItem('signmitra_followups', JSON.stringify([task, ...existingTasks]));
    }

    alert('Journey Summary Saved to Local History!');
    router.push('/communication-hub');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} sticky top-0 z-10`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1">
            <ArrowLeft className="w-3.5 h-3.5" /> <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide truncate">{template.title}</span>
        </div>
      </div>

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        
        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-10 px-2 relative" aria-label="Journey Progress">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/10 dark:bg-white/10 -z-10 -translate-y-1/2" />
          {[
            { s: 1, icon: ListOrdered, label: 'Prepare' },
            { s: 2, icon: MessageSquare, label: 'Communicate' },
            { s: 3, icon: RefreshCcw, label: 'Confirm' },
            { s: 4, icon: Save, label: 'Wrap-up' }
          ].map((item) => (
            <div key={item.s} className="flex flex-col items-center gap-2 bg-inherit">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                stage === item.s ? `${accentSolid} border-transparent scale-110 shadow-sm` : 
                stage > item.s ? `bg-green-500 border-transparent text-white` : 
                `${cardInnerBg}${borderTone}`
              }`} aria-current={stage === item.s ? 'step' : undefined}>
                {stage > item.s ? <CheckCircle2 className="w-5 h-5" /> : <item.icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${stage >= item.s ? '' : 'opacity-40'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* STAGE 1: PREPARE */}
        {stage === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <header>
              <h1 className="text-3xl font-black uppercase tracking-tight">Prepare for your visit</h1>
              <p className={`text-sm font-medium mt-2 ${textSecondary}`}>Review your checklist and select a card to show staff.</p>
            </header>
            
            <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardInnerBg} space-y-3`}>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" /> Recommended to bring
              </h2>
              <ul className="space-y-2">
                {template.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm font-bold">
                    <div className={`w-1.5 h-1.5 rounded-full ${isDarkTheme ? 'bg-[#AB92BF]' : 'bg-[#655A7C]'}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 mb-1">Select your interaction</h2>
              {template.cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => { setSelectedCard(card); setStage(2); }}
                  className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${cardBg} ${borderTone} hover:border-[#655A7C] focus-visible:ring-4 focus-visible:ring-[#655A7C]`}
                >
                  <h3 className="font-black text-lg uppercase tracking-tight">{card.label}</h3>
                  <p className={`text-sm font-medium ${textSecondary}`}>"{card.text}"</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 2: COMMUNICATE */}
        {stage === 2 && selectedCard && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            
            <div className={`p-8 sm:p-12 rounded-3xl border-4 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#655A7C]/5'} shadow-md text-center`}>
              <p className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">"{selectedCard.text}"</p>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 mt-8">Show this screen directly to staff</p>
            </div>

            <div className={`p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4`}>
              <label htmlFor="staff-response" className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                <PenTool className="w-4 h-4" /> Record their response (Optional)
              </label>
              <textarea
                id="staff-response"
                value={staffResponse}
                onChange={(e) => setStaffResponse(e.target.value)}
                placeholder="What did they write, point to, or gesture?"
                rows={3}
                className={`w-full p-4 rounded-xl border-2 text-sm font-bold resize-none outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStage(1)} className={`px-6 py-4 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-sm uppercase tracking-wider hover:opacity-80 transition-all`}>Back</button>
              <button onClick={() => setStage(3)} className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all ${accentSolid} hover:opacity-90`}>
                Continue to Confirm
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: CLARIFY & CONFIRM */}
        {stage === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <header className="mb-8">
              <h1 className="text-3xl font-black uppercase tracking-tight">Confirm Understanding</h1>
              <p className={`text-sm font-medium mt-2 max-w-sm ${textSecondary}`}>Was your request understood? Do you clearly know what the next step is?</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setConfirmationStatus('understood'); setStage(4); }}
                className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${cardBg} ${borderTone} hover:border-green-500 focus-visible:ring-4 focus-visible:ring-green-500`}
              >
                <ThumbsUp className="w-10 h-10 text-green-500" />
                <span className="font-black text-base uppercase tracking-wider">Yes, I got it</span>
              </button>
              
              <button
                onClick={() => { setConfirmationStatus('need_clarification'); setStage(2); }}
                className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${cardBg} ${borderTone} hover:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-500`}
              >
                <RefreshCcw className="w-10 h-10 text-orange-500" />
                <span className="font-black text-base uppercase tracking-wider text-center">No, ask them to clarify</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: WRAP-UP & ACTION PLANNER */}
        {stage === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 pb-8">
            <header className="mb-6">
              <h1 className="text-3xl font-black uppercase tracking-tight">Interaction Summary</h1>
              <p className={`text-sm font-medium mt-2 max-w-md ${textSecondary}`}>Review what happened and set any necessary follow-up actions. This data is self-reported.</p>
            </header>

            <div className={`p-6 rounded-2xl border-2 ${borderTone} ${cardInnerBg} space-y-5`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block mb-1">Your Request:</span>
                <p className="font-bold text-base leading-snug">"{selectedCard?.text}"</p>
              </div>
              <div className="pt-4 border-t border-black/10 dark:border-white/10">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block mb-1">Staff Response (User Recorded):</span>
                <p className={`font-bold text-base leading-snug ${!staffResponse.trim() ? 'opacity-50 italic' : ''}`}>
                  {staffResponse.trim() ? `"${staffResponse}"` : "No response recorded."}
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4`}>
               <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                 <CalendarClock className="w-5 h-5" /> Next Action (Optional)
               </h3>
               <p className={`text-xs font-medium ${textSecondary}`}>Do you need to come back later or bring more documents?</p>
               
               <div className="space-y-3 pt-2">
                 <input
                    type="text"
                    value={followUpTask}
                    onChange={(e) => setFollowUpTask(e.target.value)}
                    placeholder="e.g., Return on Friday with signed form"
                    className={`w-full p-4 border-2 rounded-xl text-sm font-bold outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                  />
                  
                  {followUpTask.trim() && (
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className={`w-full p-4 border-2 rounded-xl text-sm font-bold outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                    />
                  )}
               </div>
            </div>

            <div className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-start gap-3`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Saving this will store the interaction locally in your <strong>History</strong> and add any pending tasks to your <strong>Planner</strong>.</p>
            </div>

            <button onClick={handleSaveSummary} className={`w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm flex justify-center items-center gap-2 transition-all ${accentSolid} hover:opacity-90 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C]`}>
              <Save className="w-5 h-5" /> Save Summary
            </button>
          </div>
        )}

      </main>
    </div>
  );
}