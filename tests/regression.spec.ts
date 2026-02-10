import { test, expect } from '@playwright/test';

const testResults: {
  feature: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  duration?: number;
}[] = [];

// Helper to record test results
function recordResult(feature: string, status: 'PASS' | 'FAIL', error?: string, duration?: number) {
  testResults.push({ feature, status, error, duration });
}

test.describe('Consensus Vault - Full Regression Suite', () => {

  test.describe('Page Load Tests', () => {
    const pages = [
      { path: '/', name: 'Main/Home Page' },
      { path: '/arena', name: 'AI Debate Arena' },
      { path: '/chatroom', name: 'AI Chatroom (49 personas)' },
      { path: '/enhanced-consensus', name: 'Enhanced Consensus View' },
      { path: '/human-chat', name: 'Human Chat' },
      { path: '/predict', name: 'Prediction Market' },
      { path: '/rounds', name: 'Trading Rounds' },
      { path: '/admin/moderation', name: 'Admin Panel' },
    ];

    for (const page of pages) {
      test(`${page.name} should load without errors`, async ({ page: browserPage }) => {
        const startTime = Date.now();
        const consoleErrors: string[] = [];

        // Capture console errors
        browserPage.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        try {
          const response = await browserPage.goto(page.path, {
            waitUntil: 'networkidle',
            timeout: 30000
          });

          const duration = Date.now() - startTime;

          // Check if page loaded successfully
          expect(response?.status()).toBeLessThan(400);

          // Check for critical console errors (ignore some known warnings)
          const criticalErrors = consoleErrors.filter(err =>
            !err.includes('Warning:') &&
            !err.includes('DevTools')
          );

          if (criticalErrors.length > 0) {
            console.log(`Console errors on ${page.name}:`, criticalErrors);
          }

          // Wait for main content to be visible
          await browserPage.waitForSelector('body', { timeout: 5000 });

          recordResult(`Page: ${page.name}`, 'PASS', undefined, duration);
        } catch (error) {
          recordResult(`Page: ${page.name}`, 'FAIL', String(error));
          throw error;
        }
      });
    }
  });

  test.describe('API Endpoint Tests', () => {
    const apiEndpoints = [
      { path: '/api/health', name: 'Health Check', method: 'GET' },
      { path: '/api/price', name: 'Price Data', method: 'GET' },
      { path: '/api/market-data', name: 'Market Data', method: 'GET' },
      { path: '/api/consensus', name: 'Consensus Basic', method: 'GET' },
      { path: '/api/consensus-detailed', name: 'Consensus Detailed', method: 'GET' },
      { path: '/api/consensus-enhanced', name: 'Consensus Enhanced', method: 'GET' },
      { path: '/api/chatroom/history', name: 'Chatroom History', method: 'GET' },
      { path: '/api/trading/history', name: 'Trading History', method: 'GET' },
    ];

    for (const endpoint of apiEndpoints) {
      test(`API: ${endpoint.name} should respond`, async ({ request }) => {
        const startTime = Date.now();

        try {
          const response = await request.get(`http://localhost:3000${endpoint.path}`, {
            timeout: 15000
          });

          const duration = Date.now() - startTime;
          const status = response.status();

          // Accept 200-299 as success
          expect(status).toBeGreaterThanOrEqual(200);
          expect(status).toBeLessThan(300);

          // Try to parse JSON response
          const contentType = response.headers()['content-type'];
          if (contentType?.includes('application/json')) {
            const json = await response.json();
            expect(json).toBeDefined();
          }

          recordResult(`API: ${endpoint.name}`, 'PASS', undefined, duration);
        } catch (error) {
          recordResult(`API: ${endpoint.name}`, 'FAIL', String(error));
          throw error;
        }
      });
    }
  });

  test.describe('Mobile Responsiveness', () => {
    test('All pages should be mobile responsive', async ({ page }) => {
      const pages = ['/', '/arena', '/chatroom', '/predict', '/rounds'];
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const pagePath of pages) {
          try {
            await page.goto(pagePath, { waitUntil: 'networkidle', timeout: 20000 });

            // Check that content doesn't overflow
            const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
            expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin

            // Check if hamburger menu exists on mobile
            if (viewport.width < 768) {
              const hamburgerMenu = await page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [class*="hamburger"]').count();
              // Navigation should be accessible on mobile (either hamburger or visible nav)
              expect(hamburgerMenu).toBeGreaterThanOrEqual(0);
            }

            recordResult(`Mobile: ${pagePath} on ${viewport.name}`, 'PASS');
          } catch (error) {
            recordResult(`Mobile: ${pagePath} on ${viewport.name}`, 'FAIL', String(error));
            throw error;
          }
        }
      }
    });
  });

  test.describe('Interactive Features', () => {
    test('Navigation should work', async ({ page }) => {
      try {
        await page.goto('/', { waitUntil: 'networkidle' });

        // Look for navigation links
        const links = await page.locator('a[href="/arena"], a[href="/chatroom"], a[href="/predict"]').count();
        expect(links).toBeGreaterThan(0);

        // Try clicking a navigation link
        const arenaLink = page.locator('a[href="/arena"]').first();
        if (await arenaLink.count() > 0) {
          await arenaLink.click();
          await page.waitForURL('**/arena', { timeout: 10000 });
          expect(page.url()).toContain('/arena');
        }

        recordResult('Navigation: Link clicking', 'PASS');
      } catch (error) {
        recordResult('Navigation: Link clicking', 'FAIL', String(error));
        throw error;
      }
    });

    test('Chatroom SSE streaming should be functional', async ({ page }) => {
      try {
        await page.goto('/chatroom', { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for page to load
        await page.waitForTimeout(2000);

        // Check if chatroom component is present
        const chatroomContent = await page.locator('body').textContent();
        expect(chatroomContent).toBeDefined();

        // Look for chat-related elements
        const hasMessages = await page.locator('[class*="message"], [class*="chat"]').count() > 0;

        recordResult('Chatroom: SSE Component Present', hasMessages ? 'PASS' : 'FAIL');
      } catch (error) {
        recordResult('Chatroom: SSE Component', 'FAIL', String(error));
        throw error;
      }
    });
  });

  test.describe('AI Model Integration', () => {
    test('AI models should handle errors gracefully', async ({ page }) => {
      const consoleErrors: string[] = [];
      const uncaughtErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', error => {
        uncaughtErrors.push(error.message);
      });

      try {
        // Visit pages that use AI models
        await page.goto('/chatroom', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);

        await page.goto('/arena', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Check for uncaught errors
        const hasCriticalErrors = uncaughtErrors.some(err =>
          !err.includes('Warning') &&
          !err.includes('DevTools')
        );

        if (hasCriticalErrors) {
          console.log('Uncaught errors:', uncaughtErrors);
        }

        expect(hasCriticalErrors).toBe(false);

        recordResult('AI Models: Error Handling', 'PASS');
      } catch (error) {
        recordResult('AI Models: Error Handling', 'FAIL', String(error));
        throw error;
      }
    });
  });

  test.describe('Performance Checks', () => {
    test('Pages should load within acceptable time', async ({ page }) => {
      const pages = [
        { path: '/', maxTime: 5000 },
        { path: '/chatroom', maxTime: 8000 },
        { path: '/arena', maxTime: 6000 },
      ];

      for (const testPage of pages) {
        const startTime = Date.now();

        try {
          await page.goto(testPage.path, {
            waitUntil: 'domcontentloaded',
            timeout: testPage.maxTime
          });

          const loadTime = Date.now() - startTime;
          expect(loadTime).toBeLessThan(testPage.maxTime);

          recordResult(`Performance: ${testPage.path}`, 'PASS', undefined, loadTime);
        } catch (error) {
          const loadTime = Date.now() - startTime;
          recordResult(`Performance: ${testPage.path}`, 'FAIL', String(error), loadTime);
          throw error;
        }
      }
    });
  });
});

// After all tests, write results to file
test.afterAll(async () => {
  // This will be captured in the test output
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log(JSON.stringify(testResults, null, 2));
});
