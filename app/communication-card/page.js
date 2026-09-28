'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Settings2,
  CheckCircle2,
  Maximize2,
  Edit3,
  MessageSquare,
  Eye,
  PenTool,
  Save,
  VolumeX,
  Info
} from 'lucide-react';

const COMMUNICATION_METHODS = [
  { id: 'written', label: 'Written Communication (Pen/Paper or Phone)', icon: PenTool },
  { id: 'visual', label: 'Visual Instructions & Gestures', icon: Eye },
  { id: 'interpreter', label: 'ISL Interpreter Needed', icon: MessageSquare }, // Clarified label based on your feedback
  { id: 'lipreading', label: 'Lip-reading support — please face me', icon: VolumeX }
];

const QUICK_REQUESTS = [
  'Please write down important details.',
  'Please face me directly when speaking.',
  'Please explain one step at a time.',
  'Please do not shout; it does not help.',
  'I need an ISL interpreter for this conversation.'
];

export default function PersonalCommunicationCard() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState('written');
  const [activeRequests, setActiveRequests] = useState([QUICK_REQUESTS[0], QUICK_REQUESTS[2]]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('signmitra_comm_card');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferredMethod(parsed.method || 'written');
        setActiveRequests(parsed.requests || []);
      } else {
        // If no card exists yet, open in edit mode automatically
        setIsEditing(true);
      }
    } catch (e) {
      console.error('Failed to load communication card preferences', e);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('signmitra_comm_card', JSON.stringify({
        method: preferredMethod,
        requests: activeRequests
      }));
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save communication card preferences', e);
    }
  };

  const toggleRequest = (req) => {
    setActiveRequests(prev => 
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    );
  };

  if (!isMounted) return null;

  const activeMethodData = COMMUNICATION_METHODS.find(m => m.id === preferredMethod) || COMMUNICATION_METHODS[0];
  const MethodIcon = activeMethodData.icon;

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`} role="region" aria-label="Navigation Header">
        <div className="flex items-center gap-3">
          <Link 
            href="/communication-hub" 
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
            aria-label="Return to Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40" aria-hidden="true">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">ID CARD</span>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className={`px-3 py-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
            aria-label="Edit Communication Preferences"
          >
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit Preferences
          </button>
        )}
      </div>

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col">
        
        {isEditing ? (
          // ==========================================
          // EDIT MODE: CONFIGURATION
          // ==========================================
          <div className="animate-in fade-in duration-300 space-y-8">
            <header>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Configure Your Communication Card</h1>
              <p className={`text-sm mt-1 max-w-sm font-medium ${textSecondary}`}>
                Tell staff how to communicate with you. Your preferences are saved locally on this device.
              </p>
            </header>

            <div className="space-y-8">
              
              {/* Communication Method Selection */}
              <section aria-labelledby="primary-method-heading">
                <h2 id="primary-method-heading" className="text-xs font-mono font-bold uppercase tracking-widest mb-3 opacity-70">
                  1. Preferred Communication Method
                </h2>
                
                {/* Interpreter Clarification Note */}
                {preferredMethod === 'interpreter' && (
                  <div className={`p-3 mb-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-start gap-2 text-xs font-bold`}>
                     <Info className="w-4 h-4 shrink-0 mt-0.5" />
                     <p>Note: Selecting this informs staff of your preference, but does not automatically book an interpreter.</p>
                  </div>
                )}

                <div className="space-y-3" role="radiogroup" aria-label="Select primary communication method">
                  {COMMUNICATION_METHODS.map((method) => {
                    const isSelected = preferredMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPreferredMethod(method.id)}
                        role="radio"
                        aria-checked={isSelected}
                        className={`w-full p-5 rounded-2xl border-2 text-left flex items-center justify-between gap-4 transition-all focus-visible:ring-4 focus-visible:ring-[#655A7C] focus-visible:outline-none ${
                          isSelected ? `${accentSolid} border-transparent shadow-sm scale-[1.02]` : `${cardBg}${borderTone} hover:border-[#655A7C]`
                        }`}
                      >
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-black/10 dark:bg-white/10' : `${cardInnerBg} border${borderTone}`}`}>
                             <Icon className="w-5 h-5" aria-hidden="true" />
                           </div>
                           <span className="font-bold text-base leading-snug">{method.label}</span>
                        </div>
                        {/* Visible Checkmark for Selected State */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-current bg-current text-[#FDF1E2] dark:text-[#0a0a0a]' : borderTone}`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Quick Requests Selection */}
              <section aria-labelledby="quick-requests-heading">
                <div className="flex items-center justify-between mb-3">
                  <h2 id="quick-requests-heading" className="text-xs font-mono font-bold uppercase tracking-widest opacity-70">
                    2. Quick Requests
                  </h2>
                  {/* LIVE COUNTER */}
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-md border ${activeRequests.length === 3 ? 'border-red-500/50 text-red-500 bg-red-500/10' : `${borderTone}${cardBg}`}`}>
                    {activeRequests.length} of 3 selected
                  </span>
                </div>

                <div className="space-y-3">
                  {QUICK_REQUESTS.map((req, idx) => {
                    const isSelected = activeRequests.includes(req);
                    const isDisabled = !isSelected && activeRequests.length >= 3;
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleRequest(req)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                        className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${
                          isSelected ? `${borderTone}${cardInnerBg} border-[#655A7C]` : `${borderTone}${cardBg}`
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-[#655A7C]'}`}
                      >
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? accentSolid + ' border-transparent' : borderTone}`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? '' : textSecondary}`}>{req}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
              
              {/* LIVE PREVIEW SECTION */}
              <section>
                 <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-3 opacity-70">
                   3. Preview your card
                 </h2>
                 <div className={`p-6 rounded-2xl border-2 border-dashed ${borderTone} ${cardBg} pointer-events-none opacity-80`}>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-4">I communicate using ISL.</h3>
                    <div className="flex items-center gap-2 text-sm font-bold mb-4">
                      <MethodIcon className="w-4 h-4" /> <span>Preferred method: {activeMethodData.label}</span>
                    </div>
                    {activeRequests.length > 0 && (
                      <ul className="space-y-2 text-sm font-bold">
                        {activeRequests.map((r, i) => (
                           <li key={i} className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 mt-0.5 opacity-70"/> {r}</li>
                        ))}
                      </ul>
                    )}
                 </div>
              </section>

            </div>

            <div className="flex gap-3 pt-6 pb-12 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              <button
                onClick={() => setIsEditing(false)}
                className={`flex-1 py-4 rounded-xl border-2 ${borderTone} ${cardBg} font-bold text-sm uppercase tracking-widest hover:opacity-80 transition-all focus-visible:ring-4 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`flex-[2] py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                <Save className="w-5 h-5" aria-hidden="true" /> Save My Card
              </button>
            </div>
          </div>
        ) : (
          // ==========================================
          // DISPLAY MODE: HIGH CONTRAST PRESENTATION
          // ==========================================
          <div className="flex-1 flex flex-col justify-center animate-in zoom-in-95 duration-300 pb-12">
            
            <div 
              className={`rounded-3xl border-4 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#FDF1E2]'} shadow-2xl overflow-hidden`}
              role="region"
              aria-label="High Contrast Communication Card"
            >
              {/* Giant Banner */}
              <div className={`p-6 sm:p-8 md:p-10 ${isDarkTheme ? 'bg-[#FDF1E2] text-[#0a0a0a]' : 'bg-[#655A7C] text-[#FDF1E2]'}`}>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.1]">
                  I communicate using Indian Sign Language (ISL).
                </h2>
              </div>

              {/* Selected Method */}
              <div className="p-6 sm:p-8 md:p-10 border-b-4 border-dashed" style={{ borderColor: isDarkTheme ? 'rgba(253, 241, 226, 0.2)' : 'rgba(101, 90, 124, 0.2)' }}>
                <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest opacity-70 block mb-3">
                  Preferred Method:
                </span>
                <div className="flex items-center gap-4 sm:gap-6">
                  <MethodIcon className="w-12 h-12 sm:w-16 sm:h-16 shrink-0" aria-hidden="true" />
                  <p className="text-2xl sm:text-4xl font-black leading-snug">
                    {activeMethodData.label}
                  </p>
                </div>
              </div>

              {/* Selected Requests */}
              {activeRequests.length > 0 && (
                <div className={`p-6 sm:p-8 md:p-10 ${cardInnerBg}`}>
                  <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest opacity-70 block mb-5">
                    Please:
                  </span>
                  <ul className="space-y-5" role="list">
                    {activeRequests.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 mt-0.5 opacity-80" aria-hidden="true" />
                        <span className="text-xl sm:text-3xl font-bold leading-snug">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 mt-8">
              Show this screen directly to staff
            </p>
          </div>
        )}

      </main>
    </div>
  );
}