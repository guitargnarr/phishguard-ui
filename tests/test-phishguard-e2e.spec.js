import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://phishguard-ui.vercel.app';

test.describe('PhishGuard Production Tests', () => {
  test('should load the page', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await expect(page.locator('h1')).toContainText('PhishGuard');
  });

  test('should have example buttons', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await expect(page.locator('button:has-text("Try Phishing Example")')).toBeVisible();
    await expect(page.locator('button:has-text("Try Safe Example")')).toBeVisible();
  });

  test('should detect phishing email', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Click phishing example button
    await page.click('button:has-text("Try Phishing Example")');
    
    // Wait for textarea to be filled
    await expect(page.locator('textarea')).not.toHaveValue('');
    
    // Submit
    await page.click('button:has-text("Check for Phishing")');
    
    // Wait for result
    await expect(page.locator('text=Phishing Detected')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=confidence')).toBeVisible();
  });

  test('should detect legitimate email', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Click safe example button
    await page.click('button:has-text("Try Safe Example")');
    
    // Wait for textarea to be filled
    await expect(page.locator('textarea')).not.toHaveValue('');
    
    // Submit
    await page.click('button:has-text("Check for Phishing")');
    
    // Wait for result
    await expect(page.locator('text=Appears Safe')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=confidence')).toBeVisible();
  });
});
