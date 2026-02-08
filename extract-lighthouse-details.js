const fs = require('fs');
const { default: lighthouse } = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function extractLighthouseDetails() {
  const url = 'https://team-consensus-vault.vercel.app';
  
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options);
    const lhr = runnerResult.lhr;
    
    const details = {
      timestamp: new Date().toISOString(),
      scores: {
        performance: lhr.categories.performance.score * 100,
        accessibility: lhr.categories.accessibility.score * 100,
        bestPractices: lhr.categories['best-practices'].score * 100,
        seo: lhr.categories.seo.score * 100,
      },
      metrics: {},
      opportunities: [],
      diagnostics: [],
      passedAudits: [],
      failedAudits: [],
    };

    // Extract key metrics
    const metricAudits = [
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
      'first-contentful-paint',
      'time-to-interactive',
      'max-potential-fid',
    ];

    metricAudits.forEach(id => {
      if (lhr.audits[id]) {
        details.metrics[id] = {
          score: lhr.audits[id].score,
          displayValue: lhr.audits[id].displayValue,
          numericValue: lhr.audits[id].numericValue,
        };
      }
    });

    // Extract opportunities (performance improvements)
    Object.values(lhr.audits).forEach(audit => {
      if (audit.scoreDisplayMode === 'numeric' && audit.score < 1) {
        const item = {
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
        };
        
        if (audit.details && audit.details.type === 'opportunity') {
          details.opportunities.push(item);
        } else if (audit.details && audit.details.type === 'debugdata') {
          details.diagnostics.push(item);
        }
        
        details.failedAudits.push(item);
      } else if (audit.scoreDisplayMode === 'binary' && audit.score === 1) {
        details.passedAudits.push({
          id: audit.id,
          title: audit.title,
        });
      }
    });

    // Save detailed report
    fs.writeFileSync(
      './lighthouse-reports/detailed-analysis.json',
      JSON.stringify(details, null, 2)
    );

    console.log('\n📊 BASELINE LIGHTHOUSE SCORES:');
    console.log('═'.repeat(50));
    console.log(`Performance:     ${details.scores.performance.toFixed(0)}/100 ⚠️`);
    console.log(`Accessibility:   ${details.scores.accessibility.toFixed(0)}/100 ✅`);
    console.log(`Best Practices:  ${details.scores.bestPractices.toFixed(0)}/100 ✅`);
    console.log(`SEO:             ${details.scores.seo.toFixed(0)}/100 ✅`);
    
    console.log('\n🔍 KEY METRICS:');
    console.log('─'.repeat(50));
    Object.entries(details.metrics).forEach(([key, value]) => {
      console.log(`   ${key}: ${value.displayValue} (score: ${value.score})`);
    });

    console.log('\n⚠️ TOP OPPORTUNITIES (Performance):');
    console.log('─'.repeat(50));
    details.opportunities.slice(0, 10).forEach((opp, i) => {
      console.log(`   ${i + 1}. ${opp.title}`);
      console.log(`      Score: ${opp.score}, Impact: ${opp.displayValue || 'N/A'}`);
    });

    console.log('\n🔧 DIAGNOSTICS:');
    console.log('─'.repeat(50));
    details.diagnostics.slice(0, 10).forEach((diag, i) => {
      console.log(`   ${i + 1}. ${diag.title}`);
      console.log(`      Score: ${diag.score}`);
    });

    console.log('\n✅ PASSED AUDITS COUNT: ' + details.passedAudits.length);
    console.log('❌ FAILED AUDITS COUNT: ' + details.failedAudits.length);
    
    await chrome.kill();
    return details;
  } catch (error) {
    console.error('Error:', error);
    await chrome.kill();
    throw error;
  }
}

extractLighthouseDetails().catch(console.error);
