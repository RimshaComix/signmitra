'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Bot,
  Sparkles,
  ArrowLeft,
  Sun,
  Moon,
  Mic,
  Video,
  FileText,
  Clock,
  Settings,
  ShieldCheck,
  BarChart3,
  Layers,
  Camera,
  Play,
  History,
  HelpCircle,
  Building,
  GraduationCap
} from 'lucide-react';

import StudioOverview from './components/StudioOverview';
import TwoWayRoom from './components/TwoWayRoom';
import RecoveryWorkflow from './components/RecoveryWorkflow';
import VisionSuite from './components/VisionSuite';
import LanguageSuite from './components/LanguageSuite';
import RehearsalSimulator from './components/RehearsalSimulator';
import ISLLab from './components/ISLLab';
import EvidenceAssistant from './components/EvidenceAssistant';
import SavedSessions from './components/SavedSessions';
import SettingsPrivacy from './components/SettingsPrivacy';

export default function AIStudioPage() {
  const {
    bgCanvas,
    textPrimary,
    textSecondary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme,
    toggleTheme
  } = useTheme();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time Device & Hardware Diagnostics
  const [systemStatus, setSystemStatus] = useState({
    speechSupported: false,
    ttsSupported: false,
    cameraSupported: false,
    voiceCount: 0
  });

  // Real-time Python FastAPI Backend & Multi-Provider AI Health
  const [backendHealth, setBackendHealth] = useState({
    online: false,
    provider: 'Checking...',
    model: '',
    configured: false,
    statusMessage: '',
    islEngine: 'Model Checkpoint Required'
  });

  // Pre-configured Scenario passed from Overview to Recovery Journey
  const [scenarioConfig, setScenarioConfig] = useState(null);

  // Cross-tool data transfer state
  const [explainerPreload, setExplainerPreload] = useState('');

  useEffect(() => {
    // 1. Check browser hardware APIs
    if (typeof window !== 'undefined') {
      const hasSTT = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      const hasTTS = 'speechSynthesis' in window;
      const hasCam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      let voiceTotal = 0;
      if (hasTTS) {
        voiceTotal = window.speechSynthesis.getVoices().length;
        window.speechSynthesis.onvoiceschanged = () => {
          setSystemStatus(prev => ({
            ...prev,
            voiceCount: window.speechSynthesis.getVoices().length
          }));
        };
      }

      setSystemStatus({
        speechSupported: hasSTT,
        ttsSupported: hasTTS,
        cameraSupported: hasCam,
        voiceCount: voiceTotal
      });
    }

    // 2. Query Python backend health
    fetch('/api/ai-studio/health')
      .then(res => res.json())
      .then(data => {
        setBackendHealth({
          online: data.backend_online || data.status === 'healthy',
          provider: data.ai_provider?.provider || 'unconfigured',
          model: data.ai_provider?.model || '',
          configured: !!data.ai_provider?.configured,
          statusMessage: data.ai_provider?.status_message || '',
          islEngine: data.isl_engine || 'Model Checkpoint Required'
        });
      })
      .catch(() => {
        setBackendHealth(prev => ({ ...prev, online: false }));
      });
  }, []);

  const handleStartScenario = (scenario) => {
    setScenarioConfig(scenario);
    setActiveTab('recovery');
  };

  const handleSendToExplainer = (text) => {
    setExplainerPreload(text);
    setActiveTab('language');
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Bot },
    { id: 'recovery', label: 'Recovery Journey', icon: Play },
    { id: 'twoway', label: 'Two-Way Room', icon: Mic },
    { id: 'vision', label: 'Vision & OCR', icon: Camera },
    { id: 'language', label: 'Language Tools', icon: FileText },
    { id: 'rehearsal', label: 'Practice Rehearsal', icon: Clock },
    { id: 'evidence', label: 'Access Directory', icon: Building },
    { id: 'isllab', label: 'ISL Lab', icon: Video },
    { id: 'sessions', label: 'Saved Sessions', icon: History },
    { id: 'settings', label: 'Settings & Fallback', icon: Settings }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Top System Status Header */}
      <header className={`w-full border-b py-2.5 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-20 sticky top-0 backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <Link
            href="/communication-hub"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            <span>SignMitra AI Studio</span>
          </span>
          <span className="opacity-40 hidden md:inline">•</span>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${borderTone} ${cardInnerBg}">
            AI-assisted support · Review before use
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Return to Dashboard link as requested */}
          <Link
            href="/dashboard"
            className={`px-2.5 py-1 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all text-xs font-mono font-bold flex items-center gap-1.5`}
            title="Return to Metrics Dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* Theme Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 flex-1 flex flex-col space-y-6">
        
        {/* Horizontal Navigation Ribbon */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap flex items-center gap-2 transition-all border shrink-0 ${
                  isActive
                    ? `${accentSolid} shadow-sm border-transparent`
                    : `${cardBg} ${borderTone} hover:border-[#655A7C]`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic Studio Workspaces */}
        <div className="flex-1">
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <StudioOverview
              onSelectTab={setActiveTab}
              onStartScenario={handleStartScenario}
              systemStatus={systemStatus}
              backendHealth={backendHealth}
            />
          )}

          {/* 2. Recovery Workflow (The central 10-step prepare-to-follow-up experience) */}
          {activeTab === 'recovery' && (
            <RecoveryWorkflow
              initialContext={scenarioConfig?.context || 'College Office'}
              initialGoal={scenarioConfig?.goal || ''}
              initialInstitution={scenarioConfig?.institution || ''}
              onCompleteSession={() => setActiveTab('sessions')}
            />
          )}

          {/* 3. Two-Way Communication Room */}
          {activeTab === 'twoway' && (
            <TwoWayRoom
              onSendToExplainer={handleSendToExplainer}
              activeContext={scenarioConfig?.context || 'General Interaction'}
            />
          )}

          {/* 4. Vision & OCR Suite */}
          {activeTab === 'vision' && (
            <VisionSuite
              onSendToClarification={(text) => {
                setExplainerPreload(text);
                setActiveTab('language');
              }}
            />
          )}

          {/* 5. Language & Clarification Tools */}
          {activeTab === 'language' && (
            <LanguageSuite />
          )}

          {/* 6. Conversation Practice Rehearsal */}
          {activeTab === 'rehearsal' && (
            <RehearsalSimulator />
          )}

          {/* 7. Evidence-Grounded Accessibility Assistant */}
          {activeTab === 'evidence' && (
            <EvidenceAssistant />
          )}

          {/* 8. ISL Recognition Lab */}
          {activeTab === 'isllab' && (
            <ISLLab
              onSendToRoom={(msg) => {
                setActiveTab('twoway');
              }}
            />
          )}

          {/* 9. Saved Sessions Ledger */}
          {activeTab === 'sessions' && (
            <SavedSessions />
          )}

          {/* 10. Settings, Profile & Fallback */}
          {activeTab === 'settings' && (
            <SettingsPrivacy systemStatus={systemStatus} />
          )}
        </div>

      </main>

      {/* Sticky Studio Footer */}
      <footer className={`border-t py-4 px-4 sm:px-8 text-xs font-mono flex flex-col sm:flex-row justify-between items-center gap-2 ${borderTone} ${cardInnerBg}`}>
        <div className="flex items-center gap-2">
          <span className="font-bold">SignMitra AI Studio</span>
          <span className="opacity-40">•</span>
          <span className="opacity-80">Local-First Cognitive Companion</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] opacity-70">
          <span>Speech Recognition: {systemStatus.speechSupported ? 'Available' : 'Fallback'}</span>
          <span>•</span>
          <span>Zero Server Audio Storage</span>
        </div>
      </footer>

    </div>
  );
}
