import { test, expect, devices } from '@playwright/test';

const PROD_URL = 'https://phishguard-ui.vercel.app';

test.describe('PhishGuard UI - Core Functionality', () => {
  test('Page loads successfully', async ({ page }) => {
    const response = await page.goto(PROD_URL);
    expect(response?.status()).toBe(200);
  });

  test('Title contains PhishGuard', async ({ page }) => {
    await page.goto(PROD_URL);
    const title = await page.title();
    expect(title).toContain('PhishGuard');
  });

  test('Main heading visible', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('Email input form present', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
    const textarea = page.locator('textarea');
    await expect(textarea.first()).toBeVisible();
  });

  test('Submit button present', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
    const button = page.locator('button:has-text("Check for Phishing")');
    await expect(button).toBeVisible();
  });
});

test.describe('PhishGuard UI - Content', () => {
  test('Security-related content visible', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
    const content = page.locator('text=/phishing|security|email|detect/i');
    const count = await content.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Interactive elements present', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
    const interactiveElements = page.locator('a, button');
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('PhishGuard UI - SEO & Meta Tags', () => {
  test('Meta description present', async ({ page }) => {
    await page.goto(PROD_URL);
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toBeAttached();
  });

  test('OG image present', async ({ page }) => {
    await page.goto(PROD_URL);
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toBeAttached();
  });

  test('Viewport meta present', async ({ page }) => {
    await page.goto(PROD_URL);
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toBeAttached();
  });
});

test.describe('PhishGuard UI - Mobile Responsiveness', () => {
  test('No horizontal overflow on mobile', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 12'] });
    const page = await context.newPage();
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');

    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
    await context.close();
  });

  test('Touch targets meet 44px minimum', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 12'] });
    const page = await context.newPage();
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');

    const smallTargets = await page.evaluate(() => {
      const elements = [...document.querySelectorAll('a, button')];
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        // Skip sr-only elements
        const computedStyle = window.getComputedStyle(el);
        const isSrOnly = computedStyle.position === 'absolute' &&
                         (rect.width <= 1 || rect.height <= 1);
        if (isSrOnly) return false;
        return rect.width > 0 && rect.height > 0 && (rect.width < 43.5 || rect.height < 43.5);
      }).map(el => ({
        text: el.textContent?.slice(0, 30),
        width: Math.round(el.getBoundingClientRect().width),
        height: Math.round(el.getBoundingClientRect().height)
      }));
    });

    console.log('Small touch targets found:', JSON.stringify(smallTargets, null, 2));
    expect(smallTargets).toHaveLength(0);
    await context.close();
  });

  test('Content accessible on mobile', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 12'] });
    const page = await context.newPage();
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('h1, main, [class*="content"]');
    await expect(mainContent.first()).toBeVisible();
    await context.close();
  });
});

test.describe('PhishGuard UI - Accessibility', () => {
  test('Interactive elements are focusable', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('Form inputs have labels', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea');
    const count = await textarea.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const ta = textarea.nth(i);
      const id = await ta.getAttribute('id');
      const ariaLabel = await ta.getAttribute('aria-label');
      const placeholder = await ta.getAttribute('placeholder');

      // Should have some form of labeling
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
    }
  });
});
