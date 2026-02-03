import { beforeEach, describe, expect, it, vi } from "vitest";
import { purchaseOrderSyncService } from "../purchaseOrderSyncService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("purchaseOrderSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSyncStatus", () => {
    it("should fetch sync status for purchase orders", async () => {
      const mockResponse = {
        total_orders: 100,
        synced_orders: 95,
        pending_sync: 5,
        last_sync_time: "2024-01-15T10:00:00Z",
        sync_percentage: 95,
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await purchaseOrderSyncService.getSyncStatus();

      expect(result.sync_percentage).toBe(95);
      expect(result.pending_sync).toBe(5);
      expect(api.get).toHaveBeenCalledWith("/purchase-orders/sync-status");
    });
  });

  describe("syncPurchaseOrder", () => {
    it("should sync single purchase order to external system", async () => {
      const mockResponse = {
        id: 1,
        po_number: "PO-2024-001",
        sync_status: "completed",
        external_reference: "EXT-12345",
        synced_at: "2024-01-15T10:00:00Z",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await purchaseOrderSyncService.syncPurchaseOrder(1);

      expect(result.sync_status).toBe("completed");
      expect(result.external_reference).toBe("EXT-12345");
      expect(api.post).toHaveBeenCalledWith(
        "/purchase-orders/1/sync",
        expect.any(Object)
      );
    });
  });

  describe("syncBulkPurchaseOrders", () => {
    it("should sync multiple purchase orders in batch", async () => {
      const mockResponse = {
        synced_count: 10,
        failed_count: 0,
        total_requested: 10,
        results: [
          { po_id: 1, status: "completed" },
          { po_id: 2, status: "completed" },
        ],
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await purchaseOrderSyncService.syncBulkPurchaseOrders([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);

      expect(result.synced_count).toBe(10);
      expect(result.failed_count).toBe(0);
      expect(api.post).toHaveBeenCalledWith(
        "/purchase-orders/sync-bulk",
        expect.any(Object)
      );
    });
  });

  describe("getFailedSyncs", () => {
    it("should fetch failed sync records", async () => {
      const mockResponse = [
        {
          id: 1,
          po_id: 5,
          po_number: "PO-2024-005",
          error_reason: "Supplier validation failed",
          last_attempt: "2024-01-15T09:30:00Z",
          retry_count: 2,
        },
        {
          id: 2,
          po_id: 10,
          po_number: "PO-2024-010",
          error_reason: "Network timeout",
          last_attempt: "2024-01-15T09:45:00Z",
          retry_count: 1,
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await purchaseOrderSyncService.getFailedSyncs();

      expect(result).toHaveLength(2);
      expect(result[0].error_reason).toContain("validation");
    });
  });

  describe("retryFailedSync", () => {
    it("should retry failed sync for purchase order", async () => {
      const mockResponse = {
        id: 1,
        po_id: 5,
        sync_status: "completed",
        synced_at: "2024-01-15T11:00:00Z",
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await purchaseOrderSyncService.retryFailedSync(1);

      expect(result.sync_status).toBe("completed");
      expect(api.put).toHaveBeenCalledWith(
        "/purchase-orders/sync-failures/1/retry",
        expect.any(Object)
      );
    });
  });
});
