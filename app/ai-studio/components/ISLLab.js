'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Video,
  VideoOff,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ShieldAlert,
  Check,
  Layers,
  Cpu,
  Activity,
  Lock
} from 'lucide-react';

// V1 Supported 23 Static ISL Fingerspelling Signs
// (H, J, and Y are excluded because they involve dynamic motion)
const SUPPORTED_STATIC_SIGNS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Z'
];
const EXCLUDED_DYNAMIC_SIGNS = ['H', 'J', 'Y'];

const NUM_LANDMARKS = 21;
const COORDS_PER_LANDMARK = 3;
const FEATURES_PER_HAND = NUM_LANDMARKS * COORDS_PER_LANDMARK; // 63
const NUM_FEATURES = FEATURES_PER_HAND * 2; // 126
const INFERENCE_INTERVAL_MS = 200; // 5 predictions per second max
const SMOOTHING_WINDOW_SIZE = 5;
const SMOOTHING_MIN_AGREEMENT = 3;

// Learning Flashcards referencing ISLRTC guidelines for Feature 23
const LEARNING_CARDS = [
  {
    id: 'learn-1',
    word: 'NAMASTE / GREETING',
    category: 'Etiquette',
    handShape: 'Both open palms pressed flat together at chest height',
    movement: 'Slight respectful forward bow of head',
    facialExpression: 'Warm, pleasant eye contact',
    tips: 'Universally recognized across all Indian states and institutions.'
  },
  {
    id: 'learn-2',
    word: 'DOCTOR / HOSPITAL',
    category: 'Healthcare',
    handShape: 'Right hand takes two-finger pulse grip (index and middle fingers extended)',
    movement: 'Taps twice gently on the inner left wrist',
    facialExpression: 'Neutral, questioning if asking where doctor is',
    tips: 'Represents checking the radial artery pulse.'
  },
  {
    id: 'learn-3',
    word: 'SIGNATURE / STAMP',
    category: 'Administration',
    handShape: 'Right hand mimics holding a pen, left hand flat palm-up like paper',
    movement: 'Right hand signs a brief cursive line across the left palm',
    facialExpression: 'Attentive, indicating official confirmation',
    tips: 'Essential at college and bank counters when confirming document approval.'
  },
  {
    id: 'learn-4',
    word: 'HELP / EMERGENCY',
    category: 'Assistance',
    handShape: 'Left hand flat palm up; right hand forms a thumbs-up fist placed on left palm',
    movement: 'Both hands lift upward together by 4-6 inches',
    facialExpression: 'Urgent, direct eye contact',
    tips: 'Symbolizes supporting or lifting someone up.'
  }
];

/**
 * Converts a single hand's 21 MediaPipe landmarks into 63 wrist-relative coordinates
 * (subtracting landmark 0, the wrist) in mirrored selfie x-space (`1.0 - lm.x`).
 * Matches the Kaggle dataset (`dwibonbhargabdeka/isl-dataset-mediapipe-hand-landmarks`)
 * and `hand_to_wrist_relative()` in `backend/isl/preprocessing.py`.
 */
function handToWristRelativeMirrored(landmarks) {
  const out = new Array(FEATURES_PER_HAND).fill(0.0);
  if (!landmarks || landmarks.length !== NUM_LANDMARKS) return out;

  const wristX = 1.0 - landmarks[0].x;
  const wristY = landmarks[0].y;
  const wristZ = landmarks[0].z;

  for (let i = 0; i < NUM_LANDMARKS; i++) {
    const base = i * 3;
    out[base] = (1.0 - landmarks[i].x) - wristX;
    out[base + 1] = landmarks[i].y - wristY;
    out[base + 2] = landmarks[i].z - wristZ;
  }
  return out;
}

/**
 * Extracts the 126-element landmark feature vector `[left_63, right_63]`
 * matching `combined_train_dataset.csv` (`left_lm0_x..left_lm20_z`, `right_lm0_x..right_lm20_z`).
 * Missing hands remain 63 zeros.
 */
