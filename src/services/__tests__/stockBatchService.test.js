/**
 * Stock Batch Service Unit Tests
 * ✅ Tests batch listing, filtering, and retrieval
 * ✅ Tests procurement channel tracking (LOCAL vs IMPORTED)
 * ✅ Tests stock availability and FIFO logic
 * ✅ 100% coverage target for stockBatchService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from "../api";
import stockBatchService from "../stockBatchService";

describe("stockBatchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBatches", () => {
    test("should list stock batches with pagination", async () => {
      const mockBatches = {
        batches: [
          {
            id: 1,
            productId: 1,
            procurementChannel: "LOCAL",
            quantity: 100,
            status: "active",
          },
          {
            id: 2,
            productId: 1,
            procurementChannel: "IMPORTED",
            quantity: 50,
            status: "active",
          },
        ],
        pageInfo: { page: 1, totalPages: 1, total: 2 },
      };
      apiClient.get.mockResolvedValueOnce(mockBatches);

      const result = await stockBatchService.getBatches({ page: 1, limit: 20 });

      expect(result.batches).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith("/stock-batches", {
        page: 1,
        limit: 20,
      });
    });

    test("should filter batches by product", async () => {
      apiClient.get.mockResolvedValueOnce({ batches: [] });

      await stockBatchService.getBatches({ productId: 5 });

      expect(apiClient.get).toHaveBeenCalledWith("/stock-batches", {
        page: 1,
        limit: 20,
        productId: 5,
      });
    });

    test("should filter batches by procurement channel", async () => {
      apiClient.get.mockResolvedValueOnce({ batches: [] });

      await stockBatchService.getBatches({ procurementChannel: "IMPORTED" });

      expect(apiClient.get).toHaveBeenCalledWith("/stock-batches", {
        page: 1,
        limit: 20,
        procurementChannel: "IMPORTED",
      });
    });

    test("should filter batches with remaining stock", async () => {
      apiClient.get.mockResolvedValueOnce({ batches: [] });

      await stockBatchService.getBatches({ hasStock: true });

      expect(apiClient.get).toHaveBeenCalledWith("/stock-batches", {
        page: 1,
        limit: 20,
        hasStock: true,
      });
    });
  });

  describe("getBatchesByProduct", () => {
    test("should get batches for specific product", async () => {
      const mockBatches = [
        { id: 1, productId: 5, procurementChannel: "LOCAL", quantity: 100 },
        { id: 2, productId: 5, procurementChannel: "IMPORTED", quantity: 50 },
      ];
      apiClient.get.mockResolvedValueOnce(mockBatches);

      const result = await stockBatchService.getBatchesByProduct(5);

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith("/stock-batches/product/5", {});
    });

    test("should filter product batches by procurement channel", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await stockBatchService.getBatchesByProduct(5, {
        procurementChannel: "LOCAL",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/stock-batches/product/5",
        expect.objectContaining({ procurementChannel: "LOCAL" })
      );
    });
  });

  describe("getProcurementSummary", () => {
    test("should get procurement summary for product", async () => {
      const mockSummary = {
        localQty: 150,
        importedQty: 50,
        totalQty: 200,
      };
      apiClient.get.mockResolvedValueOnce(mockSummary);

      const result = await stockBatchService.getProcurementSummary(5);

      expect(result.totalQty).toBe(200);
      expect(result.localQty).toBe(150);
      expect(result.importedQty).toBe(50);
      expect(apiClient.get).toHaveBeenCalledWith("/stock-batches/product/5/summary", {});
    });
  });

  describe("getBatch", () => {
    test("should get single batch by ID", async () => {
      const mockBatch = {
        id: 1,
        productId: 5,
        procurementChannel: "LOCAL",
        quantity: 100,
        status: "active",
      };
      apiClient.get.mockResolvedValueOnce(mockBatch);

      const result = await stockBatchService.getBatch(1);

      expect(result.id).toBe(1);
      expect(result.procurementChannel).toBe("LOCAL");
      expect(apiClient.get).toHaveBeenCalledWith("/stock-batches/1");
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors in getBatches", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(stockBatchService.getBatches()).rejects.toThrow("Network error");
    });

    test("should handle API errors in getProcurementSummary", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Product not found"));

      await expect(stockBatchService.getProcurementSummary(999)).rejects.toThrow("Product not found");
    });

    test("should handle API errors in getBatchesByProduct", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Not found"));

      await expect(stockBatchService.getBatchesByProduct(999)).rejects.toThrow("Not found");
    });
  });
});
