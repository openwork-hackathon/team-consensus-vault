#!/usr/bin/env node
/**
 * Enhanced Demo Video Generator for Consensus Vault
 * Creates a 3+ minute demo by capturing the real app with AI responses
 *
 * Usage: node demo/generate-demo.js
 * Output: demo/demo-automated.mp4
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAMES_DIR = path.join(__dirname, 'frames');
const OUTPUT_VIDEO = path.join(__dirname, 'demo-automated.mp4');
const URL = 'https://team-consensus-vault.vercel.app';
const FPS = 30;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

let frameCount = 0;

async function captureFrame(page, label = '') {
  const filepath = path.join(FRAMES_DIR, `frame_${String(frameCount++).padStart(6, '0')}.jpg`);
  await page.screenshot({
    path: filepath,
    type: 'jpeg',
    quality: 95
  });
  if (label && frameCount % 30 === 0) {
    console.log(`  [${Math.floor(frameCount / FPS)}s] ${label}`);
  }
  return filepath;
}

async function captureSeconds(page, seconds, label) {
  const frames = seconds * FPS;
  for (let i = 0; i < frames; i++) {
    await captureFrame(page, label);
    await delay(1000 / FPS);
  }
}

async function generateVideo() {
  console.log('================================================');
  console.log('Consensus Vault Demo Video Generator');
  console.log('================================================');
  console.log('');
  console.log('Target duration: ~3 minutes');
  console.log(`Output: ${OUTPUT_VIDEO}`);
  console.log('');

  // Check ffmpeg
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
  } catch {
    console.error('Error: ffmpeg is not installed');
    process.exit(1);
  }

  await ensureDirectory(FRAMES_DIR);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // =========================================
    // SCENE 1: Introduction - Landing Page
    // =========================================
    console.log('\nScene 1: Landing page (8s)');
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(2000); // Let animations finish
    await captureSeconds(page, 8, 'intro');

    // =========================================
    // SCENE 2: Show Analyst Cards
    // =========================================
    console.log('\nScene 2: AI Analyst Council (10s)');
    // Scroll to make sure analyst cards are visible
    await page.evaluate(() => {
      const cards = document.querySelector('[class*="grid"]');
      if (cards) cards.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await captureSeconds(page, 10, 'analysts');

    // =========================================
    // SCENE 3: Scroll to show all analysts
    // =========================================
    console.log('\nScene 3: Scrolling view (8s)');
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, 150));
      await delay(300);
      await captureSeconds(page, 2, 'scrolling');
    }

    // =========================================
    // SCENE 4: Show Consensus Meter
    // =========================================
    console.log('\nScene 4: Consensus display (12s)');
    await page.evaluate(() => {
      const consensus = document.querySelector('[class*="Consensus"]');
      if (consensus) consensus.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await captureSeconds(page, 12, 'consensus');

    // =========================================
    // SCENE 5: Show Full Page Overview
    // =========================================
    console.log('\nScene 5: Full page tour (15s)');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    await captureSeconds(page, 5, 'top');

    // Slow scroll through entire page
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 100));
      await delay(200);
      await captureSeconds(page, 1, 'scrolling');
    }

    // =========================================
    // SCENE 6: Trading / Paper Trading Section
    // =========================================
    console.log('\nScene 6: Trading section (10s)');
    await page.evaluate(() => {
      // Scroll to bottom sections
      window.scrollTo(0, document.body.scrollHeight * 0.7);
    });
    await delay(500);
    await captureSeconds(page, 10, 'trading');

    // =========================================
    // SCENE 7: Bottom of page / Stats
    // =========================================
    console.log('\nScene 7: Statistics section (8s)');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await delay(500);
    await captureSeconds(page, 8, 'stats');

    // =========================================
    // SCENE 8: Back to Top - Final View
    // =========================================
    console.log('\nScene 8: Final view (10s)');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    await captureSeconds(page, 10, 'outro');

    // =========================================
    // SCENE 9: Show Analyst Cards Again (reinforcement)
    // =========================================
    console.log('\nScene 9: Analysts showcase (12s)');
    await page.evaluate(() => {
      const cards = document.querySelector('[class*="grid"]');
      if (cards) cards.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(500);
    await captureSeconds(page, 12, 'analysts again');

    // =========================================
    // SCENE 10: Final scroll and pause
    // =========================================
    console.log('\nScene 10: Closing (8s)');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    await captureSeconds(page, 8, 'closing');

    const totalSeconds = Math.floor(frameCount / FPS);
    console.log(`\nTotal frames captured: ${frameCount}`);
    console.log(`Duration: ${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`);

  } catch (error) {
    console.error('Error during capture:', error);
    await browser.close();
    process.exit(1);
  }

  await browser.close();

  // =========================================
  // Compile Video with ffmpeg
  // =========================================
  console.log('\nCompiling video with ffmpeg...');
  console.log('This may take a few minutes...');

  try {
    // Generate video from frames (single pass, no concatenation issues)
    const ffmpegCmd = `ffmpeg -y -framerate ${FPS} -i "${path.join(FRAMES_DIR, 'frame_%06d.jpg')}" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 20 -movflags +faststart "${OUTPUT_VIDEO}"`;
    execSync(ffmpegCmd, { stdio: 'inherit' });

    // Clean up frames
    console.log('\nCleaning up...');
    fs.rmSync(FRAMES_DIR, { recursive: true });

    // Get final stats
    const stats = fs.statSync(OUTPUT_VIDEO);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Get duration
    const durationOutput = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT_VIDEO}"`).toString().trim();
    const duration = parseFloat(durationOutput);

    console.log('\n================================================');
    console.log('Demo video generated successfully!');
    console.log('================================================');
    console.log(`Output: ${OUTPUT_VIDEO}`);
    console.log(`Size: ${sizeMB} MB`);
    console.log(`Duration: ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`);
    console.log('');
    console.log('NOTE: This is a silent screen recording.');
    console.log('For hackathon submission, you need to either:');
    console.log('  1. Add voiceover narration using a video editor');
    console.log('  2. Record a new video with OBS including audio');
    console.log('');
    console.log('Next steps:');
    console.log(`  1. Review video: mpv ${OUTPUT_VIDEO}`);
    console.log('  2. Add audio narration or record with OBS');
    console.log('  3. Upload to YouTube');
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
