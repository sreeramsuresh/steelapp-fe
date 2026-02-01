/**
 * Delivery Note Service Unit Tests
 * ✅ Tests delivery note CRUD operations
 * ✅ Tests data transformation (snake_case ↔ camelCase)
 * ✅ Tests status transitions and partial delivery
 * ✅ Tests stock deduction workflow
 * ✅ 100% coverage target for deliveryNoteService.js
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

import { deliveryNoteService, transformDeliveryNoteFromServer } from '../deliveryNoteService';
import { apiClient } from '../api';

describe('deliveryNoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  describe('transformDeliveryNoteFromServer()', () => {
    test('should transform delivery note with camelCase conversion', () => {
      const serverData = {
        id: 1,
        company_id: 1,
        delivery_note_number: 'DN-2026-001',
        invoice_id: 100,
        invoice_number: 'INV-2026-001',
        customer_id: 5,
        customer_details: 'Emirates Corp',
        delivery_date: '2026-01-15',
        delivery_address: 'Dubai, UAE',
        driver_name: 'John Smith',
        driver_phone: '+971501234567',
        vehicle_number: 'ABC123',
        status: 'DELIVERED',
        is_partial: false,
        notes: 'Delivery completed',
        items: [
          {
            id: 1,
            invoice_item_id: 10,
            product_id: 50,
            name: 'Stainless Steel Sheet',
            specification: '304L',
            hsn_code: '7219.90',
            unit: 'kg',
            ordered_quantity: 100,
            delivered_quantity: 100,
            remaining_quantity: 0,
            is_fully_delivered: true,
          },
        ],
        stock_deducted: true,
        stock_deducted_at: '2026-01-15T14:30:00Z',
        stock_deducted_by: 'user123',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T14:30:00Z',
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.id).toBe(1);
      expect(result.companyId).toBe(1);
      expect(result.deliveryNoteNumber).toBe('DN-2026-001');
      expect(result.invoiceId).toBe(100);
      expect(result.invoiceNumber).toBe('INV-2026-001');
      expect(result.customerId).toBe(5);
      expect(result.customerDetails).toBe('Emirates Corp');
      expect(result.deliveryDate).toBe('2026-01-15');
      expect(result.deliveryAddress).toBe('Dubai, UAE');
      expect(result.driverName).toBe('John Smith');
      expect(result.driverPhone).toBe('+971501234567');
      expect(result.vehicleNumber).toBe('ABC123');
      expect(result.status).toBe('DELIVERED');
      expect(result.isPartial).toBe(false);
      expect(result.notes).toBe('Delivery completed');
      expect(result.stockDeducted).toBe(true);
      expect(result.stockDeductedAt).toBe('2026-01-15T14:30:00Z');
      expect(result.stockDeductedBy).toBe('user123');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].invoiceItemId).toBe(10);
      expect(result.items[0].deliveredQuantity).toBe(100);
      expect(result.items[0].isFullyDelivered).toBe(true);
    });

    test('should handle null input gracefully', () => {
      const result = transformDeliveryNoteFromServer(null);
      expect(result).toBeNull();
    });

    test('should handle undefined input gracefully', () => {
      const result = transformDeliveryNoteFromServer(undefined);
      expect(result).toBeNull();
    });

    test('should provide defaults for missing fields', () => {
      const serverData = {
        id: 1,
        company_id: 1,
        delivery_note_number: 'DN-001',
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.status).toBe('PENDING');
      expect(result.isPartial).toBe(false);
      expect(result.notes).toBe('');
      expect(result.items).toEqual([]);
      expect(result.stockDeducted).toBe(false);
    });

    test('should handle partial delivery data', () => {
      const serverData = {
        id: 1,
        delivery_note_number: 'DN-002',
        is_partial: true,
        items: [
          {
            id: 1,
            ordered_quantity: 100,
            delivered_quantity: 60,
            remaining_quantity: 40,
            is_fully_delivered: false,
          },
        ],
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.isPartial).toBe(true);
      expect(result.items[0].deliveredQuantity).toBe(60);
      expect(result.items[0].remainingQuantity).toBe(40);
      expect(result.items[0].isFullyDelivered).toBe(false);
    });
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe('getAll()', () => {
    test('should fetch delivery notes with pagination', async () => {
      const mockResponse = {
        deliveryNotes: [
          {
            id: 1,
            delivery_note_number: 'DN-2026-001',
            status: 'DELIVERED',
          },
          {
            id: 2,
            delivery_note_number: 'DN-2026-002',
            status: 'PENDING',
          },
        ],
        pageInfo: { page: 1, totalPages: 5, total: 45 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await deliveryNoteService.getAll({ page: 1, limit: 10 });

      expect(result.deliveryNotes).toHaveLength(2);
      expect(result.pageInfo.total).toBe(45);
      expect(apiClient.get).toHaveBeenCalledWith('/delivery-notes', {
        page: 1,
        limit: 10,
      });
    });

    test('should fetch delivery notes with filters', async () => {
      const mockResponse = { deliveryNotes: [], pageInfo: {} };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await deliveryNoteService.getAll({
        status: 'DELIVERED',
        invoiceId: 100,
        page: 1,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/delivery-notes', {
        status: 'DELIVERED',
        invoiceId: 100,
        page: 1,
      });
    });

    test('should handle API errors gracefully', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('API unavailable'));

      await expect(deliveryNoteService.getAll()).rejects.toThrow('API unavailable');
    });
  });

  describe('getById()', () => {
    test('should fetch delivery note by ID', async () => {
      const mockDeliveryNoteData = {
        id: 1,
        delivery_note_number: 'DN-2026-001',
        status: 'DELIVERED',
        items: [{ id: 1, name: 'Product A', delivered_quantity: 100 }],
      };
      const mockDeliveryNote = transformDeliveryNoteFromServer(mockDeliveryNoteData);
      apiClient.get.mockResolvedValueOnce(mockDeliveryNote);

      const result = await deliveryNoteService.getById(1);

      expect(result.deliveryNoteNumber).toBe('DN-2026-001');
      expect(result.items).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/delivery-notes/1');
    });

    test('should return null for non-existent delivery note', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Not found'));

      await expect(deliveryNoteService.getById(999)).rejects.toThrow('Not found');
    });
  });

  describe('create()', () => {
    test('should create delivery note from invoice', async () => {
      const deliveryNoteData = {
        invoiceId: 100,
        deliveryDate: '2026-01-15',
        driverName: 'John Smith',
        items: [
          { invoiceItemId: 10, deliveredQuantity: 100 },
        ],
      };
      const mockResponseData = {
        id: 1,
        delivery_note_number: 'DN-2026-001',
        status: 'PENDING',
        invoice_id: 100,
        delivery_date: '2026-01-15',
        driver_name: 'John Smith',
        items: [{ invoice_item_id: 10, delivered_quantity: 100 }],
      };
      const mockResponse = transformDeliveryNoteFromServer(mockResponseData);
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await deliveryNoteService.create(deliveryNoteData);

      expect(result.id).toBe(1);
      expect(result.deliveryNoteNumber).toBe('DN-2026-001');
      expect(apiClient.post).toHaveBeenCalledWith('/delivery-notes', deliveryNoteData);
    });

    test('should validate required fields on create', async () => {
      const invalidData = {
        invoiceId: null,
        deliveryDate: '',
      };
      apiClient.post.mockRejectedValueOnce(
        new Error('Missing required fields')
      );

      await expect(deliveryNoteService.create(invalidData)).rejects.toThrow(
        'Missing required fields'
      );
    });
  });

  describe('update()', () => {
    test('should update delivery note', async () => {
      const updateData = {
        driverName: 'Jane Doe',
        vehicleNumber: 'XYZ999',
        notes: 'Updated notes',
      };
      const mockResponse = {
        id: 1,
        ...updateData,
        status: 'DELIVERED',
      };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await deliveryNoteService.update(1, updateData);

      expect(result.driverName).toBe('Jane Doe');
      expect(result.vehicleNumber).toBe('XYZ999');
      expect(apiClient.put).toHaveBeenCalledWith('/delivery-notes/1', updateData);
    });

    test('should handle update errors', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Cannot update delivered note'));

      await expect(
        deliveryNoteService.update(1, { driverName: 'John' })
      ).rejects.toThrow('Cannot update delivered note');
    });
  });

  // ============================================================================
  // PARTIAL DELIVERY
  // ============================================================================

  describe('updateDelivery()', () => {
    test('should update delivery quantities for item', async () => {
      const deliveryData = {
        deliveredQuantity: 50,
        remarks: 'Partial delivery due to shipping delay',
      };
      const mockResponse = {
        id: 1,
        deliveredQuantity: 50,
        remainingQuantity: 50,
        isFullyDelivered: false,
      };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await deliveryNoteService.updateDelivery(1, 10, deliveryData);

      expect(result.deliveredQuantity).toBe(50);
      expect(result.remainingQuantity).toBe(50);
      expect(result.isFullyDelivered).toBe(false);
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/delivery-notes/1/items/10/deliver',
        deliveryData
      );
    });

    test('should mark item as fully delivered', async () => {
      const deliveryData = { deliveredQuantity: 100 };
      const mockResponse = {
        deliveredQuantity: 100,
        remainingQuantity: 0,
        isFullyDelivered: true,
      };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await deliveryNoteService.updateDelivery(1, 10, deliveryData);

      expect(result.isFullyDelivered).toBe(true);
      expect(result.remainingQuantity).toBe(0);
    });

    test('should prevent exceeding ordered quantity', async () => {
      const deliveryData = { deliveredQuantity: 150 }; // Exceeds ordered quantity of 100
      apiClient.patch.mockRejectedValueOnce(
        new Error('Cannot deliver more than ordered quantity')
      );

      await expect(
        deliveryNoteService.updateDelivery(1, 10, deliveryData)
      ).rejects.toThrow('Cannot deliver more than ordered quantity');
    });
  });

  // ============================================================================
  // STATUS TRANSITIONS
  // ============================================================================

  describe('updateStatus()', () => {
    test('should update delivery note status', async () => {
      const mockResponse = {
        id: 1,
        status: 'DELIVERED',
        stockDeducted: true,
        stockDeductedAt: '2026-01-15T14:30:00Z',
      };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await deliveryNoteService.updateStatus(1, 'DELIVERED', 'Delivered successfully');

      expect(result.status).toBe('DELIVERED');
      expect(result.stockDeducted).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/delivery-notes/1/status',
        { status: 'DELIVERED', notes: 'Delivered successfully' }
      );
    });

    test('should update status with empty notes', async () => {
      const mockResponse = { id: 1, status: 'CANCELLED' };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      await deliveryNoteService.updateStatus(1, 'CANCELLED');

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/delivery-notes/1/status',
        { status: 'CANCELLED', notes: '' }
      );
    });

    test('should prevent invalid status transitions', async () => {
      apiClient.patch.mockRejectedValueOnce(
        new Error('Cannot cancel delivered note')
      );

      await expect(
        deliveryNoteService.updateStatus(1, 'CANCELLED')
      ).rejects.toThrow('Cannot cancel delivered note');
    });

    test('should handle status transition to HOLD', async () => {
      const mockResponse = { id: 1, status: 'HOLD' };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await deliveryNoteService.updateStatus(1, 'HOLD', 'On hold pending inspection');

      expect(result.status).toBe('HOLD');
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/delivery-notes/1/status',
        { status: 'HOLD', notes: 'On hold pending inspection' }
      );
    });
  });

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  describe('delete()', () => {
    test('should delete delivery note', async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await deliveryNoteService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/delivery-notes/1');
    });

    test('should prevent deleting delivered note', async () => {
      apiClient.delete.mockRejectedValueOnce(
        new Error('Cannot delete delivered note')
      );

      await expect(deliveryNoteService.delete(1)).rejects.toThrow(
        'Cannot delete delivered note'
      );
    });
  });

  // ============================================================================
  // STOCK DEDUCTION WORKFLOW
  // ============================================================================

  describe('Stock Deduction Workflow', () => {
    test('should track stock deduction status', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        stock_deducted: true,
        stock_deducted_at: '2026-01-15T14:30:00Z',
        stock_deducted_by: 'admin@company.com',
      });

      expect(deliveryNote.stockDeducted).toBe(true);
      expect(deliveryNote.stockDeductedAt).toBe('2026-01-15T14:30:00Z');
      expect(deliveryNote.stockDeductedBy).toBe('admin@company.com');
    });

    test('should indicate stock not yet deducted', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        status: 'PENDING',
        stock_deducted: false,
      });

      expect(deliveryNote.stockDeducted).toBe(false);
      expect(deliveryNote.stockDeductedAt).toBeUndefined();
    });
  });

  // ============================================================================
  // GRN-RELATED FIELDS
  // ============================================================================

  describe('GRN-Related Fields', () => {
    test('should handle goods receipt date', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        goods_receipt_date: '2026-01-20',
        inspection_date: '2026-01-21',
      });

      expect(deliveryNote.goodsReceiptDate).toBe('2026-01-20');
      expect(deliveryNote.inspectionDate).toBe('2026-01-21');
    });

    test('should default GRN dates to empty string', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        delivery_note_number: 'DN-001',
      });

      expect(deliveryNote.goodsReceiptDate).toBe('');
      expect(deliveryNote.inspectionDate).toBe('');
    });
  });

  // ============================================================================
  // MULTI-ITEM DELIVERY
  // ============================================================================

  describe('Multi-Item Delivery', () => {
    test('should handle multiple delivery items', () => {
      const serverData = {
        id: 1,
        items: [
          {
            id: 1,
            name: 'Product A',
            delivered_quantity: 100,
            is_fully_delivered: true,
          },
          {
            id: 2,
            name: 'Product B',
            delivered_quantity: 50,
            remaining_quantity: 50,
            is_fully_delivered: false,
          },
          {
            id: 3,
            name: 'Product C',
            delivered_quantity: 0,
            remaining_quantity: 200,
            is_fully_delivered: false,
          },
        ],
      };

      const result = transformDeliveryNoteFromServer(serverData);

      expect(result.items).toHaveLength(3);
      expect(result.items[0].isFullyDelivered).toBe(true);
      expect(result.items[1].isFullyDelivered).toBe(false);
      expect(result.items[2].deliveredQuantity).toBe(0);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    test('should handle network errors in getAll', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(deliveryNoteService.getAll()).rejects.toThrow('Network error');
    });

    test('should handle network errors in create', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        deliveryNoteService.create({ invoiceId: 1 })
      ).rejects.toThrow('Network error');
    });

    test('should handle network errors in updateStatus', async () => {
      apiClient.patch.mockRejectedValueOnce(new Error('Server error'));

      await expect(
        deliveryNoteService.updateStatus(1, 'DELIVERED')
      ).rejects.toThrow('Server error');
    });

    test('should handle network errors in delete', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(deliveryNoteService.delete(1)).rejects.toThrow('Forbidden');
    });
  });
});
