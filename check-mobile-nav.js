#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function checkMobileNav() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Test at mobile width
  await page.setViewport({ width: 375, height: 667 });
  
  console.log('Testing navigation at 375px width...');
  
  // Navigate to home page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Wait a bit for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check for hamburger menu button
  const hamburgerButton = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const hamburger = buttons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const text = btn.textContent || '';
      const svg = btn.querySelector('svg');
      return ariaLabel.toLowerCase().includes('menu') || 
             text.toLowerCase().includes('menu') ||
             (svg && (ariaLabel.includes('Open menu') || ariaLabel.includes('Close menu')));
    });
    return hamburger ? {
      exists: true,
      ariaLabel: hamburger.getAttribute('aria-label'),
      text: hamburger.textContent,
      isVisible: hamburger.offsetWidth > 0 && hamburger.offsetHeight > 0
    } : { exists: false };
  });
  
  console.log('Hamburger button check:', hamburgerButton);
  
  // Check for mobile navigation menu
  const mobileNav = await page.evaluate(() => {
    const nav = document.querySelector('#mobile-navigation');
    return nav ? {
      exists: true,
      isVisible: nav.offsetWidth > 0 && nav.offsetHeight > 0,
      className: nav.className,
      children: nav.children.length
    } : { exists: false };
  });
  
  console.log('Mobile navigation check:', mobileNav);
  
  // Check if hamburger button is visible (should be visible on mobile)
  const isHamburgerVisible = await page.evaluate(() => {
    const button = document.querySelector('button[aria-controls="mobile-navigation"]');
    if (!button) return false;
    const style = window.getComputedStyle(button);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           button.offsetWidth > 0 && 
           button.offsetHeight > 0;
  });
  
  console.log('Hamburger button visible:', isHamburgerVisible);
  
  // Check if desktop nav is hidden on mobile
  const desktopNavHidden = await page.evaluate(() => {
    const desktopNav = document.querySelector('nav[aria-label="Main navigation"]');
    if (!desktopNav) return true;
    const style = window.getComputedStyle(desktopNav);
    return style.display === 'none';
  });
  
  console.log('Desktop nav hidden on mobile:', desktopNavHidden);
  
  await browser.close();
}

checkMobileNav().catch(console.error);