'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle2,
  X,
  FileText,
  Send,
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

const WORKFLOW_CONFIGS = {
  appointment_request: {
    title: 'Healthcare Appointment Request',
    fields: [
      { id: 'doctor', label: 'Select Specialist / Doctor Type', type: 'select', options: ['Cardiologist', 'Dentist', 'General Physician', 'Orthopedic', 'Pediatrician'], required: true },
      { id: 'date', label: 'Select Appointment Date', type: 'date', required: true },
      { id: 'time', label: 'Select Preferred Time', type: 'time', required: true },
      { id: 'reason', label: 'Reason for Visit (Optional)', type: 'text', required: false }
    ],
    templates: {
      review: (entities) => `I want to book an appointment with a ${entities.doctor || '[Doctor]'} on ${entities.date || '[Date]'} at ${entities.time || '[Time]'}.${entities.reason ? ` Reason: ${entities.reason}.` : ''}`,
      completed: (entities, response) => `Appointment Confirmed! Doctor: ${entities.doctor}. Final Time Slot: ${response || entities.time}.`
    },
    staffOptions: ['Confirm 10:30 AM Slot', 'Reschedule to 11:30 AM', 'Reschedule to 2:00 PM', 'Fully Booked / Cancel']
  },
  explain_symptoms: {
    title: 'Symptom Explanation',
    fields: [
      { id: 'symptom', label: 'Primary Symptom', type: 'select', options: ['Chest Pain', 'Severe Headache', 'Stomach Ache', 'Fever', 'Joint Pain'], required: true },
      { id: 'duration', label: 'How long has this been happening?', type: 'select', options: ['A few hours', '1-2 Days', 'More than a week'], required: true },
      { id: 'severity', label: 'Pain Severity Level', type: 'select', options: ['Mild', 'Moderate', 'Severe / High Pain'], required: true }
    ],
    templates: {
      review: (entities) => `I am experiencing ${entities.symptom || '[Symptom]'} for the past ${entities.duration || '[Duration]'}. The intensity is ${entities.severity || '[Severity]'}.`,
      completed: (entities, response) => `Symptoms logged with staff. Next step: ${response || 'Awaiting triage instructions.'}`
    },
    staffOptions: ['Understood, wait outside Room 4', 'Requires immediate emergency room triage', 'Please proceed to Pharmacy for collection']
  },
  transaction_issue: {
    title: 'Banking Transaction Issue',
    fields: [
      { id: 'accountType', label: 'Select Account Type', type: 'select', options: ['Savings Account', 'Current Account'], required: true },
      { id: 'issueType', label: 'Select Issue Context', type: 'select', options: ['ATM Cash Not Dispensed but Amount Deducted', 'Double Deduction on Merchant Payment', 'Failed Online Transfer / Amount Frozen'], required: true },
      { id: 'amount', label: 'Approximate Transaction Amount (INR)', type: 'text', required: true },
      { id: 'txnDate', label: 'Date of Transaction', type: 'date', required: true }
    ],
    templates: {
      review: (entities) => `I want to report a transaction issue regarding my ${entities.accountType || '[Account]'}. The issue is: "${entities.issueType || '[Issue]'}". The total affected amount is ₹${entities.amount || '[Amount]'} on date ${entities.txnDate || '[Date]'}.`,
      completed: (entities, response) => `Transaction dispute logged. Reference action initiated: ${response || 'Processing complaint registration.'}`
    },
    staffOptions: ['Complaint logged. Amount will reverse in 3-5 working days.', 'Please provide physical transaction receipt/slip.', 'Branch manager must verify. Please wait at Counter 2.']
  },
  card_problem: {
    title: 'Block / Replace Debit Card',
    fields: [
      { id: 'cardAction', label: 'What do you need to do?', type: 'select', options: ['Block Lost/Stolen Card Immediately', 'Replace Damaged / Faulty Card'], required: true },
      { id: 'cardType', label: 'Select Card Variant', type: 'select', options: ['RuPay Debit Card', 'Visa Debit Card', 'Mastercard Debit Card'], required: true }
    ],
    templates: {
      review: (entities) => `I need to ${entities.cardAction || '[Take Action]'} for my ${entities.cardType || '[Card]'}. My card is linked to this registered phone number.`,
      completed: (entities, response) => `Card status updated successfully. Action status: ${response || 'Processing security lock.'}`
    },
    staffOptions: ['Card suspended instantly. Security block active.', 'Card replacement order submitted. Collect in 7 business days.', 'Please verify identity with physical government ID / PAN card.']
  },
  statement_request: {
    title: 'Request Account Statement',
    fields: [
      { id: 'duration', label: 'Select Statement Duration', type: 'select', options: ['Last 3 Months', 'Last 6 Months', 'Current Financial Year'], required: true },
      { id: 'deliveryMode', label: 'How would you like to receive it?', type: 'select', options: ['Print Physical Copy Right Now', 'Send PDF Statement to Registered Email'], required: true }
    ],
    templates: {
      review: (entities) => `I request an official account statement for the duration: ${entities.duration || '[Duration]'}. Please ${entities.deliveryMode || '[Delivery Mode]'}.`,
      completed: (entities, response) => `Account history request processed. Resolution: ${response || 'Dispatched details.'}`
    },
    staffOptions: ['Printing physical copy now. Please wait 2 minutes.', 'Sent encrypted digital statement to your email.', 'Passbook update machine is active outside. Please check.']
  },
  meet_faculty: {
    title: 'Meet Faculty / Professor',
    fields: [
      { id: 'department', label: 'Select Academic Department', type: 'select', options: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Business Administration', 'Basic Sciences'], required: true },
      { id: 'purpose', label: 'Purpose of Meeting', type: 'select', options: ['Project Review & Guidance', 'Assignment Grading Clarification', 'Letter of Recommendation Request', 'General Academic Advising'], required: true }
    ],
    templates: {
      review: (entities) => `I want to meet a faculty member from the ${entities.department || '[Department]'} department for "${entities.purpose || '[Purpose]'}".`,
      completed: (entities, response) => `Faculty meeting request processed. Resolution: ${response || 'Meeting slot coordinated.'}`
    },
    staffOptions: ['Please wait, the professor will see you in 10 minutes.', 'The professor is out today. Please schedule an appointment via email.', 'Please take a seat inside the waiting lounge.']
  },
  attendance_issue: {
    title: 'Attendance Discrepancy Query',
    fields: [
      { id: 'courseCode', label: 'Enter Course Name / Code', type: 'text', required: true },
      { id: 'absenceDate', label: 'Date of Marked Absence', type: 'date', required: true },
      { id: 'reason', label: 'Reason for Discrepancy', type: 'select', options: ['Present in Class but Marked Absent', 'Medical Leave (Medical Certificate Attached)', 'Official College Event Duty Leave'], required: true }
    ],
    templates: {
      review: (entities) => `I want to report an attendance issue for course "${entities.courseCode || '[Course]'}"[cite: 25]. I was marked absent on ${entities.absenceDate || '[Date]'} due to: ${entities.reason || '[Reason]'}[cite: 25].`,
      completed: (entities, response) => `Attendance correction file evaluated. Update: ${response || 'Processing manual system correction.'}`
    },
    staffOptions: ['Attendance updated to Present in the system portals.', 'Please submit your physical medical certificate/duty leave slip.', 'Please speak directly with the subject teacher for approval.']
  },
  certificate_request: {
    title: 'Academic Document / Certificate Request',
    fields: [
      { id: 'docType', label: 'Select Required Document', type: 'select', options: ['Official Academic Transcript', 'Bonafide Student Certificate', 'No Objection Certificate (NOC)', 'Migration Certificate'], required: true },
      { id: 'urgency', label: 'Timeline Required', type: 'select', options: ['Standard Processing (3-5 Days)', 'Urgent Requirement (Same Day/Immediate)'], required: true }
    ],
    templates: {
      review: (entities) => `I request a ${entities.docType || '[Document]'} with a processing status of: ${entities.urgency || '[Urgency]'}.`,
      completed: (entities, response) => `Document generation order updated. Status: ${response || 'Request sent to registrar office.'}`
    },
    staffOptions: ['Document is ready. Processing printing right now.', 'Request logged. Please collect from the registrar office after 2 days.', 'Please clear outstanding fees before certificate issue.']
  }
};

function CommunicationCanvasBody() {
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

  const searchParams = useSearchParams();
  const intent = searchParams.get('intent') || 'appointment_request';
  const domain = searchParams.get('domain') || 'healthcare';
  const config = WORKFLOW_CONFIGS[intent] || WORKFLOW_CONFIGS.appointment_request;

  const [currentState, setCurrentState] = useState('collecting');
  const [historyStates, setHistoryStates] = useState([]);
  const [entities, setEntities] = useState({});
  const [staffResponse, setStaffResponse] = useState('');
  const [errors, setErrors] = useState({});
  const [serverSessionId, setServerSessionId] = useState(null);

  useEffect(() => {
    import('@/components/api')
      .then(({ signMitraAPI }) => {
        signMitraAPI.createSession(domain, intent)
          .then(data => setServerSessionId(data.sessionId))
          .catch(() => console.log('Running locally inside standalone PWA mode.'));
      })
      .catch(() => {});
  }, [domain, intent]);

  const handleInputChange = (fieldId, value) => {
    setEntities(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: null }));
  };

  const transitionTo = async (nextState, updatedEntities = null) => {
    setHistoryStates(prev => [...prev, currentState]);
    setCurrentState(nextState);

    if (serverSessionId) {
      try {
        const { signMitraAPI } = await import('@/components/api');
        let actionType = 'SUBMIT_ENTITY';
        if (nextState === 'awaiting_confirmation') actionType = 'HANDOFF_STAFF';
        await signMitraAPI.transitionSession(serverSessionId, actionType, updatedEntities || entities);
      } catch (err) {
        console.log('Local transition lifecycle cached.');
      }
    }
  };

  const handleBack = async () => {
    if (historyStates.length > 0) {
      const prev = historyStates[historyStates.length - 1];
      setHistoryStates(prev => prev.slice(0, -1));
      setCurrentState(prev);

      if (serverSessionId) {
        try {
          const { signMitraAPI } = await import('@/components/api');
          await signMitraAPI.transitionSession(serverSessionId, 'BACK');
        } catch (err) {
          console.log('Local fallback applied.');
        }
      }
    }
  };

  const handleValidateAndReview = (e) => {
    e.preventDefault();
    const newErrors = {};
    config.fields.forEach(field => {
      if (field.required && !entities[field.id]) {
        newErrors[field.id] = `${field.label} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      transitionTo('review', entities);
    }
  };

  const handleStaffSelect = async (optionText, customInput = '') => {
    setStaffResponse(optionText || customInput);
    setCurrentState('completed');

    if (serverSessionId) {
      try {
        const { signMitraAPI } = await import('@/components/api');
        await signMitraAPI.submitStaffResponse(serverSessionId, optionText, customInput);
      } catch (err) {
        console.log('Local completion snapshot saved.');
      }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Runtime Status Bar */}
      <div className={`w-full border-b py-2 px-4 sm:px-6 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-2">
          <Link
            href={`/${domain}`}
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Back</span>
          </Link>
          <span className="opacity-40">•</span>
          <span className="opacity-80">SESSION RUNTIME CORE</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 my-auto">
        
        {/* Dynamic Header Box */}
        <header className={`rounded-xl border ${borderTone} p-6 sm:p-7 mb-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${cardBg}`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardInnerBg} text-[11px] font-mono font-bold uppercase tracking-wider mb-3`}>
              <Sparkles className="w-3.5 h-3.5" />
              DOMAIN: {domain.toUpperCase()}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-[1.08]">
              {config.title}
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-xl ${textSecondary}`}>
              Structured communication session. Fill required fields to generate an unambiguous exchange card.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded border ${borderTone} ${cardInnerBg} uppercase tracking-wider`}>
              STATE: {currentState.replace('_', ' ')}
            </span>
            {currentState !== 'completed' && (
              <button
                onClick={() => { if (confirm("Cancel current workflow?")) window.location.href = `/${domain}` }}
                className={`p-2 rounded-lg border ${borderTone} hover:opacity-80 transition-all ${cardInnerBg}`}
                title="Cancel Workflow"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* STATE 1: Collecting (User inputs information) */}
        {currentState === 'collecting' && (
          <form onSubmit={handleValidateAndReview} className={`p-6 sm:p-7 rounded-xl border ${borderTone} shadow-sm space-y-5 ${cardBg}`}>
            {config.fields.map(field => (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">
                  {field.label} {field.required && <span className="opacity-70">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={entities[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                  >
                    <option value="" disabled className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>-- Choose Option --</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt} className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={entities[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    onClick={(e) => { if (field.type === 'date' || field.type === 'time') e.target.showPicker?.() }}
                    placeholder="Enter details..."
                    className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C] cursor-pointer`}
                  />
                )}
                {errors[field.id] && (
                  <p className="text-[11px] font-mono font-bold text-red-500">{errors[field.id]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              className={`w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 ${accentSolid}`}
            >
              <span>Generate Communication Card</span>
              <FileText className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STATE 2: Review (User reviews generated card) */}
        {currentState === 'review' && (
          <div className="space-y-6">
            <div className={`p-6 sm:p-7 rounded-xl border ${borderTone} space-y-4 shadow-sm ${cardBg}`}>
              <div className="flex items-center justify-between border-b pb-3.5" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${borderTone} ${cardInnerBg} inline-block`}>
                  PREPARED COMMUNICATION CARD
                </span>
                <span className="text-[11px] font-mono font-bold opacity-75">Ready to Show</span>
              </div>
              <p className="text-lg sm:text-xl font-black leading-relaxed">
                "{config.templates.review(entities)}"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBack}
                className={`sm:w-1/3 py-3 rounded-lg border ${borderTone} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all ${cardBg}`}
              >
                ← Edit Info
              </button>
              <button
                onClick={() => transitionTo('awaiting_confirmation')}
                className={`sm:w-2/3 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 ${accentSolid}`}
              >
                Hand Phone to Staff →
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: Awaiting Confirmation (Clean screen for recipient/teller) */}
        {currentState === 'awaiting_confirmation' && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${borderTone} text-center font-bold text-xs sm:text-sm bg-[#AB92BF]/25 shadow-sm`}>
              👋 Hand this device to the staff member or receptionist.
            </div>

            <div className={`p-6 sm:p-7 rounded-xl border ${borderTone} space-y-3 shadow-sm ${cardInnerBg}`}>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${borderTone} ${cardBg} inline-block`}>
                MESSAGE FROM VISITOR
              </span>
              <p className="text-xl sm:text-2xl font-black leading-snug">
                "{config.templates.review(entities)}"
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-85">
                Staff: Select a Response Option
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {config.staffOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => handleStaffSelect(option)}
                    className={`w-full text-left p-4 rounded-xl font-bold text-xs sm:text-sm border transition-all ${cardBg} ${borderTone} hover:border-[#655A7C] active:scale-[0.99]`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-85">
                Or Type a Custom Response:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="customStaffText"
                  placeholder="Type message here if options do not match..."
                  className={`p-3 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleStaffSelect(null, e.target.value.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const val = document.getElementById('customStaffText')?.value;
                    if (val?.trim()) {
                      handleStaffSelect(null, val.trim());
                    }
                  }}
                  className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 flex items-center gap-1.5 ${accentSolid}`}
                >
                  <span>Submit</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleBack}
              className={`w-full border border-dashed ${borderTone} py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider hover:opacity-80 transition-all ${cardBg}`}
            >
              ← Return Device to User (Go Back)
            </button>
          </div>
        )}

        {/* STATE 4: Completed (Handback Summary) */}
        {currentState === 'completed' && (
          <div className="space-y-6 text-center py-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mx-auto shadow-sm ${accentSolid}`}>
              <Check className="w-7 h-7" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Interaction Complete
            </h2>

            <div className={`p-6 rounded-xl border ${borderTone} text-left max-w-lg mx-auto space-y-4 shadow-sm ${cardBg}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">
                  Staff Response Received
                </span>
                <p className="text-lg sm:text-xl font-black">
                  {staffResponse}
                </p>
              </div>

              <div className="border-t pt-3.5" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">
                  Final Session Summary
                </span>
                <p className={`text-xs sm:text-sm font-medium leading-relaxed ${textSecondary}`}>
                  {config.templates.completed(entities, staffResponse)}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/communication-hub"
                className={`inline-block px-7 py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-all ${accentSolid}`}
              >
                Return to Hub
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer System Anchor */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">SignMitra Engine • Session Security Protocol</p>
          <div className="flex items-center gap-2 font-medium">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`}></span>
            <span>Deterministic Workflow Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function CommunicationSession() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-wider bg-[#FDF1E2] text-[#655A7C] animate-pulse">
          Initializing SignMitra Session Engine...
        </div>
      }
    >
      <CommunicationCanvasBody />
    </Suspense>
  );
}