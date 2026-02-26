import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Mock localStorage with actual storage behavior
let storage = {};

function createLocalStorageMock() {
  return {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index) => Object.keys(storage)[index] || null,
  };
}

Object.defineProperty(window, "localStorage", { value: createLocalStorageMock(), writable: true });

// Mock sessionStorage with actual storage behavior
let sessionStorageData = {};

function createSessionStorageMock() {
  return {
    getItem: (key) => sessionStorageData[key] || null,
    setItem: (key, value) => {
      sessionStorageData[key] = String(value);
    },
    removeItem: (key) => {
      delete sessionStorageData[key];
    },
    clear: () => {
      sessionStorageData = {};
    },
    get length() {
      return Object.keys(sessionStorageData).length;
    },
    key: (index) => Object.keys(sessionStorageData)[index] || null,
  };
}

Object.defineProperty(window, "sessionStorage", { value: createSessionStorageMock(), writable: true });

// Reset storage before each test
beforeEach(() => {
  storage = {};
  sessionStorageData = {};
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  storage = {};
});

// Make vi globally available (for mocking)
global.vi = vi;

// Polyfill for scrollIntoView (JSDOM doesn't implement this)
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
