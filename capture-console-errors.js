const puppeteer = require('puppeteer');

async function captureConsoleErrors() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const entry = { type, text, timestamp: new Date().toISOString() };
    
    if (type === 'error') {
      errors.push(entry);
      console.log('ERROR:', text);
    } else if (type === 'warning' || text.toLowerCase().includes('walletconnect') || text.toLowerCase().includes('404')) {
      warnings.push(entry);
      console.log('WARNING:', text);
    }
  });
  
  page.on('pageerror', err => {
    const entry = { type: 'pageerror', text: err.message, timestamp: new Date().toISOString() };
    errors.push(entry);
    console.log('PAGE ERROR:', err.message);
  });
  
  page.on('requestfailed', request => {
    const entry = { 
      type: 'requestfailed', 
      text: `${request.method()} ${request.url()} - ${request.failure().errorText}`,
      timestamp: new Date().toISOString()
    };
    errors.push(entry);
    console.log('REQUEST FAILED:', request.method(), request.url(), request.failure().errorText);
  });
  
  // Navigate to the app
  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 60000 });
  
  // Wait for a bit to capture async errors
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Also check the /arena page
  console.log('Navigating to /arena...');
  await page.goto('http://localhost:3001/arena', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await browser.close();
  
  console.log('\n=== SUMMARY ===');
  console.log('Total Errors:', errors.length);
  console.log('Total Warnings:', warnings.length);
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('/tmp/console-errors.json', JSON.stringify({ errors, warnings }, null, 2));
  console.log('Results saved to /tmp/console-errors.json');
  
  return { errors, warnings };
}

captureConsoleErrors().catch(console.error);
