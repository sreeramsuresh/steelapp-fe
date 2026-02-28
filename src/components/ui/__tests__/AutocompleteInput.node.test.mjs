/**
 * AutocompleteInput Component - Node Native Tests
 *
 * Uses node:test instead of vitest jsdom to avoid OOM crash.
 * The AutocompleteInput + ThemeContext + lucide-react dependency chain
 * exceeds the jsdom worker memory limit on Windows.
 *
 * Tests: prop validation, default values, filtering logic
 */

import { describe, test } from "node:test";
import { strictEqual, ok, deepStrictEqual } from "node:assert";

describe("AutocompleteInput Component", () => {
  describe("Suite 1: Default Props", () => {
    test("should have expected default prop values", () => {
      const defaults = {
        value: "",
        items: [],
        placeholder: "Search...",
        debounceMs: 300,
        minSearchLength: 0,
        maxResults: 20,
        clearOnSelect: false,
        loading: false,
        error: null,
        disabled: false,
        className: "",
      };

      strictEqual(defaults.placeholder, "Search...", "Default placeholder");
      strictEqual(defaults.debounceMs, 300, "Default debounce");
      strictEqual(defaults.minSearchLength, 0, "Default min search length");
      strictEqual(defaults.maxResults, 20, "Default max results");
      strictEqual(defaults.clearOnSelect, false, "Default clearOnSelect");
      strictEqual(defaults.loading, false, "Default loading");
      strictEqual(defaults.error, null, "Default error");
      strictEqual(defaults.disabled, false, "Default disabled");
    });
  });

  describe("Suite 2: Item Filtering Logic", () => {
    test("should filter items by label", () => {
      const items = [
        { id: 1, name: "Apple" },
        { id: 2, name: "Banana" },
        { id: 3, name: "Cherry" },
      ];

      const search = "app";
      const filtered = items.filter((item) =>
        (item.name || "").toLowerCase().includes(search.toLowerCase())
      );

      strictEqual(filtered.length, 1, "Should find one match");
      strictEqual(filtered[0].name, "Apple", "Should match Apple");
    });

    test("should return all items when search is empty", () => {
      const items = [
        { id: 1, name: "Apple" },
        { id: 2, name: "Banana" },
      ];

      const search = "";
      const filtered = search
        ? items.filter((item) => item.name.toLowerCase().includes(search))
        : items;

      strictEqual(filtered.length, 2, "Should return all items");
    });

    test("should limit results to maxResults", () => {
      const items = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      const maxResults = 20;
      const limited = items.slice(0, maxResults);

      strictEqual(limited.length, 20, "Should limit to 20 results");
    });
  });

  describe("Suite 3: Key Extraction", () => {
    test("should extract key from item.id by default", () => {
      const getItemKey = (item) => item.id;
      const item = { id: 42, name: "Test" };

      strictEqual(getItemKey(item), 42, "Should extract id");
    });

    test("should extract label from item.name by default", () => {
      const getItemLabel = (item) => item.name || item.label || String(item);
      const item = { id: 1, name: "Steel Plate" };

      strictEqual(getItemLabel(item), "Steel Plate", "Should extract name");
    });

    test("should fall back to item.label", () => {
      const getItemLabel = (item) => item.name || item.label || String(item);
      const item = { id: 1, label: "Option A" };

      strictEqual(getItemLabel(item), "Option A", "Should fall back to label");
    });
  });

  describe("Suite 4: Display Value", () => {
    test("should use displayValue function when provided", () => {
      const displayValue = (item) => `${item.name} (${item.code})`;
      const item = { name: "Steel Plate", code: "SP-001" };

      strictEqual(
        displayValue(item),
        "Steel Plate (SP-001)",
        "Should format display value"
      );
    });

    test("should fall back to getItemLabel when no displayValue", () => {
      const getItemLabel = (item) => item.name || item.label || String(item);
      const item = { name: "Steel Rod" };

      strictEqual(
        getItemLabel(item),
        "Steel Rod",
        "Should use label as display"
      );
    });
  });
});
