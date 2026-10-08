'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Building,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

export default function EvidenceAssistant() {
  const {
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
  } = useTheme();

  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async (query = '') => {
    setIsQuerying(true);
    setError('');

    try {
      // 1. Pull dynamic user reviews from local storage
      let localReviews = [];
      if (typeof window !== 'undefined') {
        try {
          localReviews = JSON.parse(localStorage.getItem('signmitra_accessibility_reviews') || '[]');
        } catch (err) {
          console.error('Error reading local reviews:', err);
        }
      }

      // 2. Pass localReviews to the backend in the POST payload
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evidence_accessibility',
          query,
          localReviews, // <--- Sent to backend
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Unable to retrieve accessibility records.');
      }

      const nextRecords = Array.isArray(data.records) ? data.records : [];

      setRecords(nextRecords);

      if (nextRecords.length > 0) {
        setSelectedRecord((current) => {
          const matchingCurrent = current
            ? nextRecords.find((record) => record.id === current.id)
            : null;

          return matchingCurrent || nextRecords[0];
        });
      } else {
        setSelectedRecord(null);
      }
    } catch (e) {
      console.error('Evidence Assistant query failed:', e);
      setError(e.message || 'Unable to retrieve accessibility records.');
      setRecords([]);
      setSelectedRecord(null);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDirectory(searchQuery.trim());
  };

  const getEvidenceState = (feature) => {
    const status = feature?.status;

    if (
      status === 'available' ||
      status === 'yes' ||
      status === 'confirmed'
    ) {
      return 'available';
    }

    if (
      status === 'unavailable' ||
      status === 'no' ||
      status === 'not_available'
    ) {
      return 'unavailable';
    }

    if (
      status === 'request' ||
      status === 'on_request'
    ) {
      return 'request';
    }

    return 'unknown';
  };

  const EvidenceIcon = ({ state }) => {
    if (state === 'available') {
      return (
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
      );
    }

    if (state === 'unavailable') {
      return (
        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      );
    }

    if (state === 'request') {
      return (
        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
      );
    }

    return (
      <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
    );
  };

  const EvidenceRow = ({ label, feature }) => {
    const state = getEvidenceState(feature);

    return (
      <div
        className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex items-start gap-3 text-xs`}
      >
        <EvidenceIcon state={state} />

        <div className="min-w-0">
          <span className="font-bold block">{label}</span>

          <span className="opacity-80">
            {feature?.text ||
              (state === 'available'
                ? 'Reported as available.'
                : state === 'unavailable'
                  ? 'Reported as unavailable.'
                  : state === 'request'
                    ? 'Available on request.'
                    : 'Not reported in the available evidence.')}
          </span>

          {state === 'unknown' && (
            <span className="text-[10px] font-mono uppercase opacity-50 block mt-1">
              Status: Not Reported
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}
          >
            FEATURE 24 · EVIDENCE GROUNDED
          </span>

          <span className="text-xs font-mono opacity-70">
            Evidence-Grounded Directory Intelligence
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Evidence-Grounded Accessibility Assistant
        </h2>

        <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
          Query accessibility records from the Institution Accessibility
          Directory. Only documented evidence is displayed; information that
          cannot be verified is marked as Not Reported.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div
          className={`flex-1 flex items-center px-4 py-2.5 rounded-xl border-2 ${borderTone} ${cardBg}`}
        >
          <Search className="w-4 h-4 opacity-50 mr-2 shrink-0" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospital, bank, or university facilities..."
            className="w-full bg-transparent outline-none text-xs font-bold"
            disabled={isQuerying}
          />
        </div>

        <button
          type="submit"
          disabled={isQuerying}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid} hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isQuerying ? 'Querying...' : 'Query'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs flex items-start gap-2 text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />

          <div>
            <span className="font-bold block">Unable to retrieve records</span>
            <span className="opacity-80">{error}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {isQuerying && records.length === 0 && (
        <div
          className={`p-8 rounded-2xl border-2 ${borderTone} ${cardBg} text-center`}
        >
          <div className="w-7 h-7 mx-auto mb-3 rounded-full border-2 border-current border-t-transparent animate-spin opacity-60" />
          <p className="text-xs font-mono font-bold uppercase opacity-60">
            Retrieving evidence records...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isQuerying && !error && records.length === 0 && (
        <div
          className={`p-10 rounded-2xl border-2 ${borderTone} ${cardBg} text-center space-y-2`}
        >
          <Building className="w-8 h-8 mx-auto opacity-40" />

          <p className="text-xs font-mono font-bold uppercase opacity-60">
            No accessibility records found
          </p>

          <p className="text-[11px] opacity-50">
            Try another facility or search term.
          </p>
        </div>
      )}

      {/* Directory Records & Evidence */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Left Column */}
          <div className="md:col-span-5 space-y-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block">
              Retrieved Records ({records.length})
            </span>

            {records.map((r) => {
              const isSelected = selectedRecord?.id === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecord(r)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedRecord(r);
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? `border-[#655A7C] ring-2 ring-[#655A7C] ${cardInnerBg}`
                      : `${cardBg}${borderTone}`
                  } space-y-1.5`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${accentSolid}`}
                    >
                      {r.type || 'Facility'}
                    </span>

                    <span className="text-[10px] font-mono opacity-50 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {r.lastVerified || 'Not reported'}
                    </span>
                  </div>

                  <h4 className="text-xs font-black uppercase">
                    {r.name}
                  </h4>

                  <p className="text-[11px] opacity-70 line-clamp-1">
                    {r.address || 'Address not reported'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div
            className={`md:col-span-7 p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
          >
            {selectedRecord ? (
              <div className="space-y-4">

                {/* Facility Profile */}
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                    Evidence Profile
                  </span>

                  <h3 className="text-2xl font-black uppercase mt-1">
                    {selectedRecord.name}
                  </h3>

                  <p className="text-xs font-medium opacity-70 mt-0.5">
                    {selectedRecord.address || 'Address not reported'}
                  </p>
                </div>

                {/* Verification Metadata */}
                <div
                  className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono`}
                >
                  <div>
                    <span className="opacity-60 block text-[10px]">
                      Evidence Source:
                    </span>

                    <span className="font-bold">
                      {selectedRecord.verifiedBy || 'Source not reported'}
                    </span>
                  </div>

                  <div>
                    <span className="opacity-60 block text-[10px]">
                      Last Checked:
                    </span>

                    <span className="font-bold">
                      {selectedRecord.lastVerified || 'Not reported'}
                    </span>
                  </div>
                </div>

                {/* Documented Features */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase opacity-70">
                    Documented Accessibility Features:
                  </span>

                  <EvidenceRow
                    label="ISL Interpreter Status:"
                    feature={selectedRecord.features?.interpreter}
                  />

                  <EvidenceRow
                    label="Visual Token Display Boards:"
                    feature={selectedRecord.features?.visualQueue}
                  />

                  <EvidenceRow
                    label="Written & Card Readiness:"
                    feature={selectedRecord.features?.writtenSupport}
                  />
                </div>

                {/* Evidence Policy */}
                <div
                  className={`p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-mono text-blue-900 dark:text-blue-200 flex items-start gap-2`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />

                  <p>
                    <span className="font-bold">
                      Evidence Grounding Policy:
                    </span>{' '}
                    Only documented evidence returned by the directory is
                    displayed. Unverified or unavailable information is not
                    inferred. “Not Reported” means the available evidence does
                    not establish the feature status.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center opacity-50 space-y-2">
                <Building className="w-8 h-8 mx-auto" />

                <p className="text-xs font-mono font-bold uppercase">
                  No record selected
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}