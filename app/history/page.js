'use client';

import React, { useEffect, useState } from 'react';
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
  const {
    bgCanvas,
    textPrimary,
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme
  } = useTheme();

  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // ---------------------------------------------------------
  // LOAD HISTORY
  // ---------------------------------------------------------
  const loadHistory = () => {
    try {
      const raw = localStorage.getItem('signmitra_history');
      const parsed = raw ? JSON.parse(raw) : [];

      setRecords(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Failed to load request history:', error);
      setRecords([]);
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD + CROSS-COMPONENT SYNC
  // ---------------------------------------------------------
  useEffect(() => {
    loadHistory();

    const handleHistoryUpdated = () => {
      loadHistory();
    };

    window.addEventListener(
      'signmitra:history-updated',
      handleHistoryUpdated
    );

    return () => {
      window.removeEventListener(
        'signmitra:history-updated',
        handleHistoryUpdated
      );
    };
  }, []);

  // ---------------------------------------------------------
  // DELETE ONE RECORD
  // ---------------------------------------------------------
  const deleteRecord = (id) => {
    if (
      !confirm(
        'Permanently delete this communication record?'
      )
    ) {
      return;
    }

    try {
      const updated = records.filter(
        (record) => record.id !== id
      );

      localStorage.setItem(
        'signmitra_history',
        JSON.stringify(updated)
      );

      setRecords(updated);

      if (expandedId === id) {
        setExpandedId(null);
      }

      window.dispatchEvent(
        new Event('signmitra:history-updated')
      );
    } catch (error) {
      console.error('Failed to delete history record:', error);
    }
  };

  // ---------------------------------------------------------
  // CLEAR ALL HISTORY
  // ---------------------------------------------------------
  const clearAll = () => {
    if (
      !confirm(
        'Clear all request history? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      localStorage.removeItem('signmitra_history');

      setRecords([]);
      setExpandedId(null);

      window.dispatchEvent(
        new Event('signmitra:history-updated')
      );
    } catch (error) {
      console.error('Failed to clear request history:', error);
    }
  };

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------
  const isConversationRecord = (record) => {
    return (
      record?.intent === 'live_chat' ||
      record?.intent === 'Two-Way Conversation Session' ||
      (Array.isArray(record?.messages) &&
        record.messages.length > 0) ||
      Boolean(record?.transcript)
    );
  };

  const getMessages = (record) => {
    if (
      Array.isArray(record?.messages) &&
      record.messages.length > 0
    ) {
      return record.messages;
    }

    return [];
  };

  const getSpeakerLabel = (message) => {
    if (message?.sender === 'user') {
      return 'YOU';
    }

    if (message?.sender === 'staff') {
      return 'STAFF';
    }

    return 'OTHER PERSON';
  };

  const getSpeakerStyle = (message) => {
    if (message?.sender === 'user') {
      return isDarkTheme
        ? 'border-blue-400/30 bg-blue-400/10'
        : 'border-blue-200 bg-blue-50';
    }

    return isDarkTheme
      ? 'border-emerald-400/30 bg-emerald-400/10'
      : 'border-emerald-200 bg-emerald-50';
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div
      className="min-h-screen"
      style={{
        background: bgCanvas,
        color: textPrimary
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">
            <Link
              href="/communication-hub"
              className="mt-1 rounded-xl p-2 transition hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Back to Communication Hub"
            >
              <ArrowLeft size={22} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <History size={24} />
                <h1 className="text-2xl font-black sm:text-3xl">
                  Request History
                </h1>
              </div>

              <p
                className="mt-1 max-w-3xl text-sm"
                style={{ color: textSecondary }}
              >
                A local record of your completed communication
                workflows. Pay attention to the verification
                badges to see which details were explicitly
                confirmed by staff.
              </p>
            </div>
          </div>

          {records.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:opacity-80"
              style={{
                borderColor: borderTone,
                color: textPrimary
              }}
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>

        {/* EMPTY STATE */}
        {records.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{
              background: cardBg,
              borderColor: borderTone
            }}
          >
            <History
              size={42}
              className="mx-auto mb-4 opacity-40"
            />

            <h2 className="text-lg font-black">
              No communication records
            </h2>

            <p
              className="mt-2 text-sm"
              style={{ color: textSecondary }}
            >
              Completed communication workflows will appear
              here on this device.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {records.map((record) => {
              const expanded = expandedId === record.id;
              const entities = record?.entities || {};
              const conversation =
                isConversationRecord(record);

              const messages = getMessages(record);

              return (
                <div
                  key={record.id}
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    background: cardBg,
                    borderColor: borderTone
                  }}
                >

                  {/* RECORD HEADER */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expanded ? null : record.id
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="p-4 sm:p-5">

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0">

                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">

                            <span
                              className="uppercase tracking-wider"
                              style={{ color: accentSolid }}
                            >
                              {record.domain ||
                                'Communication'}
                            </span>

                            <span
                              className="opacity-50"
                            >
                              •
                            </span>

                            <span
                              className="flex items-center gap-1"
                              style={{
                                color: textSecondary
                              }}
                            >
                              <Calendar size={13} />
                              {record.date ||
                                (record.timestamp
                                  ? new Date(
                                      record.timestamp
                                    ).toLocaleDateString()
                                  : '')}

                              {record.time && (
                                <>
                                  <span className="opacity-50">
                                    •
                                  </span>
                                  {record.time}
                                </>
                              )}
                            </span>

                            {conversation && (
                              <span className="rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                Conversation
                              </span>
                            )}
                          </div>

                          <h2 className="text-base font-black sm:text-lg">
                            {record.title ||
                              record.intent ||
                              'Communication Record'}
                          </h2>

                          <div className="mt-2 flex flex-wrap items-center gap-2">

                            {record.status && (
                              <span className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold">
                                <CheckCircle2 size={13} />
                                {record.status ===
                                'Completed'
                                  ? 'User Saved'
                                  : record.status}
                              </span>
                            )}

                            {conversation &&
                              Array.isArray(
                                record.messages
                              ) && (
                                <span
                                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                                  style={{
                                    background: isDarkTheme
                                      ? 'rgba(255,255,255,0.06)'
                                      : 'rgba(0,0,0,0.04)',
                                    color: textSecondary
                                  }}
                                >
                                  <MessageSquare
                                    size={13}
                                  />
                                  {record.messages.length}{' '}
                                  messages
                                </span>
                              )}

                          </div>
                        </div>

                        <div className="shrink-0">
                          {expanded ? (
                            <ChevronUp size={22} />
                          ) : (
                            <ChevronDown size={22} />
                          )}
                        </div>

                      </div>
                    </div>
                  </button>

                  {/* EXPANDED CONTENT */}
                  {expanded && (
                    <div
                      className="border-t px-4 py-5 sm:px-5"
                      style={{
                        borderColor: borderTone,
                        background: cardInnerBg
                      }}
                    >

                      {/* ================================================= */}
                      {/* TWO-WAY / CONVERSATION RECORD */}
                      {/* ================================================= */}
                      {conversation &&
                      record.intent !== 'live_chat' ? (
                        <div className="space-y-5">

                          {/* Conversation metadata */}
                          <div
                            className="rounded-xl border p-4"
                            style={{
                              borderColor: borderTone,
                              background: cardBg
                            }}
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <MessageSquare size={18} />
                              <h3 className="font-black">
                                Conversation Details
                              </h3>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">

                              <div>
                                <p
                                  className="text-[10px] font-black uppercase tracking-wider"
                                  style={{
                                    color: textSecondary
                                  }}
                                >
                                  Context
                                </p>
                                <p className="mt-1 text-sm font-bold">
                                  {record.domain ||
                                    record.context ||
                                    'General Interaction'}
                                </p>
                              </div>

                              <div>
                                <p
                                  className="text-[10px] font-black uppercase tracking-wider"
                                  style={{
                                    color: textSecondary
                                  }}
                                >
                                  Turns
                                </p>
                                <p className="mt-1 text-sm font-bold">
                                  {record.messageCount ||
                                    messages.length ||
                                    entities[
                                      'Turns Count'
                                    ] ||
                                    '0'}
                                </p>
                              </div>

                              <div>
                                <p
                                  className="text-[10px] font-black uppercase tracking-wider"
                                  style={{
                                    color: textSecondary
                                  }}
                                >
                                  Storage
                                </p>
                                <p className="mt-1 text-sm font-bold">
                                  This device
                                </p>
                              </div>

                            </div>
                          </div>

                          {/* COMPLETE TRANSCRIPT */}
                          <div>
                            <div className="mb-3 flex items-center gap-2">
                              <MessageSquare size={18} />
                              <h3 className="font-black">
                                Complete Conversation Transcript
                              </h3>
                            </div>

                            {messages.length > 0 ? (
                              <div className="space-y-3">

                                {messages.map(
                                  (message, index) => (
                                    <div
                                      key={
                                        message?.id ||
                                        `message-${index}`
                                      }
                                      className={`rounded-2xl border p-4 ${getSpeakerStyle(
                                        message
                                      )}`}
                                    >

                                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">

                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-black uppercase tracking-wider">
                                            {getSpeakerLabel(
                                              message
                                            )}
                                          </span>

                                          {message?.understanding ===
                                            'understood' && (
                                            <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                                              <CheckCircle2
                                                size={11}
                                              />
                                              Understood
                                            </span>
                                          )}

                                          {message?.understanding ===
                                            'unclear' && (
                                            <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                                              <AlertCircle
                                                size={11}
                                              />
                                              Unclear
                                            </span>
                                          )}
                                        </div>

                                        {message?.timestamp && (
                                          <span
                                            className="text-[11px]"
                                            style={{
                                              color: textSecondary
                                            }}
                                          >
                                            {message.timestamp}
                                          </span>
                                        )}

                                      </div>

                                      <p className="whitespace-pre-wrap text-base font-semibold leading-relaxed">
                                        {message?.text ||
                                          'Message unavailable.'}
                                      </p>

                                    </div>
                                  )
                                )}

                              </div>
                            ) : record.transcript ? (
                              <div
                                className="whitespace-pre-wrap rounded-xl border p-4 text-sm leading-relaxed"
                                style={{
                                  borderColor: borderTone,
                                  background: cardBg
                                }}
                              >
                                {record.transcript}
                              </div>
                            ) : (
                              <div
                                className="rounded-xl border p-4 text-sm"
                                style={{
                                  borderColor: borderTone,
                                  color: textSecondary
                                }}
                              >
                                No transcript was stored for
                                this record.
                              </div>
                            )}
                          </div>

                          {/* CONFIRMED FACTS */}
                          <div
                            className="rounded-xl border p-4"
                            style={{
                              borderColor: borderTone,
                              background: cardBg
                            }}
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <ShieldCheck size={18} />
                              <h3 className="font-black">
                                Confirmed Facts
                              </h3>
                            </div>

                            {Array.isArray(
                              record.confirmedFacts
                            ) &&
                            record.confirmedFacts.length > 0 ? (
                              <ul className="space-y-2">
                                {record.confirmedFacts.map(
                                  (fact, index) => (
                                    <li
                                      key={index}
                                      className="flex gap-2 text-sm"
                                    >
                                      <CheckCircle2
                                        size={16}
                                        className="mt-0.5 shrink-0"
                                      />
                                      <span>{fact}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p
                                className="text-sm"
                                style={{
                                  color: textSecondary
                                }}
                              >
                                None
                              </p>
                            )}
                          </div>

                          {/* UNRESOLVED */}
                          <div
                            className="rounded-xl border p-4"
                            style={{
                              borderColor: borderTone,
                              background: cardBg
                            }}
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <AlertCircle size={18} />
                              <h3 className="font-black">
                                Unresolved Details
                              </h3>
                            </div>

                            {Array.isArray(
                              record.unresolvedQuestions
                            ) &&
                            record.unresolvedQuestions.length >
                              0 ? (
                              <ul className="space-y-2">
                                {record.unresolvedQuestions.map(
                                  (item, index) => (
                                    <li
                                      key={index}
                                      className="text-sm"
                                    >
                                      {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p
                                className="text-sm"
                                style={{
                                  color: textSecondary
                                }}
                              >
                                None
                              </p>
                            )}
                          </div>

                        </div>
                      ) : record.intent ===
                        'live_chat' ? (

                        /* ================================================= */
                        /* OLD LIVE CHAT RECORDS */
                        /* ================================================= */
                        <div className="space-y-4">

                          <div>
                            <h3 className="mb-2 font-black">
                              Your Context
                            </h3>

                            <div
                              className="rounded-xl border p-4 text-sm"
                              style={{
                                borderColor: borderTone,
                                background: cardBg
                              }}
                            >
                              {record.capturedText ||
                                record.userMessage ||
                                'No context captured.'}
                            </div>
                          </div>

                          <div>
                            <h3 className="mb-2 font-black">
                              Staff Resolution & Next Steps
                            </h3>

                            <div
                              className="rounded-xl border p-4 text-sm"
                              style={{
                                borderColor: borderTone,
                                background: cardBg
                              }}
                            >
                              {record.staffResponse ||
                                'No staff response recorded.'}
                            </div>
                          </div>

                        </div>
                      ) : (

                        /* ================================================= */
                        /* STANDARD FORM RECORD */
                        /* ================================================= */
                        <div className="space-y-5">

                          <div>
                            <h3 className="mb-3 font-black">
                              Submitted Parameters
                            </h3>

                            <div
                              className="overflow-hidden rounded-xl border"
                              style={{
                                borderColor: borderTone,
                                background: cardBg
                              }}
                            >
                              {Object.keys(entities).length >
                              0 ? (
                                <div className="divide-y">
                                  {Object.entries(
                                    entities
                                  ).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="grid gap-1 p-3 sm:grid-cols-[180px_1fr] sm:gap-4"
                                        style={{
                                          borderColor:
                                            borderTone
                                        }}
                                      >
                                        <span
                                          className="text-xs font-black uppercase tracking-wider"
                                          style={{
                                            color:
                                              textSecondary
                                          }}
                                        >
                                          {key}
                                        </span>

                                        <span className="whitespace-pre-wrap text-sm font-semibold">
                                          {String(
                                            value ?? '—'
                                          )}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div
                                  className="p-4 text-sm"
                                  style={{
                                    color: textSecondary
                                  }}
                                >
                                  No submitted parameters
                                  recorded.
                                </div>
                              )}
                            </div>
                          </div>

                          {record.confirmedFacts && (
                            <div>
                              <h3 className="mb-2 font-black">
                                Confirmed Facts
                              </h3>

                              <div
                                className="rounded-xl border p-4 text-sm"
                                style={{
                                  borderColor: borderTone,
                                  background: cardBg
                                }}
                              >
                                {Array.isArray(
                                  record.confirmedFacts
                                )
                                  ? record.confirmedFacts.join(
                                      '\n'
                                    )
                                  : String(
                                      record.confirmedFacts
                                    )}
                              </div>
                            </div>
                          )}

                          {record.unresolvedQuestions && (
                            <div>
                              <h3 className="mb-2 font-black">
                                Unresolved Details
                              </h3>

                              <div
                                className="rounded-xl border p-4 text-sm"
                                style={{
                                  borderColor: borderTone,
                                  background: cardBg
                                }}
                              >
                                {Array.isArray(
                                  record.unresolvedQuestions
                                )
                                  ? record.unresolvedQuestions.join(
                                      '\n'
                                    )
                                  : String(
                                      record.unresolvedQuestions
                                    )}
                              </div>
                            </div>
                          )}

                          {record.staffResponse && (
                            <div>
                              <h3 className="mb-2 font-black">
                                Captured Response
                              </h3>

                              <div
                                className="rounded-xl border p-4 text-sm"
                                style={{
                                  borderColor: borderTone,
                                  background: cardBg
                                }}
                              >
                                {record.staffResponse}
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* DELETE */}
                      <div
                        className="mt-6 flex justify-end border-t pt-4"
                        style={{
                          borderColor: borderTone
                        }}
                      >
                        <button
                          onClick={() =>
                            deleteRecord(record.id)
                          }
                          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition hover:opacity-80"
                          style={{
                            borderColor: borderTone
                          }}
                        >
                          <Trash2 size={16} />
                          Delete Record
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* LOCAL STORAGE NOTICE */}
        <div
          className="mt-6 rounded-xl border p-4 text-xs leading-relaxed"
          style={{
            borderColor: borderTone,
            color: textSecondary
          }}
        >
          <div className="flex gap-2">
            <ShieldCheck
              size={16}
              className="mt-0.5 shrink-0"
            />
            <p>
              Communication history is stored locally in this
              browser. It is not automatically synchronized to
              a remote server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}