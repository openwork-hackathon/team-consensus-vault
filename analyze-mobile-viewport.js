#!/usr/bin/env node

/**
 * Mobile Viewport Analysis Script (375px width)
 * Analyzes Consensus Vault frontend for iPhone SE viewport issues
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, 'src/components');
const APP_DIR = path.join(__dirname, 'src/app');

// Minimum touch target size (Apple HIG)
const MIN_TOUCH_TARGET = 44;

// Minimum readable text size
const MIN_TEXT_SIZE = 16;

// Common responsive breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Issues tracking
const issues = {
  horizontalOverflow: [],
  textTruncation: [],
  touchTargetSize: [],
  overlappingElements: [],
  textReadability: [],
  other: []
};

// Helper to check if a class is responsive
function isResponsiveClass(className) {
  return /^(sm|md|lg|xl|2xl):/.test(className);
}

// Helper to extract numeric value from Tailwind class
function extractSizeFromClass(className) {
  // Check for padding/margin classes
  const paddingMatch = className.match(/p[xytrbl]?-(\d+)/);
  if (paddingMatch) return parseInt(paddingMatch[1]) * 4; // Convert to px (Tailwind uses 4px base)
  
  // Check for text size classes
  const textMatch = className.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/);
  if (textMatch) {
    const sizes = {
      'xs': 12,
      'sm': 14,
      'base': 16,
      'lg': 18,
      'xl': 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60
    };
    return sizes[textMatch[1]] || 16;
  }
  
  // Check for width/height classes
  const sizeMatch = className.match(/(w|h|min-w|min-h|max-w|max-h)-(\d+)/);
  if (sizeMatch) return parseInt(sizeMatch[2]) * 4;
  
  // Check for arbitrary values
  const arbitraryMatch = className.match/\[(.*?)\]/;
  if (arbitraryMatch) {
    const value = arbitraryMatch[1];
    if (value.includes('px')) return parseInt(value);
    if (value.includes('rem')) return parseFloat(value) * 16;
  }
  
  return null;
}

// Analyze a file for mobile responsiveness issues
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    
    lines.forEach((line, lineNumber) => {
      // Check for fixed widths that might cause overflow
      if (line.includes('w-[') || line.includes('width:') || line.includes('min-width:')) {
        if (line.includes('w-[') && !line.includes('max-w-')) {
          const widthMatch = line.match(/w-\[(\d+)px\]/);
          if (widthMatch && parseInt(widthMatch[1]) > 375) {
            issues.horizontalOverflow.push({
              file: fileName,
              line: lineNumber + 1,
              issue: `Fixed width ${widthMatch[1]}px may cause overflow on 375px viewport`,
              code: line.trim()
            });
          }
        }
      }
      
      // Check for non-responsive text sizes
      if (line.includes('text-') && !isResponsiveClass(line) && !line.includes('sm:text-')) {
        const textClasses = line.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/g);
        if (textClasses) {
          textClasses.forEach(textClass => {
            const size = extractSizeFromClass(textClass);
            if (size && size < MIN_TEXT_SIZE && !textClass.includes('xs')) {
              issues.textReadability.push({
                file: fileName,
                line: lineNumber + 1,
                issue: `Text size ${size}px may be too small for mobile (minimum ${MIN_TEXT_SIZE}px recommended)`,
                code: line.trim()
              });
            }
          });
        }
      }
      
      // Check for small touch targets
      if (line.includes('p-') || line.includes('px-') || line.includes('py-')) {
        const paddingClasses = line.match(/(p|px|py|pt|pr|pb|pl)-(\d+)/g);
        if (paddingClasses) {
          paddingClasses.forEach(paddingClass => {
            const size = extractSizeFromClass(paddingClass);
            // For buttons, check if padding is too small for touch targets
            if (size && size < 8 && (line.includes('button') || line.includes('onClick'))) {
              issues.touchTargetSize.push({
                file: fileName,
                line: lineNumber + 1,
                issue: `Padding ${size}px may result in touch target below ${MIN_TOUCH_TARGET}px minimum`,
                code: line.trim()
              });
            }
          });
        }
      }
      
      // Check for absolute/fixed positioning that might cause overlap
      if ((line.includes('absolute') || line.includes('fixed') || line.includes('sticky')) && 
          !line.includes('relative') && !line.includes('z-')) {
        issues.overlappingElements.push({
          file: fileName,
          line: lineNumber + 1,
          issue: 'Absolute/fixed positioning without z-index may cause overlapping on mobile',
          code: line.trim()
        });
      }
      
      // Check for grid/flex issues
      if (line.includes('grid-cols-') && !line.includes('grid-cols-1')) {
        const gridMatch = line.match(/grid-cols-(\d+)/);
        if (gridMatch && parseInt(gridMatch[1]) > 2) {
          issues.other.push({
            file: fileName,
            line: lineNumber + 1,
            issue: `Grid with ${gridMatch[1]} columns may not adapt well to mobile without responsive classes`,
            code: line.trim()
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
  }
}

// Scan directory for files
function scanDirectory(dirPath, extensions = ['.tsx', '.jsx', '.ts', '.js']) {
  const files = [];
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);
      
      if (item.isDirectory()) {
        traverse(fullPath);
      } else if (extensions.includes(path.extname(item.name))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dirPath);
  return files;
}

// Main analysis
console.log('========================================');
console.log('Mobile Viewport Analysis (375px - iPhone SE)');
console.log('========================================\n');

// Analyze key files
const filesToAnalyze = [
  path.join(APP_DIR, 'page.tsx'),
  path.join(APP_DIR, 'layout.tsx'),
  path.join(APP_DIR, 'globals.css'),
  ...scanDirectory(COMPONENTS_DIR)
];

console.log(`Analyzing ${filesToAnalyze.length} files...\n`);

filesToAnalyze.forEach(filePath => {
  analyzeFile(filePath);
});

// Print results
let totalIssues = 0;

Object.entries(issues).forEach(([category, items]) => {
  if (items.length > 0) {
    console.log(`\n${category.toUpperCase()} (${items.length} issues):`);
    console.log('='.repeat(50));
    
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.file}:${item.line}`);
      console.log(`   Issue: ${item.issue}`);
      console.log(`   Code: ${item.code}`);
      console.log();
    });
    
    totalIssues += items.length;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('ANALYSIS SUMMARY');
console.log('='.repeat(50));
console.log(`Total files analyzed: ${filesToAnalyze.length}`);
console.log(`Total issues found: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('\n✅ No mobile responsiveness issues detected!');
} else {
  console.log('\n📋 Issues by category:');
  Object.entries(issues).forEach(([category, items]) => {
    if (items.length > 0) {
      console.log(`  ${category}: ${items.length}`);
    }
  });
}

console.log('\n' + '='.repeat(50));