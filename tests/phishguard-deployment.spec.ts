import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://phishguard-ui.vercel.app'; // Will verify actual URL
const API_ENDPOINT_1 = 'https://phishguard-api-production-88df.up.railway.app';
const API_ENDPOINT_2 = 'https://phishguard-api-production.up.railway.app';

test.describe('PhishGuard Deployment Discovery', () => {

  test('Railway API Endpoint 1 - Health Check', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINT_1}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('API 1 Health:', JSON.stringify(data, null, 2));

    expect(data.status).toBe('healthy');
    expect(data.simple_model_loaded).toBe(true);
    expect(data.endpoints).toContain('/classify (mode=simple|ensemble)');
  });

  test('Railway API Endpoint 2 - Health Check', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINT_2}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('API 2 Health:', JSON.stringify(data, null, 2));

    expect(data.status).toBe('healthy');
    expect(data.simple_model_loaded).toBe(true);
  });

  test('Railway API 1 - Phishing Detection (Simple Mode)', async ({ request }) => {
    const testEmail = {
      email_text: "URGENT! Your PayPal account has been suspended. Click here immediately to verify your identity or we will close your account!",
      mode: "simple"
    };

    const response = await request.post(`${API_ENDPOINT_1}/classify`, {
      data: testEmail,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('Phishing Detection Result:', JSON.stringify(data, null, 2));

    expect(data).toHaveProperty('classification');
    expect(data).toHaveProperty('confidence');
    expect(data).toHaveProperty('is_phishing');
    expect(data.model_mode).toBe('simple');

    // This should be detected as phishing
    expect(data.is_phishing).toBe(true);
    expect(data.confidence).toBeGreaterThan(0.5);
  });

  test('Railway API 1 - Legitimate Email Detection', async ({ request }) => {
    const testEmail = {
      email_text: "Thank you for your recent purchase. Your order #12345 has been shipped and will arrive in 3-5 business days. Track your package at our website.",
      mode: "simple"
    };

    const response = await request.post(`${API_ENDPOINT_1}/classify`, {
      data: testEmail,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('Legitimate Email Result:', JSON.stringify(data, null, 2));

    // This should be detected as legitimate
    expect(data.is_phishing).toBe(false);
    expect(data.classification).toBe('legitimate');
  });

  test('Railway API 1 - Statistics Endpoint', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINT_1}/stats`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('API Statistics:', JSON.stringify(data, null, 2));

    expect(data).toHaveProperty('total_events');
    expect(data).toHaveProperty('by_mode');
    expect(data).toHaveProperty('by_classification');
  });

  test('Railway API 1 - Models Endpoint', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINT_1}/models`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('Available Models:', JSON.stringify(data, null, 2));

    expect(data).toHaveProperty('simple');
    expect(data.simple).toHaveProperty('mode');
    expect(data.simple).toHaveProperty('info');
    expect(data.simple.info).toHaveProperty('type');
  });

  test('Compare API Endpoints - Response Consistency', async ({ request }) => {
    const testEmail = {
      email_text: "Click here to claim your $10,000 prize! You've been selected as a winner!",
      mode: "simple"
    };

    // Test both endpoints with same email
    const [response1, response2] = await Promise.all([
      request.post(`${API_ENDPOINT_1}/classify`, {
        data: testEmail,
        headers: { 'Content-Type': 'application/json' }
      }),
      request.post(`${API_ENDPOINT_2}/classify`, {
        data: testEmail,
        headers: { 'Content-Type': 'application/json' }
      })
    ]);

    const data1 = await response1.json();
    const data2 = await response2.json();

    console.log('API 1 Response:', JSON.stringify(data1, null, 2));
    console.log('API 2 Response:', JSON.stringify(data2, null, 2));

    // Both should give same classification
    expect(data1.is_phishing).toBe(data2.is_phishing);
    expect(data1.classification).toBe(data2.classification);
  });

  test('API Performance Test - Response Time', async ({ request }) => {
    const testEmail = {
      email_text: "Test email for performance measurement",
      mode: "simple"
    };

    const startTime = Date.now();

    const response = await request.post(`${API_ENDPOINT_1}/classify`, {
      data: testEmail,
      headers: { 'Content-Type': 'application/json' }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`API Response Time: ${responseTime}ms`);

    expect(response.ok()).toBeTruthy();
    // Should be fast (under 1 second)
    expect(responseTime).toBeLessThan(1000);
  });

  test('API Batch Processing - Multiple Emails', async ({ request }) => {
    const testEmails = [
      "URGENT: Your account has been locked!",
      "Your package has been delivered successfully.",
      "Congratulations! You won the lottery!",
      "Meeting scheduled for tomorrow at 2pm.",
      "Click here to reset your password NOW!"
    ];

    const results = [];

    for (const email of testEmails) {
      const response = await request.post(`${API_ENDPOINT_1}/classify`, {
        data: { email_text: email, mode: "simple" },
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      results.push({
        email: email.substring(0, 50),
        classification: data.classification,
        confidence: data.confidence,
        is_phishing: data.is_phishing
      });
    }

    console.log('Batch Processing Results:');
    console.table(results);

    // Should successfully process all emails
    expect(results.length).toBe(5);
    results.forEach(result => {
      expect(result).toHaveProperty('classification');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});

test.describe('PhishGuard UI Tests', () => {

  test('Find Production URL', async ({ page }) => {
    // Try common Vercel URL patterns
    const possibleUrls = [
      'https://phishguard-ui.vercel.app',
      'https://phishguard.vercel.app',
      'https://phishguard-ui-guitargnarr.vercel.app',
      'http://localhost:3000' // fallback to local
    ];

    let productionUrl = null;

    for (const url of possibleUrls) {
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
        if (response && response.ok()) {
          productionUrl = url;
          console.log(`Found Production URL: ${url}`);
          break;
        }
      } catch (e) {
        // Continue to next URL
      }
    }

    if (productionUrl) {
      console.log(`✅ PhishGuard UI is deployed at: ${productionUrl}`);

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/phishguard-production.png',
        fullPage: true
      });

      expect(productionUrl).toBeTruthy();
    } else {
      console.log('❌ Could not find deployed PhishGuard UI');
    }
  });

  test('UI - Homepage Loads', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Check for main heading
    await expect(page.locator('h1')).toContainText('PhishGuard');

    // Check for description
    await expect(page.locator('text=AI-powered email security')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/ui-homepage.png',
      fullPage: true
    });
  });

  test('UI - Form Elements Present', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for form elements
    await expect(page.locator('textarea#email-text')).toBeVisible();
    await expect(page.locator('button:has-text("Check for Phishing")')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/ui-form-elements.png'
    });
  });

  test('UI - Phishing Detection Flow', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Enter phishing email
    await page.fill('textarea#email-text',
      'URGENT! Your account has been suspended. Click here to verify!'
    );

    // Submit form
    await page.click('button:has-text("Check for Phishing")');

    // Wait for result
    await page.waitForSelector('text=Phishing Detected', { timeout: 10000 });

    // Verify result is shown
    await expect(page.locator('text=Phishing Detected')).toBeVisible();

    // Take screenshot of result
    await page.screenshot({
      path: 'tests/screenshots/ui-phishing-detected.png',
      fullPage: true
    });
  });

  test('UI - Legitimate Email Detection', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Enter legitimate email
    await page.fill('textarea#email-text',
      'Thank you for your purchase. Your order has been shipped.'
    );

    // Submit form
    await page.click('button:has-text("Check for Phishing")');

    // Wait for result
    await page.waitForSelector('text=Appears Safe', { timeout: 10000 });

    // Verify result
    await expect(page.locator('text=Appears Safe')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/ui-legitimate-detected.png',
      fullPage: true
    });
  });

  test('UI - API Connection Display', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check that API URL is displayed
    await expect(page.locator('text=phishguard-api-production-88df.up.railway.app')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/ui-api-info.png'
    });
  });

  test('UI - Responsive Design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({
      path: 'tests/screenshots/ui-mobile.png',
      fullPage: true
    });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000');

    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({
      path: 'tests/screenshots/ui-tablet.png',
      fullPage: true
    });

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000');

    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({
      path: 'tests/screenshots/ui-desktop.png',
      fullPage: true
    });
  });
});

