'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Trash2,
  Volume2,
  Maximize2,
  Minimize2,
  User,
  Users,
  Wrench,
  HelpCircle,
  CheckSquare,
  FileDown,
  X,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  ListTodo
} from 'lucide-react';

const REPAIR_PHRASES = [
  "I didn't understand the last message.",
  "Please rephrase that in simpler terms.",
  "Could you write that down clearly?",
  "Please communicate one step at a time.",
  "Let's confirm the important details."
];

const DETAIL_TYPES = [
  { id: 'datetime', label: 'Date & Time', icon: Clock },
  { id: 'location', label: 'Room / Counter', icon: MapPin },
  { id: 'document', label: 'Required Document', icon: FileText },
  { id: 'amount', label: 'Amount / Fee', icon: CreditCard },
  { id: 'action', label: 'Next Action', icon: ListTodo }
];

export default function ConversationAssist() {
  const router = useRouter();
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'intro', 
      text: 'Hello, I am using SignMitra to assist with our communication. Please type your responses below.', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  
  const [userText, setUserText] = useState('');
  const [staffText, setStaffText] = useState('');
  const [activeLargeText, setActiveLargeText] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  
  const [showRepairToolkit, setShowRepairToolkit] = useState(false);
  const [showConfirmBack, setShowConfirmBack] = useState(false);
  
  // Detail-by-Detail Confirm State
  const [confirmDetailType, setConfirmDetailType] = useState(DETAIL_TYPES[4].id);
  const [confirmDetailValue, setConfirmDetailValue] = useState('');

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [addToPlanner, setAddToPlanner] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, showRepairToolkit, showConfirmBack]);

  const handleUserMessage = (textToSend = null, isToolkit = false) => {
    const content = textToSend || userText;
    if (!content.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text: content.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setUserText('');
    setShowRepairToolkit(false);
  };

  const handleDetailConfirmRequest = () => {
    if (!confirmDetailValue.trim()) return;

    const typeObj = DETAIL_TYPES.find(t => t.id === confirmDetailType);
    
    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text: `Please confirm this detail:\n[${typeObj.label}] ${confirmDetailValue.trim()}`,
      isConfirmBackRequest: true,
      confirmData: {
        typeId: confirmDetailType,
        typeLabel: typeObj.label,
        value: confirmDetailValue.trim(),
        status: 'pending' // pending, confirmed, clarification_needed
      },
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setConfirmDetailValue('');
    setShowConfirmBack(false);
  };

  const handleStaffMessage = (replyText = null) => {
    const content = replyText || staffText;
    if (!content.trim()) return;

    const staffMessage = {
      id: Date.now(),
      sender: 'staff',
      text: content.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, staffMessage]);
    setStaffText('');
  };

  const handleStaffDetailVerification = (msgId, verificationStatus) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.isConfirmBackRequest) {
        return {
          ...msg,
          confirmData: { ...msg.confirmData, status: verificationStatus }
        };
      }
      return msg;
    }));

    // Auto-generate a staff reply based on their verification click
    const autoReply = verificationStatus === 'confirmed' 
      ? "Yes, that detail is correct." 
      : "No, that is incorrect. Let me clarify.";
    
    handleStaffMessage(autoReply);
  };

  const clearConversation = () => {
    if (confirm("Clear this conversation history?")) {
      setMessages([]);
    }
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

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const getExtractedDetails = () => {
    const details = [];
    messages.forEach(msg => {
      if (msg.isConfirmBackRequest && msg.confirmData) {
        const existingIdx = details.findIndex(d => d.typeId === msg.confirmData.typeId && d.value === msg.confirmData.value);
        if (existingIdx >= 0) {
          details[existingIdx] = msg.confirmData;
        } else {
          details.push(msg.confirmData);
        }
      }
    });
    return details;
  };

  const handleSaveSummary = (e) => {
    e.preventDefault();
    
    const details = getExtractedDetails();
    // Grab all messages except the bot intro
    const allMessages = messages.filter(m => m.sender !== 'intro');
    
    const allVerified = details.length > 0 ? details.every(d => d.status === 'confirmed') : false;
    
    const entities = {};

    // 1. ALWAYS save the full conversation transcript from top to bottom
    const transcript = allMessages
        .map(m => {
            if (m.isConfirmBackRequest) {
                return `You (Asked to Verify ${m.confirmData.typeLabel}): "${m.confirmData.value}"`;
            }
            return `${m.sender === 'user' ? 'You' : 'Staff'}: ${m.text}`;
        })
        .join('\n\n'); 
    
    entities["Full Chat Transcript"] = transcript || "No conversation recorded.";

    // 2. Add verified details WITH the exact staff response to that detail
    if (details.length > 0) {
        details.forEach(d => {
            // Find the staff's exact reply immediately following the verification request
            const reqIndex = messages.findIndex(m => m.isConfirmBackRequest && m.confirmData.value === d.value);
            let staffReplyToDetail = "No direct reply recorded";
            
            if (reqIndex !== -1 && reqIndex + 1 < messages.length && messages[reqIndex + 1].sender === 'staff') {
                staffReplyToDetail = messages[reqIndex + 1].text;
            }

            const statusLabel = d.status === 'confirmed' ? '(Verified)' : '(Unverified)';
            // This format will render beautifully in the History UI with the whitespace-pre-wrap CSS class
            entities[`Detail: ${d.typeLabel} ${statusLabel}`] = `You asked: "${d.value}"\nStaff replied: "${staffReplyToDetail}"`;
        });
    }

    // 3. Find the final overall Staff Resolution
    const staffMessages = messages.filter(m => m.sender === 'staff');
    const primaryAction = staffMessages.length > 0 ? staffMessages[staffMessages.length - 1].text : "No staff response recorded";
    const primaryDate = details.find(d => d.typeId === 'datetime')?.value || new Date().toISOString().split('T')[0];

    const historyItem = {
      id: `REQ-${Date.now()}`,
      domain: 'GRANULAR CONVERSATION',
      intent: 'live_chat_details',
      title: 'Detailed Chat Summary',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: addToPlanner ? 'Follow-Up Planned' : 'Summarized',
      verifiedByStaff: allVerified, 
      entities: entities,
      staffResponse: primaryAction
    };

    try {
      const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));

      if (addToPlanner) {
        const followUpItem = {
          id: `FOLLOW-${Date.now()}`,
          title: 'Follow-Up from Detailed Chat',
          situation: 'Chat interaction tracking',
          category: 'Other',
          type: 'General Task',
          nextAction: primaryAction,
          contactPerson: '',
          contactDetails: '',
          dueDate: primaryDate,
          priority: 'Normal',
          status: 'Planned',
          verifiedByStaff: allVerified,
          notes: JSON.stringify(entities, null, 2),
          checklist: [],
          progressUpdates: []
        };
        const existingFollowUps = JSON.parse(localStorage.getItem('signmitra_followups') || '[]');
        localStorage.setItem('signmitra_followups', JSON.stringify([followUpItem, ...existingFollowUps]));
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSummaryModal(false);
        setAddToPlanner(false);
        router.push('/history');
      }, 1500);

    } catch (err) {
      console.error("Local storage save error:", err);
    }
  };

  const extractedDetails = getExtractedDetails();
  const fullyVerifiedSession = extractedDetails.length > 0 && extractedDetails.every(d => d.status === 'confirmed');
  const hasDataToSave = extractedDetails.length > 0 || messages.filter(m => m.sender !== 'intro').length > 0;

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        nav { display: none !important; }
      `}} />

      {/* Top Header Bar */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link 
            href="/communication-hub" 
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded" 
            onClick={() => { if(window.speechSynthesis) window.speechSynthesis.cancel(); }}
            aria-label="Exit Conversation Assist and return to Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Chat</span>
          </Link>
          <span className="opacity-40 hidden sm:inline" aria-hidden="true">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide hidden sm:inline">CONVERSATION ASSIST</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSummaryModal(true)} 
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${accentSolid} hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
            aria-haspopup="dialog"
            aria-expanded={showSummaryModal}
          >
            <FileDown className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Save Summary</span>
          </button>
          {messages.length > 0 && (
            <button 
              onClick={clearConversation} 
              className="hover:opacity-75 transition-opacity text-xs font-mono font-bold flex items-center gap-1 text-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none rounded px-1"
              aria-label="Clear all messages"
            >
              <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CAPTURE MODAL */}
      {showSummaryModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
        >
          <div className={`w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl border ${borderTone} ${bgCanvas} shadow-2xl animate-in zoom-in-95 duration-200`}>
            
            {saveSuccess ? (
              <div className="py-12 text-center space-y-3" role="alert" aria-live="assertive">
                <CheckSquare className={`w-12 h-12 mx-auto ${textPrimary} opacity-80`} aria-hidden="true" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Summary Captured!</h2>
                <p className={`text-sm font-medium ${textSecondary}`}>Safely stored in your local History & Planner.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveSummary} className="space-y-5">
                <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  <div>
                    <h2 id="summary-modal-title" className="text-xl font-black uppercase tracking-tight">Structured Summary</h2>
                    <div className="flex items-center mt-1">
                      {fullyVerifiedSession ? (
                         <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-600 dark:text-green-400 flex items-center gap-1.5" aria-label="Fully Staff Verified">
                           <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> All Details Verified
                         </span>
                      ) : (
                         <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 flex items-center gap-1.5" aria-label="Mixed or Unverified Status">
                           <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> Contains Unverified Data
                         </span>
                      )}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowSummaryModal(false)} 
                    className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                    aria-label="Close Summary Modal"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-4">
                  {!hasDataToSave ? (
                    <div className={`p-6 text-center border border-dashed ${borderTone} rounded-xl opacity-70`}>
                      <p className="text-xs font-mono font-bold uppercase tracking-wider">No conversation data to save.</p>
                      <p className="text-[10px] mt-1">Type messages or confirm details to generate a summary.</p>
                    </div>
                  ) : (
                    <>
                      <div className={`p-4 text-center border ${borderTone} ${cardInnerBg} rounded-xl`}>
                        <p className="text-sm font-bold tracking-tight">Full Chat Transcript</p>
                        <p className={`text-xs mt-1 font-medium ${textSecondary}`}>Your entire chat transcript will be securely saved to your history.</p>
                      </div>
                      
                      {extractedDetails.length > 0 && (
                        <div className="mt-4">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-2">Verified Details to Save:</span>
                          <ul className="space-y-2">
                            {extractedDetails.map((detail, idx) => (
                              <li key={idx} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} flex justify-between items-start gap-4`}>
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-0.5">{detail.typeLabel}</span>
                                  <span className="font-bold text-sm">{detail.value}</span>
                                </div>
                                <div className="shrink-0 pt-1">
                                  {detail.status === 'confirmed' ? (
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-600 dark:text-green-400 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Confirmed
                                    </span>
                                  ) : detail.status === 'clarification_needed' ? (
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 flex items-center gap-1">
                                      <X className="w-3 h-3" /> Clarifying
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> User Entered
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <label className={`flex-1 w-full flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all focus-within:ring-2 focus-within:ring-[#655A7C] ${addToPlanner ? accentSolid + ' border-transparent' : `${cardBg}${borderTone} hover:opacity-80`}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={addToPlanner}
                        onChange={(e) => setAddToPlanner(e.target.checked)}
                      />
                      <CalendarClock className="w-4 h-4" aria-hidden="true" />
                      <span className="text-xs font-bold uppercase tracking-wider">Send to Planner</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={!hasDataToSave}
                    className={`w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${hasDataToSave ? accentSolid + ' hover:opacity-90' : 'opacity-40 cursor-not-allowed border ' + borderTone}`}
                  >
                    <FileDown className="w-4 h-4" aria-hidden="true" /> Save Structured Record
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Large Text Modal Overlay */}
      {activeLargeText && (
        <div 
          className={`fixed inset-0 z-[100] flex flex-col ${bgCanvas} ${textPrimary} p-6 sm:p-12 overflow-y-auto`}
          role="dialog"
          aria-modal="true"
          aria-label="High-Visibility Mode"
        >
          <div className="flex justify-between items-center mb-12">
             <span className={`text-xs font-mono font-bold uppercase tracking-widest opacity-80 px-3 py-1 rounded-full border ${borderTone}`}>
                SignMitra High-Visibility Mode
             </span>
             <button 
                onClick={() => setActiveLargeText(null)}
                className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                aria-label="Close High-Visibility Mode"
             >
                <Minimize2 className="w-6 h-6" aria-hidden="true" />
             </button>
          </div>
          <div className="my-auto">
            <p className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight whitespace-pre-line tracking-tight">
              {activeLargeText}
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Stream */}
      <main 
        className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col pb-8 overflow-y-auto no-scrollbar"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="space-y-5 mb-6">
          <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} text-xs font-mono text-center opacity-80`} aria-hidden="true">
            💡 Use the input boxes at the bottom to have a two-way conversation.
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isIntro = msg.sender === 'intro';
            const isSpeaking = speakingId === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isUser || isIntro ? 'items-end' : 'items-start'} space-y-1`}>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold opacity-60 px-1" aria-hidden="true">
                  {isUser || isIntro ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                  <span>{isIntro ? 'Message to Staff' : isUser ? 'You (ISL User)' : 'Staff Reply'}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl max-w-[90%] sm:max-w-xl border shadow-sm ${
                  isUser || isIntro
                    ? `${cardInnerBg}${borderTone} rounded-tr-none` 
                    : `${cardBg}${borderTone} rounded-tl-none`
                }`}>
                  <span className="sr-only">
                    {isUser || isIntro ? 'You said:' : 'Staff replied:'}
                  </span>
                  
                  {msg.isConfirmBackRequest ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> Verification Request
                      </span>
                      <div className={`p-3 rounded-lg border ${borderTone} ${cardBg} flex flex-col gap-1`}>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">{msg.confirmData.typeLabel}:</span>
                        <span className="text-lg font-black">{msg.confirmData.value}</span>
                      </div>
                      
                      {msg.confirmData.status === 'pending' && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                          <span className="w-full text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 mb-1">Staff: Please confirm detail</span>
                          <button 
                            onClick={() => handleStaffDetailVerification(msg.id, 'confirmed')} 
                            className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${accentSolid} hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                          >
                            Confirm Detail
                          </button>
                          <button 
                            onClick={() => handleStaffDetailVerification(msg.id, 'clarification_needed')} 
                            className={`px-4 py-2 rounded-lg border ${borderTone} text-xs font-bold hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                          >
                            Incorrect / Clarify
                          </button>
                        </div>
                      )}
                      {msg.confirmData.status === 'confirmed' && (
                        <div className="mt-2 text-[10px] font-mono font-bold uppercase tracking-widest text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Staff Confirmed
                        </div>
                      )}
                      {msg.confirmData.status === 'clarification_needed' && (
                        <div className="mt-2 text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 flex items-center gap-1">
                          <X className="w-3 h-3" /> Staff Rejected - Needs Clarification
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg font-black leading-snug whitespace-pre-line">
                      {msg.text}
                    </p>
                  )}
                  
                  <div className={`flex items-center gap-3 mt-3 pt-2 border-t text-xs ${isDarkTheme ? 'border-white/10' : 'border-black/10'}`}>
                    <button 
                      onClick={() => setActiveLargeText(msg.isConfirmBackRequest ? `[${msg.confirmData.typeLabel}]\n${msg.confirmData.value}` : msg.text)}
                      className="font-mono font-bold opacity-75 hover:opacity-100 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
                      aria-label="Enlarge this message text"
                    >
                      <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" /> Enlarge
                    </button>
                    <button 
                      onClick={() => speakText(msg.id, msg.isConfirmBackRequest ? `Verification Request: ${msg.confirmData.typeLabel} is ${msg.confirmData.value}` : msg.text)}
                      className={`font-mono font-bold flex items-center gap-1 ${isSpeaking ? 'text-green-600 animate-pulse' : 'opacity-75 hover:opacity-100'} focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1`}
                      aria-label={isSpeaking ? "Stop reading message" : "Read message aloud"}
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" /> {isSpeaking ? 'Reading...' : 'Speak'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} className="h-6" aria-hidden="true" />
        </div>
      </main>

      {/* FIXED BOTTOM ACTION AREA */}
      <div className={`w-full border-t ${borderTone} ${cardBg} p-3 sm:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`}>
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* User Input Section */}
          <div className="space-y-2">
             <label htmlFor="userInputText" className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 block">
               ISL User — Message to staff
             </label>
             <div className="flex gap-2">
              <input
                id="userInputText"
                type="text"
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUserMessage(); }}
                placeholder="Type your message..."
                className={`p-3 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C] focus-visible:ring-2 focus-visible:ring-[#655A7C]`}
              />
              <button
                onClick={() => handleUserMessage()}
                disabled={!userText.trim()}
                className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${userText.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-50 cursor-not-allowed border ' + borderTone}`}
                aria-label="Send message to staff"
              >
                <span className="hidden sm:inline">Send to Staff</span>
                <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowRepairToolkit(!showRepairToolkit); setShowConfirmBack(false); }}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none
                  ${showRepairToolkit ? accentSolid + ' border-transparent' : `${borderTone}${cardInnerBg} hover:opacity-80`}`}
                aria-expanded={showRepairToolkit}
                aria-controls="repair-toolkit-panel"
              >
                <Wrench className="w-3.5 h-3.5" aria-hidden="true" /> Toolkit
              </button>
              <button
                onClick={() => { setShowConfirmBack(!showConfirmBack); setShowRepairToolkit(false); }}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none
                  ${showConfirmBack ? accentSolid + ' border-transparent' : `${borderTone}${cardInnerBg} hover:opacity-80`}`}
                aria-expanded={showConfirmBack}
                aria-controls="confirm-back-panel"
              >
                <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" /> Detail Confirm
              </button>
            </div>
          </div>

          {/* Expanded Repair Toolkit */}
          {showRepairToolkit && (
            <div id="repair-toolkit-panel" className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} animate-in slide-in-from-bottom-2 duration-200`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 block flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" /> Fix Misunderstandings
              </span>
              <p className={`text-[10px] font-medium leading-snug mb-2 ${textSecondary}`}>
                Use these if something was unclear or you need the other person to repeat or clarify.
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="list">
                {REPAIR_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUserMessage(phrase, false, true)} 
                    className={`px-3.5 py-2 rounded-lg border ${borderTone} ${cardBg} text-xs font-bold hover:border-[#655A7C] transition-all shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
                    role="listitem"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expanded Detail-by-Detail Confirm-Back Form */}
          {showConfirmBack && (
            <div id="confirm-back-panel" className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} animate-in slide-in-from-bottom-2 duration-200 space-y-3`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 block flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" /> Confirm Specific Details
              </span>
              <p className={`text-[10px] font-medium leading-snug mb-1 ${textSecondary}`}>
                Select a category and enter the detail to verify it directly with staff.
              </p>
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {DETAIL_TYPES.map(type => {
                  const TypeIcon = type.icon;
                  const isSelected = confirmDetailType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setConfirmDetailType(type.id)}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 whitespace-nowrap text-[10px] sm:text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none shrink-0
                        ${isSelected ? accentSolid + ' border-transparent' : `${borderTone}${cardBg} hover:opacity-80`}`}
                    >
                      <TypeIcon className="w-3 h-3" /> {type.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={confirmDetailValue}
                  onChange={(e) => setConfirmDetailValue(e.target.value)}
                  placeholder={`e.g., enter the ${DETAIL_TYPES.find(t => t.id === confirmDetailType)?.label.toLowerCase()}...`}
                  aria-label="Detail value to confirm"
                  className={`p-2.5 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardBg} ${borderTone} focus:border-[#655A7C] focus-visible:ring-2 focus-visible:ring-[#655A7C]`}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDetailConfirmRequest(); }}
                />
                <button
                  onClick={handleDetailConfirmRequest}
                  disabled={!confirmDetailValue.trim()}
                  className={`px-4 py-2.5 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${confirmDetailValue.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-50 cursor-not-allowed border ' + borderTone}`}
                >
                  Send Verification <Send className="w-3 h-3 hidden sm:block" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          
          <hr className={`border-t ${borderTone}`} />

          {/* Staff Input Section */}
          <div className={`p-2 rounded-xl border ${borderTone} ${cardBg} flex flex-col gap-2`}>
             <label htmlFor="staffInputText" className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 block px-1">
               Staff — Reply to user
             </label>
            <div className="flex gap-2">
              <input
                id="staffInputText"
                type="text"
                value={staffText}
                onChange={(e) => setStaffText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStaffMessage(); }}
                placeholder="Type your response..."
                className={`p-3 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C] focus-visible:ring-2 focus-visible:ring-[#655A7C]`}
              />
              <button
                onClick={() => handleStaffMessage()}
                disabled={!staffText.trim()}
                className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${staffText.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-50 cursor-not-allowed border ' + borderTone}`}
                aria-label="Send reply to ISL User"
              >
                <span className="hidden sm:inline">Send Reply</span>
                <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              </button>
            </div>
            
            {/* Quick simulated staff replies */}
            <div className="flex justify-between items-center text-[10px] font-mono px-1 opacity-60">
              <span className="hidden sm:inline">Suggested Staff Replies:</span>
              <div className="flex gap-3 overflow-x-auto no-scrollbar w-full sm:w-auto" role="list">
                <button onClick={() => handleStaffMessage("Yes, please wait here.")} className="underline hover:opacity-100 shrink-0 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1" role="listitem">"Wait here"</button>
                <button onClick={() => handleStaffMessage("I need your ID proof.")} className="underline hover:opacity-100 shrink-0 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1" role="listitem">"Need ID"</button>
                <button onClick={() => handleStaffMessage("Go to counter number 3.")} className="underline hover:opacity-100 shrink-0 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1" role="listitem">"Counter 3"</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}