import assert from 'node:assert';
import {
  checkSpeechCapabilities,
  getSpeechRecognitionErrorDetails,
  getSpeechSynthesisErrorDetails,
  createSpeechTurn,
  createManualTurn
} from '../app/ai-studio/utils/speech-helpers.js';

async function testSpeechSuite() {
  console.log('=== TESTING TWO-WAY ROOM SPEECH-TO-TEXT & TEXT-TO-SPEECH ===\n');

  // -------------------------------------------------------------
  // Test 1: Capability Detection Matrix
  // -------------------------------------------------------------
  console.log('--- Test 1: Browser Capability Detection ---');

  // Scenario 1A: Non-browser / SSR environment (null window)
  {
    const caps = checkSpeechCapabilities(null);
    assert.strictEqual(caps.sttSupported, false, 'SSR should detect STT as false');
    assert.strictEqual(caps.ttsSupported, false, 'SSR should detect TTS as false');
    assert.ok(caps.details.includes('unavailable'), 'SSR details should explain window is unavailable');
    console.log('✓ Test 1A: SSR / Null window correctly detected as unsupported');
  }

  // Scenario 1B: Browser with NO speech recognition or synthesis
  {
    const mockEmptyWindow = {};
    const caps = checkSpeechCapabilities(mockEmptyWindow);
    assert.strictEqual(caps.sttSupported, false);
    assert.strictEqual(caps.ttsSupported, false);
    assert.ok(caps.details.includes('Neither Speech-to-Text nor Text-to-Speech'));
    console.log('✓ Test 1B: Unsupported browser correctly flagged with honest notice');
  }

  // Scenario 1C: Modern Chromium browser (webkitSpeechRecognition + speechSynthesis)
  {
    const mockChromeWindow = {
      webkitSpeechRecognition: class MockSTT {},
      speechSynthesis: { speak: () => {}, cancel: () => {}, getVoices: () => [] },
      SpeechSynthesisUtterance: class MockUtterance {}
    };
    const caps = checkSpeechCapabilities(mockChromeWindow);
    assert.strictEqual(caps.sttSupported, true);
    assert.strictEqual(caps.ttsSupported, true);
    assert.ok(caps.details.includes('Full browser Web Speech API'));
    console.log('✓ Test 1C: Full Chromium Web Speech capability (STT + TTS) detected');
  }

  // Scenario 1D: STT-only browser (e.g., custom recognition bridge)
  {
    const mockSTTOnly = {
      SpeechRecognition: class MockSTT {}
    };
    const caps = checkSpeechCapabilities(mockSTTOnly);
    assert.strictEqual(caps.sttSupported, true);
    assert.strictEqual(caps.ttsSupported, false);
    console.log('✓ Test 1D: STT-only environment accurately isolated');
  }

  // Scenario 1E: TTS-only browser (e.g., Firefox where SpeechRecognition is disabled by default)
  {
    const mockTTSOnly = {
      speechSynthesis: { speak: () => {}, cancel: () => {} },
      SpeechSynthesisUtterance: class MockUtterance {}
    };
    const caps = checkSpeechCapabilities(mockTTSOnly);
    assert.strictEqual(caps.sttSupported, false);
    assert.strictEqual(caps.ttsSupported, true);
    console.log('✓ Test 1E: TTS-only environment accurately isolated');
  }

  // -------------------------------------------------------------
  // Test 2: Speech-To-Text Error State Mapping
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Speech-To-Text Error Handling ---');

  // Permission Denial
  {
    const err = getSpeechRecognitionErrorDetails('not-allowed');
    assert.strictEqual(err.code, 'not-allowed');
    assert.ok(err.title.toLowerCase().includes('denied') || err.title.toLowerCase().includes('permission'));
    assert.ok(err.message.includes('blocked or denied'));
    assert.ok(err.actionable.includes('address bar'));
    console.log('✓ Test 2A: Microphone permission denial mapped to clear actionable advice');
  }

  // Microphone Unavailable / Audio Capture
  {
    const err = getSpeechRecognitionErrorDetails('audio-capture');
    assert.strictEqual(err.code, 'audio-capture');
    assert.ok(err.title.includes('Microphone Unavailable') || err.title.includes('Not Found'));
    assert.ok(err.message.includes('No microphone was detected'));
    console.log('✓ Test 2B: Audio-capture hardware failure correctly mapped');
  }

  // No Speech Detected (Timeout)
  {
    const err = getSpeechRecognitionErrorDetails('no-speech');
    assert.strictEqual(err.code, 'no-speech');
    assert.ok(err.title.includes('No Speech Detected'));
    assert.ok(err.actionable.includes('Speak clearly'));
    console.log('✓ Test 2C: No-speech timeout mapped with prompt to speak clearly');
  }

  // Network Error
  {
    const err = getSpeechRecognitionErrorDetails('network');
    assert.strictEqual(err.code, 'network');
    assert.ok(err.title.includes('Network'));
    console.log('✓ Test 2D: Recognition network error mapped');
  }

  // Aborted
  {
    const err = getSpeechRecognitionErrorDetails('aborted');
    assert.strictEqual(err.code, 'aborted');
    assert.ok(err.title.includes('Stopped') || err.title.includes('Cancelled'));
    console.log('✓ Test 2E: Recognition abort mapped');
  }

  // Unexpected / Unknown Error Code
  {
    const err = getSpeechRecognitionErrorDetails('custom-vendor-error');
    assert.strictEqual(err.code, 'custom-vendor-error');
    assert.ok(err.message.includes('custom-vendor-error'));
    console.log('✓ Test 2F: Unknown recognition error safely normalized');
  }

  // -------------------------------------------------------------
  // Test 3: Text-To-Speech Error Handling & Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Text-To-Speech Error Handling & Lifecycle ---');

  // Intentional Cancellation (Must NOT trigger an error alert)
  {
    const errCanceled = getSpeechSynthesisErrorDetails('canceled');
    assert.strictEqual(errCanceled, null, 'Canceled speech is normal lifecycle and should return null');
    const errInterrupted = getSpeechSynthesisErrorDetails('interrupted');
    assert.strictEqual(errInterrupted, null, 'Interrupted speech is normal lifecycle and should return null');
    console.log('✓ Test 3A: User cancellation/interruption correctly returns null (no spurious error)');
  }

  // Autoplay / Permission Blocked
  {
    const err = getSpeechSynthesisErrorDetails('not-allowed');
    assert.ok(err !== null);
    assert.strictEqual(err.code, 'not-allowed');
    assert.ok(err.message.includes('autoplay') || err.message.includes('blocked'));
    console.log('✓ Test 3B: Autoplay policy block correctly mapped with user gesture guidance');
  }

  // Audio Device Busy
  {
    const err = getSpeechSynthesisErrorDetails('audio-busy');
    assert.ok(err !== null);
    assert.strictEqual(err.code, 'audio-busy');
    console.log('✓ Test 3C: Audio busy state correctly mapped');
  }

  // Generic Playback Error
  {
    const err = getSpeechSynthesisErrorDetails('synthesis-failed', 'Hardware error');
    assert.ok(err !== null);
    assert.strictEqual(err.message, 'Hardware error');
    console.log('✓ Test 3D: Custom playback error message preserved');
  }

  // -------------------------------------------------------------
  // Test 4: Strict Non-AI Provenance & No Silent Substitutions
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Provenance Labeling & No Silent Substitutions ---');

  // Speech Recognized Turn
  {
    const recognizedText = 'Counter number 4 is open for document submission';
    const turn = createSpeechTurn({ text: recognizedText });
    assert.ok(turn, 'Turn must be created for valid text');
    assert.strictEqual(turn.sender, 'staff');
    assert.strictEqual(turn.text, recognizedText);
    assert.strictEqual(turn.source, 'browser_speech_recognition');
    assert.strictEqual(turn.engine, 'Web Speech API (STT)');
    assert.strictEqual(turn.is_ai, false, 'Recognized speech must NEVER be labeled as AI/LLM');
    assert.ok(turn.provenance.includes('Browser Web Speech API'));
    console.log('✓ Test 4A: Speech recognized turn strictly labeled with non-AI browser provenance');
  }

  // Empty Speech Turn Validation
  {
    const emptyTurn1 = createSpeechTurn({ text: '' });
    assert.strictEqual(emptyTurn1, null, 'Empty string must not create a speech turn');
    const emptyTurn2 = createSpeechTurn({ text: '   ' });
    assert.strictEqual(emptyTurn2, null, 'Whitespace-only string must not create a speech turn');
    console.log('✓ Test 4B: Empty or whitespace recognition results never insert ghost turns');
  }

  // Manual Typed Turn Validation
  {
    const manualStaff = createManualTurn({ text: 'Please show your token number', sender: 'staff' });
    assert.strictEqual(manualStaff.sender, 'staff');
    assert.strictEqual(manualStaff.source, 'staff_manual_typed');
    assert.strictEqual(manualStaff.is_ai, false);
    assert.strictEqual(manualStaff.provenance, 'Typed Staff Input');

    const manualUser = createManualTurn({ text: 'I am Deaf and need directions', sender: 'user' });
    assert.strictEqual(manualUser.sender, 'user');
    assert.strictEqual(manualUser.source, 'user_typed');
    assert.strictEqual(manualUser.is_ai, false);
    assert.strictEqual(manualUser.provenance, 'User Message');
    console.log('✓ Test 4C: Manual typed inputs maintain distinct typed provenance');
  }

  // -------------------------------------------------------------
  // Test 5: Verification Mode Disclosure
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Test Environment Verification Scope ---');
  console.log('ℹ Verification Mode: UNIT & SIMULATED DOM SPECIFICATION');
  console.log('  - Automated Node.js harness verifies all capability detection branches.');
  console.log('  - Verifies exact W3C Web Speech API error mappings (permissions, hardware, network).');
  console.log('  - Real browser hardware prompts (e.g. navigator.mediaDevices.getUserMedia and');
  console.log('    SpeechRecognition browser-level OS microphone popups) require interactive');
  console.log('    user consent in an active browser window (Chrome/Edge/Safari).\n');

  console.log('ALL TWO-WAY ROOM SPEECH TESTS PASSED SUCCESSFULLY!\n');
}

testSpeechSuite().catch(err => {
  console.error('Speech test suite failed:', err);
  process.exit(1);
});
