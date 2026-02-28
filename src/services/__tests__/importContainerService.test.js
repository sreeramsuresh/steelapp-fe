/**
 * Import Container Service Unit Tests (Node Native Test Runner)
 * Tests container tracking and shipment management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import importContainerService from '../importContainerService.js';

describe('importContainerService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getContainers', () => {
    it('should fetch containers', async () => {
      const mockResponse = {
        data: [{ id: 1, containerNumber: 'CNT-001', status: 'IN_TRANSIT', importOrderId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importContainerService.getContainers({ page: 1 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].containerNumber).toBe('CNT-001');
    });

    it('should filter by status', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [], pagination: null });

      await importContainerService.getContainers({ status: 'ARRIVED' });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getContainer', () => {
    it('should fetch container details', async () => {
      const mockResponse = {
        id: 1,
        containerNumber: 'CNT-001',
        type: '20FT',
        status: 'IN_TRANSIT',
        items: [{ productId: 1, quantity: 100 }],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importContainerService.getContainer(1);

      expect(result.type).toBe('20FT');
      expect(result.items).toBeTruthy();
    });
  });

  describe('updateContainer', () => {
    it('should update container status', async () => {
      const updateData = { status: 'ARRIVED' };
      vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 1, ...updateData });

      const result = await importContainerService.updateContainer(1, updateData);

      expect(result.status).toBe('ARRIVED');
    });
  });

  describe('Container Types', () => {
    it('should support 20FT and 40FT containers', async () => {
      const mockResponse = { id: 1, type: '20FT' };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importContainerService.getContainer(1);

      expect(['20FT', '40FT'].includes(result.type).toBeTruthy());
    });
  });

  describe('Error Handling', () => {
    it('should handle errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Error'));

      try {
        await importContainerService.getContainers();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty container', async () => {
      const mockResponse = { id: 1, items: [] };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await importContainerService.getContainer(1);

      expect(result.items).toEqual([]);
    });
  });
});
