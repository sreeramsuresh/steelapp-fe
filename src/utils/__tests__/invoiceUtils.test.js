/**
 * Unit Tests for Invoice Utils - Date Formatting
 *
 * Test Coverage:
 * - formatDateForInput (ISO timestamp -> yyyy-MM-dd)
 * - Date format handling for HTML5 date inputs
 * - UAE timezone conversions
 */

import { describe, it, expect } from "vitest";
import {
  formatDateForInput,
  formatDate,
  formatDateTime,
} from "../invoiceUtils";

describe("invoiceUtils - Date Formatting", () => {
  // ============================================
  // formatDateForInput Tests (HTML5 date input)
  // ============================================

  describe("formatDateForInput - ISO to yyyy-MM-dd", () => {
    it("should convert ISO timestamp to yyyy-MM-dd format", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const result = formatDateForInput(isoDate);

      // ISO 2025-12-04T20:00:00.000Z = Dec 4, 8:00 PM UTC
      // In UAE (UTC+4) = Dec 5, 12:00 AM (next day)
      expect(result).toBe("2025-12-05");
    });

    it("should handle date at midnight UTC", () => {
      const isoDate = "2025-12-05T00:00:00.000Z";
      const result = formatDateForInput(isoDate);

      // Dec 5, 12:00 AM UTC = Dec 5, 4:00 AM UAE (same day)
      expect(result).toBe("2025-12-05");
    });

    it("should handle date at end of day UTC", () => {
      const isoDate = "2025-12-04T23:59:59.999Z";
      const result = formatDateForInput(isoDate);

      // Dec 4, 11:59 PM UTC = Dec 5, 3:59 AM UAE (next day)
      expect(result).toBe("2025-12-05");
    });

    it("should handle Date objects", () => {
      const date = new Date("2025-12-04T20:00:00.000Z");
      const result = formatDateForInput(date);

      expect(result).toBe("2025-12-05");
    });

    it("should handle string dates in yyyy-MM-dd format (already formatted)", () => {
      const dateString = "2025-12-05";
      const result = formatDateForInput(dateString);

      expect(result).toBe("2025-12-05");
    });

    it("should return valid format for current date", () => {
      const now = new Date();
      const result = formatDateForInput(now);

      // Should match yyyy-MM-dd pattern
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should handle invalid dates gracefully", () => {
      const invalidDate = "invalid-date";
      const result = formatDateForInput(invalidDate);

      // Should return empty string for invalid dates (form can detect missing/invalid input)
      expect(result).toBe("");
    });

    it("should handle null/undefined gracefully", () => {
      const resultNull = formatDateForInput(null);
      const resultUndefined = formatDateForInput(undefined);

      // Should return empty string for null/undefined (form can detect missing input)
      expect(resultNull).toBe("");
      expect(resultUndefined).toBe("");
    });
  });

  // ============================================
  // Credit Note Specific Date Scenarios
  // ============================================

  describe("Credit Note Date Scenarios", () => {
    it("should format credit note date from backend (ISO) for form input", () => {
      // Mock credit note from backend
      const creditNoteDate = "2025-12-04T20:00:00.000Z";
      const formattedDate = formatDateForInput(creditNoteDate);

      expect(formattedDate).toBe("2025-12-05");
      expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should format invoice date from backend (ISO) for display", () => {
      const invoiceDate = "2025-12-02T20:00:00.000Z";
      const formattedDate = formatDateForInput(invoiceDate);

      expect(formattedDate).toBe("2025-12-03");
    });

    it("should handle draft dates from localStorage (already formatted)", () => {
      // Draft dates are already in yyyy-MM-dd format
      const draftDate = "2025-12-05";
      const formattedDate = formatDateForInput(draftDate);

      expect(formattedDate).toBe("2025-12-05");
    });

    it("should handle timezone edge cases (date boundary)", () => {
      // Test date that crosses boundary in UAE timezone
      const utcDate = "2025-12-04T20:00:00.000Z"; // 8:00 PM UTC
      const formattedDate = formatDateForInput(utcDate);

      // In UAE (UTC+4): Dec 5, 12:00 AM (next day)
      expect(formattedDate).toBe("2025-12-05");
    });
  });

  // ============================================
  // Display Format Tests (for UI)
  // ============================================

  describe("Display Formats", () => {
    it("formatDate should return human-readable format", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const result = formatDate(isoDate);

      // Should be readable format (not yyyy-MM-dd)
      expect(result).not.toBe("2025-12-05");
      expect(result).toContain("2025");
    });

    it("formatDateTime should include time component", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const result = formatDateTime(isoDate);

      // Should include time
      expect(result).toContain("2025");
      // DateTime format typically includes AM/PM or time separator
      expect(result.length).toBeGreaterThan(10); // More than just date
    });
  });

  // ============================================
  // Consistency Tests (ISO -> Input -> ISO)
  // ============================================

  describe("Round-trip Consistency", () => {
    it("should maintain date consistency for round-trip", () => {
      const originalISO = "2025-12-04T20:00:00.000Z";

      // Format for input
      const inputFormat = formatDateForInput(originalISO);
      expect(inputFormat).toBe("2025-12-05"); // UAE timezone

      // Convert back to Date object
      const backToDate = new Date(inputFormat);
      expect(backToDate.getFullYear()).toBe(2025);
      expect(backToDate.getMonth()).toBe(11); // December (0-indexed)
      expect(backToDate.getDate()).toBe(5);
    });

    it("should handle multiple dates from same credit note", () => {
      // Credit note with both date fields
      const creditNoteDate = "2025-12-04T20:00:00.000Z";
      const expectedReturnDate = "2025-12-10T20:00:00.000Z";

      const formattedCNDate = formatDateForInput(creditNoteDate);
      const formattedReturnDate = formatDateForInput(expectedReturnDate);

      expect(formattedCNDate).toBe("2025-12-05");
      expect(formattedReturnDate).toBe("2025-12-11");
    });
  });

  // ============================================
  // Browser Compatibility
  // ============================================

  describe("Browser Date Input Compatibility", () => {
    it("should produce valid HTML5 date input format", () => {
      const dates = [
        "2025-12-04T20:00:00.000Z",
        "2025-01-01T00:00:00.000Z",
        "2025-12-31T23:59:59.999Z",
      ];

      dates.forEach((date) => {
        const formatted = formatDateForInput(date);

        // Must match yyyy-MM-dd pattern for HTML5 date input
        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Should be parseable by Date constructor
        const parsed = new Date(formatted);
        expect(parsed.toString()).not.toBe("Invalid Date");
      });
    });

    it("should not include time component in date input format", () => {
      const isoDate = "2025-12-04T20:00:00.000Z";
      const formatted = formatDateForInput(isoDate);

      // Should not contain time separators
      expect(formatted).not.toContain("T");
      expect(formatted).not.toContain(":");
      expect(formatted).not.toContain("Z");

      // Should only contain date and hyphens
      expect(formatted.replace(/-/g, "")).toMatch(/^\d{8}$/);
    });
  });

  // ============================================
  // Real-World Scenarios
  // ============================================

  describe("Real-World Credit Note Scenarios", () => {
    it("should handle credit note #107 date format", () => {
      // Actual data from the bug report
      const creditNoteDate = "2025-12-04T20:00:00.000Z";
      const formatted = formatDateForInput(creditNoteDate);

      expect(formatted).toBe("2025-12-05");
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should handle invoice #337 date format", () => {
      const invoiceDate = "2025-12-02T20:00:00.000Z";
      const formatted = formatDateForInput(invoiceDate);

      expect(formatted).toBe("2025-12-03");
    });

    it("should handle delivery note dates", () => {
      const deliveryDate = "2025-12-01T20:00:00.000Z";
      const expectedDeliveryDate = "2025-12-05T20:00:00.000Z";

      expect(formatDateForInput(deliveryDate)).toBe("2025-12-02");
      expect(formatDateForInput(expectedDeliveryDate)).toBe("2025-12-06");
    });
  });

  // ============================================
  // Error Prevention Tests
  // ============================================

  describe("Error Prevention", () => {
    it("should return valid date format for valid inputs", () => {
      const validInputs = [
        "2025-12-04T20:00:00.000Z",
        new Date(),
        "2025-12-05",
      ];

      validInputs.forEach((input) => {
        const result = formatDateForInput(input);
        expect(result).not.toBe("");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it("should return empty string for invalid inputs", () => {
      const invalidInputs = ["invalid", null, undefined];

      invalidInputs.forEach((input) => {
        const result = formatDateForInput(input);
        expect(result).toBe("");
      });
    });

    it("should never throw errors", () => {
      const badInputs = ["invalid-date", {}, [], 123, true, null, undefined];

      badInputs.forEach((input) => {
        expect(() => {
          formatDateForInput(input);
        }).not.toThrow();
      });
    });

    it("should return consistent format across multiple calls", () => {
      const date = "2025-12-04T20:00:00.000Z";

      const call1 = formatDateForInput(date);
      const call2 = formatDateForInput(date);
      const call3 = formatDateForInput(date);

      expect(call1).toBe(call2);
      expect(call2).toBe(call3);
    });
  });
});
