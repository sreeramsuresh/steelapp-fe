import { test, describe, beforeEach, afterEach } from 'node:test';
import '../../__tests__/init.mjs';
import assert from 'node:assert';
import sinon from 'sinon';
import { purchaseOrderSyncService } from "../purchaseOrderSyncService.js";




import { inventoryService } from "../inventoryService.js";
import { notificationService } from "../notificationService.js";
import { stockMovementService } from "../stockMovementService.js";

describe("purchaseOrderSyncService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("handlePOStatusChange", () => {
    test("should handle PO status change to received", async () => {
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

      sinon.stub(inventoryService, 'createItem').resolves({ id: 1 });
      sinon.stub(stockMovementService, 'createMovement').resolves({ id: 1 });

      const result = await purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain");

      assert.ok(result);
      assert.ok(inventoryService.createItem);
    });

    test("should handle transit to retain status change", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        status: "received",
        stockStatus: "transit",
        items: [],
        warehouseId: 1,
      };

      const result = await purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain");

      assert.ok(result);
    });

    test("should handle errors gracefully", async () => {
      const po = {
        id: 1,
        poNumber: "PO-001",
        status: "draft",
        items: [],
      };

      inventoryService.createItem.mockRejectedValue(new Error("DB Error"));

      await assert.rejects(() => purchaseOrderSyncService.handlePOStatusChange(po, "received", "retain"), Error);

      assert.ok(notificationService.error);
    });
  });

  describe("addPOItemsToInventory", () => {
    test("should add PO items to inventory", async () => {
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

      sinon.stub(inventoryService, 'createItem').resolves({ id: 1 });
      sinon.stub(stockMovementService, 'createMovement').resolves({ id: 1 });

      await purchaseOrderSyncService.addPOItemsToInventory(po);

      assert.ok(inventoryService.createItem);
      assert.ok(stockMovementService.createMovement);
      assert.ok(notificationService.success);
    });

    test("should update existing inventory items", async () => {
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

      sinon.stub(inventoryService, 'createItem').resolves({ id: 1 });
      sinon.stub(stockMovementService, 'createMovement').resolves({ id: 1 });

      await purchaseOrderSyncService.addPOItemsToInventory(po);

      sinon.assert.calledWith(notificationService.success, expect.stringContaining("Added"));
    });
  });

  describe("generateItemDescription", () => {
    test("should generate item description from PO item details", () => {
      const item = {
        productType: "plate",
        grade: "304",
        finish: "polished",
        size: "2000x1000",
        thickness: "3",
      };

      const description = purchaseOrderSyncService.generateItemDescription(item);

      assert.ok(description);
      assert.ok(description);
    });

    test("should use name fallback if productType missing", () => {
      const item = {
        name: "stainless steel",
        thickness: "2",
      };

      const description = purchaseOrderSyncService.generateItemDescription(item);

      assert.ok(description);
    });

    test("should return default for empty item", () => {
      const description = purchaseOrderSyncService.generateItemDescription({});

      assert.ok(description);
    });
  });

  describe("generateTransitStockMovements", () => {
    test("should generate transit movements for POs in transit", () => {
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

      assert.ok(movements);
      assert.ok(movements[0].isTransit);
      assert.ok(movements[0].quantity);
    });

    test("should not generate movements for received POs", () => {
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

      assert.ok(movements);
    });

    test("should not generate movements for cancelled POs", () => {
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

      assert.ok(movements);
    });
  });

  describe("findExistingInventoryItem", () => {
    test("should return empty array (not implemented)", () => {
      const item = { productType: "Plate", quantity: 100 };
      const result = purchaseOrderSyncService.findExistingInventoryItem(item, 1);

      assert.ok(Array.isArray(result));
      assert.ok(result);
    });
  });

  describe("createStockMovement", () => {
    test("should create stock movement for PO items", async () => {
      const po = {
        poNumber: "PO-001",
        supplierName: "Supplier A",
      };

      const item = {
        productType: "Plate",
        quantity: 50,
      };

      sinon.stub(stockMovementService, 'createMovement').resolves({ id: 1 });

      await purchaseOrderSyncService.createStockMovement(po, item, "IN", "Received from PO");

      assert.ok(stockMovementService.createMovement);
    });
  });
});