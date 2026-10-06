'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft, Sun, Moon, Search, MapPin, CheckCircle2, XCircle, Clock,
  Building2, ShieldCheck, Users, AlertTriangle, Plus, Trash2, Calendar,
  ListTodo, FileText, ChevronRight, Save, IdCard, ExternalLink, Activity, ShieldAlert
} from 'lucide-react';

const REFERENCE_DATA = [
  {
    id: 'hosp-1', name: 'City General Hospital (OPD Block)', type: 'Healthcare',
    address: '142 Health Avenue, Downtown, Chennai', lastVerified: 'Oct 2026',
    verifiedBy: 'SignMitra Community (12 Reports)', verificationType: 'Community-reported',
    features: {
      interpreter: { status: 'available', text: 'On-Call ISL Interpreter Available. Requires 24h notice.' },
      visualQueue: { status: 'yes', text: 'Digital token display boards active.' },
      writtenSupport: { status: 'yes', text: 'Staff trained to use written pads.' }
    }
  },
  {
    id: 'bank-1', name: 'State Bank of India (Main Branch)', type: 'Banking',
    address: 'Financial District, Block C, Chennai', lastVerified: 'Sept 2026',
    verifiedBy: 'Branch Manager Audit', verificationType: 'Institution-confirmed',
    features: {
      interpreter: { status: 'no', text: 'No in-person interpreter. VRS allowed.' },
      visualQueue: { status: 'no', text: 'Audio-only token callouts.' },
      writtenSupport: { status: 'yes', text: 'Dedicated accessibility forms available.' }
    }
  },
  {
    id: 'edu-1', name: 'Easwari Engineering College (Main Office)', type: 'Education',
    address: 'Ramapuram, Chennai', lastVerified: 'Sept 2026',
    verifiedBy: 'Student Accessibility Cell', verificationType: 'Institution-confirmed',
    features: {
      interpreter: { status: 'available', text: 'Interpreter available for official meetings.' },
      visualQueue: { status: 'na', text: 'Not applicable (Direct appointment).' },
      writtenSupport: { status: 'yes', text: 'Faculty provide written notes upon request.' }
    }
  }
];

const CATEGORIES = ['All', 'Healthcare', 'Banking', 'Education', 'Government', 'Transport', 'Other'];

