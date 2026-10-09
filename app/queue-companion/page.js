
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sun,
  Moon,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Check,
  ChevronRight,
  Maximize2,
  Minimize2,
  BellRing,
  Info,
  Circle
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
*/

const STATUS_STAGES = [
  { id: 'waiting', label: 'Waiting for token', description: 'Monitoring visual display' },
  { id: 'called', label: 'Token called', description: 'Move toward counter' },
  { id: 'at_counter', label: 'At counter', description: 'Service in progress' },
  { id: 'completed', label: 'Service completed', description: 'Done' }
];

export default function QueueCompanion() {
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

  const [activeToken, setActiveToken] = useState({
    tokenNumber: 'A-42',
    institution: 'City General Hospital (OPD)',
    locationRoom: 'Counter 3 / Room 104',
    appointmentTime: '10:30 AM',
    currentStage: 'waiting',
    documentsNeeded: [
      { id: '1', name: 'Government ID', checked: true },
      { id: '2', name: 'Doctor Prescription Slip', checked: true },
      { id: '3', name: 'Past Medical Reports', checked: false }
    ],
    notes: 'Please alert me visually when my token is called. I may not hear a spoken announcement.'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newDocText, setNewDocText] = useState('');
  const [isLargeDisplayMode, setIsLargeDisplayMode] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('signmitra_queue_active');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveToken(parsed);
        setIsDemo(parsed.isDemo === undefined ? false : parsed.isDemo);
      } catch (e) {
        console.error('Failed to parse saved token', e);
      }
    }
  }, []);

  // Scrollbar fix: prevent the page behind the fullscreen overlay from scrolling.
  useEffect(() => {
    if (!isLargeDisplayMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLargeDisplayMode]);

  const saveToStorage = (updatedState, demoStatus = false) => {
    setActiveToken(updatedState);
    setIsDemo(demoStatus);
    localStorage.setItem('signmitra_queue_active', JSON.stringify({ ...updatedState, isDemo: demoStatus }));
  };

  const handleStageChange = (newStage) => {
    const updated = { ...activeToken, currentStage: newStage };
    saveToStorage(updated, isDemo);
  };

  const toggleDocCheck = (id) => {
    const updatedDocs = activeToken.documentsNeeded.map((doc) =>
      doc.id === id ? { ...doc, checked: !doc.checked } : doc
    );
    saveToStorage({ ...activeToken, documentsNeeded: updatedDocs }, isDemo);
  };

  const addDocument = (e) => {
    e.preventDefault();
    if (!newDocText.trim()) return;
    const newDoc = { id: Date.now().toString(), name: newDocText.trim(), checked: false };
    saveToStorage({
      ...activeToken,
      documentsNeeded: [...activeToken.documentsNeeded, newDoc]
    }, isDemo);
    setNewDocText('');
  };

  const removeDocument = (id) => {
    const updatedDocs = activeToken.documentsNeeded.filter((doc) => doc.id !== id);
    saveToStorage({ ...activeToken, documentsNeeded: updatedDocs }, isDemo);
  };

  const handleReset = () => {
    if (confirm('Clear current appointment and start fresh?')) {
      const emptyState = {
        tokenNumber: '',
        institution: '',
        locationRoom: '',
        appointmentTime: '',
        currentStage: 'waiting',
        documentsNeeded: [],
        notes: 'Please alert me visually when my token is called. I may not hear a spoken announcement.'
      };
      saveToStorage(emptyState, false);
      setIsEditing(true);
    }
  };

  const getStageIndex = (stageId) => STATUS_STAGES.findIndex(s => s.id === stageId);
  const currentStageIndex = getStageIndex(activeToken.currentStage);

  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>

      {/* Top Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link
            href="/communication-hub"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">QUEUE COMPANION</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col min-w-0">

        {/* Header Ribbon */}
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b ${borderTone} mb-6`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
              <BellRing className="w-3.5 h-3.5" />
              <span>VISUAL QUEUE TRACKER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Queue Companion
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-xl font-medium ${textSecondary}`}>
              Manually track your token status and prepare documents while waiting.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsLargeDisplayMode(true)}
              className={`flex-1 sm:flex-none p-2.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] transition-all font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              title="Show Fullscreen Token"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Show Big</span>
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${isEditing ? `${cardBg} border${borderTone}` : accentSolid}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'View Token' : 'Edit Info'}</span>
            </button>
          </div>
        </header>

        {isEditing ? (
          <div className={`p-6 rounded-2xl border ${borderTone} ${cardBg} space-y-6 animate-in fade-in duration-200`}>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Configure Tracker</h2>
              <p className={`text-xs font-medium mt-1 ${textSecondary}`}>Enter your details. Data is saved locally on this device.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  Token / Appointment Number *
                </label>
                <input
                  type="text"
                  value={activeToken.tokenNumber}
                  onChange={(e) => setActiveToken({ ...activeToken, tokenNumber: e.target.value })}
                  placeholder="e.g., A-42 or #901"
                  className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  Scheduled Time
                </label>
                <input
                  type="text"
                  value={activeToken.appointmentTime}
                  onChange={(e) => setActiveToken({ ...activeToken, appointmentTime: e.target.value })}
                  placeholder="e.g., 10:30 AM"
                  className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  Facility / Institution
                </label>
                <input
                  type="text"
                  value={activeToken.institution}
                  onChange={(e) => setActiveToken({ ...activeToken, institution: e.target.value })}
                  placeholder="e.g., City General Hospital"
                  className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  Room / Counter Location
                </label>
                <input
                  type="text"
                  value={activeToken.locationRoom}
                  onChange={(e) => setActiveToken({ ...activeToken, locationRoom: e.target.value })}
                  placeholder="e.g., Counter 3"
                  className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                Visual Notice for Staff
              </label>
              <textarea
                value={activeToken.notes}
                onChange={(e) => setActiveToken({ ...activeToken, notes: e.target.value })}
                rows={2}
                className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] resize-none ${cardInnerBg} ${borderTone}`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              <button
                type="button"
                onClick={handleReset}
                className={`p-4 rounded-xl border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 text-sm font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                Clear Data
              </button>
              <button
                type="button"
                onClick={() => {
                  saveToStorage(activeToken, false);
                  setIsEditing(false);
                }}
                className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${accentSolid} hover:opacity-90 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none shadow-sm`}
              >
                Save Tracking Data
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">

            {isDemo && (
              <div className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-start gap-3 text-xs font-mono font-bold`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Showing sample data. Tap <strong>EDIT INFO</strong> above to track your real appointment.</p>
              </div>
            )}

            {/* Primary High-Visibility Token Banner */}
            <div className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6`}>
              <div>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block mb-2 opacity-70`}>
                  YOUR TOKEN NUMBER
                </span>
                <p className="text-5xl sm:text-7xl font-black font-mono tracking-tight leading-none">
                  {activeToken.tokenNumber || '---'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono font-bold">
                  {activeToken.institution && (
                    <span className="flex items-center gap-1.5 opacity-80">
                      <MapPin className="w-3.5 h-3.5" />
                      {activeToken.institution}
                    </span>
                  )}
                  {activeToken.locationRoom && (
                    <span className={`px-2.5 py-1 rounded-md border ${borderTone} ${cardInnerBg}`}>
                      {activeToken.locationRoom}
                    </span>
                  )}
                  {activeToken.appointmentTime && (
                    <span className="flex items-center gap-1.5 opacity-80">
                      <Clock className="w-3.5 h-3.5" />
                      {activeToken.appointmentTime}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsLargeDisplayMode(true)}
                className={`w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                <Maximize2 className="w-5 h-5" />
                <span>Show to Staff</span>
              </button>
            </div>

            {/* Stage Progress Stepper */}
            <div className={`p-5 sm:p-7 rounded-2xl border ${borderTone} ${cardBg} shadow-sm space-y-5`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">
                  User-Updated Status
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded bg-[#655A7C]/10 text-[#655A7C] dark:text-[#AB92BF]">
                  Manual Tracking
                </span>
              </div>

              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[1.4rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#655A7C]/40 before:to-transparent">
                {STATUS_STAGES.map((st, idx) => {
                  const isActive = activeToken.currentStage === st.id;
                  const isPast = idx < currentStageIndex;

                  return (
                    <div key={st.id} className="relative flex items-center gap-4 py-2 group">
                      <button
                        onClick={() => handleStageChange(st.id)}
                        className="relative z-10 w-12 h-12 flex items-center justify-center shrink-0 focus-visible:ring-4 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded-full"
                        aria-label={`Set status to ${st.label}`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive ? 'border-[#655A7C] bg-[#655A7C] text-[#FDF1E2] scale-110' :
                          isPast ? 'border-[#655A7C] bg-[#655A7C]/20 text-[#655A7C] dark:text-[#AB92BF]' :
                          `${borderTone}${cardInnerBg} text-transparent hover:border-[#655A7C]`
                        }`}>
                          {isActive || isPast ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                        </div>
                      </button>

                      <button
                        onClick={() => handleStageChange(st.id)}
                        className={`flex-1 text-left py-2 px-3 rounded-lg transition-all ${isActive ? 'bg-[#655A7C]/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        <h4 className={`font-bold text-sm sm:text-base transition-colors ${isActive ? '' : isPast ? 'opacity-80' : 'opacity-50'}`}>
                          {st.label}
                        </h4>
                        <p className={`text-xs font-medium transition-colors ${isActive ? textSecondary : 'opacity-40'}`}>
                          {st.description}
                        </p>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents to Prepare Checklist */}
            <div className={`p-5 sm:p-7 rounded-2xl border ${borderTone} ${cardBg} shadow-sm space-y-5`}>
              <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Preparation Checklist</span>
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${activeToken.documentsNeeded.filter(d => d.checked).length === activeToken.documentsNeeded.length && activeToken.documentsNeeded.length > 0 ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400' : borderTone}`}>
                  {activeToken.documentsNeeded.filter((d) => d.checked).length} / {activeToken.documentsNeeded.length} Ready
                </span>
              </div>

              <div className="space-y-3">
                {activeToken.documentsNeeded.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-1 flex items-center justify-between gap-3 text-sm font-bold group`}
                  >
                    <button
                      onClick={() => toggleDocCheck(doc.id)}
                      className="flex items-center gap-3 text-left flex-1 py-2 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded-lg"
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                        doc.checked ? 'border-[#655A7C] bg-[#655A7C] text-[#FDF1E2]' : borderTone
                      }`}>
                        {doc.checked && <Check className="w-4 h-4" />}
                      </div>
                      <span className={`transition-all ${doc.checked ? 'opacity-50 line-through' : ''}`}>
                        {doc.name}
                      </span>
                    </button>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 p-2 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg transition-opacity"
                      aria-label={`Remove ${doc.name}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={addDocument} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newDocText}
                  onChange={(e) => setNewDocText(e.target.value)}
                  placeholder="Add another item..."
                  className={`p-3 flex-1 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
                <button
                  type="submit"
                  disabled={!newDocText.trim()}
                  className={`px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${newDocText.trim() ? accentSolid + ' hover:opacity-90 shadow-sm' : `opacity-50 cursor-not-allowed border-2 ${borderTone}${cardInnerBg}`}`}
                >
                  Add
                </button>
              </form>
            </div>

            {/* Note & Fallback */}
            {activeToken.notes && (
              <div className={`p-5 rounded-2xl border-2 border-dashed ${borderTone} ${cardInnerBg} text-sm`}>
                <span className="opacity-70 font-mono font-bold block mb-2 uppercase text-xs">
                  Message for Staff:
                </span>
                <p className="font-bold leading-relaxed">"{activeToken.notes}"</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* FULLSCREEN TOKEN DISPLAY OVERLAY */}
      {isLargeDisplayMode && (
        <div
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: '#9ca3af #f3f4f6',
  }}
  className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:p-8 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}
>

          <div className="flex justify-between items-center">
            <span className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-lg border-2 ${borderTone} ${cardInnerBg}`}>
              TOKEN DISPLAY
            </span>
            <button
              onClick={() => setIsLargeDisplayMode(false)}
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${cardBg} font-black text-sm uppercase tracking-wider hover:opacity-80 transition-all focus-visible:ring-4 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
            >
              Close <Minimize2 className="inline-block w-4 h-4 ml-1 -mt-0.5" />
            </button>
          </div>

          <div className="text-center my-6 space-y-6">
            <span className="text-lg sm:text-xl font-mono font-bold uppercase tracking-widest opacity-70 block">
              MY TOKEN NUMBER IS
            </span>

            <div className={`py-12 sm:py-20 rounded-3xl border-8 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#655A7C]/5'} shadow-2xl mx-auto max-w-2xl`}>
              <p className="text-8xl sm:text-[9rem] font-black font-mono tracking-tighter leading-none">
                {activeToken.tokenNumber || '---'}
              </p>
            </div>

            {activeToken.locationRoom && (
              <p className="text-2xl sm:text-4xl font-black uppercase tracking-tight mt-6">
                Going to: {activeToken.locationRoom}
              </p>
            )}

            {activeToken.notes && (
              <div className={`mt-8 p-6 max-w-xl mx-auto rounded-2xl border-4 ${borderTone} ${cardInnerBg}`}>
                <p className="text-lg sm:text-2xl font-bold leading-snug">
                  {activeToken.notes}
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-xs font-mono font-bold uppercase tracking-widest opacity-50">
            Show this screen to staff
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t py-6 px-4 sm:px-8 text-xs font-mono flex flex-col sm:flex-row justify-between items-center gap-2 ${borderTone} ${cardInnerBg}`}>
        <span className="font-bold">SignMitra Queue Tracker</span>
        <div className="flex items-center gap-2 opacity-70">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`} aria-hidden="true" />
          Saved on this device
        </div>
      </footer>

    </div>
  );
}