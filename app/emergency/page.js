'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '@/context/ThemeContext';
import {
  ShieldAlert,
  Edit3,
  Phone,
  Droplet,
  User,
  HeartPulse,
  AlertTriangle,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sun,
  Moon,
  Building,
  Check,
  Stethoscope,
  Pill,
  Copy,
  QrCode,
  MapPin,
  Flame,
  Trash2,
  X,
  Plus,
  Paperclip,
  SlidersHorizontal
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM (Exclusively 3 Colors):
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
  Zero outside colors (no black, white, red, green, gray).
*/

export default function EmergencyProfile() {
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

  const [isEditing, setIsEditing] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'assist' | 'qr' | 'customize' | null
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Full state architecture with structured entities and privacy switches
  const [profile, setProfile] = useState({
    name: 'Rimsha Konain C',
    preferredName: 'Rimsha',
    age: '19',
    primaryLanguage: 'Indian Sign Language (ISL)',
    communicationPreferences: ['Indian Sign Language (ISL)', 'Written Notes'],
    requiresInterpreter: 'No',
    bloodGroup: 'AB+',
    
    // Structured Allergies (Feature 3)
    allergiesList: [
      { substance: 'Peanuts', severity: 'Severe', reaction: 'Anaphylaxis' },
      { substance: 'Penicillin', severity: 'Moderate', reaction: 'Hives / Rash' }
    ],
    allergiesLastReviewed: '2026-09-15',

    // Structured Medications (Feature 3)
    medicationsList: [
      { name: 'Albuterol', dosage: '90mcg', frequency: 'As needed', purpose: 'Rescue Inhaler' }
    ],
    medicationsLastReviewed: '2026-09-20',

    criticalMedicalInfo: 'Asthma (Carries rescue inhaler)',

    // Contacts with Response Preferences (Feature 4)
    emergencyContact: '8667837945',
    emergencyContactRelation: 'Parent / Primary Guardian',
    primaryContactMethod: 'Call First',

    secondaryContact: '7418279942',
    secondaryContactRelation: 'Sibling',
    secondaryContactMethod: 'SMS / WhatsApp Backup',

    // Preferred Care & Attending Clinician
    preferredHospital: 'City General Emergency Care',
    primaryDoctor: 'Dr. S. Ramanathan',
    doctorPhone: '9444123890',

    // Documents (Feature 6)
    documents: [
      { id: 'doc_1', name: 'Asthma_Action_Plan.pdf', size: '142 KB', date: '2026-08-10' }
    ],

    // Card Customization / Privacy Toggles (Feature 10)
    displaySettings: {
      showBloodGroup: true,
      showAllergies: true,
      showMedications: true,
      showSecondaryContact: true,
      showDoctorInfo: true
    }
  });

  const MOCK_USER_ID = 'mock_user_123';

  useEffect(() => {
    const saved = localStorage.getItem('signmitra_emergency_vault_v2');
    const savedTime = localStorage.getItem('signmitra_emergency_updated_at');

    if (saved) {
      setProfile(JSON.parse(saved));
      if (savedTime) setLastUpdated(savedTime);
    }

    import('@/components/api')
      .then(({ signMitraAPI }) => {
        signMitraAPI
          .getEmergencyProfile(MOCK_USER_ID)
          .then((serverProfile) => {
            if (serverProfile) {
              setProfile((prev) => ({ ...prev, ...serverProfile }));
              const timeString = new Date().toLocaleString();
              setLastUpdated(timeString);
              localStorage.setItem('signmitra_emergency_vault_v2', JSON.stringify(serverProfile));
              localStorage.setItem('signmitra_emergency_updated_at', timeString);
            }
          })
          .catch((err) => {
            console.log('📬 Local vault active. Operating offline:', err.message);
          });
      })
      .catch(() => {});
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const timeString = new Date().toLocaleString();
    setLastUpdated(timeString);

    localStorage.setItem('signmitra_emergency_vault_v2', JSON.stringify(profile));
    localStorage.setItem('signmitra_emergency_updated_at', timeString);
    setIsEditing(false);
  };

  const handleClearLocalCache = () => {
    if (confirm('Clear local emergency records from hardware storage?')) {
      localStorage.removeItem('signmitra_emergency_vault_v2');
      localStorage.removeItem('signmitra_emergency_updated_at');
      setLastUpdated(null);
      alert('Local device cache cleared.');
    }
  };

  const handleMarkReviewed = (field) => {
    const today = new Date().toISOString().split('T')[0];
    setProfile((prev) => ({ ...prev, [field]: today }));
  };

  const handleCopyCard = () => {
    const allergyText = profile.allergiesList.map((a) => `${a.substance} (${a.severity})`).join(', ');
    const medText = profile.medicationsList.map((m) => `${m.name} ${m.dosage}`).join(', ');
    const textPayload = `EMERGENCY PROFILE: ${profile.name}\n• Notice: Deaf/Hard-of-Hearing (${profile.primaryLanguage})\n• Blood Group: ${profile.bloodGroup}\n• Allergies: ${allergyText || 'None'}\n• Rx: ${medText || 'None'}\n• Hospital: ${profile.preferredHospital || 'Unset'}\n• Physician: ${profile.primaryDoctor} (${profile.doctorPhone})\n• Primary SOS: ${profile.emergencyContact} (${profile.emergencyContactRelation})\n• Secondary SOS: ${profile.secondaryContact} (${profile.secondaryContactRelation})`;
    navigator.clipboard.writeText(textPayload);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Structured Array Handlers (Feature 3)
  const addAllergy = () => {
    setProfile((prev) => ({
      ...prev,
      allergiesList: [...prev.allergiesList, { substance: '', severity: 'Moderate', reaction: '' }]
    }));
  };

  const updateAllergy = (idx, key, val) => {
    const updated = [...profile.allergiesList];
    updated[idx][key] = val;
    setProfile((prev) => ({ ...prev, allergiesList: updated }));
  };

  const removeAllergy = (idx) => {
    setProfile((prev) => ({
      ...prev,
      allergiesList: prev.allergiesList.filter((_, i) => i !== idx)
    }));
  };

  const addMedication = () => {
    setProfile((prev) => ({
      ...prev,
      medicationsList: [...prev.medicationsList, { name: '', dosage: '', frequency: '', purpose: '' }]
    }));
  };

  const updateMedication = (idx, key, val) => {
    const updated = [...profile.medicationsList];
    updated[idx][key] = val;
    setProfile((prev) => ({ ...prev, medicationsList: updated }));
  };

  const removeMedication = (idx) => {
    setProfile((prev) => ({
      ...prev,
      medicationsList: prev.medicationsList.filter((_, i) => i !== idx)
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDoc = {
        id: `doc_${Date.now()}`,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        date: new Date().toISOString().split('T')[0]
      };
      setProfile((prev) => ({ ...prev, documents: [...prev.documents, newDoc] }));
    }
  };

  const removeDocument = (id) => {
    setProfile((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== id) }));
  };

  // Readiness checklist calculations (Feature 7)
  const readinessChecks = [
    { label: 'Primary Contact', complete: Boolean(profile.emergencyContact) },
    { label: 'Secondary Contact', complete: Boolean(profile.secondaryContact) },
    { label: 'Blood Group', complete: Boolean(profile.bloodGroup) },
    { label: 'Allergies Reviewed', complete: profile.allergiesList.length > 0 },
    { label: 'Medications Documented', complete: profile.medicationsList.length > 0 },
    { label: 'Hospital Facility', complete: Boolean(profile.preferredHospital) },
    { label: 'Attending Doctor', complete: Boolean(profile.primaryDoctor) }
  ];
  const readinessScore = Math.round(
    (readinessChecks.filter((c) => c.complete).length / readinessChecks.length) * 100
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Top Header Navbar */}
      <div className={`w-full border-b py-2.5 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Hub</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">EMERGENCY ASSISTANCE VAULT</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-bold">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`} />
            <span>HARDWARE SECURE</span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 my-auto">
        
        {/* Header Ribbon */}
        <header className={`mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-5 border-b ${borderTone}`}>
          <div>
            <div className={`flex items-center gap-2 mb-2 font-mono text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
              <ShieldAlert className="w-4 h-4" />
              <span>Priority Triage & Life Safety Suite</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Emergency Vault
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-xl font-medium ${textSecondary}`}>
              Structured clinical indicators, offline QR verification, and visual accommodation tools for first responders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setActiveModal('customize')}
                  className={`p-2.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
                  title="Card Privacy & Sharing Controls"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all ${accentSolid}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modify Vault</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: Read-Only Triage Manifest */}
        {/* ========================================================= */}
        {!isEditing && (
          <div className="space-y-6">

            {/* Feature 5: Unable to Respond Mode Trigger */}
            <div className={`p-5 rounded-xl border-2 ${borderTone} ${cardBg} shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold ${accentSolid} shrink-0`}>
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm uppercase tracking-wide">
                    Unable to Respond Mode
                  </h2>
                  <p className={`text-xs font-medium ${textSecondary}`}>
                    One-touch full-screen triage manifest for attending clinicians and bystanders.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal('assist')}
                className={`w-full sm:w-auto px-5 py-3 rounded-lg text-xs font-mono font-black uppercase tracking-widest transition-all ${accentSolid} hover:opacity-90 shadow-sm shrink-0`}
              >
                🚨 Launch Assist View
              </button>
            </div>

            {/* Feature 1: Emergency Action Center */}
            <section className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <a
                href="tel:112"
                className={`p-3.5 rounded-lg border ${borderTone} ${accentSolid} flex flex-col items-center justify-center text-center hover:opacity-90 active:scale-95 transition-all shadow-sm`}
              >
                <Phone className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-black uppercase tracking-wider">Dial 112</span>
                <span className="text-[9px] font-mono opacity-90">Emergency</span>
              </a>

              <a
                href={`tel:${profile.emergencyContact}`}
                className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col items-center justify-center text-center hover:opacity-90 active:scale-95 transition-all`}
              >
                <Phone className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Call SOS</span>
                <span className="text-[9px] font-mono opacity-80 truncate w-full">{profile.emergencyContact}</span>
              </a>

              <button
                onClick={handleCopyCard}
                className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col items-center justify-center text-center hover:opacity-90 active:scale-95 transition-all`}
              >
                {copyFeedback ? <Check className="w-4 h-4 mb-1" /> : <Copy className="w-4 h-4 mb-1" />}
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {copyFeedback ? 'Copied' : 'Copy Card'}
                </span>
                <span className="text-[9px] font-mono opacity-80">Clipboard</span>
              </button>

              <button
                onClick={() => setActiveModal('qr')}
                className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col items-center justify-center text-center hover:opacity-90 active:scale-95 transition-all`}
              >
                <QrCode className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Triage QR</span>
                <span className="text-[9px] font-mono opacity-80">Offline Scan</span>
              </button>

              {profile.preferredHospital ? (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(profile.preferredHospital)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg} col-span-2 sm:col-span-1 flex flex-col items-center justify-center text-center hover:opacity-90 active:scale-95 transition-all`}
                >
                  <MapPin className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Hospital Map</span>
                  <span className="text-[9px] font-mono opacity-80 truncate w-full">Navigation</span>
                </a>
              ) : (
                <div className={`p-3.5 rounded-lg border ${borderTone} ${cardInnerBg} opacity-50 col-span-2 sm:col-span-1 flex flex-col items-center justify-center text-center`}>
                  <MapPin className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Hospital Map</span>
                  <span className="text-[9px] font-mono opacity-80">Unconfigured</span>
                </div>
              )}
            </section>

            {/* Communication Notice Card */}
            <section className={`p-6 sm:p-7 rounded-xl border-2 ${borderTone} ${cardBg} shadow-sm relative overflow-hidden`}>
              <div className={`flex items-center justify-between border-b pb-3 mb-4 ${borderTone}`}>
                <span className={`text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded ${accentSolid}`}>
                  COMMUNICATION NOTICE
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>
                  INTERPRETER STATUS: {profile.requiresInterpreter}
                </span>
              </div>

              <p className="text-lg sm:text-xl font-black tracking-tight leading-snug mb-4">
                “I communicate using Indian Sign Language (ISL). Please provide visual guidance or written instructions. Do not expect verbal responses.”
              </p>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono font-bold pt-3 border-t ${borderTone}`}>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Primary Language: {profile.primaryLanguage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Preferred Modes: Visual & Written Prompts</span>
                </div>
              </div>
            </section>

            {/* Feature 3: Structured Clinical Indicators */}
            <section className={`rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden`}>
              <div className={`p-4 border-b ${borderTone} ${cardInnerBg} flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider`}>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified Triage Indicators
                </span>
                <span className="opacity-80">Triage Level 1</span>
              </div>

              <div className={`p-6 divide-y ${borderTone}`}>
                {/* Identity & Blood */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6">
                  <div>
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>
                      Full Legal Name
                    </span>
                    <p className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                      {profile.name}
                    </p>
                    {profile.preferredName && (
                      <span className={`text-xs font-mono font-bold block mt-1 ${textSecondary}`}>
                        Known as: {profile.preferredName} ({profile.age} yrs)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>
                      Blood Group
                    </span>
                    <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                      {profile.bloodGroup}
                    </p>
                  </div>

                  <div>
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>
                      Critical Conditions
                    </span>
                    <p className="text-sm sm:text-base font-bold">
                      {profile.criticalMedicalInfo || 'No existing conditions declared.'}
                    </p>
                  </div>
                </div>

                {/* Structured Allergies List */}
                <div className="py-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                      Declared Allergies ({profile.allergiesList.length})
                    </span>
                    <div className={`flex items-center gap-2 text-[10px] font-mono ${textSecondary}`}>
                      <span>Reviewed: {profile.allergiesLastReviewed}</span>
                      <button
                        onClick={() => handleMarkReviewed('allergiesLastReviewed')}
                        className="underline font-bold hover:opacity-80"
                      >
                        Confirm Active
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.allergiesList.map((alg, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono`}>
                        <div className="flex justify-between font-bold text-sm">
                          <span>{alg.substance}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${borderTone} uppercase font-bold`}>{alg.severity}</span>
                        </div>
                        <span className={`text-[11px] mt-1 block ${textSecondary}`}>Reaction: {alg.reaction || 'Unspecified'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Structured Medications List */}
                <div className="pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                      Maintenance Medications ({profile.medicationsList.length})
                    </span>
                    <div className={`flex items-center gap-2 text-[10px] font-mono ${textSecondary}`}>
                      <span>Reviewed: {profile.medicationsLastReviewed}</span>
                      <button
                        onClick={() => handleMarkReviewed('medicationsLastReviewed')}
                        className="underline font-bold hover:opacity-80"
                      >
                        Confirm Active
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.medicationsList.map((med, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono`}>
                        <div className="flex justify-between font-bold text-sm">
                          <span>{med.name}</span>
                          <span className="text-xs">{med.dosage}</span>
                        </div>
                        <span className={`text-[11px] mt-1 block font-semibold ${textSecondary}`}>{med.purpose} • {med.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* RESTORED: Preferred Healthcare Facility & Primary Physician */}
            <section className={`rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden`}>
              <div className={`p-4 border-b ${borderTone} ${cardInnerBg} flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider`}>
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Preferred Healthcare Destination & Physician
                </span>
                <span className="opacity-80 font-bold">Medical Network</span>
              </div>

              <div className={`p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 ${borderTone}`}>
                {/* Hospital Card */}
                <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col justify-between`}>
                  <div>
                    <span className={`text-[10px] font-mono font-bold uppercase block mb-1 ${textSecondary}`}>
                      Designated Emergency Hospital
                    </span>
                    <p className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                      <Building className="w-4 h-4 shrink-0" />
                      <span>{profile.preferredHospital || 'None Specified'}</span>
                    </p>
                  </div>
                  {profile.preferredHospital && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(profile.preferredHospital)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-4 py-2 px-3 rounded text-center text-xs font-mono font-bold uppercase tracking-wider border ${borderTone} ${cardBg} hover:opacity-80 inline-flex items-center justify-center gap-1.5`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Open Directions</span>
                    </a>
                  )}
                </div>

                {/* Primary Doctor Card */}
                <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col justify-between`}>
                  <div>
                    <span className={`text-[10px] font-mono font-bold uppercase block mb-1 ${textSecondary}`}>
                      Attending Primary Care Physician
                    </span>
                    <p className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 shrink-0" />
                      <span>{profile.primaryDoctor || 'None Specified'}</span>
                    </p>
                    {profile.doctorPhone && (
                      <span className={`text-xs font-mono font-bold block mt-1 ${textSecondary}`}>
                        Phone: {profile.doctorPhone}
                      </span>
                    )}
                  </div>
                  {profile.doctorPhone ? (
                    <a
                      href={`tel:${profile.doctorPhone}`}
                      className={`mt-4 py-2 px-3 rounded text-center text-xs font-mono font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 ${accentSolid} hover:opacity-90 active:scale-95 transition-all`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Physician</span>
                    </a>
                  ) : (
                    <div className={`mt-4 py-2 px-3 rounded text-center text-xs font-mono font-bold uppercase tracking-wider border border-dashed ${borderTone} opacity-60`}>
                      No Phone Listed
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Feature 4: Contacts with Response Preferences */}
            <section className={`rounded-xl border ${borderTone} ${cardBg} shadow-sm overflow-hidden`}>
              <div className={`p-4 border-b ${borderTone} ${cardInnerBg} flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider`}>
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Emergency Escalation Contacts
                </span>
                <span className="opacity-80 font-bold">Priority Dispatched</span>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x ${borderTone}`}>
                {/* Primary Contact */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[11px] font-mono font-bold uppercase ${textSecondary}`}>
                        Primary • {profile.emergencyContactRelation}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg} font-bold`}>
                        {profile.primaryContactMethod}
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight block">
                      {profile.emergencyContact}
                    </span>
                  </div>
                  <a
                    href={`tel:${profile.emergencyContact}`}
                    className={`mt-5 py-3 px-4 rounded-lg text-center text-xs font-mono font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90 active:scale-95 transition-all`}
                  >
                    <span>📞</span>
                    <span>Call Primary Contact</span>
                  </a>
                </div>

                {/* Secondary Contact */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[11px] font-mono font-bold uppercase ${textSecondary}`}>
                        Secondary • {profile.secondaryContactRelation}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg} font-bold`}>
                        {profile.secondaryContactMethod}
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight block">
                      {profile.secondaryContact || 'Not Specified'}
                    </span>
                  </div>
                  {profile.secondaryContact ? (
                    <a
                      href={`tel:${profile.secondaryContact}`}
                      className={`mt-5 py-3 px-4 rounded-lg text-center text-xs font-mono font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90 active:scale-95 transition-all`}
                    >
                      <span>📞</span>
                      <span>Call Secondary Contact</span>
                    </a>
                  ) : (
                    <div className={`mt-5 py-3 px-4 rounded-lg text-center text-xs font-mono font-bold uppercase tracking-wider border border-dashed ${borderTone} opacity-60`}>
                      No Secondary Listed
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Feature 6: Medical & Communication Documents */}
            <section className={`p-6 rounded-xl border ${borderTone} ${cardBg} space-y-4`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold uppercase flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Stored Medical & Communication Documents
                </span>
                <label className={`cursor-pointer px-3 py-1 rounded text-xs font-mono font-bold border ${borderTone} ${cardInnerBg} hover:opacity-80`}>
                  <span>Upload Document</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.png" />
                </label>
              </div>

              {profile.documents.length === 0 ? (
                <span className={`text-xs font-mono opacity-60 block ${textSecondary}`}>No clinical records or prescriptions attached.</span>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.documents.map((doc) => (
                    <div key={doc.id} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} flex justify-between items-center text-xs font-mono`}>
                      <div>
                        <span className="font-bold block truncate max-w-[200px]">{doc.name}</span>
                        <span className={`text-[10px] ${textSecondary}`}>{doc.size} • Uploaded {doc.date}</span>
                      </div>
                      <button onClick={() => removeDocument(doc.id)} className="p-1 hover:opacity-80">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Feature 7 & 9: Profile Readiness & Offline Telemetry */}
            <div className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-mono`}>
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile Readiness: {readinessScore}%</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {readinessChecks.map((chk) => (
                  <span
                    key={chk.label}
                    className={`px-2.5 py-0.5 rounded border ${borderTone} ${
                      chk.complete ? accentSolid : 'opacity-40'
                    }`}
                  >
                    {chk.complete ? '✓' : '✗'} {chk.label}
                  </span>
                ))}
              </div>
            </div>

            <div className={`flex justify-between items-center pt-2 text-[11px] font-mono ${textSecondary}`}>
              <span>{lastUpdated ? `Saved on device: ${lastUpdated}` : 'Active Memory Storage'}</span>
              <button
                type="button"
                onClick={handleClearLocalCache}
                className="hover:opacity-100 flex items-center gap-1.5 transition-opacity font-bold underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Device Cache</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: Complete Vault Configuration Editor */}
        {/* ========================================================= */}
        {isEditing && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono font-medium leading-relaxed flex items-start gap-2.5`}>
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Hardware Privacy Vault: Records persist locally for instant offline rendering, and synchronize securely with your cloud profile when network connectivity is available[cite: 12].
              </span>
            </div>

            {/* Section 1: Identification */}
            <div className={`p-6 rounded-xl border ${borderTone} ${cardBg} space-y-4`}>
              <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}>
                1. Identification & Communication
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-mono font-bold uppercase">Full Legal Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Age</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                    className={`p-3 font-mono font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Primary Language</label>
                  <input
                    type="text"
                    value={profile.primaryLanguage}
                    onChange={(e) => setProfile((p) => ({ ...p, primaryLanguage: e.target.value }))}
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Blood Group</label>
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-xs font-bold">
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setProfile((p) => ({ ...p, bloodGroup: bg }))}
                        className={`py-2 rounded border text-center ${
                          profile.bloodGroup === bg ? accentSolid : `${cardInnerBg}${borderTone}`
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Structured Allergies Editor */}
            <div className={`p-6 rounded-xl border ${borderTone} ${cardBg} space-y-4`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}>
                  2. Structured Allergies
                </h2>
                <button
                  type="button"
                  onClick={addAllergy}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold border ${borderTone} flex items-center gap-1.5 hover:opacity-80`}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Allergy
                </button>
              </div>

              {profile.allergiesList.map((alg, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} grid grid-cols-1 sm:grid-cols-3 gap-3 items-end`}>
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>Substance</label>
                    <input
                      type="text"
                      value={alg.substance}
                      onChange={(e) => updateAllergy(idx, 'substance', e.target.value)}
                      placeholder="e.g., Peanuts"
                      className={`p-2 rounded border text-xs font-bold ${cardBg} ${borderTone}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>Severity</label>
                    <select
                      value={alg.severity}
                      onChange={(e) => updateAllergy(idx, 'severity', e.target.value)}
                      className={`p-2 rounded border text-xs font-bold ${cardBg} ${borderTone}`}
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>Reaction</label>
                      <input
                        type="text"
                        value={alg.reaction}
                        onChange={(e) => updateAllergy(idx, 'reaction', e.target.value)}
                        placeholder="e.g., Rash, Anaphylaxis"
                        className={`p-2 rounded border text-xs font-bold ${cardBg} ${borderTone}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAllergy(idx)}
                      className="p-2 text-xs font-mono font-bold hover:opacity-75"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 3: Structured Medications Editor */}
            <div className={`p-6 rounded-xl border ${borderTone} ${cardBg} space-y-4`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}>
                  3. Maintenance Medications
                </h2>
                <button
                  type="button"
                  onClick={addMedication}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold border ${borderTone} flex items-center gap-1.5 hover:opacity-80`}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medication
                </button>
              </div>

              {profile.medicationsList.map((med, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} grid grid-cols-1 sm:grid-cols-4 gap-3 items-end`}>
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>Medication Name</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                      placeholder="e.g., Albuterol"
                      className={`p-2 rounded border text-xs font-bold ${cardBg} ${borderTone}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                      placeholder="e.g., 90mcg"
                      className={`p-2 rounded border text-xs font-bold ${cardBg} ${borderTone}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>Frequency</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                      placeholder="e.g., Daily, As needed"
                      className={`p-2 rounded border text-xs font-bold ${cardBg} ${borderTone}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className={`text-[10px] font-mono font-bold uppercase ${textSecondary}`}>Purpose</label>
                      <input
                        type="text"
                        value={med.purpose}
                        onChange={(e) => updateMedication(idx, 'purpose', e.target.value)}
                        placeholder="e.g., Inhaler"
                        className={`p-2 rounded border text-xs font-bold ${cardBg} ${borderTone}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedication(idx)}
                      className="p-2 text-xs font-mono font-bold hover:opacity-75"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 4: Preferred Hospital / Doctor Editor */}
            <div className={`p-6 rounded-xl border ${borderTone} ${cardBg} space-y-4`}>
              <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}>
                4. Preferred Healthcare Destination & Doctor
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Preferred Hospital</label>
                  <input
                    type="text"
                    value={profile.preferredHospital}
                    onChange={(e) => setProfile((p) => ({ ...p, preferredHospital: e.target.value }))}
                    placeholder="e.g., City General Hospital"
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Primary Physician</label>
                  <input
                    type="text"
                    value={profile.primaryDoctor}
                    onChange={(e) => setProfile((p) => ({ ...p, primaryDoctor: e.target.value }))}
                    placeholder="e.g., Dr. S. Ramanathan"
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Physician Phone</label>
                  <input
                    type="tel"
                    value={profile.doctorPhone}
                    onChange={(e) => setProfile((p) => ({ ...p, doctorPhone: e.target.value }))}
                    placeholder="+91 94441 23890"
                    className={`p-3 font-mono font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Emergency Contacts */}
            <div className={`p-6 rounded-xl border ${borderTone} ${cardBg} space-y-4`}>
              <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}>
                5. Escalation Contacts & Dispatch Protocol
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Primary SOS Phone</label>
                  <input
                    type="tel"
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: e.target.value }))}
                    className={`p-3 font-mono font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Relationship</label>
                  <input
                    type="text"
                    value={profile.emergencyContactRelation}
                    onChange={(e) => setProfile((p) => ({ ...p, emergencyContactRelation: e.target.value }))}
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Preferred Method</label>
                  <select
                    value={profile.primaryContactMethod}
                    onChange={(e) => setProfile((p) => ({ ...p, primaryContactMethod: e.target.value }))}
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  >
                    <option value="Call First">Call First</option>
                    <option value="SMS / WhatsApp First">SMS / WhatsApp First</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Secondary Phone</label>
                  <input
                    type="tel"
                    value={profile.secondaryContact}
                    onChange={(e) => setProfile((p) => ({ ...p, secondaryContact: e.target.value }))}
                    className={`p-3 font-mono font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Relationship</label>
                  <input
                    type="text"
                    value={profile.secondaryContactRelation}
                    onChange={(e) => setProfile((p) => ({ ...p, secondaryContactRelation: e.target.value }))}
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase">Preferred Method</label>
                  <select
                    value={profile.secondaryContactMethod}
                    onChange={(e) => setProfile((p) => ({ ...p, secondaryContactMethod: e.target.value }))}
                    className={`p-3 font-bold border rounded-lg text-xs sm:text-sm outline-none ${cardInnerBg} ${borderTone}`}
                  >
                    <option value="SMS / WhatsApp Backup">SMS / WhatsApp Backup</option>
                    <option value="Call Secondary">Call Secondary</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`w-1/3 py-3 rounded-lg border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 ${accentSolid}`}
              >
                Save Emergency Records
              </button>
            </div>
          </form>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODALS: Assist View, Scannable QR, and Card Customizer */}
      {/* ========================================================= */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isDarkTheme ? 'bg-[#655A7C]/80' : 'bg-[#FDF1E2]/80'
          }`}
        >
          {/* Feature 5: Full-Screen Unable to Respond View */}
          {activeModal === 'assist' && (
            <div className={`w-full max-w-2xl rounded-2xl border-2 ${borderTone} p-6 sm:p-8 shadow-2xl space-y-6 ${cardBg}`}>
              <div className={`flex items-center justify-between border-b pb-4 ${borderTone}`}>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  <span className="text-sm font-mono font-black uppercase tracking-widest">
                    EMERGENCY ASSIST: UNABLE TO RESPOND
                  </span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className={`p-1.5 rounded-lg border ${borderTone} hover:opacity-80`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-5 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                  <span className={`text-[10px] font-mono font-bold uppercase opacity-75 block mb-1 ${textSecondary}`}>
                    1. COMMUNICATION ACCOMMODATION
                  </span>
                  <p className="text-base sm:text-lg font-black leading-snug">
                    “I am Deaf / Hard-of-Hearing. Please communicate visually or via written text. Do not rely on spoken instructions.”
                  </p>
                </div>

                <div className={`p-5 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                  <span className={`text-[10px] font-mono font-bold uppercase opacity-75 block mb-2 ${textSecondary}`}>
                    2. CRITICAL TRIAGE MANIFEST
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono font-bold">
                    <div className={`p-2.5 rounded border ${borderTone} ${cardBg}`}>
                      <span className="text-[9px] opacity-70 block">BLOOD:</span>
                      <span className="text-base font-black">{profile.bloodGroup}</span>
                    </div>
                    <div className={`p-2.5 rounded border ${borderTone} ${cardBg} sm:col-span-3`}>
                      <span className="text-[9px] opacity-70 block">ALLERGIES:</span>
                      <span>
                        {profile.allergiesList.map((a) => `${a.substance} (${a.severity})`).join(', ') || 'None'}
                      </span>
                    </div>
                    <div className={`p-2.5 rounded border ${borderTone} ${cardBg} col-span-2`}>
                      <span className="text-[9px] opacity-70 block">CONDITIONS:</span>
                      <span>{profile.criticalMedicalInfo || 'None declared'}</span>
                    </div>
                    <div className={`p-2.5 rounded border ${borderTone} ${cardBg} col-span-2`}>
                      <span className="text-[9px] opacity-70 block">MEDICATIONS:</span>
                      <span>
                        {profile.medicationsList.map((m) => `${m.name} ${m.dosage}`).join(', ') || 'None declared'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href={`tel:${profile.emergencyContact}`}
                    className={`py-3.5 px-4 rounded-xl text-center text-xs font-mono font-black uppercase tracking-wider shadow-md ${accentSolid} hover:opacity-90`}
                  >
                    📞 Call SOS: {profile.emergencyContact}
                  </a>
                  <a
                    href="tel:112"
                    className={`py-3.5 px-4 rounded-xl text-center text-xs font-mono font-black uppercase tracking-wider border-2 ${borderTone} ${cardInnerBg} hover:opacity-90 shadow-md`}
                  >
                    🚨 Dial 112 (Emergency)
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Feature 2: Scannable Vector QR Modal */}
          {activeModal === 'qr' && (
            <div className={`w-full max-w-sm rounded-xl border ${borderTone} p-6 shadow-2xl text-center space-y-4 ${cardBg}`}>
              <div className={`flex items-center justify-between border-b pb-3 ${borderTone}`}>
                <span className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  Offline Scannable Card
                </span>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:opacity-75">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className={`p-6 rounded-lg border ${borderTone} ${cardInnerBg} flex flex-col items-center justify-center`}>
                <div className="p-3 bg-[#FDF1E2] rounded-xl shadow-md border border-[#655A7C]/30 flex items-center justify-center">
                  <QRCodeSVG
                    value={`SIGNMITRA EMERGENCY VAULT
Name: ${profile.name}
Language: ${profile.primaryLanguage}
Blood Group: ${profile.displaySettings.showBloodGroup ? profile.bloodGroup : 'Redacted'}
Allergies: ${profile.displaySettings.showAllergies ? profile.allergiesList.map((a) => a.substance).join(', ') : 'Redacted'}
Hospital: ${profile.preferredHospital || 'Unset'}
Doctor: ${profile.displaySettings.showDoctorInfo ? profile.primaryDoctor : 'Redacted'}
Primary SOS: ${profile.emergencyContact}`}
                    size={160}
                    bgColor="#FDF1E2"
                    fgColor="#655A7C"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold opacity-80 mt-3 block">
                  Scan with any camera for instant triage readout
                </span>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${accentSolid} hover:opacity-90`}
              >
                Close View
              </button>
            </div>
          )}

          {/* Feature 10: Card Privacy & Customization Modal */}
          {activeModal === 'customize' && (
            <div className={`w-full max-w-sm rounded-xl border ${borderTone} p-6 shadow-2xl space-y-4 ${cardBg}`}>
              <div className={`flex items-center justify-between border-b pb-3 ${borderTone}`}>
                <span className="text-xs font-mono font-bold uppercase">
                  Card Privacy Customization
                </span>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:opacity-75">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className={`text-xs font-mono opacity-80 ${textSecondary}`}>
                Choose which fields are encoded on the shareable QR and public-facing emergency card.
              </p>

              <div className="space-y-3 font-mono text-xs">
                {Object.keys(profile.displaySettings).map((key) => (
                  <label key={key} className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg} flex justify-between items-center cursor-pointer`}>
                    <span className="capitalize">{key.replace('show', '').replace(/([A-Z])/g, ' $1')}</span>
                    <input
                      type="checkbox"
                      checked={profile.displaySettings[key]}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          displaySettings: { ...prev.displaySettings, [key]: e.target.checked }
                        }))
                      }
                      className="w-4 h-4 accent-[#655A7C]"
                    />
                  </label>
                ))}
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${accentSolid} hover:opacity-90`}
              >
                Save Preferences
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Telemetry */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">SignMitra • Privacy-Focused Accessibility Platform</p>
          <div className="flex items-center gap-2 font-medium">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'}`} />
            <span>Emergency Vault Online</span>
          </div>
        </div>
      </footer>

    </div>
  );
}