#!/usr/bin/env node

/**
 * Inspect what content is actually displayed on mobile
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const VIEWPORT = {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
};

const URL = 'http://localhost:3000';
const OUTPUT_DIR = '/home/shazbot/team-consensus-vault/iphone-se-test-results';

async function inspectMobileContent() {
  console.log('Inspecting mobile content at 375px viewport...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  try {
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get detailed content analysis
    const contentInfo = await page.evaluate(() => {
      // Find the TradingPerformance component
      const tradingSection = document.querySelector('.bg-card.rounded-xl');

      if (!tradingSection) {
        return { error: 'Trading section not found' };
      }

      // Check for "No trades yet" message
      const noTradesMessage = tradingSection.textContent.includes('No trades yet');

      // Check for mobile cards
      const mobileCardsContainer = Array.from(document.querySelectorAll('.space-y-3')).find(el => {
        return Array.from(el.classList).some(c => c.includes('sm:hidden') || c.includes('sm\\:hidden'));
      });

      // Check for table
      const tableContainer = document.querySelector('.overflow-x-auto');
      const table = document.querySelector('table');

      // Check all text elements
      const allText = [];
      document.querySelectorAll('p, h1, h2, h3, div, span').forEach(el => {
        const text = el.textContent.trim();
        if (text.length > 0 && text.length < 200) {
          const styles = window.getComputedStyle(el);
          const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
          if (isVisible && el.offsetHeight > 0) {
            allText.push({
              tag: el.tagName.toLowerCase(),
              text: text.substring(0, 80),
              fontSize: parseInt(styles.fontSize)
            });
          }
        }
      });

      // Get main container padding
      const main = document.querySelector('main');
      const mainStyles = main ? window.getComputedStyle(main) : null;
      const mainPadding = mainStyles ? {
        left: parseInt(mainStyles.paddingLeft),
        right: parseInt(mainStyles.paddingRight)
      } : null;

      return {
        noTradesMessage,
        mobileCardsContainer: mobileCardsContainer ? 'found' : 'not found',
        tableContainer: tableContainer ? 'found' : 'not found',
        table: table ? 'found' : 'not found',
        mainPadding,
        textSamples: allText.slice(0, 20),
        totalVisibleText: allText.length
      };
    });

    console.log('Content Analysis:');
    console.log('='.repeat(70));
    console.log(`No Trades Message: ${contentInfo.noTradesMessage ? 'YES' : 'NO'}`);
    console.log(`Mobile Cards Container: ${contentInfo.mobileCardsContainer}`);
    console.log(`Table Container: ${contentInfo.tableContainer}`);
    console.log(`Table Element: ${contentInfo.table}`);
    console.log(`Main Padding: ${JSON.stringify(contentInfo.mainPadding)}`);
    console.log('');
    console.log('Visible Text Samples (with font sizes):');
    console.log('-'.repeat(70));
    contentInfo.textSamples.forEach((item, i) => {
      const sizeWarning = item.fontSize < 16 ? ' ⚠️' : '';
      console.log(`${i + 1}. [${item.fontSize}px${sizeWarning}] ${item.tag}: "${item.text}"`);
    });
    console.log(`\nTotal visible text elements: ${contentInfo.totalVisibleText}`);
    console.log('='.repeat(70));

    // Take a screenshot
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'mobile-inspection.png'),
      fullPage: true
    });
    console.log(`\nScreenshot saved to: ${path.join(OUTPUT_DIR, 'mobile-inspection.png')}`);

    await browser.close();
    return 0;

  } catch (error) {
    console.error('Error:', error.message);
    await browser.close();
    return 1;
  }
}

inspectMobileContent()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
