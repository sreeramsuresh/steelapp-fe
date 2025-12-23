/**
 * Puppeteer Utilities for E2E Testing
 * Reusable helper functions for common browser automation tasks
 *
 * Usage:
 * import { fillInput, selectDropdown, checkCheckbox } from './puppeteer-utils.js';
 */

/**
 * Colors for console output
 */
export const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/**
 * Logging utilities
 */
export const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}TEST${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.gray}DEBUG${colors.reset} ${msg}`),
};

/**
 * Wait for element to appear on page
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Wait timeout in ms
 * @returns {boolean} - True if element found
 */
export async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (err) {
    log.warn(`Element not found: ${selector}`);
    return false;
  }
}

/**
 * Wait for element and verify visibility
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Wait timeout in ms
 * @returns {boolean} - True if visible
 */
export async function waitForVisible(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, visible: true });
    return true;
  } catch (err) {
    log.warn(`Element not visible: ${selector}`);
    return false;
  }
}

/**
 * Fill a text input field with value
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for input
 * @param {string} value - Value to type
 * @param {object} options - Options
 * @returns {boolean} - True if successful
 */
export async function fillInput(page, selector, value, options = {}) {
  try {
    const { clear = true, delay = 50 } = options;

    if (!(await waitForElement(page, selector))) {
      return false;
    }

    await page.click(selector);

    if (clear) {
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Backspace");
    }

    await page.type(selector, value, { delay });
    return true;
  } catch (err) {
    log.error(`Failed to fill ${selector}: ${err.message}`);
    return false;
  }
}

/**
 * Fill multiple inputs at once
 * @param {Page} page - Puppeteer page object
 * @param {object} fields - Object mapping selectors to values
 * @returns {number} - Number of successfully filled fields
 */
export async function fillInputs(page, fields) {
  let filled = 0;

  for (const [selector, value] of Object.entries(fields)) {
    if (await fillInput(page, selector, value)) {
      filled++;
    }
  }

  return filled;
}

/**
 * Get value from input field
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @returns {string|null} - Input value or null
 */
export async function getInputValue(page, selector) {
  try {
    return await page.$eval(selector, (el) => el.value);
  } catch (err) {
    log.warn(`Could not get value for ${selector}`);
    return null;
  }
}

/**
 * Get multiple input values
 * @param {Page} page - Puppeteer page object
 * @param {string[]} selectors - Array of CSS selectors
 * @returns {object} - Object mapping selectors to values
 */
export async function getInputValues(page, selectors) {
  const values = {};

  for (const selector of selectors) {
    values[selector] = await getInputValue(page, selector);
  }

  return values;
}

/**
 * Select from Radix UI FormSelect dropdown
 * @param {Page} page - Puppeteer page object
 * @param {string} label - Label text of dropdown
 * @param {string} value - Option text to select
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} - True if successful
 */
export async function selectDropdown(page, label, value, timeout = 3000) {
  try {
    // Find button containing label
    const buttons = await page.$$("button");
    let found = false;

    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text.includes(label)) {
        await btn.click();
        found = true;
        break;
      }
    }

    if (!found) {
      log.warn(`Dropdown label not found: ${label}`);
      return false;
    }

    // Wait for menu to appear
    try {
      await page.waitForSelector('[role="option"]', { timeout });
    } catch (err) {
      log.warn(`Dropdown menu did not appear for ${label}`);
      return false;
    }

    // Find and click option
    const options = await page.$$('[role="option"]');
    for (const option of options) {
      const optionText = await page.evaluate((el) => el.textContent, option);
      if (optionText.includes(value)) {
        await option.click();
        await page.waitForTimeout(300);
        return true;
      }
    }

    log.warn(`Option not found: ${value}`);
    return false;
  } catch (err) {
    log.error(`Failed to select dropdown ${label}: ${err.message}`);
    return false;
  }
}

/**
 * Check a checkbox if not already checked
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for checkbox
 * @returns {boolean} - True if successful
 */
export async function checkCheckbox(page, selector) {
  try {
    if (!(await waitForElement(page, selector))) {
      return false;
    }

    const isChecked = await page.$eval(selector, (el) => el.checked);
    if (!isChecked) {
      await page.click(selector);
      await page.waitForTimeout(100);
    }

    return true;
  } catch (err) {
    log.error(`Failed to check checkbox ${selector}: ${err.message}`);
    return false;
  }
}

/**
 * Uncheck a checkbox if not already unchecked
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for checkbox
 * @returns {boolean} - True if successful
 */
export async function uncheckCheckbox(page, selector) {
  try {
    if (!(await waitForElement(page, selector))) {
      return false;
    }

    const isChecked = await page.$eval(selector, (el) => el.checked);
    if (isChecked) {
      await page.click(selector);
      await page.waitForTimeout(100);
    }

    return true;
  } catch (err) {
    log.error(`Failed to uncheck checkbox ${selector}: ${err.message}`);
    return false;
  }
}

/**
 * Get checkbox checked state
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for checkbox
 * @returns {boolean|null} - Checked state or null
 */
export async function isCheckboxChecked(page, selector) {
  try {
    if (!(await waitForElement(page, selector))) {
      return null;
    }

    return await page.$eval(selector, (el) => el.checked);
  } catch (err) {
    log.warn(`Could not get checkbox state for ${selector}`);
    return null;
  }
}

/**
 * Toggle accordion section
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for toggle button
 * @returns {boolean} - True if successful
 */
export async function toggleSection(page, selector) {
  try {
    const button = await page.$(selector);
    if (!button) {
      log.warn(`Toggle button not found: ${selector}`);
      return false;
    }

    await button.click();
    await page.waitForTimeout(300);
    return true;
  } catch (err) {
    log.error(`Failed to toggle section ${selector}: ${err.message}`);
    return false;
  }
}

/**
 * Get all visible validation error messages
 * @param {Page} page - Puppeteer page object
 * @returns {string[]} - Array of error messages
 */
export async function getValidationErrors(page) {
  try {
    const errors = await page.$$eval(".text-red-500", (els) =>
      els
        .map((el) => el.textContent)
        .filter((text) => text && text.trim().length > 0),
    );
    return errors;
  } catch (err) {
    log.debug(`Could not get validation errors: ${err.message}`);
    return [];
  }
}

/**
 * Check if specific error message exists
 * @param {Page} page - Puppeteer page object
 * @param {string|RegExp} errorPattern - Pattern to match
 * @returns {boolean} - True if error found
 */
export async function hasError(page, errorPattern) {
  const errors = await getValidationErrors(page);

  for (const error of errors) {
    if (typeof errorPattern === "string") {
      if (error.includes(errorPattern)) return true;
    } else if (errorPattern instanceof RegExp) {
      if (errorPattern.test(error)) return true;
    }
  }

  return false;
}

/**
 * Submit form by clicking submit button
 * @param {Page} page - Puppeteer page object
 * @param {number} waitAfter - Wait ms after click
 * @returns {boolean} - True if successful
 */
export async function submitForm(page, waitAfter = 500) {
  try {
    const button = await page.$('button[type="submit"]');
    if (!button) {
      log.error("Submit button not found");
      return false;
    }

    await button.click();
    await page.waitForTimeout(waitAfter);
    return true;
  } catch (err) {
    log.error(`Failed to submit form: ${err.message}`);
    return false;
  }
}

/**
 * Wait for navigation after form submit
 * @param {Page} page - Puppeteer page object
 * @param {string} expectedPath - Expected URL path
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} - True if navigation successful
 */
export async function waitForNavigation(page, expectedPath, timeout = 5000) {
  try {
    await page.waitForNavigation({ timeout });
    const url = page.url();

    if (expectedPath && !url.includes(expectedPath)) {
      log.warn(`Unexpected URL: ${url}, expected to contain: ${expectedPath}`);
      return false;
    }

    return true;
  } catch (err) {
    log.warn(`Navigation timeout or did not occur: ${err.message}`);
    return false;
  }
}

/**
 * Wait for notification/toast
 * @param {Page} page - Puppeteer page object
 * @param {string} type - Notification type (success, error, info, warning)
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} - True if notification appeared
 */
export async function waitForNotification(
  page,
  type = "success",
  timeout = 5000,
) {
  try {
    const selectors = [
      `.toast-${type}`,
      `[role="status"]`,
      `[role="alert"]`,
      ".notification",
      ".toast",
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000, visible: true });
        return true;
      } catch (err) {
        // Continue to next selector
      }
    }

    log.warn(`Notification (${type}) not found`);
    return false;
  } catch (err) {
    log.debug(`Error waiting for notification: ${err.message}`);
    return false;
  }
}

/**
 * Take screenshot with optional path
 * @param {Page} page - Puppeteer page object
 * @param {string} path - File path to save
 * @param {boolean} fullPage - Capture full page
 * @returns {boolean} - True if successful
 */
export async function takeScreenshot(page, path = null, fullPage = true) {
  try {
    const options = { fullPage };
    if (path) options.path = path;

    const screenshot = await page.screenshot(options);
    if (path) {
      log.info(`Screenshot saved to ${path}`);
    }

    return true;
  } catch (err) {
    log.error(`Failed to take screenshot: ${err.message}`);
    return false;
  }
}

/**
 * Get page content as HTML string
 * @param {Page} page - Puppeteer page object
 * @returns {string|null} - HTML content or null
 */
export async function getPageContent(page) {
  try {
    return await page.content();
  } catch (err) {
    log.error(`Failed to get page content: ${err.message}`);
    return null;
  }
}

/**
 * Find text on page and get element
 * @param {Page} page - Puppeteer page object
 * @param {string} text - Text to find
 * @param {string} selector - Optional parent selector
 * @returns {object|null} - Element or null
 */
export async function findByText(page, text, selector = "*") {
  try {
    const element = await page.$(`${selector}:has-text("${text}")`);
    return element;
  } catch (err) {
    log.warn(`Could not find element with text: ${text}`);
    return null;
  }
}

/**
 * Click element by text
 * @param {Page} page - Puppeteer page object
 * @param {string} text - Button/link text
 * @param {string} selector - Optional parent selector
 * @returns {boolean} - True if successful
 */
export async function clickByText(page, text, selector = "button, a") {
  try {
    const element = await page.$(`${selector}:has-text("${text}")`);
    if (!element) {
      log.warn(`Element with text not found: ${text}`);
      return false;
    }

    await element.click();
    await page.waitForTimeout(100);
    return true;
  } catch (err) {
    log.error(`Failed to click element: ${err.message}`);
    return false;
  }
}

/**
 * Wait for text to appear on page
 * @param {Page} page - Puppeteer page object
 * @param {string} text - Text to wait for
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} - True if text found
 */
export async function waitForText(page, text, timeout = 5000) {
  try {
    await page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      { timeout },
      text,
    );
    return true;
  } catch (err) {
    log.warn(`Text not found: ${text}`);
    return false;
  }
}

/**
 * Type text with human-like delays
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {string} text - Text to type
 * @param {number} delay - Delay between keystrokes (ms)
 * @returns {boolean} - True if successful
 */
export async function typeText(page, selector, text, delay = 50) {
  try {
    if (!(await waitForElement(page, selector))) {
      return false;
    }

    await page.click(selector);
    await page.type(selector, text, { delay });
    return true;
  } catch (err) {
    log.error(`Failed to type text: ${err.message}`);
    return false;
  }
}

/**
 * Upload file via file input
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for file input
 * @param {string} filePath - Absolute path to file
 * @returns {boolean} - True if successful
 */
export async function uploadFile(page, selector, filePath) {
  try {
    const input = await page.$(selector);
    if (!input) {
      log.error(`File input not found: ${selector}`);
      return false;
    }

    await input.uploadFile(filePath);
    await page.waitForTimeout(300);
    return true;
  } catch (err) {
    log.error(`Failed to upload file: ${err.message}`);
    return false;
  }
}

/**
 * Get network requests matching pattern
 * @param {Page} page - Puppeteer page object
 * @param {RegExp|string} pattern - URL pattern to match
 * @returns {Response[]} - Array of responses
 */
export async function captureRequests(page, pattern) {
  const requests = [];

  page.on("response", (response) => {
    if (typeof pattern === "string") {
      if (response.url().includes(pattern)) {
        requests.push(response);
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(response.url())) {
        requests.push(response);
      }
    }
  });

  return requests;
}

/**
 * Measure element position and size
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @returns {object|null} - { x, y, width, height } or null
 */
export async function getElementBounds(page, selector) {
  try {
    const box = await page.$eval(selector, (el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    });

    return box;
  } catch (err) {
    log.warn(`Could not get element bounds for ${selector}`);
    return null;
  }
}

/**
 * Scroll element into view
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @returns {boolean} - True if successful
 */
export async function scrollIntoView(page, selector) {
  try {
    await page.$eval(selector, (el) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    await page.waitForTimeout(300);
    return true;
  } catch (err) {
    log.error(`Failed to scroll element: ${err.message}`);
    return false;
  }
}

/**
 * Check if element is visible in viewport
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @returns {boolean|null} - True if visible, null if element not found
 */
export async function isInViewport(page, selector) {
  try {
    return await page.$eval(selector, (el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    });
  } catch (err) {
    log.warn(`Element not found or not visible: ${selector}`);
    return null;
  }
}

/**
 * Wait for loading indicator to disappear
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for loading element
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} - True if loading disappeared
 */
export async function waitForLoadingDone(
  page,
  selector = '.spinner, [role="progressbar"], .loader',
  timeout = 10000,
) {
  try {
    // Wait for element to appear first
    await page.waitForSelector(selector, { timeout: 1000 });

    // Then wait for it to disappear
    await page.waitForFunction(
      (sel) => !document.querySelector(sel),
      { timeout },
      selector,
    );

    return true;
  } catch (err) {
    log.debug("Loading indicator already gone or not found");
    return true; // Don't fail if no loading indicator
  }
}

/**
 * Formatted test result output
 * @param {string} testName - Name of test
 * @param {boolean} passed - Whether test passed
 * @param {string} message - Optional message
 */
export function logTestResult(testName, passed, message = "") {
  const status = passed
    ? `${colors.green}PASS${colors.reset}`
    : `${colors.red}FAIL${colors.reset}`;
  const msg = message ? ` - ${message}` : "";
  console.log(`${status}  ${testName}${msg}`);
}

/**
 * Timeout utility
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  colors,
  log,
  waitForElement,
  waitForVisible,
  fillInput,
  fillInputs,
  getInputValue,
  getInputValues,
  selectDropdown,
  checkCheckbox,
  uncheckCheckbox,
  isCheckboxChecked,
  toggleSection,
  getValidationErrors,
  hasError,
  submitForm,
  waitForNavigation,
  waitForNotification,
  takeScreenshot,
  getPageContent,
  findByText,
  clickByText,
  waitForText,
  typeText,
  uploadFile,
  captureRequests,
  getElementBounds,
  scrollIntoView,
  isInViewport,
  waitForLoadingDone,
  logTestResult,
  delay,
};
