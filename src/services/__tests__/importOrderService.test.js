/**
 * Import Order Service Unit Tests (Node Native Test Runner)
 * Tests import order CRUD, status management, container tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import importOrderService from '../importOrderService.js';

describe('importOrderService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getImportOrders', () => {
    it('should fetch import orders', async () => {
      const mockResponse = {
        data: [{ id: 1, orderNumber: 'IO-001', status: 'PENDING', supplierId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importOrderService.getImportOrders({ page: 1 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].orderNumber).toBe('IO-001');
    });

    it('should filter by status', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [], pagination: null });

      await importOrderService.getImportOrders({ status: 'IN_TRANSIT' });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getImportOrder', () => {
    it('should fetch single import order', async () => {
      const mockResponse = {
        id: 1,
        orderNumber: 'IO-001',
        supplierId: 1,
        supplierName: 'XYZ Trading',
        containers: [{ id: 1, containerNumber: 'CNT-001', status: 'ARRIVED' }],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      expect(result.id).toBe(1);
      expect(result.containers).toBeTruthy();
    });
  });

  describe('createImportOrder', () => {
    it('should create import order', async () => {
      const orderData = { supplierId: 1, supplierName: 'XYZ', items: [] };
      vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 1, orderNumber: 'IO-001' });

      const result = await importOrderService.createImportOrder(orderData);

      expect(result.id).toBe(1);
      expect(apiClient.post).toHaveBeenCalledWith('/import-orders', expect.anything());
    });
  });

  describe('updateImportOrder', () => {
    it('should update import order', async () => {
      const updateData = { status: 'IN_TRANSIT' };
      vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 1, ...updateData });

      const result = await importOrderService.updateImportOrder(1, updateData);

      expect(result.status).toBe('IN_TRANSIT');
    });
  });

  describe('Import Order Status', () => {
    it('should track order status transitions', async () => {
      const mockResponse = { id: 1, status: 'PENDING' };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      expect(
        ['PENDING', 'IN_TRANSIT', 'ARRIVED', 'CUSTOMS', 'RECEIVED'].includes(result.status)
      ).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await importOrderService.getImportOrders();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty order items', async () => {
      const mockResponse = { id: 1, items: [] };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      expect(result.items).toEqual([]);
    });
  });
});
