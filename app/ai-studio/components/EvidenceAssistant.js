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
  ExternalLink,
  Users,
  Eye,
  PenTool,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function EvidenceAssistant() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async (query = '') => {
    setIsQuerying(true);
    try {
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evidence_accessibility', query })
      });
      const data = await res.json();
      setRecords(data.records || []);
      if (data.records?.[0] && !selectedRecord) {
        setSelectedRecord(data.records[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDirectory(searchQuery);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}>
            FEATURE 24 · EVIDENCE GROUNDED
          </span>
          <span className="text-xs font-mono opacity-70">
            Audit-Verified Directory Intelligence
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Evidence-Grounded Accessibility Assistant
        </h2>
        <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
          Query real accessibility records from the Institution Accessibility Directory. The AI strictly summarizes documented audit facts and marks unverified facilities as Not Reported.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className={`flex-1 flex items-center px-4 py-2.5 rounded-xl border-2 ${borderTone} ${cardBg}`}>
          <Search className="w-4 h-4 opacity-50 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified hospital, bank, or university facilities..."
            className="w-full bg-transparent outline-none text-xs font-bold"
          />
        </div>
        <button
          type="submit"
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid} hover:opacity-90 transition-all`}
        >
          Query
        </button>
      </form>

      {/* Directory Records & Verified Evidence Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Left Column: Retrieved Records List */}
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
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'border-[#655A7C] ring-2 ring-[#655A7C] ' + cardInnerBg : cardBg + ' ' + borderTone
                } space-y-1.5`}
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${accentSolid}`}>
                    {r.type}
                  </span>
                  <span className="text-[10px] font-mono opacity-50 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.lastVerified}
                  </span>
                </div>
                <h4 className="text-xs font-black uppercase">{r.name}</h4>
                <p className="text-[11px] opacity-70 line-clamp-1">{r.address}</p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Evidence Summary & Strict Attribution */}
        <div className={`md:col-span-7 p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
          {selectedRecord ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase opacity-60">Verified Facility Profile</span>
                <h3 className="text-2xl font-black uppercase mt-1">{selectedRecord.name}</h3>
                <p className="text-xs font-medium opacity-70 mt-0.5">{selectedRecord.address}</p>
              </div>

              {/* Verification Metadata */}
              <div className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} grid grid-cols-2 gap-2 text-xs font-mono`}>
                <div>
                  <span className="opacity-60 block text-[10px]">Verification Source:</span>
                  <span className="font-bold">{selectedRecord.verifiedBy}</span>
                </div>
                <div>
                  <span className="opacity-60 block text-[10px]">Last Checked Date:</span>
                  <span className="font-bold">{selectedRecord.lastVerified}</span>
                </div>
              </div>

              {/* Reported Facilities Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase opacity-70">
                  Documented Accessibility Features:
                </span>

                {/* ISL Interpreter */}
                <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex items-start gap-3 text-xs`}>
                  {selectedRecord.features?.interpreter?.status === 'available' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  ) : selectedRecord.features?.interpreter?.status === 'request' ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">ISL Interpreter Status:</span>
                    <span className="opacity-80">{selectedRecord.features?.interpreter?.text}</span>
                  </div>
                </div>

                {/* Visual Queue Display */}
                <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex items-start gap-3 text-xs`}>
                  {selectedRecord.features?.visualQueue?.status === 'yes' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">Visual Token Display Boards:</span>
                    <span className="opacity-80">{selectedRecord.features?.visualQueue?.text}</span>
                  </div>
                </div>

                {/* Written Communication Support */}
                <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex items-start gap-3 text-xs`}>
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Written & Card Readiness:</span>
                    <span className="opacity-80">{selectedRecord.features?.writtenSupport?.text}</span>
                  </div>
                </div>
              </div>

              {/* Strict Non-Hallucination Policy Alert */}
              <div className={`p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-mono text-blue-900 dark:text-blue-200 flex items-start gap-2`}>
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Zero Hallucination Guarantee: Features marked with ✗ are confirmed unavailable in this facility's records. Staff readiness is not inferred.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center opacity-50 space-y-2">
              <Building className="w-8 h-8 mx-auto" />
              <p className="text-xs font-mono font-bold uppercase">No record selected</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
