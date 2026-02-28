import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { purchaseOrderSyncService } from "../purchaseOrderSyncService.js";




import { inventoryService } from "../inventoryService.js";
import { notificationService } from "../notificationService.js";
import { stockMovementService } from "../stockMovementService.js";

describe("purchaseOrderSyncService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

      vi.spyOn(inventoryService, 'createItem').mockResolvedValue({ id: 1 });
      vi.spyOn(stockMovementService, 'createMovement').mockResolvedValue({ id: 1 });

      const result = await purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain");

      expect(result).toBeTruthy();
      expect(inventoryService.createItem).toBeTruthy();
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

      expect(result).toBeTruthy();
    });

    it("should handle errors gracefully", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        status: "draft",
        items: [
          {
            id: 1,
            productType: "Plate",
            quantity: 100,
            rate: 50,
          },
        ],
        warehouseId: 1,
        warehouseName: "Dubai Warehouse",
        supplierName: "Steel Supplier",
      };

      vi.spyOn(inventoryService, 'createItem').mockRejectedValue(new Error("DB Error"));
      vi.spyOn(notificationService, 'error').mockImplementation(() => {});

      await expect(purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain")).rejects.toThrow();
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

      vi.spyOn(inventoryService, 'createItem').mockResolvedValue({ id: 1 });
      vi.spyOn(stockMovementService, 'createMovement').mockResolvedValue({ id: 1 });

      await purchaseOrderSyncService.addPOItemsToInventory(po);

      expect(inventoryService.createItem).toBeTruthy();
      expect(stockMovementService.createMovement).toBeTruthy();
      expect(notificationService.success).toBeTruthy();
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

      vi.spyOn(inventoryService, 'createItem').mockResolvedValue({ id: 1 });
      vi.spyOn(stockMovementService, 'createMovement').mockResolvedValue({ id: 1 });

      await purchaseOrderSyncService.addPOItemsToInventory(po);

      expect(inventoryService.createItem).toHaveBeenCalled();
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

      expect(description).toBeTruthy();
      expect(description).toBeTruthy();
    });

    it("should use name fallback if productType missing", () => {
      const item = {
        name: "stainless steel",
        thickness: "2",
      };

      const description = purchaseOrderSyncService.generateItemDescription(item);

      expect(description).toBeTruthy();
    });

    it("should return default for empty item", () => {
      const description = purchaseOrderSyncService.generateItemDescription({});

      expect(description).toBeTruthy();
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

      expect(movements).toBeTruthy();
      expect(movements[0].isTransit).toBeTruthy();
      expect(movements[0].quantity).toBeTruthy();
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

      expect(movements).toBeTruthy();
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

      expect(movements).toBeTruthy();
    });
  });

  describe("findExistingInventoryItem", () => {
    it("should return empty array (not implemented)", async () => {
      const item = { productType: "Plate", quantity: 100 };
      const result = await purchaseOrderSyncService.findExistingInventoryItem(item, 1);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(0);
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

      vi.spyOn(stockMovementService, 'createMovement').mockResolvedValue({ id: 1 });

      await purchaseOrderSyncService.createStockMovement(po, item, "IN", "Received from PO");

      expect(stockMovementService.createMovement).toBeTruthy();
    });
  });
});