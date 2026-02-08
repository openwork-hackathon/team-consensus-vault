const fs = require('fs');
const { default: lighthouse } = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';

async function runLighthouse() {
  const url = 'https://team-consensus-vault.vercel.app';
  const output = 'html';
  const outputDir = './lighthouse-reports';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`🚀 Starting Lighthouse audit for ${url}...`);
  
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const options = {
    logLevel: 'info',
    output,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    skipAudits: ['content-width', 'color-contrast'],
  };

  try {
    const runnerResult = await lighthouse(url, options);
    
    // Get the report HTML
    const reportHtml = runnerResult.report;
    
    // Save the report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `${outputDir}/lighthouse-report-${timestamp}.html`;
    fs.writeFileSync(reportPath, reportHtml);
    
    // Extract and save scores
    const scores = {
      performance: runnerResult.lhr.categories.performance.score * 100,
      accessibility: runnerResult.lhr.categories.accessibility.score * 100,
      bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
      seo: runnerResult.lhr.categories.seo.score * 100,
      timestamp: new Date().toISOString(),
    };
    
    const scoresPath = `${outputDir}/lighthouse-scores-${timestamp}.json`;
    fs.writeFileSync(scoresPath, JSON.stringify(scores, null, 2));
    
    console.log('\n📊 Lighthouse Scores:');
    console.log(`   Performance:    ${scores.performance.toFixed(0)}/100`);
    console.log(`   Accessibility:  ${scores.accessibility.toFixed(0)}/100`);
    console.log(`   Best Practices: ${scores.bestPractices.toFixed(0)}/100`);
    console.log(`   SEO:            ${scores.seo.toFixed(0)}/100`);
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log(`📊 Scores saved to: ${scoresPath}`);
    
    // Extract key metrics
    const audits = runnerResult.lhr.audits;
    console.log('\n🔍 Key Performance Metrics:');
    if (audits['largest-contentful-paint']) {
      console.log(`   LCP: ${audits['largest-contentful-paint'].displayValue}`);
    }
    if (audits['total-blocking-time']) {
      console.log(`   TBT: ${audits['total-blocking-time'].displayValue}`);
    }
    if (audits['cumulative-layout-shift']) {
      console.log(`   CLS: ${audits['cumulative-layout-shift'].displayValue}`);
    }
    if (audits['speed-index']) {
      console.log(`   SI: ${audits['speed-index'].displayValue}`);
    }
    
    await chrome.kill();
    return scores;
  } catch (error) {
    console.error('❌ Error running Lighthouse:', error);
    await chrome.kill();
    throw error;
  }
}

runLighthouse().catch(console.error);
