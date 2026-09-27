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
  VolumeX
} from 'lucide-react';

const COMMUNICATION_METHODS = [
  { id: 'written', label: 'Written Communication (Pen/Paper or Phone)', icon: PenTool },
  { id: 'visual', label: 'Visual Instructions & Gestures', icon: Eye },
  { id: 'interpreter', label: 'Sign Language Interpreter', icon: MessageSquare },
  { id: 'lipreading', label: 'Lip Reading (Please face me)', icon: VolumeX }
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
  const [activeRequests, setActiveRequests] = useState([QUICK_REQUESTS[0], QUICK_REQUESTS[1]]);
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
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit Card
          </button>
        )}
      </div>

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col">
        
        {isEditing ? (
          // ==========================================
          // EDIT MODE: CONFIGURATION
          // ==========================================
          <div className="animate-in fade-in duration-300 space-y-6">
            <header>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Configure Your Card</h1>
              <p className={`text-sm mt-1 max-w-sm font-medium ${textSecondary}`}>
                Select how you want staff to communicate with you. These preferences will be saved locally on your device.
              </p>
            </header>

            <div className={`p-5 sm:p-6 rounded-2xl border ${borderTone} ${cardBg} shadow-sm space-y-6`}>
              
              {/* Communication Method Selection */}
              <section aria-labelledby="primary-method-heading">
                <h2 id="primary-method-heading" className="text-xs font-mono font-bold uppercase tracking-widest mb-3 opacity-70">
                  Primary Communication Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Select primary communication method">
                  {COMMUNICATION_METHODS.map((method) => {
                    const isSelected = preferredMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPreferredMethod(method.id)}
                        role="radio"
                        aria-checked={isSelected}
                        className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${
                          isSelected ? accentSolid + ' border-transparent shadow-sm' : `${cardInnerBg}${borderTone} hover:border-[#655A7C]`
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="font-bold text-sm leading-snug">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Quick Requests Selection */}
              <section aria-labelledby="quick-requests-heading">
                <h2 id="quick-requests-heading" className="text-xs font-mono font-bold uppercase tracking-widest mb-3 opacity-70">
                  Quick Requests (Select up to 3)
                </h2>
                <div className="space-y-2">
                  {QUICK_REQUESTS.map((req, idx) => {
                    const isSelected = activeRequests.includes(req);
                    const isDisabled = !isSelected && activeRequests.length >= 3;
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleRequest(req)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${
                          isSelected ? `${borderTone}${cardInnerBg} border-[#655A7C]` : `${borderTone}${cardBg}`
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'}`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? accentSolid + ' border-transparent' : borderTone}`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? '' : textSecondary}`}>{req}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className={`flex-1 py-3.5 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`flex-[2] py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                <Save className="w-4 h-4" aria-hidden="true" /> Save Card
              </button>
            </div>
          </div>
        ) : (
          // ==========================================
          // DISPLAY MODE: HIGH CONTRAST PRESENTATION
          // ==========================================
          <div className="flex-1 flex flex-col justify-center animate-in zoom-in-95 duration-300">
            
            <div 
              className={`rounded-3xl border-4 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#FDF1E2]'} shadow-2xl overflow-hidden`}
              role="region"
              aria-label="High Contrast Communication Card"
            >
              {/* Giant Banner */}
              <div className={`p-6 sm:p-8 ${isDarkTheme ? 'bg-[#FDF1E2] text-[#0a0a0a]' : 'bg-[#655A7C] text-[#FDF1E2]'}`}>
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
                  I communicate using Indian Sign Language (ISL).
                </h2>
              </div>

              {/* Selected Method */}
              <div className="p-6 sm:p-8 border-b-4 border-dashed" style={{ borderColor: isDarkTheme ? 'rgba(253, 241, 226, 0.2)' : 'rgba(101, 90, 124, 0.2)' }}>
                <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest opacity-70 block mb-3">
                  Preferred Method:
                </span>
                <div className="flex items-center gap-4">
                  <MethodIcon className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" aria-hidden="true" />
                  <p className="text-xl sm:text-3xl font-black leading-snug">
                    {activeMethodData.label}
                  </p>
                </div>
              </div>

              {/* Selected Requests */}
              {activeRequests.length > 0 && (
                <div className={`p-6 sm:p-8 ${cardInnerBg}`}>
                  <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest opacity-70 block mb-4">
                    Please:
                  </span>
                  <ul className="space-y-4" role="list">
                    {activeRequests.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 mt-0.5 opacity-80" aria-hidden="true" />
                        <span className="text-lg sm:text-2xl font-bold leading-snug">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 mt-6">
              Show this screen directly to staff
            </p>
          </div>
        )}

      </main>
    </div>
  );
}