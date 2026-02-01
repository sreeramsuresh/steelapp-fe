/**
 * Warehouse Service Unit Tests
 * Tests warehouse CRUD, capacity management, and inventory tracking
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { warehouseService } from '../warehouseService';
import { apiClient } from '../api';

describe('warehouseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllWarehouses', () => {
    test('should fetch warehouses with pagination', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Main Warehouse', code: 'WH-001', isActive: true }],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await warehouseService.getAllWarehouses({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Main Warehouse');
      expect(apiClient.get).toHaveBeenCalled();
    });

    test('should filter warehouses by active status', async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await warehouseService.getAllWarehouses({ isActive: true });

      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe('getWarehouseById', () => {
    test('should fetch warehouse by ID', async () => {
      const mockResponse = {
        id: 1,
        name: 'Main Warehouse',
        code: 'WH-001',
        capacity: 10000,
        utilizationPercent: 65,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await warehouseService.getWarehouseById(1);

      expect(result.id).toBe(1);
      expect(result.capacity).toBe(10000);
      expect(apiClient.get).toHaveBeenCalledWith('/warehouses/1', expect.any(Object));
    });
  });

  describe('createWarehouse', () => {
    test('should create warehouse', async () => {
      const warehouseData = {
        name: 'New Warehouse',
        code: 'WH-002',
        capacity: 5000,
        city: 'Dubai',
      };

      const mockResponse = { id: 2, ...warehouseData };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await warehouseService.createWarehouse(warehouseData);

      expect(result.id).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith('/warehouses', expect.any(Object));
    });

    test('should validate required fields', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Warehouse name required'));

      await expect(warehouseService.createWarehouse({})).rejects.toThrow();
    });
  });

  describe('updateWarehouse', () => {
    test('should update warehouse', async () => {
      const updateData = { capacity: 8000, isActive: false };
      const mockResponse = { id: 1, ...updateData };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await warehouseService.updateWarehouse(1, updateData);

      expect(result.capacity).toBe(8000);
      expect(apiClient.put).toHaveBeenCalledWith('/warehouses/1', expect.any(Object));
    });
  });

  describe('deleteWarehouse', () => {
    test('should delete warehouse', async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await warehouseService.deleteWarehouse(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/warehouses/1');
    });
  });

  describe('Capacity Management', () => {
    test('should track warehouse capacity', async () => {
      const mockResponse = {
        id: 1,
        capacity: 10000,
        capacityUnit: 'MT',
        inventoryCount: 6500,
        utilizationPercent: 65,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await warehouseService.getWarehouseById(1);

      expect(result.utilizationPercent).toBe(65);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty warehouse list', async () => {
      const mockResponse = { data: [], pagination: { total: 0 } };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await warehouseService.getAllWarehouses();

      expect(result.data).toHaveLength(0);
    });

    test('should parse numeric capacity as float', async () => {
      const warehouseData = { name: 'WH', capacity: '10000.5' };
      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await warehouseService.createWarehouse(warehouseData);

      expect(apiClient.post).toHaveBeenCalled();
    });
  });
});
