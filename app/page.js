'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Loader,
  GitMerge,
  Repeat,
  Layout,
  ShieldCheck,
  Compass,
  Cpu,
  RotateCcw,
  Clock,
  Database,
  Lock,
  Sliders,
  Check,
  HeartPulse,
  GraduationCap,
  Landmark,
  Sun,
  Moon,
  X,
  ArrowDown,
  Layers,
  Star,
  Quote,
  BarChart3
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

const REVIEWS = [
  { id: "01", name: "Ananya S.", role: "ISL User", text: "I like that I can focus on what I need to communicate instead of figuring out how to explain everything." },
  { id: "02", name: "Rahul M.", role: "College Student", text: "The step-by-step workflow makes a difficult conversation feel much easier to handle." },
  { id: "03", name: "Pooja V.", role: "ISL User", text: "The confirmation step gives me confidence that my request was understood correctly." },
  { id: "04", name: "Vikram K.", role: "Student", text: "I don't have to start from zero every time. The workflow keeps the conversation organized." },
  { id: "05", name: "Sneha R.", role: "Accessibility User", text: "The visual interface makes the whole interaction feel much less stressful." },
  { id: "06", name: "Arjun N.", role: "ISL User", text: "I can prepare what I want to say and show it clearly without depending on someone else." },
  { id: "07", name: "Divya T.", role: "College Student", text: "The education workflow would be really useful when communicating with faculty who don't know ISL." },
  { id: "08", name: "Karthik P.", role: "ISL User", text: "I like having options instead of being forced into one way of communicating." },
  { id: "09", name: "Meera D.", role: "Accessibility User", text: "The back and edit controls are small details, but they make the experience feel much safer." },
  { id: "10", name: "Siddharth J.", role: "ISL User", text: "It feels more like completing a conversation than filling out a form." },
  { id: "11", name: "Nisha B.", role: "Student", text: "The structured steps help me remember what information I still need to provide." },
  { id: "12", name: "Aditya G.", role: "ISL User", text: "Being able to see the response and choose what happens next makes the interaction feel two-sided." },
  { id: "13", name: "Rohan C.", role: "Accessibility User", text: "I don't want complicated screens. Clear options and simple language are exactly what I need." },
  { id: "14", name: "Tanvi S.", role: "College Student", text: "For something like an attendance issue, I could explain the situation clearly without struggling to phrase everything." },
  { id: "15", name: "Harish L.", role: "ISL User", text: "The workflow gives me more control over the conversation." },
  { id: "16", name: "Deepa M.", role: "Accessibility User", text: "I appreciate that the experience is designed around visual communication instead of assuming everyone can use audio." },
  { id: "17", name: "Varun E.", role: "ISL User", text: "The emergency card could be especially useful when I need to communicate important information quickly." },
  { id: "18", name: "Kavya P.", role: "Student", text: "The interface feels straightforward. I know what I'm supposed to do at each step." },
  { id: "19", name: "Manoj H.", role: "ISL User", text: "Instead of repeatedly explaining my communication needs, I can make them clear from the beginning." },
  { id: "20", name: "Shreya W.", role: "Accessibility User", text: "The biggest thing for me is clarity. I want to know what was requested, what was answered, and what happens next." },
  { id: "21", name: "Kunal Y.", role: "College Student", text: "I can imagine using this at a college office when the person at the counter doesn't know ISL." },
  { id: "22", name: "Swati N.", role: "ISL User", text: "The ability to review everything before confirming is really helpful." },
  { id: "23", name: "Tarun Z.", role: "Accessibility User", text: "It doesn't try to make communication complicated. It breaks it into manageable steps." },
  { id: "24", name: "Geeta K.", role: "ISL User", text: "For everyday situations, having a communication companion could make asking for help feel more independent." }
];

