import '@testing-library/jest-dom';
import { afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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

global.localStorage = createLocalStorageMock();

// Reset storage before each test
beforeEach(() => {
  storage = {};
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
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}
