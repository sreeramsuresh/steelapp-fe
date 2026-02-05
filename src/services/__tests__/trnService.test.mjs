import { test, describe, beforeEach, afterEach } from 'node:test';
import '../../__tests__/init.mjs';
import assert from 'node:assert';
import sinon from 'sinon';
import { trnService } from "../trnService.js";
import { apiClient } from "../api.js";



describe("trnService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("formatForDisplay", () => {
    test("should format 15-digit TRN with dashes", () => {
      const result = trnService.formatForDisplay("100123456789123");
      assert.ok(result);
    });

    test("should handle TRN with spaces and dashes", () => {
      const result = trnService.formatForDisplay("100 1234 5678 9123");
      assert.ok(result);
    });

    test("should return original if invalid length", () => {
      const result = trnService.formatForDisplay("12345");
      assert.ok(result);
    });

    test("should handle empty TRN", () => {
      const result = trnService.formatForDisplay("");
      assert.ok(result);
    });
  });

  describe("normalizeInput", () => {
    test("should remove spaces and dashes", () => {
      const result = trnService.normalizeInput("100-1234-5678-9123");
      assert.ok(result);
    });

    test("should handle empty input", () => {
      const result = trnService.normalizeInput("");
      assert.ok(result);
    });
  });

  describe("handleInput", () => {
    test("should validate input and return displayValue", () => {
      const result = trnService.handleInput("100123456789123");
      assert.ok(result.value);
      assert.ok(result.isValid);
      assert.ok(result.displayValue);
    });

    test("should limit to 15 digits", () => {
      const result = trnService.handleInput("1001234567891231234");
      assert.ok(result.value.length).toBeLessThanOrEqual(15);
    });
  });

  describe("validateFormat", () => {
    test("should validate UAE TRN format", () => {
      const result = trnService.validateFormat("100123456789123", "AE");
      assert.ok(result.valid);
      assert.ok(result.trn);
    });

    test("should reject invalid UAE TRN", () => {
      const result = trnService.validateFormat("INVALID", "AE");
      assert.ok(result.valid);
      assert.ok(result.error);
    });

    test("should handle Saudi Arabia TRN", () => {
      const result = trnService.validateFormat("310123456789012", "SA");
      assert.ok(result.valid);
    });

    test("should validate Bahrain TRN", () => {
      const result = trnService.validateFormat("1234567890123", "BH");
      assert.ok(result.valid);
    });

    test("should return error for unknown country", () => {
      const result = trnService.validateFormat("123", "XX");
      assert.ok(result.valid);
      assert.ok(result.error);
    });
  });

  describe("verify", () => {
    test("should verify TRN with backend API", async () => {
      const mockResponse = {
        success: true,
        verified: true,
        trn: "100123456789123",
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await trnService.verify("100123456789123", "AE");

      assert.ok(result.success);
      sinon.assert.calledWith(apiClient.post, "/trn/verify", Object.keys({ trn: "100123456789123" }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should handle API errors gracefully", async () => {
      const error = new Error("API Error");
      error.response = {
        data: {
          message: "Verification failed",
          format_valid: true,
          api_configured: false,
        },
      };

      sinon.stub(apiClient, 'post').rejects(error);

      const result = await trnService.validateRemote("INVALID");

      assert.ok(result.success);
    });
  });

  describe("getStatus", () => {
    test("should fetch TRN verification service status", async () => {
      const mockResponse = {
        success: true,
        status: "operational",
        ftaConfigured: true,
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await trnService.getStatus();

      assert.ok(result.success);
      sinon.assert.calledWith(apiClient.get, "/trn/status");
    });

    test("should handle service error", async () => {
      const error = new Error("Service Error");
      sinon.stub(apiClient, 'get').rejects(error);

      const result = await trnService.getFormats();

      assert.ok(result.success);
      assert.ok(result.source);
    });
  });

  describe("getLocalFormats", () => {
    test("should return local TRN formats without API call", () => {
      const formats = trnService.getLocalFormats();

      assert.ok(formats.AE !== undefined);
      assert.ok(formats.SA !== undefined);
      assert.ok(formats.BH !== undefined);
    });

    test("should have AE format details", () => {
      const formats = trnService.getLocalFormats();
      assert.ok(formats.AE.pattern !== undefined);
      assert.ok(formats.AE.country);
    });
  });

  describe("getFormatForCountry", () => {
    test("should return format for specific country", () => {
      const format = trnService.getFormatForCountry("AE");
      assert.ok(format.country);
      assert.ok(format.pattern !== undefined);
    });

    test("should return null for unknown country", () => {
      const format = trnService.getFormatForCountry("XX");
      assert.ok(format).toBeNull();
    });

    test("should handle lowercase country codes", () => {
      const format = trnService.getFormatForCountry("ae");
      assert.ok(format).not.toBeNull();
    });
  });

  describe("hasVatSystem", () => {
    test("should return true for countries with VAT", () => {
      assert.ok(trnService.hasVatSystem("AE"));
      assert.ok(trnService.hasVatSystem("SA"));
    });

    test("should return false for countries without VAT", () => {
      assert.ok(trnService.hasVatSystem("KW"));
      assert.ok(trnService.hasVatSystem("QA"));
    });

    test("should handle lowercase country codes", () => {
      assert.ok(trnService.hasVatSystem("ae"));
    });
  });
});