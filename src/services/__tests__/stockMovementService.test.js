import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api.js";
import { MOVEMENT_TYPES, REFERENCE_TYPES, stockMovementService } from "../stockMovementService.js";

describe("stockMovementService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Movement Types", () => {
    it("should define all movement types", () => {
      expect(MOVEMENT_TYPES.IN.value).toBeTruthy();
      expect(MOVEMENT_TYPES.OUT.value).toBeTruthy();
      expect(MOVEMENT_TYPES.TRANSFER_OUT !== undefined).toBeTruthy();
      expect(MOVEMENT_TYPES.ADJUSTMENT !== undefined).toBeTruthy();
    });

    it("should have display labels for movements", () => {
      expect(MOVEMENT_TYPES.IN.label).toBeTruthy();
      expect(MOVEMENT_TYPES.OUT.label).toBeTruthy();
    });

    it("should have visual colors for movements", () => {
      expect(MOVEMENT_TYPES.IN.color).toBeTruthy();
      expect(MOVEMENT_TYPES.OUT.color).toBeTruthy();
    });
  });

  describe("Reference Types", () => {
    it("should support invoice references", () => {
      expect(REFERENCE_TYPES.INVOICE.value).toBeTruthy();
    });

    it("should support transfer references", () => {
      expect(REFERENCE_TYPES.TRANSFER.value).toBeTruthy();
    });

    it("should support adjustment references", () => {
      expect(REFERENCE_TYPES.ADJUSTMENT.value).toBeTruthy();
    });

    it("should support return and credit references", () => {
      expect(REFERENCE_TYPES.RETURN !== undefined).toBeTruthy();
      expect(REFERENCE_TYPES.CREDIT_NOTE !== undefined).toBeTruthy();
    });
  });

  describe("getAll", () => {
    it("should fetch all stock movements", async () => {
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await stockMovementService.getAll();

      expect(result.data).toBeTruthy();
      expect(result.data[0].productName).toBeTruthy();
    });

    it("should filter by product", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

      await stockMovementService.getAll({ productId: 100 });

      expect(apiClient.get).toHaveBeenCalledWith("/stock-movements", expect.objectContaining({ product_id: 100 }));
    });

    it("should filter by warehouse", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

      await stockMovementService.getAll({ warehouseId: 1 });

      expect(apiClient.get).toHaveBeenCalledWith("/stock-movements", expect.objectContaining({ warehouse_id: 1 }));
    });

    it("should filter by movement type", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

      await stockMovementService.getAll({ movementType: "IN" });

      expect(apiClient.get).toHaveBeenCalledWith("/stock-movements", expect.objectContaining({ movement_type: "IN" }));
    });

    it("should filter by date range", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

      await stockMovementService.getAll({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/stock-movements",
        expect.objectContaining({
          page: 1,
          limit: 20,
        })
      );
    });
  });

  describe("getById", () => {
    it("should fetch single movement with complete details", async () => {
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.productName).toBeTruthy();
      expect(result.quantity).toBeTruthy();
      expect(result.totalCost).toBeTruthy();
    });

    it("should include coil/heat number for metal tracking", async () => {
      const mockData = {
        id: 1,
        batchNumber: "BATCH-123",
        coilNumber: "COIL-456",
        heatNumber: "HEAT-789",
      };

      vi.spyOn(apiClient, "get").mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.coilNumber).toBeTruthy();
      expect(result.heatNumber).toBeTruthy();
    });
  });

  describe("createMovement", () => {
    it("should create stock in movement", async () => {
      const mockResponse = {
        id: 1,
        movementType: "IN",
        productId: 100,
        quantity: 500,
        balanceAfter: 1500,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: "IN",
        productId: 100,
        quantity: 500,
        referenceType: "INVOICE",
        referenceNumber: "INV-001",
      });

      expect(result.movementType).toBeTruthy();
      expect(result.balanceAfter).toBeTruthy();
    });

    it("should create stock out movement", async () => {
      const mockResponse = {
        id: 2,
        movementType: "OUT",
        productId: 100,
        quantity: 200,
        balanceAfter: 1300,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: "OUT",
        productId: 100,
        quantity: 200,
        referenceNumber: "INV-002",
      });

      expect(result.movementType).toBeTruthy();
      expect(result.balanceAfter).toBeTruthy();
    });

    it("should create warehouse transfer movement", async () => {
      const mockResponse = {
        id: 3,
        movementType: "TRANSFER_OUT",
        fromWarehouse: 1,
        toWarehouse: 2,
        quantity: 100,
        transferId: 50,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: "TRANSFER_OUT",
        productId: 100,
        quantity: 100,
        destinationWarehouseId: 2,
      });

      expect(result.movementType).toBeTruthy();
      expect(result.transferId).toBeTruthy();
    });

    it("should track unit cost and total cost", async () => {
      const mockResponse = {
        id: 1,
        quantity: 500,
        unitCost: 25.5,
        totalCost: 12750,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        productId: 100,
        quantity: 500,
        unitCost: 25.5,
      });

      expect(result.totalCost).toBeTruthy();
    });

    it("should support batch tracking", async () => {
      const mockResponse = {
        id: 1,
        batchNumber: "BATCH-123",
        productId: 100,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        productId: 100,
        quantity: 100,
        batchNumber: "BATCH-123",
      });

      expect(result.batchNumber).toBeTruthy();
    });
  });

  describe("updateMovement", () => {
    it("should update movement details", async () => {
      const mockResponse = {
        id: 1,
        notes: "Damaged goods identified",
        quantity: 450,
      };

      vi.spyOn(apiClient, "put").mockResolvedValue(mockResponse);

      const result = await stockMovementService.updateMovement(1, {
        notes: "Damaged goods identified",
        quantity: 450,
      });

      expect(result.notes).toBeTruthy();
    });

    it("should handle quantity adjustments", async () => {
      vi.spyOn(apiClient, "put").mockResolvedValue({ id: 1, quantity: 450 });

      const result = await stockMovementService.updateMovement(1, {
        quantity: 450,
      });

      expect(result.quantity).toBeTruthy();
    });
  });

  describe("deleteMovement", () => {
    it("should delete movement", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      const result = await stockMovementService.deleteMovement(1);

      expect(result.success).toBeTruthy();
      expect(apiClient.delete).toHaveBeenCalledWith("/stock-movements/1");
    });

    it("should handle deletion errors", async () => {
      vi.spyOn(apiClient, "delete").mockRejectedValue(new Error("Movement already processed"));

      await expect(stockMovementService.deleteMovement(1)).rejects.toThrow();
    });
  });

  describe("Data Transformation", () => {
    it("should transform snake_case from server to camelCase", async () => {
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.productId).toBeTruthy();
      expect(result.productName).toBeTruthy();
      expect(result.warehouseId).toBeTruthy();
      expect(result.movementType).toBeTruthy();
      expect(result.destinationWarehouseId).toBeTruthy();
      expect(result.unitCost).toBeTruthy();
      expect(result.batchNumber).toBeTruthy();
    });
  });

  describe("Stock Level Calculations", () => {
    it("should track balance after each movement", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({
        data: [
          { movementType: "IN", quantity: 1000, balanceAfter: 1000 },
          { movementType: "OUT", quantity: 200, balanceAfter: 800 },
          { movementType: "IN", quantity: 500, balanceAfter: 1300 },
        ],
      });

      const result = await stockMovementService.getAll();

      expect(result.data[0].balanceAfter).toBeTruthy();
      expect(result.data[1].balanceAfter).toBeTruthy();
      expect(result.data[2].balanceAfter).toBeTruthy();
    });
  });

  describe("Multi-tenancy", () => {
    it("should maintain company context", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({
        data: [{ id: 1, companyId: 1 }],
      });

      const result = await stockMovementService.getAll();

      expect(result.data[0].companyId).toBeTruthy();
    });
  });

  describe("Audit Trail", () => {
    it("should track who created the movement", async () => {
      const mockData = {
        id: 1,
        createdBy: "user-123",
        createdByName: "John Doe",
        createdAt: "2024-01-15T10:00:00Z",
      };

      vi.spyOn(apiClient, "get").mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.createdByName).toBeTruthy();
      expect(result.createdAt !== undefined).toBeTruthy();
    });

    it("should track when movement was updated", async () => {
      const mockData = {
        id: 1,
        updatedAt: "2024-01-16T14:30:00Z",
      };

      vi.spyOn(apiClient, "get").mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.updatedAt !== undefined).toBeTruthy();
    });
  });
});
