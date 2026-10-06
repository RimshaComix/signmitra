'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  History,
  Trash2,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function SavedSessions({ onReopenSession }) {
  const {
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme
  } = useTheme();

  const [sessions, setSessions] = useState([]);
  const [filterContext, setFilterContext] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('signmitra_ai_sessions') || '[]'
      );

      setSessions(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error('Failed to load saved AI sessions:', error);
      setSessions([]);
    }
  };

  const deleteSession = (id) => {
    if (
      !window.confirm(
        'Permanently delete this AI communication session from this device?'
      )
    ) {
      return;
    }

    try {
      const updated = sessions.filter((session) => session.id !== id);

      setSessions(updated);

      localStorage.setItem(
        'signmitra_ai_sessions',
        JSON.stringify(updated)
      );

      if (expandedId === id) {
        setExpandedId(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Unable to delete this session.');
    }
  };

  const clearAllSessions = () => {
    if (
      !window.confirm(
        'Permanently clear all saved AI session records from this device?'
      )
    ) {
      return;
    }

    try {
      localStorage.removeItem('signmitra_ai_sessions');
      setSessions([]);
      setExpandedId(null);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      alert('Unable to clear saved sessions.');
    }
  };

  const reopenSession = (session) => {
    if (typeof onReopenSession !== 'function') {
      return;
    }

    onReopenSession(session);
  };

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sessions.filter((session) => {
      const context = session.context?.toLowerCase() || '';
      const goal = session.goal?.toLowerCase() || '';
      const institution = session.institution?.toLowerCase() || '';
      const capturedText = session.capturedText?.toLowerCase() || '';

      const matchesContext =
        filterContext === 'All' ||
        context.includes(filterContext.toLowerCase());

      const matchesQuery =
        !query ||
        goal.includes(query) ||
        institution.includes(query) ||
        context.includes(query) ||
        capturedText.includes(query);

      return matchesContext && matchesQuery;
    });
  }, [sessions, filterContext, searchQuery]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date unavailable';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionStatus = (session) => {
    if (session.savedTasks?.length > 0) {
      return 'Follow-Up Scheduled';
    }

    if (session.unresolvedQuestions?.length > 0) {
      return 'Requires Follow-Up';
    }

    return 'Completed';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* HEADER */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}
            >
              FEATURE 28 · USER CONTROLLED
            </span>

            <span className="text-xs font-mono opacity-70 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Local Storage Ledger
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            Saved AI Sessions & Summaries
          </h2>

          <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
            Review confirmed interaction details, unresolved items, and
            follow-up actions from previous sessions.
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

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className={`flex-1 flex items-center px-4 py-2.5 rounded-xl border-2 ${borderTone} ${cardBg}`}
        >
          <Search className="w-4 h-4 opacity-50 mr-2 shrink-0" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by goal, institution, context, or captured text..."
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
          <option value="Government">Government Office</option>
          <option value="General">General Interaction</option>
        </select>
      </div>

      {/* RESULT COUNT */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold uppercase opacity-50">
            {filteredSessions.length} of {sessions.length} sessions
          </span>

          {(searchQuery || filterContext !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterContext('All');
              }}
              className="text-[10px] font-mono font-bold uppercase opacity-60 hover:opacity-100"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredSessions.length === 0 ? (
        <div
          className={`p-12 rounded-2xl border-2 border-dashed ${borderTone} ${cardInnerBg} text-center space-y-3`}
        >
          <Calendar className="w-10 h-10 mx-auto opacity-40" />

          <h3 className="font-bold uppercase tracking-tight">
            {sessions.length > 0
              ? 'No Matching Sessions'
              : 'No Saved Sessions Found'}
          </h3>

          <p className={`text-xs font-mono ${textSecondary}`}>
            {sessions.length > 0
              ? 'Try changing the search text or context filter.'
              : 'Complete an AI interaction session in the Recovery Journey tab to record it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">

          {filteredSessions.map((session) => {
            const isExpanded = expandedId === session.id;
            const status = getSessionStatus(session);

            return (
              <div
                key={session.id}
                className={`rounded-2xl border-2 ${borderTone} ${cardBg} overflow-hidden shadow-sm transition-all`}
              >

                {/* SESSION HEADER */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : session.id)
                  }
                  aria-expanded={isExpanded}
                  className={`w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 ${cardInnerBg} hover:opacity-90 transition-all`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${accentSolid} shrink-0`}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                          {session.context || 'Unknown Context'}
                        </span>

                        {session.institution && (
                          <span className="text-[10px] font-mono opacity-50 truncate">
                            • {session.institution}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-black uppercase tracking-tight mt-0.5 break-words">
                        {session.goal || 'Untitled AI Session'}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${borderTone}`}
                        >
                          {status}
                        </span>

                        <span className="text-[9px] font-mono opacity-50">
                          {formatDate(session.timestamp)}
                          {formatTime(session.timestamp)
                            ? ` · ${formatTime(session.timestamp)}`
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 opacity-60" />
                    ) : (
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    )}
                  </div>
                </button>

                {/* EXPANDED DETAILS */}
                {isExpanded && (
                  <div
                    className="p-5 border-t space-y-4 text-xs"
                    style={{
                      borderColor: isDarkTheme
                        ? '#AB92BF30'
                        : '#655A7C20'
                    }}
                  >

                    {/* SESSION METADATA */}
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-3`}
                    >
                      <div
                        className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg}`}
                      >
                        <span className="text-[9px] font-mono font-bold uppercase opacity-50 block">
                          Context
                        </span>
                        <span className="font-bold block mt-1">
                          {session.context || 'Not recorded'}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg}`}
                      >
                        <span className="text-[9px] font-mono font-bold uppercase opacity-50 block">
                          Institution
                        </span>
                        <span className="font-bold block mt-1">
                          {session.institution || 'Not specified'}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg}`}
                      >
                        <span className="text-[9px] font-mono font-bold uppercase opacity-50 block">
                          Session Status
                        </span>
                        <span className="font-bold block mt-1">
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* CONFIRMED FACTS */}
                    {session.confirmedFacts?.length > 0 ? (
                      <div
                        className="p-3.5 rounded-xl border border-green-500/30 bg-green-500/10 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />

                          <span className="font-mono font-bold text-green-700 dark:text-green-300 uppercase">
                            User-Confirmed Parameters
                          </span>
                        </div>

                        {session.confirmedFacts.map((fact, idx) => (
                          <p
                            key={`${session.id}-fact-${idx}`}
                            className="font-bold text-green-950 dark:text-green-100"
                          >
                            ✓ {fact}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg}`}
                      >
                        <span className="text-[10px] font-mono font-bold uppercase opacity-50">
                          Confirmed Parameters
                        </span>

                        <p className="font-medium opacity-60 mt-1">
                          No user-confirmed parameters were recorded.
                        </p>
                      </div>
                    )}

                    {/* UNRESOLVED QUESTIONS */}
                    {session.unresolvedQuestions?.length > 0 && (
                      <div
                        className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />

                          <span className="font-mono font-bold text-orange-700 dark:text-orange-300 uppercase">
                            Unresolved Ambiguities
                          </span>
                        </div>

                        {session.unresolvedQuestions.map((question, idx) => (
                          <p
                            key={`${session.id}-question-${idx}`}
                            className="font-bold text-orange-950 dark:text-orange-100"
                          >
                            ⚠️ {question}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* CAPTURED TEXT */}
                    {session.capturedText && (
                      <div
                        className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1`}
                      >
                        <span className="font-mono font-bold opacity-60 uppercase block text-[10px]">
                          Raw Captured Staff Response
                        </span>

                        <p className="font-medium italic leading-relaxed">
                          "{session.capturedText}"
                        </p>
                      </div>
                    )}

                    {/* SAVED TASKS */}
                    {session.savedTasks?.length > 0 && (
                      <div
                        className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
                      >
                        <span className="font-mono font-bold opacity-60 uppercase block text-[10px]">
                          Follow-Up Tasks Saved
                        </span>

                        {session.savedTasks.map((task, idx) => (
                          <div
                            key={`${session.id}-task-${task.id || idx}`}
                            className={`p-3 rounded-lg border ${borderTone} ${cardBg}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <span className="font-bold">
                                {task.nextAction ||
                                  task.title ||
                                  'Follow-up action'}
                              </span>

                              {task.dueDate && (
                                <span className="text-[10px] font-mono opacity-60">
                                  Due: {task.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ACTION BAR */}
                    <div
                      className="pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-dashed"
                      style={{
                        borderColor: isDarkTheme
                          ? '#AB92BF30'
                          : '#655A7C20'
                      }}
                    >
                      <span className="text-[10px] font-mono opacity-50 break-all">
                        Session ID: {session.id}
                      </span>

                      <div className="flex flex-wrap gap-2">

                        {typeof onReopenSession === 'function' && (
                          <button
                            type="button"
                            onClick={() => reopenSession(session)}
                            className={`py-1.5 px-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono font-bold flex items-center gap-1 hover:opacity-80 transition-all`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reopen Session</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteSession(session.id)}
                          className="py-1.5 px-3 rounded-lg border text-red-500 text-xs font-mono font-bold flex items-center gap-1 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Record</span>
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

      {/* PRIVACY NOTE */}
      {sessions.length > 0 && (
        <div
          className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} text-[10px] font-mono leading-relaxed opacity-70`}
        >
          <strong className="uppercase">Storage:</strong>{' '}
          Saved sessions are stored in this browser's local storage under{' '}
          <code>signmitra_ai_sessions</code>. They are not presented as
          server-synced records by this component. Delete individual records
          or clear the local ledger whenever you want.
        </div>
      )}
    </div>
  );
}