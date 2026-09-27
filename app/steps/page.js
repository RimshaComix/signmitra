'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  MessageSquare,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const GUIDES = {
  hospital_registration: {
    title: 'Hospital OPD Registration',
    icon: '🏥',
    description: 'Steps to get a new patient file and token.',
    steps: [
      {
        action: 'Go to the main Reception or "New Patient" counter.',
        show: 'Your Aadhaar Card or Government ID.',
        expect: 'They will type your details and ask for a registration fee.'
      },
      {
        action: 'Hand over the registration fee (Cash or UPI).',
        show: 'Show your phone screen if paying by UPI.',
        expect: 'They will print a hospital file and a token number.'
      },
      {
        action: 'Take your file and ask for directions to the department.',
        show: 'Point to the doctor\'s name on the file.',
        expect: 'They will point you toward the waiting area.'
      }
    ]
  },
  bank_kyc: {
    title: 'Bank KYC Update',
    icon: '🏦',
    description: 'Update your address and ID at the home branch.',
    steps: [
      {
        action: 'Go to the Help Desk and ask for a KYC Update Form.',
        show: 'Your Bank Passbook.',
        expect: 'They will give you a 1-page paper form.'
      },
      {
        action: 'Fill out the form and attach a copy of your ID.',
        show: 'Photocopy of your ID (self-attested with signature).',
        expect: 'Wait for your turn at the teller counter.'
      },
      {
        action: 'Submit the completed form and photocopy to the teller.',
        show: 'Your original ID for them to verify.',
        expect: 'They will stamp it and say it will be updated in 24 hours.'
      }
    ]
  },
  college_exam_form: {
    title: 'College Exam Form Submission',
    icon: '🎓',
    description: 'Submit your semester exam registration physically.',
    steps: [
      {
        action: 'Get the clearance signature from your Head of Department (HOD).',
        show: 'Your filled exam form and fee receipt.',
        expect: 'The HOD will sign and stamp the bottom of the form.'
      },
      {
        action: 'Take the signed form to the Examination Cell.',
        show: 'Your Student ID Card and the signed form.',
        expect: 'The clerk will check the signature and file the document.'
      },
      {
        action: 'Ask for the counterfoil or a submission receipt.',
        show: 'Point to the tear-off slip at the bottom of the form.',
        expect: 'They will tear it off, stamp it, and hand it back to you.'
      }
    ]
  }
};

export default function VisualStepByStep() {
  const router = useRouter();
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [activeGuideKey, setActiveGuideKey] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleStartGuide = (key) => {
    setActiveGuideKey(key);
    setCurrentStepIndex(0);
    setIsCompleted(false);
  };

  const handleNextStep = () => {
    const guide = GUIDES[activeGuideKey];
    if (currentStepIndex < guide.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleBailout = () => {
    // If the user gets stuck, send them to the conversation board for live repair
    router.push('/conversation');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">VISUAL GUIDES</span>
        </div>
      </div>

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 pb-28 flex-1 flex flex-col">
        
        {!activeGuideKey ? (
          // SELECTION VIEW
          <div className="animate-in fade-in duration-300">
            <header className={`rounded-xl border ${borderTone} p-6 mb-8 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 ${cardBg}`}>
              <div>
                <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
                  <ListOrdered className="w-3.5 h-3.5" />
                  STEP-BY-STEP
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Visual Process Guides</h1>
                <p className={`text-xs sm:text-sm mt-1 max-w-sm leading-relaxed ${textSecondary}`}>
                  Follow large, clear instructions for multi-step physical processes.
                </p>
              </div>
            </header>

            <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} flex items-center gap-2 text-xs font-mono font-medium mb-6 opacity-80`}>
              <ShieldAlert className="w-4 h-4 text-[#655A7C] shrink-0" />
              <span>These are general guides. Always confirm official procedures with staff.</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {Object.entries(GUIDES).map(([key, guide]) => (
                <button
                  key={key}
                  onClick={() => handleStartGuide(key)}
                  className={`w-full text-left p-5 rounded-2xl border ${borderTone} ${cardBg} hover:-translate-y-1 hover:shadow-md transition-all group flex items-center gap-4`}
                >
                  <div className={`w-12 h-12 rounded-full border ${borderTone} ${cardInnerBg} flex items-center justify-center text-2xl shrink-0`}>
                    {guide.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-tight text-base sm:text-lg">{guide.title}</h3>
                    <p className={`text-xs font-medium mt-0.5 ${textSecondary}`}>{guide.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : !isCompleted ? (
          // ACTIVE STEP VIEW
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
            
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setActiveGuideKey(null)}
                className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all flex items-center gap-1"
              >
                ← Exit Guide
              </button>
              <div className={`px-3 py-1 rounded-full border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-widest`}>
                Step {currentStepIndex + 1} of {GUIDES[activeGuideKey].steps.length}
              </div>
            </div>

            <div className={`flex-1 rounded-3xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden flex flex-col`}>
              {/* Main Instruction */}
              <div className="p-8 sm:p-10 flex-1 flex flex-col justify-center border-b" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-60 mb-3 block">What you need to do:</span>
                <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
                  {GUIDES[activeGuideKey].steps[currentStepIndex].action}
                </h2>
              </div>

              {/* Sub-instructions */}
              <div className={`p-6 sm:p-8 bg-black/5 dark:bg-white/5 space-y-6`}>
                <div className="flex gap-4 items-start">
                  <div className={`p-2 rounded-lg ${accentSolid} shrink-0`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">What to show/provide:</span>
                    <p className="font-bold text-sm sm:text-base">{GUIDES[activeGuideKey].steps[currentStepIndex].show}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className={`p-2 rounded-lg border ${borderTone} ${cardInnerBg} shrink-0`}>
                    <Eye className="w-5 h-5 opacity-80" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">What response to expect:</span>
                    <p className="font-bold text-sm sm:text-base">{GUIDES[activeGuideKey].steps[currentStepIndex].expect}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBailout}
                className={`py-4 px-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all flex flex-col items-center justify-center gap-1.5 shrink-0 w-28`}
              >
                <AlertCircle className="w-5 h-5 text-[#655A7C] dark:text-[#FDF1E2]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-center">Need<br/>Help?</span>
              </button>
              <button
                onClick={handleNextStep}
                className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${accentSolid}`}
              >
                {currentStepIndex === GUIDES[activeGuideKey].steps.length - 1 ? (
                  <>Finish Guide <CheckCircle2 className="w-5 h-5" /></>
                ) : (
                  <>Done, Next Step <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        ) : (
          // COMPLETION VIEW
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 py-12">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl mx-auto shadow-sm mb-6 ${accentSolid}`}>
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Process Complete</h2>
            <p className={`text-sm font-medium max-w-md ${textSecondary} mb-10`}>
              You have completed all the steps for {GUIDES[activeGuideKey].title}.
            </p>
            <div className="flex flex-col w-full max-w-xs gap-3">
              <Link
                href="/followups"
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all hover:scale-[1.02] ${accentSolid}`}
              >
                Create a Follow-Up Task
              </Link>
              <button
                onClick={() => setActiveGuideKey(null)}
                className={`w-full py-4 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all`}
              >
                Return to Guides
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}