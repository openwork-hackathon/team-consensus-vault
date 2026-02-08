const puppeteer = require('puppeteer');
const path = require('path');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const url = 'https://team-consensus-vault.vercel.app';
  const screenshotDir = path.join(__dirname, 'docs', 'screenshots');

  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for content to load
  await delay(3000);

  // Screenshot 1: Dashboard overview
  console.log('Capturing dashboard overview...');
  await page.screenshot({
    path: path.join(screenshotDir, '01-dashboard-overview.png'),
    fullPage: false
  });

  // Screenshot 2: Full page scroll to see more content
  console.log('Capturing full page view...');
  await page.screenshot({
    path: path.join(screenshotDir, '02-full-page.png'),
    fullPage: true
  });

  // Screenshot 3: Try to capture agent analysis section
  console.log('Capturing agent analysis section...');
  const agentSection = await page.$('.agent-card, [class*="agent"], [class*="analysis"]');
  if (agentSection) {
    await agentSection.screenshot({
      path: path.join(screenshotDir, '03-agent-analysis.png')
    });
  } else {
    // Scroll down a bit and capture
    await page.evaluate(() => window.scrollBy(0, 400));
    await delay(500);
    await page.screenshot({
      path: path.join(screenshotDir, '03-agent-analysis.png'),
      fullPage: false
    });
  }

  // Screenshot 4: Try to capture consensus gauge or wallet connection
  console.log('Capturing consensus/wallet section...');
  const consensusGauge = await page.$('[class*="consensus"], [class*="gauge"], [class*="wallet"]');
  if (consensusGauge) {
    await consensusGauge.screenshot({
      path: path.join(screenshotDir, '04-consensus-wallet.png')
    });
  } else {
    // Scroll to top and capture header area
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    await page.screenshot({
      path: path.join(screenshotDir, '04-header-wallet.png'),
      fullPage: false
    });
  }

  console.log('Screenshots captured successfully!');
  await browser.close();
}

captureScreenshots().catch(error => {
  console.error('Error capturing screenshots:', error);
  process.exit(1);
});
