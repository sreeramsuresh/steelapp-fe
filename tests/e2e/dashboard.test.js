#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Dashboard E2E Tests - Using Puppeteer Launch Mode
 *
 * Tests all Dashboard pages (14 total):
 * - 11 Analytics Hub pages (/analytics/*)
 * - 3 Operational Dashboard pages (/app/*)
 *
 * Verifies:
 * - Page loads without console errors
 * - Key UI elements render
 * - No 4xx/5xx API errors
 * - Loading states complete
 *
 * Prerequisites:
 * - Frontend running on http://localhost:5173
 * - Backend/API Gateway running on http://localhost:3000
 * - User logged in (uses existing session)
 *
 * Usage:
 * node tests/e2e/dashboard.test.js
 */

import puppeteer from 'puppeteer';

// Platform-aware Chromium path
function getChromiumPath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'win32') {
    return undefined;
  }
  return '/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome';
}

const CHROME_EXECUTABLE = getChromiumPath();
const BASE_URL = 'http://localhost:5173';

/**
 * Helper to wait for a specified time (replaces deprecated page.waitForTimeout)
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Console colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}TEST${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`),
};

// Dashboard pages to test
const DASHBOARD_PAGES = [
  {
    name: 'Analytics Dashboard',
    path: '/analytics/dashboard',
    expectedElements: ['h1', 'button'],
    expectedText: ['Management'],
  },
  {
    name: 'Profit Analysis Report',
    path: '/analytics/profit-analysis',
    expectedElements: ['h1', 'table, [class*="card"]'],
    expectedText: ['Profit'],
  },
  {
    name: 'Price History Report',
    path: '/analytics/price-history',
    expectedElements: ['h1', 'select'],
    expectedText: ['Price History'],
  },
  {
    name: 'AR Aging Report',
    path: '/analytics/ar-aging',
    expectedElements: ['h1'],
    expectedText: ['AR Aging', 'Aging'],
  },
  {
    name: 'Commission Dashboard',
    path: '/analytics/commission-dashboard',
    expectedElements: ['h1'],
    expectedText: ['Commission'],
  },
  {
    name: 'Batch Analytics',
    path: '/analytics/batch-analytics',
    expectedElements: ['h1'],
    expectedText: ['Batch', 'Analytics'],
  },
  {
    name: 'Stock Movement Report',
    path: '/analytics/stock-movement-report',
    expectedElements: ['h1', 'select'],
    expectedText: ['Stock Movement'],
  },
  {
    name: 'Delivery Performance',
    path: '/analytics/delivery-performance',
    expectedElements: ['h1'],
    expectedText: ['Delivery', 'Performance'],
  },
  {
    name: 'Supplier Performance',
    path: '/analytics/supplier-performance',
    expectedElements: ['table'],
    expectedText: ['Supplier'],
  },
  {
    name: 'Reports Dashboard',
    path: '/analytics/reports',
    expectedElements: ['h1'],
    expectedText: ['Report'],
  },
  {
    name: 'VAT Return Report',
    path: '/analytics/vat-return',
    expectedElements: ['button'],
    expectedText: ['VAT'],
  },
  // Operational Dashboards (under /app)
  {
    name: 'Purchases Dashboard',
    path: '/app/purchases',
    expectedElements: ['button'],
    expectedText: ['Purchase'],
  },
  {
    name: 'Finance Dashboard',
    path: '/app/finance',
    expectedElements: ['button'],
    expectedText: ['Credit'],
  },
  {
    name: 'Import Export Dashboard',
    path: '/app/import-export',
    expectedElements: ['button'],
    expectedText: ['Import'],
  },
];

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

/**
 * Wait for network to be idle
 */
