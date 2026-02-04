# Frontend Test Conversion Guide: Vitest → Node Native Test Runner

**Status:** Phase 5 Frontend Test Conversion (18/70+ tests converted)

This guide documents the pattern for converting vitest tests to Node's native test runner with sinon mocking.

---

## Why Migrate from Vitest to Node Native Test Runner?

### Problem with Vitest/Jest
- ❌ Hanging indefinitely during module load (~6+ minutes timeout)
- ❌ tsserver processes consuming resources
- ❌ Module transpilation overhead
- ❌ Complex configuration needed

### Solution: Node Native Test Runner
- ✅ Built-in to Node.js 18+ (available as `node --test`)
- ✅ No transpilation needed (native ES modules)
- ✅ Fast execution (18 tests in ~33 seconds)
- ✅ Minimal dependencies (just sinon for mocking)
- ✅ No hanging or timeout issues

---

## Conversion Steps

### 1. File Naming & Extension
```bash
# Before
src/services/__tests__/authService.test.js

# After
src/services/__tests__/authService.test.mjs
```

Change `.js` to `.mjs` to explicitly signal ES modules.

### 2. Import Environment Setup
Add at the very top of each test file:

```javascript
// Initialize test environment first
import '../../__tests__/init.mjs';
```

This provides:
- `import.meta.env` polyfill for Vite compatibility
- Browser API mocks (localStorage, sessionStorage, window, document)
- Global configuration for testing

### 3. Update Test Framework Imports

**Before (Vitest):**
```javascript
import { beforeEach, describe, expect, test, vi } from "vitest";
```

**After (Node Native):**
```javascript
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
```

### 4. Replace vi.mock() with Sinon Stubs

**Before (Vitest):**
```javascript
vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "../api.js";
```

**After (Node + Sinon):**
```javascript
import { api } from "../api.js";

// Later, in beforeEach or individual test:
beforeEach(() => {
  sinon.stub(api, 'get').resolves({ data: [] });
  sinon.stub(api, 'post').resolves({ data: {} });
});

// Don't forget to restore!
afterEach(() => {
  sinon.restore();
});
```

Or use our helper:
```javascript
import { createMockApiClient } from './test-helpers.mjs';

beforeEach(() => {
  mockApi = createMockApiClient();
  sinon.stub(api, 'get').callsFake((url) => mockApi.get(url));
});
```

### 5. Convert Assertions

**Before (Vitest with expect):**
```javascript
expect(result).toHaveLength(2);
expect(result.rate).toBe(3.67);
expect(result).toEqual(mockRates);
expect(api.get).toHaveBeenCalledWith("/exchange-rates");
expect(api.get).toHaveBeenCalled();
```

**After (Node assert):**
```javascript
assert.strictEqual(result.length, 2);
assert.strictEqual(result.rate, 3.67);
assert.deepStrictEqual(result, mockRates);
assert.ok(api.get.calledWith("/exchange-rates"));
assert.ok(api.get.called);
```

**Common Assertion Conversions:**

| Vitest | Node assert + Sinon |
|--------|-------------------|
| `expect(value).toBe(expected)` | `assert.strictEqual(value, expected)` |
| `expect(value).toEqual(expected)` | `assert.deepStrictEqual(value, expected)` |
| `expect(array).toHaveLength(n)` | `assert.strictEqual(array.length, n)` |
| `expect(obj).toHaveProperty(key)` | `assert.ok(obj.hasOwnProperty(key))` |
| `expect(value).toBeTruthy()` | `assert.ok(value)` |
| `expect(value).toBeFalsy()` | `assert.ok(!value)` |
| `expect(fn).toHaveBeenCalled()` | `assert.ok(fn.called)` |
| `expect(fn).toHaveBeenCalledWith(...args)` | `assert.ok(fn.calledWith(...args))` |
| `expect(promise).rejects.toThrow()` | `assert.rejects(promise, Error)` or `try/catch` |

### 6. Cleanup Between Tests

**Before (Vitest):**
```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

**After (Node + Sinon):**
```javascript
import { afterEach } from 'node:test';

afterEach(() => {
  sinon.restore(); // Restore all stubs
});
```

Or use a helper:
```javascript
import { resetMocks, restoreStubs } from './test-helpers.mjs';

beforeEach(() => {
  resetMocks(mockObj);
});

afterEach(() => {
  restoreStubs();
});
```

---

## Example: Complete Conversion

### Before (Vitest)

```javascript
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import userService from "../userService.js";

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should fetch users", async () => {
    const mockUsers = [{ id: 1, name: "John" }];
    apiClient.get.mockResolvedValueOnce({ data: mockUsers });

    const result = await userService.getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("John");
    expect(apiClient.get).toHaveBeenCalledWith("/users");
  });

  test("should handle errors", async () => {
    apiClient.get.mockRejectedValueOnce(new Error("Network error"));

    await expect(userService.getUsers()).rejects.toThrow("Network error");
  });
});
```

### After (Node Native + Sinon)

```javascript
// Initialize test environment first
import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from "../api.js";
import userService from "../userService.js";

