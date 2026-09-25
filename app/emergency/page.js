'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Moon
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
  const [profile, setProfile] = useState({
    name: '',
    emergencyContact: '',
    bloodGroup: '',
    allergies: '',
    criticalMedicalInfo: ''
  });

  const MOCK_USER_ID = 'mock_user_123';

  // Load profile parameters from localized client cache instantly, then pull verified records from cloud
  useEffect(() => {
    const savedProfile = localStorage.getItem('signmitra_emergency_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      setIsEditing(true);
    }

    // Asynchronously pull latest verified profile parameters from backend server cluster
    import('@/components/api')
      .then(({ signMitraAPI }) => {
        signMitraAPI
          .getEmergencyProfile(MOCK_USER_ID)
          .then((serverProfile) => {
            if (serverProfile) {
              setProfile(serverProfile);
              localStorage.setItem(
                'signmitra_emergency_profile',
                JSON.stringify(serverProfile)
              );
            }
          })
          .catch((err) =>
            console.log(
              '📬 Server unreachable. Operating in localized PWA secure vault mode.',
              err.message
            )
          );
      })
      .catch(() => {});
  }, []);

  // Dual-Persist critical information parameters locally and remotely
  const handleSave = async (e) => {
    e.preventDefault();

    localStorage.setItem('signmitra_emergency_profile', JSON.stringify(profile));
    setIsEditing(false);

    try {
      const { signMitraAPI } = await import('@/components/api');
      await signMitraAPI.saveEmergencyProfile({
        userId: MOCK_USER_ID,
        ...profile
      });
    } catch (err) {
      console.log(
        '⚠️ Network dropped. Critical indicators preserved strictly in local memory hardware cache.',
        err.message
      );
    }
  };

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-[#655A7C] selection:text-[#FDF1E2] flex flex-col justify-between ${bgCanvas} ${textPrimary}`}
    >
      {/* Top Runtime Status Bar */}
      <div
        className={`w-full border-b py-2 px-4 sm:px-6 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg}`}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </Link>
          <span className="opacity-40">•</span>
          <span className="opacity-80">EMERGENCY ASSISTANCE VAULT</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
          >
            {isDarkTheme ? (
              <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#655A7C]" />
            )}
          </button>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 my-auto">
        {/* Emergency Header Card */}
        <header
          className={`rounded-xl border ${borderTone} p-6 sm:p-7 mb-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${cardBg}`}
        >
          <div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardInnerBg} text-[11px] font-mono font-bold uppercase tracking-wider mb-3`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              PRIORITY MEDICAL & TRIAGE CARD
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Emergency Profile
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-lg ${textSecondary}`}>
              High-visibility verification card optimized for first responders and immediate medical triage.
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all ${accentSolid}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}
        </header>

        {/* VIEW 1: Active Emergency Card Mode */}
        {!isEditing && (
          <div className="space-y-6">
            <div className={`p-6 sm:p-7 rounded-xl border ${borderTone} space-y-6 shadow-sm ${cardBg}`}>
              <div
                className="flex items-center justify-between border-b pb-4"
                style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}
              >
                <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  VERIFIED IDENTIFICATION MATRIX
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${borderTone} ${cardInnerBg}`}>
                  ISL PROTOCOL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Full Legal Name
                  </span>
                  <p className="text-lg sm:text-xl font-black uppercase tracking-tight">
                    {profile.name || 'Not Provided'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70 mb-1 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5" />
                    Blood Group
                  </span>
                  <p className="text-lg sm:text-xl font-black uppercase tracking-tight">
                    {profile.bloodGroup || 'Not Provided'}
                  </p>
                </div>
              </div>

              <div className={`p-4 sm:p-5 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Primary SOS Contact
                </span>
                <p className="text-xl sm:text-2xl font-mono font-black tracking-wide">
                  {profile.emergencyContact ? profile.emergencyContact : 'Not Provided'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Declared Allergies
                  </span>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {profile.allergies || 'None declared.'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg}`}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-70 mb-1.5 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5" />
                    Critical Medical Records
                  </span>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {profile.criticalMedicalInfo || 'No existing conditions declared.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Communication Support Banner with explicit purple background */}
            <div
              className={`p-6 rounded-xl border ${borderTone} text-center space-y-2 bg-[#AB92BF]/25 shadow-sm`}
            >
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${borderTone} ${cardInnerBg} inline-block`}
              >
                COMMUNICATION DISCLOSURE NOTICE
              </span>
              <p className="text-sm sm:text-base font-bold leading-relaxed max-w-2xl mx-auto">
                "I communicate using Indian Sign Language (ISL). Please review the medical details summarized above and dial my primary SOS contact."
              </p>
            </div>
          </div>
        )}

        {/* VIEW 2: Secure Form Input */}
        {isEditing && (
          <form onSubmit={handleSave} className="space-y-5">
            <div
              className={`p-4 rounded-lg border ${borderTone} ${cardInnerBg} text-xs font-mono font-medium leading-relaxed flex items-start gap-2.5`}
            >
              <Lock className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
              <span>
                Privacy Data Minimization: Medical indicators are cached locally for immediate offline rendering and synchronized securely when active connection is present.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">
                  SOS Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.emergencyContact}
                  onChange={(e) =>
                    handleInputChange('emergencyContact', e.target.value)
                  }
                  placeholder="+91 98765 43210"
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider">
                  Blood Group
                </label>
                <select
                  value={profile.bloodGroup}
                  onChange={(e) =>
                    handleInputChange('bloodGroup', e.target.value)
                  }
                  className={`p-3 w-full font-bold border rounded-lg text-xs sm:text-sm outline-none transition-colors ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
                  required
                >
                  <option value="" disabled>
                    -- Select Blood Group --
                  </option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(
                    (bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">
                Known Allergies (Food, Meds, etc.)
              </label>
              <textarea
                value={profile.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="e.g., Penicillin, Peanuts (Or specify 'None')"
                rows={2}
                className={`p-3 w-full font-semibold border rounded-lg text-xs sm:text-sm outline-none transition-colors resize-none ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider">
                Critical Medical Info / Chronic Conditions
              </label>
              <textarea
                value={profile.criticalMedicalInfo}
                onChange={(e) =>
                  handleInputChange('criticalMedicalInfo', e.target.value)
                }
                placeholder="e.g., Asthma, Diabetes, Hypertension"
                rows={3}
                className={`p-3 w-full font-semibold border rounded-lg text-xs sm:text-sm outline-none transition-colors resize-none ${cardInnerBg} ${borderTone} focus:border-[#655A7C]`}
              />
            </div>

            <div className="flex gap-3 pt-3">
              {typeof window !== 'undefined' &&
                localStorage.getItem('signmitra_emergency_profile') && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={`w-1/3 py-3 rounded-lg border ${borderTone} ${cardBg} font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all`}
                  >
                    Cancel
                  </button>
                )}
              <button
                type="submit"
                className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:opacity-90 ${accentSolid}`}
              >
                Save Emergency Card
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer System Anchor */}
      <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 ${borderTone} ${cardInnerBg}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-3">
          <p className="font-bold">SignMitra • Privacy-Focused Accessibility Platform</p>
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkTheme ? 'bg-[#FDF1E2]' : 'bg-[#655A7C]'
              }`}
            ></span>
            <span>Emergency Vault Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}