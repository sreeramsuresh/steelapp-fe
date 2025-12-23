/**
 * Async Operation Test Helpers
 *
 * Utilities for handling asynchronous operations in button tests.
 * Provides timing, polling, and async flow control helpers.
 *
 * Usage:
 * ```javascript
 * import { clickAndWaitForApi, waitForApiCall, waitForDebounce } from '@/test/utils';
 *
 * const mockFetch = vi.fn().mockResolvedValue({ id: 1 });
 * await clickAndWaitForApi(button, mockFetch);
 * ```
 */

import { waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import {
  clickButton,
  waitForButtonDisabled,
  waitForButtonEnabled,
} from './buttonTestUtils';
import { waitForLoadingComplete } from './stateAssertions';

/**
 * Click button and wait for mock API function to be called
 * @param {HTMLElement} button - Button element to click
 * @param {Function|Array<Function>} mockFn - Mock function(s) to wait for
 * @param {Object} options - Wait options
 * @param {number} options.timeout - Max wait time in ms (default: 5000)
 * @param {*} options.expectedArgs - Expected arguments passed to mock
 * @returns {Promise<void>}
 *
 * @example
 * const mockSave = vi.fn().mockResolvedValue({ id: 1 });
 * await clickAndWaitForApi(saveButton, mockSave);
 * expect(mockSave).toHaveBeenCalled();
 *
 * // Wait for specific arguments
 * await clickAndWaitForApi(submitButton, mockSubmit, {
 *   expectedArgs: [{ email: 'test@example.com' }]
 * });
 */
export async function clickAndWaitForApi(button, mockFn, options = {}) {
  const { timeout = 5000, expectedArgs = null } = options;

  if (!button) {
    throw new Error('clickAndWaitForApi: button element is required');
  }

  if (!mockFn) {
    throw new Error('clickAndWaitForApi: mockFn is required');
  }

  const mockFns = Array.isArray(mockFn) ? mockFn : [mockFn];

  // Record call count before click
  const initialCounts = mockFns.map((fn) => fn.mock.calls.length);

  await clickButton(button);

  // Wait for mock to be called
  await waitFor(
    () => {
      mockFns.forEach((fn, idx) => {
        const called = fn.mock.calls.length > initialCounts[idx];
        expect(called).toBe(true);

        if (expectedArgs) {
          const callArgs = expectedArgs[idx] || expectedArgs;
          expect(fn).toHaveBeenCalledWith(expect.objectContaining(callArgs));
        }
      });
    },
    { timeout },
  );
}

/**
 * Wait for mock function to be called
 * @param {Function|Array<Function>} mockFn - Mock function(s) to wait for
 * @param {Object} options - Wait options
 * @param {number} options.timeout - Max wait time in ms (default: 5000)
 * @param {number} options.times - Expected call count
 * @returns {Promise<void>}
 *
 * @example
 * const mockFetch = vi.fn().mockResolvedValue({ data: [] });
 * render(<Dashboard />);
 * await waitForApiCall(mockFetch);
 * expect(mockFetch).toHaveBeenCalled();
 *
 * // Wait for multiple calls
 * await waitForApiCall(mockFetch, { times: 2 });
 */
export async function waitForApiCall(mockFn, options = {}) {
  const { timeout = 5000, times = null } = options;

  if (!mockFn) {
    throw new Error('waitForApiCall: mockFn is required');
  }

  const mockFns = Array.isArray(mockFn) ? mockFn : [mockFn];

  await waitFor(
    () => {
      mockFns.forEach((fn) => {
        if (times !== null) {
          expect(fn).toHaveBeenCalledTimes(times);
        } else {
          expect(fn).toHaveBeenCalled();
        }
      });
    },
    { timeout },
  );
}

/**
 * Wait for debounced handler to be called
 * Useful for search inputs, auto-save, etc.
 * @param {number} delayMs - Debounce delay in ms
 * @param {Object} options - Options
 * @param {Function} options.callback - Optional callback after debounce
 * @returns {Promise<void>}
 *
 * @example
 * await userEvent.type(searchInput, 'test');
 * await waitForDebounce(500);  // Wait for debounce to fire
 * expect(mockSearch).toHaveBeenCalled();
 */
export async function waitForDebounce(delayMs, options = {}) {
  const { callback = null } = options;

  await new Promise((resolve) => {
    setTimeout(() => {
      if (callback) {
        callback();
      }
      resolve();
    }, delayMs);
  });
}

/**
 * Click button and wait for async operation to complete
 * Tracks loading state: enabled -> disabled -> enabled
 * @param {HTMLElement} button - Button to click
 * @param {Function} stateChecker - Optional function to check state during operation
 * @param {Object} options - Options
 * @param {number} options.timeout - Max wait time in ms (default: 10000)
 * @returns {Promise<void>}
 *
 * @example
 * await performAsyncButtonClick(refreshButton, async () => {
 *   expect(await assertTableRowCountChanges(5));
 * });
 */
export async function performAsyncButtonClick(
  button,
  stateChecker = null,
  options = {},
) {
  const { timeout = 10000 } = options;

  if (!button) {
    throw new Error('performAsyncButtonClick: button element is required');
  }

  // Click to start operation
  await clickButton(button);

  // Wait for loading state (button disabled)
  await waitForButtonDisabled(button, timeout);

  // Run optional state checks during loading
  if (stateChecker && typeof stateChecker === 'function') {
    await stateChecker();
  }

  // Wait for operation to complete (button enabled again)
  await waitForButtonEnabled(button, timeout);
}

/**
 * Wait for loading indicator to appear
 * @param {string|RegExp} loadingSelector - Element selector or text pattern for loading indicator
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Loading indicator element
 *
 * @example
 * const spinner = await waitForLoadingStart('[class*="spinner"]');
 * expect(spinner).toBeInTheDocument();
 */
export async function waitForLoadingStart(
  loadingSelector = '[class*="spinner"], [class*="loading"]',
  timeout = 5000,
) {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const element =
        typeof loadingSelector === 'string'
          ? document.querySelector(loadingSelector)
          : null;

      if (element) {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(element);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error(`Loading indicator not found: ${loadingSelector}`));
    }, timeout);
  });
}

