'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Send,
  Copy,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  User,
  Users,
  Settings,
  Trash2,
  Download,
  Save,
  Check,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function TwoWayRoom({ 
  onSendToExplainer, 
  onSaveSession,
  activeContext = 'General Interaction'
}) {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  // Conversation turns
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'user',
      text: 'Hello. I communicate using Indian Sign Language and written text. Please speak clearly into the microphone or write your reply.',
      timestamp: '10:00 AM',
      status: 'confirmed'
    }
  ]);

  // Current inputs
  const [userDraft, setUserDraft] = useState('');
  const [staffManualDraft, setStaffManualDraft] = useState('');
  
  // Speech Recognition (STT) State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(false);
  const [sttLanguage, setSttLanguage] = useState('en-IN');
  const recognitionRef = useRef(null);

  // Text to Speech (TTS) State
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // UI Display Preferences
  const [captionSize, setCaptionSize] = useState('large'); // 'normal' | 'large' | 'xlarge'
  const [highContrast, setHighContrast] = useState(false);
  const [fullscreenCard, setFullscreenCard] = useState(null); // Text to show in giant card mode
  const [copiedId, setCopiedId] = useState(null);

  // Quick Preset Cards for User
  const PRESET_CARDS = [
    { label: 'Please write down', text: 'Could you please write down the counter number and instructions?' },
    { label: 'Need visual alert', text: 'Please alert me visually when my token or name is called.' },
    { label: 'Which counter?', text: 'Which counter or room do I need to visit next?' },
    { label: 'What documents?', text: 'Which specific documents or forms do I need to submit?' },
    { label: 'How much fee?', text: 'Is there any fee or payment required? Please write the amount.' },
    { label: 'Repeat please', text: 'Could you please explain that again more slowly?' }
  ];

  // 1. Initialize Web Speech API & Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSttSupported(true);
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = sttLanguage;

        recognizer.onresult = (event) => {
          let interim = '';
          let finalized = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalized += transcript;
            } else {
              interim += transcript;
            }
          }

          setInterimTranscript(interim);

          if (finalized.trim()) {
            const newTurn = {
              id: `stt-${Date.now()}`,
              sender: 'staff',
              text: finalized.trim(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isPartial: false,
              understanding: null // null | 'understood' | 'unclear' | 'repeat'
            };
            setMessages(prev => [...prev, newTurn]);
            setInterimTranscript('');
          }
        };

        recognizer.onerror = (e) => {
          console.warn('Speech recognition error:', e.error);
          setIsListening(false);
        };

        recognizer.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognizer;
      }

      // Check Speech Synthesis
      if ('speechSynthesis' in window) {
        setTtsSupported(true);
        const loadVoices = () => {
          const avail = window.speechSynthesis.getVoices();
          setVoices(avail);
          const defaultV = avail.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
          if (defaultV && !selectedVoiceURI) {
            setSelectedVoiceURI(defaultV.voiceURI);
          }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update recognizer language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = sttLanguage;
    }
  }, [sttLanguage]);

  // STT Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  // Text-To-Speech Playback (Explicit User Action Only)
  const speakText = (text, id = null) => {
    if (!ttsSupported || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoiceURI) {
      const v = voices.find(voice => voice.voiceURI === selectedVoiceURI);
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (id) setSpeakingMessageId(id);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  // Send User Message
  const handleSendUserMessage = (textToSend = null) => {
    const text = textToSend || userDraft;
    if (!text.trim()) return;

    const newMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'confirmed'
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setUserDraft('');
  };

  // Send Staff Manual Response
  const handleSendStaffManual = () => {
    if (!staffManualDraft.trim()) return;
    const newMsg = {
      id: `stf-${Date.now()}`,
      sender: 'staff',
      text: staffManualDraft.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      understanding: null
    };
    setMessages(prev => [...prev, newMsg]);
    setStaffManualDraft('');
  };

  // Mark Staff Turn Comprehension
  const markUnderstanding = (msgId, status) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, understanding: status } : m));
  };

  // Copy text helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [savedTranscriptMsg, setSavedTranscriptMsg] = useState(false);

  const handleSaveTranscript = () => {
    if (messages.length === 0) return;
    const historyItem = {
      id: `AI-CHAT-${Date.now()}`,
      domain: activeContext,
      intent: 'Two-Way Conversation Session',
      title: `${activeContext} Room Transcript`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: 'Completed',
      verifiedByStaff: false,
      entities: {
        'Turns Count': `${messages.length} messages`,
        'Last Message': messages[messages.length - 1]?.text?.slice(0, 80) || ''
      }
    };
    const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
    localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));

    const sessionRecord = {
      id: historyItem.id,
      timestamp: Date.now(),
      context: activeContext,
      goal: 'Two-Way Room Chat',
      messages,
      confirmedFacts: messages.filter(m => m.understanding === 'understood').map(m => `Understood: ${m.text}`),
      unresolvedQuestions: messages.filter(m => m.understanding === 'unclear').map(m => `Unclear turn: ${m.text}`)
    };
    const existingSessions = JSON.parse(localStorage.getItem('signmitra_ai_sessions') || '[]');
    localStorage.setItem('signmitra_ai_sessions', JSON.stringify([sessionRecord, ...existingSessions]));

    if (onSaveSession) onSaveSession(sessionRecord);
    setSavedTranscriptMsg(true);
    setTimeout(() => setSavedTranscriptMsg(false), 3000);
  };

  // Font size class mapping
  const sizeClasses = {
    normal: 'text-sm sm:text-base',
    large: 'text-base sm:text-xl font-bold',
    xlarge: 'text-xl sm:text-2xl font-black'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}>
              TWO-WAY COMMUNICATION ROOM
            </span>
            <span className="text-xs font-mono opacity-70">
              Context: {activeContext}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            Live Counter Exchange
          </h2>
        </div>

        {/* Display and Speech Preferences */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Caption Size selector */}
          <div className={`flex items-center p-1 rounded-lg border ${borderTone} ${cardInnerBg}`}>
            <span className="text-[10px] font-mono uppercase px-2 opacity-60">Size:</span>
            {['normal', 'large', 'xlarge'].map((sz) => (
              <button
                key={sz}
                onClick={() => setCaptionSize(sz)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                  captionSize === sz ? accentSolid : 'opacity-60 hover:opacity-100'
                }`}
              >
                {sz === 'xlarge' ? 'XL' : sz[0].toUpperCase()}
              </button>
            ))}
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
              highContrast ? 'bg-black text-yellow-300 border-yellow-300' : `${cardInnerBg} ${borderTone}`
            }`}
          >
            {highContrast ? 'High Contrast: ON' : 'High Contrast: OFF'}
          </button>

          {/* STT Language Selector */}
          <select
            value={sttLanguage}
            onChange={(e) => setSttLanguage(e.target.value)}
            className={`p-1.5 rounded-lg border text-xs font-mono font-bold outline-none ${cardInnerBg} ${borderTone}`}
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi (India)</option>
            <option value="ta-IN">Tamil (India)</option>
            <option value="te-IN">Telugu (India)</option>
            <option value="kn-IN">Kannada (India)</option>
            <option value="bn-IN">Bengali (India)</option>
          </select>

          {/* Save Transcript Button */}
          <button
            onClick={handleSaveTranscript}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 ${
              savedTranscriptMsg ? 'bg-green-600 text-white border-green-600' : `${accentSolid} hover:opacity-90`
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savedTranscriptMsg ? 'Transcript Saved!' : 'Save Transcript'}</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className={`p-4 sm:p-6 rounded-2xl border-2 ${borderTone} ${highContrast ? 'bg-black text-white' : cardBg} space-y-4 min-h-[360px] max-h-[500px] overflow-y-auto shadow-inner`}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isStaff = msg.sender === 'staff';

          return (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl border transition-all ${
                isUser
                  ? `ml-auto max-w-[85%] sm:max-w-[75%] ${isDarkTheme ? 'bg-[#AB92BF]/30' : 'bg-[#655A7C]/10'} ${borderTone}`
                  : `mr-auto max-w-[90%] sm:max-w-[85%] ${cardInnerBg} ${borderTone}`
              }`}
            >
              {/* Turn Header */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isUser ? accentSolid : 'bg-blue-600 text-white'
                  }`}>
                    {isUser ? 'YOU (USER)' : 'STAFF / OTHER PERSON'}
                  </span>
                  <span className="text-[10px] font-mono opacity-50">{msg.timestamp}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* TTS speak button (User initiated) */}
                  {ttsSupported && (
                    <button
                      onClick={() => isSpeaking && speakingMessageId === msg.id ? stopSpeaking() : speakText(msg.text, msg.id)}
                      className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 ${cardInnerBg} ${borderTone} hover:opacity-80 transition-all`}
                      title="Speak message aloud using Text-to-Speech"
                    >
                      {isSpeaking && speakingMessageId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Giant fullscreen card display for counter presentation */}
                  <button
                    onClick={() => setFullscreenCard(msg.text)}
                    className={`p-1.5 rounded-lg border text-xs font-mono ${cardInnerBg} ${borderTone} hover:opacity-80 transition-all`}
                    title="Present in fullscreen high-contrast card"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className={`p-1.5 rounded-lg border text-xs font-mono ${cardInnerBg} ${borderTone} hover:opacity-80 transition-all`}
                    title="Copy text"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <p className={`leading-relaxed ${sizeClasses[captionSize]} ${highContrast ? 'text-yellow-300 font-bold' : ''}`}>
                {msg.text}
              </p>

              {/* Staff Turn Comprehension / Recovery Controls */}
              {isStaff && (
                <div className="mt-3 pt-2.5 border-t border-dashed flex flex-wrap items-center justify-between gap-2" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase opacity-60">My comprehension:</span>
                    <button
                      onClick={() => markUnderstanding(msg.id, 'understood')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
                        msg.understanding === 'understood' ? 'bg-green-600 text-white border-green-600' : `${cardInnerBg} ${borderTone}`
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Understood</span>
                    </button>

                    <button
                      onClick={() => markUnderstanding(msg.id, 'unclear')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
                        msg.understanding === 'unclear' ? 'bg-orange-500 text-white border-orange-500' : `${cardInnerBg} ${borderTone}`
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Unclear</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Send to plain-language explainer */}
                    {onSendToExplainer && (
                      <button
                        onClick={() => onSendToExplainer(msg.text)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${accentSolid} hover:opacity-90`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Explain in Plain Language</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Interim Transcript Bubble */}
        {isListening && (
          <div className={`p-4 rounded-2xl border-2 border-red-500/50 bg-red-500/10 mr-auto max-w-[85%] animate-pulse`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400">
                Live Subtitles Active (Consent Recommended)
              </span>
            </div>
            <p className={`font-mono italic ${sizeClasses[captionSize]} text-red-950 dark:text-red-200`}>
              {interimTranscript || 'Listening to staff speech... Speak into microphone.'}
            </p>
          </div>
        )}
      </div>

      {/* Two-Way Input Station */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Column: User -> Other Person (Compose & Preset Cards) */}
        <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 flex flex-col justify-between shadow-sm`}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>You: Show or Speak to Staff</span>
              </label>
              <span className="text-[10px] font-mono opacity-50">Large Visual Card Display</span>
            </div>

            <textarea
              value={userDraft}
              onChange={(e) => setUserDraft(e.target.value)}
              placeholder="Type your message to show staff or tap a preset card below..."
              rows={3}
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] resize-none ${cardInnerBg} ${borderTone}`}
            />

            {/* User Quick Presets */}
            <div className="mt-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                1-Tap Communication Cards:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CARDS.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserDraft(card.text);
                      handleSendUserMessage(card.text);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${cardInnerBg} ${borderTone} hover:border-[#655A7C] active:scale-95`}
                  >
                    "{card.label}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => handleSendUserMessage()}
              disabled={!userDraft.trim()}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all ${
                userDraft.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-40 cursor-not-allowed border ' + borderTone
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Display Card</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => userDraft.trim() && setFullscreenCard(userDraft)}
              disabled={!userDraft.trim()}
              className={`py-3 px-4 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-80 transition-all ${
                userDraft.trim() ? '' : 'opacity-40 cursor-not-allowed'
              }`}
              title="Show in giant fullscreen card"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Right Column: Other Person -> User (Speech to Text & Manual Typing) */}
        <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 flex flex-col justify-between shadow-sm`}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Staff: Speech Subtitles or Typing</span>
              </label>

              {/* Speech-To-Text Action Button */}
              {sttSupported ? (
                <button
                  onClick={toggleListening}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-2 transition-all ${
                    isListening ? 'bg-red-600 text-white animate-pulse' : `${cardInnerBg} border ${borderTone} hover:border-[#655A7C]`
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Stop Subtitles' : 'Live Caption Staff'}</span>
                </button>
              ) : (
                <span className="text-[10px] font-mono text-orange-500 font-bold">
                  Speech API Unsupported · Use Manual Typing
                </span>
              )}
            </div>

            <textarea
              value={staffManualDraft}
              onChange={(e) => setStaffManualDraft(e.target.value)}
              placeholder="Staff can type their response here if speech subtitles are unclear..."
              rows={3}
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] resize-none ${cardInnerBg} ${borderTone}`}
            />

            <div className="flex items-center justify-between text-[11px] font-mono opacity-60 mt-1">
              <span>{isListening ? 'Microphone stream active' : 'Microphone idle'}</span>
              <span>Audio never stored on external server</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleSendStaffManual}
              disabled={!staffManualDraft.trim()}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all ${
                staffManualDraft.trim() ? `${cardInnerBg} border-2 ${borderTone} hover:border-[#655A7C]` : 'opacity-40 cursor-not-allowed border ' + borderTone
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Record Written Response</span>
            </button>

            {/* Clear conversation */}
            <button
              onClick={() => {
                if (confirm('Clear current room conversation?')) {
                  setMessages([]);
                }
              }}
              className={`p-3 rounded-xl border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all text-xs font-mono`}
              title="Clear Room"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* FULLSCREEN COMMUNICATION CARD MODAL */}
      {fullscreenCard && (
        <div className={`fixed inset-0 z-[120] flex flex-col justify-between p-6 sm:p-12 ${bgCanvas} ${textPrimary} animate-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg}`}>
                FULLSCREEN COMMUNICATION CARD
              </span>
              {ttsSupported && (
                <button
                  onClick={() => speakText(fullscreenCard)}
                  className={`px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-mono font-bold text-xs flex items-center gap-1.5 hover:opacity-80 transition-all`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Speak Aloud</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setFullscreenCard(null)}
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${accentSolid} font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all`}
            >
              Close Card [Esc]
            </button>
          </div>

          <div className="text-center my-auto px-4 max-w-4xl mx-auto">
            <div className={`py-12 sm:py-24 px-8 rounded-3xl border-8 ${isDarkTheme ? 'border-[#FDF1E2] bg-[#AB92BF]/10' : 'border-[#655A7C] bg-[#655A7C]/5'} shadow-2xl`}>
              <p className="text-3xl sm:text-6xl font-black tracking-tight leading-tight">
                "{fullscreenCard}"
              </p>
            </div>
          </div>

          <div className="text-center text-xs font-mono font-bold uppercase tracking-widest opacity-60">
            Show this high-contrast screen directly to the counter staff
          </div>
        </div>
      )}

    </div>
  );
}
