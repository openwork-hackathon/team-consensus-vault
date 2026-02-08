#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function checkTradesState() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const state = await page.evaluate(() => {
      // Check for trading performance component
      const perfComponent = document.querySelector('.bg-card.rounded-xl');
      if (!perfComponent) return { error: 'TradingPerformance component not found' };

      // Get the full HTML of the component
      const componentHTML = perfComponent.innerHTML;

      // Check for various states
      const hasNoTradesMessage = componentHTML.includes('No trades yet');
      const hasLoadingState = componentHTML.includes('Loading') || perfComponent.querySelector('[role="status"]');
      const hasErrorState = componentHTML.includes('Failed to load');

      // Check for trade elements in both layouts
      const mobileTradeCards = perfComponent.querySelectorAll('.sm\\:hidden .bg-background\\/50');
      const tableRows = perfComponent.querySelectorAll('tbody tr');

      // Get computed styles for the containers
      const mobileContainer = perfComponent.querySelector('.sm\\:hidden.space-y-3');
      const tableContainer = perfComponent.querySelector('.hidden.sm\\:block');

      const mobileDisplay = mobileContainer ? window.getComputedStyle(mobileContainer).display : 'not found';
      const tableDisplay = tableContainer ? window.getComputedStyle(tableContainer).display : 'not found';

      return {
        hasNoTradesMessage,
        hasLoadingState,
        hasErrorState,
        mobileTradeCards: mobileTradeCards.length,
        tableRows: tableRows.length,
        mobileContainerDisplay: mobileDisplay,
        tableContainerDisplay: tableDisplay,
        componentText: perfComponent.textContent.substring(0, 500)
      };
    });

    console.log('Trading Component State:');
    console.log('='.repeat(70));
    console.log(`Has "No trades yet" message: ${state.hasNoTradesMessage}`);
    console.log(`Has loading state: ${state.hasLoadingState}`);
    console.log(`Has error state: ${state.hasErrorState}`);
    console.log(`Mobile trade cards found: ${state.mobileTradeCards}`);
    console.log(`Table rows found: ${state.tableRows}`);
    console.log(`Mobile container display: ${state.mobileContainerDisplay}`);
    console.log(`Table container display: ${state.tableContainerDisplay}`);
    console.log('');
    console.log('Component text (first 500 chars):');
    console.log(state.componentText);
    console.log('='.repeat(70));

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
    await browser.close();
  }
}

checkTradesState();
