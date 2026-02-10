/**
 * Debug Navigation Component
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();

  try {
    console.log('🔍 Debugging Navigation Component...\n');
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get all buttons
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(btn => ({
        ariaLabel: btn.getAttribute('aria-label'),
        className: btn.className,
        innerHTML: btn.innerHTML.substring(0, 100)
      }));
    });

    console.log('📋 All Buttons on Page:');
    buttons.forEach((btn, i) => {
      console.log(`\n${i + 1}. aria-label: "${btn.ariaLabel}"`);
      console.log(`   className: "${btn.className}"`);
      console.log(`   innerHTML: ${btn.innerHTML}`);
    });

    // Check header
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      return {
        exists: !!header,
        className: header?.className,
        innerHTML: header?.innerHTML.substring(0, 500)
      };
    });

    console.log('\n📋 Header Info:');
    console.log(JSON.stringify(headerInfo, null, 2));

    // Check for mobile menu button specifically
    const mobileMenuButton = await page.evaluate(() => {
      // Try different selectors
      const selectors = [
        'button[aria-label="Open menu"]',
        'button[aria-label="Close menu"]',
        'button.md\\:hidden',
        'button[aria-controls="mobile-navigation"]'
      ];
      
      const results = {};
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        results[sel] = {
          exists: !!el,
          visible: el ? window.getComputedStyle(el).display !== 'none' : false
        };
      });
      
      return results;
    });

    console.log('\n📋 Mobile Menu Button Search:');
    console.log(JSON.stringify(mobileMenuButton, null, 2));

    // Check viewport size
    const viewportInfo = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        userAgent: navigator.userAgent
      };
    });

    console.log('\n📋 Viewport Info:');
    console.log(JSON.stringify(viewportInfo, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
