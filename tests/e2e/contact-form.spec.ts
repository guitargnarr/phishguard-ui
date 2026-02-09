import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://meridian.projectlavos.com';

test.describe('ContactForm Lead Capture', () => {
  test('should display contact form with all required fields', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Verify form fields exist
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#company')).toBeVisible();
    await expect(page.locator('textarea#message')).toBeVisible();
    await expect(page.locator('button:has-text("Request Demo")')).toBeVisible();
  });

  test('should have proper labels for accessibility', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Check labels
    await expect(page.locator('label[for="name"]')).toContainText('Name');
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="company"]')).toContainText('Company');
    await expect(page.locator('label[for="message"]')).toContainText('data insights');
  });

  test('should fill out contact form successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Fill form
    await page.fill('input#name', 'Test User');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#company', 'Test Corp');
    await page.fill('textarea#message', 'Interested in enterprise email security');

    // Verify filled values
    await expect(page.locator('input#name')).toHaveValue('Test User');
    await expect(page.locator('input#email')).toHaveValue('test@example.com');
    await expect(page.locator('input#company')).toHaveValue('Test Corp');
    await expect(page.locator('textarea#message')).toHaveValue('Interested in enterprise email security');
  });

  test('should show demo request section heading', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    await expect(page.locator('h2:has-text("Request a")')).toBeVisible();
  });

  test('should have stats banner visible', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    await expect(page.locator('text=50 States')).toBeVisible();
    await expect(page.locator('text=5 Overlays')).toBeVisible();
    await expect(page.locator('text=330M+')).toBeVisible();
  });
});
