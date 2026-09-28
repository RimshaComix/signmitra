'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sun,
  Moon,
  MessageSquare,
  Hand,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  MapPin,
  Send,
  RotateCcw,
  Save,
  CheckSquare
} from 'lucide-react';

const QUICK_REPLIES = [
  { id: 'wait', label: 'Please wait a moment.', icon: Clock },
  { id: 'document', label: 'Please show your ID / document.', icon: FileText },
  { id: 'interpreter', label: 'I will arrange an interpreter.', icon: Users },
  { id: 'done', label: 'Everything is done. You can go.', icon: CheckCircle2 },
  { id: 'counter', label: 'Please go to the next counter/room.', icon: MapPin },
  { id: 'clarify', label: 'I need to clarify that. Let me check.', icon: Hand }
];

export default function StaffResponseInterface() {
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

  const [view, setView] = useState('staff_input'); // 'staff_input' or 'user_review'
  const [customReply, setCustomReply] = useState('');
  const [finalMessage, setFinalMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Auto-focus input when entering staff view
  useEffect(() => {
    if (view === 'staff_input') {
      document.getElementById('staff-custom-input')?.focus();
    }
  }, [view]);

  const handleQuickReplyTap = (text) => {
    setCustomReply(text);
  };

  const handleSendReply = (text) => {
    if (!text.trim()) return;
    setFinalMessage(text.trim());
    setView('user_review');
    setCustomReply('');
  };

  const handleSaveToHistory = () => {
    try {
      const historyItem = {
        id: `STAFF-REPLY-${Date.now()}`,
        domain: 'STAFF HANDOFF',
        intent: 'quick_response',
        title: 'Staff Quick Response',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: 'Staff Replied',
        verifiedByStaff: true, // Explicitly typed/tapped by staff
        entities: { 
          'Staff Message': finalMessage
        },
        staffResponse: finalMessage
      };

      const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));
      
      setIsSaved(true);
    } catch (e) {
      console.error('Failed to save staff reply', e);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link 
            href="/communication-hub" 
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40" aria-hidden="true">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">
            {view === 'staff_input' ? 'STAFF MODE' : 'USER REVIEW'}
          </span>
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

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        
        {view === 'staff_input' ? (
          // ==========================================
          // VIEW 1: STAFF FACING SCREEN
          // ==========================================
          <div className="animate-in fade-in zoom-in-95 duration-300 w-full space-y-6">
            
            {/* Instruction Banner for Staff */}
            <div className={`p-6 sm:p-8 rounded-3xl border-4 ${borderTone} ${cardBg} shadow-lg text-center space-y-3`}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#655A7C]/10 text-[#655A7C] dark:text-[#FDF1E2] mb-2">
                <Hand className="w-7 h-7" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                Hello. I am Deaf / Hard-of-Hearing.
              </h1>
              <p className={`text-base sm:text-lg font-bold ${textSecondary} max-w-xl mx-auto`}>
                Please use this screen to reply to me. You can tap a quick button below or type a custom message.
              </p>
            </div>

            {/* Staff Action Area */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${borderTone} ${cardInnerBg} shadow-sm space-y-5`}>
              
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  1. Tap a quick response:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUICK_REPLIES.map((reply) => {
                    const Icon = reply.icon;
                    return (
                      <button
                        key={reply.id}
                        onClick={() => handleQuickReplyTap(reply.label)}
                        className={`p-4 rounded-xl border-2 text-left font-bold text-sm sm:text-base transition-all flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${
                          customReply === reply.label 
                            ? `${accentSolid} border-transparent` 
                            : `${cardBg}${borderTone} hover:border-[#655A7C]`
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0 opacity-70" aria-hidden="true" />
                        <span>{reply.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <label htmlFor="staff-custom-input" className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  2. Or type your message here:
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="staff-custom-input"
                    type="text"
                    value={customReply}
                    onChange={(e) => setCustomReply(e.target.value)}
                    placeholder="Type details (e.g., 'Appointment is at 2 PM')"
                    className={`p-4 flex-1 font-bold border-2 rounded-xl text-base outline-none transition-colors ${cardBg} ${borderTone} focus:border-[#655A7C]`}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(customReply); }}
                  />
                  <button
                    onClick={() => handleSendReply(customReply)}
                    disabled={!customReply.trim()}
                    className={`px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${customReply.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-50 cursor-not-allowed border ' + borderTone}`}
                  >
                    <span>Send Reply</span>
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          // ==========================================
          // VIEW 2: USER REVIEW SCREEN
          // ==========================================
          <div className="animate-in slide-in-from-bottom-4 duration-300 w-full max-w-2xl mx-auto space-y-6 text-center" aria-live="assertive">
            
            <span className={`inline-block px-4 py-1.5 rounded-full border ${borderTone} ${cardInnerBg} text-xs font-mono font-bold uppercase tracking-widest opacity-80`}>
              Message from Staff
            </span>

            <div className={`p-8 sm:p-12 rounded-3xl border-4 ${borderTone} ${cardBg} shadow-2xl flex flex-col items-center justify-center min-h-[40vh]`}>
              <p className="text-3xl sm:text-5xl font-black leading-tight tracking-tight whitespace-pre-line">
                "{finalMessage}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
              <button
                onClick={handleSaveToHistory}
                disabled={isSaved}
                className={`p-4 rounded-xl border-2 transition-all font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${
                  isSaved 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : `${borderTone}${cardInnerBg} hover:opacity-80`
                }`}
              >
                {isSaved ? (
                  <>
                    <CheckSquare className="w-5 h-5" aria-hidden="true" />
                    Saved to History
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" aria-hidden="true" />
                    Save Response Record
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setView('staff_input');
                  setCustomReply('');
                  setIsSaved(false);
                }}
                className={`p-4 rounded-xl border ${borderTone} ${cardBg} hover:border-[#655A7C] transition-all font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2`}
              >
                <RotateCcw className="w-5 h-5 opacity-70" aria-hidden="true" />
                Let Staff Reply Again
              </button>
            </div>

            <div className="pt-8">
              <Link
                href="/conversation"
                className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${accentSolid} hover:opacity-90 shadow-sm`}
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Switch to Full Conversation Chat
              </Link>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}