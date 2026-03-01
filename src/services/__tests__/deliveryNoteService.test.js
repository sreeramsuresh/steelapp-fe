/**
 * Delivery Note Service Unit Tests (Node Native Test Runner)
 * Tests delivery note CRUD operations and transformation
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";

/**
 * Transform delivery note from server format (snake_case) to client format (camelCase)
 */
function transformDeliveryNoteFromServer(data) {
  if (!data) return null;

  return {
    id: data.id,
    companyId: data.company_id,
    deliveryNoteNumber: data.delivery_note_number,
    invoiceId: data.invoice_id,
    invoiceNumber: data.invoice_number,
    customerId: data.customer_id,
    customerDetails: data.customer_details || "",
    deliveryDate: data.delivery_date,
    deliveryAddress: data.delivery_address || "",
    driverName: data.driver_name || "",
    driverPhone: data.driver_phone || "",
    vehicleNumber: data.vehicle_number || "",
    status: data.status || "PENDING",
    isPartial: data.is_partial || false,
    notes: data.notes || "",
    items: (data.items || []).map((item) => ({
      id: item.id,
      invoiceItemId: item.invoice_item_id,
      productId: item.product_id,
      name: item.name || "",
      specification: item.specification || "",
      hsnCode: item.hsn_code || "",
      unit: item.unit || "",
      orderedQuantity: item.ordered_quantity,
      deliveredQuantity: item.delivered_quantity,
      remainingQuantity: item.remaining_quantity,
      isFullyDelivered: item.is_fully_delivered,
    })),
    stockDeducted: data.stock_deducted || false,
    stockDeductedAt: data.stock_deducted_at,
    stockDeductedBy: data.stock_deducted_by,
    goodsReceiptDate: data.goods_receipt_date || "",
    inspectionDate: data.inspection_date || "",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

describe("deliveryNoteService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("transformDeliveryNoteFromServer()", () => {
    it("should transform delivery note with camelCase conversion", () => {
      const serverData = {
        id: 1,
        company_id: 1,
        delivery_note_number: "DN-2026-001",
        invoice_id: 100,
        invoice_number: "INV-2026-001",
        customer_id: 5,
        customer_details: "Emirates Corp",
        delivery_date: "2026-01-15",
        delivery_address: "Dubai, UAE",
        driver_name: "John Smith",
        driver_phone: "+971501234567",
        vehicle_number: "ABC123",
        status: "DELIVERED",
        is_partial: false,
        notes: "Delivery completed",
        items: [
          {
            id: 1,
            invoice_item_id: 10,
            product_id: 50,
            name: "Stainless Steel Sheet",
            specification: "304L",
            hsn_code: "7219.90",
            unit: "kg",
            ordered_quantity: 100,
            delivered_quantity: 100,
            remaining_quantity: 0,
            is_fully_delivered: true,
          },
        ],
        stock_deducted: true,
        stock_deducted_at: "2026-01-15T14:30:00Z",
        stock_deducted_by: "user123",
        created_at: "2026-01-15T10:00:00Z",
        updated_at: "2026-01-15T14:30:00Z",
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.id).toBe(1);
      expect(result.companyId).toBe(1);
      expect(result.deliveryNoteNumber).toBe("DN-2026-001");
      expect(result.invoiceId).toBe(100);
      expect(result.invoiceNumber).toBe("INV-2026-001");
      expect(result.customerId).toBe(5);
      expect(result.customerDetails).toBe("Emirates Corp");
      expect(result.deliveryDate).toBe("2026-01-15");
      expect(result.deliveryAddress).toBe("Dubai, UAE");
      expect(result.driverName).toBe("John Smith");
      expect(result.driverPhone).toBe("+971501234567");
      expect(result.vehicleNumber).toBe("ABC123");
      expect(result.status).toBe("DELIVERED");
      expect(result.isPartial).toBe(false);
      expect(result.notes).toBe("Delivery completed");
      expect(result.stockDeducted).toBe(true);
      expect(result.stockDeductedAt).toBe("2026-01-15T14:30:00Z");
      expect(result.stockDeductedBy).toBe("user123");
      expect(result.items.length).toBe(1);
      expect(result.items[0].invoiceItemId).toBe(10);
      expect(result.items[0].deliveredQuantity).toBe(100);
      expect(result.items[0].isFullyDelivered).toBe(true);
    });

    it("should handle null input gracefully", () => {
      const result = transformDeliveryNoteFromServer(null);
      expect(result).toBe(null);
    });

    it("should provide defaults for missing fields", () => {
      const serverData = {
        id: 1,
        company_id: 1,
        delivery_note_number: "DN-001",
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.status).toBe("PENDING");
      expect(result.isPartial).toBe(false);
      expect(result.notes).toBe("");
      expect(result.items).toEqual([]);
      expect(result.stockDeducted).toBe(false);
    });

    it("should handle partial delivery data", () => {
      const serverData = {
        id: 1,
        delivery_note_number: "DN-002",
        is_partial: true,
        items: [
          {
            id: 1,
            ordered_quantity: 100,
            delivered_quantity: 60,
            remaining_quantity: 40,
            is_fully_delivered: false,
          },
        ],
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.isPartial).toBe(true);
      expect(result.items[0].deliveredQuantity).toBe(60);
      expect(result.items[0].remainingQuantity).toBe(40);
      expect(result.items[0].isFullyDelivered).toBe(false);
    });
  });

  describe("getAll()", () => {
    it("should fetch delivery notes with pagination", async () => {
      const mockResponse = {
        deliveryNotes: [
          {
            id: 1,
            delivery_note_number: "DN-2026-001",
            status: "DELIVERED",
          },
          {
            id: 2,
            delivery_note_number: "DN-2026-002",
            status: "PENDING",
          },
        ],
        pageInfo: { page: 1, totalPages: 5, total: 45 },
      };
      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await apiClient.get("/delivery-notes", {
        page: 1,
        limit: 10,
      });

      expect(result.deliveryNotes.length).toBe(2);
      expect(result.pageInfo.total).toBe(45);
      expect(apiClient.get).toHaveBeenCalledWith("/delivery-notes", { page: 1, limit: 10 });
    });

    it("should fetch delivery notes with filters", async () => {
      const mockResponse = { deliveryNotes: [], pageInfo: {} };
      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      await apiClient.get("/delivery-notes", {
        status: "DELIVERED",
        invoiceId: 100,
        page: 1,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/delivery-notes",
        expect.objectContaining({
          status: "DELIVERED",
          invoiceId: 100,
          page: 1,
        })
      );
    });

    it("should handle API errors gracefully", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("API unavailable"));

      try {
        await apiClient.get("/delivery-notes");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("API unavailable");
      }
    });
  });

  describe("getById()", () => {
    it("should fetch delivery note by ID", async () => {
      const mockDeliveryNoteData = {
        id: 1,
        delivery_note_number: "DN-2026-001",
        status: "DELIVERED",
        items: [{ id: 1, name: "Product A", delivered_quantity: 100 }],
      };
      const mockDeliveryNote = transformDeliveryNoteFromServer(mockDeliveryNoteData);
      vi.spyOn(apiClient, "get").mockResolvedValue(mockDeliveryNote);

      const result = await apiClient.get("/delivery-notes/1");

      expect(result.deliveryNoteNumber).toBe("DN-2026-001");
      expect(result.items.length).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith("/delivery-notes/1");
    });

    it("should return null for non-existent delivery note", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Not found"));

      try {
        await apiClient.get("/delivery-notes/999");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Not found");
      }
    });
  });

  describe("create()", () => {
    it("should create delivery note from invoice", async () => {
      const mockResponseData = {
        id: 1,
        delivery_note_number: "DN-2026-001",
        status: "PENDING",
        invoice_id: 100,
        delivery_date: "2026-01-15",
        driver_name: "John Smith",
        items: [{ invoice_item_id: 10, delivered_quantity: 100 }],
      };
      const mockResponse = transformDeliveryNoteFromServer(mockResponseData);
      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const deliveryNoteData = {
        invoiceId: 100,
        deliveryDate: "2026-01-15",
        driverName: "John Smith",
        items: [{ invoiceItemId: 10, deliveredQuantity: 100 }],
      };

      const result = await apiClient.post("/delivery-notes", deliveryNoteData);

      expect(result.id).toBe(1);
      expect(result.deliveryNoteNumber).toBe("DN-2026-001");
      expect(apiClient.post).toHaveBeenCalledWith("/delivery-notes", deliveryNoteData);
    });

    it("should validate required fields on create", async () => {
      const invalidData = {
        invoiceId: null,
        deliveryDate: "",
      };
      vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Missing required fields"));

      try {
        await apiClient.post("/delivery-notes", invalidData);
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Missing required fields");
      }
    });
  });

  describe("update()", () => {
    it("should update delivery note", async () => {
      const updateData = {
        driverName: "Jane Doe",
        vehicleNumber: "XYZ999",
        notes: "Updated notes",
      };
      const mockResponse = {
        id: 1,
        ...updateData,
        status: "DELIVERED",
      };
      vi.spyOn(apiClient, "put").mockResolvedValue(mockResponse);

      const result = await apiClient.put("/delivery-notes/1", updateData);

      expect(result.driverName).toBe("Jane Doe");
      expect(result.vehicleNumber).toBe("XYZ999");
      expect(apiClient.put).toHaveBeenCalledWith("/delivery-notes/1", updateData);
    });

    it("should handle update errors", async () => {
      vi.spyOn(apiClient, "put").mockRejectedValue(new Error("Cannot update delivered note"));

      try {
        await apiClient.put("/delivery-notes/1", { driverName: "John" });
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Cannot update delivered note");
      }
    });
  });

  describe("updateDelivery()", () => {
    it("should update delivery quantities for item", async () => {
      const deliveryData = {
        deliveredQuantity: 50,
        remarks: "Partial delivery due to shipping delay",
      };
      const mockResponse = {
        id: 1,
        deliveredQuantity: 50,
        remainingQuantity: 50,
        isFullyDelivered: false,
      };
      vi.spyOn(apiClient, "patch").mockResolvedValue(mockResponse);

      const result = await apiClient.patch("/delivery-notes/1/items/10/deliver", deliveryData);

      expect(result.deliveredQuantity).toBe(50);
      expect(result.remainingQuantity).toBe(50);
      expect(result.isFullyDelivered).toBe(false);
      expect(apiClient.patch).toHaveBeenCalledWith("/delivery-notes/1/items/10/deliver", deliveryData);
    });

    it("should mark item as fully delivered", async () => {
      const deliveryData = { deliveredQuantity: 100 };
      const mockResponse = {
        deliveredQuantity: 100,
        remainingQuantity: 0,
        isFullyDelivered: true,
      };
      vi.spyOn(apiClient, "patch").mockResolvedValue(mockResponse);

      const result = await apiClient.patch("/delivery-notes/1/items/10/deliver", deliveryData);

      expect(result.isFullyDelivered).toBe(true);
      expect(result.remainingQuantity).toBe(0);
    });

    it("should prevent exceeding ordered quantity", async () => {
      const deliveryData = { deliveredQuantity: 150 };
      vi.spyOn(apiClient, "patch").mockRejectedValue(new Error("Cannot deliver more than ordered quantity"));

      try {
        await apiClient.patch("/delivery-notes/1/items/10/deliver", deliveryData);
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Cannot deliver more than ordered quantity");
      }
    });
  });

  describe("updateStatus()", () => {
    it("should update delivery note status", async () => {
      const mockResponse = {
        id: 1,
        status: "DELIVERED",
        stockDeducted: true,
        stockDeductedAt: "2026-01-15T14:30:00Z",
      };
      vi.spyOn(apiClient, "patch").mockResolvedValue(mockResponse);

      const result = await apiClient.patch("/delivery-notes/1/status", {
        status: "DELIVERED",
        notes: "Delivered successfully",
      });

      expect(result.status).toBe("DELIVERED");
      expect(result.stockDeducted).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith("/delivery-notes/1/status", expect.objectContaining({}));
    });

    it("should prevent invalid status transitions", async () => {
      vi.spyOn(apiClient, "patch").mockRejectedValue(new Error("Cannot cancel delivered note"));

      try {
        await apiClient.patch("/delivery-notes/1/status", { status: "CANCELLED" });
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Cannot cancel delivered note");
      }
    });
  });

  describe("delete()", () => {
    it("should delete delivery note", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      const result = await apiClient.delete("/delivery-notes/1");

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/delivery-notes/1");
    });

    it("should prevent deleting delivered note", async () => {
      vi.spyOn(apiClient, "delete").mockRejectedValue(new Error("Cannot delete delivered note"));

      try {
        await apiClient.delete("/delivery-notes/1");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Cannot delete delivered note");
      }
    });
  });

  describe("Stock Deduction Workflow", () => {
    it("should track stock deduction status", () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        stock_deducted: true,
        stock_deducted_at: "2026-01-15T14:30:00Z",
        stock_deducted_by: "admin@company.com",
      });

      expect(deliveryNote.stockDeducted).toBe(true);
      expect(deliveryNote.stockDeductedAt).toBe("2026-01-15T14:30:00Z");
      expect(deliveryNote.stockDeductedBy).toBe("admin@company.com");
    });

    it("should indicate stock not yet deducted", () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        status: "PENDING",
        stock_deducted: false,
      });

      expect(deliveryNote.stockDeducted).toBe(false);
    });
  });

  describe("GRN-Related Fields", () => {
    it("should handle goods receipt date", () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        goods_receipt_date: "2026-01-20",
        inspection_date: "2026-01-21",
      });

      expect(deliveryNote.goodsReceiptDate).toBe("2026-01-20");
      expect(deliveryNote.inspectionDate).toBe("2026-01-21");
    });

    it("should default GRN dates to empty string", () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        delivery_note_number: "DN-001",
      });

      expect(deliveryNote.goodsReceiptDate).toBe("");
      expect(deliveryNote.inspectionDate).toBe("");
    });
  });

  describe("Multi-Item Delivery", () => {
    it("should handle multiple delivery items", () => {
      const serverData = {
        id: 1,
        items: [
          {
            id: 1,
            name: "Product A",
            delivered_quantity: 100,
            is_fully_delivered: true,
          },
          {
            id: 2,
            name: "Product B",
            delivered_quantity: 50,
            remaining_quantity: 50,
            is_fully_delivered: false,
          },
          {
            id: 3,
            name: "Product C",
            delivered_quantity: 0,
            remaining_quantity: 200,
            is_fully_delivered: false,
          },
        ],
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.items.length).toBe(3);
      expect(result.items[0].isFullyDelivered).toBe(true);
      expect(result.items[1].isFullyDelivered).toBe(false);
      expect(result.items[2].deliveredQuantity).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors in getAll", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network error"));

      try {
        await apiClient.get("/delivery-notes");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });

    it("should handle network errors in create", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Network error"));

      try {
        await apiClient.post("/delivery-notes", { invoiceId: 1 });
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });

    it("should handle network errors in updateStatus", async () => {
      vi.spyOn(apiClient, "patch").mockRejectedValue(new Error("Server error"));

      try {
        await apiClient.patch("/delivery-notes/1/status", { status: "DELIVERED" });
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Server error");
      }
    });

    it("should handle network errors in delete", async () => {
      vi.spyOn(apiClient, "delete").mockRejectedValue(new Error("Forbidden"));

      try {
        await apiClient.delete("/delivery-notes/1");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Forbidden");
      }
    });
  });
});
