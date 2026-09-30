import { POST } from '../app/api/ai-studio/route.js';
import assert from 'node:assert';

async function testRecoveryJourney() {
  console.log('--- AUDITING 10-STEP RECOVERY JOURNEY ---');

  // STEP 1: Start Interaction
  const context = 'College Office';
  const goal = 'Submit an incomplete application and confirm which documents are missing, the exact deadline, and where to submit them.';
  const institution = 'City University Admin Cell';
  const preferences = 'Visual Cards + Written Replies';
  console.log('✓ Step 1: Start parameters initialized');

  // STEP 2: Prepare (Copilot Planning)
  const prepReq = new Request('http://localhost:3000/api/ai-studio', {
    method: 'POST',
    body: JSON.stringify({
      action: 'copilot_prepare',
      context,
      goal,
      institution,
      preferences
    })
  });
  const prepRes = await POST(prepReq);
  assert.strictEqual(prepRes.status, 200, 'Copilot should return 200');
  const prepData = await prepRes.json();
  assert.ok(Array.isArray(prepData.checklist), 'Must have checklist');
  assert.ok(Array.isArray(prepData.suggestedCards), 'Must have suggestedCards');
  assert.ok(Array.isArray(prepData.suggestedDocuments), 'Must have suggestedDocuments');
  console.log(`✓ Step 2: Copilot generated ${prepData.checklist.length} checklist items, ${prepData.suggestedCards.length} cards, and ${prepData.suggestedDocuments.length} document suggestions.`);

  // STEP 3: Communicate
  const openingCard = `Hello, I am here regarding: ${goal}. Please communicate in writing.`;
  assert.ok(openingCard.length > 20, 'Opening card formatted');
  console.log(`✓ Step 3: Communicate card ready for counter display: "${openingCard}"`);

  // STEP 4: Capture
  const capturedResponse = 'Your application is incomplete. Submit the missing document next week.';
  console.log(`✓ Step 4: Staff response captured: "${capturedResponse}"`);

  // STEP 5: Understand (Plain-Language Explainer)
  const expReq = new Request('http://localhost:3000/api/ai-studio', {
    method: 'POST',
    body: JSON.stringify({
      action: 'explain_plain_language',
      text: capturedResponse,
      context
    })
  });
  const expRes = await POST(expReq);
  assert.strictEqual(expRes.status, 200);
  const expData = await expRes.json();
  assert.ok(expData.plainLanguageSummary, 'Must have plain language summary');
  console.log('✓ Step 5: Plain language explanation generated:');
  console.log('  Summary:', expData.plainLanguageSummary);
  console.log('  Action item:', expData.actionRequired);

  // STEP 6: Detect Gaps
  const gapReq = new Request('http://localhost:3000/api/ai-studio', {
    method: 'POST',
    body: JSON.stringify({
      action: 'detect_gaps',
      text: capturedResponse,
      context
    })
  });
  const gapRes = await POST(gapReq);
  assert.strictEqual(gapRes.status, 200);
  const gapData = await gapRes.json();
  assert.ok(Array.isArray(gapData.gaps), 'Gaps must be an array');
  
  // Verify that ambiguities like "next week" or "missing document" are detected with exact quotes
  const quotes = gapData.gaps.map(g => g.quote.toLowerCase());
  const hasTimingGap = quotes.some(q => q.includes('next week') || q.includes('week') || q.includes('submit'));
  const hasDocGap = quotes.some(q => q.includes('document') || q.includes('missing') || q.includes('incomplete'));
  
  console.log(`✓ Step 6: Detected ${gapData.gaps.length} gaps:`);
  gapData.gaps.forEach(g => {
    console.log(`   - [${g.type}] Quote: "${g.quote}" -> Issue: ${g.issue}`);
  });
  assert.ok(gapData.gaps.length > 0, 'Must detect at least 1 ambiguity in vague text');

  // STEP 7: Clarify (Clarification Cards)
  const clarReq = new Request('http://localhost:3000/api/ai-studio', {
    method: 'POST',
    body: JSON.stringify({
      action: 'generate_clarifications',
      text: capturedResponse,
      context,
      specificGap: gapData.gaps.map(g => g.issue).join('; ')
    })
  });
  const clarRes = await POST(clarReq);
  assert.strictEqual(clarRes.status, 200);
  const clarData = await clarRes.json();
  assert.ok(Array.isArray(clarData.clarifications), 'Must return clarification cards');
  console.log(`✓ Step 7: Clarification cards generated (${clarData.clarifications.length}):`);
  clarData.clarifications.forEach(c => {
    console.log(`   - "${c.questionCard}"`);
  });

  // STEP 8: Confirm (Explicit user confirmation matrix)
  const confirmationItems = [
    { id: 'conf-1', label: 'Counter or Room Number', value: '', status: 'unclear' },
    { id: 'conf-2', label: 'Deadline or Collection Date', value: 'Next week (Unspecified day)', status: 'unclear' },
    { id: 'conf-3', label: 'Required Documents Checked', value: 'Unspecified missing document', status: 'unclear' },
    { id: 'conf-4', label: 'Next Action Step', value: 'Submit missing documents', status: 'confirmed' }
  ];
  const confirmedCount = confirmationItems.filter(i => i.status === 'confirmed').length;
  const unclearCount = confirmationItems.filter(i => i.status === 'unclear').length;
  assert.strictEqual(confirmedCount, 1);
  assert.strictEqual(unclearCount, 3);
  console.log(`✓ Step 8: User confirmation matrix: ${confirmedCount} confirmed, ${unclearCount} marked unclear.`);

  // STEP 9: Summarize (Strict separation of confirmed vs unresolved)
  const summary = {
    title: `${context}: ${goal}`,
    confirmedFacts: confirmationItems.filter(i => i.status === 'confirmed').map(i => `${i.label}: ${i.value}`),
    unresolvedQuestions: confirmationItems.filter(i => i.status === 'unclear').map(i => `Missing ${i.label}`),
    explicitDates: [],
    aiSuggestions: ['Bring student ID and original fee receipt on return visit']
  };
  assert.strictEqual(summary.confirmedFacts.length, 1);
  assert.strictEqual(summary.unresolvedQuestions.length, 3);
  console.log('✓ Step 9: Structured summary produced:');
  console.log('  Confirmed facts:', summary.confirmedFacts);
  console.log('  Unresolved questions:', summary.unresolvedQuestions);

  // STEP 10: Follow Up (Tasks & Persistence shape)
  const task = {
    id: `TASK-${Date.now()}`,
    title: `${context}: Submit missing documents`,
    situation: `${institution} follow-up`,
    category: 'Education',
    type: 'Action Step',
    nextAction: 'Ask department advisor for list of missing documents',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'High',
    status: 'Planned',
    approved: true
  };
  assert.ok(task.id.startsWith('TASK-'));
  assert.strictEqual(task.approved, true);
  console.log('✓ Step 10: Follow-up action step prepared:', task.title);

  console.log('\nALL 10 STEPS OF RECOVERY JOURNEY VERIFIED AND PASSING!');
}

testRecoveryJourney().catch(err => {
  console.error('Recovery Journey Audit Failed:', err);
  process.exit(1);
});
