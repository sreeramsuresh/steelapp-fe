/**
 * Test Helpers for Node Native Test Runner
 *
 * Provides common mocking and assertion utilities for converting vitest tests
 * to Node's native test runner with sinon.
 */

import sinon from 'sinon';
import assert from 'node:assert';

/**
 * Create a mock API client with stubbed methods
 * @returns {Object} Mock API client with get, post, put, patch, delete methods
 */
export const createMockApiClient = () => ({
  get: sinon.stub().resolves({}),
  post: sinon.stub().resolves({}),
  put: sinon.stub().resolves({}),
  patch: sinon.stub().resolves({}),
  delete: sinon.stub().resolves({}),
  setAuthHeader: sinon.stub(),
  removeAuthHeader: sinon.stub(),
});

/**
 * Create a mock token utilities object
 * @returns {Object} Mock token utility functions
 */
export const createMockTokenUtils = () => ({
  setToken: sinon.stub(),
  getToken: sinon.stub().returns(null),
  setRefreshToken: sinon.stub(),
  getRefreshToken: sinon.stub().returns(null),
  setUser: sinon.stub(),
  getUser: sinon.stub().returns(null),
  removeTokens: sinon.stub(),
  removeUser: sinon.stub(),
  removeAuthToken: sinon.stub(),
  setAuthToken: sinon.stub(),
});

/**
 * Create a mock localStorage for testing
 * @returns {Object} Mock localStorage with get/set/remove items
 */
export const createMockLocalStorage = () => {
  let store = {};
  return {
    getItem: sinon.stub().callsFake((key) => store[key] || null),
    setItem: sinon.stub().callsFake((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: sinon.stub().callsFake((key) => {
      delete store[key];
    }),
    clear: sinon.stub().callsFake(() => {
      store = {};
    }),
  };
};

/**
 * Assert that a stub was called with specific arguments
 * @param {Object} stub Sinon stub
 * @param {Array} args Expected arguments
 */
export const assertCalledWith = (stub, args) => {
  assert.ok(
    stub.calledWith(...args),
    `Expected stub to be called with ${JSON.stringify(args)}, but was called with ${
      stub.lastCall ? JSON.stringify(stub.lastCall.args) : 'never'
    }`
  );
};

/**
 * Assert that a stub was called with specific arguments at a specific call
 * @param {Object} stub Sinon stub
 * @param {number} callIndex Index of the call to check (0-based)
 * @param {Array} args Expected arguments
 */
export const assertCalledWithAt = (stub, callIndex, args) => {
  assert.ok(
    stub.getCall(callIndex)?.calledWith(...args),
    `Expected stub call #${callIndex} to be called with ${JSON.stringify(args)}, but was called with ${
      stub.getCall(callIndex) ? JSON.stringify(stub.getCall(callIndex).args) : 'never'
    }`
  );
};

/**
 * Assert that an object has a property with a specific value
 * @param {Object} obj Object to check
 * @param {string} property Property name
 * @param {*} expectedValue Expected value
 */
export const assertProperty = (obj, property, expectedValue) => {
  assert.strictEqual(
    obj[property],
    expectedValue,
    `Expected property '${property}' to be ${JSON.stringify(expectedValue)}, but was ${JSON.stringify(obj[property])}`
  );
};

/**
 * Assert that a value is truthy
 * @param {*} value Value to check
 * @param {string} message Error message
 */
export const assertTrue = (value, message = 'Expected value to be truthy') => {
  assert.ok(value, message);
};

/**
 * Assert that a value is falsy
 * @param {*} value Value to check
 * @param {string} message Error message
 */
export const assertFalse = (value, message = 'Expected value to be falsy') => {
  assert.ok(!value, message);
};

/**
 * Assert that a value is deep equal to another
 * @param {*} actual Actual value
 * @param {*} expected Expected value
 * @param {string} message Error message
 */
export const assertDeepEqual = (actual, expected, message = '') => {
  assert.deepStrictEqual(actual, expected, message);
};

/**
 * Assert that a Promise rejects with a specific error
 * @param {Promise} promise Promise to test
 * @param {string|RegExp} errorMatcher Expected error message or pattern
 */
export async function assertRejects(promise, errorMatcher) {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (typeof errorMatcher === 'string') {
      assert.ok(
        error.message.includes(errorMatcher),
        `Expected error message to include '${errorMatcher}', but got '${error.message}'`
      );
    } else if (errorMatcher instanceof RegExp) {
      assert.ok(
        errorMatcher.test(error.message),
        `Expected error message to match ${errorMatcher}, but got '${error.message}'`
      );
    } else {
      throw error;
    }
  }
}

/**
 * Reset all stubs in a mock object
 * @param {Object} mockObj Object containing stubs
 */
export const resetMocks = (mockObj) => {
  Object.values(mockObj).forEach((stub) => {
    if (sinon.Stub && sinon.Stub.prototype.isPrototypeOf(stub)) {
      stub.resetHistory();
    }
  });
};

/**
 * Restore all stubs (cleanup)
 */
export const restoreStubs = () => {
  sinon.restore();
};
