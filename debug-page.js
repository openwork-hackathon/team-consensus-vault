/**
 * Debug Page Load
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log console messages
  page.on('console', msg => {
    console.log(`📟 Console [${msg.type()}]: ${msg.text()}`);
  });

  // Log errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    console.log('🌐 Loading page...\n');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait a bit more
    await page.waitForTimeout(3000);

    // Get page title
    const title = await page.title();
    console.log(`\n📄 Page Title: "${title}"`);

    // Get body content
    const bodyHTML = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 1000);
    });
    console.log(`\n📄 Body HTML (first 1000 chars):\n${bodyHTML}`);

    // Check for any loading states
    const isLoading = await page.evaluate(() => {
      return document.querySelector('[role="status"]') !== null;
    });
    console.log(`\n⏳ Is Loading: ${isLoading}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