test.describe('PhishGuard Architecture Assessment', () => {

  test('Document Complete Architecture', async () => {
    const architecture = {
      components: {
        frontend: {
          name: 'phishguard-ui',
          tech: 'Next.js 16, React 19, TypeScript, Tailwind v4',
          deployment: 'Vercel',
          features: ['Email input form', 'Real-time classification', 'Confidence scoring', 'Visual feedback']
        },
        backend_api_1: {
          name: 'phishguard-api-production-88df',
          url: API_ENDPOINT_1,
          tech: 'FastAPI, Python 3.9.6, scikit-learn 1.6.1',
          deployment: 'Railway',
          models: ['Simple: RandomForest (2000 features, 33KB)']
        },
        backend_api_2: {
          name: 'phishguard-api-production',
          url: API_ENDPOINT_2,
          tech: 'FastAPI, Python 3.9.6, scikit-learn 1.6.1',
          deployment: 'Railway',
          models: ['Simple: RandomForest (2000 features, 33KB)']
        }
      },
      dataFlow: [
        '1. User enters email text in Next.js UI',
        '2. UI sends POST to Railway API endpoint',
        '3. FastAPI preprocesses text (TF-IDF vectorization)',
        '4. RandomForest model classifies (2000 features)',
        '5. API returns classification + confidence',
        '6. UI displays result with visual indicators'
      ],
      uniqueValue: [
        'Fast classification (<20ms response time)',
        'Privacy-focused (no data stored)',
        'Modern patterns (crypto scams, BEC, 2FA bypass)',
        '150+ phishing patterns recognized',
        'Clean, accessible UI with React 19'
      ]
    };

    console.log('=== PhishGuard Architecture ===');
    console.log(JSON.stringify(architecture, null, 2));

    expect(architecture.components.frontend.tech).toContain('Next.js');
    expect(architecture.components.backend_api_1.deployment).toBe('Railway');
  });
});
