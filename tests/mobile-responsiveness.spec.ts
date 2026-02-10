/**
 * Mobile Responsiveness Test Suite for Remaining 4 Pages
 * Tests: /chatroom, /human-chat, /enhanced-consensus, /admin/moderation
 *
 * This test suite validates mobile responsiveness across standard mobile breakpoints
 * Covers: layout overflow, touch targets, text readability, navigation usability
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const PAGES_TO_TEST = [
  { path: '/chatroom', name: 'AI Debate Arena', hasStreaming: true },
  { path: '/human-chat', name: 'Human Chat Interface', hasStreaming: false },
  { path: '/enhanced-consensus', name: 'Enhanced Consensus Display', hasStreaming: false },
  { path: '/admin/moderation', name: 'Admin Moderation Panel', hasAdmin: true },
];

const MOBILE_BREAKPOINTS = [
  { name: 'mobile-320', width: 320, height: 568, label: 'iPhone SE' },
  { name: 'mobile-375', width: 375, height: 667, label: 'iPhone 8' },
  { name: 'mobile-414', width: 414, height: 896, label: 'iPhone 14 Pro Max' },
  { name: 'tablet-768', width: 768, height: 1024, label: 'iPad Portrait' },
];

// Test results storage
interface TestIssue {
  severity: 'critical' | 'major' | 'minor';
  type: string;
  description: string;
  component: string;
  details?: any;
}

interface TestResults {
  [pagePath: string]: {
    [breakpoint: string]: {
      issues: TestIssue[];
      screenshot: string | null;
      timestamp: string;
    };
  };
}

const testResults: TestResults = {};

/**
 * Check for horizontal scrolling
 */
async function checkHorizontalScroll(page: Page): Promise<TestIssue | null> {
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  if (hasHorizontalScroll) {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    return {
      severity: 'critical',
      type: 'horizontal_scroll',
      description: 'Page has horizontal scrolling',
      component: 'Page Layout',
      details: { scrollWidth, clientWidth, overflow: scrollWidth - clientWidth },
    };
  }

  return null;
}

/**
 * Check for touch target sizes (minimum 44x44px)
 */
async function checkTouchTargets(page: Page, viewportWidth: number): Promise<TestIssue | null> {
  if (viewportWidth > 768) return null;

  const smallButtons = await page.evaluate(() => {
    const MIN_SIZE = 44;
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], a[href]'));

    return buttons
      .filter((btn) => {
        const rect = btn.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        return isVisible && (rect.width < MIN_SIZE || rect.height < MIN_SIZE);
      })
      .map((btn) => {
        const rect = btn.getBoundingClientRect();
        return {
          text: (btn.textContent?.trim().substring(0, 50) || btn.getAttribute('aria-label') || 'Unknown'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          tag: btn.tagName,
        };
      });
  });

  if (smallButtons.length > 0) {
    return {
      severity: 'major',
      type: 'small_touch_targets',
      description: `${smallButtons.length} interactive elements below 44px touch target minimum`,
      component: 'Interactive Elements',
      details: smallButtons.slice(0, 5),
    };
  }

  return null;
}

/**
 * Check for text readability (minimum 14px font size)
 */
async function checkTextReadability(page: Page, viewportWidth: number): Promise<TestIssue | null> {
  if (viewportWidth > 768) return null;

  const smallTextElements = await page.evaluate(() => {
    const MIN_FONT_SIZE = 14;
    const elements = Array.from(document.querySelectorAll('p, span, div, li, td, th, label'));

    return elements
      .filter((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const isVisible = (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0;
        const hasText = el.textContent && el.textContent.trim().length > 0;
        return isVisible && hasText && fontSize < MIN_FONT_SIZE;
      })
      .map((el) => ({
        text: el.textContent?.trim().substring(0, 50) || '',
        fontSize: parseFloat(window.getComputedStyle(el).fontSize),
        tag: el.tagName,
      }));
  });

  if (smallTextElements.length > 0) {
    return {
      severity: 'major',
      type: 'small_text',
      description: `${smallTextElements.length} text elements below 14px minimum for mobile`,
      component: 'Typography',
      details: smallTextElements.slice(0, 5),
    };
  }

  return null;
}

/**
 * Check for mobile navigation (hamburger menu)
 */
async function checkMobileNavigation(page: Page, viewportWidth: number): Promise<TestIssue | null> {
  if (viewportWidth > 768) return null;

  const hasMobileNav = await page.evaluate(() => {
    // Look for hamburger menu button
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    return buttons.some((btn) => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const text = btn.textContent || '';
      const classes = btn.className || '';

      return (
        ariaLabel.toLowerCase().includes('menu') ||
        text.toLowerCase().includes('menu') ||
        classes.toLowerCase().includes('menu') ||
        btn.querySelector('svg') !== null
      );
    });
  });

  if (!hasMobileNav) {
    return {
      severity: 'major',
      type: 'missing_mobile_nav',
      description: 'No mobile navigation menu detected',
      component: 'Navigation',
    };
  }

  return null;
}

