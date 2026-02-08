#!/usr/bin/env node
/**
 * Simple viewport screenshot test
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const TEST_URL = 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, 'cvault-47-test-results');

const viewports = [
  { name: '375px-iphone-se', width: 375, height: 667 },
  { name: '768px-tablet', width: 768, height: 1024 },
  { name: '1920px-desktop', width: 1920, height: 1080 }
];

async function captureViewports() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    for (const vp of viewports) {
      console.log(`Capturing ${vp.name}...`);

      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2
      });

      await page.goto(TEST_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      // Wait a bit for content to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take screenshot
      const screenshotPath = path.join(OUTPUT_DIR, `${vp.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      console.log(`  ✓ Saved: ${vp.name}.png`);

      // Check for overflow
      const overflow = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return {
          viewportWidth: window.innerWidth,
          scrollWidth: Math.max(body.scrollWidth, html.scrollWidth),
          hasOverflow: Math.max(body.scrollWidth, html.scrollWidth) > window.innerWidth
        };
      });

      console.log(`  Viewport: ${overflow.viewportWidth}px, Content: ${overflow.scrollWidth}px, Overflow: ${overflow.hasOverflow ? 'YES' : 'NO'}`);
    }

    console.log('\n✅ All viewports captured!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureViewports();
