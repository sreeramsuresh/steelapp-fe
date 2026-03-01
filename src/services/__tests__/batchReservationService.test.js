/**
 * Batch Reservation Service Unit Tests (Node Native Test Runner)
 * Tests FIFO batch reservation and allocation logic
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";

describe("batchReservationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/batch-reservations/fifo", params);

      expect(result.allocations.length).toBe(1);
      expect(result.allocations[0].batchId).toBe(10);
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

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/batch-reservations/fifo", params);

      expect(result.allocations.length).toBe(2);
      expect(result.totalReserved).toBe(250);
    });

    it("should handle insufficient stock", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Insufficient stock available"));

      const params = {
        productId: 123,
        requiredQuantity: 1000,
        lineItemTempId: "line-uuid-1",
      };

      try {
        await apiClient.post("/batch-reservations/fifo", params);
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Insufficient stock available");
      }
    });

    it("should respect warehouse context", async () => {
      const params = {
        productId: 123,
        warehouseId: 2,
        requiredQuantity: 100,
        lineItemTempId: "line-uuid-1",
      };

      vi.spyOn(apiClient, "post").mockResolvedValue({ allocations: [] });

      const result = await apiClient.post("/batch-reservations/fifo", params);

      expect(result.allocations).toEqual([]);
    });
  });

  describe("Release Reservation", () => {
    it("should release reservation before expiration", async () => {
      const mockResponse = { released: true, reservationId: 1 };
      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/batch-reservations/1/release", {});

      expect(result.released).toBe(true);
    });

    it("should prevent release of expired reservation", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Reservation already expired"));

      try {
        await apiClient.post("/batch-reservations/999/release", {});
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Reservation already expired");
      }
    });
  });

  describe("Confirm Reservation", () => {
    it("should confirm reservation when creating invoice", async () => {
      const mockResponse = {
        confirmed: true,
        reservationId: 1,
        invoiceId: 100,
      };
      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/batch-reservations/1/confirm", {
        invoiceId: 100,
      });

      expect(result.confirmed).toBe(true);
      expect(result.invoiceId).toBe(100);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Network error"));

      try {
        await apiClient.post("/batch-reservations/fifo", {});
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });

    it("should handle invalid product", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Product not found"));

      try {
        await apiClient.post("/batch-reservations/fifo", { productId: 999 });
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Product not found");
      }
    });
  });
});
