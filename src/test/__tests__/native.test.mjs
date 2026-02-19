// Initialize test environment first
import '../../__tests__/init.mjs';

import { test, describe } from "node:test";
import assert from "node:assert";

describe("Native Node test", () => {
  test("should work", () => {
    assert.strictEqual(true, true);
  });
});
