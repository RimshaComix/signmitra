'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  CalendarClock
} from 'lucide-react';

const REPAIR_PHRASES = [
  "I didn't understand the last message.",
  "Please rephrase that in simpler terms.",
  "Could you write that down clearly?",
  "Please communicate one step at a time.",
  "Let's confirm the important details."
];

export default function ConversationAssist() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [messages, setMessages] = useState([
    { id: 1, sender: 'user', text: 'Hello, I am using SignMitra to assist with our communication. Please type your responses below.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputText, setInputText] = useState('');
  const [activeLargeText, setActiveLargeText] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  
  // Toolkit States
  const [showRepairToolkit, setShowRepairToolkit] = useState(false);
  const [showConfirmBack, setShowConfirmBack] = useState(false);
  const [confirmBackText, setConfirmBackText] = useState('');

  // Summary & Next-Step Capture States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryAsked, setSummaryAsked] = useState('');
  const [summaryReplied, setSummaryReplied] = useState('');
  const [summaryNextAction, setSummaryNextAction] = useState('');
  const [summaryDate, setSummaryDate] = useState('');
  const [addToPlanner, setAddToPlanner] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showRepairToolkit, showConfirmBack]);

  const handleSendMessage = (textToSend = null, isConfirmBack = false) => {
    const content = textToSend || inputText;
    if (!content.trim() && !isConfirmBack) return;

    let finalContent = content.trim();
    if (isConfirmBack) {
      if (!confirmBackText.trim()) return;
      finalContent = `CONFIRMATION REQUEST:\n"I understood that you mean: ${confirmBackText.trim()}"\n\nIs this correct? (Please tap Yes/No below)`;
    }

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text: finalContent,
      isConfirmBackRequest: isConfirmBack,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setConfirmBackText('');
    setShowConfirmBack(false);
    setShowRepairToolkit(false);
  };

  const handleStaffReply = (replyText) => {
    const staffMessage = {
      id: Date.now(),
      sender: 'staff',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, staffMessage]);
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
    const savedVoiceURI = localStorage.getItem('signmitra_preferred_voice');

    if (savedVoiceURI) {
      const selected = voices.find(v => v.voiceURI === savedVoiceURI);
      if (selected) utterance.voice = selected;
    } else {
      const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSaveSummary = (e) => {
    e.preventDefault();
    if (!summaryAsked.trim() && !summaryReplied.trim()) return;

    // 1. Save to My Requests History
    const historyItem = {
      id: `REQ-${Date.now()}`,
      domain: 'CUSTOM CONVERSATION',
      intent: 'live_chat',
      title: 'User-Captured Chat Summary',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: addToPlanner ? 'Follow-Up Planned' : 'Summarized',
      entities: { 
        'What I Asked': summaryAsked.trim() || 'N/A', 
        'What They Said': summaryReplied.trim() || 'N/A',
        'Next Action': summaryNextAction.trim() || 'N/A',
        'Target Date': summaryDate || 'N/A'
      },
      staffResponse: summaryNextAction.trim() || 'No explicit next steps.'
    };

    try {
      const existingHistory = JSON.parse(localStorage.getItem('signmitra_history') || '[]');
      localStorage.setItem('signmitra_history', JSON.stringify([historyItem, ...existingHistory]));

      // 2. Optionally push straight into Universal Follow-Up Planner
      if (addToPlanner && summaryNextAction.trim()) {
        const followUpItem = {
          id: `FOLLOW-${Date.now()}`,
          title: 'Follow-Up from Chat',
          situation: summaryAsked.trim(),
          category: 'Other',
          type: 'General Task',
          nextAction: summaryNextAction.trim(),
          contactPerson: '',
          contactDetails: '',
          dueDate: summaryDate || new Date().toISOString().split('T')[0],
          priority: 'Normal',
          status: 'Planned',
          notes: summaryReplied.trim(),
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
        setSummaryAsked('');
        setSummaryReplied('');
        setSummaryNextAction('');
        setSummaryDate('');
        setAddToPlanner(false);
      }, 1500);

    } catch (err) {
      console.error("Local storage save error:", err);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Top Header Bar */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5" onClick={() => { if(window.speechSynthesis) window.speechSynthesis.cancel(); }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40 hidden sm:inline">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide hidden sm:inline">CONVERSATION ASSIST</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSummaryModal(true)} 
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${accentSolid} hover:opacity-90`}
          >
            <FileDown className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Summary</span>
          </button>
          {messages.length > 0 && (
            <button onClick={clearConversation} className="hover:opacity-75 transition-opacity text-xs font-mono font-bold flex items-center gap-1 text-red-500">
              <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CAPTURE MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl border ${borderTone} ${bgCanvas} shadow-2xl animate-in zoom-in-95 duration-200`}>
            
            {saveSuccess ? (
              <div className="py-12 text-center space-y-3">
                <CheckSquare className={`w-12 h-12 mx-auto ${textPrimary} opacity-80`} />
                <h2 className="text-2xl font-black uppercase tracking-tight">Summary Captured!</h2>
                <p className={`text-sm font-medium ${textSecondary}`}>Safely stored in your local History & Planner.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveSummary} className="space-y-5">
                <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Capture Summary</h2>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70">User-Created Record</span>
                  </div>
                  <button type="button" onClick={() => setShowSummaryModal(false)} className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider block">What I Asked / Needed</label>
                    <textarea
                      required
                      value={summaryAsked}
                      onChange={(e) => setSummaryAsked(e.target.value)}
                      placeholder="e.g., Asked for the scholarship form..."
                      rows={2}
                      className={`p-3 w-full font-medium border rounded-lg text-sm outline-none transition-colors ${cardBg} ${borderTone} focus:border-[#655A7C]`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider block">What They Said</label>
                    <textarea
                      value={summaryReplied}
                      onChange={(e) => setSummaryReplied(e.target.value)}
                      placeholder="e.g., The form is online only now..."
                      rows={2}
                      className={`p-3 w-full font-medium border rounded-lg text-sm outline-none transition-colors ${cardBg} ${borderTone} focus:border-[#655A7C]`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider block">Next Action / To-Do</label>
                    <input
                      type="text"
                      value={summaryNextAction}
                      onChange={(e) => setSummaryNextAction(e.target.value)}
                      placeholder="e.g., Download and print the PDF"
                      className={`p-3 w-full font-bold border rounded-lg text-sm outline-none transition-colors ${cardBg} ${borderTone} focus:border-[#655A7C]`}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider block">Date Mentioned</label>
                      <input
                        type="date"
                        value={summaryDate}
                        onChange={(e) => setSummaryDate(e.target.value)}
                        onClick={(e) => e.target.showPicker?.()}
                        className={`p-3 w-full font-bold border rounded-lg text-sm outline-none transition-colors ${cardBg} ${borderTone} cursor-pointer`}
                      />
                    </div>
                    
                    <label className={`flex-1 w-full flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${addToPlanner ? accentSolid + ' border-transparent' : `${cardBg}${borderTone} hover:opacity-80`}`}>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={addToPlanner}
                        onChange={(e) => setAddToPlanner(e.target.checked)}
                      />
                      <CalendarClock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Send to Planner</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className={`w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 ${accentSolid}`}>
                    <FileDown className="w-4 h-4" /> Save Summary
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Large Text Modal Overlay */}
      {activeLargeText && (
        <div className={`fixed inset-0 z-[100] flex flex-col ${bgCanvas} ${textPrimary} p-6 sm:p-12 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-12">
             <span className={`text-xs font-mono font-bold uppercase tracking-widest opacity-80 px-3 py-1 rounded-full border ${borderTone}`}>
                SignMitra High-Visibility Mode
             </span>
             <button 
                onClick={() => setActiveLargeText(null)}
                className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
             >
                <Minimize2 className="w-6 h-6" />
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
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col pb-6 overflow-y-auto no-scrollbar">
        
        <div className="space-y-5 mb-6">
          <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} text-xs font-mono text-center opacity-80`}>
            💡 Hand the device to staff to type replies, or use the Repair Toolkit if communication breaks down.
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingId === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold opacity-60 px-1">
                  {isUser ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                  <span>{isUser ? 'You (ISL User)' : 'Staff / Official'}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl max-w-[90%] sm:max-w-xl border shadow-sm ${
                  isUser 
                    ? `${cardInnerBg}${borderTone} rounded-tr-none` 
                    : `${cardBg}${borderTone} rounded-tl-none`
                }`}>
                  <p className={`text-base sm:text-lg font-black leading-snug whitespace-pre-line ${msg.isConfirmBackRequest ? 'italic opacity-90' : ''}`}>
                    {msg.text}
                  </p>
                  
                  {/* Staff Interactive Buttons for Confirm-Back Requests */}
                  {msg.isConfirmBackRequest && isUser && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                      <span className="w-full text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 mb-1">Staff: Please Select One</span>
                      <button onClick={() => handleStaffReply("Yes, that is exactly correct.")} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${accentSolid} hover:opacity-90`}>
                        Yes, Correct
                      </button>
                      <button onClick={() => handleStaffReply("No, that is incorrect. Let me re-type it.")} className={`px-4 py-2 rounded-lg border ${borderTone} text-xs font-bold hover:opacity-80`}>
                        No, Incorrect
                      </button>
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-3 mt-3 pt-2 border-t text-xs ${isDarkTheme ? 'border-white/10' : 'border-black/10'}`}>
                    <button 
                      onClick={() => setActiveLargeText(msg.text)}
                      className="font-mono font-bold opacity-75 hover:opacity-100 flex items-center gap-1"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> Enlarge
                    </button>
                    <button 
                      onClick={() => speakText(msg.id, msg.text)}
                      className={`font-mono font-bold flex items-center gap-1 ${isSpeaking ? 'text-green-600 animate-pulse' : 'opacity-75 hover:opacity-100'}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" /> {isSpeaking ? 'Reading...' : 'Speak'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} className="h-2" />
        </div>
      </main>

      {/* FIXED BOTTOM ACTION AREA */}
      <div className={`w-full border-t ${borderTone} ${cardBg} p-3 sm:p-4 pb-20 sm:pb-24 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`}>
        <div className="max-w-3xl mx-auto space-y-3">
          
          {/* Repair Toolkit & Confirm Back Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowRepairToolkit(!showRepairToolkit); setShowConfirmBack(false); }}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                ${showRepairToolkit ? accentSolid + ' border-transparent' : `${borderTone}${cardInnerBg} hover:opacity-80`}`}
            >
              <Wrench className="w-3.5 h-3.5" /> Repair Toolkit
            </button>
            <button
              onClick={() => { setShowConfirmBack(!showConfirmBack); setShowRepairToolkit(false); }}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                ${showConfirmBack ? accentSolid + ' border-transparent' : `${borderTone}${cardInnerBg} hover:opacity-80`}`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Confirm-Back
            </button>
          </div>

          {/* Expanded Repair Toolkit */}
          {showRepairToolkit && (
            <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} animate-in slide-in-from-bottom-2 duration-200`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 block mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Fix Misunderstandings
              </span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {REPAIR_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(phrase)}
                    className={`px-3.5 py-2 rounded-lg border ${borderTone} ${cardBg} text-xs font-bold hover:border-[#655A7C] transition-all shrink-0 active:scale-95`}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expanded Confirm-Back Form */}
          {showConfirmBack && (
            <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} animate-in slide-in-from-bottom-2 duration-200 space-y-2`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 block flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Verify Understanding
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={confirmBackText}
                  onChange={(e) => setConfirmBackText(e.target.value)}
                  placeholder="I understood that you mean..."
                  className={`p-2.5 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardBg} ${borderTone} focus:border-[#655A7C]`}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(null, true); }}
                />
                <button
                  onClick={() => handleSendMessage(null, true)}
                  disabled={!confirmBackText.trim()}
                  className={`px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${confirmBackText.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-50 cursor-not-allowed border ' + borderTone}`}
                >
                  Verify <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Standard Input & Staff Simulation Toggle */}
          <div className={`p-2 rounded-xl border ${borderTone} ${cardBg} flex flex-col gap-2`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                placeholder="Type a message or pass to staff to reply..."
                className={`p-3 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 ${inputText.trim() ? accentSolid + ' hover:opacity-90' : 'opacity-50 cursor-not-allowed border ' + borderTone}`}
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
            
            {/* Quick simulated staff replies for testing without passing the device back and forth */}
            <div className="flex justify-between items-center text-[10px] font-mono px-1 opacity-60">
              <span className="hidden sm:inline">Quick Staff Replies:</span>
              <div className="flex gap-3 overflow-x-auto no-scrollbar w-full sm:w-auto">
                <button onClick={() => handleStaffReply("Yes, please wait here.")} className="underline hover:opacity-100 shrink-0">"Wait here"</button>
                <button onClick={() => handleStaffReply("I need your ID proof.")} className="underline hover:opacity-100 shrink-0">"Need ID"</button>
                <button onClick={() => handleStaffReply("Go to counter number 3.")} className="underline hover:opacity-100 shrink-0">"Counter 3"</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}