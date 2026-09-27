'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  CalendarClock,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ArrowLeft,
  Building,
  AlertCircle,
  CheckSquare,
  Square,
  Edit3,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const CATEGORIES = [
  'Healthcare',
  'Education',
  'Banking & Finance',
  'Work & Career',
  'Appointments',
  'Documents & Applications',
  'Government Services',
  'Travel',
  'Personal',
  'Other'
];

const FOLLOW_UP_TYPES = [
  'General Task',
  'Waiting for Response',
  'Appointment/Visit',
  'Application/Document',
  'Payment/Refund',
  'Personal Action',
  'Recurring Task'
];

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

const STATUSES = [
  'Planned',
  'Waiting for Response',
  'Action Required',
  'Completed',
  'Cancelled'
];

export default function UniversalFollowUpPlanner() {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  const [followUps, setFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [type, setType] = useState('General Task');
  const [nextAction, setNextAction] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [status, setStatus] = useState('Planned');
  const [notes, setNotes] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [checklist, setChecklist] = useState([]); // Array of { id, text, completed }
  const [progressInput, setProgressInput] = useState('');
  const [progressUpdates, setProgressUpdates] = useState([]); // Array of { id, text, timestamp }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('signmitra_followups') || '[]');
      // Safe migration for older records
      const migrated = saved.map(item => ({
        id: item.id || `FOLLOW-${Date.now()}-${Math.random()}`,
        title: item.title || 'Untitled Follow-Up',
        situation: item.situation || '',
        category: item.category || 'General',
        type: item.type || 'General Task',
        nextAction: item.nextAction || item.notes || '',
        contactPerson: item.contactOffice || item.contactPerson || '',
        contactDetails: item.contactDetails || '',
        dueDate: item.targetDate || item.dueDate || new Date().toISOString().split('T')[0],
        priority: item.priority || 'Normal',
        status: item.status || 'Planned',
        notes: item.notes || '',
        checklist: item.checklist || [],
        progressUpdates: item.progressUpdates || []
      }));
      setFollowUps(migrated);
    } catch (e) {
      console.error("Malformed storage error:", e);
      setFollowUps([]);
    }
  }, []);

  const saveToStorage = (updated) => {
    setFollowUps(updated);
    try {
      localStorage.setItem('signmitra_followups', JSON.stringify(updated));
    } catch (err) {
      console.error("Local storage save error:", err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSituation('');
    setCategory('General');
    setCustomCategory('');
    setType('General Task');
    setNextAction('');
    setContactPerson('');
    setContactDetails('');
    setDueDate('');
    setPriority('Normal');
    setStatus('Planned');
    setNotes('');
    setChecklist([]);
    setProgressUpdates([]);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleOpenEdit = (item) => {
    setTitle(item.title);
    setSituation(item.situation);
    setCategory(item.category);
    setType(item.type);
    setNextAction(item.nextAction);
    setContactPerson(item.contactPerson);
    setContactDetails(item.contactDetails);
    setDueDate(item.dueDate);
    setPriority(item.priority);
    setStatus(item.status);
    setNotes(item.notes);
    setChecklist(item.checklist || []);
    setProgressUpdates(item.progressUpdates || []);
    setEditingId(item.id);
    setIsCreating(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;

    const newItem = {
      id: editingId || `FOLLOW-${Date.now()}`,
      title: title.trim(),
      situation: situation.trim(),
      category: finalCategory,
      type,
      nextAction: nextAction.trim(),
      contactPerson: contactPerson.trim(),
      contactDetails: contactDetails.trim(),
      dueDate,
      priority,
      status,
      notes: notes.trim(),
      checklist,
      progressUpdates
    };

    if (editingId) {
      saveToStorage(followUps.map(item => item.id === editingId ? newItem : item));
    } else {
      saveToStorage([newItem, ...followUps]);
    }

    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm("Permanently delete this follow-up record?")) {
      saveToStorage(followUps.filter(item => item.id !== id));
    }
  };

  const toggleChecklist = (itemId, checkId) => {
    saveToStorage(followUps.map(item => {
      if (item.id === itemId) {
        const updatedChecklist = item.checklist.map(chk => chk.id === checkId ? { ...chk, completed: !chk.completed } : chk);
        return { ...item, checklist: updatedChecklist };
      }
      return item;
    }));
  };

  const addChecklistFormItem = () => {
    if (!checklistInput.trim()) return;
    setChecklist([...checklist, { id: `CHK-${Date.now()}`, text: checklistInput.trim(), completed: false }]);
    setChecklistInput('');
  };

  const removeChecklistFormItem = (checkId) => {
    setChecklist(checklist.filter(chk => chk.id !== checkId));
  };

  const addProgressUpdate = (itemId) => {
    if (!progressInput.trim()) return;
    const updateEntry = {
      id: `PROG-${Date.now()}`,
      text: progressInput.trim(),
      timestamp: new Date().toLocaleString()
    };

    saveToStorage(followUps.map(item => {
      if (item.id === itemId) {
        return { ...item, progressUpdates: [updateEntry, ...(item.progressUpdates || [])] };
      }
      return item;
    }));
    setProgressInput('');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering logic
  const filteredFollowUps = followUps.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Today') return item.dueDate === todayStr && item.status !== 'Completed' && item.status !== 'Cancelled';
    if (activeTab === 'Upcoming') return item.dueDate > todayStr && item.status !== 'Completed' && item.status !== 'Cancelled';
    if (activeTab === 'Overdue') return item.dueDate < todayStr && item.status !== 'Completed' && item.status !== 'Cancelled';
    if (activeTab === 'Waiting') return item.status === 'Waiting for Response';
    if (activeTab === 'Action Required') return item.status === 'Action Required';
    if (activeTab === 'Completed') return item.status === 'Completed' || item.status === 'Cancelled';
    return true;
  });

  return (
    <div suppressHydrationWarning className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col ${bgCanvas} ${textPrimary}`}>
      
      {/* Bulletproof CSS to hide scrollbar but keep functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Top Header Bar */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-3">
          <Link href="/communication-hub" className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">UNIVERSAL FOLLOW-UP PLANNER</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#655A7C]" />
          <span className="text-[10px] font-mono font-bold opacity-75 hidden sm:inline">Local Storage Protected</span>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 pb-28">
        
        <header className={`rounded-xl border ${borderTone} p-6 mb-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${cardBg}`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-wider mb-2`}>
              <CalendarClock className="w-3.5 h-3.5" />
              ACTIONABLE LIFECYCLE TRACKER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Universal Follow-Up & Action Planner</h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-xl leading-relaxed ${textSecondary}`}>
              Manage post-interaction actions, hospital visits, bank disputes, document submissions, and personal reminders.
            </p>
          </div>

          {!isCreating && (
            <button
              onClick={() => { resetForm(); setIsCreating(true); }}
              className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 ${accentSolid} hover:opacity-90 shrink-0`}
            >
              <Plus className="w-4 h-4" />
              <span>New Follow-Up</span>
            </button>
          )}
        </header>

        {/* CREATION / EDITING FORM MODAL */}
        {isCreating && (
          <form onSubmit={handleSubmit} className={`p-6 mb-8 rounded-xl border ${borderTone} shadow-sm space-y-5 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
              <h3 className="font-black uppercase tracking-tight text-base">
                {editingId ? 'Edit Follow-Up Task' : 'Create New Follow-Up'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-mono font-bold opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Check scholarship application status"
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Situation / Context (Optional)</label>
                <textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="What happened or why is follow-up needed?"
                  rows={2}
                  className={`p-3 w-full font-medium border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>{cat}</option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider">Custom Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category..."
                    className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone}`}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Follow-Up Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                >
                  {FOLLOW_UP_TYPES.map(t => (
                    <option key={t} value={t} className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Next Action</label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="What specifically needs to be done next?"
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Contact Person / Organization (Optional)</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g., Registrar Office or Dr. Sharma"
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Contact Details (Optional)</label>
                <input
                  type="text"
                  value={contactDetails}
                  onChange={(e) => setContactDetails(e.target.value)}
                  placeholder="Phone, email, room number, website..."
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C] cursor-pointer`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone}`}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p} className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone}`}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} className={isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]'}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">Notes & Preparation Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional information, reference numbers, or required documents..."
                  rows={2}
                  className={`p-3 w-full font-medium border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone}`}
                />
              </div>

              {/* Checklist Builder */}
              <div className="space-y-2 sm:col-span-2 pt-2 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                <label className="text-xs font-mono font-bold uppercase tracking-wider block">Checklist of Steps / Documents</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    placeholder="Add a step (e.g., Submit income certificate)..."
                    className={`p-2.5 flex-1 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addChecklistFormItem(); }}}
                  />
                  <button
                    type="button"
                    onClick={addChecklistFormItem}
                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border ${borderTone} ${cardInnerBg} hover:opacity-80`}
                  >
                    Add Step
                  </button>
                </div>
                {checklist.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {checklist.map(chk => (
                      <div key={chk.id} className={`flex justify-between items-center p-2 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-medium`}>
                        <span>• {chk.text}</span>
                        <button type="button" onClick={() => removeChecklistFormItem(chk.id)} className="text-red-500 font-bold hover:opacity-75">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className={`px-5 py-3 rounded-lg border ${borderTone} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-7 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all ${accentSolid} hover:opacity-90`}
              >
                {editingId ? 'Save Changes' : 'Create Follow-Up'}
              </button>
            </div>
          </form>
        )}

        {/* SEARCH AND FILTER TABS */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Tabs - Fixed Scrollbar visually */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
              {['All', 'Today', 'Upcoming', 'Overdue', 'Waiting', 'Action Required', 'Completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap
                    ${activeTab === tab ? accentSolid + ' border-transparent' : `${cardBg}${borderTone} hover:opacity-80`}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className={`relative w-full sm:w-64 rounded-lg border ${borderTone} ${cardBg} overflow-hidden`}>
              <Search className="absolute left-3 top-3 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className={`w-full py-2.5 pl-9 pr-3 text-xs font-bold bg-transparent outline-none`}
              />
            </div>
          </div>
        </div>

        {/* FOLLOW-UP LIST */}
        {filteredFollowUps.length === 0 ? (
          <div className={`p-10 rounded-xl border border-dashed ${borderTone} ${cardInnerBg} text-center space-y-3`}>
            <CalendarClock className="w-8 h-8 mx-auto opacity-50" />
            <h3 className="font-bold uppercase tracking-tight">No Follow-Ups Found</h3>
            <p className={`text-xs font-mono ${textSecondary}`}>No tasks match your selected filter or search query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFollowUps.map((item) => {
              const isExpanded = expandedId === item.id;
              const isOverdue = item.dueDate < todayStr && item.status !== 'Completed' && item.status !== 'Cancelled';
              const isCompleted = item.status === 'Completed' || item.status === 'Cancelled';

              return (
                <div key={item.id} className={`rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden transition-all ${isCompleted ? 'opacity-60' : ''}`}>
                  
                  {/* Main Card Bar */}
                  <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isCompleted ? 'bg-slate-500 text-white' : isOverdue ? 'bg-red-500 text-white animate-pulse' : accentSolid
                        }`}>
                          {isOverdue ? 'Overdue' : item.status}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg} uppercase tracking-wider`}>
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold opacity-65 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: {item.dueDate}
                        </span>
                      </div>

                      <h3 className={`font-black uppercase tracking-tight text-base sm:text-lg ${isCompleted ? 'line-through' : ''}`}>
                        {item.title}
                      </h3>

                      {item.nextAction && (
                        <p className="text-xs sm:text-sm font-bold opacity-90">
                          <span className="font-mono uppercase text-[10px] opacity-70 block">Next Action:</span>
                          👉 {item.nextAction}
                        </p>
                      )}

                      {item.contactPerson && (
                        <div className="flex items-center gap-2 text-xs font-mono opacity-80">
                          <Building className="w-3.5 h-3.5 text-[#655A7C]" />
                          <span>{item.contactPerson} {item.contactDetails ? `(${item.contactDetails})` : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                      <button
                        onClick={() => {
                          const nextStatus = isCompleted ? 'Planned' : 'Completed';
                          saveToStorage(followUps.map(f => f.id === item.id ? { ...f, status: nextStatus } : f));
                        }}
                        className={`p-2 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all text-xs font-mono font-bold flex items-center gap-1`}
                        title="Toggle Completion"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="sm:hidden">{isCompleted ? 'Reopen' : 'Complete'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className={`p-2 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
                        title="Edit Task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={`p-2 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
                        title="Toggle Details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:opacity-75 transition-all"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS & PROGRESS UPDATES */}
                  {isExpanded && (
                    <div className={`p-5 pt-0 border-t ${borderTone} bg-black/5 dark:bg-white/5 space-y-4`}>
                      
                      {item.situation && (
                        <div className="pt-3">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-0.5">Situation Context</span>
                          <p className="text-xs sm:text-sm font-medium">{item.situation}</p>
                        </div>
                      )}

                      {item.notes && (
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block mb-0.5">Notes & Details</span>
                          <p className="text-xs sm:text-sm font-medium">{item.notes}</p>
                        </div>
                      )}

                      {/* Checklist Section */}
                      {item.checklist && item.checklist.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">Checklist Progress</span>
                          <div className="space-y-1">
                            {item.checklist.map(chk => (
                              <button
                                key={chk.id}
                                onClick={() => toggleChecklist(item.id, chk.id)}
                                className={`w-full text-left p-2 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-bold flex items-center gap-2 hover:opacity-80 transition-all`}
                              >
                                {chk.completed ? <CheckSquare className="w-4 h-4 text-green-600 shrink-0" /> : <Square className="w-4 h-4 opacity-50 shrink-0" />}
                                <span className={chk.completed ? 'line-through opacity-70' : ''}>{chk.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress Updates Log */}
                      <div className="space-y-2 pt-2 border-t" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 block">Progress Log & Timestamp History</span>
                        
                        {item.progressUpdates && item.progressUpdates.length > 0 ? (
                          <div className="space-y-1.5">
                            {item.progressUpdates.map(prog => (
                              <div key={prog.id} className={`p-2.5 rounded-lg border ${borderTone} ${cardInnerBg} text-xs space-y-0.5`}>
                                <div className="flex justify-between font-mono text-[10px] opacity-60">
                                  <span>Update</span>
                                  <span>{prog.timestamp}</span>
                                </div>
                                <p className="font-bold">{prog.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-mono opacity-60 italic">No progress updates recorded yet.</p>
                        )}

                        {/* Add Progress Input */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={progressInput}
                            onChange={(e) => setProgressInput(e.target.value)}
                            placeholder="Add progress update (e.g., Spoke with manager)..."
                            className={`p-2 flex-1 font-bold border rounded-lg text-xs outline-none ${cardInnerBg} ${borderTone}`}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProgressUpdate(item.id); }}}
                          />
                          <button
                            type="button"
                            onClick={() => addProgressUpdate(item.id)}
                            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider ${accentSolid} hover:opacity-90`}
                          >
                            Log
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}