'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sun,
  Moon,
  Search,
  Building,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Users,
  Video,
  PenTool,
  HeartPulse,
  Landmark,
  GraduationCap,
  AlertTriangle,
  Send,
  ExternalLink,
  IdCard
} from 'lucide-react';

// Simulated verified backend data with clear verification sources and locations
const DIRECTORY_DATA = [
  {
    id: 'hosp-1',
    name: 'City General Hospital (OPD Block)',
    type: 'Healthcare',
    icon: HeartPulse,
    address: '142 Health Avenue, Downtown, Chennai',
    lastVerified: '2026-09-15',
    verifiedBy: 'SignMitra Community (12 Submissions)',
    isSample: true,
    features: {
      interpreter: { status: 'available', text: 'On-Call ISL Interpreter Available (Requires 24h notice via desk)' },
      visualQueue: { status: 'yes', text: 'Digital token display boards active in all OPD waiting areas' },
      writtenSupport: { status: 'yes', text: 'Staff trained to use written pads and communication cards' }
    }
  },
  {
    id: 'bank-1',
    name: 'State Bank of India (Main Branch)',
    type: 'Banking',
    icon: Landmark,
    address: 'Financial District, Block C, Chennai',
    lastVerified: '2026-08-22',
    verifiedBy: 'Official Partner Audit',
    isSample: true,
    features: {
      interpreter: { status: 'no', text: 'No in-person interpreter. Video Relay Service allowed via mobile.' },
      visualQueue: { status: 'no', text: 'Audio-only token callouts. Inform security guard upon entry.' },
      writtenSupport: { status: 'yes', text: 'Dedicated accessibility forms available at Counter 1' }
    }
  },
  {
    id: 'edu-1',
    name: 'Easwari Engineering College (Main Office)',
    type: 'Education',
    icon: GraduationCap,
    address: 'Ramapuram, Chennai',
    lastVerified: '2026-09-20',
    verifiedBy: 'Student Accessibility Cell',
    isSample: true,
    features: {
      interpreter: { status: 'available', text: 'Interpreter confirmed available for exams & official meetings' },
      visualQueue: { status: 'na', text: 'Not applicable (Direct appointment desk)' },
      writtenSupport: { status: 'yes', text: 'Faculty provide written/visual notes upon formal request' }
    }
  }
];

