'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
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
  CheckCircle2
} from 'lucide-react';

// Pre-configured Transit Communication Cards
const TRANSIT_CARDS = [
  { id: 'platform', label: 'Find Platform/Gate', text: 'I am looking for Platform / Gate number _______. Can you point me in the right direction?' },
  { id: 'destination', label: 'Check Destination', text: 'Does this bus/train go to _______? Please nod Yes or No.' },
  { id: 'ticket', label: 'Buy Ticket', text: 'I would like to buy a ticket to _______. How much is it? Please type or write the amount.' },
  { id: 'delay', label: 'Check Delay', text: 'Is there a delay for the transport to _______? Please show me the expected time.' },
  { id: 'stop', label: 'Next Stop', text: 'Is the next stop _______? Please notify me when we arrive.' }
];

// Simulated Local Transit Guides (Example: Chennai)
const TRANSIT_GUIDES = [
  {
    id: 'metro_chennai',
    type: 'Metro',
    icon: Train,
    title: 'Chennai Metro Rail (CMRL)',
    status: 'Operating Normally',
    tips: [
      'Visual displays are available inside all trains showing the next station.',
      'Platform numbers are clearly marked with large visual signage overhead.',
      'If displays are off, use the "Next Stop" communication card with a fellow passenger.'
    ]
  },
  {
    id: 'bus_mtc',
    type: 'Bus',
    icon: Bus,
    title: 'MTC City Buses (Chennai)',
    status: 'Expect Delays',
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
  const [isShowingCard, setIsShowingCard] = useState(false);

  const handleShowCard = (card) => {
    setSelectedCard(card);
    setIsShowingCard(true);
  };

  const getFinalCardText = (text) => {
    if (customDestination) {
      return text.replace('_______', customDestination.toUpperCase());
    }
    return text;
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
            Navigate public transit with pre-built communication cards and local visual accessibility guides.
          </p>
        </header>

        {/* Tabs */}
        <div className={`flex p-1 mb-8 rounded-xl border ${borderTone} ${cardInnerBg}`}>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'cards' ? `${accentSolid} shadow-sm` : 'hover:opacity-75'}`}
          >
            Transit Cards
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'guides' ? `${accentSolid} shadow-sm` : 'hover:opacity-75'}`}
          >
            Local Guides
          </button>
        </div>

        {/* TAB 1: Transit Communication Cards */}
        {activeTab === 'cards' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className={`p-5 rounded-2xl border ${borderTone} ${cardBg} shadow-sm`}>
               <label className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70 mb-2">
                 Destination / Target (Optional)
               </label>
               <input
                  type="text"
                  value={customDestination}
                  onChange={(e) => setCustomDestination(e.target.value)}
                  placeholder="e.g., Central Station, Platform 3, Airport"
                  className={`w-full p-4 font-bold border rounded-xl text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
                <p className="text-[10px] font-mono opacity-60 mt-2">Entering a destination will automatically fill in the blanks in the cards below.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRANSIT_CARDS.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleShowCard(card)}
                  className={`p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 ${cardBg} ${borderTone} hover:border-[#655A7C] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#655A7C]`}
                >
                  <h3 className="text-lg font-black uppercase tracking-tight">{card.label}</h3>
                  <p className={`text-sm font-medium ${textSecondary} line-clamp-2`}>
                    "{getFinalCardText(card.text)}"
                  </p>
                  <div className="mt-auto pt-3 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Show Card
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Local Accessibility Guides */}
        {activeTab === 'guides' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-start gap-3 text-xs font-mono font-bold`}>
               <Info className="w-4 h-4 shrink-0 mt-0.5" />
               <p>Currently showing transit guides for: <strong>Chennai, TN</strong>. Check back later for more cities.</p>
            </div>

            {TRANSIT_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <div key={guide.id} className={`p-5 sm:p-6 rounded-2xl border ${borderTone} ${cardBg} shadow-sm space-y-4`}>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${cardInnerBg} border ${borderTone}`}>
                         <Icon className="w-6 h-6 opacity-80" />
                       </div>
                       <div>
                         <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">{guide.title}</h3>
                         <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5 ${guide.status.includes('Normal') ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                           {guide.status.includes('Normal') ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {guide.status}
                         </span>
                       </div>
                    </div>
                  </div>
                  
                  <div className={`pt-4 border-t ${borderTone}`}>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider mb-3 opacity-70">Visual Accessibility Tips</h4>
                    <ul className="space-y-3">
                      {guide.tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-3 text-sm font-medium">
                          <Navigation className="w-4 h-4 shrink-0 opacity-50 mt-0.5" />
                          <span className={textSecondary}>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* FULLSCREEN CARD DISPLAY OVERLAY */}
      {isShowingCard && selectedCard && (
        <div className={`fixed inset-0 z-[100] flex flex-col justify-between p-6 sm:p-12 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded border ${borderTone} ${cardInnerBg}`}>
              TRANSIT COMMUNICATION
            </span>
            <button
              onClick={() => setIsShowingCard(false)}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${accentSolid} hover:opacity-90`}
            >
              Close
            </button>
          </div>

          <div className="text-center my-auto">
            <p className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight">
              {getFinalCardText(selectedCard.text)}
            </p>
          </div>

          <div className="text-center text-[10px] font-mono opacity-50 uppercase tracking-widest">
            Show this screen directly to staff or fellow passengers
          </div>
        </div>
      )}
    </div>
  );
}