/**
 * Check for viewport meta tag
 */
async function checkViewportMeta(page: Page): Promise<TestIssue | null> {
  const hasViewport = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta !== null;
  });

  if (!hasViewport) {
    return {
      severity: 'critical',
      type: 'missing_viewport_meta',
      description: 'Missing viewport meta tag',
      component: 'HTML Head',
    };
  }

  return null;
}

/**
 * Check for content overflow
 */
async function checkContentOverflow(page: Page): Promise<TestIssue | null> {
  const overflowingElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const viewportWidth = window.innerWidth;

    return elements
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > viewportWidth + 5; // 5px tolerance
      })
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        width: Math.round(el.getBoundingClientRect().width),
      }))
      .slice(0, 5);
  });

  if (overflowingElements.length > 0) {
    return {
      severity: 'minor',
      type: 'content_overflow',
      description: `${overflowingElements.length} elements overflow viewport width`,
      component: 'Layout',
      details: overflowingElements,
    };
  }

  return null;
}

/**
 * Check for SSE streaming indicators (chatroom specific)
 */
async function checkStreamingIndicators(page: Page, hasStreaming: boolean): Promise<TestIssue | null> {
  if (!hasStreaming) return null;

  const hasIndicators = await page.evaluate(() => {
    // Check for streaming/typing indicators
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.some((el) => {
      const text = el.textContent || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const classes = el.className || '';

      return (
        text.toLowerCase().includes('streaming') ||
        text.toLowerCase().includes('typing') ||
        ariaLabel.toLowerCase().includes('streaming') ||
        ariaLabel.toLowerCase().includes('typing') ||
        classes.toLowerCase().includes('streaming') ||
        classes.toLowerCase().includes('typing')
      );
    });
  });

  if (!hasIndicators) {
    return {
      severity: 'minor',
      type: 'missing_streaming_indicators',
      description: 'No SSE streaming indicators detected',
      component: 'Chatroom',
    };
  }

  return null;
}

/**
 * Check for responsive tables (admin panel specific)
 */
async function checkResponsiveTables(page: Page, hasAdmin: boolean): Promise<TestIssue | null> {
  if (!hasAdmin) return null;

  const hasResponsiveTables = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    if (tables.length === 0) return true; // No tables is fine

    return tables.some((table) => {
      const style = window.getComputedStyle(table);
      const parent = table.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;

      return (
        style.overflowX === 'auto' ||
        style.overflowX === 'scroll' ||
        (parentStyle && (parentStyle.overflowX === 'auto' || parentStyle.overflowX === 'scroll')) ||
        table.classList.contains('overflow-x-auto') ||
        parent?.classList.contains('overflow-x-auto')
      );
    });
  });

  if (!hasResponsiveTables) {
    return {
      severity: 'major',
      type: 'non_responsive_tables',
      description: 'Admin tables may not be responsive on mobile',
      component: 'Admin Panel',
    };
  }

  return null;
}

/**
 * Run all checks for a page at a specific viewport
 */
async function runPageChecks(
  page: Page,
  viewport: typeof MOBILE_BREAKPOINTS[0],
  pageConfig: typeof PAGES_TO_TEST[0]
): Promise<TestIssue[]> {
  const issues: TestIssue[] = [];

  // Run all checks
  const checks = [
    checkHorizontalScroll(page),
    checkTouchTargets(page, viewport.width),
    checkTextReadability(page, viewport.width),
    checkMobileNavigation(page, viewport.width),
    checkViewportMeta(page),
    checkContentOverflow(page),
    checkStreamingIndicators(page, pageConfig.hasStreaming || false),
    checkResponsiveTables(page, pageConfig.hasAdmin || false),
  ];

  const results = await Promise.all(checks);

  for (const result of results) {
    if (result !== null) {
      issues.push(result);
    }
  }

  return issues;
}

