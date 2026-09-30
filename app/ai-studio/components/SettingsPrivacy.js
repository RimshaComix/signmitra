'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Settings,
  ShieldCheck,
  Volume2,
  Type,
  Mic,
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Library,
  IdCard,
  MessageSquareWarning,
  CalendarClock,
  ExternalLink
} from 'lucide-react';

export default function SettingsPrivacy({ systemStatus }) {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme, isSimpleLanguage, toggleSimpleLanguage } = useTheme();

  // Profile preferences
  const [prefCommMode, setPrefCommMode] = useState('Visual Cards');
  const [prefTextSize, setPrefTextSize] = useState('Large');
  const [prefTone, setPrefTone] = useState('Polite');
  const [prefVoice, setPrefVoice] = useState('');
  const [voices, setVoices] = useState([]);
  const [isWiped, setIsWiped] = useState(false);

  useEffect(() => {
    // Load voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const vList = window.speechSynthesis.getVoices();
      setVoices(vList);
      const saved = localStorage.getItem('signmitra_preferred_voice');
      if (saved) setPrefVoice(saved);
      else if (vList[0]) setPrefVoice(vList[0].voiceURI);
    }

    const savedMode = localStorage.getItem('signmitra_pref_comm_mode');
    if (savedMode) setPrefCommMode(savedMode);

    const savedSize = localStorage.getItem('signmitra_pref_text_size');
    if (savedSize) setPrefTextSize(savedSize);
  }, []);

  const handleModeChange = (mode) => {
    setPrefCommMode(mode);
    localStorage.setItem('signmitra_pref_comm_mode', mode);
  };

  const handleSizeChange = (size) => {
    setPrefTextSize(size);
    localStorage.setItem('signmitra_pref_text_size', size);
  };

  const handleVoiceChange = (uri) => {
    setPrefVoice(uri);
    localStorage.setItem('signmitra_preferred_voice', uri);
  };

  const testVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('This is a test of your selected voice in SignMitra AI.');
      if (prefVoice) {
        const v = voices.find(x => x.voiceURI === prefVoice);
        if (v) u.voice = v;
      }
      window.speechSynthesis.speak(u);
    }
  };

  const handleWipeData = () => {
    if (confirm('Permanently delete all SignMitra AI sessions, Request History, and Follow-Up Planner data from this device?')) {
      localStorage.removeItem('signmitra_ai_sessions');
      localStorage.removeItem('signmitra_history');
      localStorage.removeItem('signmitra_followups');
      localStorage.removeItem('signmitra_queue_active');
      setIsWiped(true);
      setTimeout(() => setIsWiped(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}>
            FEATURES 20, 29 & 30 · PERSONALIZATION & FALLBACK
          </span>
          <span className="text-xs font-mono opacity-70">
            User-Controlled Privacy
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Settings, Profile & Offline Fallback
        </h2>
        <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
          Customize interaction preferences and review offline accessibility fallbacks for when microphone, camera, or network services are unavailable.
        </p>
      </div>

      {/* Grid: Preferences & Offline Fallbacks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Column: Personalized Communication Profile (Feature 20 & 29) */}
        <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <Settings className="w-4 h-4" />
            <span>Communication Preferences Profile</span>
          </div>

          {/* Preferred Communication Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase opacity-70">
              Primary Interaction Style
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['Visual Cards', 'Plain Text', 'Spoken Audio'].map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                    prefCommMode === m ? accentSolid : `${cardInnerBg} ${borderTone}`
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Text Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase opacity-70">
              Default Card Font Size
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['Normal', 'Large', 'Extra Large'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSizeChange(s)}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                    prefTextSize === s ? accentSolid : `${cardInnerBg} ${borderTone}`
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selector for TTS */}
          {voices.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold uppercase opacity-70">
                  Preferred Speech Voice
                </label>
                <button
                  onClick={testVoice}
                  className="text-[10px] font-mono font-bold uppercase opacity-70 hover:opacity-100 flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" /> Test Voice
                </button>
              </div>
              <select
                value={prefVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className={`w-full p-2.5 rounded-xl font-bold border text-xs outline-none ${cardInnerBg} ${borderTone}`}
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Global Simple Language Toggle */}
          <div className="pt-2 border-t border-dashed flex justify-between items-center" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
            <div>
              <span className="text-xs font-bold block">Simple Language Default</span>
              <span className="text-[11px] opacity-60">Automatically simplify multi-clause texts.</span>
            </div>
            <button
              onClick={toggleSimpleLanguage}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                isSimpleLanguage ? 'bg-green-600 text-white' : `${cardInnerBg} ${borderTone}`
              }`}
            >
              {isSimpleLanguage ? 'Enabled ✓' : 'Disabled'}
            </button>
          </div>

          {/* Privacy & Local Wipe */}
          <div className="pt-3 border-t space-y-2" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
            <span className="text-xs font-mono font-bold uppercase opacity-70 block">
              Device Data & Privacy Guarantee:
            </span>
            <p className="text-[11px] opacity-70 leading-relaxed">
              SignMitra stores all interaction notes and sessions locally on this browser. Audio and camera streams are processed in memory and never stored on remote servers.
            </p>
            <button
              onClick={handleWipeData}
              className="w-full py-2.5 px-3 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isWiped ? 'Data Wiped!' : 'Wipe All Local Storage Data'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Feature 30 — Accessibility Fallback Mode */}
        <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Feature 30 · Fallback Mode Diagnostics</span>
            </div>
            <h3 className="text-base font-black uppercase tracking-tight mt-1">
              Zero-Dependency Fallbacks
            </h3>
            <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
              When AI, microphone, camera, or network services fail, SignMitra preserves full communication capability using static offline modules.
            </p>

            {/* Diagnostic Matrix */}
            <div className="space-y-2 pt-3">
              <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex justify-between items-center text-xs`}>
                <span className="font-bold flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" /> Speech Recognition (STT):
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  systemStatus?.speechSupported ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {systemStatus?.speechSupported ? 'Available' : 'Fallback to Manual Text'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex justify-between items-center text-xs`}>
                <span className="font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" /> Text-to-Speech (TTS):
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  systemStatus?.ttsSupported ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {systemStatus?.ttsSupported ? 'Available' : 'Card Visual Display Only'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex justify-between items-center text-xs`}>
                <span className="font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> WebRTC Camera:
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  systemStatus?.cameraSupported ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {systemStatus?.cameraSupported ? 'Available' : 'Upload Supported'}
                </span>
              </div>
            </div>

            {/* Instant Offline Tool Shortcuts */}
            <div className="space-y-2 pt-4 border-t border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                Offline Core Tools:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <Link
                  href="/phrasebook"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2`}
                >
                  <Library className="w-4 h-4" />
                  <span>Phrasebook</span>
                </Link>

                <Link
                  href="/communication-card"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2`}
                >
                  <IdCard className="w-4 h-4" />
                  <span>ID Card</span>
                </Link>

                <Link
                  href="/emergency-card"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2`}
                >
                  <MessageSquareWarning className="w-4 h-4 text-red-500" />
                  <span>SOS Phrases</span>
                </Link>

                <Link
                  href="/followups"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2`}
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Planner</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono opacity-50 border-t border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
            Fallback mode is active automatically when device hardware or network is unready.
          </div>
        </div>

      </div>

    </div>
  );
}
