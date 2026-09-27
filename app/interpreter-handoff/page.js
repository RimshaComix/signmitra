'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
    ArrowLeft,
    ArrowRight,
    Building,
    Video,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ExternalLink,
    MessageSquare,
    CalendarClock,
    Clock,
    ChevronDown
} from 'lucide-react';

const CONTEXTS = [
    'Hospital / Medical',
    'Bank / Financial',
    'College / Educational',
    'Police / Legal',
    'Government Office',
    'Other'
];

export default function InterpreterHandoff() {
    const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

    const [step, setStep] = useState(1);
    const [context, setContext] = useState(CONTEXTS[0]);
    const [institutionName, setInstitutionName] = useState('');
    const [staffResponse, setStaffResponse] = useState(null);
    const [savedToHistory, setSavedToHistory] = useState(false);

    // Custom Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleStaffResponse = (responseType) => {
        setStaffResponse(responseType);
        setStep(3);
    };

    const handleSaveRecord = () => {
        try {
            const historyItem = {
                id: `INTERPRETER-${Date.now()}`,
                domain: 'INTERPRETER REQUEST',
                intent: 'accessibility_request',
                title: `Interpreter Request: ${institutionName || context}`,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                status: staffResponse === 'arranged' ? 'Arranged' : staffResponse === 'wait' ? 'Pending' : 'Unavailable',
                verifiedByStaff: true,
                entities: {
                    'Location': institutionName || context,
                    'Requested Method': 'ISL Interpreter',
                    'Institution Response': staffResponse === 'arranged' ? 'Interpreter will be provided' : staffResponse === 'wait' ? 'Please wait' : 'No interpreter available'
                },
                staffResponse: staffResponse
            };

            const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
            localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));

            setSavedToHistory(true);
        } catch (e) {
            console.error('Failed to save request record', e);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>

            {/* Header */}
            <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`} role="region" aria-label="Navigation Header">
                <div className="flex items-center gap-3">
                    <Link
                        href="/communication-hub"
                        className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Hub</span>
                    </Link>
                    <span className="opacity-40" aria-hidden="true">/</span>
                    <span className="opacity-90 font-bold uppercase tracking-wide">INTERPRETER REQUEST</span>
                </div>
            </div>

            <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">

                {/* STEP 1: PREPARE THE REQUEST */}
                {step === 1 && (
                    <div className="animate-in fade-in duration-300 space-y-6">
                        <header>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Request an Interpreter</h1>
                            <p className={`text-sm mt-1 max-w-md font-medium ${textSecondary}`}>
                                Generate a formal request to show institution staff. SignMitra does not provide interpreters directly; this tool helps you request one from the facility.
                            </p>
                        </header>

                        <div className={`p-5 sm:p-6 rounded-2xl border ${borderTone} ${cardBg} shadow-sm space-y-5 relative`}>

                            {/* COMPACT THEME-COMPLIANT DROPDOWN */}
                            <div className="space-y-1.5 relative" ref={dropdownRef}>
                                <label id="context-label" className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70 px-1">
                                    Type of Institution
                                </label>
                                <button
                                    type="button"
                                    aria-haspopup="listbox"
                                    aria-expanded={isDropdownOpen}
                                    aria-labelledby="context-label"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full p-3 font-bold border rounded-xl text-xs sm:text-sm outline-none transition-colors flex justify-between items-center focus-visible:ring-2 focus-visible:ring-[#655A7C] ${cardInnerBg} ${borderTone}`}
                                >
                                    <span>{context}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 opacity-50 ${isDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                                </button>

                                {isDropdownOpen && (
                                    <ul
                                        role="listbox"
                                        aria-labelledby="context-label"
                                        className={`absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl border shadow-xl animate-in slide-in-from-top-1 duration-150 bg-[#5C4D75] ${borderTone}`}
                                    >
                                        {CONTEXTS.map((c) => {
                                            const isSelected = context === c;
                                            return (
                                                <li
                                                    key={c}
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    onClick={() => {
                                                        setContext(c);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`py-1.5 px-3 text-xs sm:text-sm font-bold cursor-pointer transition-colors border-b last:border-b-0 ${borderTone} ${isSelected
                                                            ? `\${accentSolid}`
                                                            : 'hover:bg-black/20 text-white'
                                                        }`}
                                                >
                                                    {c}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="inst-name" className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70 px-1">
                                    Institution Name (Optional)
                                </label>
                                <input
                                    id="inst-name"
                                    type="text"
                                    value={institutionName}
                                    onChange={(e) => setInstitutionName(e.target.value)}
                                    placeholder="e.g., General Hospital"
                                    className={`w-full p-3 font-bold border rounded-xl text-xs sm:text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#655A7C] ${cardInnerBg} ${borderTone}`}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 ${accentSolid} focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                        >
                            Generate Request Card <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                )}

                {/* STEP 2: SHOW TO STAFF */}
                {step === 2 && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-6 flex-1 flex flex-col" aria-live="polite">

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setStep(1)}
                                className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
                            >
                                ← Back
                            </button>
                            <div className={`px-3 py-1 rounded border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-widest`}>
                                Show to Staff
                            </div>
                        </div>

                        {/* Large Presentation Card */}
                        <div className={`flex-1 rounded-2xl border-4 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#FDF1E2]'} shadow-xl overflow-hidden flex flex-col`}>
                            <div className={`p-6 sm:p-8 ${isDarkTheme ? 'bg-[#FDF1E2] text-[#0a0a0a]' : 'bg-[#655A7C] text-[#FDF1E2]'}`}>
                                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight">
                                    I require an Indian Sign Language (ISL) Interpreter for accessibility.
                                </h2>
                            </div>
                            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center gap-4">
                                <p className="text-lg sm:text-xl font-bold leading-relaxed opacity-90">
                                    As a Deaf individual, I am requesting that this {context.toLowerCase()} provide a qualified ISL interpreter to ensure clear and accurate communication.
                                </p>
                                <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} mt-4`}>
                                    <p className="text-sm font-mono font-bold uppercase tracking-wider opacity-70 mb-2">Staff Action Required:</p>
                                    <p className="text-base font-bold">Please select your official response below so I can record it.</p>
                                </div>
                            </div>
                        </div>

                        {/* Staff Input Buttons */}
                        <div className="space-y-3" role="group" aria-label="Staff Response Options">
                            <button
                                onClick={() => handleStaffResponse('arranged')}
                                className="w-full p-4 rounded-xl border-2 border-green-600 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-400 font-bold text-sm sm:text-base transition-all hover:bg-green-100 flex items-center justify-between focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600 focus-visible:outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                                    <span>Yes, we will arrange an interpreter.</span>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-50" aria-hidden="true" />
                            </button>

                            <button
                                onClick={() => handleStaffResponse('wait')}
                                className="w-full p-4 rounded-xl border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 font-bold text-sm sm:text-base transition-all hover:bg-yellow-100 flex items-center justify-between focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500 focus-visible:outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5" aria-hidden="true" />
                                    <span>Please wait, we are checking.</span>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-50" aria-hidden="true" />
                            </button>

                            <button
                                onClick={() => handleStaffResponse('unavailable')}
                                className="w-full p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold text-sm sm:text-base transition-all hover:bg-red-100 flex items-center justify-between focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5" aria-hidden="true" />
                                    <span>No, an interpreter is unavailable.</span>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-50" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: FALLBACK & HANDOFF */}
                {step === 3 && (
                    <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6" aria-live="assertive">

                        <div className={`p-6 sm:p-8 rounded-2xl border ${borderTone} ${cardBg} shadow-sm text-center space-y-4`}>
                            {staffResponse === 'arranged' && (
                                <>
                                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                                        <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Interpreter Arranged</h2>
                                    <p className={`text-sm font-medium ${textSecondary}`}>
                                        Staff has confirmed they will provide an interpreter. Wait for further instructions.
                                    </p>
                                </>
                            )}

                            {staffResponse === 'wait' && (
                                <>
                                    <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-2">
                                        <Clock className="w-8 h-8" aria-hidden="true" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Checking Availability</h2>
                                    <p className={`text-sm font-medium ${textSecondary}`}>
                                        Staff is checking. You can wait, or switch to written communication in the meantime.
                                    </p>
                                </>
                            )}

                            {staffResponse === 'unavailable' && (
                                <>
                                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
                                        <AlertTriangle className="w-8 h-8" aria-hidden="true" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Interpreter Unavailable</h2>
                                    <p className={`text-sm font-medium ${textSecondary}`}>
                                        The institution cannot provide an interpreter right now. Choose a fallback option below.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Fallback Options */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-widest opacity-70 mb-2">Next Steps / Fallbacks</h3>

                            <Link
                                href="/conversation"
                                className={`w-full p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all flex items-center justify-between font-bold text-sm focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5" aria-hidden="true" />
                                    <span>Switch to Written Live Assist</span>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-50" aria-hidden="true" />
                            </Link>

                            {staffResponse === 'unavailable' && (
                                <a
                                    href="https://islrtc.nic.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all flex items-center justify-between font-bold text-sm focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Video className="w-5 h-5 text-blue-500" aria-hidden="true" />
                                        <div>
                                            <span>Open ISLRTC Video Relay Service</span>
                                            <span className="block text-[10px] font-mono opacity-70 uppercase tracking-wider mt-0.5">External Government Service</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 opacity-50" aria-hidden="true" />
                                </a>
                            )}

                            <button
                                onClick={handleSaveRecord}
                                disabled={savedToHistory}
                                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between font-bold text-sm focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${savedToHistory ? `border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400` : `${borderTone}${cardInnerBg} hover:opacity-80`
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <CalendarClock className="w-5 h-5" aria-hidden="true" />
                                    <span>{savedToHistory ? 'Saved to Request History' : 'Log Request in History'}</span>
                                </div>
                                {savedToHistory && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                            </button>
                        </div>

                        <div className="text-center pt-4 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                            <button
                                onClick={() => { setStep(1); setStaffResponse(null); setSavedToHistory(false); }}
                                className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-2 py-1"
                            >
                                Start New Request
                            </button>
                        </div>

                    </div>
                )}

            </main>
        </div>
    );
}