import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { trnService } from "../trnService.js";
import { apiClient } from "../api.js";



describe("trnService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatForDisplay", () => {
    it("should format 15-digit TRN with dashes", () => {
      const result = trnService.formatForDisplay("100123456789123");
      expect(result).toBe("100-1234-5678-9123");
    });

    it("should handle TRN with spaces and dashes", () => {
      const result = trnService.formatForDisplay("100 1234 5678 9123");
      expect(result).toBe("100-1234-5678-9123");
    });

    it("should return original if invalid length", () => {
      const result = trnService.formatForDisplay("12345");
      expect(result).toBe("12345");
    });

    it("should handle empty TRN", () => {
      const result = trnService.formatForDisplay("");
      expect(result).toBe("");
    });
  });

  describe("normalizeInput", () => {
    it("should remove spaces and dashes", () => {
      const result = trnService.normalizeInput("100-1234-5678-9123");
      expect(result).toBe("100123456789123");
    });

    it("should handle empty input", () => {
      const result = trnService.normalizeInput("");
      expect(result).toBe("");
    });
  });

  describe("handleInput", () => {
    it("should validate input and return displayValue", () => {
      const result = trnService.handleInput("100123456789123");
      expect(result.value).toBeTruthy();
      expect(result.isValid).toBeTruthy();
      expect(result.displayValue).toBeTruthy();
    });

    it("should limit to 15 digits", () => {
      const result = trnService.handleInput("1001234567891231234");
      expect(result.value.length <= 15).toBeTruthy();
    });
  });

  describe("validateFormat", () => {
    it("should validate UAE TRN format", () => {
      const result = trnService.validateFormat("100123456789123", "AE");
      expect(result.valid).toBeTruthy();
      expect(result.trn).toBeTruthy();
    });

    it("should reject invalid UAE TRN", () => {
      const result = trnService.validateFormat("INVALID", "AE");
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should handle Saudi Arabia TRN", () => {
      const result = trnService.validateFormat("310123456789012", "SA");
      expect(result.valid).toBeTruthy();
    });

    it("should validate Bahrain TRN", () => {
      const result = trnService.validateFormat("1234567890123", "BH");
      expect(result.valid).toBeTruthy();
    });

    it("should return error for unknown country", () => {
      const result = trnService.validateFormat("123", "XX");
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("verify", () => {
    it("should verify TRN with backend API", async () => {
      const mockResponse = {
        success: true,
        verified: true,
        trn: "100123456789123",
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await trnService.verify("100123456789123", "AE");

      expect(result.success).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      const error = new Error("API Error");
      error.response = {
        data: {
          message: "Verification failed",
          format_valid: true,
          api_configured: false,
        },
      };

      vi.spyOn(apiClient, 'post').mockRejectedValue(error);

      const result = await trnService.validateRemote("INVALID");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification failed");
    });
  });

  describe("getStatus", () => {
    it("should fetch TRN verification service status", async () => {
      const mockResponse = {
        success: true,
        status: "operational",
        ftaConfigured: true,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await trnService.getStatus();

      expect(result.success).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/trn/status");
    });

    it("should handle service error", async () => {
      const error = new Error("Service Error");
      vi.spyOn(apiClient, 'get').mockRejectedValue(error);

      const result = await trnService.getFormats();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.formats).toBeTruthy());
    });
  });

  describe("getLocalFormats", () => {
    it("should return local TRN formats without API call", () => {
      const formats = trnService.getLocalFormats();

      expect(formats.AE !== undefined).toBeTruthy();
      expect(formats.SA !== undefined).toBeTruthy();
      expect(formats.BH !== undefined).toBeTruthy();
    });

    it("should have AE format details", () => {
      const formats = trnService.getLocalFormats();
      expect(formats.AE.pattern !== undefined).toBeTruthy();
      expect(formats.AE.country).toBeTruthy();
    });
  });

  describe("getFormatForCountry", () => {
    it("should return format for specific country", () => {
      const format = trnService.getFormatForCountry("AE");
      expect(format.country).toBeTruthy();
      expect(format.pattern !== undefined).toBeTruthy();
    });

    it("should return null for unknown country", () => {
      const format = trnService.getFormatForCountry("XX");
      expect(format).toBe(null);
    });

    it("should handle lowercase country codes", () => {
      const format = trnService.getFormatForCountry("ae");
      expect(format).not.toBe(null);
    });
  });

  describe("hasVatSystem", () => {
    it("should return true for countries with VAT", () => {
      expect(trnService.hasVatSystem("AE").toBeTruthy());
      expect(trnService.hasVatSystem("SA").toBeTruthy());
    });

    it("should return false for countries without VAT", () => {
      expect(trnService.hasVatSystem("KW")).toBe(false);
      expect(trnService.hasVatSystem("QA")).toBe(false);
    });

    it("should handle lowercase country codes", () => {
      expect(trnService.hasVatSystem("ae").toBeTruthy());
    });
  });
});