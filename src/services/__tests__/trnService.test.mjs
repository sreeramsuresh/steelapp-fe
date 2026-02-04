import { test, describe, beforeEach, afterEach } from 'node:test';
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
      assert.ok(result).toBe("100-1234-5678-9123");
    });

    test("should handle TRN with spaces and dashes", () => {
      const result = trnService.formatForDisplay("100 1234 5678 9123");
      assert.ok(result).toBe("100-1234-5678-9123");
    });

    test("should return original if invalid length", () => {
      const result = trnService.formatForDisplay("12345");
      assert.ok(result).toBe("12345");
    });

    test("should handle empty TRN", () => {
      const result = trnService.formatForDisplay("");
      assert.ok(result).toBe("");
    });
  });

  describe("normalizeInput", () => {
    test("should remove spaces and dashes", () => {
      const result = trnService.normalizeInput("100-1234-5678-9123");
      assert.ok(result).toBe("100123456789123");
    });

    test("should handle empty input", () => {
      const result = trnService.normalizeInput("");
      assert.ok(result).toBe("");
    });
  });

  describe("handleInput", () => {
    test("should validate input and return displayValue", () => {
      const result = trnService.handleInput("100123456789123");
      assert.ok(result.value).toBe("100123456789123");
      assert.ok(result.isValid).toBe(true);
      assert.ok(result.displayValue).toBe("100-1234-5678-9123");
    });

    test("should limit to 15 digits", () => {
      const result = trnService.handleInput("1001234567891231234");
      assert.ok(result.value.length).toBeLessThanOrEqual(15);
    });
  });

  describe("validateFormat", () => {
    test("should validate UAE TRN format", () => {
      const result = trnService.validateFormat("100123456789123", "AE");
      assert.ok(result.valid).toBe(true);
      assert.ok(result.trn).toBe("100123456789123");
    });

    test("should reject invalid UAE TRN", () => {
      const result = trnService.validateFormat("INVALID", "AE");
      assert.ok(result.valid).toBe(false);
      assert.ok(result.error).toContain("Invalid");
    });

    test("should handle Saudi Arabia TRN", () => {
      const result = trnService.validateFormat("310123456789012", "SA");
      assert.ok(result.valid).toBe(true);
    });

    test("should validate Bahrain TRN", () => {
      const result = trnService.validateFormat("1234567890123", "BH");
      assert.ok(result.valid).toBe(true);
    });

    test("should return error for unknown country", () => {
      const result = trnService.validateFormat("123", "XX");
      assert.ok(result.valid).toBe(false);
      assert.ok(result.error).toContain("Unknown");
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

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/trn/verify", Object.keys({ trn: "100123456789123" }).every(k => typeof arguments[0][k] !== 'undefined'));
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

      apiClient.post.mockRejectedValue(error);

      const result = await trnService.verify("100123456789123");

      assert.ok(result.success).toBe(false);
      assert.ok(result.error).toBe("Verification failed");
    });
  });

  describe("validateRemote", () => {
    test("should validate TRN via backend API", async () => {
      const mockResponse = {
        success: true,
        valid: true,
        trn: "100123456789123",
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await trnService.validateRemote("100123456789123");

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/trn/validate", );
    });

    test("should handle validation errors", async () => {
      const error = new Error("Validation Error");
      error.response = { data: { message: "Invalid format" } };

      apiClient.post.mockRejectedValue(error);

      const result = await trnService.validateRemote("INVALID");

      assert.ok(result.success).toBe(false);
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

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/trn/status");
    });

    test("should handle service error", async () => {
      const error = new Error("Service Error");
      apiClient.get.mockRejectedValue(error);

      const result = await trnService.getStatus();

      assert.ok(result.success).toBe(false);
    });
  });

  describe("getFormats", () => {
    test("should fetch supported TRN formats", async () => {
      const mockResponse = {
        success: true,
        formats: [
          {
            countryCode: "AE",
            country: "UAE",
            description: "15 digits exactly",
          },
        ],
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await trnService.getFormats();

      assert.ok(result.success).toBe(true);
      assert.ok(Array.isArray(result.formats)).toBe(true);
    });

    test("should fallback to local formats on API error", async () => {
      const error = new Error("API Error");
      apiClient.get.mockRejectedValue(error);

      const result = await trnService.getFormats();

      assert.ok(result.success).toBe(true);
      assert.ok(result.source).toBe("local_fallback");
    });
  });

  describe("getLocalFormats", () => {
    test("should return local TRN formats without API call", () => {
      const formats = trnService.getLocalFormats();

      assert.ok(formats.AE).toBeDefined();
      assert.ok(formats.SA).toBeDefined();
      assert.ok(formats.BH).toBeDefined();
    });

    test("should have AE format details", () => {
      const formats = trnService.getLocalFormats();
      assert.ok(formats.AE.pattern).toBeDefined();
      assert.ok(formats.AE.country).toBe("UAE");
    });
  });

  describe("getFormatForCountry", () => {
    test("should return format for specific country", () => {
      const format = trnService.getFormatForCountry("AE");
      assert.ok(format.country).toBe("UAE");
      assert.ok(format.pattern).toBeDefined();
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
      assert.ok(trnService.hasVatSystem("AE")).toBe(true);
      assert.ok(trnService.hasVatSystem("SA")).toBe(true);
    });

    test("should return false for countries without VAT", () => {
      assert.ok(trnService.hasVatSystem("KW")).toBe(false);
      assert.ok(trnService.hasVatSystem("QA")).toBe(false);
    });

    test("should handle lowercase country codes", () => {
      assert.ok(trnService.hasVatSystem("ae")).toBe(true);
    });
  });
});