export default function AccessibilityDirectory() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedInst, setSelectedInst] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportText, setReportText] = useState('');

  const filters = ['All', 'Healthcare', 'Banking', 'Education'];

  const filteredData = DIRECTORY_DATA.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || inst.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || inst.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    if (status === 'available' || status === 'yes') return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />;
    if (status === 'no') return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
    return <Clock className="w-5 h-5 opacity-50 shrink-0" />;
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setReportText('');
      setShowReportModal(false);
    }, 2000);
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
          <span className="opacity-90 font-bold uppercase tracking-wide">ACCESSIBILITY DIRECTORY</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}>
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col">
        
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
            <span>Verified & Crowdsourced Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Institution Directory
          </h1>
          <p className={`text-sm sm:text-base mt-2 font-medium leading-relaxed max-w-2xl ${textSecondary}`}>
            Check accessibility details like interpreter availability and visual displays before planning your visit.
          </p>
        </header>

        {/* Search & Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by institution name or area (e.g., Hospital, Chennai)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardBg} ${borderTone}`}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap border-2 ${
                  activeFilter === filter ? `${accentSolid} border-transparent shadow-sm` : `${cardBg}${borderTone} hover:border-[#655A7C]`
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Directory List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((inst) => {
              const Icon = inst.icon;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-5 ${cardBg} ${borderTone} hover:border-[#655A7C] hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#655A7C]`}
                >
                  <div className="space-y-3">
                    <div className="flex gap-4 items-start">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${cardInnerBg} border ${borderTone}`}>
                        <Icon className="w-6 h-6 opacity-80" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black leading-tight tracking-tight">{inst.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-medium opacity-70">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {inst.address}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 w-full">
                    <div className="flex gap-2 flex-wrap text-[10px] font-mono font-bold uppercase tracking-wider">
                      {inst.features.interpreter.status === 'available' && <span className="px-2.5 py-1 rounded border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">ISL Interpreter Confirmed</span>}
                      {inst.features.interpreter.status === 'no' && <span className="px-2.5 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">No Interpreter</span>}
                      {inst.features.visualQueue.status === 'yes' && <span className="px-2.5 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400">Visual Display</span>}
                    </div>

                    <div className={`pt-3 border-t flex justify-between items-center text-[10px] font-mono opacity-60`} style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                      <span>Verified: {inst.lastVerified}</span>
                      <span className="font-bold underline">View Details →</span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className={`col-span-full p-12 text-center rounded-2xl border-2 border-dashed ${borderTone} ${cardInnerBg} space-y-3`}>
              <ShieldAlert className="w-10 h-10 mx-auto opacity-40" />
              <h3 className="font-black text-base uppercase">No institutions found</h3>
              <p className={`text-xs font-medium ${textSecondary}`}>Try searching with a different keyword or clearing your filter selection.</p>
            </div>
          )}
        </div>
      </main>

      {/* DETAILED MODAL OVERLAY */}
      {selectedInst && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => { setSelectedInst(null); setShowReportModal(false); }}
        >
          <div 
            className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border-2 ${borderTone} ${bgCanvas} shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-start mb-6 border-b pb-4" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block mb-1">{selectedInst.type} Directory Record</span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">{selectedInst.name}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-xs font-medium opacity-70">
                  <MapPin className="w-3.5 h-3.5" /> {selectedInst.address}
                </div>
              </div>
              <button onClick={() => { setSelectedInst(null); setShowReportModal(false); }} className={`p-2 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80`}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {!showReportModal ? (
              <div className="overflow-y-auto no-scrollbar space-y-5 pb-2">
                <div className={`p-5 rounded-2xl border ${borderTone} ${cardBg} space-y-4`}>
                  
                  <div className="flex gap-4 items-start">
                    {getStatusIcon(selectedInst.features.interpreter.status)}
                    <div>
                      <span className="font-black text-sm block">ISL Interpreter Status</span>
                      <p className={`text-xs mt-1 font-medium leading-relaxed ${textSecondary}`}>{selectedInst.features.interpreter.text}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start border-t pt-4" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                    {getStatusIcon(selectedInst.features.visualQueue.status)}
                    <div>
                      <span className="font-black text-sm block">Visual Queue / Display Boards</span>
                      <p className={`text-xs mt-1 font-medium leading-relaxed ${textSecondary}`}>{selectedInst.features.visualQueue.text}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start border-t pt-4" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                    {getStatusIcon(selectedInst.features.writtenSupport.status)}
                    <div>
                      <span className="font-black text-sm block">Written Instructions & Pads</span>
                      <p className={`text-xs mt-1 font-medium leading-relaxed ${textSecondary}`}>{selectedInst.features.writtenSupport.text}</p>
                    </div>
                  </div>

                </div>

                <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-mono font-bold`}>
                  <div>
                    <span className="opacity-60 block text-[10px]">VERIFICATION META</span>
                    <span>Last Checked: {selectedInst.lastVerified}</span>
                    <span className="block opacity-70 font-normal">Source: {selectedInst.verifiedBy}</span>
                  </div>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="text-red-600 dark:text-red-400 hover:underline text-[11px] uppercase tracking-wider font-bold"
                  >
                    Report Outdated Info?
                  </button>
                </div>

                {/* Listing Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/communication-card"
                    className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-center transition-all ${accentSolid} hover:opacity-90 shadow-sm flex items-center justify-center gap-2`}
                  >
                    <IdCard className="w-4 h-4" /> Prepare Communication Card
                  </Link>
                </div>
              </div>
            ) : (
              /* REPORT OUTDATED INFO SUB-VIEW */
              <form onSubmit={handleReportSubmit} className="space-y-4 animate-in fade-in duration-200">
                {reportSuccess ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-500" />
                    <h3 className="font-black text-lg uppercase">Report Received</h3>
                    <p className={`text-xs font-medium ${textSecondary}`}>Thank you for helping keep the directory accurate for the community.</p>
                  </div>
                ) : (
                  <>
                    <div className={`p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold flex items-start gap-2`}>
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Let our moderation team know what has changed at <strong>{selectedInst.name}</strong>.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="report-desc" className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                        What information is inaccurate?
                      </label>
                      <textarea
                        id="report-desc"
                        rows={3}
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        placeholder="e.g., Interpreter is no longer available on weekends..."
                        className={`w-full p-3 font-bold border-2 rounded-xl text-xs outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone} resize-none`}
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowReportModal(false)}
                        className={`px-4 py-3 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!reportText.trim()}
                        className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid} hover:opacity-90 disabled:opacity-50`}
                      >
                        Submit Update Report
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}