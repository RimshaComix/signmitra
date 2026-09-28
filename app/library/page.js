'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Sun,
  Moon,
  BookOpen,
  Video,
  ExternalLink,
  Shield,
  Search,
  CheckCircle2,
  FileText,
  PlayCircle
} from 'lucide-react';

// Curated Accessibility & ISL Resources
const LIBRARY_CONTENT = [
  {
    category: 'Official Dictionaries & Learning',
    items: [
      {
        id: 'islrtc-dict',
        title: 'ISLRTC Official Dictionary',
        type: 'External Link',
        icon: BookOpen,
        desc: 'Search 10,000+ words in the official Indian Sign Language dictionary.',
        link: 'https://islrtc.nic.in/isl-dictionary',
        verified: true
      },
      {
        id: 'ncert-isl',
        title: 'NCERT ISL Educational Videos',
        type: 'External Link',
        icon: Video,
        desc: 'Educational materials translated into ISL for school curriculum.',
        link: 'https://diksha.gov.in/ncert/',
        verified: true
      }
    ]
  },
  {
    category: 'SignMitra Visual Service Guides',
    items: [
      {
        id: 'guide-hospital',
        title: 'Hospital OPD Check-in Process',
        type: 'Video Guide',
        icon: PlayCircle,
        desc: 'Step-by-step ISL explanation of how to register at a government hospital.',
        link: '/steps?guide=hospital_visit',
        verified: true
      },
      {
        id: 'guide-bank',
        title: 'Bank KYC Update Process',
        type: 'Video Guide',
        icon: PlayCircle,
        desc: 'Visual breakdown of the documents needed to update your bank account.',
        link: '/steps?guide=bank_visit',
        verified: true
      }
    ]
  },
  {
    category: 'Legal Rights & Advocacy',
    items: [
      {
        id: 'rpwd-act',
        title: 'RPWD Act 2016 (Plain Language)',
        type: 'Document',
        icon: Shield,
        desc: 'Rights of Persons with Disabilities Act simplified for easy reading.',
        link: '#',
        verified: true
      },
      {
        id: 'interpreter-booking',
        title: 'Book an Official Interpreter (NADI)',
        type: 'External Link',
        icon: ExternalLink,
        desc: 'Contact the National Association of the Deaf to book verified interpreters.',
        link: 'https://nadindia.org/',
        verified: true
      }
    ]
  }
];

export default function InformationLibrary() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');

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
          <span className="opacity-90 font-bold uppercase tracking-wide">INFORMATION LIBRARY</span>
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
            Accessible Library
          </h1>
          <p className={`text-sm sm:text-base mt-2 font-medium leading-relaxed max-w-2xl ${textSecondary}`}>
            A curated collection of verified ISL dictionaries, government resources, and visual guides.
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search for guides, dictionaries, or laws..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-4 font-bold border rounded-xl text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#655A7C] ${cardBg} ${borderTone}`}
          />
        </div>

        {/* Library Content Categories */}
        <div className="space-y-10 animate-in fade-in duration-300">
          {LIBRARY_CONTENT.map((section, idx) => {
            const filteredItems = section.items.filter(item => 
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              item.desc.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <section key={idx} className="space-y-4">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider opacity-70 border-b pb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  {section.category}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isExternal = item.link.startsWith('http');

                    return (
                      <Link
                        key={item.id}
                        href={item.link}
                        target={isExternal ? "_blank" : "_self"}
                        rel={isExternal ? "noopener noreferrer" : ""}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${cardBg} ${borderTone} hover:border-[#655A7C] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#655A7C]`}
                      >
                        <div className="flex gap-4 items-start">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${accentSolid}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-black leading-tight tracking-tight mb-1">{item.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                              <span>{item.type}</span>
                              {item.verified && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className={`text-xs font-medium leading-relaxed ${textSecondary}`}>
                          {item.desc}
                        </p>

                        {isExternal && (
                          <div className="pt-3 mt-auto border-t flex items-center justify-end text-[10px] font-mono font-bold uppercase tracking-wider opacity-60" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                            Opens external website <ExternalLink className="w-3 h-3 ml-1" />
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

      </main>
    </div>
  );
}