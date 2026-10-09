'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Copy,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  User,
  Users,
  Trash2,
  Save,
  Check,
  X
} from 'lucide-react';

export default function TwoWayRoom({
  onSendToExplainer,
  onSaveSession,
  activeContext = 'General Interaction'
}) {
  const {
    bgCanvas,
    textPrimary,
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme
  } = useTheme();

  // ---------------------------------------------------------------------------
  // Conversation
  // ---------------------------------------------------------------------------

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'user',
      text:
        'Hello. I communicate using Indian Sign Language and written text. Please speak clearly into the microphone or write your reply.',
      timestamp: '10:00 AM',
      status: 'confirmed',
      understanding: null
    }
  ]);

  const [userDraft, setUserDraft] = useState('');
  const [staffManualDraft, setStaffManualDraft] = useState('');

  // ---------------------------------------------------------------------------
  // Speech Recognition
  // ---------------------------------------------------------------------------

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(false);
  const [sttLanguage, setSttLanguage] = useState('en-IN');
  const recognitionRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Text To Speech
  // ---------------------------------------------------------------------------

  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  const [captionSize, setCaptionSize] = useState('large');
  const [highContrast, setHighContrast] = useState(false);
  const [fullscreenCard, setFullscreenCard] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [savedTranscriptMsg, setSavedTranscriptMsg] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ---------------------------------------------------------------------------
  // Quick communication cards
  // ---------------------------------------------------------------------------

  const PRESET_CARDS = [
    {
      label: 'Please write down',
      text: 'Could you please write down the counter number and instructions?'
    },
    {
      label: 'Need visual alert',
      text: 'Please alert me visually when my token or name is called.'
    },
    {
      label: 'Which counter?',
      text: 'Which counter or room do I need to visit next?'
    },
    {
      label: 'What documents?',
      text: 'Which specific documents or forms do I need to submit?'
    },
    {
      label: 'How much fee?',
      text: 'Is there any fee or payment required? Please write the amount.'
    },
    {
      label: 'Repeat please',
      text: 'Could you please explain that again more slowly?'
    }
  ];

  // ---------------------------------------------------------------------------
  // Speech APIs
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSttSupported(true);

      const recognizer = new SpeechRecognition();

      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = sttLanguage;

      recognizer.onresult = (event) => {
        let interim = '';
        let finalized = '';

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          const transcript =
            event.results[i][0]?.transcript || '';

          if (event.results[i].isFinal) {
            finalized += transcript;
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);

        if (finalized.trim()) {
          const newTurn = {
            id: `stt-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            sender: 'staff',
            text: finalized.trim(),
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            isPartial: false,
            understanding: null,
            status: 'captured'
          };

          setMessages((prev) => [...prev, newTurn]);
          setInterimTranscript('');
        }
      };

      recognizer.onerror = (event) => {
        console.warn(
          'Browser speech recognition error:',
          event.error
        );

        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    }

    if ('speechSynthesis' in window) {
      setTtsSupported(true);

      const loadVoices = () => {
        const availableVoices =
          window.speechSynthesis.getVoices();

        setVoices(availableVoices);

        setSelectedVoiceURI((currentURI) => {
          if (currentURI) return currentURI;

          const savedVoice = localStorage.getItem(
            'signmitra_preferred_voice'
          );

          if (
            savedVoice &&
            availableVoices.some(
              (voice) => voice.voiceURI === savedVoice
            )
          ) {
            return savedVoice;
          }

          const preferredVoice =
            availableVoices.find((voice) =>
              voice.lang
                .toLowerCase()
                .startsWith('en-in')
            ) ||
            availableVoices.find((voice) =>
              voice.lang
                .toLowerCase()
                .startsWith('en-us')
            ) ||
            availableVoices[0];

          return preferredVoice?.voiceURI || '';
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

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }

        window.speechSynthesis.cancel();
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = sttLanguage;
    }
  }, [sttLanguage]);

  useEffect(() => {
  if (!fullscreenCard) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [fullscreenCard]);

  // ---------------------------------------------------------------------------
  // Speech Recognition
  // ---------------------------------------------------------------------------

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}

      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    setInterimTranscript('');

    try {
      recognitionRef.current.lang = sttLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error(
        'Failed to start browser speech recognition:',
        error
      );

      setIsListening(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Text To Speech
  // ---------------------------------------------------------------------------

  const speakText = (text, id = null) => {
    if (
      !ttsSupported ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    if (selectedVoiceURI) {
      const selectedVoice = voices.find(
        (voice) => voice.voiceURI === selectedVoiceURI
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(id);
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
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  // ---------------------------------------------------------------------------
  // User message
  // ---------------------------------------------------------------------------

  const handleSendUserMessage = (textToSend = null) => {
    const text = textToSend ?? userDraft;

    if (!text.trim()) return;

    const newMessage = {
      id: `usr-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'confirmed',
      understanding: null
    };

    setMessages((prev) => [...prev, newMessage]);

    if (!textToSend) {
      setUserDraft('');
    }
  };

  // ---------------------------------------------------------------------------
  // Staff manual response
  // ---------------------------------------------------------------------------

  const handleSendStaffManual = () => {
    if (!staffManualDraft.trim()) return;

    const newMessage = {
      id: `stf-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      sender: 'staff',
      text: staffManualDraft.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      understanding: null,
      status: 'captured'
    };

    setMessages((prev) => [...prev, newMessage]);
    setStaffManualDraft('');
  };

  // ---------------------------------------------------------------------------
  // Understanding
  // ---------------------------------------------------------------------------

  const markUnderstanding = (messageId, status) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              understanding: status
            }
          : message
      )
    );
  };

  // ---------------------------------------------------------------------------
  // Copy
  // ---------------------------------------------------------------------------

  const handleCopy = async (text, id) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(text);

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId((current) =>
          current === id ? null : current
        );
      }, 2000);
    } catch (error) {
      console.warn(
        'Unable to copy message:',
        error
      );
    }
  };

  // ===========================================================================
  // SAVE COMPLETE TRANSCRIPT
  // ===========================================================================

  const handleSaveTranscript = () => {
    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      setSaveError(
        'There is no conversation to save.'
      );
      return;
    }

    setSaveError('');

    try {
      const now = Date.now();
      const isoTimestamp =
        new Date(now).toISOString();

      // -----------------------------------------------------------------------
      // Create a completely independent snapshot.
      // -----------------------------------------------------------------------

      const transcriptMessages = messages.map(
        (message) => ({
          id: message.id,
          sender: message.sender,
          text: message.text,
          timestamp: message.timestamp,
          status: message.status || null,
          understanding:
            message.understanding || null,
          isPartial: Boolean(message.isPartial)
        })
      );

      // -----------------------------------------------------------------------
      // Human-readable transcript
      // -----------------------------------------------------------------------

      const fullTranscript =
        transcriptMessages
          .map((message) => {
            const speaker =
              message.sender === 'user'
                ? 'USER'
                : 'STAFF';

            const understanding =
              message.understanding
                ? ` [${message.understanding}]`
                : '';

            return `[${message.timestamp}] ${speaker}${understanding}: ${message.text}`;
          })
          .join('\n');

      // -----------------------------------------------------------------------
      // Confirmed / unclear turns
      // -----------------------------------------------------------------------

      const confirmedFacts =
        transcriptMessages
          .filter(
            (message) =>
              message.understanding ===
              'understood'
          )
          .map(
            (message) =>
              `Understood: ${message.text}`
          );

      const unresolvedQuestions =
        transcriptMessages
          .filter(
            (message) =>
              message.understanding ===
              'unclear'
          )
          .map(
            (message) =>
              `Unclear turn: ${message.text}`
          );

      // =========================================================================
      // REQUEST HISTORY
      // =========================================================================

      const historyItem = {
        id: `AI-CHAT-${now}`,
        domain: activeContext,
        intent: 'Two-Way Conversation Session',
        title: `${activeContext} Room Transcript`,
        date: new Date(now).toLocaleDateString(),
        time: new Date(now).toLocaleTimeString(),
        timestamp: now,
        isoTimestamp,
        status: 'Completed',
        verifiedByStaff: false,

        // CRITICAL: complete structured transcript
        messages: transcriptMessages,

        // CRITICAL: complete text transcript
        transcript: fullTranscript,

        entities: {
          'Turns Count':
            `${transcriptMessages.length} messages`,

          Participants:
            'User + Staff',

          Context:
            activeContext,

          'Full Transcript':
            fullTranscript,

          'Confirmed Turns':
            confirmedFacts.length > 0
              ? confirmedFacts.join('\n')
              : 'None',

          'Unclear Turns':
            unresolvedQuestions.length > 0
              ? unresolvedQuestions.join('\n')
              : 'None',

          'Last Message':
            transcriptMessages[
              transcriptMessages.length - 1
            ]?.text || ''
        },

        confirmedFacts,
        unresolvedQuestions
      };

      // =========================================================================
      // SAVED AI SESSION
      // =========================================================================

      const sessionRecord = {
        id: historyItem.id,
        timestamp: now,
        isoTimestamp,

        context: activeContext,
        goal: 'Two-Way Room Chat',
        title: `${activeContext} Room Transcript`,

        status: 'Completed',
        verifiedByStaff: false,

        // CRITICAL: complete messages
        messages: transcriptMessages,

        // CRITICAL: complete transcript
        transcript: fullTranscript,

        messageCount:
          transcriptMessages.length,

        userMessageCount:
          transcriptMessages.filter(
            (message) =>
              message.sender === 'user'
          ).length,

        staffMessageCount:
          transcriptMessages.filter(
            (message) =>
              message.sender === 'staff'
          ).length,

        confirmedFacts,
        unresolvedQuestions,

        capturedText:
          transcriptMessages
            .filter(
              (message) =>
                message.sender === 'staff'
            )
            .map(
              (message) => message.text
            )
            .join('\n') || '',

        metadata: {
          source: 'TwoWayRoom',
          storage: 'browser-localStorage',
          speechRecognitionLanguage:
            sttLanguage,

          speechRecognitionUsed:
            transcriptMessages.some(
              (message) =>
                message.id?.startsWith('stt-')
            ),

          textToSpeechAvailable:
            ttsSupported,

          savedAt: isoTimestamp
        }
      };

      // =========================================================================
      // READ EXISTING HISTORY
      // =========================================================================

      let existingHistory = [];

      try {
        const raw =
          localStorage.getItem(
            'signmitra_history'
          );

        const parsed = raw
          ? JSON.parse(raw)
          : [];

        if (Array.isArray(parsed)) {
          existingHistory = parsed;
        }
      } catch (error) {
        console.warn(
          'Could not parse existing history. Starting fresh.',
          error
        );
      }

      // =========================================================================
      // READ EXISTING SESSIONS
      // =========================================================================

      let existingSessions = [];

      try {
        const raw =
          localStorage.getItem(
            'signmitra_ai_sessions'
          );

        const parsed = raw
          ? JSON.parse(raw)
          : [];

        if (Array.isArray(parsed)) {
          existingSessions = parsed;
        }
      } catch (error) {
        console.warn(
          'Could not parse existing sessions. Starting fresh.',
          error
        );
      }

      // =========================================================================
      // WRITE BOTH STORAGE LEDGERS
      // =========================================================================

      const updatedHistory = [
        historyItem,
        ...existingHistory.filter(
          (record) =>
            record.id !== historyItem.id
        )
      ];

      const updatedSessions = [
        sessionRecord,
        ...existingSessions.filter(
          (session) =>
            session.id !== sessionRecord.id
        )
      ];

      localStorage.setItem(
        'signmitra_history',
        JSON.stringify(updatedHistory)
      );

      localStorage.setItem(
        'signmitra_ai_sessions',
        JSON.stringify(updatedSessions)
      );

      // =========================================================================
      // READ-BACK VERIFICATION
      // =========================================================================

      const verifiedHistory =
        JSON.parse(
          localStorage.getItem(
            'signmitra_history'
          ) || '[]'
        );

      const verifiedSessions =
        JSON.parse(
          localStorage.getItem(
            'signmitra_ai_sessions'
          ) || '[]'
        );

      const historyRecord =
        verifiedHistory.find(
          (record) =>
            record.id === historyItem.id
        );

      const sessionRecordFromStorage =
        verifiedSessions.find(
          (session) =>
            session.id ===
            sessionRecord.id
        );

      const historyVerified =
        Boolean(
          historyRecord &&
          Array.isArray(
            historyRecord.messages
          ) &&
          historyRecord.messages.length ===
            transcriptMessages.length &&
          historyRecord.transcript ===
            fullTranscript
        );

      const sessionVerified =
        Boolean(
          sessionRecordFromStorage &&
          Array.isArray(
            sessionRecordFromStorage.messages
          ) &&
          sessionRecordFromStorage.messages
            .length ===
            transcriptMessages.length &&
          sessionRecordFromStorage.transcript ===
            fullTranscript
        );

      if (
        !historyVerified ||
        !sessionVerified
      ) {
        throw new Error(
          'Complete transcript verification failed.'
        );
      }

      // =========================================================================
      // NOTIFY OTHER COMPONENTS
      // =========================================================================

      window.dispatchEvent(
        new Event(
          'signmitra:history-updated'
        )
      );

      window.dispatchEvent(
        new Event(
          'signmitra:sessions-updated'
        )
      );

      // Parent callback
      if (onSaveSession) {
        onSaveSession(sessionRecord);
      }

      // Success state
      setSavedTranscriptMsg(true);

      setTimeout(() => {
        setSavedTranscriptMsg(false);
      }, 3000);

      console.info(
        'SignMitra transcript saved and verified.',
        {
          id: historyItem.id,
          messages:
            transcriptMessages.length,
          historyVerified,
          sessionVerified
        }
      );
    } catch (error) {
      console.error(
        'Failed to save complete transcript:',
        error
      );

      setSavedTranscriptMsg(false);

      setSaveError(
        error?.name ===
          'QuotaExceededError'
          ? 'Browser storage is full. Delete older sessions and try again.'
          : 'Unable to save the transcript on this device.'
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Fullscreen keyboard accessibility
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!fullscreenCard) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setFullscreenCard(null);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [fullscreenCard]);

  // ---------------------------------------------------------------------------
  // Caption sizes
  // ---------------------------------------------------------------------------

  const sizeClasses = {
    normal: 'text-sm sm:text-base',
    large: 'text-base sm:text-xl font-bold',
    xlarge: 'text-xl sm:text-2xl font-black'
  };

  // ===========================================================================
  // UI
  // ===========================================================================

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}
            >
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

        <div className="flex flex-wrap items-center gap-2">

          {/* Caption size */}
          <div
            className={`flex items-center p-1 rounded-lg border ${borderTone} ${cardInnerBg}`}
          >
            <span className="text-[10px] font-mono uppercase px-2 opacity-60">
              Size:
            </span>

            {[
              'normal',
              'large',
              'xlarge'
            ].map((size) => (
              <button
                key={size}
                onClick={() =>
                  setCaptionSize(size)
                }
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                  captionSize === size
                    ? accentSolid
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {size === 'xlarge'
                  ? 'XL'
                  : size[0].toUpperCase()}
              </button>
            ))}
          </div>

          {/* High contrast */}
          <button
            onClick={() =>
              setHighContrast(
                (value) => !value
              )
            }
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
              highContrast
                ? 'bg-black text-yellow-300 border-yellow-300'
                : `${cardInnerBg} ${borderTone}`
            }`}
          >
            {highContrast
              ? 'High Contrast: ON'
              : 'High Contrast: OFF'}
          </button>

          {/* Speech language */}
          <select
            value={sttLanguage}
            onChange={(event) =>
              setSttLanguage(
                event.target.value
              )
            }
            className={`p-1.5 rounded-lg border text-xs font-mono font-bold outline-none ${cardInnerBg} ${borderTone}`}
            aria-label="Speech recognition language"
          >
            <option value="en-IN">
              English (India)
            </option>
            <option value="hi-IN">
              Hindi (India)
            </option>
            <option value="ta-IN">
              Tamil (India)
            </option>
            <option value="te-IN">
              Telugu (India)
            </option>
            <option value="kn-IN">
              Kannada (India)
            </option>
            <option value="bn-IN">
              Bengali (India)
            </option>
          </select>

          {/* Save */}
          <button
            onClick={handleSaveTranscript}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 ${
              savedTranscriptMsg
                ? 'bg-green-600 text-white border-green-600'
                : accentSolid
            }`}
          >
            {savedTranscriptMsg ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}

            <span>
              {savedTranscriptMsg
                ? 'Transcript Saved!'
                : 'Save Transcript'}
            </span>
          </button>
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-mono font-bold">
          {saveError}
        </div>
      )}

      {/* Conversation */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border-2 ${borderTone} ${
          highContrast
            ? 'bg-black text-white'
            : cardBg
        } space-y-4 min-h-[360px] max-h-[500px] overflow-y-auto shadow-inner`}
      >
        {messages.length === 0 && (
          <div className="min-h-[300px] flex items-center justify-center text-center opacity-60">
            <div>
              <Users className="w-8 h-8 mx-auto mb-2" />

              <p className="font-mono text-xs uppercase tracking-wider">
                Conversation cleared
              </p>

              <p className="text-sm mt-1">
                Start a new message to continue.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser =
            message.sender === 'user';

          const isStaff =
            message.sender === 'staff';

          return (
            <div
              key={message.id}
              className={`p-4 rounded-2xl border transition-all ${
                isUser
                  ? `ml-auto max-w-[85%] sm:max-w-[75%] ${
                      isDarkTheme
                        ? 'bg-[#AB92BF]/30'
                        : 'bg-[#655A7C]/10'
                    } ${borderTone}`
                  : `mr-auto max-w-[90%] sm:max-w-[85%] ${cardInnerBg} ${borderTone}`
              }`}
            >
              <div
                className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-dashed"
                style={{
                  borderColor: isDarkTheme
                    ? '#AB92BF30'
                    : '#655A7C20'
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isUser
                        ? accentSolid
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isUser
                      ? 'YOU (USER)'
                      : 'STAFF / OTHER PERSON'}
                  </span>

                  <span className="text-[10px] font-mono opacity-50">
                    {message.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">

                  {ttsSupported && (
                    <button
                      onClick={() =>
                        isSpeaking &&
                        speakingMessageId ===
                          message.id
                          ? stopSpeaking()
                          : speakText(
                              message.text,
                              message.id
                            )
                      }
                      className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 ${cardInnerBg} ${borderTone} hover:opacity-80 transition-all`}
                      title="Speak message aloud"
                      aria-label="Speak message aloud"
                    >
                      {isSpeaking &&
                      speakingMessageId ===
                        message.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setFullscreenCard(
                        message.text
                      )
                    }
                    className={`p-1.5 rounded-lg border text-xs font-mono ${cardInnerBg} ${borderTone} hover:opacity-80 transition-all`}
                    title="Present in fullscreen high-contrast card"
                    aria-label="Present message fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      handleCopy(
                        message.text,
                        message.id
                      )
                    }
                    className={`p-1.5 rounded-lg border text-xs font-mono ${cardInnerBg} ${borderTone} hover:opacity-80 transition-all`}
                    title="Copy text"
                    aria-label="Copy message text"
                  >
                    {copiedId ===
                    message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <p
                className={`leading-relaxed ${
                  sizeClasses[captionSize]
                } ${
                  highContrast
                    ? 'text-yellow-300 font-bold'
                    : ''
                }`}
              >
                {message.text}
              </p>

              {isStaff && (
                <div
                  className="mt-3 pt-2.5 border-t border-dashed flex flex-wrap items-center justify-between gap-2"
                  style={{
                    borderColor: isDarkTheme
                      ? '#AB92BF30'
                      : '#655A7C20'
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono uppercase opacity-60">
                      My comprehension:
                    </span>

                    <button
                      onClick={() =>
                        markUnderstanding(
                          message.id,
                          'understood'
                        )
                      }
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
                        message.understanding ===
                        'understood'
                          ? 'bg-green-600 text-white border-green-600'
                          : `${cardInnerBg} ${borderTone}`
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Understood</span>
                    </button>

                    <button
                      onClick={() =>
                        markUnderstanding(
                          message.id,
                          'unclear'
                        )
                      }
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
                        message.understanding ===
                        'unclear'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : `${cardInnerBg} ${borderTone}`
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Unclear</span>
                    </button>
                  </div>

                  {onSendToExplainer && (
                    <button
                      onClick={() =>
                        onSendToExplainer(
                          message.text
                        )
                      }
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${accentSolid} hover:opacity-90`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>
                        Explain in Plain Language
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isListening && (
          <div className="p-4 rounded-2xl border-2 border-red-500/50 bg-red-500/10 mr-auto max-w-[85%] animate-pulse">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />

              <span className="text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400">
                Live Subtitles Active
              </span>
            </div>

            <p
              className={`font-mono italic ${sizeClasses[captionSize]} text-red-950 dark:text-red-200`}
            >
              {interimTranscript ||
                'Listening to staff speech... Speak into microphone.'}
            </p>
          </div>
        )}
      </div>

      {/* Input station */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* User */}
        <div
          className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 flex flex-col justify-between shadow-sm`}
        >
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>
                  You: Show or Speak to Staff
                </span>
              </label>

              <span className="text-[10px] font-mono opacity-50">
                Large Visual Card Display
              </span>
            </div>

            <textarea
              value={userDraft}
              onChange={(event) =>
                setUserDraft(
                  event.target.value
                )
              }
              placeholder="Type your message to show staff or tap a preset card below..."
              rows={3}
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] resize-none ${cardInnerBg} ${borderTone}`}
            />

            <div className="mt-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block mb-1.5">
                1-Tap Communication Cards:
              </span>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_CARDS.map(
                  (card, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleSendUserMessage(
                          card.text
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${cardInnerBg} ${borderTone} hover:border-[#655A7C] active:scale-95`}
                    >
                      "{card.label}"
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() =>
                handleSendUserMessage()
              }
              disabled={!userDraft.trim()}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all ${
                userDraft.trim()
                  ? `${accentSolid} hover:opacity-90`
                  : `opacity-40 cursor-not-allowed border ${borderTone}`
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Display Card</span>
            </button>

            <button
              onClick={() =>
                userDraft.trim() &&
                setFullscreenCard(
                  userDraft
                )
              }
              disabled={!userDraft.trim()}
              className={`py-3 px-4 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-80 transition-all ${
                userDraft.trim()
                  ? ''
                  : 'opacity-40 cursor-not-allowed'
              }`}
              title="Show in giant fullscreen card"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Staff */}
        <div
          className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 flex flex-col justify-between shadow-sm`}
        >
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>
                  Staff: Speech Subtitles or Typing
                </span>
              </label>

              {sttSupported ? (
                <button
                  onClick={toggleListening}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-2 transition-all ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : `${cardInnerBg} border ${borderTone} hover:border-[#655A7C]`
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}

                  <span>
                    {isListening
                      ? 'Stop Subtitles'
                      : 'Live Caption Staff'}
                  </span>
                </button>
              ) : (
                <span className="text-[10px] font-mono text-orange-500 font-bold">
                  Browser Speech Recognition Unsupported · Use Manual Typing
                </span>
              )}
            </div>

            <textarea
              value={staffManualDraft}
              onChange={(event) =>
                setStaffManualDraft(
                  event.target.value
                )
              }
              placeholder="Staff can type their response here if speech subtitles are unclear..."
              rows={3}
              className={`w-full p-3 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] resize-none ${cardInnerBg} ${borderTone}`}
            />

            <div className="flex items-center justify-between text-[11px] font-mono opacity-60 mt-1 gap-3">
              <span>
                {isListening
                  ? 'Browser microphone speech recognition active'
                  : 'Microphone idle'}
              </span>

              <span className="text-right">
                SignMitra does not store microphone audio.
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleSendStaffManual}
              disabled={!staffManualDraft.trim()}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all ${
                staffManualDraft.trim()
                  ? `${cardInnerBg} border-2 ${borderTone} hover:border-[#655A7C]`
                  : `opacity-40 cursor-not-allowed border ${borderTone}`
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                Record Written Response
              </span>
            </button>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Clear current room conversation?'
                  )
                ) {
                  setMessages([]);
                  setInterimTranscript('');
                  setSaveError('');
                }
              }}
              className={`p-3 rounded-xl border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all text-xs font-mono`}
              title="Clear Room"
              aria-label="Clear room conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen card */}
      {fullscreenCard && (
        <div
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: '#9ca3af #f3f4f6',
  }}
  className={`fixed inset-0 z-[120] flex flex-col justify-between overflow-y-auto overflow-x-hidden overscroll-contain p-6 sm:p-12 ${bgCanvas} ${textPrimary}`}
  role="dialog"
  aria-modal="true"
  aria-label="Fullscreen communication card"
>
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg}`}
              >
                FULLSCREEN COMMUNICATION CARD
              </span>

              {ttsSupported && (
                <button
                  onClick={() =>
                    speakText(fullscreenCard)
                  }
                  className={`px-4 py-2 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-mono font-bold text-xs flex items-center gap-1.5 hover:opacity-80 transition-all`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Speak Aloud</span>
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setFullscreenCard(null)
              }
              className={`px-6 py-3 rounded-xl border-2 ${borderTone} ${accentSolid} font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2`}
            >
              <X className="w-4 h-4" />
              Close Card
            </button>
          </div>

          <div className="text-center my-auto px-4 max-w-4xl mx-auto w-full">
            <div
              className={`py-12 sm:py-24 px-8 rounded-3xl border-8 ${
                isDarkTheme
                  ? 'border-[#FDF1E2] bg-[#AB92BF]/10'
                  : 'border-[#655A7C] bg-[#655A7C]/5'
              } shadow-2xl`}
            >
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