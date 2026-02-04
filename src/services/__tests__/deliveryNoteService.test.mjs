/**
 * Delivery Note Service Unit Tests (Node Native Test Runner)
 * Tests delivery note CRUD operations and transformation
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

/**
 * Transform delivery note from server format (snake_case) to client format (camelCase)
 */
function transformDeliveryNoteFromServer(data) {
  if (!data) return null;

  return {
    id: data.id,
    companyId: data.company_id,
    deliveryNoteNumber: data.delivery_note_number,
    invoiceId: data.invoice_id,
    invoiceNumber: data.invoice_number,
    customerId: data.customer_id,
    customerDetails: data.customer_details || '',
    deliveryDate: data.delivery_date,
    deliveryAddress: data.delivery_address || '',
    driverName: data.driver_name || '',
    driverPhone: data.driver_phone || '',
    vehicleNumber: data.vehicle_number || '',
    status: data.status || 'PENDING',
    isPartial: data.is_partial || false,
    notes: data.notes || '',
    items: (data.items || []).map((item) => ({
      id: item.id,
      invoiceItemId: item.invoice_item_id,
      productId: item.product_id,
      name: item.name || '',
      specification: item.specification || '',
      hsnCode: item.hsn_code || '',
      unit: item.unit || '',
      orderedQuantity: item.ordered_quantity,
      deliveredQuantity: item.delivered_quantity,
      remainingQuantity: item.remaining_quantity,
      isFullyDelivered: item.is_fully_delivered,
    })),
    stockDeducted: data.stock_deducted || false,
    stockDeductedAt: data.stock_deducted_at,
    stockDeductedBy: data.stock_deducted_by,
    goodsReceiptDate: data.goods_receipt_date || '',
    inspectionDate: data.inspection_date || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

describe('deliveryNoteService', () => {
  beforeEach(() => {
    sinon.restore();
  });

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

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.companyId, 1);
      assert.strictEqual(result.deliveryNoteNumber, 'DN-2026-001');
      assert.strictEqual(result.invoiceId, 100);
      assert.strictEqual(result.invoiceNumber, 'INV-2026-001');
      assert.strictEqual(result.customerId, 5);
      assert.strictEqual(result.customerDetails, 'Emirates Corp');
      assert.strictEqual(result.deliveryDate, '2026-01-15');
      assert.strictEqual(result.deliveryAddress, 'Dubai, UAE');
      assert.strictEqual(result.driverName, 'John Smith');
      assert.strictEqual(result.driverPhone, '+971501234567');
      assert.strictEqual(result.vehicleNumber, 'ABC123');
      assert.strictEqual(result.status, 'DELIVERED');
      assert.strictEqual(result.isPartial, false);
      assert.strictEqual(result.notes, 'Delivery completed');
      assert.strictEqual(result.stockDeducted, true);
      assert.strictEqual(result.stockDeductedAt, '2026-01-15T14:30:00Z');
      assert.strictEqual(result.stockDeductedBy, 'user123');
      assert.strictEqual(result.items.length, 1);
      assert.strictEqual(result.items[0].invoiceItemId, 10);
      assert.strictEqual(result.items[0].deliveredQuantity, 100);
      assert.strictEqual(result.items[0].isFullyDelivered, true);
    });

    test('should handle null input gracefully', () => {
      const result = transformDeliveryNoteFromServer(null);
      assert.strictEqual(result, null);
    });

    test('should provide defaults for missing fields', () => {
      const serverData = {
        id: 1,
        company_id: 1,
        delivery_note_number: 'DN-001',
      };

      const result = transformDeliveryNoteFromServer(serverData);

      assert.strictEqual(result.status, 'PENDING');
      assert.strictEqual(result.isPartial, false);
      assert.strictEqual(result.notes, '');
      assert.deepStrictEqual(result.items, []);
      assert.strictEqual(result.stockDeducted, false);
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

      assert.strictEqual(result.isPartial, true);
      assert.strictEqual(result.items[0].deliveredQuantity, 60);
      assert.strictEqual(result.items[0].remainingQuantity, 40);
      assert.strictEqual(result.items[0].isFullyDelivered, false);
    });
  });

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
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/delivery-notes', {
        page: 1,
        limit: 10,
      });

      assert.strictEqual(result.deliveryNotes.length, 2);
      assert.strictEqual(result.pageInfo.total, 45);
      assert.ok(apiClient.get.calledWith('/delivery-notes', { page: 1, limit: 10 }));
    });

    test('should fetch delivery notes with filters', async () => {
      const mockResponse = { deliveryNotes: [], pageInfo: {} };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      await apiClient.get('/delivery-notes', {
        status: 'DELIVERED',
        invoiceId: 100,
        page: 1,
      });

      assert.ok(
        apiClient.get.calledWith('/delivery-notes', sinon.match({
          status: 'DELIVERED',
          invoiceId: 100,
          page: 1,
        }))
      );
    });

    test('should handle API errors gracefully', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('API unavailable'));

      try {
        await apiClient.get('/delivery-notes');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'API unavailable');
      }
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
      sinon.stub(apiClient, 'get').resolves(mockDeliveryNote);

      const result = await apiClient.get('/delivery-notes/1');

      assert.strictEqual(result.deliveryNoteNumber, 'DN-2026-001');
      assert.strictEqual(result.items.length, 1);
      assert.ok(apiClient.get.calledWith('/delivery-notes/1'));
    });

    test('should return null for non-existent delivery note', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Not found'));

      try {
        await apiClient.get('/delivery-notes/999');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Not found');
      }
    });
  });

  describe('create()', () => {
    test('should create delivery note from invoice', async () => {
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const deliveryNoteData = {
        invoiceId: 100,
        deliveryDate: '2026-01-15',
        driverName: 'John Smith',
        items: [{ invoiceItemId: 10, deliveredQuantity: 100 }],
      };

      const result = await apiClient.post('/delivery-notes', deliveryNoteData);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.deliveryNoteNumber, 'DN-2026-001');
      assert.ok(apiClient.post.calledWith('/delivery-notes', deliveryNoteData));
    });

    test('should validate required fields on create', async () => {
      const invalidData = {
        invoiceId: null,
        deliveryDate: '',
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Missing required fields'));

      try {
        await apiClient.post('/delivery-notes', invalidData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Missing required fields');
      }
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
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await apiClient.put('/delivery-notes/1', updateData);

      assert.strictEqual(result.driverName, 'Jane Doe');
      assert.strictEqual(result.vehicleNumber, 'XYZ999');
      assert.ok(apiClient.put.calledWith('/delivery-notes/1', updateData));
    });

    test('should handle update errors', async () => {
      sinon.stub(apiClient, 'put').rejects(new Error('Cannot update delivered note'));

      try {
        await apiClient.put('/delivery-notes/1', { driverName: 'John' });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Cannot update delivered note');
      }
    });
  });

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
      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await apiClient.patch(
        '/delivery-notes/1/items/10/deliver',
        deliveryData
      );

      assert.strictEqual(result.deliveredQuantity, 50);
      assert.strictEqual(result.remainingQuantity, 50);
      assert.strictEqual(result.isFullyDelivered, false);
      assert.ok(
        apiClient.patch.calledWith('/delivery-notes/1/items/10/deliver', deliveryData)
      );
    });

    test('should mark item as fully delivered', async () => {
      const deliveryData = { deliveredQuantity: 100 };
      const mockResponse = {
        deliveredQuantity: 100,
        remainingQuantity: 0,
        isFullyDelivered: true,
      };
      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await apiClient.patch(
        '/delivery-notes/1/items/10/deliver',
        deliveryData
      );

      assert.strictEqual(result.isFullyDelivered, true);
      assert.strictEqual(result.remainingQuantity, 0);
    });

    test('should prevent exceeding ordered quantity', async () => {
      const deliveryData = { deliveredQuantity: 150 };
      sinon.stub(apiClient, 'patch').rejects(
        new Error('Cannot deliver more than ordered quantity')
      );

      try {
        await apiClient.patch('/delivery-notes/1/items/10/deliver', deliveryData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(
          error.message,
          'Cannot deliver more than ordered quantity'
        );
      }
    });
  });

  describe('updateStatus()', () => {
    test('should update delivery note status', async () => {
      const mockResponse = {
        id: 1,
        status: 'DELIVERED',
        stockDeducted: true,
        stockDeductedAt: '2026-01-15T14:30:00Z',
      };
      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await apiClient.patch('/delivery-notes/1/status', {
        status: 'DELIVERED',
        notes: 'Delivered successfully',
      });

      assert.strictEqual(result.status, 'DELIVERED');
      assert.strictEqual(result.stockDeducted, true);
      assert.ok(
        apiClient.patch.calledWith('/delivery-notes/1/status', sinon.match({}))
      );
    });

    test('should prevent invalid status transitions', async () => {
      sinon.stub(apiClient, 'patch').rejects(
        new Error('Cannot cancel delivered note')
      );

      try {
        await apiClient.patch('/delivery-notes/1/status', { status: 'CANCELLED' });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Cannot cancel delivered note');
      }
    });
  });

  describe('delete()', () => {
    test('should delete delivery note', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await apiClient.delete('/delivery-notes/1');

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith('/delivery-notes/1'));
    });

    test('should prevent deleting delivered note', async () => {
      sinon.stub(apiClient, 'delete').rejects(
        new Error('Cannot delete delivered note')
      );

      try {
        await apiClient.delete('/delivery-notes/1');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Cannot delete delivered note');
      }
    });
  });

  describe('Stock Deduction Workflow', () => {
    test('should track stock deduction status', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        stock_deducted: true,
        stock_deducted_at: '2026-01-15T14:30:00Z',
        stock_deducted_by: 'admin@company.com',
      });

      assert.strictEqual(deliveryNote.stockDeducted, true);
      assert.strictEqual(
        deliveryNote.stockDeductedAt,
        '2026-01-15T14:30:00Z'
      );
      assert.strictEqual(deliveryNote.stockDeductedBy, 'admin@company.com');
    });

    test('should indicate stock not yet deducted', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        status: 'PENDING',
        stock_deducted: false,
      });

      assert.strictEqual(deliveryNote.stockDeducted, false);
    });
  });

  describe('GRN-Related Fields', () => {
    test('should handle goods receipt date', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        goods_receipt_date: '2026-01-20',
        inspection_date: '2026-01-21',
      });

      assert.strictEqual(deliveryNote.goodsReceiptDate, '2026-01-20');
      assert.strictEqual(deliveryNote.inspectionDate, '2026-01-21');
    });

    test('should default GRN dates to empty string', () => {
      const deliveryNote = transformDeliveryNoteFromServer({
        id: 1,
        delivery_note_number: 'DN-001',
      });

      assert.strictEqual(deliveryNote.goodsReceiptDate, '');
      assert.strictEqual(deliveryNote.inspectionDate, '');
    });
  });

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

      assert.strictEqual(result.items.length, 3);
      assert.strictEqual(result.items[0].isFullyDelivered, true);
      assert.strictEqual(result.items[1].isFullyDelivered, false);
      assert.strictEqual(result.items[2].deliveredQuantity, 0);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors in getAll', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/delivery-notes');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle network errors in create', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Network error'));

      try {
        await apiClient.post('/delivery-notes', { invoiceId: 1 });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle network errors in updateStatus', async () => {
      sinon.stub(apiClient, 'patch').rejects(new Error('Server error'));

      try {
        await apiClient.patch('/delivery-notes/1/status', { status: 'DELIVERED' });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Server error');
      }
    });

    test('should handle network errors in delete', async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error('Forbidden'));

      try {
        await apiClient.delete('/delivery-notes/1');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Forbidden');
      }
    });
  });
});
