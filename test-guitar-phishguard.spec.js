import { test, expect } from '@playwright/test';

test.describe('Guitar Platform & PhishGuard Production Testing', () => {
  test('Test guitar.projectlavos.com', async ({ page }) => {
    console.log('\n🎸 Testing: https://guitar.projectlavos.com\n');

    try {
      await page.goto('https://guitar.projectlavos.com', { waitUntil: 'networkidle', timeout: 15000 });

      const title = await page.title();
      console.log(`  ✅ Title: ${title}`);

      const h1 = await page.locator('h1').first().textContent().catch(() => 'None');
      console.log(`  📰 Main heading: ${h1}`);

      // Check navigation
      const nav = await page.locator('nav').count();
      console.log(`  ${nav > 0 ? '✅' : '❌'} Navigation: ${nav > 0 ? 'Present' : 'Missing'}`);

      // Check for key guitar features
      const catalog = await page.locator('text=/catalog|browse/i').count();
      const tabPlayer = await page.locator('text=/tab.*player|player/i').count();
      const fretVision = await page.locator('text=/fret|chord/i').count();

      console.log(`  Features detected:`);
      console.log(`    - Catalog/Browse: ${catalog > 0}`);
      console.log(`    - Tab Player: ${tabPlayer > 0}`);
      console.log(`    - Fret/Chord tools: ${fretVision > 0}`);

      // Check for authentication
      const hasLogin = await page.locator('text=/login|sign in/i').count();
      console.log(`  Auth: ${hasLogin > 0 ? 'Login available' : 'No auth detected'}`);

      // Get all links
      const links = await page.locator('a').count();
      console.log(`  Links found: ${links}`);

      // Check if it's loading properly
      const bodyText = await page.locator('body').textContent();
      const hasContent = bodyText.length > 100;
      console.log(`  ${hasContent ? '✅' : '❌'} Page content: ${hasContent ? 'Rich content' : 'Minimal/error'}`);

      await page.screenshot({ path: '/tmp/guitar-platform-screenshot.png', fullPage: true });
      console.log(`  📸 Screenshot: /tmp/guitar-platform-screenshot.png`);

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  });

  test('Test phishguard-ml (find correct URL)', async ({ page }) => {
    console.log('\n🛡️  Testing: PhishGuard ML\n');

    const urlsToTry = [
      'https://phishguard-api-production-88df.up.railway.app',
      'https://phishguard-api-production.up.railway.app',
      'https://phishguard-ml.vercel.app',
      'https://phishguard.vercel.app'
    ];

    for (const url of urlsToTry) {
      console.log(`\n  Testing: ${url}`);

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

        if (response.status() === 200) {
          const title = await page.title();
          console.log(`    ✅ Status: ${response.status()} OK`);
          console.log(`    📄 Title: ${title}`);

          const bodyText = await page.locator('body').textContent();
          const hasAPI = bodyText.includes('API') || bodyText.includes('health') || bodyText.includes('endpoint');
          const hasUI = await page.locator('h1, button, form').count() > 0;

          console.log(`    Type: ${hasAPI ? 'API' : hasUI ? 'UI' : 'Unknown'}`);

          if (hasUI) {
            const h1 = await page.locator('h1').first().textContent().catch(() => 'None');
            console.log(`    Main heading: ${h1}`);

            const hasInput = await page.locator('input, textarea').count();
            console.log(`    Interactive: ${hasInput > 0 ? 'Yes (has forms)' : 'Static'}`);
          }

          await page.screenshot({ path: `/tmp/phishguard-${url.replace(/[^a-z0-9]/gi, '_')}.png`, fullPage: true });
          console.log(`    📸 Screenshot saved`);

        } else {
          console.log(`    ❌ Status: ${response.status()}`);
        }

      } catch (error) {
        console.log(`    ❌ Failed: ${error.message}`);
      }
    }
  });
});
