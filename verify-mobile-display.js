#!/usr/bin/env node

/**
 * Verify that mobile card layout is displayed instead of table on iPhone SE
 */

const puppeteer = require('puppeteer');

const VIEWPORT = {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
};

const URL = 'http://localhost:3000';

async function verifyMobileDisplay() {
  console.log('Verifying mobile display at 375px viewport...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  try {
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check which layout is displayed
    const displayInfo = await page.evaluate(() => {
      // Check for mobile card layout
      const mobileCards = document.querySelector('.sm\\:hidden.space-y-3');
      const mobileCardsVisible = mobileCards && window.getComputedStyle(mobileCards).display !== 'none';

      // Check for desktop table layout
      const desktopTable = document.querySelector('.hidden.sm\\:block.overflow-x-auto');
      const desktopTableVisible = desktopTable && window.getComputedStyle(desktopTable).display !== 'none';

      // Get table element if it exists
      const table = document.querySelector('table');
      const tableDisplay = table ? window.getComputedStyle(table).display : 'none';
      const tableWidth = table ? table.offsetWidth : 0;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const bodyWidth = document.body.scrollWidth;

      return {
        mobileCardsVisible,
        desktopTableVisible,
        tableDisplay,
        tableWidth,
        viewportWidth,
        bodyWidth,
        hasHorizontalScroll: bodyWidth > viewportWidth
      };
    });

    console.log('Display Analysis:');
    console.log('='.repeat(50));
    console.log(`Viewport Width: ${displayInfo.viewportWidth}px`);
    console.log(`Body Width: ${displayInfo.bodyWidth}px`);
    console.log(`Horizontal Scroll: ${displayInfo.hasHorizontalScroll ? 'YES (BAD)' : 'NO (GOOD)'}`);
    console.log('');
    console.log('Layout Visibility:');
    console.log(`  Mobile Cards (should be VISIBLE): ${displayInfo.mobileCardsVisible ? '✓ VISIBLE' : '✗ HIDDEN'}`);
    console.log(`  Desktop Table (should be HIDDEN): ${displayInfo.desktopTableVisible ? '✗ VISIBLE' : '✓ HIDDEN'}`);
    console.log('');

    if (displayInfo.desktopTableVisible) {
      console.log(`⚠️  WARNING: Desktop table is visible on mobile!`);
      console.log(`   Table display: ${displayInfo.tableDisplay}`);
      console.log(`   Table width: ${displayInfo.tableWidth}px`);
    }

    console.log('='.repeat(50));

    if (displayInfo.mobileCardsVisible && !displayInfo.desktopTableVisible && !displayInfo.hasHorizontalScroll) {
      console.log('✓ PASS: Mobile layout is correctly displayed');
      await browser.close();
      return 0;
    } else {
      console.log('✗ FAIL: Mobile layout has issues');
      await browser.close();
      return 1;
    }

  } catch (error) {
    console.error('Error:', error.message);
    await browser.close();
    return 1;
  }
}

verifyMobileDisplay()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
