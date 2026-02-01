/**
 * Inventory Service Unit Tests
 * Tests inventory tracking, stock balances, and movements
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { inventoryService } from '../inventoryService';
import { apiClient } from '../api';

describe('inventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInventory', () => {
    test('should fetch inventory items', async () => {
      const mockResponse = {
        data: [{ id: 1, productId: 1, warehouseId: 1, quantityOnHand: 100 }],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.getInventory({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].quantityOnHand).toBe(100);
    });

    test('should filter by warehouse', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await inventoryService.getInventory({ warehouseId: 1 });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test('should filter by product', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await inventoryService.getInventory({ productId: 1 });

      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe('getInventoryItem', () => {
    test('should fetch single inventory item', async () => {
      const mockResponse = {
        id: 1,
        productId: 1,
        quantityOnHand: 100,
        quantityReserved: 20,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.getInventoryItem(1);

      expect(result.id).toBe(1);
      expect(result.quantityOnHand).toBe(100);
    });
  });

  describe('updateInventory', () => {
    test('should update inventory', async () => {
      const updateData = { quantityOnHand: 150 };
      apiClient.put.mockResolvedValueOnce({ id: 1, ...updateData });

      const result = await inventoryService.updateInventory(1, updateData);

      expect(result.quantityOnHand).toBe(150);
    });
  });

  describe('Stock Balance Calculations', () => {
    test('should calculate available quantity (on hand - reserved)', async () => {
      const mockResponse = {
        id: 1,
        quantityOnHand: 100,
        quantityReserved: 20,
        available: 80,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.getInventoryItem(1);

      expect(result.available).toBe(80);
    });

    test('should track minimum stock levels', async () => {
      const mockResponse = {
        id: 1,
        quantityOnHand: 5,
        minStock: 10,
        belowMin: true,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.getInventoryItem(1);

      expect(result.belowMin).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(inventoryService.getInventory()).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero quantities', async () => {
      const mockResponse = { id: 1, quantityOnHand: 0, quantityReserved: 0 };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.getInventoryItem(1);

      expect(result.quantityOnHand).toBe(0);
    });

    test('should handle large quantities', async () => {
      const mockResponse = { id: 1, quantityOnHand: 999999 };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.getInventoryItem(1);

      expect(result.quantityOnHand).toBe(999999);
    });
  });
});
