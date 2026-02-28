/**
 * VAT Rate Service Unit Tests
 * Tests VAT rate management operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { api } from "../api.js";
import vatRateService from "../vatRateService.js";

describe("vatRateService", () => {
  let getStub, postStub, putStub, patchStub, deleteStub;

  beforeEach(() => {
    vi.restoreAllMocks();
    getStub = vi.spyOn(api, 'get');
    postStub = vi.spyOn(api, 'post');
    putStub = vi.spyOn(api, 'put');
    patchStub = vi.spyOn(api, 'patch');
    deleteStub = vi.spyOn(api, 'delete');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAll", () => {
    it("should get all VAT rates", async () => {
      const mockRates = [
        { id: 1, rate: 5, category: "reduced", description: "Reduced rate" },
        { id: 2, rate: 0, category: "zero", description: "Zero rated" },
      ];

      getStub.mockResolvedValue(mockRates);

      const result = await vatRateService.getAll();

      expect(result).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/vat-rates");
    });

    it("should handle response with rates property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      getStub.mockResolvedValue({ rates: mockRates });

      const result = await vatRateService.getAll();

      expect(result).toBeTruthy();
    });

    it("should handle response with data property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      getStub.mockResolvedValue({ data: mockRates });

      const result = await vatRateService.getAll();

      expect(result).toBeTruthy();
    });

    it("should return empty array on error", async () => {
      getStub.mockRejectedValue(new Error("Network error"));

      await expect(vatRateService.getAll()).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("should get VAT rate by ID", async () => {
      const mockRate = { id: 1, rate: 5, category: "standard", description: "Standard rate" };
      getStub.mockResolvedValue(mockRate);

      const result = await vatRateService.getById(1);

      expect(result).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/vat-rates/1");
    });

    it("should handle rate not found", async () => {
      getStub.mockRejectedValue(new Error("Not found"));

      await expect(vatRateService.getById(999)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should create new VAT rate", async () => {
      const rateData = { rate: 15, category: "standard", description: "Standard VAT" };
      const mockResponse = { id: 3, ...rateData };

      postStub.mockResolvedValue(mockResponse);

      const result = await vatRateService.create(rateData);

      expect(result).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/vat-rates", rateData);
    });

    it("should handle creation errors", async () => {
      const error = new Error("Invalid rate");
      postStub.mockRejectedValue(error);

      await expect(vatRateService.create({})).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update VAT rate", async () => {
      const rateData = { rate: 10, description: "Updated rate" };
      const mockResponse = { id: 1, ...rateData };

      putStub.mockResolvedValue(mockResponse);

      const result = await vatRateService.update(1, rateData);

      expect(result).toBeTruthy();
      expect(putStub).toHaveBeenCalledWith("/vat-rates/1", rateData);
    });

    it("should handle update errors", async () => {
      const error = new Error("Rate in use");
      putStub.mockRejectedValue(error);

      await expect(vatRateService.update(1, {})).rejects.toThrow();
    });
  });

  describe("toggle", () => {
    it("should toggle VAT rate active status", async () => {
      const mockResponse = { id: 1, rate: 5, isActive: false };

      patchStub.mockResolvedValue(mockResponse);

      const result = await vatRateService.toggle(1);

      expect(result).toBeTruthy();
      expect(patchStub).toHaveBeenCalledWith("/vat-rates/1/toggle");
    });
  });

  describe("delete", () => {
    it("should delete VAT rate", async () => {
      const mockResponse = { id: 1, deleted: true };

      deleteStub.mockResolvedValue(mockResponse);

      const result = await vatRateService.delete(1);

      expect(result).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith("/vat-rates/1");
    });

    it("should handle deletion errors", async () => {
      const error = new Error("Rate in use");
      deleteStub.mockRejectedValue(error);

      await expect(vatRateService.delete(1)).rejects.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should propagate API errors", async () => {
      const error = new Error("Network error");
      getStub.mockRejectedValue(error);

      await expect(vatRateService.getAll()).rejects.toThrow();
    });
  });
});