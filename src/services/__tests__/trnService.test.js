import { beforeEach, describe, expect, it, vi } from "vitest";
import { trnService } from "../trnService.js";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from "../api.js";

describe("trnService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(result.value).toBe("100123456789123");
      expect(result.isValid).toBe(true);
      expect(result.displayValue).toBe("100-1234-5678-9123");
    });

    it("should limit to 15 digits", () => {
      const result = trnService.handleInput("1001234567891231234");
      expect(result.value.length).toBeLessThanOrEqual(15);
    });
  });

  describe("validateFormat", () => {
    it("should validate UAE TRN format", () => {
      const result = trnService.validateFormat("100123456789123", "AE");
      expect(result.valid).toBe(true);
      expect(result.trn).toBe("100123456789123");
    });

    it("should reject invalid UAE TRN", () => {
      const result = trnService.validateFormat("INVALID", "AE");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("should handle Saudi Arabia TRN", () => {
      const result = trnService.validateFormat("310123456789012", "SA");
      expect(result.valid).toBe(true);
    });

    it("should validate Bahrain TRN", () => {
      const result = trnService.validateFormat("1234567890123", "BH");
      expect(result.valid).toBe(true);
    });

    it("should return error for unknown country", () => {
      const result = trnService.validateFormat("123", "XX");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unknown");
    });
  });

  describe("verify", () => {
    it("should verify TRN with backend API", async () => {
      const mockResponse = {
        success: true,
        verified: true,
        trn: "100123456789123",
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await trnService.verify("100123456789123", "AE");

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/trn/verify", expect.objectContaining({ trn: "100123456789123" }));
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

      apiClient.post.mockRejectedValue(error);

      const result = await trnService.verify("100123456789123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification failed");
    });
  });

  describe("validateRemote", () => {
    it("should validate TRN via backend API", async () => {
      const mockResponse = {
        success: true,
        valid: true,
        trn: "100123456789123",
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await trnService.validateRemote("100123456789123");

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/trn/validate", expect.any(Object));
    });

    it("should handle validation errors", async () => {
      const error = new Error("Validation Error");
      error.response = { data: { message: "Invalid format" } };

      apiClient.post.mockRejectedValue(error);

      const result = await trnService.validateRemote("INVALID");

      expect(result.success).toBe(false);
    });
  });

  describe("getStatus", () => {
    it("should fetch TRN verification service status", async () => {
      const mockResponse = {
        success: true,
        status: "operational",
        ftaConfigured: true,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await trnService.getStatus();

      expect(result.success).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/trn/status");
    });

    it("should handle service error", async () => {
      const error = new Error("Service Error");
      apiClient.get.mockRejectedValue(error);

      const result = await trnService.getStatus();

      expect(result.success).toBe(false);
    });
  });

  describe("getFormats", () => {
    it("should fetch supported TRN formats", async () => {
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await trnService.getFormats();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.formats)).toBe(true);
    });

    it("should fallback to local formats on API error", async () => {
      const error = new Error("API Error");
      apiClient.get.mockRejectedValue(error);

      const result = await trnService.getFormats();

      expect(result.success).toBe(true);
      expect(result.source).toBe("local_fallback");
    });
  });

  describe("getLocalFormats", () => {
    it("should return local TRN formats without API call", () => {
      const formats = trnService.getLocalFormats();

      expect(formats.AE).toBeDefined();
      expect(formats.SA).toBeDefined();
      expect(formats.BH).toBeDefined();
    });

    it("should have AE format details", () => {
      const formats = trnService.getLocalFormats();
      expect(formats.AE.pattern).toBeDefined();
      expect(formats.AE.country).toBe("UAE");
    });
  });

  describe("getFormatForCountry", () => {
    it("should return format for specific country", () => {
      const format = trnService.getFormatForCountry("AE");
      expect(format.country).toBe("UAE");
      expect(format.pattern).toBeDefined();
    });

    it("should return null for unknown country", () => {
      const format = trnService.getFormatForCountry("XX");
      expect(format).toBeNull();
    });

    it("should handle lowercase country codes", () => {
      const format = trnService.getFormatForCountry("ae");
      expect(format).not.toBeNull();
    });
  });

  describe("hasVatSystem", () => {
    it("should return true for countries with VAT", () => {
      expect(trnService.hasVatSystem("AE")).toBe(true);
      expect(trnService.hasVatSystem("SA")).toBe(true);
    });

    it("should return false for countries without VAT", () => {
      expect(trnService.hasVatSystem("KW")).toBe(false);
      expect(trnService.hasVatSystem("QA")).toBe(false);
    });

    it("should handle lowercase country codes", () => {
      expect(trnService.hasVatSystem("ae")).toBe(true);
    });
  });
});
