/**
 * State Assertion Utilities
 *
 * Helpers for asserting observable state changes after button interactions.
 * Focuses on DOM-visible changes: modals, toasts, errors, data changes, navigation.
 *
 * Usage:
 * ```javascript
 * import { assertModalOpens, assertSuccessToast } from '@/test/utils';
 *
 * await clickAndWait(button, {
 *   waitFor: () => assertModalOpens(/create item/i)
 * });
 *
 * await assertSuccessToast(/saved successfully/i);
 * ```
 */

import { screen, within, waitFor } from "@testing-library/react";
import { expect } from "vitest";

/**
 * Assert modal/dialog opens with optional title check
 * @param {string|RegExp} titleRegex - Optional expected modal title
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Modal element
 * @throws {Error} If modal doesn't appear
 *
 * @example
 * const modal = await assertModalOpens(/create customer/i);
 * expect(within(modal).getByRole('textbox')).toBeInTheDocument();
 */
export async function assertModalOpens(titleRegex = null, timeout = 5000) {
  let modal;

  await waitFor(
    () => {
      modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();

      if (titleRegex) {
        const title = within(modal).queryByText(titleRegex);
        expect(title).toBeInTheDocument();
      }
    },
    { timeout },
  );

  return modal;
}

/**
 * Assert modal/dialog closes
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 * @throws {Error} If modal doesn't close
 *
 * @example
 * await clickButton(closeButton);
 * await assertModalCloses();
 */
export async function assertModalCloses(timeout = 5000) {
  await waitFor(
    () => {
      const modal = screen.queryByRole("dialog");
      expect(modal).not.toBeInTheDocument();
    },
    { timeout },
  );
}

/**
 * Assert toast/notification appears with message and type
 * @param {string|RegExp} messageRegex - Toast message pattern
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info' (optional)
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Toast element
 * @throws {Error} If toast doesn't appear
 *
 * @example
 * await assertToastAppears(/saved successfully/i, 'success');
 * await assertToastAppears(/error occurred/i, 'error', 3000);
 */
export async function assertToastAppears(
  messageRegex,
  type = null,
  timeout = 5000,
) {
  let toast;

  await waitFor(
    () => {
      const messagePattern =
        messageRegex instanceof RegExp
          ? messageRegex
          : new RegExp(messageRegex, "i");

      // Try multiple toast selectors
      let toasts = screen.queryAllByRole("status");

      if (toasts.length === 0) {
        // Try custom toast selectors
        toasts = Array.from(
          document.querySelectorAll(
            '[class*="toast"], [class*="notification"], [class*="alert"], [role="alert"]',
          ),
        );
      }

      if (toasts.length === 0) {
        throw new Error("No toasts found");
      }

      toast = toasts.find((t) => messagePattern.test(t.textContent));

      expect(toast).toBeDefined();
      expect(toast).toBeInTheDocument();

      if (type) {
        // Check for type indicators (icon, class, data-type attribute)
        const hasTypeClass = toast.className.includes(type);
        const hasTypeAttr = toast.getAttribute("data-type") === type;
        const hasTypeIcon = toast.querySelector(
          `[data-type="${type}"], [class*="${type}"]`,
        );

        if (!hasTypeClass && !hasTypeAttr && !hasTypeIcon) {
          throw new Error(
            `Toast type "${type}" not found. Toast classes: ${toast.className}`,
          );
        }
      }
    },
    { timeout },
  );

  return toast;
}

/**
 * Assert success toast appears
 * @param {string|RegExp} messageRegex - Toast message pattern
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Toast element
 *
 * @example
 * await assertSuccessToast(/saved/i);
 */
export async function assertSuccessToast(messageRegex, timeout = 5000) {
  return assertToastAppears(messageRegex, "success", timeout);
}

/**
 * Assert error toast appears
 * @param {string|RegExp} messageRegex - Toast message pattern
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Toast element
 *
 * @example
 * await assertErrorToast(/failed to save/i);
 */
export async function assertErrorToast(messageRegex, timeout = 5000) {
  return assertToastAppears(messageRegex, "error", timeout);
}

/**
 * Assert form validation error appears for field
 * @param {string|RegExp} fieldNameOrLabel - Field name or label
 * @param {string|RegExp} errorMessage - Expected error text
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Error element
 * @throws {Error} If error doesn't appear
 *
 * @example
 * await assertFormErrorAppears('Email', /invalid email/i);
 */
