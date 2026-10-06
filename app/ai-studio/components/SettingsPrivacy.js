'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Settings,
  Volume2,
  Mic,
  Camera,
  Trash2,
  AlertTriangle,
  Library,
  IdCard,
  MessageSquareWarning,
  CalendarClock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPrivacy({ systemStatus }) {
  const {
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme,
    isSimpleLanguage,
    toggleSimpleLanguage
  } = useTheme();

  const [prefCommMode, setPrefCommMode] = useState('Visual Cards');
  const [prefTextSize, setPrefTextSize] = useState('Large');
  const [prefVoice, setPrefVoice] = useState('');
  const [voices, setVoices] = useState([]);

  const [isWiped, setIsWiped] = useState(false);
  const [wipeError, setWipeError] = useState('');

  /*
   * Load saved preferences and browser voices.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedMode = localStorage.getItem('signmitra_pref_comm_mode');
      const savedSize = localStorage.getItem('signmitra_pref_text_size');
      const savedVoice = localStorage.getItem('signmitra_preferred_voice');

      if (savedMode) setPrefCommMode(savedMode);
      if (savedSize) setPrefTextSize(savedSize);
      if (savedVoice) setPrefVoice(savedVoice);
    } catch (error) {
      console.error('Failed to load SignMitra preferences:', error);
    }

    if (!('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      setVoices(availableVoices);

      if (!availableVoices.length) return;

      setPrefVoice((currentVoice) => {
        if (
          currentVoice &&
          availableVoices.some(
            (voice) => voice.voiceURI === currentVoice
          )
        ) {
          return currentVoice;
        }

        return availableVoices[0].voiceURI;
      });
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        loadVoices
      );
    };
  }, []);

  /*
   * Persist communication mode.
   */
  const handleModeChange = (mode) => {
    setPrefCommMode(mode);

    try {
      localStorage.setItem('signmitra_pref_comm_mode', mode);
    } catch (error) {
      console.error('Failed to save communication preference:', error);
    }
  };

  /*
   * Persist text-size preference.
   */
  const handleSizeChange = (size) => {
    setPrefTextSize(size);

    try {
      localStorage.setItem('signmitra_pref_text_size', size);
    } catch (error) {
      console.error('Failed to save text-size preference:', error);
    }
  };

  /*
   * Persist preferred speech voice.
   */
  const handleVoiceChange = (uri) => {
    setPrefVoice(uri);

    try {
      localStorage.setItem('signmitra_preferred_voice', uri);
    } catch (error) {
      console.error('Failed to save preferred voice:', error);
    }
  };

  /*
   * Test the selected browser TTS voice.
   */
  const testVoice = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !('SpeechSynthesisUtterance' in window)
    ) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        'This is a test of your selected voice in SignMitra AI.'
      );

      const selectedVoice = voices.find(
        (voice) => voice.voiceURI === prefVoice
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Voice test failed:', error);
    }
  };

  /*
   * Remove SignMitra data that this settings page manages.
   */
  const handleWipeData = () => {
    setWipeError('');
    setIsWiped(false);

    const confirmed = window.confirm(
      'Permanently delete all SignMitra AI sessions, Request History, Follow-Up Planner data, and active Queue data from this device?'
    );

    if (!confirmed) return;

    try {
      const keysToRemove = [
        'signmitra_ai_sessions',
        'signmitra_history',
        'signmitra_followups',
        'signmitra_queue_active'
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      setIsWiped(true);

      window.setTimeout(() => {
        setIsWiped(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to wipe local SignMitra data:', error);
      setWipeError(
        'Some local data could not be removed. Please try again.'
      );
    }
  };

  const speechAvailable = Boolean(systemStatus?.speechSupported);
  const ttsAvailable = Boolean(systemStatus?.ttsSupported);
  const cameraAvailable = Boolean(systemStatus?.cameraSupported);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* HEADER */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}
          >
            FEATURES 20, 29 & 30 · PERSONALIZATION & FALLBACK
          </span>

          <span className="text-xs font-mono opacity-70 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            User-Controlled Privacy
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Settings, Profile & Offline Fallback
        </h2>

        <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
          Customize interaction preferences and review device fallbacks
          for when microphone, camera, speech, or network services are
          unavailable.
        </p>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* COMMUNICATION PREFERENCES */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <Settings className="w-4 h-4" />
            <span>Communication Preferences Profile</span>
          </div>

          {/* COMMUNICATION MODE */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase opacity-70">
              Primary Interaction Style
            </label>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['Visual Cards', 'Plain Text', 'Spoken Audio'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                    prefCommMode === mode
                      ? accentSolid
                      : `${cardInnerBg} ${borderTone}`
                  }`}
                  aria-pressed={prefCommMode === mode}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* TEXT SIZE */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase opacity-70">
              Default Card Font Size
            </label>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['Normal', 'Large', 'Extra Large'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeChange(size)}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                    prefTextSize === size
                      ? accentSolid
                      : `${cardInnerBg} ${borderTone}`
                  }`}
                  aria-pressed={prefTextSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* VOICE */}
          {voices.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center gap-3">
                <label
                  htmlFor="preferred-voice"
                  className="text-xs font-mono font-bold uppercase opacity-70"
                >
                  Preferred Speech Voice
                </label>

                <button
                  type="button"
                  onClick={testVoice}
                  className="text-[10px] font-mono font-bold uppercase opacity-70 hover:opacity-100 flex items-center gap-1 shrink-0"
                >
                  <Volume2 className="w-3 h-3" />
                  Test Voice
                </button>
              </div>

              <select
                id="preferred-voice"
                value={prefVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className={`w-full p-2.5 rounded-xl font-bold border text-xs outline-none ${cardInnerBg} ${borderTone}`}
              >
                {voices.map((voice) => (
                  <option
                    key={voice.voiceURI}
                    value={voice.voiceURI}
                  >
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SIMPLE LANGUAGE */}
          <div
            className="pt-2 border-t border-dashed flex justify-between items-center gap-4"
            style={{
              borderColor: isDarkTheme
                ? '#AB92BF30'
                : '#655A7C20'
            }}
          >
            <div>
              <span className="text-xs font-bold block">
                Simple Language Default
              </span>

              <span className="text-[11px] opacity-60">
                Automatically simplify multi-clause texts.
              </span>
            </div>

            <button
              type="button"
              onClick={toggleSimpleLanguage}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all shrink-0 ${
                isSimpleLanguage
                  ? 'bg-green-600 text-white'
                  : `${cardInnerBg} ${borderTone}`
              }`}
              aria-pressed={isSimpleLanguage}
            >
              {isSimpleLanguage ? 'Enabled ✓' : 'Disabled'}
            </button>
          </div>

          {/* PRIVACY / WIPE */}
          <div
            className="pt-3 border-t space-y-2"
            style={{
              borderColor: isDarkTheme
                ? '#AB92BF30'
                : '#655A7C20'
            }}
          >
            <span className="text-xs font-mono font-bold uppercase opacity-70 block">
              Device Data & Privacy
            </span>

            <p className="text-[11px] opacity-70 leading-relaxed">
              SignMitra stores session, history, planner, and queue data
              managed by this module in this browser&apos;s local storage.
              Device microphone and camera streams are handled through the
              browser and are not intentionally stored by this component.
              AI-enabled features may use configured remote services when
              enabled.
            </p>

            <button
              type="button"
              onClick={handleWipeData}
              className="w-full py-2.5 px-3 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
            >
              {isWiped ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}

              <span>
                {isWiped
                  ? 'Local Data Wiped'
                  : 'Wipe SignMitra Local Data'}
              </span>
            </button>

            {wipeError && (
              <p className="text-[10px] text-red-500 font-mono font-bold">
                {wipeError}
              </p>
            )}

            {isWiped && (
              <p className="text-[10px] text-green-600 dark:text-green-400 font-mono font-bold">
                Session, history, planner, and active queue records managed
                here were removed from this browser.
              </p>
            )}
          </div>
        </div>

        {/* FALLBACK DIAGNOSTICS */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}
        >
          <div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Feature 30 · Fallback Mode Diagnostics</span>
            </div>

            <h3 className="text-base font-black uppercase tracking-tight mt-1">
              Offline Communication Fallbacks
            </h3>

            <p className={`text-xs mt-1 font-medium ${textSecondary}`}>
              When a browser capability or configured service is unavailable,
              SignMitra keeps manual and visual communication paths available.
            </p>

            {/* DIAGNOSTIC MATRIX */}
            <div className="space-y-2 pt-3">

              {/* STT */}
              <div
                className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs`}
              >
                <span className="font-bold flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  Speech Recognition (STT):
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    speechAvailable
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {speechAvailable
                    ? 'Available'
                    : 'Fallback to Manual Text'}
                </span>
              </div>

              {/* TTS */}
              <div
                className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs`}
              >
                <span className="font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Text-to-Speech (TTS):
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    ttsAvailable
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {ttsAvailable
                    ? 'Available'
                    : 'Card Visual Display Only'}
                </span>
              </div>

              {/* CAMERA */}
              <div
                className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs`}
              >
                <span className="font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  WebRTC Camera:
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    cameraAvailable
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {cameraAvailable
                    ? 'Available'
                    : 'Upload Supported'}
                </span>
              </div>

              {/* NETWORK / AI */}
              <div
                className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs`}
              >
                <span className="font-bold">
                  AI / Network Services:
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    systemStatus?.aiAvailable
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {systemStatus?.aiAvailable
                    ? 'Configured'
                    : 'Fallback / Manual Paths'}
                </span>
              </div>
            </div>

            {/* OFFLINE TOOLS */}
            <div
              className="space-y-2 pt-4 border-t border-dashed"
              style={{
                borderColor: isDarkTheme
                  ? '#AB92BF30'
                  : '#655A7C20'
              }}
            >
              <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                Offline Core Tools
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">

                <Link
                  href="/phrasebook"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2 transition-all`}
                >
                  <Library className="w-4 h-4" />
                  <span>Phrasebook</span>
                </Link>

                <Link
                  href="/communication-card"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2 transition-all`}
                >
                  <IdCard className="w-4 h-4" />
                  <span>ID Card</span>
                </Link>

                <Link
                  href="/emergency-card"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2 transition-all`}
                >
                  <MessageSquareWarning className="w-4 h-4 text-red-500" />
                  <span>SOS Phrases</span>
                </Link>

                <Link
                  href="/followups"
                  className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} hover:border-[#655A7C] flex items-center gap-2 transition-all`}
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Planner</span>
                </Link>

              </div>
            </div>
          </div>

          {/* FALLBACK NOTE */}
          <div
            className="pt-2 text-[10px] font-mono opacity-50 border-t border-dashed"
            style={{
              borderColor: isDarkTheme
                ? '#AB92BF30'
                : '#655A7C20'
            }}
          >
            Fallback paths are available automatically when supported
            browser capabilities or configured services are unavailable.
          </div>
        </div>
      </div>
    </div>
  );
}