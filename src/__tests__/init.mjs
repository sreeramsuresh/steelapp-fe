/**
 * Test Initialization Module
 *
 * This module must be imported FIRST in any test file to set up
 * the Node.js environment for testing Vite-based code.
 */

// Polyfill import.meta.env for tests
// Store on globalThis so all modules can access it
globalThis.__VITE_ENV__ = {
  DEV: true,
  PROD: false,
  SSR: false,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  VITE_DISABLE_CONTRACT_VALIDATION: 'true',
  MODE: 'test',
};

// Also try to set on this module's import.meta
try {
  Object.defineProperty(import.meta, 'env', {
    value: globalThis.__VITE_ENV__,
    writable: true,
    configurable: true,
  });
} catch (e) {
  // Ignore if can't set
}

// Polyfill global browser objects for Node environment
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

globalThis.sessionStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

globalThis.window = {
  location: {
    href: 'http://localhost:3000',
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  localStorage,
  sessionStorage,
  URL: {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {},
  },
  fetch: async () => {
    throw new Error('fetch() should not be called in tests. Use apiClient or stubs instead.');
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  navigator: {
    userAgent: 'Mozilla/5.0 (Node.js)',
  },
};

globalThis.document = {
  createElement: (tag) => ({
    id: '',
    className: '',
    style: {},
    dataset: {},
    attributes: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: () => {},
    removeChild: () => {},
    click: () => {},
    focus: () => {},
    blur: () => {},
    setAttribute: function(name, value) {
      this.attributes[name] = value;
    },
    getAttribute: function(name) {
      return this.attributes[name] || null;
    },
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
    classList: {
      add: () => {},
      remove: () => {},
    },
  },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({}),
};

// URL and fetch are already defined in window mock above

console.log('[Test Init] Node test environment configured');

// Browser API mocks for component tests
if (typeof global !== 'undefined' && !global.window) {
  global.window = {
    confirm: () => true,
    alert: () => {},
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
  };
}
