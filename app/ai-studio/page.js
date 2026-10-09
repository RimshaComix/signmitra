'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Bot,
  ArrowLeft,
  Sun,
  Moon,
  Mic,
  Video,
  FileText,
  Clock,
  Settings,
  BarChart3,
  Camera,
  Play,
  History,
  Building
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

  const [activeTab, setActiveTab] = useState('overview');

  const [systemStatus, setSystemStatus] = useState({
    speechSupported: false,
    ttsSupported: false,
    cameraSupported: false,
    voiceCount: 0
  });

  const [backendHealth, setBackendHealth] = useState({
    online: false,
    provider: 'Checking...',
    model: '',
    configured: false,
    statusMessage: '',
    islEngine: 'Model Checkpoint Required'
  });

  const [scenarioConfig, setScenarioConfig] = useState(null);

  const [explainerPreload, setExplainerPreload] = useState('');

  /*
   * Browser capability + backend health checks.
   */
  useEffect(() => {
    let mounted = true;

    const checkBrowserCapabilities = () => {
      if (typeof window === 'undefined') return;

      const hasSTT =
        'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in window;

      const hasTTS = 'speechSynthesis' in window;

      const hasCamera = Boolean(
        navigator.mediaDevices?.getUserMedia
      );

      const voiceTotal = hasTTS
        ? window.speechSynthesis.getVoices().length
        : 0;

      if (!mounted) return;

      setSystemStatus({
        speechSupported: hasSTT,
        ttsSupported: hasTTS,
        cameraSupported: hasCamera,
        voiceCount: voiceTotal
      });
    };

    const handleVoicesChanged = () => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window)
      ) {
        return;
      }

      if (!mounted) return;

      setSystemStatus((previous) => ({
        ...previous,
        voiceCount: window.speechSynthesis.getVoices().length
      }));
    };

    checkBrowserCapabilities();

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.addEventListener(
        'voiceschanged',
        handleVoicesChanged
      );
    }

    /*
     * Backend health check.
     */
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('/api/ai-studio/health', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(
            `Health endpoint returned ${response.status}`
          );
        }

        const data = await response.json();

        if (!mounted) return;

        setBackendHealth({
          online:
            data?.backend_online === true ||
            data?.status === 'healthy',

          provider:
            data?.ai_provider?.provider ||
            'unconfigured',

          model:
            data?.ai_provider?.model ||
            '',

          configured:
            Boolean(data?.ai_provider?.configured),

          statusMessage:
            data?.ai_provider?.status_message ||
            '',

          islEngine:
            data?.isl_engine ||
            'Model Checkpoint Required'
        });
      } catch (error) {
        console.error(
          'AI Studio backend health check failed:',
          error
        );

        if (!mounted) return;

        setBackendHealth((previous) => ({
          ...previous,
          online: false,
          provider: 'unavailable',
          statusMessage:
            'AI Studio backend health check unavailable.'
        }));
      }
    };

    checkBackendHealth();

    return () => {
      mounted = false;

      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.removeEventListener(
          'voiceschanged',
          handleVoicesChanged
        );
      }
    };
  }, []);

  /*
   * Start a configured scenario from the Overview.
   */
  const handleStartScenario = (scenario) => {
    setScenarioConfig(scenario || null);
    setActiveTab('recovery');
  };

  /*
   * Send text into Language Suite.
   */
  const handleSendToExplainer = (text) => {
    if (!text?.trim()) return;

    setExplainerPreload(text);
    setActiveTab('language');
  };

  /*
   * Reopen a previously saved Recovery session.
   */
  const handleReopenSession = (session) => {
    if (!session) return;

    setScenarioConfig({
      context: session.context || 'General Interaction',
      goal: session.goal || '',
      institution: session.institution || ''
    });

    setActiveTab('recovery');
  };

  const TABS = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Bot
    },
    {
      id: 'recovery',
      label: 'Recovery Journey',
      icon: Play
    },
    {
      id: 'twoway',
      label: 'Two-Way Room',
      icon: Mic
    },
    {
      id: 'vision',
      label: 'Vision & OCR',
      icon: Camera
    },
    {
      id: 'language',
      label: 'Language Tools',
      icon: FileText
    },
    {
      id: 'rehearsal',
      label: 'Practice Rehearsal',
      icon: Clock
    },
    {
      id: 'evidence',
      label: 'Access Directory',
      icon: Building
    },
    {
      id: 'isllab',
      label: 'ISL Lab',
      icon: Video
    },
    {
      id: 'sessions',
      label: 'Saved Sessions',
      icon: History
    },
    {
      id: 'settings',
      label: 'Settings & Fallback',
      icon: Settings
    }
  ];

  const providerLabel =
    backendHealth.configured && backendHealth.provider
      ? backendHealth.provider
      : 'Fallback / Unconfigured';

  return (
    <div
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: '#9ca3af #f3f4f6',
    overflowY: 'auto',
    minHeight: '100vh',
  }}
  className={`transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}
>

      {/* =========================================================
          TOP SYSTEM HEADER
      ========================================================= */}
      <header
        className={`w-full border-b py-2.5 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-20 sticky top-0 backdrop-blur-md`}
      >
        <div className="flex items-center gap-3 min-w-0">

          <Link
            href="/communication-hub"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Hub
            </span>
          </Link>

          <span className="opacity-40">/</span>

          <span className="opacity-90 font-bold uppercase tracking-wide flex items-center gap-1.5 min-w-0">
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              SignMitra AI Studio
            </span>
          </span>

          <span className="opacity-40 hidden md:inline">
            •
          </span>

          {/* FIXED: actual Tailwind interpolation */}
          <span
            className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${borderTone} ${cardInnerBg}`}
          >
            AI-assisted support · Review before use
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* BACKEND STATUS */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${borderTone} ${cardInnerBg}`}
            title={
              backendHealth.statusMessage ||
              `Provider: ${providerLabel}`
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendHealth.online
                  ? 'bg-green-500'
                  : 'bg-orange-500'
              }`}
            />

            <span className="text-[10px] font-bold uppercase">
              {backendHealth.online
                ? 'Backend Online'
                : 'Fallback Mode'}
            </span>
          </div>

          {/* DASHBOARD */}
          <Link
            href="/dashboard"
            className={`px-2.5 py-1 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all text-xs font-mono font-bold flex items-center gap-1.5`}
            title="Return to Metrics Dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5" />

            <span className="hidden sm:inline">
              Dashboard
            </span>
          </Link>

          {/* THEME */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDarkTheme
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C]`}
          >
            {isDarkTheme ? (
              <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#655A7C]" />
            )}
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN STUDIO
      ========================================================= */}
      <main
        className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 flex-1 flex flex-col space-y-6"
      >

        {/* NAVIGATION RIBBON */}
        <nav
          aria-label="AI Studio sections"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap flex items-center gap-2 transition-all border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#655A7C] ${
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

        {/* =======================================================
            DYNAMIC WORKSPACE
        ======================================================= */}
        <div className="flex-1">

          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <StudioOverview
              onSelectTab={setActiveTab}
              onStartScenario={handleStartScenario}
              systemStatus={systemStatus}
              backendHealth={backendHealth}
            />
          )}

          {/* 2. RECOVERY JOURNEY */}
          {activeTab === 'recovery' && (
            <RecoveryWorkflow
              initialContext={
                scenarioConfig?.context ||
                'College Office'
              }
              initialGoal={
                scenarioConfig?.goal || ''
              }
              initialInstitution={
                scenarioConfig?.institution || ''
              }
              onCompleteSession={() =>
                setActiveTab('sessions')
              }
            />
          )}

          {/* 3. TWO-WAY ROOM */}
          {activeTab === 'twoway' && (
            <TwoWayRoom
              onSendToExplainer={handleSendToExplainer}
              activeContext={
                scenarioConfig?.context ||
                'General Interaction'
              }
            />
          )}

          {/* 4. VISION & OCR */}
          {activeTab === 'vision' && (
            <VisionSuite
              onSendToClarification={(text) => {
                if (!text?.trim()) return;

                setExplainerPreload(text);
                setActiveTab('language');
              }}
            />
          )}

          {/* 5. LANGUAGE TOOLS */}
          {activeTab === 'language' && (
            <LanguageSuite
              initialText={explainerPreload}
              onInitialTextConsumed={() =>
                setExplainerPreload('')
              }
            />
          )}

          {/* 6. REHEARSAL */}
          {activeTab === 'rehearsal' && (
            <RehearsalSimulator />
          )}

          {/* 7. EVIDENCE ASSISTANT */}
          {activeTab === 'evidence' && (
            <EvidenceAssistant />
          )}

          {/* 8. ISL LAB */}
          {activeTab === 'isllab' && (
            <ISLLab
              onSendToRoom={(message) => {
                if (!message?.trim()) return;

                setActiveTab('twoway');
              }}
            />
          )}

          {/* 9. SAVED SESSIONS */}
          {activeTab === 'sessions' && (
            <SavedSessions
              onReopenSession={handleReopenSession}
            />
          )}

          {/* 10. SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsPrivacy
              systemStatus={{
                ...systemStatus,
                aiAvailable: backendHealth.online
              }}
            />
          )}

        </div>
      </main>

      {/* =========================================================
          STUDIO FOOTER
      ========================================================= */}
      <footer
        className={`border-t py-4 px-4 sm:px-8 text-xs font-mono flex flex-col sm:flex-row justify-between items-center gap-2 ${borderTone} ${cardInnerBg}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold">
            SignMitra AI Studio
          </span>

          <span className="opacity-40">
            •
          </span>

          <span className="opacity-80">
            Review-before-use communication companion
          </span>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 text-[11px] opacity-70">

          <span>
            Speech Recognition:{' '}
            {systemStatus.speechSupported
              ? 'Available'
              : 'Fallback'}
          </span>

          <span>•</span>

          <span>
            TTS:{' '}
            {systemStatus.ttsSupported
              ? 'Available'
              : 'Fallback'}
          </span>

          <span>•</span>

          <span>
            AI:{' '}
            {backendHealth.online
              ? backendHealth.configured
                ? providerLabel
                : 'Fallback'
              : 'Unavailable'}
          </span>
        </div>
      </footer>
    </div>
  );
}