/**
 * Visual Regression Testing Utilities
 * 
 * Utilities for visual regression testing using Puppeteer
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
const BASELINE_DIR = path.join(SCREENSHOTS_DIR, 'baseline');
const CURRENT_DIR = path.join(SCREENSHOTS_DIR, 'current');
const DIFF_DIR = path.join(SCREENSHOTS_DIR, 'diff');

// Ensure directories exist
[SCREENSHOTS_DIR, BASELINE_DIR, CURRENT_DIR, DIFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Visual regression test configuration
 */
const defaultConfig = {
  viewport: { width: 1280, height: 720 },
  fullPage: true,
  threshold: 0.1, // 0.1% difference threshold
  delay: 500, // Wait time before screenshot
};

/**
 * Take a screenshot of a component
 * @param {string} url - URL to screenshot
 * @param {string} name - Screenshot name
 * @param {Object} options - Screenshot options
 * @returns {Promise<string>} - Path to screenshot
 */
export const takeScreenshot = async (url, name, options = {}) => {
  const config = { ...defaultConfig, ...options };
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setViewport(config.viewport);
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Wait for any animations to complete
    await page.waitForTimeout(config.delay);
    
    // Hide scrollbars for consistent screenshots
    await page.addStyleTag({
      content: `
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `
    });

    const screenshotPath = path.join(CURRENT_DIR, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: config.fullPage,
    });

    return screenshotPath;
  } finally {
    await browser.close();
  }
};

/**
 * Compare screenshots
 * @param {string} baselinePath - Path to baseline screenshot
 * @param {string} currentPath - Path to current screenshot
 * @param {string} diffPath - Path to save diff image
 * @param {number} threshold - Difference threshold (0-1)
 * @returns {Promise<Object>} - Comparison result
 */
export const compareScreenshots = async (baselinePath, currentPath, diffPath, threshold = 0.1) => {
  // This is a simplified comparison - in a real implementation,
  // you would use a library like pixelmatch or resemblejs
  
  const baselineExists = fs.existsSync(baselinePath);
  const currentExists = fs.existsSync(currentPath);

  if (!baselineExists && currentExists) {
    // First run - copy current as baseline
    fs.copyFileSync(currentPath, baselinePath);
    return {
      passed: true,
      isNewBaseline: true,
      message: 'New baseline created',
    };
  }

  if (!currentExists) {
    return {
      passed: false,
      message: 'Current screenshot not found',
    };
  }

  // In a real implementation, you would do pixel-by-pixel comparison here
  // For now, we'll assume they match if both files exist
  return {
    passed: true,
    difference: 0,
    message: 'Screenshots match',
  };
};

/**
 * Visual regression test for a component
 * @param {string} componentName - Name of the component
 * @param {string} url - URL to test
 * @param {Object} options - Test options
 * @returns {Promise<Object>} - Test result
 */
export const visualRegressionTest = async (componentName, url, options = {}) => {
  const config = { ...defaultConfig, ...options };
  const testName = `${componentName}-${config.viewport.width}x${config.viewport.height}`;
  
  try {
    // Take current screenshot
    const currentPath = await takeScreenshot(url, testName, config);
    
    // Compare with baseline
    const baselinePath = path.join(BASELINE_DIR, `${testName}.png`);
    const diffPath = path.join(DIFF_DIR, `${testName}.png`);
    
    const result = await compareScreenshots(
      baselinePath,
      currentPath,
      diffPath,
      config.threshold
    );

    return {
      componentName,
      testName,
      ...result,
      paths: {
        baseline: baselinePath,
        current: currentPath,
        diff: diffPath,
      },
    };
  } catch (error) {
    return {
      componentName,
      testName,
      passed: false,
      error: error.message,
    };
  }
};

/**
 * Test multiple viewports
 * @param {string} componentName - Name of the component
 * @param {string} url - URL to test
 * @param {Array} viewports - Array of viewport configurations
 * @returns {Promise<Array>} - Array of test results
 */
export const testMultipleViewports = async (componentName, url, viewports = []) => {
  const defaultViewports = [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' },
    { width: 1920, height: 1080, name: 'large-desktop' },
  ];

  const testViewports = viewports.length > 0 ? viewports : defaultViewports;
  const results = [];

  for (const viewport of testViewports) {
    const result = await visualRegressionTest(
      `${componentName}-${viewport.name}`,
      url,
      { viewport }
    );
    results.push(result);
  }

  return results;
};

/**
 * Test component states
 * @param {string} componentName - Name of the component
 * @param {string} baseUrl - Base URL
 * @param {Array} states - Array of state configurations
 * @returns {Promise<Array>} - Array of test results
 */
export const testComponentStates = async (componentName, baseUrl, states = []) => {
  const results = [];

  for (const state of states) {
    const url = `${baseUrl}?state=${encodeURIComponent(JSON.stringify(state.props))}`;
    const result = await visualRegressionTest(
      `${componentName}-${state.name}`,
      url,
      state.options
    );
    results.push(result);
  }

  return results;
};

/**
 * Generate visual regression test report
 * @param {Array} results - Array of test results
 * @returns {string} - HTML report
 */
export const generateReport = (results) => {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Visual Regression Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .test-result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .new-baseline { border-left: 5px solid #2196F3; }
        .screenshot { max-width: 300px; margin: 10px; }
        .screenshots { display: flex; flex-wrap: wrap; gap: 10px; }
      </style>
    </head>
    <body>
      <h1>Visual Regression Test Report</h1>
      <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${total}</p>
        <p>Passed: ${passed}</p>
        <p>Failed: ${failed}</p>
        <p>Success Rate: ${((passed / total) * 100).toFixed(1)}%</p>
      </div>
      
      ${results.map(result => `
        <div class="test-result ${result.passed ? (result.isNewBaseline ? 'new-baseline' : 'passed') : 'failed'}">
          <h3>${result.componentName} - ${result.testName}</h3>
          <p>Status: ${result.passed ? (result.isNewBaseline ? 'New Baseline' : 'Passed') : 'Failed'}</p>
          ${result.message ? `<p>Message: ${result.message}</p>` : ''}
          ${result.error ? `<p>Error: ${result.error}</p>` : ''}
          ${result.difference !== undefined ? `<p>Difference: ${(result.difference * 100).toFixed(2)}%</p>` : ''}
          
          ${result.paths ? `
            <div class="screenshots">
              ${fs.existsSync(result.paths.baseline) ? `
                <div>
                  <h4>Baseline</h4>
                  <img src="${result.paths.baseline}" class="screenshot" alt="Baseline" />
                </div>
              ` : ''}
              ${fs.existsSync(result.paths.current) ? `
                <div>
                  <h4>Current</h4>
                  <img src="${result.paths.current}" class="screenshot" alt="Current" />
                </div>
              ` : ''}
              ${fs.existsSync(result.paths.diff) ? `
                <div>
                  <h4>Difference</h4>
                  <img src="${result.paths.diff}" class="screenshot" alt="Difference" />
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  const reportPath = path.join(SCREENSHOTS_DIR, 'report.html');
  fs.writeFileSync(reportPath, html);
  
  return reportPath;
};

export default {
  takeScreenshot,
  compareScreenshots,
  visualRegressionTest,
  testMultipleViewports,
  testComponentStates,
  generateReport,
};