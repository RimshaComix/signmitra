'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Train,
  Bus,
  MapPin,
  Clock,
  MessageSquare,
  AlertTriangle,
  Info,
  ChevronDown,
  Navigation,
  CheckCircle2,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Check,
  HelpCircle,
  RefreshCcw,
  Copy
} from 'lucide-react';

// Pre-configured Transit Communication Cards (Upgraded Phrasing)
const TRANSIT_CARDS = [
  { id: 'platform', label: 'Find Platform/Gate', text: 'I am looking for Platform / Gate number _______. Can you point me in the right direction?' },
  { id: 'destination', label: 'Check Destination', text: 'Does this bus/train go to _______? Please answer Yes/No in writing or by pointing.' },
  { id: 'ticket', label: 'Buy Ticket', text: 'I would like to buy a ticket to _______. How much is it? Please type or write the amount.' },
  { id: 'delay', label: 'Check Delay', text: 'Is there a delay for the transport to _______? Please write or show me the expected time.' },
  { id: 'stop', label: 'Next Stop', text: 'Is the next stop _______? Please show me when we reach this stop.' }
];

// Simulated Local Transit Guides with Verification Meta
const TRANSIT_GUIDES = [
  {
    id: 'metro_chennai',
    type: 'Metro',
    icon: Train,
    title: 'Chennai Metro Rail (CMRL)',
    status: 'Verified Accessibility Profile',
    lastVerified: '2026-09-10',
    verifiedBy: 'SignMitra Community',
    tips: [
      'Visual displays are available inside all trains showing the next station.',
      'Platform numbers are clearly marked with large visual signage overhead.',
      'If displays are off, show the "Next Stop" card to station staff or security.'
    ]
  },
  {
    id: 'bus_mtc',
    type: 'Bus',
    icon: Bus,
    title: 'MTC City Buses (Chennai)',
    status: 'Verified Accessibility Profile',
    lastVerified: '2026-08-15',
    verifiedBy: 'Local Commuter Feedback',
    tips: [
      'Most older buses do NOT have visual stop displays inside.',
      'Show the "Next Stop" card to the conductor when buying your ticket so they can alert you.',
      'Route numbers are displayed on the front LED board.'
    ]
  }
];

