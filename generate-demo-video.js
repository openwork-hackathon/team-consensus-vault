#!/usr/bin/env node
/**
 * Demo Video Generator for Consensus Vault
 * Uses Puppeteer to capture the live application and ffmpeg to create a video
 * 
 * Usage: node generate-demo-video.js
 * Output: demo-generated.mp4
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAMES_DIR = path.join(__dirname, 'demo-frames');
const OUTPUT_VIDEO = path.join(__dirname, 'demo-generated.mp4');
const URL = 'https://team-consensus-vault.vercel.app';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureFrame(page, filename) {
  const filepath = path.join(FRAMES_DIR, filename);
  await page.screenshot({
    path: filepath,
    type: 'jpeg',
    quality: 90
  });
  return filepath;
}

async function generateVideo() {
  console.log('=====================================');
  console.log('Consensus Vault Demo Video Generator');
  console.log('=====================================');
  console.log('');

  // Check if ffmpeg is available
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
  } catch (e) {
    console.error('Error: ffmpeg is not installed');
    console.error('Install with: sudo apt-get install ffmpeg');
    process.exit(1);
  }

  // Clean up and prepare frames directory
  console.log('Preparing output directory...');
  if (fs.existsSync(FRAMES_DIR)) {
    fs.rmSync(FRAMES_DIR, { recursive: true });
  }
  await ensureDirectory(FRAMES_DIR);

  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  });

  const page = await browser.newPage();
  
  // Set viewport to 1080p
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Enable video recording via CDP
  const client = await page.target().createCDPSession();
  
  let frameCount = 0;
  
  try {
    console.log(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for initial load
    await delay(3000);
    
    // Scene 1: Landing page overview (5 seconds = 150 frames at 30fps)
    console.log('Scene 1: Landing page overview...');
    for (let i = 0; i < 150; i++) {
      await captureFrame(page, `frame_${String(frameCount++).padStart(5, '0')}.jpg`);
      await delay(33); // ~30fps
    }
    
    // Scene 2: Scroll down to show features (3 seconds = 90 frames)
    console.log('Scene 2: Scrolling to features...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await delay(500);
    
    for (let i = 0; i < 90; i++) {
      await captureFrame(page, `frame_${String(frameCount++).padStart(5, '0')}.jpg`);
      await delay(33);
    }
    
    // Scene 3: Scroll back to top (2 seconds = 60 frames)
    console.log('Scene 3: Returning to top...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    
    for (let i = 0; i < 60; i++) {
      await captureFrame(page, `frame_${String(frameCount++).padStart(5, '0')}.jpg`);
      await delay(33);
    }
    
    // Scene 4: Highlight wallet connect area (3 seconds = 90 frames)
    console.log('Scene 4: Wallet connection area...');
    for (let i = 0; i < 90; i++) {
      await captureFrame(page, `frame_${String(frameCount++).padStart(5, '0')}.jpg`);
      await delay(33);
    }
    
    // Scene 5: Show proposals section (4 seconds = 120 frames)
    console.log('Scene 5: Proposals section...');
    await page.evaluate(() => {
      const proposals = document.querySelector('[class*="proposal"], [class*="governance"]');
      if (proposals) proposals.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    
    for (let i = 0; i < 120; i++) {
      await captureFrame(page, `frame_${String(frameCount++).padStart(5, '0')}.jpg`);
      await delay(33);
    }
    
    // Scene 6: Final overview (3 seconds = 90 frames)
    console.log('Scene 6: Final overview...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    
    for (let i = 0; i < 90; i++) {
      await captureFrame(page, `frame_${String(frameCount++).padStart(5, '0')}.jpg`);
      await delay(33);
    }
    
    console.log(`\nCaptured ${frameCount} frames`);
    
  } catch (error) {
    console.error('Error during capture:', error);
    await browser.close();
    process.exit(1);
  }
  
  await browser.close();
  
  // Compile video with ffmpeg
  console.log('\nCompiling video with ffmpeg...');
  console.log('This may take a few minutes...');
  
  try {
    const ffmpegCmd = `ffmpeg -y -framerate 30 -i ${path.join(FRAMES_DIR, 'frame_%05d.jpg')} -c:v libx264 -pix_fmt yuv420p -preset slow -crf 22 -movflags +faststart "${OUTPUT_VIDEO}"`;
    
    execSync(ffmpegCmd, { stdio: 'inherit' });
    
    // Clean up frames
    console.log('\nCleaning up temporary files...');
    fs.rmSync(FRAMES_DIR, { recursive: true });
    
    // Get video stats
    const stats = fs.statSync(OUTPUT_VIDEO);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n=====================================');
    console.log('Demo video generated successfully!');
    console.log('=====================================');
    console.log(`Output: ${OUTPUT_VIDEO}`);
    console.log(`Size: ${sizeMB} MB`);
    console.log(`Duration: ~20 seconds`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the video: mpv demo-generated.mp4');
    console.log('2. Upload to YouTube or Loom');
    console.log('3. Document the URL in DEMO_VIDEO_URL.txt');
    console.log('');
    
  } catch (error) {
    console.error('Error compiling video:', error);
    console.error('Frames preserved in:', FRAMES_DIR);
    process.exit(1);
  }
}

generateVideo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
