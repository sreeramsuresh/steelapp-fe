import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api.js";
import { tradeFinanceService } from "../tradeFinanceService.js";

describe("tradeFinanceService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTradeFinanceRecords", () => {
    it("should fetch all trade finance records with pagination", async () => {
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

      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await tradeFinanceService.getTradeFinanceRecords();

      expect(result).toBeTruthy();
      expect(result[0].type).toBeTruthy();
      expect(api.get).toHaveBeenCalledWith("/trade-finance", { params: {} });
    });
  });

  describe("getTradeFinanceRecord", () => {
    it("should fetch single trade finance record with details", async () => {
      const mockResponse = {
        id: 1,
        reference_number: "TF-2024-001",
        type: "letter_of_credit",
        amount: 100000,
        supplier_name: "POSCO",
        status: "active",
      };

      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await tradeFinanceService.getTradeFinanceRecord(1);

      expect(result.reference_number).toBeTruthy();
      expect(result.amount).toBeTruthy();
      expect(api.get).toHaveBeenCalledWith("/trade-finance/1");
    });
  });

  describe("createTradeFinanceRecord", () => {
    it("should create new trade finance record", async () => {
      const mockResponse = {
        id: 1,
        reference_number: "TF-2024-001",
        type: "letter_of_credit",
        status: "pending",
      };

      vi.spyOn(api, "post").mockResolvedValue(mockResponse);

      const payload = {
        type: "letter_of_credit",
        supplier_id: 100,
        amount: 100000,
      };

      const result = await tradeFinanceService.createTradeFinanceRecord(payload);

      expect(result.reference_number).toBeTruthy();
      expect(api.post).toHaveBeenCalledWith("/trade-finance", payload);
    });
  });

  describe("updateTradeFinanceRecord", () => {
    it("should update trade finance record", async () => {
      const mockResponse = {
        id: 1,
        reference_number: "TF-2024-001",
        status: "approved",
      };

      vi.spyOn(api, "put").mockResolvedValue(mockResponse);

      const payload = { status: "approved" };

      const result = await tradeFinanceService.updateTradeFinanceRecord(1, payload);

      expect(result.status).toBeTruthy();
      expect(api.put).toHaveBeenCalledWith("/trade-finance/1", payload);
    });
  });

  describe("deleteTradeFinanceRecord", () => {
    it("should delete trade finance record", async () => {
      vi.spyOn(api, "delete").mockResolvedValue({ success: true });

      const result = await tradeFinanceService.deleteTradeFinanceRecord(1);

      expect(result.success).toBeTruthy();
      expect(api.delete).toHaveBeenCalledWith("/trade-finance/1");
    });
  });
});
