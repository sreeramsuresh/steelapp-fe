import { test, describe, beforeEach, afterEach } from 'node:test';
import '../../__tests__/init.mjs';
import assert from 'node:assert';
import sinon from 'sinon';
import { tradeFinanceService } from "../tradeFinanceService.js";


import { api } from "../api.js";

describe("tradeFinanceService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getTradeFinanceRecords", () => {
    test("should fetch all trade finance records with pagination", async () => {
      const mockResponse = [
        {
          id: 1,
          reference_number: "TF-2024-001",
          type: "letter_of_credit",
          amount: 100000,
          status: "active",
        },
        {
          id: 2,
          reference_number: "TF-2024-002",
          type: "bill_discounting",
          amount: 50000,
          status: "pending",
        },
      ];

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await tradeFinanceService.getTradeFinanceRecords();

      assert.ok(result);
      assert.ok(result[0].type);
      sinon.assert.calledWith(api.get, "/trade-finance", { params: {} });
    });
  });

  describe("getTradeFinanceRecord", () => {
    test("should fetch single trade finance record with details", async () => {
      const mockResponse = {
        id: 1,
        reference_number: "TF-2024-001",
        type: "letter_of_credit",
        amount: 100000,
        supplier_name: "POSCO",
        status: "active",
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await tradeFinanceService.getTradeFinanceRecord(1);

      assert.ok(result.reference_number);
      assert.ok(result.amount);
      sinon.assert.calledWith(api.get, "/trade-finance/1");
    });
  });

  describe("createTradeFinanceRecord", () => {
    test("should create new trade finance record", async () => {
      const mockResponse = {
        id: 1,
        reference_number: "TF-2024-001",
        type: "letter_of_credit",
        status: "pending",
      };

      sinon.stub(api, 'post').resolves(mockResponse);

      const payload = {
        type: "letter_of_credit",
        supplier_id: 100,
        amount: 100000,
      };

      const result = await tradeFinanceService.createTradeFinanceRecord(payload);

      assert.ok(result.reference_number);
      sinon.assert.calledWith(api.post, "/trade-finance", payload);
    });
  });

  describe("updateTradeFinanceRecord", () => {
    test("should update trade finance record", async () => {
      const mockResponse = {
        id: 1,
        reference_number: "TF-2024-001",
        status: "approved",
      };

      sinon.stub(api, 'put').resolves(mockResponse);

      const payload = { status: "approved" };

      const result = await tradeFinanceService.updateTradeFinanceRecord(1, payload);

      assert.ok(result.status);
      sinon.assert.calledWith(api.put, "/trade-finance/1", payload);
    });
  });

  describe("deleteTradeFinanceRecord", () => {
    test("should delete trade finance record", async () => {
      sinon.stub(api, 'delete').resolves({ success: true });

      const result = await tradeFinanceService.deleteTradeFinanceRecord(1);

      assert.ok(result.success);
      sinon.assert.calledWith(api.delete, "/trade-finance/1");
    });
  });
});