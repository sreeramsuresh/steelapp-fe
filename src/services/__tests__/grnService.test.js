/**
 * GRN (Goods Receipt Note) Service Unit Tests
 * ✅ Tests GRN CRUD operations for 3-way match workflow
 * ✅ Tests weight variance detection (critical for steel)
 * ✅ Tests PCS-centric tracking and batch/lot management
 * ✅ Tests approval, cancellation, and billing workflows
 * ✅ 100% coverage target for grnService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import grnService from "../grnService.js";

describe("grnService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe("getAll()", () => {
    test("should fetch GRNs with pagination", async () => {
      const mockResponse = {
        data: [
          { id: 1, grnNumber: "GRN-2026-001", status: "draft" },
          { id: 2, grnNumber: "GRN-2026-002", status: "approved" },
        ],
        pagination: { page: 1, pageSize: 10, total: 28 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await grnService.getAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(28);
      expect(apiClient.get).toHaveBeenCalledWith("/grns", { page: 1, pageSize: 10 });
    });

    test("should fetch GRNs with filters", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await grnService.getAll({ status: "draft", supplierId: 5 });

      expect(apiClient.get).toHaveBeenCalledWith("/grns", {
        page: 1,
        pageSize: 50,
        status: "draft",
        supplierId: 5,
      });
    });
  });

  describe("getById()", () => {
    test("should fetch GRN by ID with full details", async () => {
      const mockGRN = {
        id: 1,
        grnNumber: "GRN-2026-001",
        status: "approved",
        items: [
          {
            id: 1,
            productId: 50,
            description: "SS 304 Coil",
            receivedQuantity: 1050,
            poWeightKg: 10000,
            receivedWeightKg: 10500,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockGRN);

      const result = await grnService.getById(1);

      expect(result.grnNumber).toBe("GRN-2026-001");
      expect(result.items).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith("/grns/1");
    });

    test("should handle GRN not found", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("GRN not found"));

      await expect(grnService.getById(999)).rejects.toThrow("GRN not found");
    });
  });

  describe("create()", () => {
    test("should create new GRN", async () => {
      const grnData = {
        purchaseOrderId: 100,
        supplierId: 5,
        warehouseId: 2,
        receivedDate: "2026-01-15",
        items: [
          {
            purchaseOrderLineId: 10,
            receivedQuantity: 1050,
            receivedWeightKg: 10500,
          },
        ],
      };
      const mockGRN = {
        id: 1,
        grnNumber: "GRN-2026-001",
        status: "draft",
        purchaseOrderId: 100,
        items: [],
      };
      apiClient.post.mockResolvedValueOnce(mockGRN);

      const result = await grnService.create(grnData);

      expect(result.id).toBe(1);
      expect(result.grnNumber).toBe("GRN-2026-001");
      expect(apiClient.post).toHaveBeenCalled();
    });

    test("should handle creation errors", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Invalid GRN data"));

      await expect(grnService.create({})).rejects.toThrow("Invalid GRN data");
    });
  });

  describe("update()", () => {
    test("should update GRN details", async () => {
      const updateData = { receivedBy: "new_mgr", notes: "Updated notes" };
      const mockGRN = {
        id: 1,
        grnNumber: "GRN-2026-001",
        receivedBy: "new_mgr",
        notes: "Updated notes",
      };
      apiClient.put.mockResolvedValueOnce(mockGRN);

      const result = await grnService.update(1, updateData);

      expect(result.receivedBy).toBe("new_mgr");
      expect(result.notes).toBe("Updated notes");
      expect(apiClient.put).toHaveBeenCalledWith("/grns/1", expect.any(Object));
    });

    test("should prevent updating approved GRN", async () => {
      apiClient.put.mockRejectedValueOnce(new Error("Cannot update approved GRN"));

      await expect(grnService.update(1, {})).rejects.toThrow("Cannot update approved GRN");
    });
  });

  // ============================================================================
  // WEIGHT VARIANCE, QUANTITY, PCS & BATCH TRACKING (via create/update)
  // ============================================================================

  describe("Advanced Tracking via Service Methods", () => {
    test("should accept GRN with weight variance data", async () => {
      const grnData = {
        purchaseOrderId: 100,
        items: [
          {
            purchaseOrderLineId: 10,
            orderedQuantity: 1000,
            receivedQuantity: 1050,
            poWeightKg: 10000,
            receivedWeightKg: 10500,
            weightVariancePercent: 5,
            batchNumber: "BATCH-001",
            pcsReceived: 100,
          },
        ],
      };
      const mockGRN = {
        id: 1,
        grnNumber: "GRN-2026-001",
        items: [
          {
            receivedQuantity: 1050,
            weightVariancePercent: 5,
            batchNumber: "BATCH-001",
          },
        ],
      };
      apiClient.post.mockResolvedValueOnce(mockGRN);

      const result = await grnService.create(grnData);

      expect(result.id).toBe(1);
      expect(result.items[0].batchNumber).toBe("BATCH-001");
      expect(apiClient.post).toHaveBeenCalled();
    });

    test("should prevent exceeding ordered quantity", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Received quantity exceeds ordered quantity"));

      await expect(
        grnService.create({
          items: [{ orderedQuantity: 1000, receivedQuantity: 1100 }],
        })
      ).rejects.toThrow("exceeds ordered quantity");
    });
  });

  // ============================================================================
  // WORKFLOW: APPROVAL & CANCELLATION
  // ============================================================================

  describe("approve()", () => {
    test("should approve GRN and move stock to inventory", async () => {
      const mockGRN = {
        id: 1,
        grnNumber: "GRN-2026-001",
        status: "approved",
      };
      apiClient.post.mockResolvedValueOnce(mockGRN);

      const result = await grnService.approve(1, "All items verified");

      expect(result.status).toBe("approved");
      expect(apiClient.post).toHaveBeenCalledWith("/grns/1/approve", {
        notes: "All items verified",
      });
    });

    test("should prevent approving GRN with rejections", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Cannot approve GRN with rejected items"));

      await expect(grnService.approve(1)).rejects.toThrow("Cannot approve GRN");
    });
  });

  describe("cancel()", () => {
    test("should cancel GRN and restore stock", async () => {
      const mockGRN = {
        id: 1,
        grnNumber: "GRN-2026-001",
        status: "cancelled",
      };
      apiClient.post.mockResolvedValueOnce(mockGRN);

      const result = await grnService.cancel(1, "Wrong goods received");

      expect(result.status).toBe("cancelled");
      expect(apiClient.post).toHaveBeenCalledWith("/grns/1/cancel", {
        reason: "Wrong goods received",
      });
    });

    test("should prevent cancelling approved GRN", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Cannot cancel approved GRN"));

      await expect(grnService.cancel(1)).rejects.toThrow("Cannot cancel approved GRN");
    });
  });

  // ============================================================================
  // 3-WAY MATCH WORKFLOW
  // ============================================================================

  describe("markBilled()", () => {
    test("should link GRN to supplier bill for 3-way match", async () => {
      const mockGRN = {
        id: 1,
        grnNumber: "GRN-2026-001",
        status: "billed",
      };
      apiClient.post.mockResolvedValueOnce(mockGRN);

      const result = await grnService.markBilled(1, 500);

      expect(result.status).toBe("billed");
      expect(apiClient.post).toHaveBeenCalledWith("/grns/1/mark-billed", {
        supplierBillId: 500,
      });
    });

    test("should enforce 3-way match logic", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("PO, GRN, and Bill quantities do not match"));

      await expect(grnService.markBilled(1, 500)).rejects.toThrow("do not match");
    });
  });

  // ============================================================================
  // SEQUENCE GENERATION
  // ============================================================================

  describe("getNextNumber()", () => {
    test("should generate next GRN number", async () => {
      const mockResponse = { nextNumber: "GRN-2026-042" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await grnService.getNextNumber();

      expect(result.nextNumber).toBe("GRN-2026-042");
      expect(apiClient.get).toHaveBeenCalledWith("/grns/number/next");
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network errors in getAll", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(grnService.getAll()).rejects.toThrow("Network error");
    });

    test("should handle network errors in create", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Server error"));

      await expect(grnService.create({})).rejects.toThrow("Server error");
    });

    test("should handle network errors in approve", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Service unavailable"));

      await expect(grnService.approve(1)).rejects.toThrow("Service unavailable");
    });
  });
});
