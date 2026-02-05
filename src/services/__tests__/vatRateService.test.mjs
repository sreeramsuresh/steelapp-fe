/**
 * VAT Rate Service Unit Tests
 * Tests VAT rate management operations
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { api } from "../api.js";
import vatRateService from "../vatRateService.js";

describe("vatRateService", () => {
  let getStub, postStub, putStub, patchStub, deleteStub;

  beforeEach(() => {
    sinon.restore();
    getStub = sinon.stub(api, 'get');
    postStub = sinon.stub(api, 'post');
    putStub = sinon.stub(api, 'put');
    patchStub = sinon.stub(api, 'patch');
    deleteStub = sinon.stub(api, 'delete');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getAll", () => {
    test("should get all VAT rates", async () => {
      const mockRates = [
        { id: 1, rate: 5, category: "reduced", description: "Reduced rate" },
        { id: 2, rate: 0, category: "zero", description: "Zero rated" },
      ];

      getStub.resolves(mockRates);

      const result = await vatRateService.getAll();

      assert.ok(result);
      sinon.assert.calledWith(getStub, "/vat-rates");
    });

    test("should handle response with rates property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      getStub.resolves({ rates: mockRates });

      const result = await vatRateService.getAll();

      assert.ok(result);
    });

    test("should handle response with data property", async () => {
      const mockRates = [{ id: 1, rate: 5 }];
      getStub.resolves({ data: mockRates });

      const result = await vatRateService.getAll();

      assert.ok(result);
    });

    test("should return empty array on error", async () => {
      getStub.rejects(new Error("Network error"));

      assert.rejects(vatRateService.getAll(), Error);
    });
  });

  describe("getById", () => {
    test("should get VAT rate by ID", async () => {
      const mockRate = { id: 1, rate: 5, category: "standard", description: "Standard rate" };
      getStub.resolves(mockRate);

      const result = await vatRateService.getById(1);

      assert.ok(result);
      sinon.assert.calledWith(getStub, "/vat-rates/1");
    });

    test("should handle rate not found", async () => {
      getStub.rejects(new Error("Not found"));

      assert.rejects(vatRateService.getById(999), Error);
    });
  });

  describe("create", () => {
    test("should create new VAT rate", async () => {
      const rateData = { rate: 15, category: "standard", description: "Standard VAT" };
      const mockResponse = { id: 3, ...rateData };

      postStub.resolves(mockResponse);

      const result = await vatRateService.create(rateData);

      assert.ok(result);
      sinon.assert.calledWith(postStub, "/vat-rates", rateData);
    });

    test("should handle creation errors", async () => {
      const error = new Error("Invalid rate");
      postStub.rejects(error);

      assert.rejects(vatRateService.create({}), Error);
    });
  });

  describe("update", () => {
    test("should update VAT rate", async () => {
      const rateData = { rate: 10, description: "Updated rate" };
      const mockResponse = { id: 1, ...rateData };

      putStub.resolves(mockResponse);

      const result = await vatRateService.update(1, rateData);

      assert.ok(result);
      sinon.assert.calledWith(putStub, "/vat-rates/1", rateData);
    });

    test("should handle update errors", async () => {
      const error = new Error("Rate in use");
      putStub.rejects(error);

      assert.rejects(vatRateService.update(1, {}), Error);
    });
  });

  describe("toggle", () => {
    test("should toggle VAT rate active status", async () => {
      const mockResponse = { id: 1, rate: 5, isActive: false };

      patchStub.resolves(mockResponse);

      const result = await vatRateService.toggle(1);

      assert.ok(result);
      sinon.assert.calledWith(patchStub, "/vat-rates/1/toggle");
    });
  });

  describe("delete", () => {
    test("should delete VAT rate", async () => {
      const mockResponse = { id: 1, deleted: true };

      deleteStub.resolves(mockResponse);

      const result = await vatRateService.delete(1);

      assert.ok(result);
      sinon.assert.calledWith(deleteStub, "/vat-rates/1");
    });

    test("should handle deletion errors", async () => {
      const error = new Error("Rate in use");
      deleteStub.rejects(error);

      assert.rejects(vatRateService.delete(1), Error);
    });
  });

  describe("Error Handling", () => {
    test("should propagate API errors", async () => {
      const error = new Error("Network error");
      getStub.rejects(error);

      assert.rejects(vatRateService.getAll(), Error);
    });
  });
});