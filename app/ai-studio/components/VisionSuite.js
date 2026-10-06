'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Camera,
  Upload,
  RefreshCcw,
  Sparkles,
  FileText,
  Tag,
  Copy,
  Check,
  ShieldCheck,
  ListPlus,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function VisionSuite({ onSendToClarification, onSendToPlanner }) {
  const {
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme
  } = useTheme();

  // Active Tool Sub-Tab: 'ocr' | 'queue' | 'document' | 'description'
  const [activeSubTab, setActiveSubTab] = useState('queue');

  // Image source
  const [imageSrc, setImageSrc] = useState(null);
  const [imageMime, setImageMime] = useState('image/jpeg');

  // Camera / processing
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Results
  const [ocrResult, setOcrResult] = useState(null);
  const [editableText, setEditableText] = useState('');
  const [savedToQueueMsg, setSavedToQueueMsg] = useState(false);

  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }

      setIsCapturingCamera(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setIsCapturingCamera(false);
      alert(`Camera access failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturingCamera(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext('2d');

    if (!context) {
      alert('Unable to capture camera frame.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setImageSrc(dataUrl);
    setImageMime('image/jpeg');

    stopCamera();

    analyzeImage(dataUrl, 'image/jpeg');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result;

      if (typeof dataUrl !== 'string') {
        alert('Unable to read the selected image.');
        return;
      }

      setImageSrc(dataUrl);
      setImageMime(file.type || 'image/jpeg');

      analyzeImage(dataUrl, file.type || 'image/jpeg');
    };

    reader.onerror = () => {
      alert('Unable to read the selected image.');
    };

    reader.readAsDataURL(file);

    // Allow selecting the same file again.
    event.target.value = '';
  };

  const handleUseSample = (sampleType) => {
    setImageSrc(`/sample-${sampleType}.png`);

    /*
     * Sample images intentionally use the backend's deterministic
     * sample processor. This is clearly surfaced through provider/provenance.
     */
    analyzeImage(null, 'image/jpeg', sampleType);
  };

  const analyzeImage = async (
    base64Data,
    mimeType,
    sampleType = ''
  ) => {
    setIsProcessing(true);
    setSavedToQueueMsg(false);
    setOcrResult(null);
    setEditableText('');

    try {
      const response = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'understand_image',
          imageBase64: base64Data,
          imageMimeType: mimeType,
          featureType: activeSubTab,
          sampleType
        })
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error('The image analysis service returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          `Image analysis failed with status ${response.status}.`
        );
      }

      setOcrResult(data);
      setEditableText(data?.extractedText || '');
    } catch (error) {
      console.error('Vision analysis error:', error);

      setOcrResult({
        error: error?.message || 'Image processing failed.'
      });

      alert(error?.message || 'Image processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  /*
   * Backend provenance helper.
   *
   * The backend may return fields such as:
   * provider
   * source
   * model
   * provenance
   * fallback
   *
   * We intentionally display what the backend actually reports instead
   * of claiming that every result came from an AI vision model.
   */
  const getProviderInfo = () => {
    if (!ocrResult) return null;

    const provider = String(
      ocrResult.provider ||
      ocrResult.source ||
      ocrResult.provenance ||
      ''
    ).toLowerCase();

    const isFallback =
      ocrResult.fallback === true ||
      provider.includes('deterministic') ||
      provider.includes('fallback') ||
      provider.includes('demo');

    const isGemini =
      provider.includes('gemini') ||
      provider.includes('google');

    if (isFallback) {
      return {
        label: 'Demo / Deterministic Fallback',
        description: 'No live vision provider is configured.',
        fallback: true
      };
    }

    if (isGemini) {
      return {
        label: `AI Vision${ocrResult.model ? ` · ${ocrResult.model}` : ' · Gemini'}`,
        description: 'Image analyzed by the configured AI vision provider.',
        fallback: false
      };
    }

    if (ocrResult.provider || ocrResult.source || ocrResult.provenance) {
      return {
        label: String(
          ocrResult.provider ||
          ocrResult.source ||
          ocrResult.provenance
        ),
        description: 'Processing source reported by the analysis service.',
        fallback: false
      };
    }

    return {
      label: 'Processing Source Not Reported',
      description: 'The backend did not provide provider provenance.',
      fallback: true
    };
  };

  const providerInfo = getProviderInfo();

  // Save extracted queue details to Queue Companion.
  const handleSaveToQueue = () => {
    if (!ocrResult?.queueDetails) return;

    const q = ocrResult.queueDetails;

    const newQueueToken = {
      tokenNumber: q.tokenNumber || 'T-99',
      institution: q.institution || 'Extracted Notice / Counter',
      locationRoom: q.counterNumber || 'Counter Assigned',
      appointmentTime: q.dateTime || 'Today',
      currentStage: 'waiting',
      documentsNeeded: [
        {
          id: '1',
          name: 'Original Fee Slip / ID Card',
          checked: true
        },
        {
          id: '2',
          name: 'Prescribed Form',
          checked: false
        }
      ],
      notes: q.instructions || 'Visual alert requested.',
      isDemo: providerInfo?.fallback === true
    };

    localStorage.setItem(
      'signmitra_queue_active',
      JSON.stringify(newQueueToken)
    );

    setSavedToQueueMsg(true);

    setTimeout(() => {
      setSavedToQueueMsg(false);
    }, 4000);
  };

  // Save document action to Follow-Up Planner.
  const handleSaveDocToPlanner = () => {
    if (!ocrResult?.documentBreakdown) return;

    const breakdown = ocrResult.documentBreakdown;

    const actionText =
      breakdown.actionItems?.[0] ||
      'Follow up on notice requirements';

    const task = {
      id: `TASK-${Date.now()}`,
      title: `Notice Action: ${actionText}`,
      situation: 'Visual Notice Extraction',
      category: 'Documents & Applications',
      type: 'Action Step',
      nextAction: actionText,
      dueDate:
        breakdown.keyDates?.[0] ||
        new Date().toISOString().split('T')[0],
      priority: 'High',
      status: 'Planned',
      source: 'Vision Suite',
      requiresUserVerification: true
    };

    const existing = JSON.parse(
      localStorage.getItem('signmitra_followups') || '[]'
    );

    localStorage.setItem(
      'signmitra_followups',
      JSON.stringify([task, ...existing])
    );

    alert('Action step saved to Follow-Up Planner (/followups)!');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Unable to copy text.');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveSubTab(tabId);

    /*
     * Results are feature-specific. Clear previous analysis so a queue
     * result is never accidentally displayed as document/OCR output.
     */
    setOcrResult(null);
    setEditableText('');
    setSavedToQueueMsg(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Sub-Tabs */}
      <div
        className={`p-2 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-wrap gap-2 shadow-sm`}
      >
        {[
          {
            id: 'queue',
            label: 'Queue & Token Reader',
            icon: Tag
          },
          {
            id: 'ocr',
            label: 'Text Reader (OCR)',
            icon: Camera
          },
          {
            id: 'document',
            label: 'Notice & Documents',
            icon: FileText
          },
          {
            id: 'description',
            label: 'Image Description',
            icon: Sparkles
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? accentSolid
                  : `${cardInnerBg} opacity-70 hover:opacity-100`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Capture / Upload Station */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Left: Image Input */}
        <div
          className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
              Select Image Input
            </span>

            <span className="text-[10px] font-mono opacity-50">
              Privacy-Aware Processing
            </span>
          </div>

          {/* Camera */}
          {isCapturingCamera ? (
            <div className="space-y-3">

              <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={captureSnapshot}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid} flex items-center justify-center gap-2`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Snapshot</span>
                </button>

                <button
                  onClick={stopCamera}
                  className={`py-3 px-4 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-2.5">

                <button
                  onClick={startCamera}
                  className={`p-4 rounded-xl border-2 border-dashed ${borderTone} ${cardInnerBg} hover:border-[#655A7C] font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all`}
                >
                  <Camera className="w-5 h-5 opacity-70" />
                  <span>Use Device Camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 rounded-xl border-2 border-dashed ${borderTone} ${cardInnerBg} hover:border-[#655A7C] font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all`}
                >
                  <Upload className="w-5 h-5 opacity-70" />
                  <span>Upload File / Photo</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Sample Data */}
              <div
                className="pt-2 border-t border-dashed"
                style={{
                  borderColor: isDarkTheme
                    ? '#AB92BF30'
                    : '#655A7C20'
                }}
              >
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block mb-2">
                  Or test with sample image data:
                </span>

                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={() => handleUseSample('token')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    🏷️ Queue Token B-34
                  </button>

                  <button
                    onClick={() => handleUseSample('notice')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    📋 Exam Hall Notice
                  </button>

                  <button
                    onClick={() => handleUseSample('prescription')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    🩺 OPD Lab Referral
                  </button>

                </div>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {imageSrc && !isCapturingCamera && (
            <div
              className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
            >
              <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                Loaded Image:
              </span>

              <div className="rounded-lg overflow-hidden max-h-48 flex items-center justify-center bg-black/10">
                <img
                  src={imageSrc}
                  alt="Uploaded visual"
                  className="max-h-48 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div
          className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}
        >
          <div>

            <div className="flex justify-between items-start mb-3 gap-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 opacity-80" />

                <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                  Extracted Intelligence
                </span>
              </div>

              {ocrResult && !ocrResult.error && providerInfo && (
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      providerInfo.fallback
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : accentSolid
                    }`}
                  >
                    {providerInfo.label}
                  </span>

                  {ocrResult.confidence && (
                    <span className="text-[9px] font-mono opacity-50">
                      Confidence: {ocrResult.confidence}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Provider provenance */}
            {ocrResult && !ocrResult.error && providerInfo && (
              <div
                className={`mb-4 p-2.5 rounded-lg border ${
                  providerInfo.fallback
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : `${borderTone} ${cardInnerBg}`
                }`}
              >
                <div className="flex items-start gap-2">
                  {providerInfo.fallback ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  )}

                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase">
                      {providerInfo.fallback
                        ? 'Fallback Processing'
                        : 'Processing Source'}
                    </p>

                    <p className="text-[10px] opacity-60 mt-0.5">
                      {providerInfo.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing */}
            {isProcessing ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCcw className="w-8 h-8 animate-spin mx-auto opacity-60" />

                <p className="text-xs font-mono font-bold uppercase">
                  Extracting Visual Details...
                </p>

                <p className="text-[10px] opacity-50">
                  Reviewing image content before presenting results.
                </p>
              </div>
            ) : ocrResult?.error ? (
              <div className="py-12 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />

                <p className="text-xs font-mono font-bold uppercase">
                  Image Analysis Failed
                </p>

                <p className="text-xs opacity-60">
                  {ocrResult.error}
                </p>
              </div>
            ) : !ocrResult ? (
              <div className="py-16 text-center space-y-2 opacity-50">
                <FileText className="w-8 h-8 mx-auto" />

                <p className="text-xs font-mono font-bold uppercase">
                  No image analyzed yet
                </p>

                <p className="text-[11px]">
                  Capture a photo or select a sample image on the left.
                </p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Queue Token */}
                {activeSubTab === 'queue' && ocrResult.queueDetails && (
                  <div className="space-y-3">

                    <div
                      className={`p-5 rounded-2xl border-4 ${borderTone} ${cardInnerBg} text-center space-y-2`}
                    >
                      <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                        TOKEN NUMBER
                      </span>

                      <div className="text-4xl font-black">
                        {ocrResult.queueDetails.tokenNumber}
                      </div>

                      <div className="text-sm font-bold opacity-80">
                        {ocrResult.queueDetails.counterNumber}
                      </div>

                      <div className="text-xs font-mono opacity-60">
                        {ocrResult.queueDetails.dateTime}
                      </div>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} text-xs space-y-1`}
                    >
                      <span className="font-mono font-bold opacity-70 block">
                        Instructions:
                      </span>

                      <p className="font-bold">
                        {ocrResult.queueDetails.instructions}
                      </p>
                    </div>

                    <button
                      onClick={handleSaveToQueue}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
                    >
                      <BellRing className="w-4 h-4" />
                      <span>
                        Transfer to Queue Companion (/queue-companion)
                      </span>
                    </button>

                    {savedToQueueMsg && (
                      <p className="text-xs font-mono font-bold text-green-600 dark:text-green-400 text-center">
                        ✓ Token saved to Queue Companion!
                      </p>
                    )}
                  </div>
                )}

                {/* OCR */}
                {activeSubTab === 'ocr' && (
                  <div className="space-y-3">

                    <label className="text-xs font-mono font-bold uppercase opacity-70">
                      Extracted Text (Editable for Verification):
                    </label>

                    <textarea
                      value={editableText}
                      onChange={(event) =>
                        setEditableText(event.target.value)
                      }
                      rows={6}
                      className={`w-full p-3 font-mono text-xs font-bold border rounded-xl outline-none ${cardInnerBg} ${borderTone}`}
                    />

                    <button
                      onClick={handleCopyText}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${cardInnerBg} ${borderTone}`}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}

                      <span>
                        {copied ? 'Copied' : 'Copy Text'}
                      </span>
                    </button>

                  </div>
                )}

                {/* Document */}
                {activeSubTab === 'document' &&
                  ocrResult.documentBreakdown && (
                    <div className="space-y-3">

                      <div
                        className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
                      >
                        <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                          Summary
                        </span>

                        <p className="text-sm font-black">
                          {ocrResult.documentBreakdown.plainSummary}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">

                        <div
                          className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                        >
                          <span className="opacity-60 block text-[10px]">
                            Dates:
                          </span>

                          <span className="font-bold">
                            {ocrResult.documentBreakdown.keyDates?.join(', ') ||
                              'None'}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                        >
                          <span className="opacity-60 block text-[10px]">
                            Fees:
                          </span>

                          <span className="font-bold">
                            {ocrResult.documentBreakdown.amounts?.join(', ') ||
                              'None'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveDocToPlanner}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
                      >
                        <ListPlus className="w-4 h-4" />

                        <span>
                          Create Follow-Up Task from Notice
                        </span>
                      </button>

                    </div>
                  )}

                {/* Description */}
                {activeSubTab === 'description' && (
                  <div
                    className={`p-5 rounded-2xl border ${borderTone} ${cardInnerBg} space-y-3`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="w-4 h-4" />

                      <span>
                        Privacy-Safe Objective Description
                      </span>
                    </div>

                    <p className="text-sm font-bold leading-relaxed">
                      {ocrResult.imageDescription ||
                        'No description available.'}
                    </p>

                    <p className="text-[10px] font-mono opacity-50">
                      Facial recognition and personal attribute inferences are
                      strictly disabled.
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Verification boundary */}
          <div
            className="pt-2 text-[10px] font-mono opacity-50 border-t border-dashed"
            style={{
              borderColor: isDarkTheme
                ? '#AB92BF30'
                : '#655A7C20'
            }}
          >
            Extracted information must be reviewed and confirmed by the user
            before creating records or taking follow-up actions.
          </div>

        </div>
      </div>
    </div>
  );
}