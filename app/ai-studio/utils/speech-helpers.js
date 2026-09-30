/**
 * Web Speech API Utilities & Error Resolvers for Two-Way Room
 *
 * Guarantees:
 * 1. Honest capability detection for STT and TTS.
 * 2. Detailed, user-actionable error mapping (permissions, device busy, network, no speech).
 * 3. Strict provenance labeling: recognized speech is labeled as Browser/Web Speech API, NEVER as LLM output.
 * 4. Zero silent substitutions or canned text on speech failure.
 */

export function checkSpeechCapabilities(targetWindow = null) {
  const win = targetWindow || (typeof window !== 'undefined' ? window : null);
  if (!win) {
    return {
      sttSupported: false,
      ttsSupported: false,
      details: 'Window object unavailable (SSR or non-browser environment).'
    };
  }

  const hasSTT = Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  const hasTTS = Boolean(
    win.speechSynthesis &&
    typeof win.speechSynthesis.speak === 'function' &&
    typeof win.speechSynthesis.cancel === 'function' &&
    (win.SpeechSynthesisUtterance || typeof win.SpeechSynthesisUtterance === 'function')
  );

  return {
    sttSupported: hasSTT,
    ttsSupported: hasTTS,
    details: hasSTT && hasTTS
      ? 'Full browser Web Speech API (STT + TTS) supported.'
      : hasSTT
      ? 'Speech-to-Text supported; Text-to-Speech unavailable.'
      : hasTTS
      ? 'Text-to-Speech supported; Speech-to-Text unavailable.'
      : 'Neither Speech-to-Text nor Text-to-Speech is supported in this browser.'
  };
}

export function getSpeechRecognitionErrorDetails(errorCode) {
  switch (errorCode) {
    case 'not-allowed':
    case 'permission-denied':
      return {
        code: 'not-allowed',
        title: 'Microphone Permission Denied',
        message: 'Microphone access was blocked or denied. Please allow microphone permission in your browser address bar settings to enable live subtitles.',
        actionable: 'Click the camera/mic icon in your address bar and set Microphone to "Allow".'
      };

    case 'audio-capture':
      return {
        code: 'audio-capture',
        title: 'Microphone Unavailable',
        message: 'No microphone was detected on your device or the microphone is busy with another program.',
        actionable: 'Ensure an audio input device is connected and not locked by another application.'
      };

    case 'no-speech':
      return {
        code: 'no-speech',
        title: 'No Speech Detected',
        message: 'No speech was detected before timeout. Please ensure the microphone is positioned close to the speaker.',
        actionable: 'Speak clearly into the microphone and try again.'
      };

    case 'network':
      return {
        code: 'network',
        title: 'Speech Service Network Error',
        message: 'Network communication with the browser speech recognition engine failed.',
        actionable: 'Check your internet connection or use manual keyboard typing.'
      };

    case 'aborted':
      return {
        code: 'aborted',
        title: 'Listening Stopped',
        message: 'Speech recognition was stopped or cancelled.',
        actionable: 'Click "Live Caption Staff" when ready to resume.'
      };

    case 'language-not-supported':
      return {
        code: 'language-not-supported',
        title: 'Language Not Supported',
        message: 'The selected speech recognition language is not supported by your browser.',
        actionable: 'Select a different language from the dropdown menu.'
      };

    case 'service-not-allowed':
      return {
        code: 'service-not-allowed',
        title: 'Service Not Permitted',
        message: 'The browser vendor has blocked speech recognition on this domain or platform.',
        actionable: 'Use manual typing instead.'
      };

    default:
      return {
        code: errorCode || 'recognition_error',
        title: 'Speech Recognition Error',
        message: `Speech recognition encountered an unexpected error (${errorCode || 'unknown'}).`,
        actionable: 'Try speaking again or use manual keyboard typing.'
      };
  }
}

export function getSpeechSynthesisErrorDetails(errorCode, rawMessage = null) {
  if (errorCode === 'canceled' || errorCode === 'interrupted') {
    // Normal lifecycle cancellation when user stops or begins new audio
    return null;
  }

  switch (errorCode) {
    case 'not-allowed':
      return {
        code: 'not-allowed',
        title: 'Audio Playback Blocked',
        message: 'Audio playback was blocked by browser autoplay policy. User gesture is required.',
        actionable: 'Tap the speak button directly to trigger speech playback.'
      };

    case 'audio-busy':
      return {
        code: 'audio-busy',
        title: 'Audio Output Busy',
        message: 'The audio output hardware is currently in use by another task.',
        actionable: 'Wait a moment for existing audio to finish.'
      };

    case 'synthesis-unavailable':
      return {
        code: 'synthesis-unavailable',
        title: 'Voice Engine Unavailable',
        message: 'The browser text-to-speech engine is currently unavailable or uninitialized.',
        actionable: 'Check system audio settings or restart the browser.'
      };

    case 'language-unavailable':
      return {
        code: 'language-unavailable',
        title: 'Voice Unavailable',
        message: 'No compatible text-to-speech voice found for the selected language.',
        actionable: 'System default speech voice will be used.'
      };

    default:
      return {
        code: errorCode || 'playback_error',
        title: 'Playback Error',
        message: rawMessage || `Text-to-speech playback failed (${errorCode || 'Error'}).`,
        actionable: 'Check speaker volume and audio output device.'
      };
  }
}

/**
 * Creates a validated speech recognition turn.
 * Ensures strict labelling as browser Web Speech API, NOT AI/LLM.
 */
export function createSpeechTurn({ text, timestamp = null, sender = 'staff' }) {
  const cleanText = (text || '').trim();
  if (!cleanText) return null;

  return {
    id: `stt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    text: cleanText,
    timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'browser_speech_recognition',
    engine: 'Web Speech API (STT)',
    provenance: 'Browser Web Speech API · Live Speech Subtitle',
    is_ai: false,
    understanding: null
  };
}

/**
 * Creates a validated manual typed turn.
 */
export function createManualTurn({ text, sender = 'staff', timestamp = null }) {
  const cleanText = (text || '').trim();
  if (!cleanText) return null;

  return {
    id: `${sender === 'user' ? 'usr' : 'stf'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    text: cleanText,
    timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: sender === 'user' ? 'user_typed' : 'staff_manual_typed',
    engine: 'manual_input',
    provenance: sender === 'user' ? 'User Message' : 'Typed Staff Input',
    is_ai: false,
    understanding: null,
    status: sender === 'user' ? 'confirmed' : undefined
  };
}
