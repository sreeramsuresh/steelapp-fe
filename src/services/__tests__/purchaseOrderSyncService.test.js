import { beforeEach, describe, expect, it, vi } from "vitest";
import { purchaseOrderSyncService } from "../purchaseOrderSyncService.js";

vi.mock("../inventoryService.js", () => ({
  inventoryService: {
    updateItem: vi.fn(),
    createItem: vi.fn(),
  },
}));

vi.mock("../notificationService.js", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../stockMovementService.js", () => ({
  stockMovementService: {
    createMovement: vi.fn(),
  },
}));

import { inventoryService } from "../inventoryService.js";
import { notificationService } from "../notificationService.js";
import { stockMovementService } from "../stockMovementService.js";

describe("purchaseOrderSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handlePOStatusChange", () => {
    it("should handle PO status change to received", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        status: "draft",
        stockStatus: "transit",
        items: [
          {
            id: 1,
            productType: "Stainless Steel",
            quantity: 100,
            rate: 50,
          },
        ],
        warehouseId: 1,
        warehouseName: "Dubai Warehouse",
        supplierName: "Steel Supplier",
      };

      inventoryService.createItem.mockResolvedValue({ id: 1 });
      stockMovementService.createMovement.mockResolvedValue({ id: 1 });

      const result = await purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain");

      expect(result).toBe(true);
      expect(inventoryService.createItem).toHaveBeenCalled();
    });

    it("should handle transit to retain status change", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        status: "received",
        stockStatus: "transit",
        items: [],
        warehouseId: 1,
      };

      const result = await purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain");

      expect(result).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        status: "draft",
        items: [],
      };

      inventoryService.createItem.mockRejectedValue(new Error("DB Error"));

      await expect(purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain")).rejects.toThrow();

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe("addPOItemsToInventory", () => {
    it("should add PO items to inventory", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        items: [
          {
            id: 1,
            productType: "Plate",
            grade: "304",
            quantity: 50,
            rate: 100,
          },
        ],
        warehouseId: 1,
        warehouseName: "Dubai",
        supplierName: "Supplier A",
      };

      inventoryService.createItem.mockResolvedValue({ id: 1 });
      stockMovementService.createMovement.mockResolvedValue({ id: 1 });

      await purchaseOrderSyncService.addPOItemsToInventory(po);

      expect(inventoryService.createItem).toHaveBeenCalled();
      expect(stockMovementService.createMovement).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it("should update existing inventory items", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        items: [
          {
            id: 1,
            productType: "Plate",
            quantity: 50,
            rate: 100,
          },
        ],
        warehouseId: 1,
        warehouseName: "Dubai",
        supplierName: "Supplier A",
      };

      inventoryService.createItem.mockResolvedValue({ id: 1 });
      stockMovementService.createMovement.mockResolvedValue({ id: 1 });

      await purchaseOrderSyncService.addPOItemsToInventory(po);

      expect(notificationService.success).toHaveBeenCalledWith(expect.stringContaining("Added"));
    });
  });

  describe("generateItemDescription", () => {
    it("should generate item description from PO item details", () => {
      const item = {
        productType: "plate",
        grade: "304",
        finish: "polished",
        size: "2000x1000",
        thickness: "3",
      };

      const description = purchaseOrderSyncService.generateItemDescription(item);

      expect(description).toContain("PLATE");
      expect(description).toContain("304");
    });

    it("should use name fallback if productType missing", () => {
      const item = {
        name: "stainless steel",
        thickness: "2",
      };

      const description = purchaseOrderSyncService.generateItemDescription(item);

      expect(description).toContain("STAINLESS STEEL");
    });

    it("should return default for empty item", () => {
      const description = purchaseOrderSyncService.generateItemDescription({});

      expect(description).toBe("Steel Product");
    });
  });

  describe("generateTransitStockMovements", () => {
    it("should generate transit movements for POs in transit", () => {
      const pos = [
        {
          id: 1,
          poNumber: "PO-001",
          status: "pending",
          stockStatus: "transit",
          expectedDeliveryDate: "2024-01-20",
          items: [
            {
              id: 1,
              productType: "Plate",
              quantity: 100,
            },
          ],
          supplierName: "Supplier A",
        },
      ];

      const movements = purchaseOrderSyncService.generateTransitStockMovements(pos);

      expect(movements).toHaveLength(1);
      expect(movements[0].isTransit).toBe(true);
      expect(movements[0].quantity).toBe(-100);
    });

    it("should not generate movements for received POs", () => {
      const pos = [
        {
          id: 1,
          poNumber: "PO-001",
          status: "received",
          stockStatus: "transit",
          items: [
            {
              id: 1,
              productType: "Plate",
              quantity: 100,
            },
          ],
          supplierName: "Supplier A",
        },
      ];

      const movements = purchaseOrderSyncService.generateTransitStockMovements(pos);

      expect(movements).toHaveLength(0);
    });

    it("should not generate movements for cancelled POs", () => {
      const pos = [
        {
          id: 1,
          poNumber: "PO-001",
          status: "cancelled",
          stockStatus: "transit",
          items: [{ id: 1, productType: "Plate", quantity: 100 }],
          supplierName: "Supplier A",
        },
      ];

      const movements = purchaseOrderSyncService.generateTransitStockMovements(pos);

      expect(movements).toHaveLength(0);
    });
  });

  describe("findExistingInventoryItem", () => {
    it("should return empty array (not implemented)", () => {
      const item = { productType: "Plate", quantity: 100 };
      const result = purchaseOrderSyncService.findExistingInventoryItem(item, 1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe("createStockMovement", () => {
    it("should create stock movement for PO items", async () => {
      const po = {
        poNumber: "PO-001",
        supplierName: "Supplier A",
      };

      const item = {
        productType: "Plate",
        quantity: 50,
      };

      stockMovementService.createMovement.mockResolvedValue({ id: 1 });

      await purchaseOrderSyncService.createStockMovement(po, item, "IN", "Received from PO");

      expect(stockMovementService.createMovement).toHaveBeenCalled();
    });
  });
});
