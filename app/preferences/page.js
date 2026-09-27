'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Settings,
  ArrowLeft,
  Moon,
  Sun,
  Type,
  Volume2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function CommunicationPreferences() {
  const { 
    bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, 
    isDarkTheme, toggleTheme, isSimpleLanguage, toggleSimpleLanguage 
  } = useTheme();

  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [cleared, setCleared] = useState(false);

  // Load available TTS voices on mount
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Load saved preference or fallback to a good default
        const savedVoice = localStorage.getItem('signmitra_preferred_voice');
        if (savedVoice) {
          setSelectedVoiceURI(savedVoice);
        } else {
          const defaultVoice = availableVoices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB'));
          if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleVoiceChange = (e) => {
    const uri = e.target.value;
    setSelectedVoiceURI(uri);
    localStorage.setItem('signmitra_preferred_voice', uri);
  };

  const handleTestVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(isSimpleLanguage ? "This is how I will sound." : "This is a demonstration of your selected voice profile.");
      if (selectedVoiceURI) {
        const selected = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selected) utterance.voice = selected;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const wipeAllData = () => {
    const confirmWipe = window.confirm(
      "WARNING: This will permanently delete your Request History, Phrasebook, and Follow-Up Planner data from this device. Are you absolutely sure?"
    );
    
    if (confirmWipe) {
      localStorage.removeItem('signmitra_history');
      localStorage.removeItem('signmitra_phrasebook');
      localStorage.removeItem('signmitra_followups');
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5" onClick={() => { if(window.speechSynthesis) window.speechSynthesis.cancel(); }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">PREFERENCES</span>
        </div>
      </div>

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 pb-28">
        
        <header className="mb-8">
          <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
            <Settings className="w-3.5 h-3.5" />
            Global Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Communication Profile</h1>
          <p className={`text-xs sm:text-sm mt-1 max-w-sm leading-relaxed ${textSecondary}`}>
            Set your default accessibility needs. All data is saved strictly to your local device.
          </p>
        </header>

        <div className="space-y-4">
          
          {/* DISPLAY SETTINGS */}
          <section className={`p-6 rounded-xl border ${borderTone} ${cardBg} shadow-sm space-y-5`}>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest opacity-70 border-b pb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              Display & Readability
            </h2>

            {/* Simple Language Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <Type className="w-4 h-4" /> Global Simple Language
                </h3>
                <p className={`text-xs mt-0.5 ${textSecondary}`}>
                  Automatically simplify complex workflow texts.
                </p>
              </div>
              <button
                onClick={toggleSimpleLanguage}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSimpleLanguage ? 'bg-green-500' : 'bg-gray-400/30 dark:bg-gray-600/50'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSimpleLanguage ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              <div>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  {isDarkTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Theme Mode
                </h3>
                <p className={`text-xs mt-0.5 ${textSecondary}`}>
                  Switch between high-contrast dark and light modes.
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkTheme ? 'bg-[#655A7C]' : 'bg-gray-400/30'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkTheme ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </section>

          {/* AUDIO SETTINGS */}
          <section className={`p-6 rounded-xl border ${borderTone} ${cardBg} shadow-sm space-y-4`}>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest opacity-70 border-b pb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              Text-To-Speech
            </h2>
            
            <div className="space-y-2">
              <label className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Preferred Audio Voice
              </label>
              <p className={`text-xs mb-2 ${textSecondary}`}>
                Select the voice profile used when you tap "Read Aloud".
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedVoiceURI}
                  onChange={handleVoiceChange}
                  className={`p-3 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                >
                  {voices.length === 0 && <option value="">Loading browser voices...</option>}
                  {voices.map((v, i) => (
                    <option key={i} value={v.voiceURI} className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleTestVoice}
                  disabled={voices.length === 0}
                  className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${borderTone} ${cardInnerBg} hover:opacity-80 disabled:opacity-50`}
                >
                  Test Audio
                </button>
              </div>
            </div>
          </section>

          {/* PRIVACY & DATA */}
          <section className={`p-6 rounded-xl border border-red-500/20 bg-red-500/5 space-y-4`}>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-black text-red-500 text-sm sm:text-base uppercase tracking-tight">Privacy & Data Management</h3>
                <p className="text-xs sm:text-sm mt-1 font-medium text-red-500/80">
                  Your requests and planner data are never sent to a cloud database. Everything is strictly kept on this device.
                </p>
              </div>
            </div>
            
            <button
              onClick={wipeAllData}
              className="w-full p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-[0.99]"
            >
              {cleared ? <CheckCircle2 className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
              <span>{cleared ? 'All Local Data Wiped' : 'Wipe All History & Planner Data'}</span>
            </button>
          </section>

        </div>
      </main>
    </div>
  );
}