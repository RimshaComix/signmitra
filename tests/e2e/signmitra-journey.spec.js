const { test, expect } = require('@playwright/test');

test.describe('SignMitra Unified Interaction Journey & Confirmation Model', () => {
  
  test('Complete College Office Flow: Hub -> Prepare -> Communicate -> Verify -> Save -> Planner', async ({ page }) => {
    // 1. Start at Orchestration Hub
    await page.goto('/communication-hub');
    await expect(page.locator('h1')).toContainText('SignMitra Hub');

    // 2. Expand College Office Journey and click Prepare
    await page.click('text=College Office Visit');
    await page.click('a:has-text("Open Prepare")');
    await expect(page).toHaveURL('/steps');

    // 3. Complete a visual guide step and navigate to Conversation Assist
    await page.click('button:has-text("Next Step")');
    await page.goto('/conversation');
    await expect(page.locator('h1, span:has-text("CONVERSATION ASSIST")')).toBeVisible();

    // 4. Send a user message
    await page.fill('input[placeholder="Type your message..."]', 'I need my semester exam registration form signed.');
    await page.click('button:has-text("Send to Staff")');
    await expect(page.locator('text=I need my semester exam registration form signed.')).toBeVisible();

    // 5. Test Confirmation Model (Unverified initially)
    await page.click('button:has-text("Save Summary")');
    await expect(page.locator('text=Unverified / User Entered')).toBeVisible();

    // 6. Simulate Staff Explicit Confirmation via Confirm-Back
    await page.click('button:has-text("Confirm Understanding")');
    await page.fill('placeholder="e.g., the next step is to visit Counter 3"', 'submit the form at Exam Cell Counter 2');
    await page.click('button:has-text("Send Confirmation Request")');
    
    // Staff clicks explicit "Yes, correct"
    await page.click('button:has-text("Yes, correct")');

    // 7. Re-open Save Summary Modal -> Check for Staff Verified badge
    await page.click('button:has-text("Save Summary")');
    await expect(page.locator('text=Staff Verified')).toBeVisible();

    // Fill modal fields and check Send to Planner
    await page.fill('textarea[placeholder*="scholarship form"]', 'Submitted exam form request');
    await page.fill('input[placeholder*="Download and print"]', 'Collect signed slip from Exam Cell');
    await page.click('text=Send to Planner');
    await page.click('button:has-text("Save Summary")');
    await expect(page.locator('text=Summary Captured!')).toBeVisible();

    // 8. Verify persistence in Request History
    await page.goto('/history');
    await expect(page.locator('text=Staff Verified')).toBeVisible();

    // 9. Verify task landed in Universal Planner
    await page.goto('/followups');
    await expect(page.locator('text=Collect signed slip from Exam Cell')).toBeVisible();
    await expect(page.locator('text=Staff Verified')).toBeVisible();
  });

  test('Offline fallback simulation', async ({ page, context }) => {
    await page.goto('/communication-hub');
    
    // Simulate offline mode
    await context.setOffline(true);
    await page.reload();

    // Verify core PWA shell loads from Service Worker cache
    await expect(page.locator('h1')).toContainText('SignMitra Hub');
  });
});