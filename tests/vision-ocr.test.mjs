import { POST as aiStudioPOST } from '../app/api/ai-studio/route.js';
import { POST as visionAnalyzePOST } from '../app/api/vision/analyze/route.js';
import assert from 'node:assert';

// 1x1 transparent PNG base64 (valid PNG header)
const TINY_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Generates a verified valid 60x60 PNG base64
function createValidTestPngBase64() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAIAAAC1nk4lAAAAdklEQVR4nNXOQREAMAjAsK7+PTMPfLhGQR4MNRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQRIkQV4HNj5dXwF3HlGRlwAAAABJRU5ErkJggg==';
}

async function testVisionOcrWorkflow() {
  console.log('=== VISION & OCR: AUDITING WORKFLOW & VALIDATION ===\n');

  // Test 1: Upload Validation - Missing / Empty Image Payload returns 400
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'understand_image',
        imageBase64: ''
      })
    });
    const res = await aiStudioPOST(req);
    assert.strictEqual(res.status, 400, 'Empty imageBase64 should return HTTP 400');
    const data = await res.json();
    assert.ok(data.error || data.detail, 'Error message must be present for empty image');
    console.log('✓ Test 1: Missing image payload correctly rejected with HTTP 400');
  }

  // Test 2: Upload Validation - Unsupported Format (e.g. image/gif) returns 400
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'understand_image',
        imageBase64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        imageMimeType: 'image/gif'
      })
    });
    const res = await aiStudioPOST(req);
    assert.strictEqual(res.status, 400, 'Unsupported format (GIF) should return HTTP 400');
    const data = await res.json();
    const errMsg = (data.error || data.detail || '').toLowerCase();
    assert.ok(errMsg.includes('unsupported') || errMsg.includes('format'), 'Should mention unsupported format');
    console.log('✓ Test 2: Unsupported image format rejected with HTTP 400');
  }

  // Test 3: Upload Validation - Oversized Image (> 5MB) returns 400
  {
    // Construct a simulated base64 string exceeding 5MB (5 * 1024 * 1024 * 4/3 chars)
    const largeDummyData = 'A'.repeat(7 * 1024 * 1024);
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'understand_image',
        imageBase64: `data:image/png;base64,${largeDummyData}`,
        imageMimeType: 'image/png'
      })
    });
    const res = await aiStudioPOST(req);
    assert.strictEqual(res.status, 400, 'Oversized image (> 5MB) should return HTTP 400');
    const data = await res.json();
    const errMsg = (data.error || data.detail || '').toLowerCase();
    assert.ok(errMsg.includes('exceeds') || errMsg.includes('5mb') || errMsg.includes('size'), 'Should mention 5MB size limit');
    console.log('✓ Test 3: Oversized image (> 5MB) rejected with HTTP 400');
  }

  // Test 4: Provider-Unconfigured Behavior - MUST NOT fabricate recognized text or canned tokens
  {
    const validB64 = createValidTestPngBase64();
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
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    // Verify absence of fabricated tokens
    assert.notStrictEqual(data.extractedText, 'TOKEN #B-34\nCOUNTER 4\nDATE: 30-SEP-2026 10:15 AM\nPLEASE PROCEED TO ADMINISTRATIVE COUNTER 4 WITH ORIGINAL FEE SLIP.');
    assert.notStrictEqual(data.extractedText, 'TOKEN B-34 COUNTER 4');

    // When unconfigured, live inference is marked blocked
    assert.strictEqual(data.liveInferenceBlocked || data.live_inference_blocked, true, 'liveInferenceBlocked must be true');
    assert.strictEqual(data.isInterpretedByAi || data.is_interpreted_by_ai, false, 'isInterpretedByAi must be false');
    assert.strictEqual(data.extractedText || data.extracted_text, '', 'Extracted text must be empty when no OCR model ran');
    assert.strictEqual(data.queueDetails, null, 'queueDetails must be null without live OCR');

    console.log('✓ Test 4: Provider-unconfigured behavior verified: No fake B-34 tokens, liveInferenceBlocked=true');
  }

  // Test 5: Direct Next.js /api/vision/analyze Endpoint
  {
    const validB64 = createValidTestPngBase64();
    const req = new Request('http://localhost:3000/api/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: validB64,
        mode: 'notice'
      })
    });
    const res = await visionAnalyzePOST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.extracted_text, '', 'extracted_text must be empty');
    assert.strictEqual(data.is_interpreted_by_ai, false, 'is_interpreted_by_ai must be false');
    assert.strictEqual(data.live_inference_blocked, true, 'live_inference_blocked must be true');
    assert.ok(data.provenance.includes('Deterministic') || data.provenance.includes('Pillow'), 'Provenance must mention deterministic validation');
    console.log('✓ Test 5: /api/vision/analyze endpoint verified with honest unconfigured response');
  }

  // Test 6: Direct /api/vision/analyze Endpoint - Missing image returns 400
  {
    const req = new Request('http://localhost:3000/api/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: '',
        mode: 'notice'
      })
    });
    const res = await visionAnalyzePOST(req);
    assert.strictEqual(res.status, 400, 'Missing image_base64 should return HTTP 400');
    console.log('✓ Test 6: Direct vision analyze missing image returns HTTP 400');
  }

  // Test 7: Deterministic Output Labeling & Pillow Distinction
  {
    const validB64 = createValidTestPngBase64();
    const req = new Request('http://localhost:3000/api/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: validB64,
        mode: 'token'
      })
    });
    const res = await visionAnalyzePOST(req);
    const data = await res.json();

    // Verify Pillow validation is NOT called OCR
    const confidenceNote = data.confidence_note || data.confidenceNote || '';
    assert.ok(!confidenceNote.toLowerCase().includes('pillow ocr'), 'Pillow must NOT be described as OCR');
    assert.ok(data.validation_details || data.validationDetails, 'Deterministic validation details must be present');
    console.log('✓ Test 7: Output distinction verified: Pillow labeled as deterministic validator, NOT OCR');
  }

  console.log('\n=== ALL VISION & OCR INTEGRATION TESTS PASSED ===\n');
}

testVisionOcrWorkflow().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
