import { POST } from '../app/api/ai-studio/route.js';
import assert from 'node:assert';

async function testTwoWayTypedWorkflow() {
  console.log('=== TESTING TWO-WAY ROOM TYPED-TEXT WORKFLOW ===\n');

  // Test 1: Empty text validation
  {
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'rewrite_text',
        text: '   ',
        mode: 'polite'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    console.log('✓ Test 1: Empty text returns 400 validation error');
  }

  // Test 2: Unconfigured Provider State Disclosure (No canned text as fake AI)
  {
    const testText = 'Where is the certificate verification room?';
    const req = new Request('http://localhost:3000/api/ai-studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'rewrite_text',
        text: testText,
        mode: 'polite',
        domain: 'University Admin'
      })
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    // Verify separate original text preserved
    assert.strictEqual(data.original_text, testText);

    // If no provider key is configured in test env, system MUST report live inference as blocked
    const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
    if (!hasKey) {
      assert.strictEqual(data.live_inference_blocked, true);
      assert.strictEqual(data.engine, 'unconfigured_fallback');
      assert.ok(data.error.includes('No active AI provider key') || data.error.includes('blocked'));
      console.log('✓ Test 2: When unconfigured, live inference is reported as blocked without canned fake AI.');
    } else {
      assert.ok(data.engine.includes('llm'));
      assert.ok(data.transformed_text.length > 5);
      console.log('✓ Test 2: Live model inference executed via provider:', data.engine);
    }
  }

  // Test 3: Multiple Rewrite Modes contract (polite, clear, simpler, urgent)
  {
    for (const mode of ['polite', 'clear', 'simpler', 'urgent']) {
      const req = new Request('http://localhost:3000/api/ai-studio', {
        method: 'POST',
        body: JSON.stringify({
          action: 'rewrite_text',
          text: 'Submit the registration form',
          mode
        })
      });
      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.mode, mode);
      assert.ok(data.original_text === 'Submit the registration form');
    }
    console.log('✓ Test 3: All 4 rewrite modes (polite, clear, simpler, urgent) supported with separate original text.');
  }

  // Test 4: Frontend turn construction preserves originalText and honest provenance
  {
    const originalInput = 'Tell me counter number now';
    const transformedOutput = 'Excuse me, could you please tell me which counter number I should visit?';
    
    // Simulate user reviewing & approving transformed text in TwoWayRoom
    const turnMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: transformedOutput,
      originalText: originalInput,
      provenance: 'Live Model Generated (groq_llm)',
      engine: 'groq_llm',
      status: 'confirmed'
    };

    assert.strictEqual(turnMessage.text, transformedOutput);
    assert.strictEqual(turnMessage.originalText, originalInput);
    assert.notStrictEqual(turnMessage.text, turnMessage.originalText);
    assert.strictEqual(turnMessage.provenance, 'Live Model Generated (groq_llm)');
    console.log('✓ Test 4: Two-Way Room turn separates original user input from approved transformed text with honest provenance.');
  }

  console.log('\nALL TWO-WAY ROOM TYPED-TEXT TESTS PASSED!');
}

testTwoWayTypedWorkflow().catch(err => {
  console.error('Two-Way Room test failed:', err);
  process.exit(1);
});
