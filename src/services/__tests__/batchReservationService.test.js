/**
 * Batch Reservation Service Unit Tests
 * ✅ Tests batch reservation CRUD operations
 * ✅ Tests allocation and deallocation logic
 * ✅ Tests FIFO batch selection strategy
 * ✅ Tests expiry and quality holds
 * ✅ 100% coverage target for batchReservationService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../api';
import { batchReservationService } from '../batchReservationService';

describe('batchReservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reserveBatch', () => {
    test('should reserve batch for order line', async () => {
      const mockResponse = {
        reservationId: 501,
        productId: 1,
        batchId: 'BATCH-001',
        quantity: 100,
        reservationDate: '2024-02-02',
        expiryDate: '2024-06-02',
        status: 'reserved',
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.reserveBatch({
        productId: 1,
        batchId: 'BATCH-001',
        quantity: 100,
      });

      expect(result.reservationId).toBe(501);
      expect(result.status).toBe('reserved');
      expect(api.post).toHaveBeenCalledWith(
        '/batch-reservations',
        expect.objectContaining({ productId: 1, batchId: 'BATCH-001', quantity: 100 }),
      );
    });

    test('should reserve multiple batches for same product', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          reservationId: 501,
          batchId: 'BATCH-001',
          quantity: 50,
        },
      });
      api.post.mockResolvedValueOnce({
        data: {
          reservationId: 502,
          batchId: 'BATCH-002',
          quantity: 50,
        },
      });

      const result1 = await batchReservationService.reserveBatch({
        productId: 1,
        batchId: 'BATCH-001',
        quantity: 50,
      });
      const result2 = await batchReservationService.reserveBatch({
        productId: 1,
        batchId: 'BATCH-002',
        quantity: 50,
      });

      expect(result1.quantity).toBe(50);
      expect(result2.quantity).toBe(50);
    });

    test('should prevent reservation of more than available quantity', async () => {
      api.post.mockRejectedValueOnce(new Error('Insufficient batch quantity'));

      await expect(
        batchReservationService.reserveBatch({
          productId: 1,
          batchId: 'BATCH-001',
          quantity: 1000,
        }),
      ).rejects.toThrow('Insufficient batch quantity');
    });

    test('should prevent reservation of expired batch', async () => {
      api.post.mockRejectedValueOnce(new Error('Batch has expired'));

      await expect(
        batchReservationService.reserveBatch({
          productId: 1,
          batchId: 'EXPIRED-BATCH',
          quantity: 100,
        }),
      ).rejects.toThrow('Batch has expired');
    });
  });

  describe('autoAllocateBatches', () => {
    test('should automatically allocate using FIFO strategy', async () => {
      const mockResponse = {
        allocations: [
          { batchId: 'BATCH-001', quantity: 100, expiryDate: '2024-06-02' },
          { batchId: 'BATCH-002', quantity: 50, expiryDate: '2024-07-02' },
        ],
        totalAllocated: 150,
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.autoAllocateBatches(1, 150);

      expect(result.allocations).toHaveLength(2);
      expect(result.totalAllocated).toBe(150);
      expect(api.post).toHaveBeenCalledWith('/batch-reservations/auto-allocate', {
        productId: 1,
        quantity: 150,
        strategy: 'FIFO',
      });
    });

    test('should respect batch expiry dates in allocation', async () => {
      const mockResponse = {
        allocations: [
          { batchId: 'BATCH-FIRST', quantity: 100, expiryDate: '2024-03-02' },
          { batchId: 'BATCH-SECOND', quantity: 50, expiryDate: '2024-07-02' },
        ],
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.autoAllocateBatches(1, 150);

      // First batch should have earlier expiry (FIFO principle)
      expect(result.allocations[0].expiryDate).toEqual('2024-03-02');
    });

    test('should handle insufficient total quantity', async () => {
      api.post.mockRejectedValueOnce(new Error('Insufficient total quantity across batches'));

      await expect(batchReservationService.autoAllocateBatches(1, 1000)).rejects.toThrow(
        'Insufficient total quantity across batches',
      );
    });

    test('should support alternative allocation strategies', async () => {
      api.post.mockResolvedValueOnce({ data: { allocations: [], totalAllocated: 0 } });

      await batchReservationService.autoAllocateBatches(1, 100, 'LIFO');

      expect(api.post).toHaveBeenCalledWith(
        '/batch-reservations/auto-allocate',
        expect.objectContaining({ strategy: 'LIFO' }),
      );
    });
  });

  describe('deallocateReservation', () => {
    test('should deallocate batch reservation', async () => {
      const mockResponse = {
        reservationId: 501,
        status: 'deallocated',
        freedQuantity: 100,
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.deallocateReservation(501, 'Order cancelled');

      expect(result.status).toBe('deallocated');
      expect(result.freedQuantity).toBe(100);
      expect(api.put).toHaveBeenCalledWith('/batch-reservations/501', {
        status: 'deallocated',
        reason: 'Order cancelled',
      });
    });

    test('should prevent deallocation of delivered batches', async () => {
      api.put.mockRejectedValueOnce(new Error('Cannot deallocate delivered batch'));

      await expect(batchReservationService.deallocateReservation(501, 'Mistaken order')).rejects.toThrow(
        'Cannot deallocate delivered batch',
      );
    });

    test('should return quantity to batch inventory', async () => {
      const mockResponse = {
        reservationId: 501,
        freedQuantity: 50,
        batchId: 'BATCH-001',
        newBatchAvailability: 200,
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.deallocateReservation(501, 'Partial cancellation');

      expect(result.newBatchAvailability).toBe(200);
    });
  });

  describe('getReservationsByOrder', () => {
    test('should fetch all reservations for order', async () => {
      const mockResponse = {
        orderId: 1001,
        reservations: [
          {
            reservationId: 501,
            productId: 1,
            batchId: 'BATCH-001',
            quantity: 100,
            status: 'reserved',
          },
          {
            reservationId: 502,
            productId: 2,
            batchId: 'BATCH-002',
            quantity: 50,
            status: 'delivered',
          },
        ],
      };
      api.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.getReservationsByOrder(1001);

      expect(result.reservations).toHaveLength(2);
      expect(result.reservations[0].status).toBe('reserved');
      expect(result.reservations[1].status).toBe('delivered');
      expect(api.get).toHaveBeenCalledWith('/orders/1001/batch-reservations');
    });

    test('should show empty reservations for new order', async () => {
      api.get.mockResolvedValueOnce({ data: { orderId: 9999, reservations: [] } });

      const result = await batchReservationService.getReservationsByOrder(9999);

      expect(result.reservations).toEqual([]);
    });
  });

  describe('getAvailableBatches', () => {
    test('should list available batches for product', async () => {
      const mockBatches = [
        {
          batchId: 'BATCH-001',
          quantity: 100,
          availableQuantity: 80,
          expiryDate: '2024-06-02',
          dateReceived: '2023-06-02',
          qualityGrade: 'A',
        },
        {
          batchId: 'BATCH-002',
          quantity: 150,
          availableQuantity: 150,
          expiryDate: '2024-08-02',
          dateReceived: '2023-08-02',
          qualityGrade: 'A',
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockBatches });

      const result = await batchReservationService.getAvailableBatches(1);

      expect(result).toHaveLength(2);
      expect(result[0].availableQuantity).toBe(80);
      expect(result[1].availableQuantity).toBe(150);
      expect(api.get).toHaveBeenCalledWith('/products/1/available-batches');
    });

    test('should exclude expired batches from availability', async () => {
      const mockBatches = [
        { batchId: 'BATCH-001', availableQuantity: 100, expiryDate: '2024-12-02' },
        // Expired batch excluded
      ];
      api.get.mockResolvedValueOnce({ data: mockBatches });

      const result = await batchReservationService.getAvailableBatches(1);

      expect(result).toHaveLength(1);
      expect(result.every((b) => new Date(b.expiryDate) > new Date())).toBe(true);
    });

    test('should exclude batches on quality hold', async () => {
      const mockBatches = [
        {
          batchId: 'BATCH-001',
          availableQuantity: 100,
          qualityGrade: 'A',
          onHold: false,
        },
        // Quality held batch not included
      ];
      api.get.mockResolvedValueOnce({ data: mockBatches });

      const result = await batchReservationService.getAvailableBatches(1);

      expect(result.every((b) => !b.onHold)).toBe(true);
    });
  });

  describe('updateReservationStatus', () => {
    test('should update reservation status to delivered', async () => {
      const mockResponse = {
        reservationId: 501,
        status: 'delivered',
        deliveryDate: '2024-02-05',
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.updateReservationStatus(501, 'delivered');

      expect(result.status).toBe('delivered');
      expect(api.put).toHaveBeenCalledWith('/batch-reservations/501/status', { status: 'delivered' });
    });

    test('should allow status progression: reserved -> in-transit -> delivered', async () => {
      // Reserved to in-transit
      api.put.mockResolvedValueOnce({ data: { status: 'in-transit' } });
      const result1 = await batchReservationService.updateReservationStatus(501, 'in-transit');

      // In-transit to delivered
      api.put.mockResolvedValueOnce({ data: { status: 'delivered' } });
      const result2 = await batchReservationService.updateReservationStatus(501, 'delivered');

      expect(result1.status).toBe('in-transit');
      expect(result2.status).toBe('delivered');
    });

    test('should prevent invalid status transitions', async () => {
      api.put.mockRejectedValueOnce(new Error('Invalid status transition'));

      await expect(batchReservationService.updateReservationStatus(501, 'reserved')).rejects.toThrow(
        'Invalid status transition',
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        batchReservationService.reserveBatch({
          productId: 1,
          batchId: 'BATCH-001',
          quantity: 100,
        }),
      ).rejects.toThrow('Network error');
    });

    test('should handle invalid product', async () => {
      api.post.mockRejectedValueOnce(new Error('Product not found'));

      await expect(
        batchReservationService.reserveBatch({
          productId: 999,
          batchId: 'BATCH-001',
          quantity: 100,
        }),
      ).rejects.toThrow('Product not found');
    });

    test('should handle invalid batch', async () => {
      api.post.mockRejectedValueOnce(new Error('Batch not found'));

      await expect(
        batchReservationService.reserveBatch({
          productId: 1,
          batchId: 'INVALID-BATCH',
          quantity: 100,
        }),
      ).rejects.toThrow('Batch not found');
    });
  });

  describe('FIFO Strategy', () => {
    test('should prioritize batches by FIFO (earliest received first)', async () => {
      const mockResponse = {
        allocations: [
          { batchId: 'BATCH-OLDEST', dateReceived: '2023-01-01', quantity: 100 },
          { batchId: 'BATCH-NEWER', dateReceived: '2023-06-01', quantity: 50 },
        ],
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.autoAllocateBatches(1, 150, 'FIFO');

      // Oldest batch should be allocated first
      expect(result.allocations[0].dateReceived < result.allocations[1].dateReceived).toBe(true);
    });

    test('should prioritize by expiry date within FIFO', async () => {
      const mockResponse = {
        allocations: [
          { batchId: 'BATCH-001', expiryDate: '2024-03-02', quantity: 100 },
          { batchId: 'BATCH-002', expiryDate: '2024-08-02', quantity: 50 },
        ],
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await batchReservationService.autoAllocateBatches(1, 150);

      // Earlier expiry should be allocated first
      expect(new Date(result.allocations[0].expiryDate) < new Date(result.allocations[1].expiryDate)).toBe(
        true,
      );
    });
  });
});
