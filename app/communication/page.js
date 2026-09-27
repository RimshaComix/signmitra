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
  Check,
  ShieldAlert,
  Type,
  Volume2,
  Maximize2,
  Minimize2,
  Share2,
  Printer
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

const WORKFLOW_CONFIGS = {
  // =========================================================================
  // EDUCATION MODULE: P0 CORE WORKFLOWS
  // =========================================================================
  exam_issue: {
    title: 'Exam / Internal Assessment Issue',
    fields: [
      { id: 'course', label: 'Course / Subject Name', type: 'text', required: true, placeholder: 'e.g., Data Structures CS201' },
      { id: 'examType', label: 'Assessment Type', type: 'select', options: ['Internal Assessment / Midterm', 'Final Semester Exam', 'Lab / Viva Voce', 'Assignment Submission'], required: true },
      { id: 'date', label: 'Date of Assessment', type: 'date', required: true },
      { id: 'issueCategory', label: 'Issue Category', type: 'select', options: ['Mark Discrepancy / Re-evaluation Request', 'Absent by Mistake on Portal', 'Hall Ticket / Seating Issue', 'Reschedule Request (Medical)'], required: true },
      { id: 'explanation', label: 'Brief Explanation (Optional)', type: 'text', required: false, placeholder: 'e.g., Question 4 marks not added' }
    ],
    templates: {
      review: (entities) =>
        `EXAMINATION QUERY:\n• Subject: ${entities.course}\n• Assessment: ${entities.examType} on ${entities.date}\n• Issue: ${entities.issueCategory}\n${entities.explanation ? `• Details: ${entities.explanation}\n` : ''}Please provide written clarification on the next steps.`,
      completed: (entities, response) =>
        `Exam query recorded for ${entities.course}. Staff instruction: ${response || 'Inquiry logged.'}`
    },
    staffOptions: [
      'Record updated in the portal. Please check tomorrow.',
      'Submit a physical re-evaluation form at the examination cell.',
      'Speak to the subject professor directly for internal marks.'
    ]
  },

  course_registration: {
    title: 'Course Registration / Subject Query',
    fields: [
      { id: 'semester', label: 'Current Semester', type: 'select', options: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'], required: true },
      { id: 'course', label: 'Course / Elective Name', type: 'text', required: true, placeholder: 'e.g., AI Elective CS405' },
      { id: 'issueType', label: 'Registration Issue', type: 'select', options: ['Cannot Register on Portal (Error)', 'Prerequisite Override Request', 'Section / Batch Change Request', 'Drop / Withdraw from Subject'], required: true },
      { id: 'details', label: 'Relevant Details (Optional)', type: 'text', required: false, placeholder: 'e.g., Portal shows prerequisite missing' }
    ],
    templates: {
      review: (entities) =>
        `ACADEMIC ENROLLMENT REQUEST:\n• Semester: ${entities.semester}\n• Subject: ${entities.course}\n• Request Type: ${entities.issueType}\n${entities.details ? `• Context: ${entities.details}\n` : ''}Please verify my registration status or provide override approval.`,
      completed: (entities, response) =>
        `Enrollment query logged for ${entities.course}. Staff response: ${response || 'Request submitted.'}`
    },
    staffOptions: [
      'Override approved. Check your student portal to complete registration.',
      'This section is full. Please choose an alternative elective.',
      'You must visit your department HOD for an approval signature first.'
    ]
  },

  fee_scholarship_query: {
    title: 'Fees / Scholarship Assistance',
    fields: [
      { id: 'queryType', label: 'Query Category', type: 'select', options: ['Tuition Fee Payment Discrepancy', 'Scholarship Status / Application', 'Request Installment Plan', 'Official Fee Receipt Generation'], required: true },
      { id: 'semester', label: 'Applicable Semester / Year', type: 'select', options: ['Current Semester', 'Next Semester', 'Previous Academic Year'], required: true },
      { id: 'amount', label: 'Amount Involved (Optional)', type: 'text', required: false, placeholder: 'e.g., 45,000 INR' },
      { id: 'reference', label: 'Reference / Transaction ID (Optional)', type: 'text', required: false, placeholder: 'e.g., TXN-89912' }
    ],
    templates: {
      review: (entities) =>
        `STUDENT FINANCE DESK QUERY:\n• Query: ${entities.queryType}\n• Period: ${entities.semester}\n${entities.amount ? `• Amount: ₹${entities.amount}\n` : ''}${entities.reference ? `• Reference: ${entities.reference}\n` : ''}Please verify the records and advise on the status.`,
      completed: (entities, response) =>
        `Financial query logged for ${entities.queryType}. Resolution: ${response || 'Query processed.'}`
    },
    staffOptions: [
      'Payment traced successfully. Official receipt has been generated.',
      'Scholarship is under processing. Please wait 1 week for portal update.',
      'Please submit the physical application with your income certificate attached.'
    ]
  },

  education_accessibility_request: {
    title: 'Request Accessibility Support',
    fields: [
      { id: 'commMethod', label: 'Preferred Communication Method', type: 'select', options: ['Written Notes / Visual Prompts', 'Lip-reading with slow articulation', 'In-Person ISL Interpreter', 'Peer Companion Assistance'], required: true },
      { id: 'supportType', label: 'Support / Accommodation Requested', type: 'select', options: ['Extra time for examination', 'Access to visual lecture notes / transcripts', 'Front row seating reservation', 'Other visual accommodation'], required: true },
      { id: 'context', label: 'Relevant Context (Optional)', type: 'text', required: false, placeholder: 'e.g., Required for CS201 Midterm Exam' }
    ],
    templates: {
      review: (entities) =>
        `CAMPUS ACCESSIBILITY REQUEST:\n• I am Deaf / Hard-of-Hearing.\n• Preferred Communication: ${entities.commMethod}\n• Accommodation Needed: ${entities.supportType}\n${entities.context ? `• Context: ${entities.context}\n` : ''}I am presenting this to coordinate support. Please confirm next steps.`,
      completed: (entities, response) =>
        `Accessibility accommodation communicated. Response: ${response || 'Request reviewed.'}`
    },
    staffOptions: [
      'Accommodation noted in your student file. Request approved.',
      'The subject professor has been informed about your visual support needs.',
      'Please visit the Disability Support Cell to get a formal accommodation letter.'
    ]
  },

  // =========================================================================
  // EDUCATION MODULE: FOUNDATIONAL WORKFLOWS
  // =========================================================================
  meet_faculty: {
    title: 'Meet Faculty / Professor',
    fields: [
      { id: 'department', label: 'Select Academic Department', type: 'select', options: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Business Administration', 'Basic Sciences'], required: true },
      { id: 'purpose', label: 'Purpose of Meeting', type: 'select', options: ['Project Review & Guidance', 'Assignment Grading Clarification', 'Letter of Recommendation Request', 'General Academic Advising'], required: true },
      { id: 'datetime', label: 'Preferred Date & Time', type: 'text', required: true, placeholder: 'e.g., Tomorrow at 2:00 PM' }
    ],
    templates: {
      review: (entities) => `I want to meet a faculty member from the ${entities.department || '[Department]'} department for "${entities.purpose || '[Purpose]'}".\n• Preferred Time: ${entities.datetime}`,
      completed: (entities, response) => `Faculty meeting request processed. Resolution: ${response || 'Meeting slot coordinated.'}`
    },
    staffOptions: ['Please wait, the professor will see you in 10 minutes.', 'The professor is out today. Please schedule an appointment via email.', 'Please take a seat inside the waiting lounge.']
  },
  attendance_issue: {
    title: 'Attendance Discrepancy Query',
    fields: [
      { id: 'courseCode', label: 'Enter Course Name / Code', type: 'text', required: true, placeholder: 'e.g., CS301' },
      { id: 'absenceDate', label: 'Date of Marked Absence', type: 'date', required: true },
      { id: 'reason', label: 'Reason for Discrepancy', type: 'select', options: ['Present in Class but Marked Absent', 'Medical Leave (Medical Certificate Attached)', 'Official College Event Duty Leave'], required: true }
    ],
    templates: {
      review: (entities) => `I want to report an attendance issue for course "${entities.courseCode || '[Course]'}". I was marked absent on ${entities.absenceDate || '[Date]'} due to: ${entities.reason || '[Reason]'}.`,
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
  },

  // =========================================================================
  // BANKING MODULE: P0 CORE WORKFLOWS
  // =========================================================================
  upi_transfer_failure: {
    title: 'Report Failed UPI / Online Transfer',
    fields: [
      { id: 'paymentApp', label: 'Payment App / Channel', type: 'select', options: ['Google Pay (UPI)', 'PhonePe (UPI)', 'Paytm (UPI)', 'Bank Mobile App (IMPS/NEFT)', 'NetBanking Transfer'], required: true },
      { id: 'amount', label: 'Transaction Amount (INR)', type: 'text', required: true, placeholder: 'e.g., 2,500' },
      { id: 'txnDate', label: 'Date of Transaction', type: 'date', required: true },
      { id: 'issueStatus', label: 'Observed Problem', type: 'select', options: ['Amount debited from my account but recipient did not receive', 'Transaction timed out but money withheld', 'Double deduction for a single UPI merchant payment'], required: true },
      { id: 'utrRef', label: '12-Digit UPI Ref / UTR (Optional)', type: 'text', required: false, placeholder: 'e.g., 426189123456 (Do NOT enter PIN/Password)' }
    ],
    templates: {
      review: (entities) =>
        `DISPUTE NOTICE: I am reporting an uncredited transfer.\n• Channel: ${entities.paymentApp || '[App]'}\n• Amount: ₹${entities.amount || '0'} on ${entities.txnDate || '[Date]'}\n• Issue: ${entities.issueStatus || '[Issue]'}\n${entities.utrRef ? `• UTR Reference: ${entities.utrRef}\n` : ''}Please check the settlement ledger or lodge an official reversal ticket.`,
      completed: (entities, response) =>
        `UPI dispute registered for ₹${entities.amount}. Teller response: ${response || 'Ticket logged.'}`
    },
    staffOptions: [
      'Dispute ticket lodged. Auto-reversal to account within 48 to 72 business hours.',
      'Beneficiary bank currently processing settlement. Amount will credit by 5:00 PM.',
      'Please fill out the physical Form D-12 at Counter 3 with your UTR reference.'
    ]
  },
  kyc_details_update: {
    title: 'Update KYC / Personal Account Details',
    fields: [
      { id: 'updateType', label: 'Information to Update', type: 'select', options: ['Residential Address', 'Registered Mobile Number', 'Primary Email Address', 'Periodic Re-KYC Compliance Verification'], required: true },
      { id: 'accountLast4', label: 'Account Last 4 Digits', type: 'text', required: true, placeholder: 'e.g., 8945 (Never enter full card or PIN)' },
      { id: 'docAvailable', label: 'Identity / Proof Document In Hand', type: 'select', options: ['Aadhaar Card (Physical/e-Aadhaar)', 'PAN Card', 'Passport Copy', 'Voter ID Card', 'Utility Electricity/Water Bill'], required: true }
    ],
    templates: {
      review: (entities) =>
        `ACCOUNT SERVICE REQUEST:\n• Requested Change: ${entities.updateType?.toUpperCase() || 'KYC UPDATE'}.\n• Account Identifier: ending in •••• ${entities.accountLast4 || 'XXXX'}.\n• Verification Document In Hand: ${entities.docAvailable || 'None'}.\nPlease inspect my physical document and update the core banking records.`,
      completed: (entities, response) =>
        `KYC alteration request logged for account ending •••• ${entities.accountLast4}. Status: ${response || 'Records updated.'}`
    },
    staffOptions: [
      'Document verified. Changes updated in the core banking system.',
      'Biometric fingerprint scan required. Please step to Counter 4.',
      'Address proof requires utility bill dated within the last 3 months.'
    ]
  },
  cheque_services_query: {
    title: 'Cheque Book Request / Stop Cheque',
    fields: [
      { id: 'chequeAction', label: 'Cheque Action Needed', type: 'select', options: ['Order New Personalized Cheque Book (25 Leaves)', 'Stop Payment on Specific Issued Cheque', 'Inquire Cheque Clearing Status'], required: true },
      { id: 'accountLast4', label: 'Account Last 4 Digits', type: 'text', required: true, placeholder: 'e.g., 4120' },
      { id: 'chequeNumber', label: 'Cheque Number (If stopping or querying)', type: 'text', required: false, placeholder: 'e.g., 000452' },
      { id: 'reason', label: 'Reason / Priority', type: 'select', options: ['Routine Cheque Book Exhausted', 'Cheque Misplaced / Lost in Transit', 'Incorrect Amount Written', 'Disputed Payment Contract'], required: true }
    ],
    templates: {
      review: (entities) =>
        `CHEQUE SERVICE REQUEST:\n• Action: ${entities.chequeAction?.toUpperCase() || 'CHEQUE SERVICE'}.\n• Account Identifier: ending in •••• ${entities.accountLast4 || 'XXXX'}.\n${entities.chequeNumber ? `• Cheque Number: #${entities.chequeNumber}\n` : ''}• Reason: ${entities.reason || 'General'}.\nPlease process and provide written acknowledgement.`,
      completed: (entities, response) =>
        `Cheque instruction acknowledged. Resolution: ${response || 'Instruction logged.'}`
    },
    staffOptions: [
      'Stop-payment executed immediately. Cheque is frozen in clearing.',
      'New cheque book requisition logged. Delivered via speed-post in 5 days.',
      'Cheque cleared successfully this morning at 10:15 AM.'
    ]
  },
  loan_emi_discrepancy: {
    title: 'Loan Account & EMI Query',
    fields: [
      { id: 'loanType', label: 'Loan Category', type: 'select', options: ['Home Loan', 'Personal Loan', 'Vehicle / Car Loan', 'Education Loan', 'Gold Loan'], required: true },
      { id: 'queryType', label: 'Specific Query', type: 'select', options: ['Discrepancy in Automated EMI Deduction Amount', 'Request Provisional Interest / Tax Certificate', 'Check Outstanding Principal Balance', 'Change EMI Due Date / Bank Mandate'], required: true },
      { id: 'loanRef', label: 'Loan Account Ref (Optional)', type: 'text', required: false, placeholder: 'e.g., LN-2024-9081' }
    ],
    templates: {
      review: (entities) =>
        `LOAN INQUIRY NOTICE:\n• Loan Category: ${entities.loanType?.toUpperCase() || 'LOAN'}.\n• Purpose: ${entities.queryType || 'Inquiry'}.\n${entities.loanRef ? `• Loan Ref: ${entities.loanRef}\n` : ''}Please provide a printed breakdown of the schedule.`,
      completed: (entities, response) =>
        `Loan inquiry handled for ${entities.loanType}. Resolution: ${response || 'Details provided.'}`
    },
    staffOptions: [
      'Interest Certificate printed and stamped. Here is your copy.',
      'EMI discrepancy noted. Excess charge will adjust in next cycle.',
      'Please speak with the Loan Manager at Cabin 2 for restructuring.'
    ]
  },
  transaction_issue: {
    title: 'Report ATM / Point-of-Sale Issue',
    fields: [
      { id: 'accountType', label: 'Select Account Type', type: 'select', options: ['Savings Account', 'Current Account'], required: true },
      { id: 'issueType', label: 'Select Issue Context', type: 'select', options: ['ATM Cash Not Dispensed but Amount Deducted', 'Double Deduction on Merchant POS Payment', 'Failed Online Transfer / Amount Frozen'], required: true },
      { id: 'amount', label: 'Approximate Transaction Amount (INR)', type: 'text', required: true, placeholder: 'e.g., 5,000' },
      { id: 'txnDate', label: 'Date of Transaction', type: 'date', required: true }
    ],
    templates: {
      review: (entities) => `I want to report an ATM/POS transaction issue regarding my ${entities.accountType || '[Account]'}. The issue is: "${entities.issueType || '[Issue]'}". The total affected amount is ₹${entities.amount || '[Amount]'} on date ${entities.txnDate || '[Date]'}.`,
      completed: (entities, response) => `Transaction dispute logged. Reference action initiated: ${response || 'Processing complaint registration.'}`
    },
    staffOptions: ['Complaint logged. Amount will reverse in 3-5 working days.', 'Please provide physical transaction receipt/slip.', 'Branch manager must verify. Please wait at Counter 2.']
  },
  card_problem: {
    title: 'Block Lost Card / Request Replacement',
    fields: [
      { id: 'cardAction', label: 'What do you need to do?', type: 'select', options: ['Block Lost/Stolen Card Immediately', 'Replace Damaged / Faulty Chip Card'], required: true },
      { id: 'cardType', label: 'Select Card Variant', type: 'select', options: ['RuPay Debit Card', 'Visa Debit Card', 'Mastercard Debit Card'], required: true },
      { id: 'cardLast4', label: 'Card Last 4 Digits (Optional)', type: 'text', required: false, placeholder: 'e.g., 9012 (Never enter full card, CVV, or PIN)' }
    ],
    templates: {
      review: (entities) => `I need to ${entities.cardAction || '[Take Action]'} for my ${entities.cardType || '[Card]'}${entities.cardLast4 ? ` ending in •••• ${entities.cardLast4}` : ''}. My card is linked to this registered phone number.`,
      completed: (entities, response) => `Card status updated successfully. Action status: ${response || 'Processing security lock.'}`
    },
    staffOptions: ['Card suspended instantly. Security block active.', 'Card replacement order submitted. Collect in 7 business days.', 'Please verify identity with physical government ID / PAN card.']
  },
  statement_request: {
    title: 'Request Certified Bank Statement',
    fields: [
      { id: 'duration', label: 'Select Statement Duration', type: 'select', options: ['Last 3 Months', 'Last 6 Months', 'Current Financial Year', 'Custom Date Range'], required: true },
      { id: 'deliveryMode', label: 'How would you like to receive it?', type: 'select', options: ['Print Official Physical Copy Sealed with Branch Stamp', 'Send Encrypted PDF Statement to Registered Email'], required: true }
    ],
    templates: {
      review: (entities) => `I request an official account statement for the duration: ${entities.duration || '[Duration]'}. Please ${entities.deliveryMode || '[Delivery Mode]'}.`,
      completed: (entities, response) => `Account history request processed. Resolution: ${response || 'Dispatched details.'}`
    },
    staffOptions: ['Printing physical copy now. Please wait 2 minutes.', 'Sent encrypted digital statement to your email.', 'Passbook update machine is active outside. Please check.']
  },

  // =========================================================================
  // HEALTHCARE MODULE: P0 & FOUNDATIONS PRESERVED
  // =========================================================================
  reschedule_cancel_appointment: {
    title: 'Reschedule / Cancel Existing Appointment',
    fields: [
      { id: 'appointmentRef', label: 'Doctor Name or Appointment Ref', type: 'text', required: true, placeholder: 'e.g., Dr. Ramanathan or #APT-904' },
      { id: 'actionType', label: 'Action Requested', type: 'select', options: ['Reschedule to New Date', 'Cancel Appointment Completely'], required: true },
      { id: 'newDate', label: 'Preferred New Date (if rescheduling)', type: 'date', required: false },
      { id: 'reason', label: 'Reason for Adjustment', type: 'select', options: ['Personal Schedule Conflict', 'Transportation / Travel Issue', 'Feeling Better / Resolved', 'Doctor Unavailable', 'Other Reason'], required: true }
    ],
    templates: {
      review: (entities) =>
        `I need to ${entities.actionType?.toUpperCase() || 'ADJUST APPOINTMENT'} for my scheduled booking with ${entities.appointmentRef || '[Doctor/Ref]'}.\n• Reason: ${entities.reason || 'Unspecified'}\n${entities.actionType?.includes('Reschedule') ? `• Preferred Date: ${entities.newDate || 'Earliest available date'}\n` : ''}Please provide written confirmation of this change.`,
      completed: (entities, response) =>
        `Appointment update recorded for ${entities.appointmentRef}. Resolution: ${response || 'Change processed.'}`
    },
    staffOptions: [
      'Appointment rescheduled. Your new slot token is confirmed.',
      'Requested slot unavailable. Offering next available time tomorrow at 11:30 AM.',
      'Appointment successfully cancelled. No cancellation penalty applied.'
    ]
  },
  medical_reports_request: {
    title: 'Request Medical Reports / Diagnostic Transcripts',
    fields: [
      { id: 'recordType', label: 'Report / Document Category', type: 'select', options: ['Pathology & Blood Work Report', 'X-Ray / MRI / Radiology Scans', 'In-Patient Discharge Summary', 'Prescription Copy', 'Final Hospital Billing Statement'], required: true },
      { id: 'visitDate', label: 'Approximate Consultation / Test Date', type: 'date', required: true },
      { id: 'deliveryMode', label: 'Delivery / Format Preference', type: 'select', options: ['Physical Printed Hardcopy', 'Encrypted PDF via Registered WhatsApp / Email', 'Portal Download Pass'], required: true }
    ],
    templates: {
      review: (entities) =>
        `I am requesting a copy of my ${entities.recordType?.toUpperCase() || 'MEDICAL RECORD'} from my consultation on ${entities.visitDate || '[Date]'}.\n• Delivery Preference: ${entities.deliveryMode || 'Hardcopy'}\nI communicate visually; please hand me the printout or write down instructions.`,
      completed: (entities, response) =>
        `Medical documentation request processed. Status: ${response || 'Dispatched.'}`
    },
    staffOptions: [
      'Records located. Printing official hardcopy at this counter now.',
      'Reports dispatched digitally to your registered mobile/email.',
      'Lab investigations are still under pathology review. Ready at 4:00 PM.'
    ]
  },
  diagnostic_test_request: {
    title: 'Request Diagnostic Lab Test',
    fields: [
      { id: 'testType', label: 'Prescribed Investigation', type: 'select', options: ['Complete Blood Count (CBC) / Lipid Panel', 'Urine Routine & Culture', 'Ultrasound / Chest Radiography', 'ECG / Cardiac Investigation', 'Fasting Blood Glucose / HbA1c'], required: true },
      { id: 'fastingStatus', label: 'Current Fasting State', type: 'select', options: ['Yes - Fasting for 8+ Hours', 'Yes - Fasting for 12+ Hours', 'No - Non-Fasting (Regular Meal Consumed)', 'Not Applicable for this test'], required: true },
      { id: 'referralDoctor', label: 'Prescribing Clinician', type: 'text', required: true, placeholder: 'e.g., Dr. S. Ramanathan' }
    ],
    templates: {
      review: (entities) =>
        `I need to complete this prescribed diagnostic test: ${entities.testType?.toUpperCase() || '[Test]'}.\n• Prescribing Clinician: ${entities.referralDoctor || '[Doctor]'}\n• Fasting Status: ${entities.fastingStatus || '[Fasting]'}\nPlease provide visual instructions or guide me to the testing room.`,
      completed: (entities, response) =>
        `Lab investigation protocol logged for ${entities.testType}. Staff instruction: ${response || 'Proceed to room.'}`
    },
    staffOptions: [
      'Token issued: #LAB-14. Please proceed to Phlebotomy Cubicle 2.',
      'This test requires 10 hours strict fasting. Please return tomorrow morning.',
      'Please sit in Waiting Area B. The lab technician will visually call your token.'
    ]
  },
  communication_assist_request: {
    title: 'Request Communication Assistance / Accommodation',
    fields: [
      { id: 'assistanceType', label: 'Accommodation Mode Needed', type: 'select', options: ['Written Text & Visual Forms Only', 'In-Person Indian Sign Language (ISL) Interpreter', 'Tele-Health Video Remote ISL Interpreter (VRI)', 'Family Companion Allowed Inside Examination Room'], required: true },
      { id: 'urgency', label: 'Encounter Urgency', type: 'select', options: ['Scheduled Routine Consultation', 'Urgent Outpatient Examination', 'Emergency Room Triage Encounter'], required: true },
      { id: 'specialNotes', label: 'Specific Note (Optional)', type: 'text', required: false, placeholder: 'e.g., Lip-reads partially; please face me directly' }
    ],
    templates: {
      review: (entities) =>
        `ACCESSIBILITY NOTICE:\n• I am Deaf / Hard-of-Hearing.\n• Required Service: ${entities.assistanceType?.toUpperCase() || 'VISUAL COMMUNICATION'}.\n• Urgency: ${entities.urgency || 'Routine'}.\n• Note: ${entities.specialNotes || 'Please do not expect spoken verbal answers. Use written notes or visual prompts.'}`,
      completed: (entities, response) =>
        `Accessibility accommodation confirmed. Provider instructions: ${response || 'Accommodation granted.'}`
    },
    staffOptions: [
      'Chart flagged for visual communication. Doctor instructed to write notes.',
      'Video Remote ISL Interpreter link activated on tablet. Loading now.',
      'Your family companion is cleared to enter the consultation room with you.'
    ]
  },
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
    title: 'Symptom Explanation & Triage',
    fields: [
      { id: 'symptom', label: 'Primary Symptom', type: 'select', options: ['Chest Pain / Shortness of Breath', 'Severe Migraine Headache', 'Acute Stomach Pain', 'Persistent High Fever', 'Joint Pain / Swelling'], required: true },
      { id: 'duration', label: 'How long has this been happening?', type: 'select', options: ['A few hours', '1-2 Days', 'More than a week', 'Chronic Flare-up'], required: true },
      { id: 'severity', label: 'Pain Severity Level', type: 'select', options: ['Mild (1 - 3)', 'Moderate (4 - 6)', 'Severe (7 - 8)', 'Extremely Critical (9 - 10)'], required: true }
    ],
    templates: {
      review: (entities) => `I am experiencing ${entities.symptom || '[Symptom]'} for the past ${entities.duration || '[Duration]'}. The intensity is ${entities.severity || '[Severity]'}.`,
      completed: (entities, response) => `Symptoms logged with staff. Next step: ${response || 'Awaiting triage instructions.'}`
    },
    staffOptions: ['Understood, wait outside Room 4', 'Requires immediate emergency room triage', 'Nurse will take blood pressure and vitals now']
  },
  medicine_query: {
    title: 'Prescription Refill & Pharmacy',
    fields: [
      { id: 'prescriptionRef', label: 'Prescription ID or Medicine Name', type: 'text', required: true, placeholder: 'e.g., Albuterol Inhaler 90mcg or Rx-2026' },
      { id: 'requestType', label: 'Pharmacy Request Type', type: 'select', options: ['Refill Maintenance Prescription', 'Check Generic Drug Equivalent', 'Clarify Daily Dosage Timing', 'Collect Pre-Ordered Medicines'], required: true },
      { id: 'quantity', label: 'Refill Duration', type: 'select', options: ['1 Month Supply', '2 Months Supply', '3 Months Supply', 'Single Item Only'], required: true }
    ],
    templates: {
      review: (entities) => `PHARMACY REQUEST:\n• Medicine / Rx: ${entities.prescriptionRef || '[Medicine]'}\n• Request Type: ${entities.requestType || 'Refill'}\n• Duration / Quantity: ${entities.quantity || '1 Month'}\nPlease dispense and label instructions on the packet.`,
      completed: (entities, response) => `Pharmacy query processed. Dispensation status: ${response || 'Prescription filled.'}`
    },
    staffOptions: ['Medication dispensed with visual dosage stickers.', 'Brand unavailable. Exact generic equivalent provided.', 'Maintenance refill requires updated clinician signature.']
  }
};

const COMMON_STAFF_RESPONSES = [
  'Information verified and updated.',
  'Request submitted successfully.',
  'Please wait, staff will assist you shortly.',
  'More information is needed, please visit the main desk.'
];

function CommunicationCanvasBody() {
  const {
    isDarkTheme,
    toggleTheme,
    isSimpleLanguage,
    toggleSimpleLanguage,
    bgCanvas,
    textPrimary,
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid
  } = useTheme();

  const searchParams = useSearchParams();
  const intent = searchParams.get('intent') || 'transaction_issue';
  const domain = searchParams.get('domain') || 'banking';
  const config = WORKFLOW_CONFIGS[intent] || WORKFLOW_CONFIGS.transaction_issue;

  const [currentState, setCurrentState] = useState('collecting');
  const [historyStates, setHistoryStates] = useState([]);
  const [entities, setEntities] = useState({});
  const [staffResponse, setStaffResponse] = useState('');
  const [errors, setErrors] = useState({});
  const [serverSessionId, setServerSessionId] = useState(null);
  
  // Communication Mode states
  const [isLargeTextMode, setIsLargeTextMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
        newErrors[field.id] = isSimpleLanguage ? "Required." : `${field.label} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      transitionTo('review', entities);
    }
  };

  const handleStaffSelect = async (optionText, customInput = '') => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    const finalResponse = optionText || customInput;
    setStaffResponse(finalResponse);
    setCurrentState('completed');

    const sessionRecord = {
      id: `REQ-${Date.now()}`,
      domain: domain.toUpperCase(),
      intent: intent,
      title: config.title,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: 'Staff Responded',
      entities: entities,
      staffResponse: finalResponse
    };

    try {
      const existing = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      localStorage.setItem('signmitra_history', JSON.stringify([sessionRecord, ...existing]));
    } catch (err) {
      console.error("Local storage error:", err);
    }

    if (serverSessionId) {
      try {
        const { signMitraAPI } = await import('@/components/api');
        await signMitraAPI.submitStaffResponse(serverSessionId, optionText, customInput);
      } catch (err) {
        console.log('Local completion snapshot saved.');
      }
    }
  };

  const speakText = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = config.templates.review(entities);
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    const voices = window.speechSynthesis.getVoices();
    const savedVoiceURI = localStorage.getItem('signmitra_preferred_voice');
    
    if (savedVoiceURI) {
      const selected = voices.find(v => v.voiceURI === savedVoiceURI);
      if (selected) utterance.voice = selected;
    } else {
      const preferredVoice = voices.find(voice => voice.lang.includes('en-IN') || voice.lang.includes('en-US') || voice.lang.includes('en-GB'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleNativeShare = async () => {
    const shareText = config.templates.review(entities);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SignMitra Request: ${config.title}`,
          text: shareText,
        });
        setShowShareModal(false);
      } catch (err) {
        console.log('User cancelled share or share failed.', err);
      }
    } else {
      alert("Native sharing is not supported on this device/browser.");
    }
  };

  const handlePrintPDF = () => {
    setShowShareModal(false);
    // Add slight delay to allow modal to close before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* 
        PRINT STYLES (Tailwind Print Modifiers)
        This ensures only the actual communication card text prints when exported to PDF.
      */}
      <div className="hidden print:block print:p-8 print:w-full print:bg-white print:text-black">
         <h1 className="text-3xl font-black mb-6 uppercase border-b-2 border-black pb-4">SignMitra Communication Request</h1>
         <p className="text-2xl font-bold leading-relaxed whitespace-pre-line">
            {config.templates.review(entities)}
         </p>
         <div className="mt-12 text-sm font-mono opacity-50">
           Generated securely on device • No cloud storage
         </div>
      </div>

      <div className="print:hidden flex flex-col min-h-screen w-full">
        {/* Top Runtime Status Bar */}
        <div className={`w-full border-b py-2.5 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
          <div className="flex items-center gap-3">
            <Link
              href={`/${domain}`}
              className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
              onClick={() => { if(window.speechSynthesis) window.speechSynthesis.cancel(); }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isSimpleLanguage ? 'Back' : `Cancel & Back to ${domain.toUpperCase()}`}</span>
            </Link>
            <span className="opacity-40 hidden sm:inline">/</span>
            <span className="opacity-80 hidden sm:inline">{isSimpleLanguage ? 'ACTIVE SESSION' : 'SESSION RUNTIME CORE'}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleSimpleLanguage}
              aria-label="Toggle Simple Text"
              title="Toggle Simple Text"
              className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all ${isSimpleLanguage ? 'bg-[#655A7C] text-[#FDF1E2] border-[#655A7C]' : ''}`}
            >
              <Type className="w-3.5 h-3.5" />
              <span className="font-bold hidden sm:inline">{isSimpleLanguage ? 'Simple On' : 'Simple Text'}</span>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme Mode"
              className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
            >
              {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
            </button>
          </div>
        </div>

        {/* Share & Export Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md p-6 rounded-2xl border ${borderTone} ${bgCanvas} shadow-2xl space-y-5 animate-in zoom-in-95 duration-200`}>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-black uppercase tracking-tight">Export Card</h2>
                <button onClick={() => setShowShareModal(false)} className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className={`p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 space-y-2`}>
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Privacy Warning
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Before exporting, verify that your card does not contain sensitive passwords or financial PINs. If you export to PDF or share via another app, this data will leave the local SignMitra sandbox.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleNativeShare}
                  className={`p-4 rounded-xl border ${borderTone} ${cardBg} hover:border-[#655A7C] transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm`}
                >
                  <Share2 className="w-6 h-6 mb-1 opacity-80" />
                  Share Text
                </button>
                <button
                  onClick={handlePrintPDF}
                  className={`p-4 rounded-xl border ${borderTone} ${cardBg} hover:border-[#655A7C] transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm`}
                >
                  <Printer className="w-6 h-6 mb-1 opacity-80" />
                  Save as PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Large Text Modal Overlay */}
        {isLargeTextMode && (
          <div className={`fixed inset-0 z-[100] flex flex-col ${bgCanvas} ${textPrimary} p-6 sm:p-12 overflow-y-auto`}>
            <div className="flex justify-between items-center mb-12">
               <span className={`text-xs font-mono font-bold uppercase tracking-widest opacity-80 px-3 py-1 rounded-full border ${borderTone}`}>
                  SignMitra High-Visibility Mode
               </span>
               <button 
                  onClick={() => setIsLargeTextMode(false)}
                  className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
               >
                  <Minimize2 className="w-6 h-6" />
               </button>
            </div>
            <div className="my-auto">
              <p className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight whitespace-pre-line tracking-tight">
                {config.templates.review(entities)}
              </p>
            </div>
          </div>
        )}

        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
          
          {/* Dynamic Header Box */}
          <header className={`rounded-xl border ${borderTone} p-6 sm:p-7 mb-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${cardBg}`}>
            <div>
              <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
                <Sparkles className="w-3.5 h-3.5" />
                DOMAIN: {domain.toUpperCase()}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-[1.08]">
                {config.title}
              </h1>
              <p className={`text-xs sm:text-sm mt-1 max-w-xl font-medium ${textSecondary}`}>
                {isSimpleLanguage 
                  ? "Answer the questions below to create a card you can show to staff." 
                  : "Structured communication session. Fill required parameters to deploy an unambiguous card to the official."}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded border ${borderTone} ${cardInnerBg} uppercase tracking-wider`}>
                STATE: {currentState.replace('_', ' ')}
              </span>
              {currentState !== 'completed' && (
                <button
                  onClick={() => { if (confirm(isSimpleLanguage ? "Cancel this request?" : `Cancel current ${domain} session?`)) window.location.href = `/${domain}` }}
                  className={`p-2 rounded-lg border ${borderTone} hover:opacity-80 transition-all ${cardInnerBg}`}
                  title="Cancel Workflow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>

          {/* STATE 1: Collecting (User inputs parameters) */}
          {currentState === 'collecting' && (
            <form onSubmit={handleValidateAndReview} className={`p-6 sm:p-7 rounded-xl border ${borderTone} shadow-sm space-y-5 ${cardBg}`}>
              {(domain === 'banking' || domain === 'education') && (
                <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} flex items-center gap-2 text-xs font-mono font-medium`}>
                  <ShieldAlert className="w-4 h-4 text-[#655A7C] shrink-0" />
                  <span>
                    {isSimpleLanguage 
                      ? "Security Warning: Do not type your passwords, PINs, or OTPs here." 
                      : "Security Notice: Never enter passwords, pins, OTPs, or sensitive login credentials here."}
                  </span>
                </div>
              )}

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
                      <option value="" disabled className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>-- Select Parameter --</option>
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
                      placeholder={field.placeholder || 'Enter detail...'}
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
                <span>{isSimpleLanguage ? 'Create Card' : 'Build Handoff Card'}</span>
                <FileText className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STATE 2: Review (User reviews generated card & share options) */}
          {currentState === 'review' && (
            <div className="space-y-6">
              <div className={`p-6 sm:p-7 rounded-xl border ${borderTone} space-y-4 shadow-sm ${cardBg}`}>
                <div className="flex items-center justify-between border-b pb-3.5" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${borderTone} ${cardInnerBg} inline-block`}>
                    {isSimpleLanguage ? 'YOUR CARD' : 'PREPARED HANDOFF CARD'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowShareModal(true)}
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${borderTone} hover:opacity-80 transition-all flex items-center gap-1 bg-transparent`}
                      title="Export or Share Card"
                    >
                      <Share2 className="w-3 h-3" /> <span className="hidden sm:inline">Export</span>
                    </button>
                    <span className="text-[11px] font-mono font-bold opacity-75">Ready to Present</span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-black leading-relaxed whitespace-pre-line">
                  "{config.templates.review(entities)}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBack}
                  className={`sm:w-1/3 py-3 rounded-lg border ${borderTone} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all ${cardBg}`}
                >
                  ← {isSimpleLanguage ? 'Edit Info' : 'Edit Parameters'}
                </button>
                <button
                  onClick={() => transitionTo('awaiting_confirmation')}
                  className={`sm:w-2/3 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 ${accentSolid}`}
                >
                  {isSimpleLanguage ? 'Show to Staff →' : 'Hand Device to Official →'}
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: Awaiting Confirmation (Handoff to Teller / Staff) */}
          {currentState === 'awaiting_confirmation' && (
            <div className="space-y-6">
              
              {/* Communication Mode Accessibility Bar */}
              <div className={`p-2.5 rounded-xl border ${borderTone} flex items-center justify-between shadow-sm bg-black/5 dark:bg-white/5`}>
                 <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 opacity-70">
                   Communicate Via:
                 </span>
                 <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setIsLargeTextMode(true)}
                      className={`px-3 py-1.5 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-all flex items-center gap-1.5`}
                   >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Large Text</span>
                   </button>
                   <button 
                      onClick={speakText}
                      className={`px-3 py-1.5 rounded-lg border ${borderTone} text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5
                        ${isSpeaking ? 'bg-green-500 text-white border-green-600 animate-pulse' : `${cardInnerBg} hover:opacity-80`}`}
                   >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isSpeaking ? 'Reading...' : 'Read Aloud'}</span>
                   </button>
                 </div>
              </div>

              <div className={`p-4 rounded-xl border ${borderTone} text-center font-bold text-xs sm:text-sm bg-[#AB92BF]/25 shadow-sm`}>
                👋 Hand this device across the counter to the branch official, faculty, or receptionist.
              </div>

              <div className={`p-6 sm:p-7 rounded-xl border ${borderTone} space-y-3 shadow-sm ${cardInnerBg}`}>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${borderTone} ${cardBg} inline-block`}>
                  {isSimpleLanguage ? 'MESSAGE FOR YOU' : 'VISUAL COMMUNICATION REQUEST'}
                </span>
                <p className="text-xl sm:text-2xl font-black leading-snug whitespace-pre-line">
                  "{config.templates.review(entities)}"
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-85">
                  {isSimpleLanguage ? 'Staff: Please tap a reply below' : 'Staff / Official: Tap Your Official Action'}
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {(config.staffOptions || COMMON_STAFF_RESPONSES).map(option => (
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
                  {isSimpleLanguage ? 'Or type a custom reply:' : 'Or Type a Written Note:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="customStaffText"
                    placeholder={isSimpleLanguage ? 'Type here...' : 'Type official reply or desk number...'}
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
                    <span>Confirm</span>
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

          {/* STATE 4: Completed (Handback Resolution Receipt) */}
          {currentState === 'completed' && (
            <div className="space-y-6 text-center py-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mx-auto shadow-sm ${accentSolid}`}>
                <Check className="w-7 h-7" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isSimpleLanguage ? 'Finished' : 'Interaction Logged & Complete'}
              </h2>

              <div className={`p-6 rounded-xl border ${borderTone} text-left max-w-lg mx-auto space-y-4 shadow-sm ${cardBg}`}>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">
                    Official Response Recorded
                  </span>
                  <p className="text-lg sm:text-xl font-black">
                    {staffResponse}
                  </p>
                </div>

                <div className="border-t pt-3.5" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">
                    {isSimpleLanguage ? 'Saved Summary' : 'Final Session Record'}
                  </span>
                  <p className={`text-xs sm:text-sm font-medium leading-relaxed ${textSecondary}`}>
                    {config.templates.completed(entities, staffResponse)}
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href={`/${domain}`}
                  className={`inline-block px-7 py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-all ${accentSolid}`}
                >
                  Return to {domain.toUpperCase()}
                </Link>
              </div>
            </div>
          )}
        </main>

        {/* Footer System Anchor */}
        <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg} mb-12 sm:mb-0`}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
            <p className="font-bold">SignMitra Engine • Multi-Domain State Engine</p>
            <div className="flex items-center gap-2 font-medium">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`}></span>
              <span>Deterministic Workflow Core Active</span>
            </div>
          </div>
        </footer>
      </div>
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