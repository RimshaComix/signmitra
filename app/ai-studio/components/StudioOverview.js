'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  Mic,
  Volume2,
  Camera,
  Cpu,
  ArrowRight,
  Play,
  RotateCcw,
  Layers,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function StudioOverview({ 
  onSelectTab, 
  onStartScenario, 
  systemStatus,
  backendHealth
}) {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const QUICK_SCENARIOS = [
    {
      id: 'college',
      context: 'College Office',
      goal: 'Submit hall ticket verification form and obtain administrative stamp',
      institution: 'Madras University Administrative Block',
      notes: 'Need verification before 2:30 PM on Thursday'
    },
    {
      id: 'bank',
      context: 'Bank Branch',
      goal: 'Update KYC address and verify signature mismatch on savings account',
      institution: 'State Bank of India (Main Branch)',
      notes: 'Carrying original Aadhaar card and passbook'
    },
    {
      id: 'hospital',
      context: 'Hospital OPD',
      goal: 'Register for fasting blood test and collect prescription token',
      institution: 'City General Hospital (OPD Block)',
      notes: 'Need visual alert when token is called'
    },
    {
      id: 'transit',
      context: 'Public Transit',
      goal: 'Inquire about special assistance for boarding suburban platform',
      institution: 'Central Railway Station',
      notes: 'Requesting written platform directions'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Welcome Banner */}
      <section className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-4`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardInnerBg} text-xs font-mono font-bold uppercase tracking-wider`}>
            <Bot className="w-3.5 h-3.5" />
            <span>AI-Assisted Support · Review Before Use</span>
          </div>
          <span className="text-[11px] font-mono opacity-70">
            Local-First Cognitive Companion
          </span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            SignMitra AI Studio
          </h1>
          <p className={`text-sm sm:text-base mt-2 max-w-2xl font-medium leading-relaxed ${textSecondary}`}>
            A connected AI communication companion for understanding, expressing, and completing everyday interactions. Designed specifically for Deaf and Hard-of-Hearing users communicating with people who may not know Indian Sign Language.
          </p>
        </div>

        {/* Central Journey Path Banner */}
        <div className={`pt-4 border-t ${borderTone}`}>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block mb-2">
            The Central SignMitra Journey:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold">
            {['Prepare', 'Communicate', 'Capture', 'Understand', 'Clarify', 'Confirm', 'Summarize', 'Follow Up'].map((step, idx, arr) => (
              <React.Fragment key={step}>
                <span className={`px-2.5 py-1 rounded-md border ${borderTone} ${cardInnerBg}`}>
                  {step}
                </span>
                {idx < arr.length - 1 && <span className="opacity-40">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => onSelectTab('recovery')}
            className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all ${accentSolid} hover:opacity-90 active:scale-95`}
          >
            <Play className="w-4 h-4" />
            <span>Start Guided Recovery Journey</span>
          </button>

          <button
            onClick={() => onSelectTab('twoway')}
            className={`px-5 py-3 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-80 transition-all`}
          >
            <Mic className="w-4 h-4" />
            <span>Open Two-Way Room</span>
          </button>

          <button
            onClick={() => onSelectTab('isllab')}
            className={`px-5 py-3 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-80 transition-all`}
          >
            <Video className="w-4 h-4" />
            <span>ISL Recognition Lab</span>
          </button>
        </div>
      </section>

      {/* Real-time Hardware & AI Diagnostics Matrix */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span>Live Capability Diagnostics</span>
          </h2>
          <span className="text-[10px] font-mono opacity-60">Verified Device APIs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Speech to text */}
          <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> STT Captions
              </span>
              <span className={`w-2 h-2 rounded-full ${systemStatus.speechSupported ? 'bg-green-500' : 'bg-orange-400'}`} />
            </div>
            <p className="text-[11px] font-medium opacity-80">
              {systemStatus.speechSupported ? 'Web Speech API Ready' : 'Manual Entry Fallback'}
            </p>
          </div>

          {/* Text to speech */}
          <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> Speech Audio
              </span>
              <span className={`w-2 h-2 rounded-full ${systemStatus.ttsSupported ? 'bg-green-500' : 'bg-orange-400'}`} />
            </div>
            <p className="text-[11px] font-medium opacity-80">
              {systemStatus.ttsSupported ? `${systemStatus.voiceCount} Voices Active` : 'Card Display Only'}
            </p>
          </div>

          {/* Camera / Vision */}
          <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Camera & OCR
              </span>
              <span className={`w-2 h-2 rounded-full ${systemStatus.cameraSupported ? 'bg-green-500' : 'bg-orange-400'}`} />
            </div>
            <p className="text-[11px] font-medium opacity-80">
              {systemStatus.cameraSupported ? 'WebRTC & File Upload' : 'Upload Supported'}
            </p>
          </div>

          {/* AI Provider & Python Backend */}
          <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Python AI Engine
              </span>
              <span className={`w-2 h-2 rounded-full ${
                backendHealth?.configured ? 'bg-green-500' : (backendHealth?.online ? 'bg-amber-400' : 'bg-red-400')
              }`} />
            </div>
            <p className="text-[11px] font-medium opacity-80 truncate">
              {backendHealth?.configured 
                ? `Live ${backendHealth.provider?.toUpperCase()} Inference`
                : (backendHealth?.online ? 'FastAPI Online (Key Required)' : 'Offline Fallback')}
            </p>
          </div>
        </div>
      </section>

      {/* Start from Realistic Interaction Presets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Launch with a Realistic Visit Scenario</span>
          </h2>
          <span className="text-[10px] font-mono opacity-60">1-Tap Preparation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {QUICK_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className={`p-4 sm:p-5 rounded-xl border ${borderTone} ${cardBg} hover:border-[#655A7C] transition-all flex flex-col justify-between space-y-3`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}>
                    {sc.context}
                  </span>
                  <span className="text-[10px] font-mono opacity-50 truncate max-w-[140px]">
                    {sc.institution}
                  </span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight mt-1">
                  {sc.goal}
                </h3>
                <p className={`text-xs mt-1.5 font-medium ${textSecondary}`}>
                  Note: {sc.notes}
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                <span className="text-[10px] font-mono opacity-60">Prepare → Communicate</span>
                <button
                  onClick={() => onStartScenario(sc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${accentSolid} hover:opacity-90`}
                >
                  <span>Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Capability Pillars */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>Connected AI Capability Suites</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div 
            onClick={() => onSelectTab('twoway')}
            className={`p-5 rounded-xl border ${borderTone} ${cardInnerBg} cursor-pointer hover:border-[#655A7C] transition-all space-y-2`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${accentSolid}`}>
              <Mic className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm uppercase">1. Live Two-Way Room</h3>
            <p className={`text-xs ${textSecondary} leading-relaxed`}>
              Large readable card display for the user, live speech-to-text subtitles for hearing staff, and user-initiated speech audio.
            </p>
          </div>

          <div 
            onClick={() => onSelectTab('tools')}
            className={`p-5 rounded-xl border ${borderTone} ${cardInnerBg} cursor-pointer hover:border-[#655A7C] transition-all space-y-2`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${accentSolid}`}>
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm uppercase">2. Language & Vision Tools</h3>
            <p className={`text-xs ${textSecondary} leading-relaxed`}>
              Queue token OCR, notice summarizer, communication gap detector, card composer, and verified accessibility directory.
            </p>
          </div>

          <div 
            onClick={() => onSelectTab('isllab')}
            className={`p-5 rounded-xl border ${borderTone} ${cardInnerBg} cursor-pointer hover:border-[#655A7C] transition-all space-y-2`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${accentSolid}`}>
              <Video className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm uppercase">3. ISL Recognition Lab</h3>
            <p className={`text-xs ${textSecondary} leading-relaxed`}>
              Limited-vocabulary sign recognizer, continuous signing research module, and verified ISLRTC learning companion.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Boundaries Notice */}
      <section className={`p-4 sm:p-5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs space-y-2`}>
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Product Boundaries & Safety Policy</span>
        </div>
        <p className="leading-relaxed opacity-90 text-blue-900 dark:text-blue-200">
          SignMitra is a communication-support companion designed to facilitate real-world interactions. It is not a certified legal or medical interpreter. Continuous ISL translation is kept strictly in the experimental research module. All transcripts, OCR readings, and AI suggestions require user review before action.
        </p>
      </section>

    </div>
  );
}
