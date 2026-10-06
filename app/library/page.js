'use client';
import Script from 'next/script';
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
  Building,
  Landmark,
  GraduationCap,
  LibraryBig,
  FileText,
  Users
} from 'lucide-react';

const LIBRARY_CONTENT = [
  {
    category: 'ISL Learning & Practice',
    icon: LibraryBig,
    items: [
      {
        id: 'islrtc-dict',
        title: 'ISLRTC Official Dictionary',
        type: 'External Website',
        formatIcon: BookOpen,
        desc: 'Search 10,000+ words in the official Indian Sign Language dictionary.',
        link: 'https://islrtc.nic.in/isl-dictionary',
        verificationType: 'Official external resource'
      },
      {
        id: 'islrtc-video',
        title: 'ISLRTC Video Gallery',
        type: 'Video Library',
        formatIcon: Video,
        desc: 'ISL learning videos, dictionary-related videos, and other sign-language content.',
        link: 'https://islrtc.nic.in/video-gallery/',
        verificationType: 'Official external resource'
      },
      {
        id: 'ncert-course',
        title: 'Basic ISL Course 2026',
        type: 'Course Information',
        formatIcon: GraduationCap,
        desc: 'Basic ISL course information provided by NCERT/CIET.',
        link: 'https://ciet.ncert.gov.in/activity/isl2026?lang=en',
        verificationType: 'Official external resource'
      },
      {
        id: 'ncert-isl',
        title: 'NCERT ISL Teaching Resources',
        type: 'Educational Materials',
        formatIcon: BookOpen,
        desc: 'Educational learning resources developed in ISL by a constituent unit of NCERT.',
        link: 'https://ciet.ncert.gov.in/sign',
        verificationType: 'Official external resource'
      },
      {
        id: 'diksha-learning',
        title: 'DIKSHA Accessible Learning',
        type: 'External Website',
        formatIcon: Video,
        desc: 'Accessible educational resources for school curriculum.',
        link: 'https://diksha.gov.in/cwsn.html',
        verificationType: 'Official external resource'
      }
    ]
  },
  {
    category: 'Schemes, Identity & Scholarships',
    icon: Landmark,
    items: [
      {
        id: 'udid-portal',
        title: 'UDID Application Portal',
        type: 'Government Portal',
        formatIcon: ExternalLink,
        desc: 'Apply for your disability certificate and Unique Disability ID.',
        link: 'https://www.swavlambancard.gov.in/',
        verificationType: 'Official external resource'
      },
      {
        id: 'divyang-corner',
        title: 'DEPwD Divyang Corner',
        type: 'Government Portal',
        formatIcon: Building,
        desc: 'Starting point for government disability schemes and related services.',
        link: 'https://depwd.gov.in/en/divyang-corner/',
        verificationType: 'Official external resource'
      },
      {
        id: 'adip-scheme',
        title: 'ADIP Scheme Information',
        type: 'Scheme Information',
        formatIcon: FileText,
        desc: 'Information for eligible assistive-device support. Check current rules.',
        link: 'https://depwd.gov.in/en/adip-scheme/',
        verificationType: 'Official external resource'
      },
      {
        id: 'arjun-portal',
        title: 'ARJUN — ADIP/RVY Portal',
        type: 'Application Portal',
        formatIcon: ExternalLink,
        desc: 'Online portal for scheme registration and assistive-device support processes.',
        link: 'https://adip.depwd.gov.in/',
        verificationType: 'Official external resource'
      },
      {
        id: 'nsp-portal',
        title: 'National Scholarship Portal',
        type: 'Application Portal',
        formatIcon: GraduationCap,
        desc: 'Government scholarship application portal. Check dates and eligibility.',
        link: 'https://scholarships.gov.in/',
        verificationType: 'Official external resource'
      },
      {
        id: 'depwd-scholarships',
        title: 'DEPwD Scholarship Info',
        type: 'Scheme Information',
        formatIcon: FileText,
        desc: 'Official scholarship notices and scheme guidelines for students with disabilities.',
        link: 'https://depwd.gov.in/en/scholarship/',
        verificationType: 'Official external resource'
      },
      {
        id: 'ndfdc',
        title: 'National Divyangjan Finance Corp',
        type: 'Scheme Information',
        formatIcon: Landmark,
        desc: 'Information about financial assistance and income-generation loan schemes.',
        link: 'https://depwd.gov.in/en/national-handicapped-finance-and-development-corporation/',
        verificationType: 'Official external resource'
      }
    ]
  },
  {
    category: 'Finding People & Services',
    icon: Users,
    items: [
      {
        id: 'isl-interpreters',
        title: 'ISL Interpreters Directory',
        type: 'Directory',
        formatIcon: Users,
        desc: 'ISLRTC’s directory of interpreters. Confirm contact details and availability directly.',
        link: 'https://islrtc.nic.in/directory-of-isl-interpreters/',
        verificationType: 'Official external resource'
      },
      {
        id: 'deaf-schools',
        title: 'Directory of Deaf Schools',
        type: 'Directory',
        formatIcon: Building,
        desc: 'ISLRTC-published school directory. Confirm details before visiting.',
        link: 'https://islrtc.nic.in/directory-of-deaf-schools/',
        verificationType: 'Official external resource'
      },
      {
        id: 'ccpd-office',
        title: 'Chief Commissioner (CCPD)',
        type: 'Government Portal',
        formatIcon: Shield,
        desc: 'Official information about the disability-rights commissioner’s office.',
        link: 'https://depwd.gov.in/en/chief-commissioner-for-persons-with-disabilities/',
        verificationType: 'Official external resource'
      }
    ]
  },
  {
    category: 'Rights, Acts & Rules',
    icon: Shield,
    items: [
      {
        id: 'rpwd-act-official',
        title: 'RPwD Act, 2016 — India Code',
        type: 'Document',
        formatIcon: BookOpen,
        desc: 'Official legislation text for the Rights of Persons with Disabilities Act.',
        link: 'https://www.indiacode.nic.in/handle/123456789/2155?locale=en',
        verificationType: 'Official external resource'
      },
      {
        id: 'depwd-rules',
        title: 'DEPwD Acts & Rules',
        type: 'Document',
        formatIcon: FileText,
        desc: 'Government disability-related Acts, rules, and gazette notifications.',
        link: 'https://depwd.gov.in/en/acts/',
        verificationType: 'Official external resource'
      }
    ]
  }
];