// Test suite
test.describe('Mobile Responsiveness - Remaining 4 Pages', () => {
  for (const pageConfig of PAGES_TO_TEST) {
    test.describe(`${pageConfig.name} (${pageConfig.path})`, () => {
      for (const viewport of MOBILE_BREAKPOINTS) {
        test(`${viewport.label} - ${viewport.width}x${viewport.height}`, async ({ page }) => {
          // Set viewport
          await page.setViewportSize({ width: viewport.width, height: viewport.height });

          // Navigate to page
          const url = `${BASE_URL}${pageConfig.path}`;
          await page.goto(url, { waitUntil: 'networkidle' });

          // Wait for dynamic content
          await page.waitForTimeout(2000);

          // Take screenshot
          const screenshotDir = path.join(process.cwd(), 'test-results', 'mobile-screenshots');
          fs.mkdirSync(screenshotDir, { recursive: true });

          const pageName = pageConfig.path.replace(/^\//, '').replace(/\//g, '-') || 'home';
          const screenshotPath = path.join(
            screenshotDir,
            `${pageName}-${viewport.name}-${viewport.width}x${viewport.height}.png`
          );

          await page.screenshot({ path: screenshotPath, fullPage: true });

          // Run all checks
          const issues = await runPageChecks(page, viewport, pageConfig);

          // Store results
          if (!testResults[pageConfig.path]) {
            testResults[pageConfig.path] = {};
          }

          testResults[pageConfig.path][viewport.name] = {
            issues,
            screenshot: screenshotPath,
            timestamp: new Date().toISOString(),
          };

          // Assert no critical issues
          const criticalIssues = issues.filter((i) => i.severity === 'critical');
          expect(criticalIssues, `Critical issues found: ${JSON.stringify(criticalIssues, null, 2)}`).toHaveLength(0);

          // Log issues for reporting
          if (issues.length > 0) {
            console.log(`\n${pageConfig.name} at ${viewport.label}:`);
            issues.forEach((issue) => {
              console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
            });
          }
        });
      }
    });
  }

  // Generate final report after all tests
  test.afterAll(async () => {
    const reportDir = path.join(process.cwd(), 'test-results', 'mobile-reports');
    fs.mkdirSync(reportDir, { recursive: true });

    // Generate JSON report
    const jsonPath = path.join(reportDir, `mobile-test-results-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2), 'utf8');

    // Generate markdown report
    const mdPath = path.join(reportDir, `mobile-test-report-${Date.now()}.md`);
    const report = generateMarkdownReport(testResults);
    fs.writeFileSync(mdPath, report, 'utf8');

    console.log(`\n📄 Test reports generated:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
  });
});

/**
 * Generate markdown report from test results
 */
function generateMarkdownReport(results: TestResults): string {
  let report = `# Mobile Responsiveness Test Report\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary
  let totalIssues = 0;
  let criticalCount = 0;
  let majorCount = 0;
  let minorCount = 0;

  for (const pagePath in results) {
    for (const breakpoint in results[pagePath]) {
      const { issues } = results[pagePath][breakpoint];
      totalIssues += issues.length;
      criticalCount += issues.filter((i) => i.severity === 'critical').length;
      majorCount += issues.filter((i) => i.severity === 'major').length;
      minorCount += issues.filter((i) => i.severity === 'minor').length;
    }
  }

  report += `## Summary\n`;
  report += `- **Total Pages Tested:** ${Object.keys(results).length}\n`;
  report += `- **Total Breakpoints:** ${MOBILE_BREAKPOINTS.length} per page\n`;
  report += `- **Total Issues Found:** ${totalIssues}\n`;
  report += `  - Critical: ${criticalCount}\n`;
  report += `  - Major: ${majorCount}\n`;
  report += `  - Minor: ${minorCount}\n\n`;

  // Detailed results per page
  report += `## Detailed Results\n\n`;

  for (const pageConfig of PAGES_TO_TEST) {
    const pagePath = pageConfig.path;
    if (!results[pagePath]) continue;

    report += `### ${pageConfig.name} (${pagePath})\n\n`;

    for (const viewport of MOBILE_BREAKPOINTS) {
      const breakpointData = results[pagePath][viewport.name];
      if (!breakpointData) continue;

      report += `#### ${viewport.label} - ${viewport.width}x${viewport.height}\n\n`;

      if (breakpointData.issues.length === 0) {
        report += `✅ No issues found\n\n`;
      } else {
        report += `Found ${breakpointData.issues.length} issue(s):\n\n`;

        for (const issue of breakpointData.issues) {
          report += `- **[${issue.severity.toUpperCase()}]** ${issue.description}\n`;
          report += `  - Component: ${issue.component}\n`;
          if (issue.details) {
            report += `  - Details: \`${JSON.stringify(issue.details)}\`\n`;
          }
          report += `\n`;
        }
      }

      if (breakpointData.screenshot) {
        const relativePath = path.relative(process.cwd(), breakpointData.screenshot);
        report += `📸 Screenshot: [${relativePath}](${relativePath})\n\n`;
      }
    }
  }

  // Recommendations
  report += `## Recommendations\n\n`;

  if (criticalCount > 0) {
    report += `### Critical Issues (${criticalCount})\n`;
    report += `These must be fixed immediately:\n`;
    report += `- Fix horizontal scrolling issues\n`;
    report += `- Add viewport meta tag if missing\n\n`;
  }

  if (majorCount > 0) {
    report += `### Major Issues (${majorCount})\n`;
    report += `These significantly impact usability:\n`;
    report += `- Increase touch target sizes to minimum 44x44px\n`;
    report += `- Increase text size to minimum 14px for readability\n`;
    report += `- Add mobile navigation menu\n`;
    report += `- Make admin tables responsive\n\n`;
  }

  if (minorCount > 0) {
    report += `### Minor Issues (${minorCount})\n`;
    report += `These should be addressed for better UX:\n`;
    report += `- Fix content overflow\n`;
    report += `- Add streaming indicators\n\n`;
  }

  return report;
}
