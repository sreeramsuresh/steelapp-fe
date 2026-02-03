import { beforeEach, describe, expect, it, vi } from "vitest";
import { batchReservationService } from "../batchReservationService.js";

// Mock API client
vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";

describe("batchReservationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FIFO Reservation", () => {
    it("should reserve batches using FIFO selection", async () => {
      const params = {
        draftInvoiceId: 0,
        productId: 123,
        warehouseId: 1,
        requiredQuantity: 100,
        unit: "KG",
        lineItemTempId: "line-uuid-1",
      };

      const mockResponse = {
        reservationId: 1,
        allocations: [{ batchId: 10, quantity: 100, batchAge: 30 }],
        totalReserved: 100,
        expiresAt: "2024-02-03T10:00:00Z",
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await batchReservationService.reserveFIFO(params);

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].batchId).toBe(10);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/batch-reservations/fifo",
        expect.objectContaining({
          product_id: 123,
          warehouse_id: 1,
          requested_pcs: 100,
        })
      );
    });

    it("should allocate from multiple batches if needed", async () => {
      const params = {
        productId: 123,
        warehouseId: 1,
        requiredQuantity: 250,
        lineItemTempId: "line-uuid-1",
      };

      const mockResponse = {
        allocations: [
          { batchId: 10, quantity: 100 },
          { batchId: 11, quantity: 150 },
        ],
        totalReserved: 250,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await batchReservationService.reserveFIFO(params);

      expect(result.allocations).toHaveLength(2);
      expect(result.totalReserved).toBe(250);
    });

    it("should handle insufficient stock", async () => {
      apiClient.post.mockRejectedValue(new Error("Insufficient stock available"));

      const params = {
        productId: 123,
        requiredQuantity: 1000,
        lineItemTempId: "line-uuid-1",
      };

      await expect(batchReservationService.reserveFIFO(params)).rejects.toThrow("Insufficient stock available");
    });

    it("should respect warehouse context", async () => {
      const params = {
        productId: 123,
        warehouseId: 2,
        requiredQuantity: 100,
        lineItemTempId: "line-uuid-1",
      };

      apiClient.post.mockResolvedValue({ allocations: [] });

      await batchReservationService.reserveFIFO(params);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/batch-reservations/fifo",
        expect.objectContaining({ warehouse_id: 2 })
      );
    });
  });

  describe("Manual Reservation", () => {
    it("should reserve user-selected batches", async () => {
      const params = {
        productId: 123,
        warehouseId: 1,
        lineItemTempId: "line-uuid-1",
        allocations: [
          { batchId: 10, quantity: 50 },
          { batchId: 11, quantity: 50 },
        ],
      };

      const mockResponse = {
        reservationId: 2,
        allocations: params.allocations,
        totalReserved: 100,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await batchReservationService.reserveManual(params);

      expect(result.allocations).toHaveLength(2);
      expect(result.totalReserved).toBe(100);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/batch-reservations/manual",
        expect.objectContaining({
          allocations: params.allocations,
        })
      );
    });

    it("should validate batch quantities", async () => {
      apiClient.post.mockRejectedValue(new Error("Batch quantity exceeds stock"));

      const params = {
        productId: 123,
        lineItemTempId: "line-uuid-1",
        allocations: [{ batchId: 10, quantity: 1000 }],
      };

      await expect(batchReservationService.reserveManual(params)).rejects.toThrow();
    });
  });

  describe("Available Batches Query", () => {
    it("should fetch available batches with real-time availability", async () => {
      const params = {
        productId: 123,
        warehouseId: 1,
      };

      const mockResponse = {
        batches: [
          { batchId: 10, quantity: 100, gradeCode: "SS304", age: 30 },
          { batchId: 11, quantity: 50, gradeCode: "SS304", age: 25 },
        ],
        totalAvailable: 150,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await batchReservationService.getAvailableBatches(params);

      expect(result.batches).toHaveLength(2);
      expect(result.totalAvailable).toBe(150);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/batch-reservations/available",
        expect.objectContaining({
          product_id: 123,
          warehouse_id: 1,
        })
      );
    });

    it("should account for other users reservations", async () => {
      const params = {
        productId: 123,
        warehouseId: 1,
        draftInvoiceId: 0, // New draft
      };

      const mockResponse = {
        batches: [{ batchId: 10, quantity: 150, reserved: 50, available: 100 }],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await batchReservationService.getAvailableBatches(params);

      expect(result.batches[0].available).toBe(100);
    });

    it("should show user own reservations as available", async () => {
      const params = {
        productId: 123,
        warehouseId: 1,
        draftInvoiceId: 5, // Existing draft
      };

      apiClient.get.mockResolvedValue({ batches: [] });

      await batchReservationService.getAvailableBatches(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/batch-reservations/available",
        expect.objectContaining({ draft_invoice_id: 5 })
      );
    });
  });

  describe("Draft Reservation Management", () => {
    it("should get all reservations for a draft invoice", async () => {
      const mockResponse = {
        draftInvoiceId: 5,
        reservations: [
          {
            lineItemTempId: "line-1",
            allocations: [{ batchId: 10, quantity: 100 }],
          },
          {
            lineItemTempId: "line-2",
            allocations: [{ batchId: 11, quantity: 50 }],
          },
        ],
        totalReserved: 150,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await batchReservationService.getDraftReservations(5);

      expect(result.reservations).toHaveLength(2);
      expect(result.totalReserved).toBe(150);
      expect(apiClient.get).toHaveBeenCalledWith("/batch-reservations/draft/5", {});
    });

    it("should filter by line item", async () => {
      const mockResponse = {
        lineItemTempId: "line-1",
        allocations: [{ batchId: 10, quantity: 100 }],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      await batchReservationService.getDraftReservations(5, "line-1");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/batch-reservations/draft/5",
        expect.objectContaining({ line_item_temp_id: "line-1" })
      );
    });

    it("should cancel specific reservation", async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      await batchReservationService.cancelReservation(1);

      expect(apiClient.delete).toHaveBeenCalledWith("/batch-reservations/1");
    });

    it("should cancel all line item reservations", async () => {
      const params = {
        draftInvoiceId: 5,
        lineItemTempId: "line-1",
      };

      apiClient.delete.mockResolvedValue({ success: true, count: 2 });

      const result = await batchReservationService.cancelLineItemReservations(params);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(
        "/batch-reservations/line-item",
        expect.objectContaining({
          data: expect.any(Object),
        })
      );
    });

    it("should cancel all draft reservations", async () => {
      apiClient.delete.mockResolvedValue({ success: true, count: 5 });

      const result = await batchReservationService.cancelDraftReservations(5);

      expect(result.count).toBe(5);
      expect(apiClient.delete).toHaveBeenCalledWith("/batch-reservations/draft/5");
    });
  });

  describe("Reservation Extension", () => {
    it("should extend reservation expiry time", async () => {
      const params = {
        draftInvoiceId: 5,
        extendMinutes: 30,
      };

      const mockResponse = {
        expiresAt: "2024-02-03T10:30:00Z",
        extended: true,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await batchReservationService.extendReservation(params);

      expect(result.extended).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/batch-reservations/extend",
        expect.objectContaining({ extend_minutes: 30 })
      );
    });

    it("should extend specific line item only", async () => {
      const params = {
        draftInvoiceId: 5,
        lineItemTempId: "line-1",
        extendMinutes: 15,
      };

      apiClient.post.mockResolvedValue({ extended: true });

      await batchReservationService.extendReservation(params);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/batch-reservations/extend",
        expect.objectContaining({
          line_item_temp_id: "line-1",
          extend_minutes: 15,
        })
      );
    });
  });

  describe("Conversion to Consumption Records", () => {
    it("should convert draft reservations to invoice_batch_consumption", async () => {
      const params = {
        invoiceId: 100,
        lineItemMappings: [
          { lineItemTempId: "line-1", invoiceItemId: 1 },
          { lineItemTempId: "line-2", invoiceItemId: 2 },
        ],
      };

      const mockResponse = {
        conversionId: 50,
        success: true,
        itemsProcessed: 2,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await batchReservationService.convertReservations(params);

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith("/batch-reservations/convert", expect.any(Object));
    });
  });

  describe("Batch Consumption Details", () => {
    it("should get batch consumption for line item", async () => {
      const mockResponse = {
        invoiceItemId: 1,
        allocations: [
          { batchId: 10, quantity: 50, costPrice: 100 },
          { batchId: 11, quantity: 50, costPrice: 105 },
        ],
        totalCogs: 10250,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await batchReservationService.getLineItemBatchConsumption(1);

      expect(result.allocations).toHaveLength(2);
      expect(result.totalCogs).toBe(10250);
      expect(apiClient.get).toHaveBeenCalledWith("/batch-reservations/consumption/item/1");
    });

    it("should get batch consumption for entire invoice", async () => {
      const mockResponse = {
        invoiceId: 100,
        items: [
          {
            invoiceItemId: 1,
            allocations: [{ batchId: 10, quantity: 100 }],
            totalCogs: 10000,
          },
          {
            invoiceItemId: 2,
            allocations: [{ batchId: 11, quantity: 50 }],
            totalCogs: 5250,
          },
        ],
        totalInvoiceCogs: 15250,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await batchReservationService.getInvoiceBatchConsumptions(100);

      expect(result.items).toHaveLength(2);
      expect(result.totalInvoiceCogs).toBe(15250);
      expect(apiClient.get).toHaveBeenCalledWith("/batch-reservations/consumption/invoice/100");
    });
  });

  describe("Invoice Finalization (Phase 4)", () => {
    it("should finalize invoice with batch allocations", async () => {
      const params = {
        draftInvoiceId: 5,
        lineItemMappings: [{ lineItemTempId: "line-1", invoiceItemId: 1 }],
        targetStatus: "issued",
      };

      const mockResponse = {
        invoiceId: 100,
        invoiceNumber: "INV-2024-001",
        status: "issued",
        stockDeductionSummary: {
          totalDeducted: 100,
          batches: [{ batchId: 10, quantityDeducted: 100 }],
        },
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await batchReservationService.finalizeInvoice(params);

      expect(result.status).toBe("issued");
      expect(result.invoiceNumber).toBe("INV-2024-001");
      expect(result.stockDeductionSummary.totalDeducted).toBe(100);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/batch-reservations/finalize",
        expect.objectContaining({
          draft_invoice_id: 5,
          target_status: "issued",
        })
      );
    });

    it("should skip stock deduction for drop-ship only invoices", async () => {
      const params = {
        draftInvoiceId: 5,
        lineItemMappings: [{ lineItemTempId: "line-1", invoiceItemId: 1 }],
        skipStockDeduction: true,
      };

      apiClient.post.mockResolvedValue({
        invoiceId: 100,
        status: "issued",
        stockDeductionSkipped: true,
      });

      const result = await batchReservationService.finalizeInvoice(params);

      expect(result.stockDeductionSkipped).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/batch-reservations/finalize",
        expect.objectContaining({
          skip_stock_deduction: true,
        })
      );
    });

    it("should handle finalization errors", async () => {
      apiClient.post.mockRejectedValue(new Error("Reservations expired"));

      const params = {
        draftInvoiceId: 5,
        lineItemMappings: [],
      };

      await expect(batchReservationService.finalizeInvoice(params)).rejects.toThrow("Reservations expired");
    });
  });

  describe("Multi-tenancy", () => {
    it("should maintain company context in reservations", async () => {
      apiClient.post.mockResolvedValue({
        reservationId: 1,
        companyId: 1,
      });

      const params = {
        productId: 123,
        requiredQuantity: 100,
        lineItemTempId: "line-uuid-1",
      };

      const result = await batchReservationService.reserveFIFO(params);

      expect(result.companyId).toBe(1);
    });
  });

  describe("Inventory Accuracy", () => {
    it("should prevent double allocation of batches", async () => {
      apiClient.post.mockRejectedValue(new Error("Batch already reserved by another user"));

      const params = {
        productId: 123,
        requiredQuantity: 100,
        lineItemTempId: "line-uuid-1",
      };

      await expect(batchReservationService.reserveFIFO(params)).rejects.toThrow();
    });

    it("should track reservation expiry", async () => {
      const mockResponse = {
        allocations: [{ batchId: 10, quantity: 100 }],
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
        expiryMinutes: 30,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const params = {
        productId: 123,
        requiredQuantity: 100,
        lineItemTempId: "line-uuid-1",
      };

      const result = await batchReservationService.reserveFIFO(params);

      expect(result.expiryMinutes).toBe(30);
    });
  });
});
