'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  History,
  Trash2,
  Calendar,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

export default function RequestHistory() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();
  
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      setRecords(saved);
    } catch (e) {
      setRecords([]);
    }
  }, []);

  const deleteRecord = (id) => {
    if (confirm("Permanently delete this communication record?")) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      localStorage.setItem('signmitra_history', JSON.stringify(updated));
    }
  };

  const clearAll = () => {
    if (confirm("Clear all request history? This cannot be undone.")) {
      setRecords([]);
      localStorage.removeItem('signmitra_history');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      {/* Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">MY REQUESTS</span>
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 pb-28">
        <header className={`rounded-xl border ${borderTone} p-5 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 ${cardBg}`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
              <History className="w-3.5 h-3.5" />
              COMMUNICATION LEDGER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Request History</h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-sm leading-relaxed font-medium ${textSecondary}`}>
              A local record of your completed communication workflows. Pay attention to the verification badges to see which details were explicitly confirmed by staff.
            </p>
          </div>
          {records.length > 0 && (
            <button onClick={clearAll} className={`w-full sm:w-auto p-2 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all text-xs font-mono font-bold flex items-center justify-center gap-1.5 shrink-0`}>
              <Trash2 className="w-3.5 h-3.5" /> <span>Clear All</span>
            </button>
          )}
        </header>

        {records.length === 0 ? (
          <div className={`p-10 rounded-xl border border-dashed ${borderTone} ${cardInnerBg} text-center space-y-3`}>
            <Calendar className="w-8 h-8 mx-auto opacity-50" />
            <h3 className="font-bold uppercase tracking-tight">No Requests Found</h3>
            <p className={`text-xs font-mono ${textSecondary}`}>Completed communication sessions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => {
              const isExpanded = expandedId === record.id;
              
              // Fallback logic for older records that might not have this flag
              const isVerified = record.verifiedByStaff === true; 
              
              return (
                <div key={record.id} className={`rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden transition-all`}>
                  {/* Summary Bar */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${accentSolid}`}>
                          {record.domain}
                        </span>
                        <span className="text-[10px] font-mono font-bold opacity-60 whitespace-nowrap">
                          {record.date} • {record.time}
                        </span>
                      </div>
                      <h3 className="font-black font-sans uppercase tracking-tight text-sm sm:text-base truncate pr-2">
                        {record.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                      {/* 1. Verification Trust Badge on the collapsed view */}
                      {record.intent === 'live_chat' ? (
                        <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${isVerified ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400' : `${borderTone}${cardInnerBg} opacity-70`}`}>
                          {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{isVerified ? 'Staff Verified' : 'User Saved'}</span>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${borderTone} ${cardInnerBg}`}>
                           <ShieldCheck className="w-3 h-3 text-[#655A7C]" />
                           <span>Form Sent</span>
                        </div>
                      )}
                      
                      {isExpanded ? <ChevronUp className="w-5 h-5 opacity-60 shrink-0" /> : <ChevronDown className="w-5 h-5 opacity-60 shrink-0" />}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className={`p-5 pt-0 border-t ${borderTone} bg-black/5 dark:bg-white/5 animate-in slide-in-from-top-2 duration-200`}>
                      <div className="mt-5 space-y-5">
                        
                        {/* 2. Structured Rendering for Live Chat Summaries */}
                        {record.intent === 'live_chat' ? (
                          <div className="space-y-4">
                             {/* User Submission */}
                             <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1.5 flex items-center gap-1.5">
                                   <MessageSquare className="w-3 h-3" /> Your Context
                                </span>
                                <div className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} space-y-2`}>
                                   <div>
                                     <span className="text-[9px] font-mono font-bold uppercase opacity-50 block">What you asked</span>
                                     <p className="text-sm font-bold">{record.entities['What I Asked']}</p>
                                   </div>
                                </div>
                             </div>

                             {/* Staff Resolution & Next Steps */}
                             <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1.5 flex items-center gap-1.5">
                                   <ShieldCheck className="w-3 h-3" /> Staff Resolution & Next Steps
                                </span>
                                <div className={`p-3.5 rounded-xl border-2 ${isVerified ? 'border-green-500/50' : 'border-[#655A7C]'} ${cardBg} space-y-2.5 relative`}>
                                   
                                   {isVerified && (
                                     <div className="absolute -top-2.5 right-3 bg-green-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                                     </div>
                                   )}

                                   <div>
                                     <span className="text-[9px] font-mono font-bold uppercase opacity-50 block">Staff Reply</span>
                                     <p className="text-sm font-black">{record.entities['What They Said']}</p>
                                   </div>
                                   <div className="pt-2 border-t border-black/10 dark:border-white/10">
                                     <span className="text-[9px] font-mono font-bold uppercase opacity-50 block">Confirmed Action</span>
                                     <p className="text-sm font-bold text-[#655A7C] dark:text-[#AB92BF]">{record.staffResponse}</p>
                                   </div>
                                   {record.entities['Target Date'] && record.entities['Target Date'] !== 'N/A' && (
                                     <div>
                                        <span className="text-[9px] font-mono font-bold uppercase opacity-50 block">Target Date</span>
                                        <p className="text-xs font-mono font-bold">{record.entities['Target Date']}</p>
                                     </div>
                                   )}
                                </div>
                             </div>
                          </div>
                        ) : (
                          // Fallback for structured Form records AND Granular Conversation transcripts
                          <div className="space-y-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">Submitted Parameters</span>
                            
                            {/* Changed grid layout to 1 column to give chat transcripts full width */}
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(record.entities).map(([key, val]) => (
                                val && (
                                  <div key={key} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono`}>
                                    <span className="opacity-60 block text-[9px] uppercase mb-0.5">{key}</span>
                                    {/* 
                                        BUG FIX: Changed `truncate` to `whitespace-pre-wrap break-words` 
                                        so long chat transcripts display fully and preserve new lines.
                                    */}
                                    <span className="font-bold block whitespace-pre-wrap break-words">{val}</span>
                                  </div>
                                )
                              ))}
                            </div>
                            {record.staffResponse && (
                              <div className={`p-4 rounded-xl border-2 border-[#655A7C] ${cardBg} mt-4`}>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">
                                  Staff Resolution
                                </span>
                                <p className="text-sm font-black leading-snug">
                                  "{record.staffResponse}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end pt-3 border-t border-black/10 dark:border-white/10">
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="text-xs font-mono font-bold text-red-500 hover:opacity-75 transition-opacity flex items-center gap-1.5 px-2 py-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Record
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}