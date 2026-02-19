/**
 * Button Test Utilities
 *
 * Provides semantic, reusable helpers for finding and interacting with buttons
 * in React Testing Library tests. Supports both native <button> and shadcn <Button> components.
 *
 * Usage:
 * ```javascript
 * import { findButtonByRole, clickAndWait, assertButtonEnabled } from '@/test/utils';
 *
 * it('Save button causes observable state change', async () => {
 *   render(<Form />);
 *   const saveButton = findButtonByRole('Save Draft');
 *   await assertButtonEnabled(saveButton);
 *   await clickAndWait(saveButton, {
 *     waitFor: () => assertSuccessToast(/saved/i)
 *   });
 * });
 * ```
 */

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Find button by semantic role and accessible name
 * @param {string|RegExp} name - Button accessible name (text, aria-label, etc.)
 * @param {Object} options - Query options
 * @param {HTMLElement} options.within - Container to search within (default: screen)
 * @param {string} options.variant - shadcn variant to filter by (e.g., 'destructive')
 * @param {boolean} options.disabled - Filter by disabled state
 * @param {boolean} options.throwError - Throw error if not found (default: true)
 * @returns {HTMLElement|null} Button element or null if throwError is false
 * @throws {Error} If button not found and throwError is true
 *
 * @example
 * const saveButton = findButtonByRole('Save');
 * const deleteButton = findButtonByRole('Delete', { variant: 'destructive' });
 * const disabledButton = findButtonByRole('Submit', { disabled: true });
 * const maybeButton = findButtonByRole('Delete', { throwError: false });
 */
export function findButtonByRole(name, options = {}) {
  const { within: container = screen, variant = null, disabled = null, throwError = true } = options;
  const nameRegex = name instanceof RegExp ? name : new RegExp(name, "i");

  try {
    const buttons = container.getAllByRole("button", { name: nameRegex });

    if (buttons.length === 0) {
      throw new Error(`Button with name "${name}" not found`);
    }

    let filtered = buttons;

    if (variant) {
      filtered = buttons.filter((btn) => btn.className.includes(variant));
    }

    if (disabled !== null) {
      filtered = filtered.filter((btn) => btn.disabled === disabled);
    }

    if (filtered.length === 0) {
      throw new Error(
        `Button with name "${name}"${variant ? ` and variant "${variant}"` : ""}${disabled !== null ? ` with disabled=${disabled}` : ""} not found`
      );
    }

    return filtered[0];
  } catch (error) {
    if (!throwError) {
      return null;
    }
    throw new Error(`findButtonByRole failed: ${error.message}`);
  }
}

/**
 * Find all buttons matching optional criteria
 * @param {Object} options - Filter options
 * @param {HTMLElement} options.within - Container to search within
 * @param {string|RegExp} options.name - Filter by name pattern
 * @returns {HTMLElement[]} Array of button elements
 */
export function findAllButtons(options = {}) {
  const { within: container = screen, name = null } = options;

  let buttons = container.queryAllByRole("button");

  if (name) {
    const regex = name instanceof RegExp ? name : new RegExp(name, "i");
    buttons = buttons.filter((btn) => regex.test(btn.textContent));
  }

  return buttons;
}

/**
 * Click a button using userEvent (realistic user interaction)
 * @param {HTMLElement} button - Button element to click
 * @param {Object} options - Click options
 * @param {number} options.delay - Delay between mouse down and up (ms)
 * @returns {Promise<void>}
 *
 * @example
 * const button = findButtonByRole('Submit');
 * await clickButton(button);
 */
export async function clickButton(button, options = {}) {
  if (!button) {
    throw new Error("clickButton: button element is required");
  }

  await userEvent.click(button, options);
}

/**
 * Click a button and wait for observable state change
 * @param {HTMLElement} button - Button element to click
 * @param {Object} options - Wait options
 * @param {Function} options.waitFor - Assertion function to wait for (e.g., assertSuccessToast)
 * @param {number} options.timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * await clickAndWait(saveButton, {
 *   waitFor: () => assertSuccessToast(/saved/i),
 *   timeout: 3000
 * });
 */
export async function clickAndWait(button, options = {}) {
  const { waitFor: assertion, timeout = 5000 } = options;

  if (!button) {
    throw new Error("clickAndWait: button element is required");
  }

  if (!assertion) {
    throw new Error("clickAndWait: waitFor assertion function is required");
  }

  await clickButton(button);

  return waitFor(assertion, { timeout });
}

/**
 * Check if button is enabled
 * @param {HTMLElement} button - Button element to check
 * @returns {boolean} True if button is enabled and clickable
 *
 * @example
 * if (isButtonEnabled(button)) {
 *   await clickButton(button);
 * }
 */
export function isButtonEnabled(button) {
  if (!button) return false;
  return !button.disabled;
}

/**
 * Assert button is enabled with optional message
 * @param {HTMLElement} button - Button element to assert
 * @param {string} message - Optional custom error message
 * @throws {Error} If button is disabled
 *
 * @example
 * await assertButtonEnabled(saveButton);
 * await assertButtonEnabled(submitButton, 'Submit button should be enabled');
 */
export function assertButtonEnabled(button, message) {
  if (!button) {
    throw new Error("assertButtonEnabled: button element is required");
  }

  if (button.disabled) {
    throw new Error(message || `Expected button "${button.textContent?.trim()}" to be enabled but it was disabled`);
  }
}