describe("userService", () => {
  beforeEach(() => {
    // Create stubs for each test
    sinon.stub(apiClient, 'get').resolves({ data: [] });
    sinon.stub(apiClient, 'post').resolves({ data: {} });
  });

  afterEach(() => {
    // Restore all stubs between tests
    sinon.restore();
  });

  test("should fetch users", async () => {
    const mockUsers = [{ id: 1, name: "John" }];
    apiClient.get.resolves({ data: mockUsers });

    const result = await userService.getUsers();

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, "John");
    assert.ok(apiClient.get.calledWith("/users"));
  });

  test("should handle errors", async () => {
    apiClient.get.rejects(new Error("Network error"));

    try {
      await userService.getUsers();
      assert.fail("Expected error to be thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Network error");
    }
  });
});
```

---

## Available Test Helpers

See `src/services/__tests__/test-helpers.mjs` for utilities:

```javascript
import {
  createMockApiClient,        // Returns object with get, post, put, patch, delete stubs
  createMockTokenUtils,       // Returns token utility mocks
  createMockLocalStorage,     // Returns localStorage mock
  assertCalledWith,           // Assert stub called with args
  assertProperty,             // Assert object has property with value
  assertTrue/assertFalse,     // Assert truthiness
  assertDeepEqual,            // Assert deep equality
  assertRejects,              // Assert promise rejects
  resetMocks,                 // Reset all stubs in object
  restoreStubs,               // Restore all stubs
} from './test-helpers.mjs';
```

---

## Batch Conversion Script

To convert remaining test files automatically:

```bash
#!/bin/bash
# Pseudo-code for bulk conversion

for file in src/services/__tests__/*.test.js; do
  baseName=$(basename "$file" .js)
  outputFile="${file%.js}.mjs"

  # Convert file:
  # 1. Add init.mjs import
  # 2. Replace vitest imports
  # 3. Replace vi.mock with sinon stubs
  # 4. Replace expect with assert
  # 5. Add afterEach with sinon.restore()
done
```

---

## Package.json Scripts

Already configured in package.json:

```json
{
  "scripts": {
    "test": "node --test 'src/**/__tests__/**/*.test.mjs'",
    "test:watch": "node --test --watch 'src/**/__tests__/**/*.test.mjs'",
    "test:services": "node --test 'src/services/__tests__/**/*.test.mjs'",
    "test:coverage": "node --experimental-coverage --test 'src/**/__tests__/**/*.test.mjs'",
    "test:contracts": "node --test 'src/**/__tests__/**/*contract*.test.mjs'"
  }
}
```

---

## Progress Tracking

| Service | Tests | Status | Converted |
|---------|-------|--------|-----------|
| simpleAuthService | 6 | ✅ | Yes (manual) |
| stockBatchService | 12 | ✅ | Yes (manual) |
| native (demo) | 1 | ✅ | Yes (manual) |
| exchangeRateService | 39 | 🔄 | In Progress |
| authService | 26 | ⏳ | Pending |
| supplierService | 50 | ⏳ | Pending |
| vatService | 85 | ⏳ | Pending |
| invoiceService | 50 | ⏳ | Pending |
| purchaseOrderService | 50 | ⏳ | Pending |
| quotationService | 40 | ⏳ | Pending |
| **62 other services** | ~3000+ | ⏳ | Pending |

---

## Common Issues & Solutions

### Issue: `import.meta.env` is undefined
**Solution:** Make sure `init.mjs` is imported at the top of the test file.

### Issue: Module not found errors
**Solution:** Ensure all relative imports use explicit `.js` extensions:
```javascript
// ❌ Wrong
import { something } from './module'

// ✅ Right
import { something } from './module.js'
```

### Issue: Tests timeout or hang
**Solution:** This shouldn't happen with Node's native test runner. If it does:
1. Check if there are infinite loops in setup
2. Ensure sinon stubs are properly configured
3. Check module imports for side effects

### Issue: localStorage/window not available
**Solution:** Ensure `init.mjs` is imported first. It provides browser API mocks.

---

## Next Steps

1. ✅ Convert foundation tests (simpleAuthService, stockBatchService, native)
2. 🔄 Convert critical service tests (exchangeRateService, authService, etc.)
3. ⏳ Batch convert remaining service tests
4. ⏳ Implement component tests (Tier 3 - 361 components)
5. ⏳ Implement utility tests (Tier 4 - 145 utilities)
6. ⏳ CI/CD integration and enforcement (Phase 7)

---

**Last Updated:** 2026-02-04
**Phase:** 5 (Frontend Testing)
**Target Completion:** 100 tests converted and passing by end of week