async function waitForNetworkIdle(page, timeout = 5000) {
  try {
    await page.waitForNetworkIdle({ idleTime: 500, timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for loading spinners to disappear
 */
async function waitForLoadingComplete(page, timeout = 10000) {
  try {
    // Wait for common loading indicators to disappear
    await page.waitForFunction(
      () => {
        const spinners = document.querySelectorAll(
          '[class*="animate-spin"], [class*="loading"], .spinner',
        );
        return spinners.length === 0 ||
          Array.from(spinners).every(s => s.offsetParent === null);
      },
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for console errors
 */
function setupConsoleMonitor(page) {
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known benign errors
      if (!text.includes('favicon') && !text.includes('ResizeObserver')) {
        errors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });

  return errors;
}

/**
 * Check for failed network requests
 */
function setupNetworkMonitor(page) {
  const failedRequests = [];

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();

    // Track 4xx and 5xx errors (except 401 which is auth)
    if (status >= 400 && status !== 401 && url.includes('/api/')) {
      failedRequests.push({ url, status });
    }
  });

  return failedRequests;
}

/**
 * Test a single dashboard page
 * @param {Page} page - Reused Puppeteer page (logged in)
 * @param {object} pageConfig - Page configuration
 * @param {object} monitors - Console and network monitors
 */
async function testDashboardPage(page, pageConfig, monitors) {
  const { name, path, expectedElements, expectedText } = pageConfig;
  const testResults = { passed: true, errors: [] };

  log.test(`Testing: ${name}`);

  // Clear previous errors before navigating
  monitors.consoleErrors.length = 0;
  monitors.networkErrors.length = 0;

  try {
    // Navigate to page (reusing same page - no new page creation)
    const url = `${BASE_URL}${path}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for loading to complete
    await waitForNetworkIdle(page);
    await waitForLoadingComplete(page);

    // Allow extra time for React to render
    await delay(1000);

    // Check 1: Page loaded (not on error page)
    const pageTitle = await page.title();
    if (pageTitle.toLowerCase().includes('error') || pageTitle === '') {
      testResults.passed = false;
      testResults.errors.push('Page may not have loaded correctly');
    }

    // Check 2: Expected elements exist
    for (const selector of expectedElements) {
      try {
        const element = await page.$(selector);
        if (!element) {
          testResults.errors.push(`Missing element: ${selector}`);
        }
      } catch (err) {
        testResults.errors.push(`Error checking element ${selector}: ${err.message}`);
      }
    }

    // Check 3: Expected text exists
    const pageContent = await page.content();
    for (const text of expectedText) {
      if (!pageContent.includes(text)) {
        testResults.errors.push(`Missing text: "${text}"`);
      }
    }

    // Check 4: No critical console errors
    const criticalErrors = monitors.consoleErrors.filter(
      (e) => !e.includes('Warning:') && !e.includes('DevTools'),
    );
    if (criticalErrors.length > 0) {
      testResults.errors.push(`Console errors: ${criticalErrors.length}`);
      criticalErrors.slice(0, 2).forEach((e) => {
        testResults.errors.push(`  - ${e.substring(0, 100)}`);
      });
    }

    // Check 5: No failed API requests
    if (monitors.networkErrors.length > 0) {
      testResults.errors.push(`Failed API requests: ${monitors.networkErrors.length}`);
      monitors.networkErrors.forEach(({ url: reqUrl, status }) => {
        const endpoint = reqUrl.split('/api/')[1] || reqUrl;
        testResults.errors.push(`  - ${status}: /api/${endpoint.substring(0, 50)}`);
      });
    }

    // Determine pass/fail
    if (testResults.errors.length > 0) {
      testResults.passed = false;
    }

  } catch (err) {
    testResults.passed = false;
    testResults.errors.push(`Navigation error: ${err.message}`);
  }
  // NOTE: No page.close() - page is reused across all tests

  // Log results
  if (testResults.passed) {
    log.success(`${name} - PASSED`);
    results.passed++;
  } else {
    log.error(`${name} - FAILED`);
    testResults.errors.forEach((e) => log.warn(`  ${e}`));
    results.failed++;
    results.errors.push({ page: name, errors: testResults.errors });
  }

  return testResults;
}

/**
 * Login helper - uses auto-login or manual login
 * Based on E2E auth patterns from project memory
 */
async function ensureLoggedIn(page) {
  // Check if already logged in by looking for accessToken cookie
  const cookies = await page.cookies();
  const hasToken = cookies.some((c) => c.name === 'accessToken' || c.name === 'token');

  if (hasToken) {
    log.success('Already logged in (token cookie found)');
    return;
  }

  log.info('No auth token found - attempting login...');

  try {
    // Navigate to login page with longer timeout (page load can take 10+ seconds)
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for login form to render
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    // Fill login form
    await page.type('input[type="email"], input[name="email"]', 'admin@steelapp.com');
    await page.type('input[type="password"], input[name="password"]', 'admin123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect with longer timeout
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verify login succeeded - URL should NOT contain /login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Still on login page after submit');
    }

    // Verify logged-in indicator exists (sidebar or user menu)
    const loggedInIndicator = await page.$('[class*="sidebar"], [class*="Sidebar"], nav, [data-testid="user-menu"]');
    if (!loggedInIndicator) {
      log.warn('Could not find logged-in indicator, but URL suggests success');
    }

    // Verify accessToken cookie was set
    const postLoginCookies = await page.cookies();
    const tokenSet = postLoginCookies.some((c) => c.name === 'accessToken' || c.name === 'token');
    if (tokenSet) {
      log.success('Login successful (cookie verified)');
    } else {
      log.warn('Login appeared successful but no token cookie found');
    }

  } catch (err) {
    log.warn(`Login failed: ${err.message}`);
    log.info('Tests will continue but may fail due to auth');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${  '='.repeat(60)}`);
  console.log('  Dashboard E2E Tests');
  console.log(`${'='.repeat(60)  }\n`);

  log.info(`Testing ${DASHBOARD_PAGES.length} dashboard pages`);
  log.info(`Base URL: ${BASE_URL}`);

  let browser;
  let page;

  try {
    // Launch browser
    log.info('Launching browser...');

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };

    if (CHROME_EXECUTABLE) {
      launchOptions.executablePath = CHROME_EXECUTABLE;
    }

    browser = await puppeteer.launch(launchOptions);
    log.success('Browser launched');

    // Create ONE page and login ONCE (reused for all tests)
    page = await browser.newPage();

    // Add page error handler for React crashes (important for debugging)
    page.on('pageerror', (err) => {
      log.error(`PAGE ERROR: ${err.message}`);
    });

    await ensureLoggedIn(page);
    log.success('Single page created and logged in');

    // Setup monitors ONCE on the reused page
    const monitors = {
      consoleErrors: setupConsoleMonitor(page),
      networkErrors: setupNetworkMonitor(page),
    };

    // Test each dashboard page (reusing same page)
    log.section('Running Dashboard Tests');

    for (const pageConfig of DASHBOARD_PAGES) {
      await testDashboardPage(page, pageConfig, monitors);
    }

  } catch (err) {
    log.error(`Test runner error: ${err.message}`);
    console.error(err);
  } finally {
    // Close page and browser only at the very end
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
      log.info('Browser closed');
    }
  }

  // Print summary
  console.log(`\n${  '='.repeat(60)}`);
  console.log('  Test Summary');
  console.log('='.repeat(60));
  console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`  Total:  ${results.passed + results.failed}`);
  console.log(`${'='.repeat(60)  }\n`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
