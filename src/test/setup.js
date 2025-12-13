import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Make vi globally available (for mocking)
global.vi = vi;

// Polyfill for scrollIntoView (JSDOM doesn't implement this)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}
