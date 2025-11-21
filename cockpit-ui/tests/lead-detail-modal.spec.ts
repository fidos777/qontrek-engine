import { test, expect } from '@playwright/test';

test.describe('Lead Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/gates/g2', { waitUntil: 'networkidle' });
  });

  test('opens modal on lead row click and shows details', async ({ page }) => {
    const firstLeadRow = page.locator('[data-testid^="lead-row-"]').first();
    await expect(firstLeadRow).toBeVisible();
    await firstLeadRow.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await expect(modal).toContainText(/Outstanding Amount/i);

    const callButton = modal.locator('button:has-text("Call Now")');
    await expect(callButton).toBeVisible();
    await callButton.click();

    await expect(page.locator('text=/Initiating call to/i')).toBeVisible({
      timeout: 5000,
    });

    await expect(modal).toBeHidden();
  });

  test('closes modal on Escape key', async ({ page }) => {
    const firstLeadRow = page.locator('[data-testid^="lead-row-"]').first();
    await firstLeadRow.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(modal).toBeHidden();
  });

  test('shows all action buttons', async ({ page }) => {
    const firstLeadRow = page.locator('[data-testid^="lead-row-"]').first();
    await firstLeadRow.click();

    const modal = page.locator('[role="dialog"]');

    await expect(modal.locator('button:has-text("Call Now")')).toBeVisible();
    await expect(modal.locator('button:has-text("Send SMS")')).toBeVisible();
    await expect(modal.locator('button:has-text("WhatsApp")')).toBeVisible();
  });
});
