import { POST } from '../app/api/ai-studio/route.js';
import assert from 'node:assert';

async function testLanguageToolsSuite() {
  console.log('=== TESTING LANGUAGE TOOLS: TRANSLATION & SIMPLIFICATION ===\n');

  // Test 1: Translation Input Validation (Empty text)
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_ai',
        text: '   ',
        target_language: 'Hindi'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400, 'Empty translation text should return 400');
    console.log('✓ Test 1: Empty translation input rejected with HTTP 400');
  }

  // Test 2: Unsupported Target Language Rejection
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_ai',
        text: 'Where do I submit the scholarship form?',
        target_language: 'elvish_sindarin'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400, 'Unsupported language should return 400');
    const data = await res.json();
    const errStr = data.error || data.detail || '';
    assert.ok(errStr.toLowerCase().includes('unsupported'), 'Error must specify unsupported language');
    console.log('✓ Test 2: Unsupported target language rejected with descriptive HTTP 400');
  }

  // Test 3: Language Auto-Detection Provider Check
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'detect_language',
        text: 'कृपया मुझे बताएं कि काउंटर 4 कहाँ है'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
    if (!hasKey) {
      assert.strictEqual(data.detected, false);
      assert.strictEqual(data.live_inference_blocked, true);
      assert.ok(data.error.includes('unavailable') || data.error.includes('unconfigured'));
      console.log('✓ Test 3: Language detection honestly discloses unconfigured provider state');
    } else {
      assert.strictEqual(data.detected, true);
      assert.ok(data.language_name);
      console.log('✓ Test 3: Live language detection detected language:', data.language_name);
    }
  }

  // Test 4: Strict Separation: Deterministic Phrasebook vs Live AI Translation
  {
    const testPhrase = 'I am deaf';

    // 4A: Deterministic Mode
    const detReq = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_text',
        text: testPhrase,
        target_language: 'ta',
        mode: 'deterministic'
      })
    });
    const detRes = await POST(detReq);
    assert.strictEqual(detRes.status, 200);
    const detData = await detRes.json();
    assert.strictEqual(detData.engine, 'curated_dictionary');
    assert.strictEqual(detData.is_ai, false);
    assert.ok(detData.translated_text.includes('எனக்கு காது கேளாது'));
    assert.strictEqual(detData.original_text, testPhrase);
    console.log('✓ Test 4A: Curated Phrasebook returns offline entry without claiming AI');

    // 4B: Live AI Mode
    const aiReq = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_ai',
        text: testPhrase,
        target_language: 'ta',
        mode: 'ai'
      })
    });
    const aiRes = await POST(aiReq);
    assert.strictEqual(aiRes.status, 200);
    const aiData = await aiRes.json();
    assert.strictEqual(aiData.is_ai, true);
    assert.notStrictEqual(aiData.engine, 'curated_dictionary', 'AI translation must not echo curated phrasebook as fake AI');
    console.log('✓ Test 4B: Live AI translation maintains distinct AI provenance flag');
  }

  // Test 5: Reading Level Simplification (Modes & Separation)
  {
    const complexText = 'It is mandatory to utilize the requisition slip prior to commencing the verification procedure.';

    for (const mode of ['simpler', 'shorter', 'step_by_step', 'key_points', 'formal']) {
      const req = new Request('http://localhost:3000/api/ai-studio', {
        method: 'POST',
        body: JSON.stringify({
          action: 'simplify_reading_level',
          text: complexText,
          mode
        })
      });
      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.originalText, complexText);
      assert.ok(data.simplifiedText && data.simplifiedText.length > 5);
      assert.ok(data.engine);
      assert.ok(data.provenance);
    }
    console.log('✓ Test 5: All 5 simplification modes succeed with separated originalText and provenance');
  }

  // Test 6: Simplification Empty Input Validation
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'simplify_reading_level',
        text: '   ',
        mode: 'simpler'
      })
    });
    const res = await POST(req);
    assert.ok(res.status === 400 || res.status === 422, 'Empty simplification input must return 400 or 422');
    console.log('✓ Test 6: Empty text for simplification correctly rejected');
  }

  console.log('\nALL LANGUAGE TOOLS TESTS PASSED SUCCESSFULLY!');
}

testLanguageToolsSuite().catch(err => {
  console.error('Language tools test suite failed:', err);
  process.exit(1);
});
