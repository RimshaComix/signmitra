'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Library,
  Plus,
  Trash2,
  Volume2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

const DEFAULT_PHRASES = [
  { id: 'def-1', category: 'General', text: 'I am Deaf/Hard of Hearing. Please communicate with me in writing or visual prompts.' },
  { id: 'def-2', category: 'General', text: 'Could you please explain that more slowly or write it down?' },
  { id: 'def-3', category: 'General', text: 'Please show me the next step or point to where I need to go.' },
  { id: 'def-4', category: 'Emergency', text: 'I need immediate assistance. Please write down what is happening.' }
];

export default function Phrasebook() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();
  
  const [phrases, setPhrases] = useState([]);
  const [newPhraseText, setNewPhraseText] = useState('');
  const [newPhraseCategory, setNewPhraseCategory] = useState('General');
  
  // Communication Mode states
  const [activeLargeText, setActiveLargeText] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('signmitra_phrasebook'));
      if (saved && saved.length > 0) {
        setPhrases(saved);
      } else {
        setPhrases(DEFAULT_PHRASES);
        localStorage.setItem('signmitra_phrasebook', JSON.stringify(DEFAULT_PHRASES));
      }
    } catch (e) {
      setPhrases(DEFAULT_PHRASES);
    }
  }, []);

  const savePhrases = (updatedPhrases) => {
    setPhrases(updatedPhrases);
    localStorage.setItem('signmitra_phrasebook', JSON.stringify(updatedPhrases));
  };

  const handleAddPhrase = (e) => {
    e.preventDefault();
    if (!newPhraseText.trim()) return;
    
    const newPhrase = {
      id: `phrase-${Date.now()}`,
      category: newPhraseCategory,
      text: newPhraseText.trim()
    };
    
    savePhrases([newPhrase, ...phrases]);
    setNewPhraseText('');
  };

  const handleDelete = (id) => {
    savePhrases(phrases.filter(p => p.id !== id));
  };

  const speakText = (id, text) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }
    
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop anything currently playing

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const savedVoiceURI = localStorage.getItem('signmitra_preferred_voice');

    // Check for user's saved preference first
    if (savedVoiceURI) {
      const selected = voices.find(v => v.voiceURI === savedVoiceURI);
      if (selected) utterance.voice = selected;
    } else {
      // Fallback
      const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      {/* Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5" onClick={() => { if(window.speechSynthesis) window.speechSynthesis.cancel(); }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">PERSONAL PHRASEBOOK</span>
        </div>
      </div>

      {/* Large Text Modal Overlay */}
      {activeLargeText && (
        <div className={`fixed inset-0 z-[100] flex flex-col ${bgCanvas} ${textPrimary} p-6 sm:p-12 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-12">
             <span className={`text-xs font-mono font-bold uppercase tracking-widest opacity-80 px-3 py-1 rounded-full border ${borderTone}`}>
                SignMitra High-Visibility Mode
             </span>
             <button 
                onClick={() => setActiveLargeText(null)}
                className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
             >
                <Minimize2 className="w-6 h-6" />
             </button>
          </div>
          <div className="my-auto">
            <p className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight whitespace-pre-line tracking-tight">
              {activeLargeText}
            </p>
          </div>
        </div>
      )}

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <header className={`rounded-xl border ${borderTone} p-6 mb-8 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 ${cardBg}`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
              <Library className="w-3.5 h-3.5" />
              QUICK COMMUNICATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Personal Phrasebook</h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-sm leading-relaxed ${textSecondary}`}>
              Save frequently used phrases for instant display or audio playback during everyday interactions.
            </p>
          </div>
        </header>

        {/* Add New Phrase Form */}
        <form onSubmit={handleAddPhrase} className={`p-5 mb-8 rounded-xl border ${borderTone} shadow-sm space-y-4 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">New Phrase</label>
              <input
                type="text"
                value={newPhraseText}
                onChange={(e) => setNewPhraseText(e.target.value)}
                placeholder="e.g., Please write down the total amount..."
                className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
              />
            </div>
            <div className="sm:w-48 space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">Category</label>
              <select
                value={newPhraseCategory}
                onChange={(e) => setNewPhraseCategory(e.target.value)}
                className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
              >
                <option value="General" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>General</option>
                <option value="Healthcare" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>Healthcare</option>
                <option value="Banking" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>Banking & Retail</option>
                <option value="Education" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>Education</option>
                <option value="Emergency" className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>Emergency</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={!newPhraseText.trim()}
            className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 ${newPhraseText.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-50 cursor-not-allowed border ' + borderTone}`}
          >
            <Plus className="w-4 h-4" />
            <span>Save to Phrasebook</span>
          </button>
        </form>

        {/* Phrase List */}
        {phrases.length === 0 ? (
          <div className={`p-10 rounded-xl border border-dashed ${borderTone} ${cardInnerBg} text-center space-y-3`}>
            <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
            <h3 className="font-bold uppercase tracking-tight">No Phrases Saved</h3>
            <p className={`text-xs font-mono ${textSecondary}`}>Add a custom phrase above to use it quickly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {phrases.map((phrase) => {
              const isSpeaking = speakingId === phrase.id;
              
              return (
                <div key={phrase.id} className={`rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden flex flex-col sm:flex-row transition-all`}>
                  
                  <div className="p-5 flex-1 border-b sm:border-b-0 sm:border-r" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                    <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 mb-2 rounded uppercase tracking-wider ${accentSolid}`}>
                      {phrase.category}
                    </span>
                    <p className="font-black font-sans leading-snug text-base sm:text-lg">
                      {phrase.text}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className={`p-3 flex sm:flex-col items-center justify-center gap-2 ${cardInnerBg} shrink-0 sm:w-20`}>
                    <button 
                      onClick={() => setActiveLargeText(phrase.text)}
                      title="Show Large Text"
                      className={`p-2.5 rounded-lg border ${borderTone} hover:opacity-80 transition-all w-full flex justify-center bg-transparent`}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => speakText(phrase.id, phrase.text)}
                      title="Read Aloud"
                      className={`p-2.5 rounded-lg border transition-all w-full flex justify-center
                        ${isSpeaking ? 'bg-green-500 text-white border-green-600 animate-pulse' : `${borderTone} hover:opacity-80 bg-transparent`}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(phrase.id)}
                      title="Delete Phrase"
                      className={`p-2.5 rounded-lg border ${borderTone} text-red-500 hover:bg-red-500/10 transition-all w-full flex justify-center bg-transparent mt-auto`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}