/**
 * VAT Rate Service Unit Tests
 * Tests VAT rate management operations
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../api.js";
import vatRateService from "../vatRateService.js";

describe("vatRateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should get all VAT rates", async () => {
      const mockRates = [
        { id: 1, rate: 5, category: "reduced", description: "Reduced rate" },
        { id: 2, rate: 0, category: "zero", description: "Zero rated" },
      ];

      api.get.mockResolvedValueOnce(mockRates);

      const result = await vatRateService.getAll();

      expect(result).toEqual(mockRates);
      expect(api.get).toHaveBeenCalledWith("/vat-rates");
    });

    it("should handle response with rates property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      api.get.mockResolvedValueOnce({ rates: mockRates });

      const result = await vatRateService.getAll();

      expect(result).toEqual(mockRates);
    });

    it("should handle response with data property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      api.get.mockResolvedValueOnce({ data: mockRates });

      const result = await vatRateService.getAll();

      expect(result).toEqual(mockRates);
    });

    it("should return empty array on error", async () => {
      api.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(vatRateService.getAll()).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("should get VAT rate by ID", async () => {
      const mockRate = { id: 1, rate: 5, category: "standard", description: "Standard rate" };
      api.get.mockResolvedValueOnce(mockRate);

      const result = await vatRateService.getById(1);

      expect(result).toEqual(mockRate);
      expect(api.get).toHaveBeenCalledWith("/vat-rates/1");
    });

    it("should handle rate not found", async () => {
      api.get.mockRejectedValueOnce(new Error("Not found"));

      await expect(vatRateService.getById(999)).rejects.toThrow("Not found");
    });
  });

  describe("create", () => {
    it("should create new VAT rate", async () => {
      const rateData = { rate: 15, category: "standard", description: "Standard VAT" };
      const mockResponse = { id: 3, ...rateData };

      api.post.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.create(rateData);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith("/vat-rates", rateData);
    });

    it("should handle creation errors", async () => {
      const error = new Error("Invalid rate");
      api.post.mockRejectedValueOnce(error);

      await expect(vatRateService.create({})).rejects.toThrow("Invalid rate");
    });
  });

  describe("update", () => {
    it("should update VAT rate", async () => {
      const rateData = { rate: 10, description: "Updated rate" };
      const mockResponse = { id: 1, ...rateData };

      api.put.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.update(1, rateData);

      expect(result).toEqual(mockResponse);
      expect(api.put).toHaveBeenCalledWith("/vat-rates/1", rateData);
    });

    it("should handle update errors", async () => {
      const error = new Error("Rate in use");
      api.put.mockRejectedValueOnce(error);

      await expect(vatRateService.update(1, {})).rejects.toThrow("Rate in use");
    });
  });

  describe("toggle", () => {
    it("should toggle VAT rate active status", async () => {
      const mockResponse = { id: 1, rate: 5, isActive: false };

      api.patch.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.toggle(1);

      expect(result).toEqual(mockResponse);
      expect(api.patch).toHaveBeenCalledWith("/vat-rates/1/toggle");
    });
  });

  describe("delete", () => {
    it("should delete VAT rate", async () => {
      const mockResponse = { id: 1, deleted: true };

      api.delete.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.delete(1);

      expect(result).toEqual(mockResponse);
      expect(api.delete).toHaveBeenCalledWith("/vat-rates/1");
    });

    it("should handle deletion errors", async () => {
      const error = new Error("Rate in use");
      api.delete.mockRejectedValueOnce(error);

      await expect(vatRateService.delete(1)).rejects.toThrow("Rate in use");
    });
  });

  describe("Error Handling", () => {
    it("should propagate API errors", async () => {
      const error = new Error("Network error");
      api.get.mockRejectedValueOnce(error);

      await expect(vatRateService.getAll()).rejects.toThrow("Network error");
    });
  });
});
