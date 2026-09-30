import { POST } from '../app/api/ai-studio/route.js';
import assert from 'node:assert';

async function testApi() {
  console.log('Testing /api/ai-studio route handlers directly...');

  // Test 1: Missing action
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    console.log('✓ Missing action returns 400');
  }

  // Test 2: copilot_prepare
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'copilot_prepare',
        context: 'College Office',
        goal: 'Submit fee receipt',
        institution: 'Madras University'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.checklist.length > 0, 'Checklist should have items');
    assert.ok(data.suggestedCards.length > 0, 'Suggested cards should have items');
    console.log('✓ copilot_prepare returns valid structured checklist and cards');
  }

  // Test 3: explain_plain_language
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'explain_plain_language',
        text: 'Take this slip to Counter 4 before 2:30 PM on Thursday. Bring student ID card.'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.plainLanguageSummary, 'Should have summary');
    assert.ok(data.keyDetails.locationOrCounter.includes('COUNTER 4'), 'Should extract Counter 4');
    console.log('✓ explain_plain_language successfully extracted Counter 4 and deadline');
  }

  // Test 4: detect_gaps
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'detect_gaps',
        text: 'Submit the documents there next week.'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.gaps.length > 0, 'Should detect ambiguities');
    const hasLocationGap = data.gaps.some(g => g.quote === 'there');
    assert.ok(hasLocationGap, 'Should cite quote "there" as ambiguous location');
    console.log('✓ detect_gaps accurately quoted "there" as ambiguous location');
  }

  // Test 5: generate_clarifications
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'generate_clarifications',
        text: 'Submit documents next week.',
        context: 'College'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.clarifications.length > 0, 'Should return clarifications');
    console.log('✓ generate_clarifications returned polite question cards');
  }

  // Test 6: compose_card
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'compose_card',
        intent: 'Verify hall ticket',
        tone: 'polite'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.composedText.includes('Verify hall ticket'), 'Should contain intent');
    console.log('✓ compose_card generated polite card text');
  }

  // Test 7: translate
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'translate',
        text: 'please write down the counter number',
        sourceLang: 'en',
        targetLang: 'hi'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.translatedText, 'Should have translated text');
    console.log('✓ translate returned translated phrase:', data.translatedText);
  }

  // Test 8: simplify_reading_level
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'simplify_reading_level',
        text: 'Please take this requisition slip to the office prior to lunch break.',
        mode: 'simpler'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.simplifiedText.includes('request'), 'Should simplify requisition to request');
    console.log('✓ simplify_reading_level simplified text successfully');
  }

  // Test 9: simulate_rehearsal
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'simulate_rehearsal',
        scenario: 'Bank Branch',
        userTurn: 'I need to update my KYC signature.'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.staffResponse, 'Should simulate staff response');
    assert.ok(data.suggestedUserReplies.length > 0, 'Should suggest user replies');
    console.log('✓ simulate_rehearsal generated realistic bank counter response');
  }

  // Test 10: understand_image
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'understand_image',
        sampleType: 'token',
        featureType: 'queue'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.queueDetails.tokenNumber === 'B-34', 'Should extract token B-34');
    assert.ok(data.queueDetails.counterNumber === 'Counter 4', 'Should extract Counter 4');
    console.log('✓ understand_image extracted token B-34 and Counter 4 accurately');
  }

  // Test 11: evidence_accessibility
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'evidence_accessibility',
        query: 'Hospital'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.records.length > 0, 'Should find hospital record');
    assert.ok(data.records[0].features.interpreter, 'Should report interpreter feature');
    console.log('✓ evidence_accessibility retrieved verified hospital accessibility record');
  }

  console.log('\nALL 11 API TEST CASES PASSED SUCCESSFULLY!');
}

testApi().catch((err) => {
  console.error('API Test Error:', err);
  process.exit(1);
});