export default function TransportJourney() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('cards'); // 'cards' or 'guides'
  const [selectedCard, setSelectedCard] = useState(null);
  const [customDestination, setCustomDestination] = useState('');
  
  // Display States for the 3-Step Flow
  const [displayState, setDisplayState] = useState('none'); // 'none' -> 'fullscreen' -> 'response_menu'

  const handleShowCard = (card) => {
    setSelectedCard(card);
    setDisplayState('fullscreen');
  };

  const getFinalCardText = (text) => {
    if (customDestination.trim()) {
      return text.replace('_______', `[${customDestination.trim().toUpperCase()}]`);
    }
    return text.replace('_______', '_______'); // Leave blank if empty
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Message copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text', err);
    }
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
          <span className="opacity-90 font-bold uppercase tracking-wide">TRANSPORT & TRANSIT</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}>
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col">
        
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Transport Journey Support
          </h1>
          <p className={`text-sm sm:text-base mt-2 font-medium leading-relaxed max-w-2xl ${textSecondary}`}>
            Start with a travel need. Navigate public transit using guided communication cards and verified local accessibility guides.
          </p>
        </header>

        {/* Tabs */}
        <div className={`flex p-1 mb-8 rounded-xl border-2 ${borderTone} ${cardInnerBg}`}>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'cards' ? `${accentSolid} shadow-sm` : 'hover:opacity-75'}`}
          >
            1. Travel Needs & Cards
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'guides' ? `${accentSolid} shadow-sm` : 'hover:opacity-75'}`}
          >
            2. Local City Guides
          </button>
        </div>

        {/* TAB 1: Transit Communication Cards */}
        {activeTab === 'cards' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm`}>
               <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70 mb-2">
                 Destination / Route Target (Optional)
               </label>
               <input
                  type="text"
                  value={customDestination}
                  onChange={(e) => setCustomDestination(e.target.value)}
                  placeholder="e.g., Central Station, Platform 3, Airport..."
                  className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
                <p className="text-[10px] font-mono font-bold opacity-60 mt-3 text-[#655A7C] dark:text-[#AB92BF]">
                  * Cards below will instantly update with this destination.
                </p>
            </div>

            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest opacity-70 mb-4 ml-1">Choose what you need:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRANSIT_CARDS.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleShowCard(card)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col gap-4 ${cardBg} ${borderTone} hover:border-[#655A7C] hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#655A7C] group`}
                  >
                    <h3 className="text-lg font-black uppercase tracking-tight">{card.label}</h3>
                    <p className={`text-sm font-medium ${textSecondary} line-clamp-3`}>
                      "{getFinalCardText(card.text)}"
                    </p>
                    <div className={`mt-auto pt-4 border-t ${borderTone} flex items-center text-xs font-bold uppercase tracking-wider transition-colors group-hover:text-[#655A7C] dark:group-hover:text-[#AB92BF]`}>
                      <Maximize2 className="w-4 h-4 mr-2" /> Show Fullscreen Card
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Local Accessibility Guides */}
        {activeTab === 'guides' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-start gap-3 text-xs font-mono font-bold`}>
               <Info className="w-4 h-4 shrink-0 mt-0.5" />
               <p>Currently showing general accessibility profiles for: <strong>Chennai, TN</strong>. This information does not reflect live delays or route closures.</p>
            </div>

            {TRANSIT_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <div key={guide.id} className={`p-6 sm:p-8 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-5`}>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${cardInnerBg} border ${borderTone}`}>
                         <Icon className="w-6 h-6 opacity-80" />
                       </div>
                       <div>
                         <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">{guide.title}</h3>
                         <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 text-[#655A7C] dark:text-[#AB92BF]`}>
                           <ShieldCheck className="w-3.5 h-3.5" /> {guide.status}
                         </span>
                       </div>
                    </div>
                  </div>
                  
                  <div className={`pt-4 border-t ${borderTone}`}>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider mb-4 opacity-70">Visual Accessibility Tips</h4>
                    <ul className="space-y-4">
                      {guide.tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-3 text-sm font-bold">
                          <Navigation className="w-4 h-4 shrink-0 opacity-40 mt-0.5" />
                          <span className={textSecondary}>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`pt-4 mt-2 border-t flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[10px] font-mono font-bold opacity-60`} style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                    <span>Verified: {guide.lastVerified}</span>
                    <span>Source: {guide.verifiedBy}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* FULLSCREEN CARD DISPLAY OVERLAY (Step 2) */}
      {displayState === 'fullscreen' && selectedCard && (
        <div className={`fixed inset-0 z-[100] flex flex-col justify-between p-6 sm:p-12 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-lg border-2 ${borderTone} ${cardInnerBg}`}>
              {selectedCard.label}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(getFinalCardText(selectedCard.text))}
                className={`p-3 rounded-xl border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all focus-visible:ring-4 focus-visible:ring-[#655A7C]`}
                title="Copy Text"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDisplayState('response_menu')}
                className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${cardBg} font-black text-sm uppercase tracking-wider hover:opacity-80 transition-all focus-visible:ring-4 focus-visible:ring-[#655A7C] flex items-center gap-2`}
              >
                Done Showing <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-center my-auto space-y-6">
            <div className={`py-12 sm:py-20 px-6 rounded-3xl border-8 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#655A7C]/5'} shadow-2xl mx-auto max-w-4xl`}>
               <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight whitespace-pre-line">
                 {getFinalCardText(selectedCard.text)}
               </p>
            </div>
          </div>

          <div className="text-center text-xs font-mono font-bold uppercase tracking-widest opacity-50">
            Show this screen directly to transit staff or passengers. Tap "Done Showing" when finished.
          </div>
        </div>
      )}

      {/* RESPONSE & NEXT ACTIONS OVERLAY (Step 3) */}
      {displayState === 'response_menu' && selectedCard && (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200`}>
          <div className={`w-full max-w-lg p-8 sm:p-10 rounded-3xl border-2 ${borderTone} ${bgCanvas} shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col space-y-8`}>
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">What happened?</h2>
              <p className={`text-sm font-medium ${textSecondary}`}>Select an outcome to continue your journey.</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => setDisplayState('none')} 
                className={`w-full p-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-between transition-all ${accentSolid} hover:opacity-90 focus-visible:ring-4 focus-visible:ring-[#655A7C] shadow-sm`}
              >
                <span>I got the information</span>
                <Check className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setDisplayState('fullscreen')} 
                className={`w-full p-5 rounded-2xl border-2 ${borderTone} ${cardBg} font-black text-sm uppercase tracking-widest flex items-center justify-between hover:border-[#655A7C] transition-all focus-visible:ring-4 focus-visible:ring-[#655A7C]`}
              >
                <span>I need clarification</span>
                <RefreshCcw className="w-5 h-5 opacity-70" />
              </button>
              
              <button 
                onClick={() => {
                  setDisplayState('none');
                  setActiveTab('guides');
                }} 
                className={`w-full p-5 rounded-2xl border-2 ${borderTone} ${cardBg} font-black text-sm uppercase tracking-widest flex items-center justify-between hover:border-[#655A7C] transition-all focus-visible:ring-4 focus-visible:ring-[#655A7C]`}
              >
                <span>Check Local Guides</span>
                <HelpCircle className="w-5 h-5 opacity-70" />
              </button>
            </div>
            
            <div className="text-center pt-2">
              <button 
                onClick={() => setDisplayState('none')}
                className="text-xs font-mono font-bold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}