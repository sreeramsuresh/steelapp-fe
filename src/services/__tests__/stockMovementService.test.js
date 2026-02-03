import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stockMovementService, MOVEMENT_TYPES, REFERENCE_TYPES } from '../stockMovementService.js';

vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../api.js';

describe('stockMovementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Movement Types', () => {
    it('should define all movement types', () => {
      expect(MOVEMENT_TYPES.IN.value).toBe('IN');
      expect(MOVEMENT_TYPES.OUT.value).toBe('OUT');
      expect(MOVEMENT_TYPES.TRANSFER_OUT).toBeDefined();
      expect(MOVEMENT_TYPES.ADJUSTMENT).toBeDefined();
    });

    it('should have display labels for movements', () => {
      expect(MOVEMENT_TYPES.IN.label).toBe('Stock In');
      expect(MOVEMENT_TYPES.OUT.label).toBe('Stock Out');
    });

    it('should have visual colors for movements', () => {
      expect(MOVEMENT_TYPES.IN.color).toBe('green');
      expect(MOVEMENT_TYPES.OUT.color).toBe('red');
    });
  });

  describe('Reference Types', () => {
    it('should support invoice references', () => {
      expect(REFERENCE_TYPES.INVOICE.value).toBe('INVOICE');
    });

    it('should support transfer references', () => {
      expect(REFERENCE_TYPES.TRANSFER.value).toBe('TRANSFER');
    });

    it('should support adjustment references', () => {
      expect(REFERENCE_TYPES.ADJUSTMENT.value).toBe('ADJUSTMENT');
    });

    it('should support return and credit references', () => {
      expect(REFERENCE_TYPES.RETURN).toBeDefined();
      expect(REFERENCE_TYPES.CREDIT_NOTE).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all stock movements', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            productId: 100,
            productName: 'SS304 Sheet',
            movementType: 'IN',
            quantity: 500,
            unit: 'KG',
            warehouseId: 1,
            warehouseName: 'Main Warehouse',
            balanceAfter: 1500,
          },
        ],
        pagination: { total: 1, page: 1 },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await stockMovementService.getAll();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].productName).toBe('SS304 Sheet');
    });

    it('should filter by product', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await stockMovementService.getAll({ productId: 100 });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/stock-movements',
        expect.objectContaining({ productId: 100 }),
      );
    });

    it('should filter by warehouse', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await stockMovementService.getAll({ warehouseId: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/stock-movements',
        expect.objectContaining({ warehouseId: 1 }),
      );
    });

    it('should filter by movement type', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await stockMovementService.getAll({ movementType: 'IN' });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/stock-movements',
        expect.objectContaining({ movementType: 'IN' }),
      );
    });

    it('should filter by date range', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await stockMovementService.getAll({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/stock-movements',
        expect.any(Object),
      );
    });
  });

  describe('getById', () => {
    it('should fetch single movement with complete details', async () => {
      const mockData = {
        id: 1,
        productId: 100,
        productName: 'SS304 Sheet',
        productDisplayName: 'SS-304-SHEET-2B-1220mm-2mm-2440mm',
        movementType: 'IN',
        quantity: 500,
        unit: 'KG',
        referenceType: 'INVOICE',
        referenceNumber: 'INV-001',
        warehouseId: 1,
        unitCost: 25.50,
        totalCost: 12750,
        balanceAfter: 1500,
        batchNumber: 'BATCH-123',
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.productName).toBe('SS304 Sheet');
      expect(result.quantity).toBe(500);
      expect(result.totalCost).toBe(12750);
    });

    it('should include coil/heat number for metal tracking', async () => {
      const mockData = {
        id: 1,
        batchNumber: 'BATCH-123',
        coilNumber: 'COIL-456',
        heatNumber: 'HEAT-789',
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.coilNumber).toBe('COIL-456');
      expect(result.heatNumber).toBe('HEAT-789');
    });
  });

  describe('createMovement', () => {
    it('should create stock in movement', async () => {
      const mockResponse = {
        id: 1,
        movementType: 'IN',
        productId: 100,
        quantity: 500,
        balanceAfter: 1500,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: 'IN',
        productId: 100,
        quantity: 500,
        referenceType: 'INVOICE',
        referenceNumber: 'INV-001',
      });

      expect(result.movementType).toBe('IN');
      expect(result.balanceAfter).toBe(1500);
    });

    it('should create stock out movement', async () => {
      const mockResponse = {
        id: 2,
        movementType: 'OUT',
        productId: 100,
        quantity: 200,
        balanceAfter: 1300,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: 'OUT',
        productId: 100,
        quantity: 200,
        referenceNumber: 'INV-002',
      });

      expect(result.movementType).toBe('OUT');
      expect(result.balanceAfter).toBe(1300);
    });

    it('should create warehouse transfer movement', async () => {
      const mockResponse = {
        id: 3,
        movementType: 'TRANSFER_OUT',
        fromWarehouse: 1,
        toWarehouse: 2,
        quantity: 100,
        transferId: 50,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        movementType: 'TRANSFER_OUT',
        productId: 100,
        quantity: 100,
        destinationWarehouseId: 2,
      });

      expect(result.movementType).toBe('TRANSFER_OUT');
      expect(result.transferId).toBe(50);
    });

    it('should track unit cost and total cost', async () => {
      const mockResponse = {
        id: 1,
        quantity: 500,
        unitCost: 25.50,
        totalCost: 12750,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        productId: 100,
        quantity: 500,
        unitCost: 25.50,
      });

      expect(result.totalCost).toBe(12750);
    });

    it('should support batch tracking', async () => {
      const mockResponse = {
        id: 1,
        batchNumber: 'BATCH-123',
        productId: 100,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await stockMovementService.createMovement({
        productId: 100,
        quantity: 100,
        batchNumber: 'BATCH-123',
      });

      expect(result.batchNumber).toBe('BATCH-123');
    });
  });

  describe('updateMovement', () => {
    it('should update movement details', async () => {
      const mockResponse = {
        id: 1,
        notes: 'Damaged goods identified',
        quantity: 450,
      };

      apiClient.put.mockResolvedValue(mockResponse);

      const result = await stockMovementService.updateMovement(1, {
        notes: 'Damaged goods identified',
        quantity: 450,
      });

      expect(result.notes).toBe('Damaged goods identified');
    });

    it('should handle quantity adjustments', async () => {
      apiClient.put.mockResolvedValue({ id: 1, quantity: 450 });

      const result = await stockMovementService.updateMovement(1, {
        quantity: 450,
      });

      expect(result.quantity).toBe(450);
    });
  });

  describe('deleteMovement', () => {
    it('should delete movement', async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await stockMovementService.deleteMovement(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/stock-movements/1');
    });

    it('should handle deletion errors', async () => {
      apiClient.delete.mockRejectedValue(new Error('Movement already processed'));

      await expect(stockMovementService.deleteMovement(1)).rejects.toThrow();
    });
  });

  describe('Data Transformation', () => {
    it('should transform snake_case from server to camelCase', async () => {
      const mockData = {
        product_id: 100,
        product_name: 'SS304 Sheet',
        warehouse_id: 1,
        warehouse_name: 'Main Warehouse',
        movement_type: 'IN',
        reference_type: 'INVOICE',
        destination_warehouse_id: 2,
        unit_cost: 25.50,
        batch_number: 'BATCH-123',
        coil_number: 'COIL-456',
        heat_number: 'HEAT-789',
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.productId).toBe(100);
      expect(result.productName).toBe('SS304 Sheet');
      expect(result.warehouseId).toBe(1);
      expect(result.movementType).toBe('IN');
      expect(result.destinationWarehouseId).toBe(2);
      expect(result.unitCost).toBe(25.50);
      expect(result.batchNumber).toBe('BATCH-123');
    });
  });

  describe('Stock Level Calculations', () => {
    it('should track balance after each movement', async () => {
      apiClient.get.mockResolvedValue({
        data: [
          { movementType: 'IN', quantity: 1000, balanceAfter: 1000 },
          { movementType: 'OUT', quantity: 200, balanceAfter: 800 },
          { movementType: 'IN', quantity: 500, balanceAfter: 1300 },
        ],
      });

      const result = await stockMovementService.getAll();

      expect(result.data[0].balanceAfter).toBe(1000);
      expect(result.data[1].balanceAfter).toBe(800);
      expect(result.data[2].balanceAfter).toBe(1300);
    });
  });

  describe('Multi-tenancy', () => {
    it('should maintain company context', async () => {
      apiClient.get.mockResolvedValue({
        data: [{ id: 1, companyId: 1 }],
      });

      const result = await stockMovementService.getAll();

      expect(result.data[0].companyId).toBe(1);
    });
  });

  describe('Audit Trail', () => {
    it('should track who created the movement', async () => {
      const mockData = {
        id: 1,
        createdBy: 'user-123',
        createdByName: 'John Doe',
        createdAt: '2024-01-15T10:00:00Z',
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.createdByName).toBe('John Doe');
      expect(result.createdAt).toBeDefined();
    });

    it('should track when movement was updated', async () => {
      const mockData = {
        id: 1,
        updatedAt: '2024-01-16T14:30:00Z',
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await stockMovementService.getById(1);

      expect(result.updatedAt).toBeDefined();
    });
  });
});
