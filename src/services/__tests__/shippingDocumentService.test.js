import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { shippingDocumentService } from '../shippingDocumentService';

vi.mock("../api);

describe('shippingDocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getShippingDocuments', () => {
    it('should fetch shipping documents with pagination', async () => {
      const mockData = [
        { id: 1, documentNumber: 'SD001', status: 'draft' },
        { id: 2, documentNumber: 'SD002', status: 'confirmed' },
      ];

      api.get.mockResolvedValue(mockData);

      const result = await shippingDocumentService.getShippingDocuments({ page: 1, limit: 50 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(api.get).toHaveBeenCalledWith('/shipping-documents', {
        params: { page: 1, limit: 50 },
      });
    });

    it('should handle error', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      await expect(shippingDocumentService.getShippingDocuments()).rejects.toThrow('API Error');
    });

    it('should handle empty params', async () => {
      api.get.mockResolvedValue([]);

      await shippingDocumentService.getShippingDocuments();

      expect(api.get).toHaveBeenCalledWith('/shipping-documents', { params: {} });
    });
  });

  describe('getShippingDocument', () => {
    it('should fetch single shipping document', async () => {
      const mockData = { id: 1, documentNumber: 'SD001', status: 'confirmed' };

      api.get.mockResolvedValue(mockData);

      const result = await shippingDocumentService.getShippingDocument(1);

      expect(result).toEqual(mockData);
      expect(api.get).toHaveBeenCalledWith('/shipping-documents/1');
    });

    it('should handle error', async () => {
      api.get.mockRejectedValue(new Error('Not found'));

      await expect(shippingDocumentService.getShippingDocument(999)).rejects.toThrow('Not found');
    });
  });

  describe('createShippingDocument', () => {
    it('should create new shipping document', async () => {
      const data = { documentNumber: 'SD003', status: 'draft' };
      const mockResponse = { id: 3, ...data };

      api.post.mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.createShippingDocument(data);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith('/shipping-documents', data);
    });

    it('should handle creation error', async () => {
      const data = { documentNumber: 'SD003' };

      api.post.mockRejectedValue(new Error('Creation failed'));

      await expect(shippingDocumentService.createShippingDocument(data)).rejects.toThrow();
    });
  });

  describe('updateShippingDocument', () => {
    it('should update shipping document', async () => {
      const data = { status: 'in_transit' };
      const mockResponse = { id: 1, documentNumber: 'SD001', ...data };

      api.put.mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.updateShippingDocument(1, data);

      expect(result).toEqual(mockResponse);
      expect(api.put).toHaveBeenCalledWith('/shipping-documents/1', data);
    });

    it('should handle update error', async () => {
      api.put.mockRejectedValue(new Error('Update failed'));

      await expect(shippingDocumentService.updateShippingDocument(1, {})).rejects.toThrow();
    });
  });

  describe('deleteShippingDocument', () => {
    it('should delete shipping document', async () => {
      const mockResponse = { success: true };

      api.delete.mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.deleteShippingDocument(1);

      expect(result).toEqual(mockResponse);
      expect(api.delete).toHaveBeenCalledWith('/shipping-documents/1');
    });

    it('should handle delete error', async () => {
      api.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(shippingDocumentService.deleteShippingDocument(1)).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should update shipping status', async () => {
      const mockResponse = { id: 1, status: 'delivered' };

      api.patch.mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.updateStatus(1, 'delivered', 'Delivered to customer');

      expect(result).toEqual(mockResponse);
      expect(api.patch).toHaveBeenCalledWith('/shipping-documents/1/status', {
        status: 'delivered',
        notes: 'Delivered to customer',
      });
    });

    it('should handle status update error', async () => {
      api.patch.mockRejectedValue(new Error('Status update failed'));

      await expect(shippingDocumentService.updateStatus(1, 'invalid')).rejects.toThrow();
    });
  });

  describe('trackShipment', () => {
    it('should track shipment', async () => {
      const mockResponse = {
        id: 1,
        status: 'in_transit',
        currentLocation: 'Dubai',
        estimatedDelivery: '2024-02-10',
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.trackShipment(1);

      expect(result).toEqual(mockResponse);
      expect(api.get).toHaveBeenCalledWith('/shipping-documents/1/track');
    });

    it('should handle tracking error', async () => {
      api.get.mockRejectedValue(new Error('Tracking unavailable'));

      await expect(shippingDocumentService.trackShipment(999)).rejects.toThrow();
    });
  });

  describe('getDocumentTypes', () => {
    it('should get document types', async () => {
      const mockTypes = [
        { value: 'packing_list', label: 'Packing List' },
        { value: 'shipping_label', label: 'Shipping Label' },
      ];

      api.get.mockResolvedValue(mockTypes);

      const result = await shippingDocumentService.getDocumentTypes();

      expect(Array.isArray(result)).toBe(true);
      expect(api.get).toHaveBeenCalledWith('/shipping-documents/types/list');
    });

    it('should handle error', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      await expect(shippingDocumentService.getDocumentTypes()).rejects.toThrow();
    });
  });

  describe('getStatusOptions', () => {
    it('should return status options', () => {
      const options = shippingDocumentService.getStatusOptions();

      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toHaveProperty('value');
      expect(options[0]).toHaveProperty('label');
      expect(options[0]).toHaveProperty('color');
    });

    it('should include draft status', () => {
      const options = shippingDocumentService.getStatusOptions();
      const draftOption = options.find((o) => o.value === 'draft');

      expect(draftOption).toBeDefined();
      expect(draftOption.label).toBe('Draft');
    });

    it('should include delivered status', () => {
      const options = shippingDocumentService.getStatusOptions();
      const deliveredOption = options.find((o) => o.value === 'delivered');

      expect(deliveredOption).toBeDefined();
      expect(deliveredOption.label).toBe('Delivered');
    });
  });
});