export async function assertFormErrorAppears(
  fieldNameOrLabel,
  errorMessage,
  timeout = 5000,
) {
  let error;

  await waitFor(
    () => {
      // Try to find field by label
      let field;
      try {
        field = screen.getByLabelText(new RegExp(fieldNameOrLabel, "i"));
      } catch {
        // Try by placeholder
        field = screen.getByPlaceholderText(new RegExp(fieldNameOrLabel, "i"));
      }

      // Look for error sibling or parent error message
      let errorElement = field?.parentElement?.querySelector(
        '[role="alert"], .error, .text-red-500',
      );

      if (!errorElement) {
        errorElement = screen.getByText(new RegExp(errorMessage, "i"));
      }

      expect(errorElement).toBeInTheDocument();
      error = errorElement;
    },
    { timeout },
  );

  return error;
}

/**
 * Assert form validation error disappears for field
 * @param {string|RegExp} fieldNameOrLabel - Field name or label
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * await fillForm({ email: 'valid@example.com' });
 * await assertFormErrorDisappears('Email');
 */
export async function assertFormErrorDisappears(
  fieldNameOrLabel,
  timeout = 5000,
) {
  await waitFor(
    () => {
      // Try to find field
      let field;
      try {
        field = screen.getByLabelText(new RegExp(fieldNameOrLabel, "i"));
      } catch {
        field = screen.getByPlaceholderText(new RegExp(fieldNameOrLabel, "i"));
      }

      // Confirm error is gone
      const errorElement = field?.parentElement?.querySelector(
        '[role="alert"], .error, .text-red-500',
      );
      expect(errorElement).not.toBeInTheDocument();
    },
    { timeout },
  );
}

/**
 * Assert form field has expected value
 * @param {string|RegExp} fieldNameOrLabel - Field name or label
 * @param {string} expectedValue - Expected field value
 * @throws {Error} If value doesn't match
 *
 * @example
 * await assertFormFieldValue('Amount', '500');
 */
export function assertFormFieldValue(fieldNameOrLabel, expectedValue) {
  let field;

  try {
    field = screen.getByLabelText(new RegExp(fieldNameOrLabel, "i"));
  } catch {
    try {
      field = screen.getByPlaceholderText(new RegExp(fieldNameOrLabel, "i"));
    } catch {
      field = screen.getByDisplayValue(expectedValue);
    }
  }

  expect(field).toHaveValue(expectedValue);
}

/**
 * Assert list/table item is added
 * @param {string|RegExp} itemMatcher - Text or pattern matching item content
 * @param {HTMLElement} container - Container to search in (default: screen)
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Item element
 *
 * @example
 * await assertListItemAdded(/New Customer/i);
 */
export async function assertListItemAdded(
  itemMatcher,
  container = screen,
  timeout = 5000,
) {
  let item;

  await waitFor(
    () => {
      const itemPattern =
        itemMatcher instanceof RegExp
          ? itemMatcher
          : new RegExp(itemMatcher, "i");

      item = container.getByText(itemPattern);
      expect(item).toBeInTheDocument();
    },
    { timeout },
  );

  return item;
}

/**
 * Assert list/table item is removed
 * @param {string|RegExp} itemMatcher - Text or pattern matching item content
 * @param {HTMLElement} container - Container to search in (default: screen)
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * await assertListItemRemoved(/Old Customer/i);
 */
export async function assertListItemRemoved(
  itemMatcher,
  container = screen,
  timeout = 5000,
) {
  await waitFor(
    () => {
      const itemPattern =
        itemMatcher instanceof RegExp
          ? itemMatcher
          : new RegExp(itemMatcher, "i");

      const item = container.queryByText(itemPattern);
      expect(item).not.toBeInTheDocument();
    },
    { timeout },
  );
}

/**
 * Assert table row count matches expected value
 * @param {number} expectedCount - Expected row count
 * @param {string} operator - Comparison: '=', '>', '<', '>=', '<=' (default: '=')
 * @param {string} tableSelector - CSS selector for table (default: 'table')
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Table element
 *
 * @example
 * await assertTableRowCountChanges(5);
 * await assertTableRowCountChanges(3, '>=');  // At least 3 rows
 */
export async function assertTableRowCountChanges(
  expectedCount,
  operator = "=",
  tableSelector = "table",
  timeout = 5000,
) {
  let table;

  await waitFor(
    () => {
      table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      // Only subtract 1 if there's a header row
      const hasHeader = table.querySelector("thead");
      const count = hasHeader ? rows.length - 1 : rows.length;

      let condition;
      switch (operator) {
        case ">":
          condition = count > expectedCount;
          break;
        case "<":
          condition = count < expectedCount;
          break;
        case ">=":
          condition = count >= expectedCount;
          break;
        case "<=":
          condition = count <= expectedCount;
          break;
        default:
          condition = count === expectedCount;
      }

      expect(condition).toBe(true);
    },
    { timeout },
  );

  return table;
}