export default function Home() {
  const {
    isDarkTheme,
    toggleTheme,
    bgCanvas,
    textPrimary,
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid
  } = useTheme();

  const [activeDomain, setActiveDomain] = useState('healthcare');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Workflow Simulator Interactive States
  const [selectedTime, setSelectedTime] = useState(null);
  const [simulationConfirmed, setSimulationConfirmed] = useState(false);

  const handleSelectTime = (time) => {
    setSelectedTime(time);
    setSimulationConfirmed(false);
  };

  const handleConfirmSimulation = () => {
    if (!selectedTime) return;
    setSimulationConfirmed(true);
  };

  const handleResetSimulation = () => {
    setSelectedTime(null);
    setSimulationConfirmed(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] ${bgCanvas} ${textPrimary}`}>

      {/* Sticky Header Navbar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${borderTone} ${isDarkTheme ? 'bg-[#655A7C]/95' : 'bg-[#FDF1E2]/95'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold tracking-tight text-sm shadow-sm ${accentSolid}`}>
                SM
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                SignMitra
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
              <a href="#features" className={`hover:opacity-75 transition-opacity ${textSecondary}`}>Features</a>
              <a href="#capabilities" className={`hover:opacity-75 transition-opacity ${textSecondary}`}>Capabilities</a>
              <a href="#domains" className={`hover:opacity-75 transition-opacity ${textSecondary}`}>Use Cases</a>
              <a href="#reviews" className={`hover:opacity-75 transition-opacity ${textSecondary}`}>User Voices</a>
              <a href="#accessibility" className={`hover:opacity-75 transition-opacity ${textSecondary}`}>Accessibility</a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Direct Dashboard Link */}
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg border ${borderTone} ${cardBg} text-xs font-mono font-bold uppercase tracking-wider hover:opacity-80 transition-all inline-flex items-center gap-1.5`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Metrics</span> Dashboard
            </Link>

            <span className={`hidden lg:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${borderTone} ${cardBg}`}>
              <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`}></span>
              Open Platform
            </span>

            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme Mode"
              className={`p-2 rounded-lg border ${borderTone} ${cardBg} hover:opacity-80 transition-all`}
            >
              {isDarkTheme ? <Sun className="w-4 h-4 text-[#FDF1E2]" /> : <Moon className="w-4 h-4 text-[#655A7C]" />}
            </button>

            <a
              href="#product-engine"
              className={`hidden sm:inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-all ${accentSolid}`}
            >
              Overview
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className={`relative overflow-hidden pt-16 pb-20 lg:pt-20 lg:pb-24 border-b ${borderTone}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left Column: Mission & CTA */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardBg} text-xs font-mono font-bold uppercase tracking-wider mb-5`}>
                <Sparkles className="w-3.5 h-3.5" />
                ACCESSIBLE COMMUNICATION PLATFORM
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5">
                COMMUNICATE INDEPENDENTLY. <br />
                <span className={`underline decoration-2 underline-offset-6 ${isDarkTheme ? 'decoration-[#FDF1E2]' : 'decoration-[#655A7C]'}`}>
                  CONNECT WITHOUT BARRIERS.
                </span>
              </h1>

              <p className={`text-base sm:text-lg font-normal leading-relaxed mb-7 max-w-xl ${textSecondary}`}>
                A communication companion for Indian Sign Language users that helps navigate everyday interactions through structured workflows, clear visual communication, and two-way responses.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
                <Link
                  href="/communication-hub"
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 transition-all group ${accentSolid}`}
                >
                  Explore SignMitra
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/dashboard"
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all`}
                >
                  <BarChart3 className="w-4 h-4" />
                  View Dashboard
                </Link>

                <Link
                  href="/emergency"
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Emergency Mode
                </Link>
              </div>
            </div>

            {/* Right Column: Communication Engine Terminal */}
            <div id="product-engine" className="lg:col-span-5 w-full">
              <div className={`rounded-xl border ${borderTone} shadow-md overflow-hidden ${cardBg}`}>
                <div className={`px-4 py-2.5 border-b ${borderTone} flex items-center justify-between ${cardInnerBg}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#655A7C]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#AB92BF]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FDF1E2] border border-[#655A7C]/30"></div>
                    <span className="ml-2 font-mono text-xs font-bold tracking-tight">signmitra_communication_runtime</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${borderTone} ${accentSolid}`}>
                    SYSTEM READY
                  </span>
                </div>

                <div className="p-5 font-mono text-xs space-y-2">
                  <div className="opacity-75">&gt; initializing communication engine...</div>
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>[success] Workflow engine connected</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>[success] Session state initialized</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span>[active] Communication context ready</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-75">
                    <Loader className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>[info] Loading accessibility workflows...</span>
                  </div>

                  <div className={`pl-3 border-l-2 ${borderTone} space-y-1.5 py-1 text-[11px]`}>
                    <div>[success] Healthcare workflow available</div>
                    <div>[success] Education workflow available</div>
                    <div>[success] Banking workflow available</div>
                    <div>[success] Metrics benchmarking module linked</div>
                  </div>

                  <div className={`pt-2.5 font-bold text-xs flex items-center gap-2 border-t ${borderTone}`}>
                    <span>&gt;_ Ready for communication</span>
                  </div>
                </div>

                <div className={`px-4 py-2 border-t ${borderTone} flex items-center justify-between text-[11px] font-mono font-semibold ${cardInnerBg}`}>
                  <span>Communication Workflow Core</span>
                  <span>runtime_v2.4</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRODUCT PRINCIPLES */}
      <section className={`py-10 border-b ${borderTone} ${cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold mb-3 ${accentSolid}`}>
                <GitMerge className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs tracking-wide uppercase mb-1.5">STRUCTURED COMMUNICATION</h3>
              <p className={`text-xs ${textSecondary} leading-relaxed`}>Guided workflows turn everyday interactions into clear, manageable steps.</p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold mb-3 ${accentSolid}`}>
                <Repeat className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs tracking-wide uppercase mb-1.5">TWO-WAY INTERACTION</h3>
              <p className={`text-xs ${textSecondary} leading-relaxed`}>Users can receive responses, choose options, confirm details, and continue.</p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold mb-3 ${accentSolid}`}>
                <Layout className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs tracking-wide uppercase mb-1.5">ACCESSIBILITY FIRST</h3>
              <p className={`text-xs ${textSecondary} leading-relaxed`}>Explicit state feedback, clear contrast, and zero camera or audio dependency.</p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold mb-3 ${accentSolid}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs tracking-wide uppercase mb-1.5">PRIVACY FOCUSED</h3>
              <p className={`text-xs ${textSecondary} leading-relaxed`}>Minimal data collection with communication sessions designed around user control.</p>
            </div>

          </div>
        </div>
      </section>

      {/* CORE EXPERIENCE / WORKFLOW */}
      <section id="features" className={`py-18 border-b ${borderTone}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold">CORE EXPERIENCE</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-1.5 mb-3">COMMUNICATION WORKFLOW</h2>
            <p className={`text-sm sm:text-base ${textSecondary}`}>Understand the situation. Build the interaction. Complete the task.</p>

            {/* Workflow Step Sequence Pills */}
            <div className={`mt-6 p-2 rounded-lg border ${borderTone} ${cardBg} inline-flex flex-wrap items-center justify-center gap-2 text-xs font-mono font-bold shadow-sm`}>
              {['Context', 'Intent', 'Information', 'Validation', 'Response', 'Confirmation'].map((step, idx, arr) => (
                <React.Fragment key={step}>
                  <span className={`px-3 py-1 rounded border ${borderTone} ${cardInnerBg}`}>
                    {step}
                  </span>
                  {idx < arr.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Three Core Domains Selector */}
          <div id="domains" className="mb-8 flex justify-center">
            <div className={`inline-flex p-1 rounded-lg border ${borderTone} ${cardBg}`}>
              {['healthcare', 'education', 'banking'].map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setActiveDomain(domain)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeDomain === domain
                      ? `${accentSolid} shadow-sm`
                      : 'opacity-70 hover:opacity-100'
                    }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Healthcare Card */}
            <div
              onClick={() => setActiveDomain('healthcare')}
              className={`p-6 rounded-xl border transition-all cursor-pointer ${cardBg} ${activeDomain === 'healthcare'
                  ? 'border-[#655A7C] ring-2 ring-[#655A7C] shadow-lg scale-[1.02]'
                  : `${borderTone} opacity-60 hover:opacity-100`
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mb-5 ${accentSolid}`}>
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black uppercase mb-2">Healthcare</h3>
              <p className={`leading-relaxed mb-5 text-xs sm:text-sm ${textSecondary}`}>
                Book appointments, communicate symptoms, request assistance, and handle common healthcare interactions through guided workflows.
              </p>
              <div className={`pt-3.5 border-t ${borderTone} flex items-center text-xs font-mono font-bold`}>
                <Check className="w-4 h-4 mr-1.5" /> Active Healthcare Workflow
              </div>
            </div>

            {/* Education Card */}
            <div
              onClick={() => setActiveDomain('education')}
              className={`p-6 rounded-xl border transition-all cursor-pointer ${cardBg} ${activeDomain === 'education'
                  ? 'border-[#655A7C] ring-2 ring-[#655A7C] shadow-lg scale-[1.02]'
                  : `${borderTone} opacity-60 hover:opacity-100`
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mb-5 ${accentSolid}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black uppercase mb-2">Education</h3>
              <p className={`leading-relaxed mb-5 text-xs sm:text-sm ${textSecondary}`}>
                Communicate with faculty, handle attendance or examination concerns, request certificates, and manage academic interactions.
              </p>
              <div className={`pt-3.5 border-t ${borderTone} flex items-center text-xs font-mono font-bold`}>
                <Clock className="w-4 h-4 mr-1.5" /> Academic Interaction Workflow
              </div>
            </div>

            {/* Banking Card */}
            <div
              onClick={() => setActiveDomain('banking')}
              className={`p-6 rounded-xl border transition-all cursor-pointer ${cardBg} ${activeDomain === 'banking'
                  ? 'border-[#655A7C] ring-2 ring-[#655A7C] shadow-lg scale-[1.02]'
                  : `${borderTone} opacity-60 hover:opacity-100`
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mb-5 ${accentSolid}`}>
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black uppercase mb-2">Banking</h3>
              <p className={`leading-relaxed mb-5 text-xs sm:text-sm ${textSecondary}`}>
                Handle transaction issues, account requests, card problems, statement requests, and information updates.
              </p>
              <div className={`pt-3.5 border-t ${borderTone} flex items-center text-xs font-mono font-bold`}>
                <Lock className="w-4 h-4 mr-1.5" /> Encrypted Financial Workflow
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES / ENGINE GUARANTEES */}
      <section id="capabilities" className={`py-18 border-b ${borderTone} ${cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold">COMMUNICATION ENGINE</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-1.5 mb-3">SYSTEM GUARANTEES</h2>
            <p className={`text-sm sm:text-base ${textSecondary}`}>Stateful execution designed to eliminate interaction breakdown.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col`}>
              <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3.5 font-bold ${accentSolid}`}>
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold mb-1.5 text-xs tracking-wide uppercase">CONTEXT-AWARE WORKFLOWS</h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                SignMitra identifies what information is needed for the selected interaction and guides the user through required steps.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col`}>
              <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3.5 font-bold ${accentSolid}`}>
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold mb-1.5 text-xs tracking-wide uppercase">STATEFUL INTERACTION</h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                The system remembers current state across turns instead of treating every statement as an isolated prompt.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col`}>
              <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3.5 font-bold ${accentSolid}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold mb-1.5 text-xs tracking-wide uppercase">VALIDATION & RECOVERY</h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                Missing or invalid parameters are detected prior to submission, with dedicated back, retry, and cancellation paths.
              </p>
            </div>

            {/* Empirical Research / Dashboard Highlight */}
            <Link
              href="/dashboard"
              className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col hover:opacity-90 transition-opacity group`}
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3.5 font-bold ${accentSolid}`}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold mb-1.5 text-xs tracking-wide uppercase flex items-center justify-between">
                <span>METRICS BENCHMARKING</span>
                <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
              </h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                Record interaction latency against manual pen-and-paper baselines and export clean CSV datasets for evaluation audits.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* TWO-WAY COMMUNICATION SIMULATOR */}
      <section className={`py-18 border-b ${borderTone}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold">TWO-WAY COMMUNICATION</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-1.5 mb-2.5">FROM REQUEST TO RESOLUTION</h2>
            <div className={`mt-2 font-mono text-xs font-bold tracking-wider px-3 py-1 rounded-md inline-block border ${borderTone} ${cardBg}`}>
              REQUEST → RESPONSE → CHOICE → CONFIRMATION → COMPLETION
            </div>
          </div>

          <div className={`rounded-xl border ${borderTone} shadow-md overflow-hidden ${cardBg}`}>
            <div className={`px-5 py-3 border-b ${borderTone} flex items-center justify-between ${cardInnerBg}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`}></div>
                <span className="font-mono text-xs font-bold">Interactive Appointment Resolution Cycle</span>
              </div>
              <button
                onClick={handleResetSimulation}
                className={`text-xs font-mono font-bold flex items-center gap-1 hover:opacity-75 transition-opacity`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restart Cycle
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Step 1: User Request */}
              <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${borderTone} ${accentSolid}`}>
                    USER
                  </span>
                  <span className="text-xs font-mono font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Request Formulated
                  </span>
                </div>
                <h4 className="font-black text-sm uppercase mb-2.5">Appointment Request</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className={`p-2.5 rounded border ${borderTone} ${cardBg}`}>
                    <span className="opacity-70 block text-[10px]">Doctor:</span>
                    <span className="font-bold">Cardiologist</span>
                  </div>
                  <div className={`p-2.5 rounded border ${borderTone} ${cardBg}`}>
                    <span className="opacity-70 block text-[10px]">Date:</span>
                    <span className="font-bold">02 October</span>
                  </div>
                  <div className={`p-2.5 rounded border ${borderTone} ${cardBg}`}>
                    <span className="opacity-70 block text-[10px]">Time:</span>
                    <span className="font-bold">10:30 AM</span>
                  </div>
                  <div className={`p-2.5 rounded border ${borderTone} ${cardBg}`}>
                    <span className="opacity-70 block text-[10px]">Reason:</span>
                    <span className="font-bold">Follow-up</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${borderTone} ${cardInnerBg}`}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Step 2: System Response */}
              <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${borderTone} ${accentSolid}`}>
                    RESPONSE
                  </span>
                  <span className="text-xs font-mono font-bold">Alternative Slots Provided</span>
                </div>
                <p className="font-bold text-xs sm:text-sm mb-3">
                  10:30 AM is unavailable. Available times:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['11:30 AM', '12:15 PM', '02:00 PM'].map((time) => (
                    <button
                      key={time}
                      onClick={() => handleSelectTime(time)}
                      className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold transition-all border ${selectedTime === time
                        ? `${accentSolid} ring-1 ring-[#655A7C]`
                        : `${cardBg}${borderTone} hover:opacity-80`
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${borderTone} ${cardInnerBg}`}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Step 3: User Choice */}
              <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${borderTone} ${accentSolid}`}>
                    USER
                  </span>
                  <span className="text-xs font-mono font-bold opacity-80">
                    {!selectedTime && 'Waiting for selection...'}
                    {selectedTime && !simulationConfirmed && 'Ready for confirmation'}
                    {simulationConfirmed && 'Cycle Completed'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm font-mono">
                    {selectedTime ? (
                      <span>
                        Selected Time: <strong className="font-black underline">{selectedTime}</strong>
                      </span>
                    ) : (
                      <span className="opacity-70">Please pick a slot above</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleConfirmSimulation}
                      disabled={!selectedTime}
                      className={`px-4 py-1.5 rounded font-bold text-xs font-mono transition-all border ${selectedTime
                        ? `${accentSolid} cursor-pointer hover:opacity-90`
                        : `opacity-40 cursor-not-allowed ${borderTone}`
                        }`}
                    >
                      [ Confirm ]
                    </button>
                    <button
                      onClick={handleResetSimulation}
                      className={`px-3.5 py-1.5 rounded border ${borderTone} font-bold text-xs font-mono hover:opacity-80 transition-all ${cardBg}`}
                    >
                      [ Change ]
                    </button>
                  </div>
                </div>

                {simulationConfirmed && (
                  <div className={`mt-3.5 p-3 rounded border text-xs font-mono flex items-center gap-2 ${accentSolid}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Communication Completed: Appointment finalized for {selectedTime}.</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`px-5 py-2.5 border-t ${borderTone} text-center text-xs font-mono font-bold ${cardInnerBg}`}>
              Communication continues until the task is completed.
            </div>
          </div>
        </div>
      </section>

      {/* CONTINUOUS AUTOMATIC TRAIN TESTIMONIAL DECK */}
      <section
        id="reviews"
        className={`w-full py-14 border-b ${borderTone} relative overflow-hidden select-none ${cardBg}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${borderTone} ${cardInnerBg} text-xs font-mono font-bold uppercase tracking-wider mb-2`}>
            <Quote className="w-3.5 h-3.5" />
            USER PERSPECTIVES & PILOT INTENT
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            BUILT AROUND REAL COMMUNICATION NEEDS
          </h2>
          <p className={`text-xs sm:text-sm mt-1 max-w-xl ${textSecondary}`}>
            The experience we're building is shaped around clarity, independence, and user control.
          </p>
        </div>

        {/* Continuous Automatic Train Track */}
        <div className="train-marquee flex gap-5 min-w-full will-change-transform">
          {[...REVIEWS, ...REVIEWS].map((item, idx) => (
            <div
              key={idx}
              className={`w-80 shrink-0 p-5 rounded-lg border transition-transform duration-150 flex flex-col justify-between ${cardInnerBg} ${borderTone}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                  <div className="flex gap-0.5 text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current stroke-current" />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] font-bold opacity-60">#{item.id}</span>
                </div>

                <p className="text-xs leading-relaxed mb-4 font-semibold">
                  “{item.text}”
                </p>
              </div>

              <div className="flex flex-col border-t pt-2.5" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                <span className="font-bold text-xs tracking-tight">{item.name}</span>
                <span className={`text-[10px] font-bold mt-0.5 ${textSecondary}`}>{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ACCESSIBILITY */}
      <section id="accessibility" className={`py-18 border-b ${borderTone}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="font-mono text-xs uppercase tracking-wider font-extrabold">ACCESSIBILITY</span>
              <h2 className="text-3xl sm:text-4xl font-black mt-1.5 mb-4 uppercase">
                DESIGNED FOR COMMUNICATION INDEPENDENCE
              </h2>
              <p className={`text-sm sm:text-base mb-6 ${textSecondary}`}>
                SignMitra keeps the interaction visual, clear, and easy to navigate.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  'Large interaction controls',
                  'High-contrast interface',
                  'Clear workflow states',
                  'Keyboard-friendly navigation',
                  'Simple language',
                  'Visual confirmation',
                  'Back / Edit / Cancel controls',
                  'No microphone dependency',
                  'No camera dependency'
                ].map((item) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 p-3 rounded-md border ${borderTone} ${cardBg}`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${accentSolid}`}>
                      ✓
                    </div>
                    <span className="text-xs font-bold uppercase">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Mode Highlight Card */}
            <div className="lg:col-span-6 w-full">
              <div className={`p-6 rounded-xl border ${borderTone} relative shadow-sm overflow-hidden ${cardBg}`}>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${borderTone} ${accentSolid}`}>
                    EMERGENCY MODE
                  </span>
                  <ShieldAlert className="w-4 h-4" />
                </div>

                <h3 className="text-xl font-black mb-2 uppercase">WHEN COMMUNICATION NEEDS TO BE IMMEDIATE</h3>
                <p className={`text-xs sm:text-sm mb-5 ${textSecondary}`}>
                  A dedicated emergency profile allows users to quickly present essential accessibility and emergency information when communication assistance is needed.
                </p>

                <div className={`p-4 rounded-lg border ${borderTone} mb-5 space-y-2.5 font-mono text-xs ${cardInnerBg}`}>
                  <div className={`border-b ${borderTone} pb-2`}>
                    <span className="text-[10px] font-bold block mb-0.5 opacity-70">EMERGENCY CARD</span>
                    <span className="font-bold text-sm">I communicate using Indian Sign Language.</span>
                  </div>
                  <div>
                    <span className="opacity-70 text-[10px] block">Communication Preference</span>
                    <span className="font-bold">Visual / Written Communication</span>
                  </div>
                  <div>
                    <span className="opacity-70 text-[10px] block">Important Information</span>
                    <span className="text-xs opacity-90">Optional user-provided information</span>
                  </div>
                  <div>
                    <span className="opacity-70 text-[10px] block">Emergency Contact</span>
                    <span className="font-bold">Available for quick access</span>
                  </div>
                </div>

                <Link
                  href="/emergency"
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Open Emergency Mode
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className={`py-18 border-b ${borderTone} ${cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold">PRIVACY</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-1.5 mb-2.5 uppercase">
              YOUR COMMUNICATION. YOUR CONTROL.
            </h2>
            <p className={`text-sm sm:text-base ${textSecondary}`}>
              SignMitra is designed around minimal data collection and user-controlled communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 font-bold ${accentSolid}`}>
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold mb-1 text-xs tracking-wide uppercase">SESSION-BASED</h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                Communication sessions can be temporary rather than permanently storing every interaction.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 font-bold ${accentSolid}`}>
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-bold mb-1 text-xs tracking-wide uppercase">MINIMAL DATA</h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                Only information required for the selected workflow needs to be provided.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 font-bold ${accentSolid}`}>
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold mb-1 text-xs tracking-wide uppercase">PROTECTED</h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                Sensitive accessibility and emergency information remains separated from ordinary sessions.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 font-bold ${accentSolid}`}>
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="font-bold mb-1 text-xs tracking-wide uppercase">USER CONTROL</h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                Users can review, edit, cancel, and manage their active information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className={`py-18 border-b ${borderTone}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold">CAPABILITIES</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-1.5 mb-2.5 uppercase">CORE CAPABILITIES</h2>
            <p className={`text-sm ${textSecondary}`}>Real interface clarity instead of fabricated statistics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Structured Flow', desc: 'Build interactions through guided workflows.' },
              { title: 'Stateful Workflows', desc: 'Maintain context throughout an interaction.' },
              { title: 'Two-Way Options', desc: 'Receive and respond to structured options.' },
              { title: 'Validation Engine', desc: 'Handle missing information and invalid states.' },
              { title: 'Accessible UI', desc: 'Keep communication visual, clear, and manageable.' }
            ].map((cap) => (
              <div key={cap.title} className={`p-4 rounded-lg border ${borderTone} ${cardBg} flex flex-col`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold mb-3 text-xs shadow-sm ${accentSolid}`}>
                  ✓
                </div>
                <h3 className="font-bold mb-1 text-xs uppercase tracking-tight">{cap.title}</h3>
                <p className={`text-xs ${textSecondary}`}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={`py-18 text-center relative overflow-hidden border-b ${borderTone} ${cardBg}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 leading-tight uppercase">
            COMMUNICATION SHOULD NOT DEPEND ON WHO IS AVAILABLE.
          </h2>
          <p className={`text-sm sm:text-base max-w-xl mx-auto mb-7 leading-relaxed ${textSecondary}`}>
            SignMitra helps ISL users navigate everyday interactions with greater independence, clarity, and control.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/communication-hub"
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-opacity ${accentSolid}`}
            >
              Explore SignMitra
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-opacity`}
            >
              <BarChart3 className="w-4 h-4" />
              Metrics Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-12 ${cardInnerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${accentSolid}`}>
                  SM
                </div>
                <span className="font-black text-base">SignMitra</span>
              </div>
              <p className={`text-xs sm:text-sm max-w-sm mb-4 ${textSecondary}`}>A communication companion for ISL users.</p>
              <p className="text-xs font-mono font-bold">Communication should be accessible to everyone.</p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-3">Navigation</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li><Link href="/communication-hub" className="hover:opacity-75 transition-opacity">Communication Hub</Link></li>
                <li><Link href="/dashboard" className="hover:opacity-75 transition-opacity">Metrics Dashboard</Link></li>
                <li><Link href="/emergency" className="hover:opacity-75 transition-opacity">Emergency Mode</Link></li>
                <li><a href="#accessibility" className="hover:opacity-75 transition-opacity">Accessibility</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-3">Runtime</h4>
              <div className="space-y-2 text-xs font-mono font-medium">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`}></span>
                  Runtime Operational
                </div>
                <div className="opacity-75">ISL Workflows v2.4</div>
              </div>
            </div>
          </div>

          <div className={`pt-6 border-t ${borderTone} flex flex-col sm:flex-row items-center justify-between text-xs font-mono`}>
            <p>&copy; 2026 SignMitra. All rights reserved.</p>
            <div className="flex items-center gap-5 mt-3 sm:mt-0">
              <a href="#" className="hover:opacity-75 transition-opacity">Privacy Policy</a>
              <a href="#" className="hover:opacity-75 transition-opacity">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* EMERGENCY MODE MODAL */}
      {emergencyModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDarkTheme ? 'bg-[#655A7C]/80' : 'bg-[#FDF1E2]/80'}`}>
          <div className={`relative w-full max-w-lg border ${borderTone} rounded-xl shadow-lg overflow-hidden p-6 ${cardInnerBg} ${textPrimary}`}>
            <div className={`flex items-center justify-between pb-3.5 border-b ${borderTone} mb-5`}>
              <div className="flex items-center gap-2 font-bold text-xs uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>EMERGENCY PROFILE CARD</span>
              </div>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className={`p-1 rounded-md border ${borderTone} hover:opacity-80 transition-opacity`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`space-y-3.5 font-mono text-xs p-4 rounded-lg border ${borderTone} mb-5 ${cardBg}`}>
              <div>
                <span className="opacity-70 text-[10px] block mb-0.5">PRIMARY NOTICE</span>
                <span className="font-bold text-sm block">I communicate using Indian Sign Language.</span>
              </div>
              <div>
                <span className="opacity-70 text-[10px] block">Communication Preference</span>
                <span className="font-bold">Visual / Written Communication</span>
              </div>
              <div>
                <span className="opacity-70 text-[10px] block">Important Information</span>
                <span className="text-xs opacity-90">Optional user-provided information</span>
              </div>
              <div>
                <span className="opacity-70 text-[10px] block">Emergency Contact</span>
                <span className="font-bold">Available for quick access</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-opacity shadow-sm hover:opacity-90 ${accentSolid}`}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}