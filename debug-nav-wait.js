/**
 * Debug Navigation Component with longer wait
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();

  // Log console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`📟 Console [${msg.type()}]: ${msg.text()}`);
    }
  });

  try {
    console.log('🔍 Debugging Navigation Component...\n');
    
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    console.log('⏳ Waiting for page to fully render (10 seconds)...');
    await page.waitForTimeout(10000);

    // Check if header exists now
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      return {
        exists: !!header,
        className: header?.className,
        innerHTML: header?.innerHTML.substring(0, 800)
      };
    });

    console.log('\n📋 Header Info after 10s:');
    console.log(JSON.stringify(headerInfo, null, 2));

    if (!headerInfo.exists) {
      console.log('\n❌ Header still not found. Checking for React root...');
      const rootInfo = await page.evaluate(() => {
        const root = document.querySelector('#__next');
        return {
          exists: !!root,
          innerHTML: root?.innerHTML.substring(0, 1000)
        };
      });
      console.log(JSON.stringify(rootInfo, null, 2));
    }

    // Get all buttons
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(btn => ({
        ariaLabel: btn.getAttribute('aria-label'),
        className: btn.className,
        innerHTML: btn.innerHTML.substring(0, 100)
      }));
    });

    console.log('\n📋 All Buttons on Page:');
    if (buttons.length === 0) {
      console.log('   No buttons found!');
    } else {
      buttons.forEach((btn, i) => {
        console.log(`\n${i + 1}. aria-label: "${btn.ariaLabel}"`);
        console.log(`   className: "${btn.className}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
