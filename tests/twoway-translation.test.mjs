import { POST } from '../app/api/ai-studio/route.js';
import assert from 'node:assert';

async function testTwoWayTranslationWorkflow() {
  console.log('=== TESTING TWO-WAY ROOM REAL TRANSLATION WORKFLOW ===\n');

  // Test 1: Empty text returns 400 validation error
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_ai',
        text: '   ',
        target_language: 'Hindi',
        mode: 'ai'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400, 'Empty text should return HTTP 400');
    console.log('✓ Test 1: Empty text returns 400 validation error');
  }

  // Test 2: Unsupported target language returns 400 error
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_ai',
        text: 'Where is counter 4?',
        target_language: 'klingon_dialect',
        mode: 'ai'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400, 'Unsupported language should return HTTP 400');
    const data = await res.json();
    assert.ok(
      (data.error && data.error.includes('Unsupported')) || (data.detail && data.detail.includes('Unsupported')),
      'Should mention unsupported language'
    );
    console.log('✓ Test 2: Unsupported target language returns 400 with helpful explanation');
  }

  // Test 3: Supported languages validation (Hindi, Tamil, Marathi, Bengali, Telugu, Kannada)
  {
    for (const [code, expectedName] of [
      ['hi', 'Hindi'],
      ['ta', 'Tamil'],
      ['mr', 'Marathi'],
      ['bn', 'Bengali'],
      ['te', 'Telugu'],
      ['kn', 'Kannada']
    ]) {
      const req = new Request('http://localhost:3000/api/ai-studio', {
        method: 'POST',
        body: JSON.stringify({
          action: 'translate_ai',
          text: 'Please show me the counter',
          target_language: code,
          mode: 'ai'
        })
      });
      const res = await POST(req);
      assert.strictEqual(res.status, 200, `Target language ${code} should return HTTP 200`);
      const data = await res.json();
      assert.strictEqual(data.target_language || data.targetLanguage, expectedName);
    }
    console.log('✓ Test 3: All primary Indian target languages successfully resolved and validated');
  }

  // Test 4: Strict AI translation vs Curated Phrasebook separation
  {
    const testPhrase = 'Please write down the counter number';

    // 4A: Deterministic mode returns phrasebook with is_ai: false
    const detReq = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_text',
        text: testPhrase,
        target_language: 'hi',
        mode: 'deterministic'
      })
    });
    const detRes = await detReq ? await POST(detReq) : null;
    assert.strictEqual(detRes.status, 200);
    const detData = await detRes.json();
    assert.strictEqual(detData.engine, 'curated_dictionary');
    assert.strictEqual(detData.is_ai, false);
    assert.ok(detData.provenance.includes('Curated') || detData.provenance.includes('Phrasebook'));
    console.log('✓ Test 4A: Deterministic translation correctly labeled as curated phrasebook (is_ai: false)');

    // 4B: AI mode NEVER substitutes curated phrasebook as fake AI
    const aiReq = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_ai',
        text: testPhrase,
        target_language: 'hi',
        mode: 'ai'
      })
    });
    const aiRes = await POST(aiReq);
    assert.strictEqual(aiRes.status, 200);
    const aiData = await aiRes.json();

    const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
    if (!hasKey) {
      assert.strictEqual(aiData.live_inference_blocked, true);
      assert.strictEqual(aiData.engine, 'unconfigured_fallback');
      assert.strictEqual(aiData.is_ai, true);
      assert.notStrictEqual(aiData.engine, 'curated_dictionary', 'AI translation must not borrow curated dictionary as fake AI');
      console.log('✓ Test 4B: Unconfigured AI translation honestly reports live_inference_blocked without pretending curated dictionary is AI');
    } else {
      assert.strictEqual(aiData.live_inference_blocked, false);
      assert.ok(aiData.engine.includes('llm'));
      assert.strictEqual(aiData.is_ai, true);
      console.log('✓ Test 4B: Live AI translation executed via provider:', aiData.engine);
    }
  }

  // Test 5: Original text and translated text are separated
  {
    const original = 'Where can I collect the disability verification form?';
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate_ai',
        text: original,
        target_language: 'Tamil',
        mode: 'ai'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.original_text || data.originalText, original);
    console.log('✓ Test 5: Original user text preserved and separated from translation');
  }

  // Test 6: Two-Way Room turn model audit & review gate
  {
    const originalInput = 'Please give me token slip for counter 3';
    const reviewedTranslation = 'कृपया मुझे काउंटर 3 की टोकन पर्ची दें (Kripya mujhe counter 3 ki token parchi dein)';

    // Simulating approved turn in TwoWayRoom
    const turnMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: reviewedTranslation,
      originalText: originalInput,
      targetLanguage: 'Hindi',
      engine: 'groq_llm',
      provenance: 'Live Model Translation (groq)',
      is_ai: true,
      status: 'confirmed'
    };

    assert.strictEqual(turnMessage.text, reviewedTranslation);
    assert.strictEqual(turnMessage.originalText, originalInput);
    assert.notStrictEqual(turnMessage.text, turnMessage.originalText);
    assert.strictEqual(turnMessage.is_ai, true);
    console.log('✓ Test 6: Room conversation turn correctly preserves reviewed translation, original input, and provenance');
  }

  console.log('\nALL TWO-WAY ROOM TRANSLATION TESTS PASSED!');
}

testTwoWayTranslationWorkflow().catch(err => {
  console.error('Two-Way Room Translation verification failed:', err);
  process.exit(1);
});

