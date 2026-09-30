'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  History,
  Trash2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Building,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function SavedSessions({ onReopenSession }) {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [sessions, setSessions] = useState([]);
  const [filterContext, setFilterContext] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('signmitra_ai_sessions') || '[]');
      setSessions(saved);
    } catch {
      setSessions([]);
    }
  };

  const deleteSession = (id) => {
    if (confirm('Permanently delete this AI communication session?')) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      localStorage.setItem('signmitra_ai_sessions', JSON.stringify(updated));
    }
  };

  const clearAllSessions = () => {
    if (confirm('Permanently clear all AI session records from this device?')) {
      setSessions([]);
      localStorage.removeItem('signmitra_ai_sessions');
    }
  };

  const filteredSessions = sessions.filter(s => {
    const matchesContext = filterContext === 'All' || s.context?.toLowerCase().includes(filterContext.toLowerCase());
    const matchesQuery = !searchQuery || 
      s.goal?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.context?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesContext && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}>
              FEATURE 28 · USER CONTROLLED
            </span>
            <span className="text-xs font-mono opacity-70">
              Local Storage Ledger
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            Saved AI Sessions & Summaries
          </h2>
          <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
            Review verified interaction summaries, confirmed facts, and follow-up tasks from your past visits.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={clearAllSessions}
            className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${cardInnerBg} ${borderTone} hover:opacity-80 transition-all shrink-0`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Sessions</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`flex-1 flex items-center px-4 py-2.5 rounded-xl border-2 ${borderTone} ${cardBg}`}>
          <Search className="w-4 h-4 opacity-50 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by goal, institution, or context..."
            className="w-full bg-transparent outline-none text-xs font-bold"
          />
        </div>

        <select
          value={filterContext}
          onChange={(e) => setFilterContext(e.target.value)}
          className={`p-2.5 rounded-xl font-bold border-2 text-xs outline-none ${cardBg} ${borderTone}`}
        >
          <option value="All">All Contexts</option>
          <option value="College">College Office</option>
          <option value="Bank">Bank Branch</option>
          <option value="Hospital">Hospital OPD</option>
          <option value="Transit">Public Transit</option>
        </select>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className={`p-12 rounded-2xl border-2 border-dashed ${borderTone} ${cardInnerBg} text-center space-y-3`}>
          <Calendar className="w-10 h-10 mx-auto opacity-40" />
          <h3 className="font-bold uppercase tracking-tight">No Saved Sessions Found</h3>
          <p className={`text-xs font-mono ${textSecondary}`}>
            Complete an AI interaction session in the "Recovery Journey" tab to record it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const isExpanded = expandedId === session.id;

            return (
              <div
                key={session.id}
                className={`rounded-2xl border-2 ${borderTone} ${cardBg} overflow-hidden shadow-sm transition-all`}
              >
                {/* Header Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:opacity-90 select-none ${cardInnerBg}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${accentSolid}`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                          {session.context}
                        </span>
                        {session.institution && (
                          <span className="text-[10px] font-mono opacity-50">
                            • {session.institution}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-black uppercase tracking-tight mt-0.5">
                        {session.goal}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono opacity-50 hidden sm:inline">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t space-y-4 text-xs" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                    
                    {/* Confirmed Facts */}
                    {session.confirmedFacts?.length > 0 && (
                      <div className={`p-3.5 rounded-xl border border-green-500/30 bg-green-500/10 space-y-1.5`}>
                        <span className="font-mono font-bold text-green-700 dark:text-green-300 uppercase block">
                          Confirmed Parameters:
                        </span>
                        {session.confirmedFacts.map((fact, idx) => (
                          <p key={idx} className="font-bold text-green-950 dark:text-green-100">
                            ✓ {fact}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Unresolved Questions */}
                    {session.unresolvedQuestions?.length > 0 && (
                      <div className={`p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 space-y-1.5`}>
                        <span className="font-mono font-bold text-orange-700 dark:text-orange-300 uppercase block">
                          Unresolved Ambiguities:
                        </span>
                        {session.unresolvedQuestions.map((q, idx) => (
                          <p key={idx} className="font-bold text-orange-950 dark:text-orange-100">
                            ⚠️ {q}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Captured Text */}
                    {session.capturedText && (
                      <div className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1`}>
                        <span className="font-mono font-bold opacity-60 uppercase block text-[10px]">
                          Raw Captured Text:
                        </span>
                        <p className="font-medium italic">"{session.capturedText}"</p>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-2 flex justify-between items-center border-t border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                      <span className="text-[10px] font-mono opacity-50">Session ID: {session.id}</span>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="py-1.5 px-3 rounded-lg border text-red-500 text-xs font-mono font-bold flex items-center gap-1 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Record</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
