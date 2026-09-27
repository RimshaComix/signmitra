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
  ChevronRight,
  ShieldAlert,
  Filter,
  RotateCcw
} from 'lucide-react';

const CATEGORIES = ['All Guides', 'Healthcare', 'Banking', 'Education', 'Public Services', 'Travel & Everyday'];

const GUIDES = {
  // ==========================================
  // HEALTHCARE
  // ==========================================
  hospital_registration: {
    category: 'Healthcare',
    title: 'Hospital OPD Registration',
    icon: '🏥',
    description: 'Get assistance with outpatient registration and finding the consultation area.',
    steps: [
      { action: 'Look for the OPD registration or enquiry desk. If unsure, ask a staff member to direct you.', show: '"I need help with OPD registration. Could you please show me the correct counter?"', expect: 'Staff will point you to the correct desk.' },
      { action: 'Ask which details or documents are needed for registration.', show: '"What information or documents do I need to provide?"', expect: 'They will ask for your ID or existing referral documents.' },
      { action: 'Follow the instructions given by the registration staff. Ask for help if a form or field is unclear.', show: '"Could you please explain this section to me?"', expect: 'Staff will help you complete the required sections and take the fee.' },
      { action: 'Check the patient number, token, or registration slip provided. Ask where to wait.', show: '"Where should I wait, and how will I know when it is my turn?"', expect: 'They will hand you a file/token and point to the waiting area.' }
    ]
  },
  hospital_appointment: {
    category: 'Healthcare',
    title: 'Hospital Appointment Check-In',
    icon: '📅',
    description: 'Confirm your appointment and ask where to wait.',
    steps: [
      { action: 'Locate the appointment or department enquiry desk.', show: '"I have a hospital appointment. Could you please direct me to the correct desk?"', expect: 'Staff will direct you to the specific department counter.' },
      { action: 'Show the appointment information requested by staff.', show: '"Could you please check where I need to go for this appointment?"', expect: 'Staff will verify your booking on their system.' },
      { action: 'Ask where to wait and whether any additional check-in step is required.', show: '"Where should I wait? Is there anything else I need to complete?"', expect: 'They will give you a queue number or file.' },
      { action: 'Ask how staff will notify you or indicate when it is time to proceed.', show: '"How will I know when I should go in?"', expect: 'They will explain the token display board or promise to wave/call you.' }
    ]
  },
  diagnostic_test: {
    category: 'Healthcare',
    title: 'Diagnostic Test Registration',
    icon: '🔬',
    description: 'Ask about registration and where to go for a scheduled test.',
    steps: [
      { action: 'Ask staff where to register for the scheduled test.', show: '"I am here for a diagnostic test. Could you please show me the correct desk?"', expect: 'You will be directed to the lab billing counter.' },
      { action: 'Show the test request and ask staff to confirm the next step.', show: '"Could you please confirm where I should go for this test?"', expect: 'Staff will process the lab fee and print barcodes.' },
      { action: 'Confirm any preparation instructions directly with the facility.', show: '"Are there any preparation instructions I need to follow?"', expect: 'Staff will confirm if you need to be fasting or drink water.' },
      { action: 'Ask for the location and any check-in instructions.', show: '"Where should I go next, and where should I wait?"', expect: 'They will point you to the sample collection room.' }
    ]
  },
  pharmacy_assistance: {
    category: 'Healthcare',
    title: 'Pharmacy Prescription Assistance',
    icon: '💊',
    description: 'Communicate with pharmacy staff about a prescription and instructions.',
    steps: [
      { action: 'Locate the pharmacy counter and show the prescription.', show: '"I need help with this prescription. Could you please assist me?"', expect: 'The pharmacist will check stock and gather the medicines.' },
      { action: 'Ask the pharmacist to confirm the medicine name and availability.', show: '"Could you please confirm the medicine name and availability?"', expect: 'They will confirm if everything is in stock or offer generic alternatives.' },
      { action: 'If instructions are unclear, request that the pharmacist write them down.', show: '"Could you please explain the instructions and write them down for me?"', expect: 'They will write dosage times (e.g., 1-0-1) on the packets.' },
      { action: 'Ask the pharmacist to clarify any final questions before leaving.', show: '"I want to make sure I understood the instructions correctly. Could you please confirm them?"', expect: 'They will review the written instructions with you.' }
    ]
  },
  hospital_discharge: {
    category: 'Healthcare',
    title: 'Hospital Discharge Desk',
    icon: '🛏️',
    description: 'Ask staff to explain discharge documents and follow-up instructions.',
    steps: [
      { action: 'Ask the ward or hospital staff where discharge-related questions are handled.', show: '"I need help understanding the discharge process. Could you please guide me?"', expect: 'You will be directed to the billing or discharge counter.' },
      { action: 'Request an explanation of the documents being provided.', show: '"Could you please explain these documents and tell me which ones I should keep?"', expect: 'Staff will sort the hospital copies from your personal copies.' },
      { action: 'Ask the treating team to explain follow-up arrangements.', show: '"Could you please explain the follow-up instructions and write down the appointment details?"', expect: 'They will write down your next review date and medications.' },
      { action: 'Ask staff whether any discharge-related step is still pending.', show: '"Is anything else required before I leave?"', expect: 'They will confirm if you are fully cleared to go.' }
    ]
  },

  // ==========================================
  // BANKING
  // ==========================================
  bank_kyc: {
    category: 'Banking',
    title: 'Bank KYC Update',
    icon: '🏦',
    description: 'Ask bank staff about updating identity or address information.',
    steps: [
      { action: 'Ask staff where KYC-related requests are handled.', show: '"I need help updating my KYC details. Could you please direct me to the correct desk?"', expect: 'They will point you to the help desk or a specific counter.' },
      { action: 'Tell staff whether the request concerns address, identity details, or another field.', show: '"I would like to update my address details. Could you please explain the process?"', expect: 'They will hand you a KYC update form.' },
      { action: 'Ask which documents or forms are currently required.', show: '"Which documents do I need to provide? Could you please write the requirements down?"', expect: 'They will list the needed ID proofs (like Aadhaar or PAN) and ask for photocopies.' },
      { action: 'Ask whether the request has been received and whether any further action is needed.', show: '"Has my request been received? Is there anything else I need to do?"', expect: 'They will stamp your form and confirm the processing time.' }
    ]
  },
  cash_deposit: {
    category: 'Banking',
    title: 'Cash Deposit at Bank',
    icon: '💵',
    description: 'Find the correct counter and ask about the deposit process.',
    steps: [
      { action: 'Ask staff where cash deposits are handled.', show: '"I need help making a cash deposit. Could you please show me the correct counter?"', expect: 'They will point you to the cashier queue or a deposit machine.' },
      { action: 'Ask whether a form or other information is required.', show: '"Could you please explain what I need to complete before depositing?"', expect: 'They will point you to the deposit slips (pay-in slips).' },
      { action: 'Complete the required steps as explained by bank staff.', show: '"Could you please show me how to complete this section?"', expect: 'Staff will help you fill in your account number and cash denominations.' },
      { action: 'Ask what acknowledgement or receipt is provided.', show: '"Could you please confirm the deposit details on this receipt?"', expect: 'The cashier will stamp the counterfoil of the slip and return it to you.' }
    ]
  },
  passbook_update: {
    category: 'Banking',
    title: 'Passbook Update Request',
    icon: '📖',
    description: 'Request a passbook update and locate the available service.',
    steps: [
      { action: 'Ask staff where passbook updates are available.', show: '"I need to update my passbook. Could you please show me where to go?"', expect: 'They will point you to a machine or a specific clerk.' },
      { action: 'Ask whether the update is handled at a counter or through a machine.', show: '"Should I use a machine or visit a counter?"', expect: 'They will indicate the correct method.' },
      { action: 'If the machine or process is unclear, ask staff to guide you.', show: '"Could you please show me how to use this facility?"', expect: 'A security guard or staff member will show you how to insert the book.' },
      { action: 'Review the printed entries and ask staff about anything you do not understand.', show: '"Could you please help me understand this entry?"', expect: 'They will read the transaction code and explain it.' }
    ]
  },
  bank_statement: {
    category: 'Banking',
    title: 'Bank Statement Request',
    icon: '📄',
    description: 'Ask for an account statement and confirm formats.',
    steps: [
      { action: 'Ask where account statement requests are handled.', show: '"I need an account statement. Could you please direct me to the correct desk?"', expect: 'You will be directed to the customer service officer.' },
      { action: 'Ask what date range or statement format the bank can provide.', show: '"Could you please explain the available statement options?"', expect: 'They will ask how many months of history you need.' },
      { action: 'Ask whether a form or identity verification is required.', show: '"Is there a form or any other step I need to complete?"', expect: 'They will ask for your account number and a signature or ID check.' },
      { action: 'Ask how the statement will be provided and whether an acknowledgement is available.', show: '"How will I receive the statement, and is there a reference number?"', expect: 'They will print the statement, stamp it, and hand it to you.' }
    ]
  },
  card_issue: {
    category: 'Banking',
    title: 'Card Issue or Replacement',
    icon: '💳',
    description: 'Communicate a card-related issue and ask about replacements.',
    steps: [
      { action: 'Tell bank staff whether the card is lost, damaged, or needs replacement.', show: '"I need help with a card issue. Could you please guide me through the bank\'s process?"', expect: 'They will ask for your account details to pull up the card profile.' },
      { action: 'If the card is lost or stolen, request guidance on immediate blocking.', show: '"My card is lost. Please help me request immediate blocking through the bank\'s official process."', expect: 'They will block the card immediately to secure the account.' },
      { action: 'Ask how to request a replacement and what requirements apply.', show: '"How can I request a replacement card? Could you please explain the requirements?"', expect: 'They will ask you to fill out a standard replacement request form.' },
      { action: 'Ask for an acknowledgement or reference number.', show: '"Has my request been recorded? Is there a reference number?"', expect: 'They will confirm the request and tell you when the new card will arrive.' }
    ]
  },

  // ==========================================
  // EDUCATION
  // ==========================================
  college_exam_form: {
    category: 'Education',
    title: 'College Exam Form Submission',
    icon: '🎓',
    description: 'Ask the examination office about semester exam registration.',
    steps: [
      { action: 'Ask campus staff where exam-form enquiries are handled.', show: '"I need help with my semester examination form. Could you please direct me to the examination office?"', expect: 'They will point you to the exam cell or department admin.' },
      { action: 'Ask which form, details, documents, or fee are required.', show: '"Could you please tell me the current requirements and submission deadline?"', expect: 'They will outline the needed signatures (like HOD) and fee receipts.' },
      { action: 'Follow the official instructions and check your details.', show: '"Could you please help me check whether I have completed this form correctly?"', expect: 'The clerk will review the fields for missing information.' },
      { action: 'Submit the form and ask whether it has been received.', show: '"Has my form been received? Do I need to complete any other step?"', expect: 'They will tear off a receipt slip, stamp it, and hand it to you.' }
    ]
  },
  college_certificate: {
    category: 'Education',
    title: 'College Certificate Request',
    icon: '📜',
    description: 'Apply for bonafide, transcripts, or other documents.',
    steps: [
      { action: 'Ask whether the request is handled by the department or registrar.', show: '"I need to request an academic certificate. Could you please direct me to the correct office?"', expect: 'They will direct you to the student affairs or admin office.' },
      { action: 'Clearly name the document and its intended purpose.', show: '"I need a bonafide certificate for an application. Could you please explain how to request it?"', expect: 'They will ask you to write a formal request letter to the Principal.' },
      { action: 'Ask whether a form, supporting document, or fee is required.', show: '"What details or documents do I need to provide?"', expect: 'They will provide a fee challan or list required attachments.' },
      { action: 'Ask how and when the document can be collected.', show: '"How will I know when the certificate is ready?"', expect: 'They will give you a specific date or timeframe to return.' }
    ]
  },
  scholarship_office: {
    category: 'Education',
    title: 'Scholarship Office Visit',
    icon: '🎖️',
    description: 'Ask about scholarship requirements and application status.',
    steps: [
      { action: 'Ask the college which office handles scholarship enquiries.', show: '"I have a scholarship enquiry. Could you please direct me to the correct office?"', expect: 'You will be pointed to the specific scholarship coordinator.' },
      { action: 'State whether you need info about eligibility or status.', show: '"I need help understanding the requirements for this scholarship."', expect: 'Staff will pull up your profile or provide a checklist.' },
      { action: 'Ask for the current document list and submission method.', show: '"Could you please write down the required documents and deadline?"', expect: 'They will write down exactly what physical proofs you need to bring.' },
      { action: 'Ask what you should do next and whom to contact.', show: '"What is my next step, and where should I follow up?"', expect: 'They will explain the verification timeline.' }
    ]
  },
  meet_faculty: {
    category: 'Education',
    title: 'Meet Faculty for Academic Help',
    icon: '👨‍🏫',
    description: 'Prepare to explain an academic concern to a professor.',
    steps: [
      { action: 'Ask the department office about an appropriate time to speak.', show: '"I would like to discuss an academic question with my faculty member. Could you please help me arrange a time?"', expect: 'The admin will tell you their free hours or ask you to wait.' },
      { action: 'State the course, assignment, or concern you want to discuss.', show: '"I need clarification about this assignment. Could we discuss the requirements?"', expect: 'The professor will ask to see the assignment or syllabus.' },
      { action: 'Request written instructions or breakdown of steps.', show: '"Could you please write down the important steps or deadline?"', expect: 'The professor will write notes directly on your paper.' },
      { action: 'Repeat the key action in your own words to confirm.', show: '"I understood that I should submit this by the stated date. Is that correct?"', expect: 'They will confirm yes or clarify the detail.' }
    ]
  },
  fee_receipt: {
    category: 'Education',
    title: 'College Fee Receipt Assistance',
    icon: '🧾',
    description: 'Ask the accounts office about payment records or discrepancies.',
    steps: [
      { action: 'Ask where fee-payment enquiries are handled.', show: '"I need help with a college fee payment record. Could you please direct me to the accounts office?"', expect: 'You will be directed to the cashier or accounts desk.' },
      { action: 'State whether you need a receipt or help checking a discrepancy.', show: '"I need help checking my fee payment record. Could you please guide me?"', expect: 'They will ask for your student ID and transaction number.' },
      { action: 'Share the information requested through the official process.', show: '"I have the payment reference available. Could you please check what the next step is?"', expect: 'They will verify the ledger in their computer system.' },
      { action: 'Ask whether the record has been checked and if action is required.', show: '"Has the issue been reviewed? Is there anything else I need to provide?"', expect: 'They will print the official receipt or explain the pending status.' }
    ]
  },

  // ==========================================
  // PUBLIC SERVICES
  // ==========================================
  gov_enquiry: {
    category: 'Public Services',
    title: 'Government Service Enquiry',
    icon: '🏛️',
    description: 'Ask where to begin and what information is required.',
    steps: [
      { action: 'Ask staff where the relevant service is handled.', show: '"I need help with a government service enquiry. Could you please direct me to the correct desk?"', expect: 'They will point you to a specific department room or counter number.' },
      { action: 'State the service or information you are seeking in simple terms.', show: '"I would like information about this service. Could you please explain where I should begin?"', expect: 'They will tell you to get a form or join a queue.' },
      { action: 'Ask which documents or official instructions apply.', show: '"Could you please write down the required documents and the official next steps?"', expect: 'They will provide a checklist or point to a notice board.' },
      { action: 'Ask which office or official channel can provide updates.', show: '"Where should I go or contact for an update?"', expect: 'They will write down a desk number or website portal.' }
    ]
  },
  doc_verification: {
    category: 'Public Services',
    title: 'Document Verification Visit',
    icon: '✅',
    description: 'Ask staff to explain the verification process and next steps.',
    steps: [
      { action: 'Ask staff where document verification is handled.', show: '"I am here for document verification. Could you please show me the correct desk?"', expect: 'You will be asked to sit in a waiting area until called.' },
      { action: 'Ask staff to identify the documents required for your request.', show: '"Could you please confirm which documents I need to show?"', expect: 'They will ask for your originals and photocopies separately.' },
      { action: 'If a document is missing, ask what the official next step is.', show: '"I may be missing a document. Could you please explain what I should do next?"', expect: 'They will tell you what is missing and if you can submit it later.' },
      { action: 'Ask whether the verification is complete or if another step remains.', show: '"Has the verification been completed? Is anything else required?"', expect: 'They will stamp your file and return your original IDs.' }
    ]
  },
  police_help: {
    category: 'Public Services',
    title: 'Police Station Help Desk',
    icon: '🚓',
    description: 'Communicate a request for assistance and ask where to proceed.',
    steps: [
      { action: 'Ask the staff member where to explain your concern.', show: '"I need assistance. Could you please help me communicate my concern?"', expect: 'The reception officer will ask what the issue is.' },
      { action: 'Use short written details describing why you need assistance.', show: '"I am here because I need help with the following matter."', expect: 'The officer will read it and direct you to the correct duty officer.' },
      { action: 'Ask staff what details or documents they need from you.', show: '"Could you please write down the information you need from me?"', expect: 'They will ask for a formal written complaint and your ID.' },
      { action: 'Ask where to wait or how to obtain an update.', show: '"What should I do next, and where should I follow up?"', expect: 'They will provide a CSR/FIR copy or tell you to wait for an inspector.' }
    ]
  },

  // ==========================================
  // TRAVEL & EVERYDAY
  // ==========================================
  transport_ticket: {
    category: 'Travel & Everyday',
    title: 'Public Transport Ticket Counter',
    icon: '🚆',
    description: 'Ask for route, ticket, platform, or travel information.',
    steps: [
      { action: 'Ask where to purchase a ticket or ask about the route.', show: '"I need help travelling to this destination. Could you please direct me to the correct counter?"', expect: 'You will be directed to the booking window.' },
      { action: 'Show your destination and ask which service or route to use.', show: '"Could you please confirm which bus or train goes to this destination?"', expect: 'The clerk will check the schedule and display the fare.' },
      { action: 'Ask for the platform, stop, or departure information.', show: '"Where should I board, and how can I identify the correct service?"', expect: 'They will write or gesture the platform/gate number.' },
      { action: 'Check the destination shown on the ticket.', show: '"Could you please confirm that this ticket is for my intended destination?"', expect: 'They will point to the destination printed on your ticket.' }
    ]
  },
  lost_item: {
    category: 'Travel & Everyday',
    title: 'Lost Item Assistance',
    icon: '🔍',
    description: 'Report a lost item and understand how to check for updates.',
    steps: [
      { action: 'Ask staff where lost-item reports are handled.', show: '"I have lost an item. Could you please direct me to the help desk or lost-and-found office?"', expect: 'They will direct you to security or the station master.' },
      { action: 'Give a brief description and the approximate place it was lost.', show: '"I lost this item around this location. Could you please help me report it?"', expect: 'Staff will check their daily logs or physical inventory.' },
      { action: 'Ask whether the office records lost-item details.', show: '"Could you please explain how I can register this report?"', expect: 'They will hand you a register book to write your details.' },
      { action: 'Ask where and when to check for updates.', show: '"How can I check whether the item has been found?"', expect: 'They will provide a reference number or contact phone number.' }
    ]
  }
};

