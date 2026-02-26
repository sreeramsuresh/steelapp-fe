/**
 * Component Test Setup Utilities
 * Provides common utilities for testing React components
 * Phase 5.3 Infrastructure
 */

import { configureStore } from "@reduxjs/toolkit";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

/**
 * Create a mock Redux store for component testing
 * @param {Object} initialState - Initial state overrides
 * @returns {Object} Mock Redux store
 */
export function createMockStore(initialState = {}) {
  const defaultState = {
    auth: {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        companyId: "company-123",
      },
      isAuthenticated: true,
      token: "mock-jwt-token",
    },
    company: {
      id: "company-123",
      name: "Test Company",
      trn: "12345678901234",
    },
    ui: {
      sidebarOpen: true,
      darkMode: false,
    },
    ...initialState,
  };

  return configureStore({
    reducer: {
      auth: (state = defaultState.auth) => state,
      company: (state = defaultState.company) => state,
      ui: (state = defaultState.ui) => state,
    },
    preloadedState: defaultState,
  });
}

/**
 * Render component with common providers (Router, Redux)
 * @param {React.ReactElement} component - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.store - Redux store
 * @param {string} options.initialRoute - Initial route path
 * @param {Object} options.reduxState - Redux state overrides
 * @returns {Object} Render result + utilities
 */
export function renderWithProviders(component, options = {}) {
  const { store = createMockStore(options.reduxState), initialRoute = "/", ...renderOptions } = options;

  // Set up router initial entry
  window.history.pushState({}, "Test page", initialRoute);

  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return {
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
}

/**
 * User interaction helper
 * @returns {Object} User event utilities
 */
export function setupUser() {
  return userEvent.setup();
}

/**
 * Wait for element with timeout
 * @param {Function} callback - Callback to check condition
 * @param {Object} options - Wait options
 * @returns {Promise}
 */
export async function waitForCondition(callback, options = {}) {
  const { timeout = 1000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  throw new Error("Condition not met within timeout");
}

/**
 * Get form field value
 * @param {HTMLElement} container - Form container
 * @param {string} fieldName - Field name or label
 * @returns {string} Field value
 */
export function getFieldValue(container, fieldName) {
  const input = container.querySelector(`[name="${fieldName}"]`);
  return input ? input.value : null;
}

/**
 * Fill form field
 * @param {HTMLElement} container - Form container
 * @param {string} fieldName - Field name
 * @param {string} value - Value to fill
 * @param {Object} user - User event object
 */
export async function fillField(container, fieldName, value, user) {
  const input = container.querySelector(`[name="${fieldName}"]`);
  if (!input) {
    throw new Error(`Field not found: ${fieldName}`);
  }
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Submit form by button text
 * @param {HTMLElement} container - Form container
 * @param {string} buttonText - Button text to click
 * @param {Object} user - User event object
 */
export async function submitForm(container, buttonText, user) {
  const button = within(container).getByRole("button", {
    name: new RegExp(buttonText, "i"),
  });
  await user.click(button);
}

/**
 * Check if element is disabled
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
export function isDisabled(element) {
  return element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
}

/**
 * Mock service call
 * @param {Function} serviceFunction - Service function to mock
 * @param {any} returnValue - Return value
 * @returns {Function} Mocked function
 */
export function mockService(_serviceFunction, returnValue) {
  return vi.fn().mockResolvedValue(returnValue);
}

/**
 * Mock service call that rejects
 * @param {Function} serviceFunction - Service function to mock
 * @param {Error} error - Error to throw
 * @returns {Function} Mocked function
 */
export function mockServiceError(_serviceFunction, error) {
  return vi.fn().mockRejectedValue(error);
}

/**
 * Mock local storage
 * @returns {Object} Mock storage utilities
 */
export function mockLocalStorage() {
  const store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    },
  };
}

/**
 * Create mock component props with sensible defaults
 * @param {Object} overrides - Props to override
 * @returns {Object} Mock props
 */
export function createMockProps(overrides = {}) {
  return {
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    onChange: vi.fn(),
    onClick: vi.fn(),
    ...overrides,
  };
}

/**
 * Test accessibility: Check aria-label or aria-labelledby
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
export function hasAccessibleLabel(element) {
  return element.hasAttribute("aria-label") || element.hasAttribute("aria-labelledby");
}

/**
 * Test accessibility: Check for required role
 * @param {HTMLElement} container - Container
 * @param {string} role - Required role
 * @param {Object} options - Query options
 * @returns {HTMLElement|null}
 */
export function findByRole(container, role, options = {}) {
  try {
    return within(container).getByRole(role, options);
  } catch {
    return null;
  }
}

export default {
  createMockStore,
  renderWithProviders,
  setupUser,
  waitForCondition,
  getFieldValue,
  fillField,
  submitForm,
  isDisabled,
  mockService,
  mockServiceError,
  mockLocalStorage,
  createMockProps,
  hasAccessibleLabel,
  findByRole,
};
