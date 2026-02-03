/**
 * Export Order Service Unit Tests
 * Tests export order CRUD and export logistics
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from "../api.js";
import exportOrderService from "../exportOrderService.js";

describe("exportOrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getExportOrders", () => {
    test("should fetch export orders", async () => {
      const mockResponse = {
        data: [{ id: 1, orderNumber: "EO-001", status: "DRAFT", customerId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await exportOrderService.getExportOrders({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].orderNumber).toBe("EO-001");
    });

    test("should filter by customer", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await exportOrderService.getExportOrders({ customerId: 1 });

      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("getExportOrder", () => {
    test("should fetch single export order", async () => {
      const mockResponse = {
        id: 1,
        orderNumber: "EO-001",
        customerId: 1,
        customerName: "International Corp",
        destination: "USA",
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await exportOrderService.getExportOrder(1);

      expect(result.id).toBe(1);
      expect(result.destination).toBe("USA");
    });
  });

  describe("createExportOrder", () => {
    test("should create export order", async () => {
      const orderData = { customerId: 1, destination: "USA", items: [] };
      apiClient.post.mockResolvedValueOnce({ id: 1, orderNumber: "EO-001" });

      const result = await exportOrderService.createExportOrder(orderData);

      expect(result.id).toBe(1);
    });
  });

  describe("updateExportOrder", () => {
    test("should update export order", async () => {
      const updateData = { status: "SHIPPED" };
      apiClient.put.mockResolvedValueOnce({ id: 1, ...updateData });

      const result = await exportOrderService.updateExportOrder(1, updateData);

      expect(result.status).toBe("SHIPPED");
    });
  });

  describe("Export Status", () => {
    test("should track export status", async () => {
      const mockResponse = { id: 1, status: "PACKING" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await exportOrderService.getExportOrder(1);

      expect(["DRAFT", "PACKING", "READY", "SHIPPED", "DELIVERED"]).toContain(result.status);
    });
  });

  describe("Error Handling", () => {
    test("should handle errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Error"));

      await expect(exportOrderService.getExportOrders()).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty list", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      const result = await exportOrderService.getExportOrders();

      expect(result.data).toEqual([]);
    });
  });
});