export default function VisualStepByStep() {
  const router = useRouter();
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [activeCategory, setActiveCategory] = useState('All Guides');
  const [activeGuideKey, setActiveGuideKey] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const filteredGuides = Object.entries(GUIDES).filter(([_, guide]) => 
    activeCategory === 'All Guides' || guide.category === activeCategory
  );

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

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

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

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 flex-1 flex flex-col">
        
        {!activeGuideKey ? (
          // SELECTION VIEW
          <div className="animate-in fade-in duration-300">
            <header className={`rounded-xl border ${borderTone} p-5 sm:p-6 mb-5 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 ${cardBg}`}>
              <div>
                <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
                  <ListOrdered className="w-3.5 h-3.5" />
                  STEP-BY-STEP
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Visual Process Guides</h1>
                <p className={`text-xs sm:text-sm mt-1 max-w-sm leading-relaxed font-medium ${textSecondary}`}>
                  Follow clear instructions for multi-step physical processes. Each guide helps you prepare, communicate, and confirm the next step.
                </p>
              </div>
            </header>

            <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} flex items-start gap-3 text-xs font-mono font-bold mb-5 opacity-90 leading-relaxed`}>
              <ShieldAlert className="w-5 h-5 text-[#655A7C] shrink-0 mt-0.5" />
              <span>These are general communication guides, not official procedures. Confirm current requirements with staff.</span>
            </div>

            {/* Category Filter Bar */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
              <div className="flex items-center pr-2 opacity-50 shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    activeCategory === category 
                      ? accentSolid + ' border-transparent' 
                      : `${borderTone}${cardBg} hover:opacity-80`
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredGuides.map(([key, guide]) => (
                <button
                  key={key}
                  onClick={() => handleStartGuide(key)}
                  className={`w-full text-left p-4 rounded-xl border ${borderTone} ${cardBg} hover:border-[#655A7C] transition-all group flex items-center gap-4`}
                >
                  <div className={`w-10 h-10 rounded-lg border ${borderTone} ${cardInnerBg} flex items-center justify-center text-xl shrink-0`}>
                    {guide.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black uppercase tracking-tight text-sm sm:text-base truncate">{guide.title}</h3>
                    <p className={`text-[11px] sm:text-xs font-medium mt-0.5 ${textSecondary} line-clamp-1`}>{guide.description}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              ))}
              
              {filteredGuides.length === 0 && (
                <div className={`p-8 text-center border border-dashed ${borderTone} rounded-xl opacity-70`}>
                  <p className="font-mono text-xs uppercase tracking-wider">No guides found in this category.</p>
                </div>
              )}
            </div>
          </div>
        ) : !isCompleted ? (
          // ACTIVE STEP VIEW
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
            
            <div className="flex justify-between items-center mb-5">
              <button 
                onClick={() => setActiveGuideKey(null)}
                className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all flex items-center gap-1"
              >
                ← Exit Guide
              </button>
              <div className={`px-3 py-1 rounded border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-widest`}>
                Step {currentStepIndex + 1} of {GUIDES[activeGuideKey].steps.length}
              </div>
            </div>

            <div className={`flex-1 rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden flex flex-col`}>
              {/* Main Instruction */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center border-b" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 mb-2 block">Action Required:</span>
                <h2 className="text-2xl sm:text-3xl font-black leading-snug tracking-tight">
                  {GUIDES[activeGuideKey].steps[currentStepIndex].action}
                </h2>
              </div>

              {/* Sub-instructions */}
              <div className={`p-5 sm:p-6 bg-black/5 dark:bg-white/5 space-y-5`}>
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2 rounded-lg ${accentSolid} shrink-0`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">Show Staff:</span>
                    <p className="font-bold text-sm sm:text-base">{GUIDES[activeGuideKey].steps[currentStepIndex].show}</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className={`p-2 rounded-lg border ${borderTone} ${cardInnerBg} shrink-0`}>
                    <Eye className="w-4 h-4 opacity-80" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">What to expect:</span>
                    <p className="font-bold text-sm sm:text-base">{GUIDES[activeGuideKey].steps[currentStepIndex].expect}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2.5 mt-5">
              {currentStepIndex > 0 && (
                <button
                  onClick={() => setCurrentStepIndex(prev => prev - 1)}
                  className={`py-3.5 px-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all font-mono font-bold text-xs uppercase tracking-wider shrink-0`}
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNextStep}
                className={`flex-1 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 ${accentSolid}`}
              >
                {currentStepIndex === GUIDES[activeGuideKey].steps.length - 1 ? (
                  <>Mark Complete <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /></>
                ) : (
                  <>Next Step <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></>
                )}
              </button>
            </div>
          </div>
        ) : (
          // COMPLETION VIEW
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 py-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mx-auto shadow-sm mb-5 ${accentSolid}`}>
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">Guide Completed</h2>
            <p className={`text-xs sm:text-sm font-medium max-w-sm ${textSecondary} mb-8 leading-relaxed`}>
              You have reached the end of this general guide. Confirm any remaining requirements or next steps with staff.
            </p>
            <div className="flex flex-col w-full max-w-xs gap-2.5">
              <Link
                href="/followups"
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all hover:opacity-90 ${accentSolid}`}
              >
                Create Follow-Up
              </Link>
              <button
                onClick={() => { setCurrentStepIndex(0); setIsCompleted(false); }}
                className={`w-full py-3.5 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Review Steps
              </button>
              <button
                onClick={() => setActiveGuideKey(null)}
                className={`w-full py-3.5 rounded-xl border border-dashed ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all`}
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