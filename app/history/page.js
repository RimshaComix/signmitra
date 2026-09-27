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
  ShieldCheck
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

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <header className={`rounded-xl border ${borderTone} p-6 mb-8 shadow-sm flex justify-between items-start ${cardBg}`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
              <History className="w-3.5 h-3.5" />
              COMMUNICATION LEDGER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Request History</h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-sm leading-relaxed ${textSecondary}`}>
              A private, local record of your completed communication manifests and staff responses.
            </p>
          </div>
          {records.length > 0 && (
            <button onClick={clearAll} className={`p-2 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all text-xs font-mono font-bold flex items-center gap-1.5`}>
              <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear All</span>
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
              
              return (
                <div key={record.id} className={`rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden transition-all`}>
                  {/* Summary Bar */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${accentSolid}`}>
                          {record.domain}
                        </span>
                        <span className="text-[10px] font-mono font-bold opacity-60">
                          {record.date} • {record.time}
                        </span>
                      </div>
                      <h3 className="font-black font-sans uppercase tracking-tight text-sm sm:text-base">
                        {record.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${borderTone} ${cardInnerBg}`}>
                        <ShieldCheck className="w-3 h-3 text-[#655A7C]" />
                        <span>{record.status}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 opacity-60" /> : <ChevronDown className="w-5 h-5 opacity-60" />}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className={`p-5 pt-0 border-t ${borderTone} bg-black/5 dark:bg-white/5`}>
                      <div className="mt-4 space-y-4">
                        {/* Parameters */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">Submitted Parameters</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(record.entities).map(([key, val]) => (
                              val && (
                                <div key={key} className={`p-2.5 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono`}>
                                  <span className="opacity-60 block text-[9px] uppercase mb-0.5">{key}</span>
                                  <span className="font-bold truncate block">{val}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>

                        {/* Staff Response */}
                        <div className={`p-4 rounded-xl border-2 border-[#655A7C] ${cardInnerBg} space-y-1.5`}>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">
                            Staff Resolution
                          </span>
                          <p className="text-sm font-black leading-snug">
                            "{record.staffResponse}"
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-2">
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="text-xs font-mono font-bold text-red-500 hover:opacity-75 transition-opacity flex items-center gap-1.5"
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