export default function InformationLibrary() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filterOptions = ['All', 'ISL Learning', 'Schemes & Scholarships', 'Services', 'Rights'];

  const getFilteredContent = () => {
    return LIBRARY_CONTENT.filter(section => {
      if (activeFilter !== 'All') {
        if (activeFilter === 'ISL Learning' && !section.category.includes('Learning')) return false;
        if (activeFilter === 'Schemes & Scholarships' && !section.category.includes('Schemes')) return false;
        if (activeFilter === 'Services' && !section.category.includes('People')) return false;
        if (activeFilter === 'Rights' && !section.category.includes('Rights')) return false;
      }
      return true;
    }).map(section => {
      const filteredItems = section.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
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
          <span className="opacity-90 font-bold uppercase tracking-wide">RESOURCE CENTER</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}>
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col pb-24">
        
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Knowledge & Rights
          </h1>
          <p className={`text-sm sm:text-base mt-2 font-medium leading-relaxed max-w-2xl ${textSecondary}`}>
            Practical external resources to help you learn, prepare, and know your rights.
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search for dictionaries, schemes, directories, or acts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-4 font-bold border rounded-xl text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#655A7C] ${cardBg} ${borderTone}`}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-4 no-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {filterOptions.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeFilter === filter ? accentSolid : `${cardBg}${borderTone} hover:border-[#655A7C]`
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Library Content Categories */}
        <div className="space-y-10 animate-in fade-in duration-300">
          {getFilteredContent().map((section, idx) => {
            const SectionIcon = section.icon;

            return (
              <section key={idx} className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  <SectionIcon className="w-4 h-4 opacity-70" />
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider opacity-70">
                    {section.category}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.items.map((item) => {
                    const FormatIcon = item.formatIcon;

                    return (
                      <Link
                        key={item.id}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${cardBg} ${borderTone} hover:border-[#655A7C] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#655A7C]`}
                      >
                        <div className="flex gap-4 items-start">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${accentSolid}`}>
                            <FormatIcon className="w-6 h-6" />
                          </div>
                          <div className="w-full">
                            <h3 className="text-base font-black leading-tight tracking-tight mb-1">{item.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest opacity-80">
                              <span>{item.type}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className={`text-xs font-medium leading-relaxed ${textSecondary}`}>
                          {item.desc}
                        </p>

                        <div className="pt-3 mt-auto border-t flex flex-col gap-1.5" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                           <div className="flex items-center text-[9px] font-mono font-bold uppercase tracking-wider">
                             <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                               <Building className="w-3 h-3" /> {item.verificationType}
                             </span>
                           </div>

                           <div className="flex items-center text-[9px] font-mono font-bold uppercase tracking-wider opacity-60">
                             <ExternalLink className="w-3 h-3 mr-1.5" /> Open Official Resource ↗
                           </div>
                        </div>
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