/**
 * Assert table contains row with specific text
 * @param {string|RegExp} textMatcher - Text to find in row
 * @param {string|RegExp} columnName - Optional: specific column to search in
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Row element
 *
 * @example
 * await assertTableContainsRow(/Product A/i);
 * await assertTableContainsRow('100.00', 'Price');  // Find in Price column
 */
export async function assertTableContainsRow(
  textMatcher,
  columnName = null,
  timeout = 5000,
) {
  let row;

  await waitFor(
    () => {
      const table = screen.getByRole("table");
      const textPattern =
        textMatcher instanceof RegExp
          ? textMatcher
          : new RegExp(textMatcher, "i");

      let rows = within(table).getAllByRole("row");

      if (columnName) {
        // Filter by column header
        const columnRegex = new RegExp(columnName, "i");
        const headers = within(table).getAllByRole("columnheader");
        const columnIndex = headers.findIndex((h) =>
          columnRegex.test(h.textContent),
        );

        if (columnIndex >= 0) {
          rows = rows.filter((r) => {
            const cells = within(r).queryAllByRole("cell");
            return (
              cells[columnIndex] &&
              textPattern.test(cells[columnIndex].textContent)
            );
          });
        }
      } else {
        rows = rows.filter((r) => textPattern.test(r.textContent));
      }

      expect(rows.length).toBeGreaterThan(0);
      row = rows[0];
    },
    { timeout },
  );

  return row;
}

/**
 * Assert loading state changed from one state to another
 * @param {boolean} fromLoading - Initial loading state
 * @param {boolean} toLoading - Expected loading state
 * @param {string} loadingSelector - Element selector showing loading state
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * await assertLoadingStateChanges(false, true);  // Not loading -> loading
 * await assertLoadingStateChanges(true, false);  // Loading -> not loading
 */
export async function assertLoadingStateChanges(
  fromLoading,
  toLoading,
  loadingSelector = '[class*="loading"], [class*="spinner"]',
  timeout = 5000,
) {
  await waitFor(
    () => {
      const loadingElement =
        screen.queryByRole("progressbar") ||
        screen.queryByText(/loading/i) ||
        document.querySelector(loadingSelector);

      if (toLoading) {
        expect(loadingElement).toBeInTheDocument();
      } else {
        expect(loadingElement).not.toBeInTheDocument();
      }
    },
    { timeout },
  );
}

/**
 * Wait for loading to complete (loading spinner/text disappears)
 * @param {number} timeout - Max wait time in ms (default: 10000)
 * @returns {Promise<void>}
 *
 * @example
 * render(<DataList />);
 * await waitForLoadingComplete();
 * expect(screen.getByText(/Item 1/i)).toBeInTheDocument();
 */
export async function waitForLoadingComplete(timeout = 10000) {
  await waitFor(
    () => {
      const loading =
        screen.queryByRole("progressbar") || screen.queryByText(/loading/i);
      expect(loading).not.toBeInTheDocument();
    },
    { timeout },
  );
}

/**
 * Assert navigation occurred (URL changed)
 * @param {string|RegExp} pathPattern - Expected path pattern
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * await assertNavigationOccurred(/invoices/i);
 */
export async function assertNavigationOccurred(pathPattern, timeout = 5000) {
  await waitFor(
    () => {
      const pathRegex =
        pathPattern instanceof RegExp
          ? pathPattern
          : new RegExp(pathPattern, "i");
      expect(window.location.pathname).toMatch(pathRegex);
    },
    { timeout },
  );
}

/**
 * Assert generic state change by checking a getter function
 * @param {Function} stateGetter - Function returning current state value
 * @param {*} expectedValue - Expected state value
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<void>}
 *
 * @example
 * let formData = { name: '' };
 * await assertStateChange(() => formData.name, 'John');
 */
export async function assertStateChange(
  stateGetter,
  expectedValue,
  timeout = 5000,
) {
  if (typeof stateGetter !== "function") {
    throw new Error("assertStateChange: stateGetter must be a function");
  }

  await waitFor(
    () => {
      const currentValue = stateGetter();
      expect(currentValue).toEqual(expectedValue);
    },
    { timeout },
  );
}