/**
 * Assert button is disabled with optional message
 * @param {HTMLElement} button - Button element to assert
 * @param {string} message - Optional custom error message
 * @throws {Error} If button is enabled
 *
 * @example
 * await assertButtonDisabled(submitButton);
 */
export function assertButtonDisabled(button, message) {
  if (!button) {
    throw new Error("assertButtonDisabled: button element is required");
  }

  if (!button.disabled) {
    throw new Error(message || `Expected button "${button.textContent?.trim()}" to be disabled but it was enabled`);
  }
}

/**
 * Check if button is in loading state
 * Looks for: disabled state, aria-busy, or spinner indicators
 * @param {HTMLElement} button - Button element to check
 * @returns {boolean} True if button appears to be loading
 *
 * @example
 * if (isButtonLoading(submitButton)) {
 *   console.log('Still saving...');
 * }
 */
export function isButtonLoading(button) {
  if (!button) {
    return false;
  }

  // Check for aria-busy attribute
  if (button.getAttribute("aria-busy") === "true") {
    return true;
  }

  // Check for loading indicators (spinner, class, or text)
  const hasLoadingClass = button.className.match(/loading|saving|processing/i);
  const hasSpinner = button.querySelector('[class*="spinner"], [class*="loading-icon"], .animate-spin, svg');
  const hasLoadingText = /loading|saving|processing/i.test(button.textContent);

  // Any of these indicate loading
  if (hasLoadingClass || hasSpinner || hasLoadingText) {
    return true;
  }

  // Also check if button is disabled (common loading state)
  return button.disabled;
}

/**
 * Get button's loading state and indicators
 * @param {HTMLElement} button - Button element
 * @returns {Object} Loading state details
 *
 * @example
 * const state = getButtonLoadingState(button);
 * console.log(state.isLoading, state.hasSpinner, state.hasLoadingText);
 */
export function getButtonLoadingState(button) {
  if (!button) {
    return { isLoading: false, hasSpinner: false, hasLoadingText: false };
  }

  const hasSpinner = !!button.querySelector('[class*="spinner"], [class*="loading-icon"], .animate-spin');
  const hasLoadingText = /loading|saving|processing/i.test(button.textContent);
  const isDisabled = button.disabled;

  return {
    isLoading: isDisabled && (hasSpinner || hasLoadingText),
    isDisabled,
    hasSpinner,
    hasLoadingText,
    text: button.textContent?.trim(),
  };
}

/**
 * Find button in a specific group/section
 * Useful for tables, lists, or grouped buttons
 * @param {string} groupText - Text identifying the group (row header, section, etc.)
 * @param {string} buttonName - Name of button within group
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement} Button element within group
 *
 * @example
 * // Find delete button in "Product A" row
 * const deleteBtn = findButtonInGroup('Product A', 'Delete', screen.getByRole('table'));
 */
export function findButtonInGroup(groupText, buttonName, container = screen) {
  // Find the group/row element
  const groupElement = container.getByText(new RegExp(groupText, "i")).closest('tr, li, div[role="article"]');

  if (!groupElement) {
    throw new Error(`Group with text "${groupText}" not found`);
  }

  // Find button within that group
  return within(groupElement).getByRole("button", {
    name: new RegExp(buttonName, "i"),
  });
}

/**
 * Wait for button to become enabled
 * @param {HTMLElement} button - Button element to wait for
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * await waitForButtonEnabled(submitButton);
 * await clickButton(submitButton);
 */
export async function waitForButtonEnabled(button, timeout = 5000) {
  if (!button) {
    throw new Error("waitForButtonEnabled: button element is required");
  }

  return waitFor(() => assertButtonEnabled(button), { timeout });
}

/**
 * Wait for button to become disabled
 * @param {HTMLElement} button - Button element to wait for
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * await clickButton(button);
 * await waitForButtonDisabled(button); // Wait for API call to start
 */
export async function waitForButtonDisabled(button, timeout = 5000) {
  if (!button) {
    throw new Error("waitForButtonDisabled: button element is required");
  }

  return waitFor(() => assertButtonDisabled(button), { timeout });
}

/**
 * Double-click a button
 * @param {HTMLElement} button - Button element to double-click
 * @returns {Promise<void>}
 *
 * @example
 * await doubleClickButton(button);
 */
export async function doubleClickButton(button) {
  if (!button) {
    throw new Error("doubleClickButton: button element is required");
  }

  await userEvent.dblClick(button);
}

/**
 * Get button's variant class (shadcn Button or custom)
 * @param {HTMLElement} button - Button element
 * @returns {string} Variant name or "default"
 *
 * @example
 * const variant = getButtonVariant(button);
 * console.log(variant); // "destructive"
 */
export function getButtonVariant(button) {
  if (!button) return "default";

  // Check for data-variant attribute
  const dataVariant = button.getAttribute("data-variant");
  if (dataVariant) return dataVariant;

  // Check for shadcn variants in className
  const shadcnVariants = ["default", "destructive", "outline", "secondary", "ghost", "link"];
  const matchedVariant = shadcnVariants.find((v) => button.className.includes(v));
  if (matchedVariant) return matchedVariant;

  // Check for custom variants in className (e.g., "btn-primary", "btn-secondary")
  const customVariantMatch = button.className.match(/btn-(\w+)/);
  if (customVariantMatch) return customVariantMatch[1];

  // Check for single-word variants in className (e.g., "primary", "secondary")
  const singleWordMatch = button.className.match(/\b(primary|secondary|success|danger|warning|info|light|dark)\b/);
  if (singleWordMatch) return singleWordMatch[1];

  return "default";
}
