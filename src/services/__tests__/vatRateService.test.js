import { beforeEach, describe, expect, it, vi } from "vitest";
import { vatRateService } from "../vatRateService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("vatRateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVatRates", () => {
    it("should fetch all applicable VAT rates", async () => {
      const mockResponse = [
        {
          id: 1,
          rate_percentage: 5.0,
          category: "standard",
          description: "Standard rated supplies",
          applicable_from: "2018-01-01",
        },
        {
          id: 2,
          rate_percentage: 0.0,
          category: "zero_rated",
          description: "Zero-rated supplies",
          applicable_from: "2018-01-01",
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await vatRateService.getVatRates();

      expect(result).toHaveLength(2);
      expect(result[0].rate_percentage).toBe(5.0);
      expect(api.get).toHaveBeenCalledWith("/vat-rates");
    });
  });

  describe("getVatRateByCategory", () => {
    it("should fetch VAT rate for specific category", async () => {
      const mockResponse = {
        id: 1,
        rate_percentage: 5.0,
        category: "standard",
        description: "Standard rated supplies",
        applicable_from: "2018-01-01",
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await vatRateService.getVatRateByCategory("standard");

      expect(result.rate_percentage).toBe(5.0);
      expect(api.get).toHaveBeenCalledWith("/vat-rates/standard");
    });

    it("should fetch zero-rated category", async () => {
      const mockResponse = {
        id: 2,
        rate_percentage: 0.0,
        category: "zero_rated",
        description: "Zero-rated supplies",
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await vatRateService.getVatRateByCategory("zero_rated");

      expect(result.rate_percentage).toBe(0.0);
    });

    it("should handle exempt supplies", async () => {
      const mockResponse = {
        id: 3,
        rate_percentage: 0.0,
        category: "exempt",
        description: "Exempt supplies",
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await vatRateService.getVatRateByCategory("exempt");

      expect(result.category).toBe("exempt");
    });
  });

  describe("calculateVat", () => {
    it("should calculate VAT amount for 5% standard rate", async () => {
      const mockResponse = {
        base_amount: 100000,
        rate_percentage: 5.0,
        vat_amount: 5000,
        total_with_vat: 105000,
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await vatRateService.calculateVat(100000, "standard");

      expect(result.vat_amount).toBe(5000);
      expect(result.total_with_vat).toBe(105000);
      expect(api.post).toHaveBeenCalledWith("/vat-rates/calculate", expect.any(Object));
    });

    it("should return zero VAT for zero-rated supplies", async () => {
      const mockResponse = {
        base_amount: 100000,
        rate_percentage: 0.0,
        vat_amount: 0,
        total_with_vat: 100000,
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await vatRateService.calculateVat(100000, "zero_rated");

      expect(result.vat_amount).toBe(0);
      expect(result.total_with_vat).toBe(100000);
    });
  });

  describe("getRateHistory", () => {
    it("should fetch VAT rate changes over time", async () => {
      const mockResponse = [
        {
          effective_date: "2018-01-01",
          rate_percentage: 5.0,
          change_reason: "Implementation of VAT Law",
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await vatRateService.getRateHistory("standard");

      expect(result).toHaveLength(1);
      expect(result[0].rate_percentage).toBe(5.0);
      expect(api.get).toHaveBeenCalledWith("/vat-rates/standard/history");
    });
  });

  describe("getApplicableRate", () => {
    it("should determine applicable rate for supply on specific date", async () => {
      const mockResponse = {
        applicable_date: "2024-01-15",
        category: "standard",
        rate_percentage: 5.0,
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await vatRateService.getApplicableRate("standard", "2024-01-15");

      expect(result.rate_percentage).toBe(5.0);
      expect(api.post).toHaveBeenCalledWith("/vat-rates/applicable", expect.any(Object));
    });
  });
});
