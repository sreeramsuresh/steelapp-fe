import { test, describe, beforeEach, afterEach } from 'node:test';
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

      assert.ok(result).toHaveLength(2);
      assert.ok(result[0].type).toBe("letter_of_credit");
      assert.ok(api.get).toHaveBeenCalledWith("/trade-finance", { params: {} });
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

      assert.ok(result.reference_number).toBe("TF-2024-001");
      assert.ok(result.amount).toBe(100000);
      assert.ok(api.get).toHaveBeenCalledWith("/trade-finance/1");
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

      assert.ok(result.reference_number).toBe("TF-2024-001");
      assert.ok(api.post).toHaveBeenCalledWith("/trade-finance", payload);
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

      assert.ok(result.status).toBe("approved");
      assert.ok(api.put).toHaveBeenCalledWith("/trade-finance/1", payload);
    });
  });

  describe("deleteTradeFinanceRecord", () => {
    test("should delete trade finance record", async () => {
      sinon.stub(api, 'delete').resolves({ success: true });

      const result = await tradeFinanceService.deleteTradeFinanceRecord(1);

      assert.ok(result.success).toBe(true);
      assert.ok(api.delete).toHaveBeenCalledWith("/trade-finance/1");
    });
  });
});