/**
 * Wait for loading indicator to disappear
 * @param {string|RegExp} loadingSelector - Element selector or text pattern for loading indicator
 * @param {number} timeout - Max wait time in ms (default: 10000)
 * @returns {Promise<void>}
 *
 * @example
 * await userEvent.click(button);
 * await waitForLoadingEnd('[class*="spinner"]');
 */
export async function waitForLoadingEnd(
  loadingSelector = '[class*="spinner"], [class*="loading"]',
  timeout = 10000,
) {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const element =
        typeof loadingSelector === 'string'
          ? document.querySelector(loadingSelector)
          : null;

      if (!element) {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve();
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(
        new Error(`Loading indicator did not disappear: ${loadingSelector}`),
      );
    }, timeout);
  });
}

/**
 * Retry a condition until it passes
 * @param {Function} condition - Condition to check (returns boolean or throws)
 * @param {Object} options - Options
 * @param {number} options.maxRetries - Max number of retries (default: 5)
 * @param {number} options.delayMs - Delay between retries in ms (default: 100)
 * @returns {Promise<boolean>} Returns true on success
 *
 * @example
 * const success = await retryUntil(() => mockApi.mock.calls.length > 0, { maxRetries: 5 });
 */
export async function retryUntil(condition, options = {}) {
  const { maxRetries = 5, delayMs = 100 } = options;

  if (typeof condition !== 'function') {
    throw new Error('retryUntil: condition must be a function');
  }

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = condition();

      // Handle async conditions
      if (result && typeof result.then === 'function') {
        try {
          const resolvedValue = await result;
          if (resolvedValue) {
            return true;
          }
        } catch (error) {
          lastError = error;
        }
      } else if (result) {
        return true;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error(`Condition not met after ${maxRetries} retries`);
}

/**
 * Poll for a condition with custom interval
 * @param {Function} condition - Condition to check (returns truthy/falsy)
 * @param {Object} options - Options
 * @param {number} options.intervalMs - Poll interval in ms (default: 100)
 * @param {number} options.timeoutMs - Max total time in ms (default: 5000)
 * @returns {Promise<boolean>} Returns true when condition is met
 *
 * @example
 * const result = await pollForCondition(() => mockApi.mock.calls.length > 0);
 */
export async function pollForCondition(condition, options = {}) {
  const { intervalMs = 100, timeoutMs = 5000 } = options;

  if (typeof condition !== 'function') {
    throw new Error('pollForCondition: condition must be a function');
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let checkInterval;

    const checkCondition = () => {
      try {
        if (condition()) {
          clearInterval(checkInterval);
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          reject(new Error(`Condition not met after ${timeoutMs}ms`));
        }
      } catch (error) {
        clearInterval(checkInterval);
        reject(new Error(`Condition check failed: ${error.message}`));
      }
    };

    checkInterval = setInterval(checkCondition, intervalMs);
    checkCondition(); // Check immediately
  });
}

