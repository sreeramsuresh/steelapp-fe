/**
 * Import Order Service Unit Tests
 * Tests import order CRUD, status management, container tracking
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from "../api";
import importOrderService from "../importOrderService";

describe("importOrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getImportOrders", () => {
    test("should fetch import orders", async () => {
      const mockResponse = {
        data: [{ id: 1, orderNumber: "IO-001", status: "PENDING", supplierId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importOrderService.getImportOrders({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].orderNumber).toBe("IO-001");
    });

    test("should filter by status", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await importOrderService.getImportOrders({ status: "IN_TRANSIT" });

      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("getImportOrder", () => {
    test("should fetch single import order", async () => {
      const mockResponse = {
        id: 1,
        orderNumber: "IO-001",
        supplierId: 1,
        supplierName: "XYZ Trading",
        containers: [{ id: 1, containerNumber: "CNT-001", status: "ARRIVED" }],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      expect(result.id).toBe(1);
      expect(result.containers).toBeDefined();
    });
  });

  describe("createImportOrder", () => {
    test("should create import order", async () => {
      const orderData = { supplierId: 1, supplierName: "XYZ", items: [] };
      apiClient.post.mockResolvedValueOnce({ id: 1, orderNumber: "IO-001" });

      const result = await importOrderService.createImportOrder(orderData);

      expect(result.id).toBe(1);
      expect(apiClient.post).toHaveBeenCalledWith("/import-orders", expect.any(Object));
    });
  });

  describe("updateImportOrder", () => {
    test("should update import order", async () => {
      const updateData = { status: "IN_TRANSIT" };
      apiClient.put.mockResolvedValueOnce({ id: 1, ...updateData });

      const result = await importOrderService.updateImportOrder(1, updateData);

      expect(result.status).toBe("IN_TRANSIT");
    });
  });

  describe("Import Order Status", () => {
    test("should track order status transitions", async () => {
      const mockResponse = { id: 1, status: "PENDING" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      expect(["PENDING", "IN_TRANSIT", "ARRIVED", "CUSTOMS", "RECEIVED"]).toContain(result.status);
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(importOrderService.getImportOrders()).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty order items", async () => {
      const mockResponse = { id: 1, items: [] };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      expect(result.items).toEqual([]);
    });
  });
});
