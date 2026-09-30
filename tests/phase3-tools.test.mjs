import { POST } from '../app/api/ai-studio/route.js';
import assert from 'node:assert';

async function testPhase3TwoWayAndLanguageTools() {
  console.log('=== PHASE 3: AUDITING TWO-WAY ROOM & LANGUAGE TOOLS ===\n');

  // 1. Multilingual Translation: Curated Hindi
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate',
        text: 'Please write down the counter number',
        sourceLang: 'en',
        targetLang: 'hi'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.translatedText.includes('काउंटर नंबर'), 'Hindi translation should contain counter number');
    assert.ok(data.targetLanguage === 'Hindi' || data.targetLanguage === 'hi');
    assert.strictEqual(data.engine, 'curated_dictionary');
    assert.strictEqual(data.provenance, 'Curated Institutional Phrasebook');
    console.log('✓ Test 1: Curated Hindi Translation verified:', data.translatedText);
  }

  // 2. Multilingual Translation: Curated Tamil
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate',
        text: 'Please write down the counter number',
        sourceLang: 'en',
        targetLang: 'ta'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.translatedText.includes('கவுண்டர்'), 'Tamil translation should contain counter');
    assert.strictEqual(data.engine, 'curated_dictionary');
    console.log('✓ Test 2: Curated Tamil Translation verified:', data.translatedText);
  }

  // 3. Multilingual Translation: Curated Marathi
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate',
        text: 'Please communicate in writing',
        sourceLang: 'en',
        targetLang: 'mr'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.translatedText.includes('लिहून'), 'Marathi translation should contain lihun');
    assert.strictEqual(data.engine, 'curated_dictionary');
    console.log('✓ Test 3: Curated Marathi Translation verified:', data.translatedText);
  }

  // 4. Multilingual Translation: Curated Bengali
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate',
        text: 'I am deaf',
        sourceLang: 'en',
        targetLang: 'bn'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.translatedText.includes('শুনতে পাই না'), 'Bengali translation verified');
    assert.strictEqual(data.engine, 'curated_dictionary');
    console.log('✓ Test 4: Curated Bengali Translation verified:', data.translatedText);
  }

  // 5. Multilingual Translation: Unconfigured / Fallback Honest Disclosure
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate',
        text: 'Non-curated complex legal sentence for translation',
        sourceLang: 'en',
        targetLang: 'kn'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    // When no API key is provided, system MUST NOT fabricate live inference
    assert.ok(data.engine === 'unconfigured_fallback' || data.engine?.includes('llm'));
    if (data.engine === 'unconfigured_fallback') {
      assert.strictEqual(data.provenance, 'Provider Unconfigured (Key Required)');
      console.log('✓ Test 5: Unconfigured engine transparently discloses API key requirement');
    } else {
      console.log('✓ Test 5: Live model translation returned with engine:', data.engine);
    }
  }

  // 6. Reading Level Simplification: Simpler Wording
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'simplify_reading_level',
        text: 'It is mandatory to utilize the requisition slip prior to commencing the verification.',
        mode: 'simpler'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.simplifiedText, 'Must have simplifiedText');
    assert.ok(!data.simplifiedText.toLowerCase().includes('mandatory') || data.simplifiedText.toLowerCase().includes('required'));
    assert.ok(data.engine === 'rule_based_simplifier' || data.engine?.includes('llm'));
    console.log('✓ Test 6: Reading Level (simpler) produced:', data.simplifiedText);
  }

  // 7. Reading Level Simplification: Step-by-Step Mode
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'simplify_reading_level',
        text: 'First submit your application at Counter 2. Next pay the registration fee at Counter 5. Then collect your stamped receipt.',
        mode: 'step_by_step'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.simplifiedText, 'Must return step by step text');
    console.log('✓ Test 7: Reading Level (step_by_step) produced:\n' + data.simplifiedText);
  }

  // 8. Card Composer: Polite Tone
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'compose_card',
        intent: 'Request counter stamp for migration certificate',
        tone: 'polite'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.composedText.length > 10, 'Must compose polite text');
    console.log('✓ Test 8: Card Composer (polite) produced:', data.composedText);
  }

  // 9. Session Persistence: Dual Local + Backend Save
  {
    const sessionId = `PHASE3-TEST-${Date.now()}`;
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_session',
        id: sessionId,
        title: 'Phase 3 TwoWay Room Test Session',
        context: 'University Admin',
        goal: 'Verify certificate counter exchange',
        messages: [
          { sender: 'user', text: 'Hello, which counter handles certificate stamping?', timestamp: '10:00 AM' },
          { sender: 'staff', text: 'Please go to Counter 3 with your receipt.', timestamp: '10:01 AM' }
        ],
        confirmedFacts: ['Location: Counter 3'],
        unresolvedQuestions: []
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.session_id, sessionId);
    console.log(`✓ Test 9: Session persistence succeeded with ID: ${data.session_id}`);
  }

  console.log('\nALL 9 PHASE 3 TESTS PASSED SUCCESSFULLY!');
}

testPhase3TwoWayAndLanguageTools().catch(err => {
  console.error('Phase 3 verification failed:', err);
  process.exit(1);
});

