#!/usr/bin/env node

/**
 * Manual Mobile Testing Script
 * Opens pages in browser for manual inspection
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const PAGES = [
  '/chatroom',
  '/human-chat', 
  '/enhanced-consensus',
  '/admin/moderation'
];

const BREAKPOINTS = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'mobile-414', width: 414, height: 896 },
];

async function manualTest() {
  console.log('🚀 Starting Manual Mobile Testing');
  console.log('Opening pages for manual inspection...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    for (const pageUrl of PAGES) {
      console.log(`📄 Testing: ${pageUrl}`);
      const page = await browser.newPage();
      
      // Test at desktop first
      await page.goto(`${BASE_URL}${pageUrl}`, { waitUntil: 'networkidle0' });
      console.log(`  Desktop: ${await page.url()}`);
      
      // Test mobile breakpoints
      for (const bp of BREAKPOINTS) {
        await page.setViewport({ width: bp.width, height: bp.height });
        console.log(`  ${bp.name}: ${bp.width}x${bp.height}`);
        
        // Take screenshot
        const screenshotDir = path.join(__dirname, 'manual-test-screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        const pageName = pageUrl.replace(/^\//, '').replace(/\//g, '-') || 'home';
        const filename = `${pageName}-${bp.name}-${bp.width}x${bp.height}.png`;
        const filepath = path.join(screenshotDir, filename);
        
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`    📸 Screenshot saved: ${filename}`);
        
        // Wait for manual inspection
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await page.close();
      console.log();
    }
    
    console.log('✅ Manual testing complete!');
    console.log('Check the screenshots in manual-test-screenshots/ directory.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

manualTest().catch(console.error);