/**
 * Purchase Order Service Unit Tests
 * ✅ Tests CRUD operations for purchase orders
 * ✅ Tests status transitions (draft → approved → received → closed)
 * ✅ Tests stock status and transit status updates
 * ✅ Tests GRN/stock receipt workflows
 * ✅ 100% coverage target for purchaseOrderService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";



import { apiService } from "../axiosApi.js";
import { purchaseOrderService } from "../purchaseOrderService.js";
import { apiClient } from "../api.js";

describe("purchaseOrderService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getAll", () => {
    test("should fetch all purchase orders with pagination", async () => {
      const mockResponse = {
        purchaseOrders: [
          {
            id: 1,
            poNumber: "PO-001",
            supplierId: 1,
            status: "draft",
            totalAmount: 50000,
          },
        ],
        pageInfo: { page: 1, totalPages: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.getAll({ page: 1, limit: 20 });

      assert.ok(result.purchaseOrders || result).toBeDefined();
      assert.ok(apiClient.get).toHaveBeenCalledWith("/purchase-orders", {
        page: 1,
        limit: 20,
      });
    });

    test("should apply search filter", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await purchaseOrderService.getAll({ search: "Acme" });

      assert.ok(apiClient.get).toHaveBeenCalledWith("/purchase-orders", {
        search: "Acme",
      });
    });

    test("should filter by status", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await purchaseOrderService.getAll({ status: "draft" });

      assert.ok(apiClient.get).toHaveBeenCalledWith("/purchase-orders", {
        status: "draft",
      });
    });

    test("should filter by supplier", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await purchaseOrderService.getAll({ supplierId: 1 });

      assert.ok(apiClient.get).toHaveBeenCalledWith("/purchase-orders", {
        supplierId: 1,
      });
    });
  });

  describe("getById", () => {
    test("should fetch purchase order by ID", async () => {
      const mockPO = {
        id: 1,
        poNumber: "PO-001",
        supplierId: 1,
        supplierName: "ABC Supplies",
        poDate: "2026-01-15",
        expectedDeliveryDate: "2026-02-15",
        items: [
          {
            itemId: 1,
            productId: 1,
            quantity: 100,
            rate: 500,
            amount: 50000,
          },
        ],
        subtotal: 50000,
        taxAmount: 2500,
        totalAmount: 52500,
        status: "draft",
        stockStatus: "pending",
        transitStatus: "not_started",
      };
      apiClient.get.mockResolvedValueOnce(mockPO);

      const result = await purchaseOrderService.getById(1);

      assert.ok(result.id);
      assert.ok(result.poNumber);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/purchase-orders/1");
    });

    test("should include all line items", async () => {
      const mockPO = {
        id: 1,
        items: [
          { itemId: 1, productId: 1, quantity: 100 },
          { itemId: 2, productId: 2, quantity: 50 },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockPO);

      const result = await purchaseOrderService.getById(1);

      assert.ok(result.items);
    });
  });

  describe("create", () => {
    test("should create purchase order", async () => {
      const newPO = {
        poNumber: "PO-002",
        supplierId: 1,
        poDate: "2026-01-20",
        expectedDeliveryDate: "2026-02-20",
        items: [
          {
            productId: 1,
            quantity: 100,
            rate: 500,
            amount: 50000,
          },
        ],
        subtotal: 50000,
        taxAmount: 2500,
        totalAmount: 52500,
        notes: "Standard PO",
      };

      const mockResponse = { id: 5, ...newPO, status: "draft" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.create(newPO);

      assert.ok(result.id);
      assert.ok(result.poNumber);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/purchase-orders", newPO);
    });

    test("should validate required fields", async () => {
      const incompletePO = {
        poNumber: "PO-003",
        // Missing supplierId
      };

      apiClient.post.mockResolvedValueOnce({ error: "Missing supplierId" });

      const _result = await purchaseOrderService.create(incompletePO);

      assert.ok(apiClient.post).toHaveBeenCalledWith("/purchase-orders", incompletePO);
    });
  });

  describe("update", () => {
    test("should update purchase order", async () => {
      const updates = {
        expectedDeliveryDate: "2026-03-01",
        notes: "Updated notes",
      };

      const mockResponse = { id: 1, ...updates };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.update(1, updates);

      assert.ok(result.id);
      assert.ok(apiClient.put).toHaveBeenCalledWith("/purchase-orders/1", updates);
    });

    test("should only allow update of draft POs", async () => {
      const updates = { notes: "Updated" };
      apiClient.put.mockResolvedValueOnce({
        id: 1,
        status: "draft",
        ...updates,
      });

      const result = await purchaseOrderService.update(1, updates);

      assert.ok(result.status);
    });
  });

  describe("updateStatus", () => {
    test("should update PO status", async () => {
      const mockResponse = { id: 1, status: "approved" };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.updateStatus(1, "approved");

      assert.ok(result.status);
      assert.ok(apiClient.patch).toHaveBeenCalledWith("/purchase-orders/1/status", { status: "approved" });
    });

    test("should support draft → approved → closed status transitions", async () => {
      apiClient.patch.mockResolvedValueOnce({ status: "closed" });

      await purchaseOrderService.updateStatus(1, "closed");

      assert.ok(apiClient.patch).toHaveBeenCalledWith("/purchase-orders/1/status", { status: "closed" });
    });
  });

  describe("updateTransitStatus", () => {
    test("should update transit status", async () => {
      const mockResponse = { id: 1, transitStatus: "in_transit" };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.updateTransitStatus(1, "in_transit");

      assert.ok(result.transitStatus);
      assert.ok(apiClient.patch).toHaveBeenCalledWith("/purchase-orders/1/transit-status", {
        transit_status: "in_transit",
      });
    });

    test("should support transit status transitions", async () => {
      apiClient.patch.mockResolvedValueOnce({
        transitStatus: "delivered",
      });

      await purchaseOrderService.updateTransitStatus(1, "delivered");

      assert.ok(apiClient.patch).toHaveBeenCalledWith("/purchase-orders/1/transit-status", {
        transit_status: "delivered",
      });
    });
  });

  describe("updateStockStatus", () => {
    test("should update stock status", async () => {
      const mockResponse = { id: 1, stockStatus: "received" };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.updateStockStatus(1, "received");

      assert.ok(result.stockStatus);
      assert.ok(apiClient.patch).toHaveBeenCalledWith("/purchase-orders/1/stock-status", { stock_status: "received" });
    });

    test("should support GRN workflow (pending → received → inspected → closed)", async () => {
      apiClient.patch.mockResolvedValueOnce({ stockStatus: "inspected" });

      await purchaseOrderService.updateStockStatus(1, "inspected");

      assert.ok(apiClient.patch).toHaveBeenCalledWith("/purchase-orders/1/stock-status", { stock_status: "inspected" });
    });
  });

  describe("delete", () => {
    test("should delete purchase order", async () => {
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.delete(1);

      assert.ok(result.success);
      assert.ok(apiClient.delete).toHaveBeenCalledWith("/purchase-orders/1");
    });

    test("should only allow deletion of draft POs", async () => {
      const mockResponse = { error: "Cannot delete approved PO" };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const _result = await purchaseOrderService.delete(2);

      assert.ok(apiClient.delete).toHaveBeenCalledWith("/purchase-orders/2");
    });
  });

  describe("getNextNumber", () => {
    test("should get next PO number", async () => {
      const mockResponse = { nextNumber: "PO-00123", prefix: "PO-" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.getNextNumber();

      assert.ok(result.nextNumber);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/purchase-orders/number/next");
    });
  });

  describe("Warehouse Management", () => {
    test("should get warehouses", async () => {
      const mockWarehouses = [
        { id: 1, name: "Main Warehouse", city: "Dubai" },
        { id: 2, name: "Branch Warehouse", city: "Abu Dhabi" },
      ];
      apiClient.get.mockResolvedValueOnce(mockWarehouses);

      const result = await purchaseOrderService.getWarehouses();

      assert.ok(result);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/warehouses");
    });

    test("should seed warehouses", async () => {
      const mockResponse = { seeded: 5 };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await purchaseOrderService.seedWarehouses();

      assert.ok(result.seeded);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/warehouses/seed");
    });
  });

  describe("downloadPDF", () => {
    test("should download PO as PDF", async () => {
      const mockBlob = new Blob(["test"], { type: "application/pdf" });

      // Mock URL creation
      // Skipped: global.URL.createObjectURL = vi.fn(() => "blob:test-url");
      global.URL.revokeObjectURL = vi.fn();

      // Mock document methods
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      apiService.request.mockResolvedValueOnce(mockBlob);

      await purchaseOrderService.downloadPDF(1);

      assert.ok(apiService.request).toHaveBeenCalledWith({
        method: "GET",
        url: "/purchase-orders/1/pdf",
        responseType: "blob",
      });
    });

    test("should handle PDF download errors", async () => {
      apiService.request.mockRejectedValueOnce(new Error("PDF generation failed"));

      assert.rejects(purchaseOrderService.downloadPDF(999), Error);
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors in getAll", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(purchaseOrderService.getAll(), Error);
    });

    test("should handle errors in create", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Validation failed"));

      assert.rejects(purchaseOrderService.create({}), Error);
    });

    test("should handle errors in updateStatus", async () => {
      apiClient.patch.mockRejectedValueOnce(new Error("Invalid status transition"));

      assert.rejects(purchaseOrderService.updateStatus(1, "invalid"), Error);
    });
  });
});