/**
 * Wait for callback to be invoked
 * @param {Function} callback - Callback function to track
 * @param {Object} options - Options
 * @param {number} options.timeout - Max wait time in ms (default: 5000)
 * @param {*} options.expectedArgs - Expected arguments
 * @returns {Promise<void>}
 *
 * @example
 * const onSave = vi.fn();
 * render(<Form onSave={onSave} />);
 * await userEvent.click(saveButton);
 * await waitForCallback(onSave);
 */
export async function waitForCallback(callback, options = {}) {
  const { timeout = 5000, expectedArgs = null } = options;

  if (typeof callback !== 'function') {
    throw new Error('waitForCallback: callback must be a function');
  }

  const initialCalls = callback.mock?.calls?.length || 0;

  await waitFor(
    () => {
      const called = (callback.mock?.calls?.length || 0) > initialCalls;
      expect(called).toBe(true);

      if (expectedArgs) {
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining(expectedArgs),
        );
      }
    },
    { timeout },
  );
}

/**
 * Wait for element attribute to change
 * @param {HTMLElement} element - Element to watch
 * @param {string} attributeName - Attribute name to watch
 * @param {string|RegExp} expectedValue - Expected attribute value
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * const button = screen.getByRole('button', { name: /save/i });
 * await userEvent.click(button);
 * await waitForAttributeChange(button, 'disabled', 'true');
 */
export async function waitForAttributeChange(
  element,
  attributeName,
  expectedValue,
  timeout = 5000,
) {
  if (!element) {
    throw new Error('waitForAttributeChange: element is required');
  }

  await waitFor(
    () => {
      const currentValue = element.getAttribute(attributeName);
      const expected =
        expectedValue instanceof RegExp
          ? expectedValue.test(currentValue)
          : currentValue === expectedValue;

      expect(expected).toBe(true);
    },
    { timeout },
  );
}

/**
 * Create a simple timer for measuring operation time
 * @returns {Object} Timer object with elapsed(), reset(), mark() methods
 *
 * @example
 * const timer = createTimer();
 * await performOperation();
 * console.log(`Operation took ${timer.elapsed()}ms`);
 *
 * // With checkpoints
 * timer.mark('start');
 * await operation1();
 * timer.mark('checkpoint1');
 * await operation2();
 * console.log(timer.elapsed('checkpoint1')); // Time from start to checkpoint1
 */
export function createTimer() {
  return {
    startTime: Date.now(),
    marks: {},

    /**
     * Get elapsed time in milliseconds
     * @param {string} markName - Optional mark name to measure from
     * @returns {number} Milliseconds elapsed
     */
    elapsed(markName = null) {
      if (markName && this.marks[markName]) {
        return this.marks[markName] - this.startTime;
      }
      return Date.now() - this.startTime;
    },

    /**
     * Reset timer to current time
     * @returns {Object} This timer object
     */
    reset() {
      this.startTime = Date.now();
      this.marks = {};
      return this;
    },

    /**
     * Create a checkpoint mark
     * @param {string} name - Mark name
     * @returns {Object} This timer object
     */
    mark(name) {
      this.marks[name] = Date.now();
      return this;
    },

    /**
     * Get all marks
     * @returns {Object} Marks object
     */
    getMarks() {
      return { ...this.marks };
    },
  };
}
