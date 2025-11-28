import { test } from '@playwright/test';

test.describe('PhishGuard UI Production Testing', () => {
  const urls = [
    'https://phishguard-ui.vercel.app',
    'https://phishguard.vercel.app'
  ];

  for (const url of urls) {
    test(`Test ${url}`, async ({ page }) => {
      console.log(`\n🛡️  Testing: ${url}\n`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

        const title = await page.title();
        console.log(`  ✅ Title: ${title}`);

        const h1 = await page.locator('h1').first().textContent().catch(() => 'None');
        console.log(`  📰 Main heading: ${h1}`);

        // Check for phishing detection UI
        const hasTextarea = await page.locator('textarea').count();
        const hasInput = await page.locator('input[type="text"], input[type="email"]').count();
        console.log(`  Form elements: ${hasTextarea} textareas, ${hasInput} inputs`);

        // Check for buttons
        const buttons = await page.locator('button').allTextContents();
        console.log(`  Buttons: ${buttons.join(', ')}`);

        // Check for API connection
        const bodyText = await page.locator('body').textContent();
        const mentionsAPI = bodyText.includes('railway.app') || bodyText.includes('API');
        console.log(`  ${mentionsAPI ? '✅' : '❌'} API mentioned: ${mentionsAPI}`);

        // Get page structure
        const navItems = await page.locator('nav a, nav button').count();
        console.log(`  Navigation items: ${navItems}`);

        await page.screenshot({ path: `/tmp/phishguard-${url.includes('phishguard-ui') ? 'ui' : 'short'}-screenshot.png`, fullPage: true });
        console.log(`  📸 Screenshot saved`);

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    });
  }
});