function extract126DatasetFeatures(landmarksList, handednessList) {
  const features = new Array(NUM_FEATURES).fill(0.0);
  if (!landmarksList || landmarksList.length === 0) {
    return features;
  }

  let leftHand = null;
  let rightHand = null;

  if (landmarksList.length === 2) {
    // In mirrored selfie view, the hand on the left side has smaller mirrored wrist x
    const mirroredX0 = 1.0 - landmarksList[0][0].x;
    const mirroredX1 = 1.0 - landmarksList[1][0].x;
    if (mirroredX0 <= mirroredX1) {
      leftHand = landmarksList[0];
      rightHand = landmarksList[1];
    } else {
      leftHand = landmarksList[1];
      rightHand = landmarksList[0];
    }
  } else if (landmarksList.length === 1) {
    // Because raw <video> is unflipped when passed to detectForVideo, MediaPipe's
    // internal selfie-assumed handedness label is inverted relative to mirrored view:
    // raw 'Left' = user's physical Right hand.
    const rawLabel =
      handednessList?.[0]?.[0]?.categoryName ||
      handednessList?.[0]?.[0]?.displayName ||
      'Left';
    const mirroredSide = rawLabel === 'Left' ? 'Right' : 'Left';

    if (mirroredSide === 'Left') {
      leftHand = landmarksList[0];
    } else {
      rightHand = landmarksList[0];
    }
  }

  if (leftHand) {
    const leftVec = handToWristRelativeMirrored(leftHand);
    for (let i = 0; i < FEATURES_PER_HAND; i++) {
      features[i] = leftVec[i];
    }
  }

  if (rightHand) {
    const rightVec = handToWristRelativeMirrored(rightHand);
    for (let i = 0; i < FEATURES_PER_HAND; i++) {
      features[FEATURES_PER_HAND + i] = rightVec[i];
    }
  }

  return features;
}

/**
 * Lightweight temporal prediction stabilizer (majority vote + confidence averaging)
 * over the latest N predictions to prevent single-frame landmark flicker.
 */
function computeStabilizedPrediction(windowEntries) {
  if (!windowEntries || windowEntries.length === 0) {
    return { stabilizedSign: null, stabilizedConfidence: 0, isUncertain: false };
  }

  const validEntries = windowEntries.filter(
    (item) => item.recognized && item.prediction
  );

  if (validEntries.length < SMOOTHING_MIN_AGREEMENT) {
    const latest = windowEntries[windowEntries.length - 1];
    return {
      stabilizedSign: null,
      stabilizedConfidence: latest?.confidence || 0,
      isUncertain: true
    };
  }

  const counts = {};
  for (const item of validEntries) {
    counts[item.prediction] = (counts[item.prediction] || 0) + 1;
  }

  let bestSign = null;
  let bestCount = 0;
  for (const [sign, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestSign = sign;
      bestCount = count;
    }
  }

  if (bestSign && bestCount >= SMOOTHING_MIN_AGREEMENT) {
    const matching = validEntries.filter((e) => e.prediction === bestSign);
    const avgConf =
      matching.reduce((acc, cur) => acc + cur.confidence, 0) / matching.length;
    return {
      stabilizedSign: bestSign,
      stabilizedConfidence: avgConf,
      isUncertain: false
    };
  }

  const latest = windowEntries[windowEntries.length - 1];
  return {
    stabilizedSign: null,
    stabilizedConfidence: latest?.confidence || 0,
    isUncertain: true
  };
}

