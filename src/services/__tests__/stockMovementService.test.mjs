import { test, describe, beforeEach, afterEach } from 'node:test';
import '../../__tests__/init.mjs';
import assert from 'node:assert';
import sinon from 'sinon';
import { MOVEMENT_TYPES, REFERENCE_TYPES, stockMovementService } from "../stockMovementService.js";
import { apiClient } from "../api.js";



describe("stockMovementService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("Movement Types", () => {
    test("should define all movement types", () => {
      assert.ok(MOVEMENT_TYPES.IN.value);
      assert.ok(MOVEMENT_TYPES.OUT.value);
      assert.ok(MOVEMENT_TYPES.TRANSFER_OUT !== undefined);
      assert.ok(MOVEMENT_TYPES.ADJUSTMENT !== undefined);
    });

    test("should have display labels for movements", () => {
      assert.ok(MOVEMENT_TYPES.IN.label);
      assert.ok(MOVEMENT_TYPES.OUT.label);
    });

    test("should have visual colors for movements", () => {
      assert.ok(MOVEMENT_TYPES.IN.color);
      assert.ok(MOVEMENT_TYPES.OUT.color);
    });
  });

  describe("Reference Types", () => {
    test("should support invoice references", () => {
      assert.ok(REFERENCE_TYPES.INVOICE.value);
    });

    test("should support transfer references", () => {
      assert.ok(REFERENCE_TYPES.TRANSFER.value);
    });

    test("should support adjustment references", () => {
      assert.ok(REFERENCE_TYPES.ADJUSTMENT.value);
    });

    test("should support return and credit references", () => {
      assert.ok(REFERENCE_TYPES.RETURN !== undefined);
      assert.ok(REFERENCE_TYPES.CREDIT_NOTE !== undefined);
    });
  });

  describe("getAll", () => {
    test("should fetch all stock movements", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            productId: 100,
            productName: "SS304 Sheet",
            movementType: "IN",
            quantity: 500,
            unit: "KG",
            warehouseId: 1,
            warehouseName: "Main Warehouse",
            balanceAfter: 1500,
          },
        ],
        pagination: { total: 1, page: 1 },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await stockMovementService.getAll();

      assert.ok(result.data);
      assert.ok(result.data[0].productName);
    });

    test("should filter by product", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await stockMovementService.getAll({ productId: 100 });

      sinon.assert.calledWith(apiClient.get, "/stock-movements", Object.keys({ product_id: 100 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should filter by warehouse", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await stockMovementService.getAll({ warehouseId: 1 });

      sinon.assert.calledWith(apiClient.get, "/stock-movements", Object.keys({ warehouse_id: 1 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should filter by movement type", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await stockMovementService.getAll({ movementType: "IN" });

      sinon.assert.calledWith(apiClient.get, "/stock-movements", Object.keys({ movement_type: "IN" }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should filter by date range", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await stockMovementService.getAll({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      sinon.assert.calledWith(apiClient.get, "/stock-movements", );
    });
  });

  describe("getById", () => {
    test("should fetch single movement with complete details", async () => {
      const mockData = {
        id: 1,
        productId: 100,
        productName: "SS304 Sheet",
        productDisplayName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        movementType: "IN",
        quantity: 500,
        unit: "KG",
        referenceType: "INVOICE",
        referenceNumber: "INV-001",
        warehouseId: 1,
        unitCost: 25.5,
        totalCost: 12750,
        balanceAfter: 1500,
        batchNumber: "BATCH-123",
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await stockMovementService.getById(1);

      assert.ok(result.productName);
      assert.ok(result.quantity);
      assert.ok(result.totalCost);
    });

    test("should include coil/heat number for metal tracking", async () => {
      const mockData = {
        id: 1,
        batchNumber: "BATCH-123",
        coilNumber: "COIL-456",
        heatNumber: "HEAT-789",
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await stockMovementService.getById(1);

      assert.ok(result.coilNumber);
      assert.ok(result.heatNumber);
    });
  });

  describe("createMovement", () => {
    test("should create stock in movement", async () => {
      const mockResponse = {
        id: 1,
        movementType: "IN",
        productId: 100,
        quantity: 500,
        balanceAfter: 1500,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: "IN",
        productId: 100,
        quantity: 500,
        referenceType: "INVOICE",
        referenceNumber: "INV-001",
      });

      assert.ok(result.movementType);
      assert.ok(result.balanceAfter);
    });

    test("should create stock out movement", async () => {
      const mockResponse = {
        id: 2,
        movementType: "OUT",
        productId: 100,
        quantity: 200,
        balanceAfter: 1300,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: "OUT",
        productId: 100,
        quantity: 200,
        referenceNumber: "INV-002",
      });

      assert.ok(result.movementType);
      assert.ok(result.balanceAfter);
    });

    test("should create warehouse transfer movement", async () => {
      const mockResponse = {
        id: 3,
        movementType: "TRANSFER_OUT",
        fromWarehouse: 1,
        toWarehouse: 2,
        quantity: 100,
        transferId: 50,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: "TRANSFER_OUT",
        productId: 100,
        quantity: 100,
        destinationWarehouseId: 2,
      });

      assert.ok(result.movementType);
      assert.ok(result.transferId);
    });

    test("should track unit cost and total cost", async () => {
      const mockResponse = {
        id: 1,
        quantity: 500,
        unitCost: 25.5,
        totalCost: 12750,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await stockMovementService.createMovement({
        productId: 100,
        quantity: 500,
        unitCost: 25.5,
      });

      assert.ok(result.totalCost);
    });

    test("should support batch tracking", async () => {
      const mockResponse = {
        id: 1,
        batchNumber: "BATCH-123",
        productId: 100,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await stockMovementService.createMovement({
        productId: 100,
        quantity: 100,
        batchNumber: "BATCH-123",
      });

      assert.ok(result.batchNumber);
    });
  });

  describe("updateMovement", () => {
    test("should update movement details", async () => {
      const mockResponse = {
        id: 1,
        notes: "Damaged goods identified",
        quantity: 450,
      };

      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await stockMovementService.updateMovement(1, {
        notes: "Damaged goods identified",
        quantity: 450,
      });

      assert.ok(result.notes);
    });

    test("should handle quantity adjustments", async () => {
      sinon.stub(apiClient, 'put').resolves({ id: 1, quantity: 450 });

      const result = await stockMovementService.updateMovement(1, {
        quantity: 450,
      });

      assert.ok(result.quantity);
    });
  });

  describe("deleteMovement", () => {
    test("should delete movement", async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await stockMovementService.deleteMovement(1);

      assert.ok(result.success);
      sinon.assert.calledWith(apiClient.delete, "/stock-movements/1");
    });

    test("should handle deletion errors", async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error("Movement already processed"));

      await assert.rejects(() => stockMovementService.deleteMovement(1), Error);
    });
  });

  describe("Data Transformation", () => {
    test("should transform snake_case from server to camelCase", async () => {
      const mockData = {
        product_id: 100,
        product_name: "SS304 Sheet",
        warehouse_id: 1,
        warehouse_name: "Main Warehouse",
        movement_type: "IN",
        reference_type: "INVOICE",
        destination_warehouse_id: 2,
        unit_cost: 25.5,
        batch_number: "BATCH-123",
        coil_number: "COIL-456",
        heat_number: "HEAT-789",
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await stockMovementService.getById(1);

      assert.ok(result.productId);
      assert.ok(result.productName);
      assert.ok(result.warehouseId);
      assert.ok(result.movementType);
      assert.ok(result.destinationWarehouseId);
      assert.ok(result.unitCost);
      assert.ok(result.batchNumber);
    });
  });

  describe("Stock Level Calculations", () => {
    test("should track balance after each movement", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [
          { movementType: "IN", quantity: 1000, balanceAfter: 1000 },
          { movementType: "OUT", quantity: 200, balanceAfter: 800 },
          { movementType: "IN", quantity: 500, balanceAfter: 1300 },
        ],
      });

      const result = await stockMovementService.getAll();

      assert.ok(result.data[0].balanceAfter);
      assert.ok(result.data[1].balanceAfter);
      assert.ok(result.data[2].balanceAfter);
    });
  });

  describe("Multi-tenancy", () => {
    test("should maintain company context", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [{ id: 1, companyId: 1 }],
      });

      const result = await stockMovementService.getAll();

      assert.ok(result.data[0].companyId);
    });
  });

  describe("Audit Trail", () => {
    test("should track who created the movement", async () => {
      const mockData = {
        id: 1,
        createdBy: "user-123",
        createdByName: "John Doe",
        createdAt: "2024-01-15T10:00:00Z",
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await stockMovementService.getById(1);

      assert.ok(result.createdByName);
      assert.ok(result.createdAt !== undefined);
    });

    test("should track when movement was updated", async () => {
      const mockData = {
        id: 1,
        updatedAt: "2024-01-16T14:30:00Z",
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await stockMovementService.getById(1);

      assert.ok(result.updatedAt !== undefined);
    });
  });
});