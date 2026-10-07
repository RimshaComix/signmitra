'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  ShieldAlert,
  Star,
  ListTodo
} from 'lucide-react';

/* 
  STRICT PALETTE SYSTEM:
  1. Linen:    #FDF1E2 (Base canvas / surface backgrounds)
  2. Amethyst: #AB92BF (Secondary cards / subtle borders / badges)
  3. Dolphin:  #655A7C (Primary brand / high-contrast text / accents / active states)
*/

export default function AnonymousFeedback() {
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

  const [step, setStep] = useState(1);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('Hospital / Medical');
  
  // Upgraded Feedback Data State with 1-5 ratings and optional comments
  const [feedback, setFeedback] = useState({
    interpreterRating: 0,
    writtenSupportRating: 0,
    visualDisplayRating: 0,
    staffCommunicationRating: 0,
    overallRating: 0,
    visitorComments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedReviews, setSavedReviews] = useState([]);

  // Load saved reviews on mount
  useEffect(() => {
    try {
      const existingReviews = JSON.parse(localStorage.getItem('signmitra_accessibility_reviews') || '[]');
      setSavedReviews(existingReviews);
    } catch (e) {
      setSavedReviews([]);
    }
  }, []);

  const handleStarRating = (category, rating) => {
    setFeedback(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate saving locally for review / anonymous submission
    setTimeout(() => {
      const existingReviews = JSON.parse(localStorage.getItem('signmitra_accessibility_reviews') || '[]');
      const newReview = {
        id: `REV-${Date.now()}`,
        institutionName,
        institutionType,
        ...feedback,
        timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };
      
      const updatedReviews = [newReview, ...existingReviews];
      localStorage.setItem('signmitra_accessibility_reviews', JSON.stringify(updatedReviews));
      setSavedReviews(updatedReviews);
      
      setIsSubmitting(false);
      setStep(3);
    }, 1200);
  };

  const resetForm = () => {
    setInstitutionName('');
    setInstitutionType('Hospital / Medical');
    setFeedback({
      interpreterRating: 0,
      writtenSupportRating: 0,
      visualDisplayRating: 0,
      staffCommunicationRating: 0,
      overallRating: 0,
      visitorComments: ''
    });
    setStep(1);
  };

  const isFormComplete = feedback.overallRating > 0;

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans antialiased flex flex-col justify-between ${bgCanvas} ${textPrimary}`}>
      
      {/* Header */}
      <div className={`w-full border-b py-3 px-4 sm:px-8 text-xs font-mono flex justify-between items-center ${borderTone} ${cardBg} z-10 sticky top-0`}>
        <div className="flex items-center gap-3">
          <Link 
            href="/communication-hub" 
            className="font-bold uppercase tracking-wider hover:opacity-75 transition-opacity inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hub</span>
          </Link>
          <span className="opacity-40" aria-hidden="true">/</span>
          <span className="opacity-90 font-bold uppercase tracking-wide">ACCESSIBILITY FEEDBACK</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Mode"
            className={`p-1.5 rounded-lg border ${borderTone} ${cardInnerBg} hover:opacity-80 transition-all`}
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#FDF1E2]" /> : <Moon className="w-3.5 h-3.5 text-[#655A7C]" />}
          </button>
        </div>
      </div>

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col">
        
        {/* STEP 1: Institution Details & Past Reviews */}
        {step === 1 && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <header className="mb-8">
               <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${borderTone} ${cardBg} text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider mb-4`}>
                 <ShieldAlert className="w-3.5 h-3.5 text-[#655A7C] dark:text-[#FDF1E2]" aria-hidden="true" />
                 PRIVACY PROTECTED
               </div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                Accessibility Feedback
              </h1>
              <p className={`text-sm sm:text-base mt-2 font-medium leading-relaxed ${textSecondary}`}>
                Help improve accessibility information for people planning a visit. No name or medical details required.
              </p>
            </header>

            <div className={`p-5 sm:p-7 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-5`}>
              <h2 className="font-black text-lg uppercase tracking-tight border-b pb-3 mb-2" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>Submit New Review</h2>
              <div className="space-y-1.5">
                <label htmlFor="inst-type" className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  Institution Type
                </label>
                <select
                  id="inst-type"
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value)}
                  className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                >
                  <option>Hospital / Medical</option>
                  <option>Bank / Financial</option>
                  <option>College / Educational</option>
                  <option>Police / Legal</option>
                  <option>Government Office</option>
                  <option>Public Transport Hub</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inst-name" className="text-xs font-mono font-bold uppercase tracking-wider block opacity-70">
                  Institution Name & Branch
                </label>
                <input
                  id="inst-name"
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g., City General Hospital (OPD) or SBI Main Branch"
                  className={`w-full p-4 font-bold border-2 rounded-xl text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone}`}
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!institutionName.trim()}
                className={`w-full py-4 mt-2 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${institutionName.trim() ? accentSolid : 'opacity-50 cursor-not-allowed border-2 ' + borderTone}`}
              >
                Continue to Accessibility Rating <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Display Saved Reviews */}
            <div className={`mt-10 p-6 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-4`}>
              <h2 className="font-black text-lg uppercase tracking-tight border-b pb-3" style={{ borderColor: isDarkTheme ? '#AB92BF35' : '#655A7C25' }}>Your Past Reviews</h2>
              
              {savedReviews.length > 0 ? (
                <div className="space-y-4">
                  {savedReviews.map(review => (
                    <div key={review.id} className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} flex flex-col gap-3`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1">{review.institutionType}</div>
                          <h3 className="font-black text-base">{review.institutionName}</h3>
                        </div>
                      </div>

                      {/* Detailed Breakdown Grid - ALL OPTIONS VISIBLE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {/* 1. Overall Rating */}
                        <div className={`p-2.5 rounded-lg border flex flex-row items-center justify-between ${isDarkTheme ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-500/40'}`}>
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400">Overall Experience</span>
                          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                            <span className="text-xs font-black">{review.overallRating}/5</span>
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </div>
                        </div>

                        {/* 2. ISL Interpreter */}
                        {review.interpreterRating > 0 && (
                          <div className={`p-2.5 rounded-lg border ${borderTone} ${cardBg} flex flex-row items-center justify-between`}>
                            <span className="text-[10px] font-mono font-bold uppercase opacity-70">ISL Interpreter</span>
                            <div className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400">
                              <span className="text-[10px] font-black">{review.interpreterRating}</span>
                              <Star className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        )}

                        {/* 3. Visual Display */}
                        {review.visualDisplayRating > 0 && (
                          <div className={`p-2.5 rounded-lg border ${borderTone} ${cardBg} flex flex-row items-center justify-between`}>
                            <span className="text-[10px] font-mono font-bold uppercase opacity-70">Visual Queue</span>
                            <div className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400">
                              <span className="text-[10px] font-black">{review.visualDisplayRating}</span>
                              <Star className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        )}

                        {/* 4. Written Support */}
                        {review.writtenSupportRating > 0 && (
                          <div className={`p-2.5 rounded-lg border ${borderTone} ${cardBg} flex flex-row items-center justify-between`}>
                            <span className="text-[10px] font-mono font-bold uppercase opacity-70">Written Support</span>
                            <div className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400">
                              <span className="text-[10px] font-black">{review.writtenSupportRating}</span>
                              <Star className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Visitor Comments */}
                      {review.visitorComments && (
                        <p className={`text-xs font-medium italic mt-2 opacity-80 pl-3 border-l-2 border-dashed`} style={{ borderColor: isDarkTheme ? '#AB92BF50' : '#655A7C50' }}>
                          "{review.visitorComments}"
                        </p>
                      )}
                      
                      <div className="text-[10px] font-mono font-bold uppercase opacity-50 mt-1 text-right">
                        Submitted: {review.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`py-8 text-center rounded-xl border border-dashed ${borderTone} ${cardInnerBg} opacity-70`}>
                  <ListTodo className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-wider">No feedback records found</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* STEP 2: The Survey with 1-5 Star Ratings & Comments */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <button 
                onClick={() => setStep(1)}
                className="text-xs font-mono font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all focus-visible:ring-2 focus-visible:ring-[#655A7C] focus-visible:outline-none rounded px-1"
              >
                ← Back
              </button>
              <div className={`px-3 py-1 rounded border ${borderTone} ${cardInnerBg} text-[10px] font-mono font-bold uppercase tracking-widest truncate max-w-[200px]`}>
                {institutionName}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Helper notice regarding directory updates */}
              <div className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-start gap-3`}>
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Feedback is saved on this device / for review and does not automatically confirm an institution's public accessibility rating.</p>
              </div>

              {/* RATING CRITERIA 1: ISL Interpreter */}
              <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-3`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm sm:text-base">ISL Interpreter Availability</h3>
                  <span className="text-[10px] font-mono font-mono uppercase opacity-60">1 to 5 Stars</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarRating('interpreterRating', star)}
                      className={`p-3 rounded-xl border-2 flex-1 flex justify-center transition-all ${
                        feedback.interpreterRating >= star 
                          ? 'border-yellow-500 bg-yellow-500 text-white shadow-sm' 
                          : `${borderTone}${cardInnerBg} hover:opacity-75`
                      }`}
                      aria-label={`Rate interpreter availability ${star} out of 5`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* RATING CRITERIA 2: Visual Queue / Displays */}
              <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-3`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm sm:text-base">Visual Queue / Display Boards</h3>
                  <span className="text-[10px] font-mono font-mono uppercase opacity-60">1 to 5 Stars</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarRating('visualDisplayRating', star)}
                      className={`p-3 rounded-xl border-2 flex-1 flex justify-center transition-all ${
                        feedback.visualDisplayRating >= star 
                          ? 'border-yellow-500 bg-yellow-500 text-white shadow-sm' 
                          : `${borderTone}${cardInnerBg} hover:opacity-75`
                      }`}
                      aria-label={`Rate visual displays ${star} out of 5`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* RATING CRITERIA 3: Written Communication Support */}
              <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-3`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm sm:text-base">Written Communication Support</h3>
                  <span className="text-[10px] font-mono font-mono uppercase opacity-60">1 to 5 Stars</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarRating('writtenSupportRating', star)}
                      className={`p-3 rounded-xl border-2 flex-1 flex justify-center transition-all ${
                        feedback.writtenSupportRating >= star 
                          ? 'border-yellow-500 bg-yellow-500 text-white shadow-sm' 
                          : `${borderTone}${cardInnerBg} hover:opacity-75`
                      }`}
                      aria-label={`Rate written support ${star} out of 5`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* RATING CRITERIA 4: Overall Accessibility Experience (Required) */}
              <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardInnerBg} shadow-sm space-y-3`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm sm:text-base">Overall Accessibility Experience *</h3>
                  <span className="text-[10px] font-mono font-bold text-red-500 uppercase">Required</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarRating('overallRating', star)}
                      className={`p-3 rounded-xl border-2 flex-1 flex justify-center transition-all ${
                        feedback.overallRating >= star 
                          ? 'border-yellow-500 bg-yellow-500 text-white shadow-sm' 
                          : `${borderTone}${cardBg} hover:opacity-75`
                      }`}
                      aria-label={`Rate overall experience ${star} out of 5`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* OPTIONAL COMMENTS */}
              <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} shadow-sm space-y-2`}>
                <label htmlFor="visitor-comments" className="font-black text-sm sm:text-base block">
                  What should other visitors know? <span className="font-normal opacity-60 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="visitor-comments"
                  rows={3}
                  value={feedback.visitorComments}
                  onChange={(e) => setFeedback(prev => ({ ...prev, visitorComments: e.target.value }))}
                  placeholder="Share details about staff helpfulness, specific counters, or tips..."
                  className={`w-full p-4 font-bold border-2 rounded-xl text-xs sm:text-sm outline-none transition-colors focus:border-[#655A7C] ${cardInnerBg} ${borderTone} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={!isFormComplete || isSubmitting}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none ${
                  isFormComplete ? `${accentSolid} hover:opacity-90` : `opacity-50 cursor-not-allowed border-2 ${borderTone}`
                }`}
              >
                {isSubmitting ? 'Saving Feedback...' : 'Save Feedback Record'} <Send className="w-4 h-4" />
              </button>

            </form>
          </div>
        )}

        {/* STEP 3: Completion */}
        {step === 3 && (
          <div className="animate-in zoom-in-95 duration-300 w-full text-center space-y-6 my-auto py-12">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-sm ${accentSolid}`}>
              <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Feedback Saved
            </h2>
            <p className={`text-sm sm:text-base font-medium max-w-md mx-auto ${textSecondary}`}>
              Your accessibility review has been successfully stored locally on this device for your records and review.
            </p>

            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetForm}
                className={`inline-block px-8 py-4 rounded-xl border-2 font-black text-sm uppercase tracking-widest shadow-sm transition-all ${cardBg} ${borderTone} hover:opacity-90 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                Submit Another
              </button>
              <Link
                href="/communication-hub"
                className={`inline-block px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm transition-all ${accentSolid} hover:opacity-90 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#655A7C] focus-visible:outline-none`}
              >
                Return to Hub
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}