export default function ISLLab({ onSendToRoom }) {
  const { bgCanvas, textPrimary, textSecondary, cardBg, cardInnerBg, borderTone, accentSolid, isDarkTheme } = useTheme();

  // Active Tab: 'limited' | 'continuous' | 'learn'
  const [activeTab, setActiveTab] = useState('limited');

  // Model & Backend Status:
  // 'CHECKING' | 'READY' | 'MODEL_UNAVAILABLE' | 'BACKEND_UNAVAILABLE' | 'INFERENCE_ACTIVE'
  const [modelStatus, setModelStatus] = useState('CHECKING');
  const [modelStatusDetail, setModelStatusDetail] = useState('Checking ISL Static V1 model status...');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.75);

  // Camera & MediaPipe State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const [mediapipeError, setMediapipeError] = useState(null);
  const [handsDetectedCount, setHandsDetectedCount] = useState(0);

  // Live Recognition State (Real model outputs only)
  const [recognitionStatus, setRecognitionStatus] = useState('idle'); // 'idle' | 'no_hands' | 'recognized' | 'uncertain' | 'error'
  const [predictedSign, setPredictedSign] = useState(null);
  const [predictedConfidence, setPredictedConfidence] = useState(null);
  const [topPredictions, setTopPredictions] = useState([]);
  const [confirmedSign, setConfirmedSign] = useState(null);
  const [signedWordBuffer, setSignedWordBuffer] = useState('');
  const [inferenceError, setInferenceError] = useState(null);

  // Refs for non-overlapping inference and deterministic cleanup
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const rafIdRef = useRef(null);
  const inferenceTimerRef = useRef(null);
  const latestFeaturesRef = useRef(null);
  const predictionWindowRef = useRef([]);
  const isRequestPendingRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const isMountedRef = useRef(true);

  // Feature 23: Learning Progress Tracker
  const [learnedSigns, setLearnedSigns] = useState([]);
  const [activePracticeCard, setActivePracticeCard] = useState(LEARNING_CARDS[0]);

  const checkModelHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/isl/predict', { method: 'GET', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (!isMountedRef.current) return;

      if (typeof data.threshold === 'number') {
        setConfidenceThreshold(data.threshold);
      }

      if (!res.ok || data.backend_available === false) {
        setModelLoaded(false);
        setModelStatus('BACKEND_UNAVAILABLE');
        setModelStatusDetail(
          data.message || 'FastAPI ISL recognition service is unavailable on port 8000.'
        );
        return;
      }

      if (data.model_loaded) {
        setModelLoaded(true);
        setModelStatus((prev) => (prev === 'INFERENCE_ACTIVE' ? 'INFERENCE_ACTIVE' : 'READY'));
        setModelStatusDetail(
          `ISL Static V1 Ready (${(data.classes || SUPPORTED_STATIC_SIGNS).length} classes · 126 features)`
        );
      } else {
        setModelLoaded(false);
        setModelStatus('MODEL_UNAVAILABLE');
        setModelStatusDetail('ISL recognition model is not trained/configured.');
      }
    } catch {
      if (!isMountedRef.current) return;
      setModelLoaded(false);
      setModelStatus('BACKEND_UNAVAILABLE');
      setModelStatusDetail('FastAPI ISL recognition service is unavailable.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (inferenceTimerRef.current) {
      clearInterval(inferenceTimerRef.current);
      inferenceTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (handLandmarkerRef.current) {
      try {
        handLandmarkerRef.current.close();
      } catch {}
      handLandmarkerRef.current = null;
    }

    latestFeaturesRef.current = null;
    predictionWindowRef.current = [];
    isRequestPendingRef.current = false;
    lastVideoTimeRef.current = -1;

    if (isMountedRef.current) {
      setIsCameraActive(false);
      setMediapipeReady(false);
      setHandsDetectedCount(0);
      setRecognitionStatus('idle');
      setModelStatus((prev) =>
        prev === 'INFERENCE_ACTIVE' ? (modelLoaded ? 'READY' : 'MODEL_UNAVAILABLE') : prev
      );
    }
  }, [modelLoaded]);

  useEffect(() => {
    isMountedRef.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem('signmitra_learned_isl') || '[]');
      setLearnedSigns(saved);
    } catch {}

    checkModelHealth();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [checkModelHealth, stopCamera]);

  const initializeMediaPipe = async () => {
    setMediapipeError(null);
    const visionModule = await import('@mediapipe/tasks-vision');
    const { FilesetResolver, HandLandmarker } = visionModule;

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    const landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    handLandmarkerRef.current = landmarker;
    if (isMountedRef.current) {
      setMediapipeReady(true);
    }
  };

  const drawLandmarksOverlay = (landmarksList) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarksList || landmarksList.length === 0) return;

    ctx.fillStyle = '#22c55e';
    for (const hand of landmarksList) {
      for (const lm of hand) {
        const x = (1.0 - lm.x) * canvas.width;
        const y = lm.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  const runFrameLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;

    if (video && landmarker && video.readyState >= 2) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const nowMs = performance.now();
          const result = landmarker.detectForVideo(video, nowMs);
          const detectedHands = result?.landmarks || [];
          const detectedHandedness = result?.handednesses || result?.handedness || [];

          setHandsDetectedCount(detectedHands.length);
          drawLandmarksOverlay(detectedHands);

          if (detectedHands.length > 0) {
            latestFeaturesRef.current = extract126DatasetFeatures(
              detectedHands,
              detectedHandedness
            );
          } else {
            latestFeaturesRef.current = null;
          }
        } catch {
          // Ignore transient frame errors to keep camera responsive
        }
      }
    }

    if (isMountedRef.current && streamRef.current) {
      rafIdRef.current = requestAnimationFrame(runFrameLoop);
    }
  }, []);

  const triggerPrediction = useCallback(async () => {
    if (isRequestPendingRef.current) return;

    const features = latestFeaturesRef.current;
    if (!features) {
      predictionWindowRef.current = [];
      if (isMountedRef.current) {
        setRecognitionStatus('no_hands');
      }
      return;
    }

    isRequestPendingRef.current = true;

    try {
      const res = await fetch('/api/isl/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });

      const data = await res.json().catch(() => ({}));
      if (!isMountedRef.current) return;

      if (res.status === 503) {
        if (data.status === 'backend_unavailable' || data.backend_available === false) {
          setModelStatus('BACKEND_UNAVAILABLE');
          setModelStatusDetail(data.message || 'FastAPI ISL recognition service is unavailable.');
        } else {
          setModelLoaded(false);
          setModelStatus('MODEL_UNAVAILABLE');
          setModelStatusDetail('ISL recognition model is not trained/configured.');
        }
        setRecognitionStatus('error');
        setPredictedSign(null);
        return;
      }

      if (!res.ok) {
        setInferenceError(data.message || 'Prediction request failed.');
        setRecognitionStatus('error');
        return;
      }

      setInferenceError(null);
      setModelStatus('INFERENCE_ACTIVE');

      if (Array.isArray(data.top_predictions)) {
        setTopPredictions(data.top_predictions);
      }

      // Push into temporal smoothing window
      const win = predictionWindowRef.current;
      win.push({
        recognized: !!data.recognized && !!data.prediction,
        prediction: data.prediction || null,
        confidence: typeof data.confidence === 'number' ? data.confidence : 0
      });
      if (win.length > SMOOTHING_WINDOW_SIZE) {
        win.shift();
      }

      const { stabilizedSign, stabilizedConfidence } = computeStabilizedPrediction(win);

      if (stabilizedSign) {
        setRecognitionStatus('recognized');
        setPredictedSign(stabilizedSign);
        setPredictedConfidence(stabilizedConfidence);
      } else {
        setRecognitionStatus('uncertain');
        setPredictedSign(null);
        setPredictedConfidence(
          typeof data.confidence === 'number' ? data.confidence : stabilizedConfidence
        );
      }
    } catch {
      if (isMountedRef.current) {
        setModelStatus('BACKEND_UNAVAILABLE');
        setModelStatusDetail('FastAPI ISL recognition service is unavailable.');
        setRecognitionStatus('error');
      }
    } finally {
      isRequestPendingRef.current = false;
    }
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setInferenceError(null);
      setMediapipeError(null);
      setPredictedSign(null);
      setPredictedConfidence(null);
      setTopPredictions([]);
      setConfirmedSign(null);
      predictionWindowRef.current = [];
      latestFeaturesRef.current = null;

      await checkModelHealth();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is unavailable in this browser.');
        return;
      }

      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      try {
        await initializeMediaPipe();
      } catch (mpErr) {
        setMediapipeError(
          'Could not initialize MediaPipe HandLandmarker: ' + (mpErr?.message || 'Unknown error')
        );
      }

      rafIdRef.current = requestAnimationFrame(runFrameLoop);

      inferenceTimerRef.current = setInterval(() => {
        triggerPrediction();
      }, INFERENCE_INTERVAL_MS);
    } catch (err) {
      setCameraError('Camera permission denied or camera unavailable: ' + err.message);
      stopCamera();
    }
  };

  const handleResetPrediction = () => {
    predictionWindowRef.current = [];
    setPredictedSign(null);
    setPredictedConfidence(null);
    setTopPredictions([]);
    setConfirmedSign(null);
    setRecognitionStatus(isCameraActive ? 'no_hands' : 'idle');
  };

  const handleAppendLetter = () => {
    if (!predictedSign) return;
    setSignedWordBuffer((prev) => prev + predictedSign);
  };

  const handleConfirmCandidate = () => {
    const targetText = signedWordBuffer ? signedWordBuffer : predictedSign;
    if (!targetText) return;

    setConfirmedSign(targetText);
    const formattedMessage = `[ISL Signed: ${targetText}]`;

    try {
      const existing = JSON.parse(localStorage.getItem('signmitra_comm_card') || '{}');
      localStorage.setItem(
        'signmitra_comm_card',
        JSON.stringify({
          ...existing,
          lastConfirmedIslSign: targetText,
          lastConfirmedIslMessage: formattedMessage,
          updatedAt: new Date().toISOString()
        })
      );
    } catch {}

    if (onSendToRoom) {
      onSendToRoom(formattedMessage);
    }
  };

  const toggleLearned = (id) => {
    const updated = learnedSigns.includes(id)
      ? learnedSigns.filter((x) => x !== id)
      : [...learnedSigns, id];
    setLearnedSigns(updated);
    localStorage.setItem('signmitra_learned_isl', JSON.stringify(updated));
  };

  const renderStatusBadge = () => {
    switch (modelStatus) {
      case 'INFERENCE_ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-green-600 text-white flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>Model: ISL Static V1 · Status: Active</span>
          </span>
        );
      case 'READY':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Model: ISL Static V1 · Status: Ready</span>
          </span>
        );
      case 'MODEL_UNAVAILABLE':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-600 text-white flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Model Not Trained / Configured</span>
          </span>
        );
      case 'BACKEND_UNAVAILABLE':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-600 text-white flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Backend Unavailable</span>
          </span>
        );
      default:
        return (
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${cardInnerBg} border ${borderTone}`}>
            Checking Model...
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tab Switcher */}
      <div className={`p-2 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-wrap gap-2 shadow-sm`}>
        {[
          { id: 'limited', label: 'Static ISL Recognition (V1)', icon: Video },
          { id: 'continuous', label: 'Continuous Lab (Research)', icon: Cpu },
          { id: 'learn', label: 'ISL Learning Companion', icon: BookOpen }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isActive ? accentSolid : `${cardInnerBg} opacity-70 hover:opacity-100`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 21: STATIC ISL FINGERSPELLING RECOGNITION (V1)                   */}
      {/* ========================================================================= */}
      {activeTab === 'limited' && (
        <div className="space-y-4">
          <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}>
                  ISL RECOGNITION · STATIC V1
                </span>
                <span className="text-xs font-mono opacity-70">
                  23 Static Signs · 126 Wrist-Relative Landmarks · Threshold {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              {renderStatusBadge()}
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              Static ISL Fingerspelling Recognition
            </h2>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed ${textSecondary}`}>
              Real-time recognition for 23 static Indian Sign Language fingerspelling signs using MediaPipe Hands (63 left + 63 right wrist-relative landmarks). Predictions are temporally stabilized and require your confirmation before use.
            </p>

            {modelStatus === 'MODEL_UNAVAILABLE' && (
              <div className="mt-3 p-3.5 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p>ISL recognition model is not trained/configured.</p>
              </div>
            )}

            {modelStatus === 'BACKEND_UNAVAILABLE' && (
              <div className="mt-3 p-3.5 rounded-xl border-2 border-red-500/50 bg-red-500/10 text-xs font-bold text-red-900 dark:text-red-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="space-y-1">
                  <p>{modelStatusDetail}</p>
                  <p className="font-mono text-[11px] opacity-80">
                    Start FastAPI: backend\.venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
                  </p>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="mt-3 p-3.5 rounded-xl border-2 border-red-500/50 bg-red-500/10 text-xs font-bold text-red-900 dark:text-red-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <p>{cameraError}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Camera Viewfinder Box */}
            <div className={`lg:col-span-7 p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}>
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center shadow-inner">
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover scale-x-[-1]"
                        autoPlay
                        playsInline
                        muted
                      />
                      <canvas
                        ref={overlayCanvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />

                      <div className="absolute inset-4 border-2 border-dashed border-[#FDF1E2]/40 rounded-xl pointer-events-none flex items-end justify-between p-2">
                        <span className="text-[10px] font-mono text-[#FDF1E2] bg-black/60 px-2 py-0.5 rounded">
                          Hands visible: {handsDetectedCount} | 126 Landmark Vector
                        </span>
                        <span className="text-[10px] font-mono text-[#FDF1E2] bg-black/60 px-2 py-0.5 rounded">
                          {mediapipeReady ? 'MediaPipe Hands Active' : 'Loading MediaPipe...'}
                        </span>
                      </div>

                      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Camera: Active · Local Landmark Extraction</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <Camera className="w-12 h-12 mx-auto text-gray-500 opacity-60" />
                      <p className="text-xs font-mono font-bold uppercase text-gray-400">
                        Camera Status: Idle (Starts strictly upon explicit user tap)
                      </p>
                    </div>
                  )}
                </div>

                {mediapipeError && (
                  <p className="text-xs font-mono text-red-500">{mediapipeError}</p>
                )}

                <div className="flex gap-2">
                  {!isCameraActive ? (
                    <button
                      onClick={startCamera}
                      className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Recognition</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 flex items-center justify-center gap-2`}
                    >
                      <VideoOff className="w-4 h-4 text-red-500" />
                      <span>Stop Recognition</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Supported Signs Reference (Section 16) */}
              <div className="pt-3 border-t border-dashed space-y-2" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-75">
                    Supported Signs (23 Static Fingerspelling Signs):
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    Excluded dynamic signs: {EXCLUDED_DYNAMIC_SIGNS.join(', ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORTED_STATIC_SIGNS.map((signLetter) => (
                    <span
                      key={signLetter}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                        predictedSign === signLetter
                          ? accentSolid
                          : `${cardInnerBg} ${borderTone}`
                      }`}
                    >
                      {signLetter}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recognition Output & User Confirmation Box */}
            <div className={`lg:col-span-5 p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                    Live Prediction Output
                  </span>
                  <span className="text-[10px] font-mono uppercase opacity-70">
                    Status: {recognitionStatus.toUpperCase()}
                  </span>
                </div>

                {modelStatus === 'MODEL_UNAVAILABLE' ? (
                  <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardInnerBg} space-y-2 text-center`}>
                    <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
                    <p className="text-xs font-mono font-bold uppercase">Model Unavailable</p>
                    <p className="text-xs opacity-85 leading-relaxed">
                      ISL recognition model is not trained/configured.
                    </p>
                  </div>
                ) : modelStatus === 'BACKEND_UNAVAILABLE' ? (
                  <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardInnerBg} space-y-2 text-center`}>
                    <ShieldAlert className="w-8 h-8 mx-auto text-red-500" />
                    <p className="text-xs font-mono font-bold uppercase">Backend Unavailable</p>
                    <p className="text-xs opacity-85 leading-relaxed">{modelStatusDetail}</p>
                  </div>
                ) : recognitionStatus === 'recognized' && predictedSign ? (
                  <div className="space-y-3">
                    <div className={`p-6 rounded-2xl border-4 ${borderTone} ${cardInnerBg} text-center space-y-1.5`}>
                      <span className="text-[10px] font-mono font-bold uppercase opacity-60">PREDICTION</span>
                      <div className="text-5xl font-black tracking-tight">{predictedSign}</div>
                      <div className="text-xs font-mono font-bold opacity-85">
                        Confidence: {((predictedConfidence || 0) * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* Top-3 Predictions Breakdown */}
                    {topPredictions.length > 0 && (
                      <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} space-y-1.5`}>
                        <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                          Top Model Candidates:
                        </span>
                        {topPredictions.map((item) => (
                          <div key={item.label} className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold">Sign {item.label}</span>
                            <span>{(item.confidence * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Optional Fingerspelling Buffer */}
                    <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="opacity-70">Fingerspelled Buffer:</span>
                        <span className="font-black tracking-widest">
                          {signedWordBuffer || predictedSign}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAppendLetter}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border ${borderTone} ${cardBg} hover:opacity-80`}
                        >
                          + Append "{predictedSign}"
                        </button>
                        {signedWordBuffer && (
                          <button
                            type="button"
                            onClick={() => setSignedWordBuffer('')}
                            className={`px-3 py-2 rounded-lg text-xs font-mono border ${borderTone} ${cardBg} hover:opacity-80`}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmCandidate}
                        className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={handleResetPrediction}
                        className={`py-3.5 px-4 rounded-xl font-bold text-xs uppercase border-2 ${borderTone} ${cardInnerBg} hover:opacity-80 flex items-center justify-center gap-1.5`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>

                    {confirmedSign && (
                      <p className="text-xs font-mono font-bold text-green-600 dark:text-green-400 text-center">
                        ✓ Confirmed: [ISL Signed: {confirmedSign}]
                      </p>
                    )}
                  </div>
                ) : recognitionStatus === 'uncertain' ? (
                  <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardInnerBg} space-y-3 text-center`}>
                    <AlertTriangle className="w-7 h-7 mx-auto text-amber-500" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase opacity-60">PREDICTION</span>
                      <div className="text-xl font-black uppercase text-amber-600 dark:text-amber-400">
                        Uncertain
                      </div>
                      <p className="text-xs font-bold">
                        Uncertain — adjust your hand position.
                      </p>
                      <p className="text-[11px] opacity-75">
                        Hold the sign steady and try again.
                      </p>
                    </div>

                    {topPredictions.length > 0 && (
                      <div className="pt-2 border-t border-dashed text-left space-y-1 text-[11px] font-mono opacity-75">
                        <span className="block uppercase text-[10px] opacity-60">Closest candidates (&lt; {(confidenceThreshold * 100).toFixed(0)}% threshold):</span>
                        {topPredictions.map((item) => (
                          <div key={item.label} className="flex justify-between">
                            <span>{item.label}</span>
                            <span>{(item.confidence * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2 opacity-65">
                    <Video className="w-8 h-8 mx-auto" />
                    <p className="text-xs font-mono font-bold uppercase">
                      {isCameraActive
                        ? 'Show one of the 23 supported signs inside the camera frame'
                        : 'Camera Idle — Press Start Recognition'}
                    </p>
                    <p className="text-[11px]">
                      Keep hands clearly lit and visible within the frame.
                    </p>
                  </div>
                )}

                {inferenceError && (
                  <p className="text-xs font-mono text-red-500">{inferenceError}</p>
                )}
              </div>

              {/* Privacy & Assistive Notice (Section 20) */}
              <div className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} text-xs space-y-1.5`}>
                <div className="flex items-center gap-1.5 font-mono font-bold opacity-80">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy & Assistive Scope:</span>
                </div>
                <p className="opacity-80 leading-relaxed text-[11px]">
                  Raw webcam video is never uploaded or stored. Only 126 wrist-relative hand landmark coordinates are sent to the local classifier. Experimental assistive tool for 23 static signs — not certified interpretation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 22: CONTINUOUS ISL RECOGNITION RESEARCH LAB                      */}
      {/* ========================================================================= */}
      {activeTab === 'continuous' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-purple-500/40 bg-purple-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-purple-600 text-white">
                EXPERIMENTAL · MODEL REQUIRED
              </span>
              <span className="text-xs font-mono opacity-70">Research Component</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-purple-950 dark:text-purple-100">
              Continuous ISL Recognition Lab
            </h2>
            <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-2xl text-purple-900 dark:text-purple-200">
              Continuous sign language translation across unconstrained vocabulary is an active open frontier in computer vision and Deaf linguistics. To prevent deception, SignMitra never fabricates translations when a validated end-to-end model is not deployed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}>
              <h3 className="font-black text-sm uppercase flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Linguistic & Technical Frontiers</span>
              </h3>
              <div className="space-y-2 text-xs leading-relaxed opacity-90">
                <p>
                  <strong>• Non-Manual Markers (NMMs):</strong> ISL grammar relies heavily on eyebrow raises, head tilts, mouth shapes, and shoulder shifts for negation and question phrasing.
                </p>
                <p>
                  <strong>• Spatial Grammar:</strong> Entities are indexed in 3D space around the signer and referenced later by pointing (pronominal pointing).
                </p>
                <p>
                  <strong>• Co-articulation & Speed:</strong> Handshapes continuously blend together between consecutive signs, making word boundary segmentation challenging.
                </p>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-3 shadow-sm`}>
              <h3 className="font-black text-sm uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span>Model Activation Criteria</span>
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">○</span>
                  <span>Consented multi-angle ISL video corpus (Pending)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">○</span>
                  <span>Deaf native signer annotations & gloss verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">○</span>
                  <span>Temporal 3D-CNN / Video Transformer inference weights</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Client-side WebRTC Video Capture Architecture (Ready)</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border-2 ${borderTone} ${cardInnerBg} space-y-3`}>
            <span className="text-xs font-mono font-bold uppercase opacity-70">
              Planned Continuous Inference Pipeline:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono font-bold">
              <div className={`p-3 rounded-xl border ${borderTone} ${cardBg}`}>
                1. WebRTC Video (30 FPS)
              </div>
              <div className={`p-3 rounded-xl border ${borderTone} ${cardBg}`}>
                2. 3D Pose & Hand Extraction
              </div>
              <div className={`p-3 rounded-xl border ${borderTone} ${cardBg}`}>
                3. Temporal CTC Gloss Decoder
              </div>
              <div className={`p-3 rounded-xl border ${borderTone} ${cardBg}`}>
                4. User Confirmation Gate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 23: ISL LEARNING AND PRACTICE COMPANION                          */}
      {/* ========================================================================= */}
      {activeTab === 'learn' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className={`p-5 sm:p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-2 shadow-sm`}>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${accentSolid}`}>
                FEATURE 23 · ISLRTC REFERENCED
              </span>
              <span className="text-xs font-mono opacity-70">
                Self-Paced Practice
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              ISL Vocabulary & Practice Companion
            </h2>
            <p className={`text-xs sm:text-sm font-medium ${textSecondary}`}>
              Study standard administrative and healthcare sign descriptions. Practice in front of your camera mirror.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 space-y-2">
              {LEARNING_CARDS.map((card) => {
                const isSelected = activePracticeCard.id === card.id;
                const isDone = learnedSigns.includes(card.id);

                return (
                  <div
                    key={card.id}
                    onClick={() => setActivePracticeCard(card)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-[#655A7C] ring-2 ring-[#655A7C] ' + cardInnerBg : cardBg + ' ' + borderTone
                    } flex items-center justify-between`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase">{card.word}</span>
                        <span className="text-[10px] font-mono opacity-50">({card.category})</span>
                      </div>
                      <p className="text-[11px] opacity-70 truncate max-w-[200px] mt-0.5">{card.tips}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLearned(card.id);
                      }}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isDone ? 'bg-green-600 text-white border-green-600' : `${cardInnerBg} ${borderTone}`
                      }`}
                      title={isDone ? 'Learned' : 'Mark as learned'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className={`md:col-span-7 p-6 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase opacity-60">Practice Guide</span>
                  <h3 className="text-2xl font-black uppercase mt-0.5">{activePracticeCard.word}</h3>
                </div>
                <button
                  onClick={() => toggleLearned(activePracticeCard.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase border flex items-center gap-1.5 transition-all ${
                    learnedSigns.includes(activePracticeCard.id)
                      ? 'bg-green-600 text-white border-green-600'
                      : `${cardInnerBg} ${borderTone}`
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{learnedSigns.includes(activePracticeCard.id) ? 'Mastered ✓' : 'Mark as Learned'}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                  <span className="font-mono font-bold uppercase opacity-70 block mb-1">Hand Shape & Positioning:</span>
                  <p className="font-bold leading-relaxed">{activePracticeCard.handShape}</p>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                  <span className="font-mono font-bold uppercase opacity-70 block mb-1">Movement Dynamics:</span>
                  <p className="font-bold leading-relaxed">{activePracticeCard.movement}</p>
                </div>

                <div className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg}`}>
                  <span className="font-mono font-bold uppercase opacity-70 block mb-1">Facial Expression (NMM):</span>
                  <p className="font-bold leading-relaxed">{activePracticeCard.facialExpression}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs font-mono opacity-70 border-t border-dashed" style={{ borderColor: isDarkTheme ? '#AB92BF30' : '#655A7C20' }}>
                <span>Source: ISLRTC Dictionary Guidelines</span>
                <span>{learnedSigns.length} / {LEARNING_CARDS.length} Completed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
