import assert from 'node:assert';
import { POST as aiStudioPOST } from '../app/api/ai-studio/route.js';
import { POST as visionAnalyzePOST } from '../app/api/vision/analyze/route.js';

// Generates a verified valid 60x60 PNG base64
function createValidTestPngBase64() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAIAAAC1nk4lAAAAdklEQVR4nNXOQREAMAjAsK7+PTMPfLhGQR4MNRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQV4HNj5dXwF3HlGRlwAAAABJRU5ErkJggg==';
}

async function runVision429FocusedSuite() {
  console.log('=== RUNNING FOCUSED GEMINI VISION 429 RECOVERY TEST SUITE ===\n');

  const validB64 = createValidTestPngBase64();

  // Test 1: Direct /api/vision/analyze endpoint returns compliant schema and never fabricates text on 429 / quota exhaustion
  {
    console.log('1. Testing /api/vision/analyze schema compliance & safe quota disclosure...');
    const req = new Request('http://localhost:3000/api/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: validB64,
        mode: 'notice'
      })
    });
    const res = await visionAnalyzePOST(req);
    assert.strictEqual(res.status, 200, 'Endpoint must return HTTP 200 with structured status');
    const data = await res.json();

    assert.strictEqual(data.extracted_text, '', 'Extracted text must be empty when live model is blocked by quota');
    assert.strictEqual(data.is_interpreted_by_ai, false, 'is_interpreted_by_ai must be false');
    assert.strictEqual(data.live_inference_blocked, true, 'live_inference_blocked must be true');
    assert.ok(data.validation_details, 'validation_details must be preserved');
    assert.strictEqual(data.validation_details.image_readable, true, 'image_readable must be preserved');
    console.log('   ✓ /api/vision/analyze safely reports quota state with empty extracted_text and preserved image validation');
  }

  // Test 2: AI Studio understand_image action does NOT inject fake B-34 tokens for user-uploaded image
  {
    console.log('2. Testing /api/ai-studio understand_image action with custom user image...');
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'understand_image',
        imageBase64: validB64,
        imageMimeType: 'image/png',
        featureType: 'token'
      })
    });
    const res = await aiStudioPOST(req);
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
    const data = await res.json();

    assert.strictEqual(data.extractedText, '', 'Must NOT fabricate token text');
    assert.notStrictEqual(data.extractedText, 'TOKEN #B-34\nCOUNTER 4\nDATE: 30-SEP-2026 10:15 AM\nPLEASE PROCEED TO ADMINISTRATIVE COUNTER 4 WITH ORIGINAL FEE SLIP.');
    assert.strictEqual(data.queueDetails, null, 'Must NOT inject fake B-34 queueDetails');
    assert.strictEqual(data.documentBreakdown, null, 'Must NOT inject fake document breakdown');
    assert.strictEqual(data.isInterpretedByAi, false);
    assert.strictEqual(data.liveInferenceBlocked, true);
    console.log('   ✓ /api/ai-studio understand_image preserves honest schema and never fabricates tokens');
  }

  // Test 3: Sample preview request (sampleType === "token") still functions explicitly for UI demos
  {
    console.log('3. Testing /api/ai-studio sample preview preservation...');
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'understand_image',
        sampleType: 'token'
      })
    });
    const res = await aiStudioPOST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.extractedText.includes('TOKEN'), 'Explicit sample request returns sample preview');
    assert.strictEqual(data.isInterpretedByAi, false, 'Sample preview is explicitly marked as non-AI');
    console.log('   ✓ Sample demo previews function properly without claiming to be live AI');
  }

  console.log('\n=== ALL FOCUSED 429 RECOVERY TESTS PASSED ===\n');
}

runVision429FocusedSuite().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});

