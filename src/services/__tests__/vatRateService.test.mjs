/**
 * VAT Rate Service Unit Tests
 * Tests VAT rate management operations
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';


import { api } from "../api.js";
import vatRateService from "../vatRateService.js";

describe("vatRateService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getAll", () => {
    test("should get all VAT rates", async () => {
      const mockRates = [
        { id: 1, rate: 5, category: "reduced", description: "Reduced rate" },
        { id: 2, rate: 0, category: "zero", description: "Zero rated" },
      ];

      api.get.mockResolvedValueOnce(mockRates);

      const result = await vatRateService.getAll();

      assert.ok(result);
      sinon.assert.calledWith(api.get, "/vat-rates");
    });

    test("should handle response with rates property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      api.get.mockResolvedValueOnce({ rates: mockRates });

      const result = await vatRateService.getAll();

      assert.ok(result);
    });

    test("should handle response with data property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      api.get.mockResolvedValueOnce({ data: mockRates });

      const result = await vatRateService.getAll();

      assert.ok(result);
    });

    test("should return empty array on error", async () => {
      api.get.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(vatRateService.getAll(), Error);
    });
  });

  describe("getById", () => {
    test("should get VAT rate by ID", async () => {
      const mockRate = { id: 1, rate: 5, category: "standard", description: "Standard rate" };
      api.get.mockResolvedValueOnce(mockRate);

      const result = await vatRateService.getById(1);

      assert.ok(result);
      sinon.assert.calledWith(api.get, "/vat-rates/1");
    });

    test("should handle rate not found", async () => {
      api.get.mockRejectedValueOnce(new Error("Not found"));

      assert.rejects(vatRateService.getById(999), Error);
    });
  });

  describe("create", () => {
    test("should create new VAT rate", async () => {
      const rateData = { rate: 15, category: "standard", description: "Standard VAT" };
      const mockResponse = { id: 3, ...rateData };

      api.post.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.create(rateData);

      assert.ok(result);
      sinon.assert.calledWith(api.post, "/vat-rates", rateData);
    });

    test("should handle creation errors", async () => {
      const error = new Error("Invalid rate");
      api.post.mockRejectedValueOnce(error);

      assert.rejects(vatRateService.create({}), Error);
    });
  });

  describe("update", () => {
    test("should update VAT rate", async () => {
      const rateData = { rate: 10, description: "Updated rate" };
      const mockResponse = { id: 1, ...rateData };

      api.put.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.update(1, rateData);

      assert.ok(result);
      sinon.assert.calledWith(api.put, "/vat-rates/1", rateData);
    });

    test("should handle update errors", async () => {
      const error = new Error("Rate in use");
      api.put.mockRejectedValueOnce(error);

      assert.rejects(vatRateService.update(1, {}), Error);
    });
  });

  describe("toggle", () => {
    test("should toggle VAT rate active status", async () => {
      const mockResponse = { id: 1, rate: 5, isActive: false };

      api.patch.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.toggle(1);

      assert.ok(result);
      sinon.assert.calledWith(api.patch, "/vat-rates/1/toggle");
    });
  });

  describe("delete", () => {
    test("should delete VAT rate", async () => {
      const mockResponse = { id: 1, deleted: true };

      api.delete.mockResolvedValueOnce(mockResponse);

      const result = await vatRateService.delete(1);

      assert.ok(result);
      sinon.assert.calledWith(api.delete, "/vat-rates/1");
    });

    test("should handle deletion errors", async () => {
      const error = new Error("Rate in use");
      api.delete.mockRejectedValueOnce(error);

      assert.rejects(vatRateService.delete(1), Error);
    });
  });

  describe("Error Handling", () => {
    test("should propagate API errors", async () => {
      const error = new Error("Network error");
      api.get.mockRejectedValueOnce(error);

      assert.rejects(vatRateService.getAll(), Error);
    });
  });
});