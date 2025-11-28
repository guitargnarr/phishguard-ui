import { test } from '@playwright/test';

test('Detailed PhishGuard.vercel.app Analysis', async ({ page }) => {
  console.log('\n🛡️  Comprehensive Test: https://phishguard.vercel.app\n');

  await page.goto('https://phishguard.vercel.app', { waitUntil: 'networkidle', timeout: 15000 });

  // Title and heading
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent();
  console.log(`  📄 Title: ${title}`);
  console.log(`  📰 H1: ${h1}`);

  // Navigation
  const navLinks = await page.locator('nav a, nav button').allTextContents();
  console.log(`  🧭 Navigation: ${navLinks.join(' | ')}`);

  // Main content sections
  const h2s = await page.locator('h2').allTextContents();
  console.log(`  📋 Sections (H2s): ${h2s.slice(0, 5).join(', ')}`);

  // Interactive elements
  const buttons = await page.locator('button').allTextContents();
  console.log(`  🔘 Buttons: ${buttons.join(', ')}`);

  const inputs = await page.locator('input, textarea').count();
  console.log(`  📝 Form inputs: ${inputs}`);

  // Check for detection functionality
  const hasDetection = await page.locator('text=/detect|check|scan|analyze/i').count();
  console.log(`  🔍 Detection keywords found: ${hasDetection}`);

  // Check for API reference
  const bodyText = await page.locator('body').textContent();
  const hasRailway = bodyText.includes('railway');
  const hasAPI = bodyText.toLowerCase().includes('api');
  console.log(`  🔌 Mentions Railway: ${hasRailway}`);
  console.log(`  🔌 Mentions API: ${hasAPI}`);

  // Visual elements
  const images = await page.locator('img').count();
  const hasGradients = await page.evaluate(() => {
    const styles = window.getComputedStyle(document.body);
    return styles.background.includes('gradient') ||
           document.querySelector('[style*="gradient"]') !== null;
  });
  console.log(`  🖼️  Images: ${images}`);
  console.log(`  🎨 Gradients: ${hasGradients ? 'Yes' : 'No'}`);

  // Take full screenshot
  await page.screenshot({ path: '/tmp/phishguard-full-analysis.png', fullPage: true });
  console.log(`  📸 Full screenshot: /tmp/phishguard-full-analysis.png`);

  // Try to use detection if available
  const detectButton = page.locator('button:has-text("Start Detection"), button:has-text("Check"), button:has-text("Detect")').first();
  const detectExists = await detectButton.count() > 0;

  if (detectExists) {
    console.log(`\n  🧪 Testing detection functionality...`);
    await detectButton.click();
    await page.waitForTimeout(2000);

    const afterClick = await page.locator('body').textContent();
    console.log(`  After click: ${afterClick.includes('textarea') ? 'Form appeared' : 'No change visible'}`);

    await page.screenshot({ path: '/tmp/phishguard-after-click.png', fullPage: true });
  }
});
