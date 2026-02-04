/**
 * Unit Tests for Invoice Utils - Date Formatting
 *
 * Test Coverage:
 * - formatDateForInput (ISO timestamp -> yyyy-MM-dd)
 * - Date format handling for HTML5 date inputs
 * - UAE timezone conversions
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatDate, formatDateForInput, formatDateTime } from "../invoiceUtils.js";

describe("invoiceUtils - Date Formatting", () => {
  // ============================================
  // formatDateForInput Tests (HTML5 date input)
  // ============================================

  describe("formatDateForInput - ISO to yyyy-MM-dd", () => {
    test("should convert ISO timestamp to yyyy-MM-dd format", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const result = formatDateForInput(isoDate);

      // ISO 2025-12-04T20:00:00.000Z = Dec 4, 8:00 PM UTC
      // In UAE (UTC+4) = Dec 5, 12:00 AM (next day)
      assert.strictEqual(result, "2025-12-05");
    });

    test("should handle date at midnight UTC", () => {
      const isoDate = "2025-12-05T00:00:00.000Z";
      const result = formatDateForInput(isoDate);

      // Dec 5, 12:00 AM UTC = Dec 5, 4:00 AM UAE (same day)
      assert.strictEqual(result, "2025-12-05");
    });

    test("should handle date at end of day UTC", () => {
      const isoDate = "2025-12-04T23:59:59.999Z";
      const result = formatDateForInput(isoDate);

      // Dec 4, 11:59 PM UTC = Dec 5, 3:59 AM UAE (next day)
      assert.strictEqual(result, "2025-12-05");
    });

    test("should handle Date objects", () => {
      const date = new Date("2025-12-04T20:00:00.000Z");
      const result = formatDateForInput(date);

      assert.strictEqual(result, "2025-12-05");
    });

    test("should handle string dates in yyyy-MM-dd format (already formatted)", () => {
      const dateString = "2025-12-05";
      const result = formatDateForInput(dateString);

      assert.strictEqual(result, "2025-12-05");
    });

    test("should return valid format for current date", () => {
      const now = new Date();
      const result = formatDateForInput(now);

      // Should match yyyy-MM-dd pattern
      assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    });

    test("should handle invalid dates gracefully", () => {
      const invalidDate = "invalid-date";
      const result = formatDateForInput(invalidDate);

      // Should return empty string for invalid dates (form can detect missing/invalid input)
      assert.strictEqual(result, "");
    });

    test("should handle null/undefined gracefully", () => {
      const resultNull = formatDateForInput(null);
      const resultUndefined = formatDateForInput(undefined);

      // Should return empty string for null/undefined (form can detect missing input)
      assert.strictEqual(resultNull, "");
      assert.strictEqual(resultUndefined, "");
    });
  });

  // ============================================
  // Credit Note Specific Date Scenarios
  // ============================================

  describe("Credit Note Date Scenarios", () => {
    test("should format credit note date from backend (ISO) for form input", () => {
      // Mock credit note from backend
      const creditNoteDate = "2025-12-04T20:00:00.000Z";
      const formattedDate = formatDateForInput(creditNoteDate);

      assert.strictEqual(formattedDate, "2025-12-05");
      assert.match(formattedDate, /^\d{4}-\d{2}-\d{2}$/);
    });

    test("should format invoice date from backend (ISO) for display", () => {
      const invoiceDate = "2025-12-02T20:00:00.000Z";
      const formattedDate = formatDateForInput(invoiceDate);

      assert.strictEqual(formattedDate, "2025-12-03");
    });

    test("should handle draft dates from localStorage (already formatted)", () => {
      // Draft dates are already in yyyy-MM-dd format
      const draftDate = "2025-12-05";
      const formattedDate = formatDateForInput(draftDate);

      assert.strictEqual(formattedDate, "2025-12-05");
    });

    test("should handle timezone edge cases (date boundary)", () => {
      // Test date that crosses boundary in UAE timezone
      const utcDate = "2025-12-04T20:00:00.000Z"; // 8:00 PM UTC
      const formattedDate = formatDateForInput(utcDate);

      // In UAE (UTC+4): Dec 5, 12:00 AM (next day)
      assert.strictEqual(formattedDate, "2025-12-05");
    });
  });

  // ============================================
  // Display Format Tests (for UI)
  // ============================================

  describe("Display Formats", () => {
    test("formatDate should return human-readable format", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const result = formatDate(isoDate);

      // Should be readable format (not yyyy-MM-dd)
      expect(result).not;
      assert.ok(result.includes("2025"));
    });

    test("formatDateTime should include time component", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const result = formatDateTime(isoDate);

      // Should include time
      assert.ok(result.includes("2025"));
      // DateTime format typically includes AM/PM or time separator
      expect(result.length).toBeGreaterThan(10); // More than just date
    });
  });

  // ============================================
  // Consistency Tests (ISO -> Input -> ISO)
  // ============================================

  describe("Round-trip Consistency", () => {
    test("should maintain date consistency for round-trip", () => {
      const originalISO = "2025-12-04T20:00:00.000Z";

      // Format for input
      const inputFormat = formatDateForInput(originalISO);
      assert.strictEqual(inputFormat, "2025-12-05"); // UAE timezone

      // Convert back to Date object
      const backToDate = new Date(inputFormat);
      expect(backToDate.getFullYear());
      expect(backToDate.getMonth()); // December (0-indexed)
      expect(backToDate.getDate());
    });

    test("should handle multiple dates from same credit note", () => {
      // Credit note with both date fields
      const creditNoteDate = "2025-12-04T20:00:00.000Z";
      const expectedReturnDate = "2025-12-10T20:00:00.000Z";

      const formattedCNDate = formatDateForInput(creditNoteDate);
      const formattedReturnDate = formatDateForInput(expectedReturnDate);

      assert.strictEqual(formattedCNDate, "2025-12-05");
      assert.strictEqual(formattedReturnDate, "2025-12-11");
    });
  });

  // ============================================
  // Browser Compatibility
  // ============================================

  describe("Browser Date Input Compatibility", () => {
    test("should produce valid HTML5 date input format", () => {
      const dates = ["2025-12-04T20:00:00.000Z", "2025-01-01T00:00:00.000Z", "2025-12-31T23:59:59.999Z"];

      dates.forEach((date) => {
        const formatted = formatDateForInput(date);

        // Must match yyyy-MM-dd pattern for HTML5 date input
        assert.match(formatted, /^\d{4}-\d{2}-\d{2}$/);

        // Should be parseable by Date constructor
        const parsed = new Date(formatted);
        expect(parsed.toString()).not;
      });
    });

    test("should not include time component in date input format", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const formatted = formatDateForInput(isoDate);

      // Should not contain time separators
      expect(formatted).not;
      expect(formatted).not;
      expect(formatted).not;

      // Should only contain date and hyphens
      expect(formatted.replace(/-/g, "")).toMatch(/^\d{8}$/);
    });
  });

  // ============================================
  // Real-World Scenarios
  // ============================================

  describe("Real-World Credit Note Scenarios", () => {
    test("should handle credit note #107 date format", () => {
      // Actual data from the bug report
      const creditNoteDate = "2025-12-04T20:00:00.000Z";
      const formatted = formatDateForInput(creditNoteDate);

      assert.strictEqual(formatted, "2025-12-05");
      assert.match(formatted, /^\d{4}-\d{2}-\d{2}$/);
    });

    test("should handle invoice #337 date format", () => {
      const invoiceDate = "2025-12-02T20:00:00.000Z";
      const formatted = formatDateForInput(invoiceDate);

      assert.strictEqual(formatted, "2025-12-03");
    });

    test("should handle delivery note dates", () => {
      const deliveryDate = "2025-12-01T20:00:00.000Z";
      const expectedDeliveryDate = "2025-12-05T20:00:00.000Z";

      expect(formatDateForInput(deliveryDate));
      expect(formatDateForInput(expectedDeliveryDate));
    });
  });

  // ============================================
  // Error Prevention Tests
  // ============================================

  describe("Error Prevention", () => {
    test("should return valid date format for valid inputs", () => {
      const validInputs = ["2025-12-04T20:00:00.000Z", new Date(), "2025-12-05"];

      validInputs.forEach((input) => {
        const result = formatDateForInput(input);
        expect(result).not;
        expect(result.length).toBeGreaterThan(0);
        assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
      });
    });

    test("should return empty string for invalid inputs", () => {
      const invalidInputs = ["invalid", null, undefined];

      invalidInputs.forEach((input) => {
        const result = formatDateForInput(input);
        assert.strictEqual(result, "");
      });
    });

    test("should never throw errors", () => {
      const badInputs = ["invalid-date", {}, [], 123, true, null, undefined];

      badInputs.forEach((input) => {
        expect(() => {
          formatDateForInput(input);
        }).not;
      });
    });

    test("should return consistent format across multiple calls", () => {
      const date = "2025-12-04T20:00:00.000Z";

      const call1 = formatDateForInput(date);
      const call2 = formatDateForInput(date);
      const call3 = formatDateForInput(date);

      assert.strictEqual(call1, call2);
      assert.strictEqual(call2, call3);
    });
  });
});
