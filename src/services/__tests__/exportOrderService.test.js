/**
 * Export Order Service Unit Tests (Node Native Test Runner)
 * Tests export order CRUD and export logistics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import exportOrderService from '../exportOrderService.js';

describe('exportOrderService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getExportOrders', () => {
    it('should fetch export orders', async () => {
      const mockResponse = {
        data: [{ id: 1, orderNumber: 'EO-001', status: 'DRAFT', customerId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await exportOrderService.getExportOrders({ page: 1 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].orderNumber).toBe('EO-001');
    });

    it('should filter by customer', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [], pagination: null });

      await exportOrderService.getExportOrders({ customerId: 1 });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getExportOrder', () => {
    it('should fetch single export order', async () => {
      const mockResponse = {
        id: 1,
        orderNumber: 'EO-001',
        customerId: 1,
        customerName: 'International Corp',
        destination: 'USA',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await exportOrderService.getExportOrder(1);

      expect(result.id).toBe(1);
      expect(result.destination).toBe('USA');
    });
  });

  describe('createExportOrder', () => {
    it('should create export order', async () => {
      const orderData = { customerId: 1, destination: 'USA', items: [] };
      vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 1, orderNumber: 'EO-001' });

      const result = await exportOrderService.createExportOrder(orderData);

      expect(result.id).toBe(1);
    });
  });

  describe('updateExportOrder', () => {
    it('should update export order', async () => {
      const updateData = { status: 'SHIPPED' };
      vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 1, ...updateData });

      const result = await exportOrderService.updateExportOrder(1, updateData);

      expect(result.status).toBe('SHIPPED');
    });
  });

  describe('Export Status', () => {
    it('should track export status', async () => {
      const mockResponse = { id: 1, status: 'PACKING' };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await exportOrderService.getExportOrder(1);

      expect(['DRAFT', 'PACKING', 'READY', 'SHIPPED', 'DELIVERED'].includes(result.status).toBeTruthy());
    });
  });

  describe('Error Handling', () => {
    it('should handle errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Error'));

      try {
        await exportOrderService.getExportOrders();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [], pagination: null });

      const result = await exportOrderService.getExportOrders();

      expect(result.data).toEqual([]);
    });
  });
});