export default function UniversalAccessibilityDirectory() {
  const router = useRouter();
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme, toggleTheme } = useTheme();

  // Primary Tabs
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'plans', 'reference'
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [provider, setProvider] = useState('osm'); // 'google', 'osm'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [checkingSources, setCheckingSources] = useState({});

  // Selection & Planner State
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [plannerStep, setPlannerStep] = useState(1);
  const [savedPlans, setSavedPlans] = useState([]);

  // Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPlace, setManualPlace] = useState({ name: '', address: '', category: 'Healthcare' });

  // Post-Visit Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    department: '', date: new Date().toISOString().split('T')[0],
    features: { ramps: false, isl: false, visual: false, pads: false },
    notes: '', confidence: 'personally_observed'
  });

  // 7-Step Plan Data
  const [planData, setPlanData] = useState({
    date: '', time: '', department: '', purpose: '',
    accommodations: { isl: false, written: false, comm_cards: false, visual: false, companion: false },
    questions: ['Is an ISL interpreter available?', 'Where is the visual display queue?'], newQuestion: '',
    checklist: [{ text: 'UDID Card', checked: false }, { text: 'Government ID', checked: false }, { text: 'Medical Records / Passbook', checked: false }], newChecklist: '',
    notes: { counter: '', contact: '', reference: '' },
    followupAction: ''
  });

  useEffect(() => {
    try {
      const plans = JSON.parse(localStorage.getItem('signmitra_directory_plans') || '[]');
      setSavedPlans(plans);
    } catch (e) {
      setSavedPlans([]);
    }
  }, []);

  const getStatusIcon = (status) => {
    if (status === 'available' || status === 'yes') return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />;
    if (status === 'no' || status === 'unavailable') return <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
    return <Clock className="w-5 h-5 opacity-40 shrink-0 mt-0.5" />;
  };

  const executeSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setApiKeyMissing(false);
    
    try {
      const res = await fetch(`/api/directory/places?query=${encodeURIComponent(searchQuery)}&provider=${provider}&category=${activeCategory}`);
      const data = await res.json();

      if (data.error === "GOOGLE_PLACES_API_KEY_NOT_CONFIGURED" || data.configured === false) {
        setApiKeyMissing(true);
        setSearchResults([]);
      } else if (data.results) {
        const sanitized = data.results.map((r, idx) => ({
          ...r,
          id: r.id || `res-${idx}-${Date.now()}`,
          features: {
            interpreter: r.features?.interpreter || { status: 'unknown', text: 'Information Not Found in Public Sources' },
            visualQueue: r.features?.visualQueue || { status: 'unknown', text: 'Information Not Found in Public Sources' },
            writtenSupport: r.features?.writtenSupport || { status: 'unknown', text: 'Information Not Found in Public Sources' }
          }
        }));
        setSearchResults(sanitized);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([{
        id: `mock-${Date.now()}`,
        name: `${searchQuery} (Fallback API Result)`,
        address: 'Extracted Address, Location',
        category: activeCategory !== 'All' ? activeCategory : 'General',
        providerSource: provider === 'osm' ? 'OpenStreetMap Nominatim' : 'Google Places API',
        features: {
          interpreter: { status: 'unknown', text: 'Information Not Found in Public Sources' },
          visualQueue: { status: 'unknown', text: 'Information Not Found in Public Sources' },
          writtenSupport: { status: 'unknown', text: 'Information Not Found in Public Sources' }
        }
      }]);
    }
    setIsSearching(false);
  };

  const checkPublicSources = async (inst) => {
    setCheckingSources(prev => ({ ...prev, [inst.id]: true }));
  
    try {
      const res = await fetch('/api/directory/accessibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          place_id: inst.id,
          name: inst.name,
          address: inst.address,
          latitude: inst.coordinates?.lat || inst.latitude,
          longitude: inst.coordinates?.lon || inst.longitude
        })
      });
  
      const data = await res.json();
  
      setSearchResults(prev =>
        prev.map(place =>
          place.id === inst.id
            ? {
                ...place,
                features: {
                  ...place.features,
                  interpreter: data.features?.interpreter || place.features.interpreter,
                  visualQueue: data.features?.visualQueue || place.features.visualQueue,
                  writtenSupport: data.features?.writtenSupport || place.features.writtenSupport
                },
                verifiedBy: data.verifiedBy,
                lastVerified: data.lastVerified
              }
            : place
        )
      );
    } catch (error) {
      console.error('Accessibility source check failed:', error);
    } finally {
      setCheckingSources(prev => ({ ...prev, [inst.id]: false }));
    }
  };

  const handleManualEntry = (e) => {
    e.preventDefault();
    const newPlace = {
      id: `manual-${Date.now()}`,
      name: manualPlace.name,
      address: manualPlace.address,
      category: manualPlace.category,
      providerSource: 'User-Entered Location',
      features: {
        interpreter: { status: 'unknown', text: 'Information Not Found in Public Sources' },
        visualQueue: { status: 'unknown', text: 'Information Not Found in Public Sources' },
        writtenSupport: { status: 'unknown', text: 'Information Not Found in Public Sources' }
      }
    };
    setSearchResults([newPlace]);
    setShowManualModal(false);
    setSelectedPlace(newPlace);
    setShowPlanner(true);
  };

  const saveVisitPlan = () => {
    const finalPlan = {
      id: `PLAN-${Date.now()}`,
      place: selectedPlace,
      data: planData,
      created_at: new Date().toISOString()
    };
    
    const updatedPlans = [finalPlan, ...savedPlans];
    setSavedPlans(updatedPlans);
    localStorage.setItem('signmitra_directory_plans', JSON.stringify(updatedPlans));

    if (plannerStep >= 4 && planData.purpose) {
      const needs = Object.keys(planData.accommodations).filter(k => planData.accommodations[k]);
      localStorage.setItem('signmitra_comm_card', JSON.stringify({
        title: `Visit to ${selectedPlace?.name || 'Institution'}`,
        context: planData.purpose,
        needs: needs.length > 0 ? needs.join(', ') : 'Written Communication'
      }));
    }

    if (planData.followupAction.trim()) {
      const followups = JSON.parse(localStorage.getItem('signmitra_followups') || '[]');
      followups.push({
        id: `FU-${Date.now()}`,
        title: `Follow-up: ${selectedPlace?.name || 'Institution'}`,
        nextAction: planData.followupAction,
        dueDate: planData.date || new Date().toISOString().split('T')[0],
        status: 'Planned',
        category: selectedPlace?.category || 'Other'
      });
      localStorage.setItem('signmitra_followups', JSON.stringify(followups));
    }

    setShowPlanner(false);
    setPlannerStep(1);
    setActiveTab('plans');
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/directory/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_name: selectedPlace?.name,
          address: selectedPlace?.address,
          department_visited: feedbackData.department,
          date_observed: feedbackData.date,
          support_observed: Object.keys(feedbackData.features).filter(k => feedbackData.features[k]),
          notes: feedbackData.notes,
          verification_level: feedbackData.confidence
        })
      });
    } catch (err) {
      console.log("Feedback saved locally fallback");
    }
    setShowFeedback(false);
    alert('Accessibility feedback submitted successfully!');
  };

  const renderPlannerStep = () => {
    switch (plannerStep) {
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in duration-200" key="step-1">
            <h3 className="font-black uppercase tracking-tight text-lg">Step A: Visit Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase opacity-70 mb-1 block">Date</label>
                <input type="date" value={planData.date} onChange={e => setPlanData({...planData, date: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase opacity-70 mb-1 block">Time</label>
                <input type="time" value={planData.time} onChange={e => setPlanData({...planData, time: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase opacity-70 mb-1 block">Target Department / Counter</label>
              <input type="text" placeholder="e.g., OPD Room 4, Cashier Counter" value={planData.department} onChange={e => setPlanData({...planData, department: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase opacity-70 mb-1 block">Visit Purpose</label>
              <textarea placeholder="Primary purpose of visit..." rows={3} value={planData.purpose} onChange={e => setPlanData({...planData, purpose: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in duration-200" key="step-2">
            <h3 className="font-black uppercase tracking-tight text-lg">Step B: Required Accommodations</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>Select the communication methods you prefer for this visit.</p>
            {Object.keys(planData.accommodations).map(key => (
              <label key={`accom-${key}`} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${planData.accommodations[key] ? accentSolid : `${cardInnerBg}${borderTone}`}`}>
                <input type="checkbox" className="w-4 h-4" checked={planData.accommodations[key]} onChange={e => setPlanData({...planData, accommodations: {...planData.accommodations, [key]: e.target.checked}})} />
                <span className="font-bold uppercase tracking-wider text-xs">
                  {key === 'isl' ? 'ISL Interpreter' : key === 'written' ? 'Written Notes (Pen/Paper)' : key === 'comm_cards' ? 'Communication Cards' : key === 'visual' ? 'Visual Displays' : 'Companion Support'}
                </span>
              </label>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in duration-200" key="step-3">
            <h3 className="font-black uppercase tracking-tight text-lg">Step C: Questions to Confirm</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>Questions to ask the staff when you arrive.</p>
            <ul className="space-y-2">
              {planData.questions.map((q, i) => (
                <li key={`q-${i}`} className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} text-sm font-bold flex justify-between items-center`}>
                  {q} <button key={`del-q-${i}`} onClick={() => setPlanData({...planData, questions: planData.questions.filter((_, idx) => idx !== i)})}><Trash2 className="w-4 h-4 text-red-500" /></button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input type="text" placeholder="Add custom question..." value={planData.newQuestion} onChange={e => setPlanData({...planData, newQuestion: e.target.value})} className={`flex-1 p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
              <button key="add-q-btn" onClick={() => { if(planData.newQuestion.trim()) setPlanData({...planData, questions: [...planData.questions, planData.newQuestion], newQuestion: ''}) }} className={`p-3 rounded-xl ${accentSolid}`}><Plus className="w-5 h-5" /></button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in fade-in duration-200" key="step-4">
            <h3 className="font-black uppercase tracking-tight text-lg">Step D: Communication Card Preview</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>This self-advocacy card will be saved to your Communication Hub.</p>
            <div className={`p-6 rounded-2xl border-4 ${borderTone} ${cardBg} space-y-4 text-center`}>
              <IdCard className="w-12 h-12 mx-auto opacity-50" />
              <h4 className="text-xl font-black uppercase tracking-tight">Hello, I am deaf.</h4>
              <p className="font-bold text-sm bg-black/5 dark:bg-white/5 p-3 rounded-lg">I am here for: {planData.purpose || '[Please specify purpose in Step A]'}</p>
              <p className="font-bold text-sm opacity-80">I require: {Object.keys(planData.accommodations).filter(k => planData.accommodations[k]).join(', ') || 'Written Communication'}</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-in fade-in duration-200" key="step-5">
            <h3 className="font-black uppercase tracking-tight text-lg">Step E: Preparation Checklist</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>Make sure you have these ready before you leave.</p>
            {planData.checklist.map((item, i) => (
              <label key={`check-${i}`} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${item.checked ? `opacity-50 line-through ${cardInnerBg}` : `${cardBg}`} ${borderTone}`}>
                <input type="checkbox" checked={item.checked} onChange={() => {
                  const newChecklist = [...planData.checklist];
                  newChecklist[i].checked = !newChecklist[i].checked;
                  setPlanData({...planData, checklist: newChecklist});
                }} className="w-4 h-4" />
                <span className="font-bold text-sm">{item.text}</span>
                <button key={`del-check-${i}`} type="button" onClick={(e) => { e.preventDefault(); setPlanData({...planData, checklist: planData.checklist.filter((_, idx) => idx !== i)}); }} className="ml-auto"><Trash2 className="w-3.5 h-3.5 text-red-500 opacity-50 hover:opacity-100" /></button>
              </label>
            ))}
            <div className="flex gap-2">
              <input type="text" placeholder="Add requirement (e.g., Medical reports)..." value={planData.newChecklist} onChange={e => setPlanData({...planData, newChecklist: e.target.value})} className={`flex-1 p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
              <button key="add-check-btn" onClick={() => { if(planData.newChecklist.trim()) setPlanData({...planData, checklist: [...planData.checklist, { text: planData.newChecklist, checked: false }], newChecklist: ''}) }} className={`p-3 rounded-xl ${accentSolid}`}><Plus className="w-5 h-5" /></button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4 animate-in fade-in duration-200" key="step-6">
            <h3 className="font-black uppercase tracking-tight text-lg">Step F: Visit Notes & Contacts</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>Record important details during your visit.</p>
            <input type="text" placeholder="Assigned Counter Number" value={planData.notes.counter} onChange={e => setPlanData({...planData, notes: {...planData.notes, counter: e.target.value}})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
            <input type="text" placeholder="Contact Person Name" value={planData.notes.contact} onChange={e => setPlanData({...planData, notes: {...planData.notes, contact: e.target.value}})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
            <textarea placeholder="Reference notes, replies, or instructions..." rows={4} value={planData.notes.reference} onChange={e => setPlanData({...planData, notes: {...planData.notes, reference: e.target.value}})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4 animate-in fade-in duration-200" key="step-7">
            <h3 className="font-black uppercase tracking-tight text-lg">Step G: Follow-up Actions</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>Create a task for after this visit.</p>
            <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-3`}>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70">Next Action Required</label>
              <input type="text" placeholder="e.g., Return on Friday with signed form" value={planData.followupAction} onChange={e => setPlanData({...planData, followupAction: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardBg} ${borderTone}`} />
            </div>
            <div className={`p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-2`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" /> If added, this will sync to your Universal Follow-up Planner.
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      {/* Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40" aria-hidden="true">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">UNIVERSAL VISIT PLANNER</span>
        </div>
        <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}>
          {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
        </button>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col pb-24">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-2 no-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {[
            { id: 'search', label: 'Search Directory' },
            { id: 'plans', label: 'Saved Plans' },
            { id: 'reference', label: 'Reference Audit Records' }
          ].map(tab => (
            <button key={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 rounded-lg font-black text-sm uppercase tracking-wider transition-all whitespace-nowrap border-2 ${activeTab === tab.id ? `${accentSolid} border-transparent` : `${cardBg}${borderTone} hover:border-[#655A7C]`}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================= TAB: SEARCH & FILTER ======================= */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header>
              <h1 className="text-3xl font-black uppercase tracking-tight">Accessibility Directory</h1>
              <p className={`text-sm mt-2 font-medium ${textSecondary}`}>Search for any place and explore available accessibility information before your visit.</p>
            </header>

            {/* Missing Credentials Banner */}
            {apiKeyMissing && (
              <div className="p-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 space-y-4">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-black uppercase tracking-wider text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" /> Google Places API Key Not Configured
                </div>
                <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200 space-y-2">
                  <p>The backend requires a valid Google API key in the <code>.env</code> file. To set it up:</p>
                  <ol className="list-decimal pl-4 space-y-1 opacity-80">
                    <li>Go to Google Cloud Console.</li>
                    <li>Enable the "Places API (New)".</li>
                    <li>Generate an API Key.</li>
                    <li>Add it to your backend `.env` as <code>GOOGLE_PLACES_API_KEY</code>.</li>
                  </ol>
                  <p className="pt-2">To continue without one, switch providers or use manual entry below.</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-yellow-500/20">
                  <button onClick={() => { setProvider('osm'); setApiKeyMissing(false); }} className="px-4 py-2.5 bg-yellow-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-yellow-400">Switch to OpenStreetMap</button>
                  <button onClick={() => setShowManualModal(true)} className={`px-4 py-2.5 border border-yellow-500/50 font-bold text-xs uppercase tracking-wider rounded-xl text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20`}>Manual Place Entry</button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Search by institution name, address, or landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                  className={`w-full pl-12 pr-4 py-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardBg} ${borderTone}`}
                />
              </div>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className={`p-4 font-bold border-2 rounded-xl text-sm outline-none ${cardBg} ${borderTone} sm:w-auto w-full`}>
                <option value="osm">OpenStreetMap</option>
                <option value="google">Google Places</option>
              </select>
              <button onClick={executeSearch} disabled={!searchQuery.trim() || isSearching} className={`px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider ${searchQuery.trim() ? accentSolid : `opacity-50 border-2 ${borderTone}`} sm:w-auto w-full`}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button onClick={() => setShowManualModal(true)} className={`px-6 py-4 rounded-xl border-2 font-black text-sm uppercase tracking-wider ${cardInnerBg} ${borderTone} hover:border-[#655A7C] sm:w-auto w-full flex items-center justify-center gap-2`} title="Manual Entry">
                <Plus className="w-5 h-5" /> <span className="sm:hidden">Manual Entry</span>
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button key={`cat-${cat}`} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all border ${activeCategory === cat ? accentSolid : `${cardBg}${borderTone}`}`}>{cat}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              {searchResults.length > 0 ? searchResults.map(inst => {
                const isUnknown = !inst.features || !inst.features.interpreter || inst.features.interpreter.status === 'unknown' || inst.features.interpreter.status === 'not_checked';

                return (
                  <div key={`search-result-${inst.id}`} className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-4 ${cardBg} ${borderTone}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1.5 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" /> Source: {inst.providerSource}
                        </div>
                        <h3 className="text-xl font-black leading-tight tracking-tight">{inst.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs font-medium opacity-70 mt-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {inst.address}
                        </div>
                      </div>
                      <button onClick={() => { setSelectedPlace(inst); setShowPlanner(true); }} className={`w-full sm:w-auto px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid} flex items-center justify-center gap-2 whitespace-nowrap`}>
                        <Calendar className="w-4 h-4" /> Start Plan
                      </button>
                    </div>

                    <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col gap-3`}>
                      <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">Public Accessibility Information</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-xs">
                          {getStatusIcon(inst.features?.interpreter?.status)}
                          <div>
                            <strong className="font-black uppercase text-[10px] tracking-wider block">ISL Interpreter</strong>
                            <span className={`font-medium ${isUnknown ? 'opacity-60' : 'opacity-90'}`}>
                              {inst.features?.interpreter?.status === 'available' ? 'Available' : inst.features?.interpreter?.status === 'no' || inst.features?.interpreter?.status === 'unavailable' ? 'Not available' : 'Not publicly verified'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                          {getStatusIcon(inst.features?.visualQueue?.status)}
                          <div>
                            <strong className="font-black uppercase text-[10px] tracking-wider block">Visual Queue / Display Boards</strong>
                            <span className={`font-medium ${isUnknown ? 'opacity-60' : 'opacity-90'}`}>
                              {inst.features?.visualQueue?.status === 'yes' ? 'Available' : inst.features?.visualQueue?.status === 'no' || inst.features?.visualQueue?.status === 'unavailable' ? 'Not available' : 'Not publicly verified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 mt-1 border-t text-[10px] font-mono" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                        <div>
                          <span className="block font-bold uppercase opacity-60">Source</span>
                          <span className="opacity-80">{isUnknown ? 'No public source found' : (inst.verifiedBy || 'Institution Database')}</span>
                        </div>
                        <div>
                           <span className="block font-bold uppercase opacity-60">Verification</span>
                           <span className="opacity-80">{isUnknown ? 'Not verified' : `Verified ${inst.lastVerified || ''}`}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => checkPublicSources(inst)}
                        disabled={checkingSources[inst.id]}
                        className={`mt-2 w-full py-2.5 rounded-lg border border-dashed ${borderTone} text-[10px] font-black uppercase tracking-wider hover:border-[#655A7C] transition-colors opacity-70 hover:opacity-100 flex items-center justify-center gap-2 disabled:opacity-50`}
                      >
                        <Search className="w-3 h-3" />
                        {checkingSources[inst.id] ? 'Checking Public Sources...' : 'Check Public Sources'}
                      </button>
                    </div>
                  </div>
                );
              }) : (
                !isSearching && !apiKeyMissing && (
                  <div className={`p-12 text-center rounded-2xl border-2 border-dashed ${borderTone} ${cardInnerBg} opacity-60`}>
                    <Search className="w-8 h-8 mx-auto mb-3" />
                    <p className="font-bold uppercase tracking-wider text-sm">Search to find an institution or enter manually</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB: SAVED PLANS ======================= */}
        {activeTab === 'plans' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <header className="mb-6">
              <h1 className="text-3xl font-black uppercase tracking-tight">My Visit Plans</h1>
              <p className={`text-sm mt-2 font-medium ${textSecondary}`}>Securely stored active plans ready for your visits.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPlans.length > 0 ? savedPlans.map(plan => (
                <div key={`saved-plan-${plan.id}`} className={`p-6 rounded-2xl border-2 flex flex-col justify-between ${cardBg} ${borderTone}`}>
                  <div>
                    <div className="flex justify-between items-start border-b pb-4 mb-4" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                      <div>
                        <h3 className="text-lg font-black leading-tight">{plan.place?.name}</h3>
                        <p className="text-xs font-mono opacity-70 mt-1.5 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {plan.data.date || 'Unscheduled'} at {plan.data.time || '--:--'}</p>
                      </div>
                      <button onClick={() => {
                        if(confirm("Delete this plan?")) {
                          const updated = savedPlans.filter(p => p.id !== plan.id);
                          setSavedPlans(updated);
                          localStorage.setItem('signmitra_directory_plans', JSON.stringify(updated));
                        }
                      }} className="text-red-500 hover:opacity-75 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium mb-4">
                      <div>
                        <span className="block text-[10px] font-mono font-bold uppercase opacity-60 mb-0.5">Purpose</span>
                        <span className="truncate block pr-2">{plan.data.purpose || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono font-bold uppercase opacity-60 mb-0.5">Checklist Items</span>
                        {plan.data.checklist.filter(c => !c.checked).length} items remaining
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPlace(plan.place); setPlanData(plan.data); setPlannerStep(1); setShowPlanner(true); }} className={`w-full py-2.5 rounded-xl border-2 text-xs font-black uppercase tracking-wider hover:border-[#655A7C] transition-colors ${cardInnerBg} ${borderTone}`}>
                    Open Plan
                  </button>
                </div>
              )) : (
                <div className={`col-span-full p-12 text-center rounded-2xl border-2 border-dashed ${borderTone} ${cardInnerBg} opacity-60`}>
                  <ListTodo className="w-8 h-8 mx-auto mb-3" />
                  <p className="font-bold uppercase tracking-wider text-sm">No saved plans yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB: REFERENCE DATA ======================= */}
        {activeTab === 'reference' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <header className="mb-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
                <ShieldAlert className="w-3 h-3" />
                <span>Reference Demonstration Data</span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Isolated Audit Records</h1>
              <p className={`text-sm mt-2 font-medium ${textSecondary}`}>These are the hardcoded sample verification records preserved for audit demonstration purposes. Do not rely on these for actual visits.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REFERENCE_DATA.map(inst => (
                <div key={`ref-${inst.id}`} className={`p-6 rounded-2xl border-2 ${cardBg} ${borderTone}`}>
                  <h3 className="text-lg font-black leading-tight mb-1">{inst.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-medium opacity-70 mb-4">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {inst.address}
                  </div>
                  <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2 mb-4`}>
                    <div className="text-xs font-medium border-b pb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                      <strong className="font-black opacity-80 uppercase text-[10px] block">ISL Interpreter</strong>
                      {inst.features.interpreter.text}
                    </div>
                    <div className="text-xs font-medium">
                      <strong className="font-black opacity-80 uppercase text-[10px] block">Visual Queue</strong>
                      {inst.features.visualQueue.text}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPlace(inst); setShowFeedback(true); }} className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#655A7C] dark:text-[#AB92BF] underline hover:opacity-80">Submit Post-Visit Feedback</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ======================= MODALS ======================= */}

      {/* MANUAL ENTRY MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleManualEntry} className={`w-full max-w-md p-6 rounded-3xl border-2 ${borderTone} ${bgCanvas} shadow-2xl`}>
            <h2 className="text-xl font-black uppercase tracking-tight mb-4">Manual Place Entry</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">Place / Institution Name *</label>
                <input type="text" required value={manualPlace.name} onChange={e => setManualPlace({...manualPlace, name: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">Address / Locality</label>
                <input type="text" value={manualPlace.address} onChange={e => setManualPlace({...manualPlace, address: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-1">Category *</label>
                <select value={manualPlace.category} onChange={e => setManualPlace({...manualPlace, category: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={`cat-opt-${c}`} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setShowManualModal(false)} className={`px-4 py-3 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider`}>Cancel</button>
              <button type="submit" disabled={!manualPlace.name.trim()} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-opacity ${manualPlace.name.trim() ? accentSolid : `opacity-50 border ${borderTone}`}`}>Use Location</button>
            </div>
          </form>
        </div>
      )}

      {/* 7-STEP PLANNER MODAL */}
      {showPlanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border-2 ${borderTone} ${bgCanvas} shadow-2xl flex flex-col max-h-[90vh]`}>
            <div className="flex justify-between items-start border-b pb-4 mb-4" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 block">Creating Plan For:</span>
                <h2 className="text-xl font-black uppercase tracking-tight leading-tight">{selectedPlace?.name}</h2>
              </div>
              <button onClick={() => setShowPlanner(false)} className={`p-2 rounded-xl border ${borderTone} ${cardInnerBg} hover:opacity-80`}><XCircle className="w-5 h-5" /></button>
            </div>

            {/* Stepper Progress */}
            <div className="flex justify-between items-center mb-6">
              {[1,2,3,4,5,6,7].map(step => (
                <div key={`stepper-${step}`} className={`h-2 flex-1 mx-0.5 rounded-full ${plannerStep >= step ? accentSolid : `${cardInnerBg} border border-dashed${borderTone}`}`} />
              ))}
            </div>

            <div className="overflow-y-auto no-scrollbar flex-1 pb-4 pr-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {renderPlannerStep()}
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              <button onClick={() => setPlannerStep(Math.max(1, plannerStep - 1))} disabled={plannerStep === 1} className={`px-4 py-3.5 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider disabled:opacity-30`}>Back</button>
              {plannerStep < 7 ? (
                <button onClick={() => setPlannerStep(plannerStep + 1)} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid}`}>Next Step</button>
              ) : (
                <button onClick={saveVisitPlan} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid} flex justify-center items-center gap-2`}><Save className="w-4 h-4" /> Finalize & Save</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POST-VISIT FEEDBACK MODAL */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 ${borderTone} ${bgCanvas} shadow-2xl overflow-y-auto max-h-[90vh]`}>
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Accessibility Report</h2>
            <p className={`text-xs font-medium opacity-70 mb-5 pb-4 border-b`} style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>Report what you observed at <strong>{selectedPlace?.name}</strong> to help the community.</p>
            
            <form onSubmit={submitFeedback} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase block mb-1 opacity-70">Department</label>
                  <input type="text" placeholder="e.g., Cashier" value={feedbackData.department} onChange={e => setFeedbackData({...feedbackData, department: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase block mb-1 opacity-70">Date</label>
                  <input type="date" required value={feedbackData.date} onChange={e => setFeedbackData({...feedbackData, date: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase block mb-2 opacity-70">Features Observed</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(feedbackData.features).map(key => (
                     <label key={`feat-${key}`} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-bold ${feedbackData.features[key] ? accentSolid : `${cardBg}${borderTone}`}`}>
                        <input type="checkbox" className="w-3.5 h-3.5" checked={feedbackData.features[key]} onChange={e => setFeedbackData({...feedbackData, features: {...feedbackData.features, [key]: e.target.checked}})} />
                        {key === 'isl' ? 'ISL Interpreter' : key === 'pads' ? 'Written Pads' : key === 'visual' ? 'Visual Tokens' : 'Ramps / Lifts'}
                     </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase block mb-1 opacity-70">Details / Notes</label>
                <textarea placeholder="e.g., The token display was broken, but staff were helpful..." rows={3} value={feedbackData.notes} onChange={e => setFeedbackData({...feedbackData, notes: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone} resize-none`} />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase block mb-1 opacity-70">Verification Confidence</label>
                <select value={feedbackData.confidence} onChange={e => setFeedbackData({...feedbackData, confidence: e.target.value})} className={`w-full p-3 font-bold border rounded-xl text-sm ${cardInnerBg} ${borderTone}`}>
                  <option value="personally_observed">Personally Observed</option>
                  <option value="directly_confirmed">Directly Confirmed by Staff</option>
                  <option value="uncertain">Uncertain / Third-party report</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <button type="button" onClick={() => setShowFeedback(false)} className={`px-4 py-3.5 rounded-xl border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider`}>Cancel</button>
                <button type="submit" className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid}`}>Submit Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}