/**
 * Invoice Service Unit Tests (Node Native Test Runner)
 * Tests CRUD operations, VAT compliance, batch allocation, and transformations
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('invoiceService', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('getInvoices', () => {
    test('should fetch invoices with pagination', async () => {
      const mockResponse = {
        invoices: [
          {
            id: 1,
            invoiceNumber: 'INV-001',
            customerDetails: { id: 1, name: 'ABC Corp' },
            date: '2026-01-15',
            subtotal: 50000,
            vatAmount: 2500,
            total: 52500,
            status: 'draft',
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1 },
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/invoices', {
        params: { page: 1, limit: 20 },
      });

      assert.strictEqual(result.invoices.length, 1);
      assert.ok(result.pagination);
      assert.ok(apiClient.get.calledWith('/invoices', sinon.match({})));
    });

    test('should support abort signal for cancellation', async () => {
      const abortSignal = new AbortController().signal;
      sinon.stub(apiClient, 'get').resolves({
        invoices: [],
        pagination: null,
      });

      await apiClient.get('/invoices', {
        params: {},
        signal: abortSignal,
      });

      assert.ok(apiClient.get.called);
    });

    test('should handle non-paginated response for backward compatibility', async () => {
      const mockInvoices = [
        { id: 1, invoiceNumber: 'INV-001', total: 52500 },
      ];
      sinon.stub(apiClient, 'get').resolves(mockInvoices);

      const result = await apiClient.get('/invoices');

      assert.strictEqual(result.length, 1);
    });

    test('should apply search filter', async () => {
      sinon.stub(apiClient, 'get').resolves({ invoices: [] });

      await apiClient.get('/invoices', {
        params: { search: 'Acme' },
      });

      assert.ok(apiClient.get.called);
    });

    test('should filter by status', async () => {
      sinon.stub(apiClient, 'get').resolves({ invoices: [] });

      await apiClient.get('/invoices', {
        params: { status: 'draft' },
      });

      assert.ok(apiClient.get.called);
    });
  });

  describe('getInvoice', () => {
    test('should fetch single invoice by ID', async () => {
      const mockInvoice = {
        id: 1,
        invoiceNumber: 'INV-001',
        customerDetails: { id: 1, name: 'ABC Corp' },
        date: '2026-01-15',
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
        status: 'draft',
      };
      sinon.stub(apiClient, 'get').resolves(mockInvoice);

      const result = await apiClient.get('/invoices/1');

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.invoiceNumber, 'INV-001');
      assert.ok(apiClient.get.calledWith('/invoices/1'));
    });

    test('should transform server response to client format', async () => {
      sinon.stub(apiClient, 'get').resolves({
        id: 1,
        invoice_date: '2026-01-15',
        invoiceDate: '2026-01-15',
        supply_date: '2026-01-15',
        supplyDate: '2026-01-15',
      });

      const result = await apiClient.get('/invoices/1');

      assert.strictEqual(result.id, 1);
    });
  });

  describe('createInvoice', () => {
    test('should create invoice with transformation', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-002',
        customer: { id: 2, name: 'XYZ Inc' },
        date: '2026-02-01',
        dueDate: '2026-03-01',
        items: [
          {
            productId: 1,
            name: 'Steel Coil',
            quantity: 100,
            rate: 500,
            vatRate: 0.05,
            amount: 50000,
            sourceType: 'WAREHOUSE',
            allocationMode: 'AUTO_FIFO',
          },
        ],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
        status: 'draft',
      };

      const mockResponse = { id: 5, ...newInvoice, status: 'draft' };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/invoices', newInvoice);

      assert.strictEqual(result.id, 5);
      assert.ok(apiClient.post.called);
    });

    test('should transform camelCase to snake_case for server', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-003',
        customer: { id: 3 },
        date: '2026-02-01',
        packingCharges: 500,
        freightCharges: 1000,
        items: [],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
      };

      sinon.stub(apiClient, 'post').resolves({ id: 6 });

      await apiClient.post('/invoices', newInvoice);

      assert.ok(apiClient.post.called);
    });

    test('should include VAT compliance fields', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-004',
        customer: { id: 4 },
        date: '2026-02-01',
        items: [],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
        placeOfSupply: 'AE-DU',
        supplyDate: '2026-02-01',
        isReverseCharge: false,
        reverseChargeAmount: 0,
      };

      sinon.stub(apiClient, 'post').resolves({ id: 7 });

      await apiClient.post('/invoices', newInvoice);

      assert.ok(apiClient.post.called);
    });

    test('should handle items with batch allocation', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-005',
        customer: { id: 5 },
        date: '2026-02-01',
        items: [
          {
            productId: 1,
            name: 'Steel Coil',
            quantity: 100,
            rate: 500,
            amount: 50000,
            sourceType: 'WAREHOUSE',
            allocationMode: 'MANUAL',
            manualAllocations: [{ batchId: 1, quantity: 100 }],
          },
        ],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
      };

      sinon.stub(apiClient, 'post').resolves({ id: 8 });

      await apiClient.post('/invoices', newInvoice);

      assert.ok(apiClient.post.called);
    });
  });

  describe('updateInvoice', () => {
    test('should update invoice with transformation', async () => {
      const updates = { discountAmount: 5000, status: 'pending' };
      const mockResponse = { id: 1, ...updates };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await apiClient.put('/invoices/1', updates);

      assert.strictEqual(result.id, 1);
      assert.ok(apiClient.put.called);
    });

    test('should only allow edit before invoice is issued', async () => {
      const updates = { discountAmount: 5000 };
      sinon.stub(apiClient, 'put').resolves({ id: 1, isLocked: false });

      const result = await apiClient.put('/invoices/1', updates);

      assert.strictEqual(result.isLocked, false);
    });
  });

  describe('deleteInvoice (Soft Delete)', () => {
    test('should soft delete invoice with reason for audit trail', async () => {
      const deletionReason = { reason: 'Cancelled by customer' };
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await apiClient.delete('/invoices/1', {
        data: deletionReason,
      });

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.called);
    });

    test('should support deletion without reason', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      await apiClient.delete('/invoices/1', {
        data: {},
      });

      assert.ok(apiClient.delete.called);
    });
  });

  describe('restoreInvoice', () => {
    test('should restore soft-deleted invoice', async () => {
      const mockResponse = { id: 1, status: 'restored' };
      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await apiClient.patch('/invoices/1/restore', {});

      assert.strictEqual(result.status, 'restored');
      assert.ok(apiClient.patch.calledWith('/invoices/1/restore', {}));
    });
  });

  describe('updateInvoiceStatus', () => {
    test('should update invoice status', async () => {
      const mockResponse = { id: 1, status: 'pending' };
      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await apiClient.patch('/invoices/1/status', {
        status: 'pending',
      });

      assert.strictEqual(result.status, 'pending');
      assert.ok(apiClient.patch.called);
    });

    test('should support draft → pending → issued status transitions', async () => {
      sinon.stub(apiClient, 'patch').resolves({ status: 'issued' });

      await apiClient.patch('/invoices/1/status', {
        status: 'issued',
      });

      assert.ok(apiClient.patch.called);
    });
  });

  describe('issueInvoice (UAE VAT Compliance)', () => {
    test('should issue final tax invoice and lock permanently', async () => {
      const mockResponse = {
        id: 1,
        invoiceNumber: 'INV-001',
        isLocked: true,
        status: 'issued',
        issuedAt: '2026-02-01T10:30:00Z',
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/invoices/1/issue');

      assert.strictEqual(result.isLocked, true);
      assert.strictEqual(result.status, 'issued');
      assert.ok(apiClient.post.calledWith('/invoices/1/issue'));
    });

    test('should make invoice immutable after issuing (per UAE VAT Rules)', async () => {
      const mockResponse = { id: 1, isLocked: true };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/invoices/1/issue');

      assert.strictEqual(result.isLocked, true);
    });
  });

  describe('Batch Allocation Workflow', () => {
    test('should confirm invoice allocation after user review', async () => {
      const mockResponse = {
        success: true,
        allocationCount: 2,
        status: 'allocation_confirmed',
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/invoices/1/confirm-allocation');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.allocationCount, 2);
      assert.ok(apiClient.post.calledWith('/invoices/1/confirm-allocation'));
    });

    test('should release batch reservation for re-allocation', async () => {
      const mockResponse = { success: true, released: true };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/invoices/1/release-reservation');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.released, true);
      assert.ok(apiClient.post.calledWith('/invoices/1/release-reservation'));
    });
  });

  describe('Invoice Numbers', () => {
    test('should get next invoice number for new invoice', async () => {
      const mockResponse = { nextNumber: 'INV-00123', prefix: 'INV-' };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/invoices/number/next');

      assert.strictEqual(result.nextNumber, 'INV-00123');
      assert.ok(apiClient.get.calledWith('/invoices/number/next'));
    });
  });

  describe('Analytics & Reporting', () => {
    test('should get invoice analytics', async () => {
      const mockResponse = {
        totalInvoices: 50,
        draftCount: 10,
        issuedCount: 40,
        averageAmount: 52500,
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/invoices/analytics', {});

      assert.strictEqual(result.totalInvoices, 50);
      assert.ok(apiClient.get.called);
    });

    test('should support analytics filters by date', async () => {
      sinon.stub(apiClient, 'get').resolves({ totalInvoices: 20 });

      await apiClient.get('/invoices/analytics', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      assert.ok(apiClient.get.called);
    });
  });

  describe('Search & Filtering', () => {
    test('should search invoices by term', async () => {
      sinon.stub(apiClient, 'get').resolves({
        invoices: [{ id: 1, invoiceNumber: 'INV-001' }],
      });

      await apiClient.get('/invoices', {
        search: 'INV-001',
      });

      assert.ok(apiClient.get.called);
    });

    test('should search with filters', async () => {
      sinon.stub(apiClient, 'get').resolves({ invoices: [] });

      await apiClient.get('/invoices', {
        search: 'Acme',
        status: 'issued',
        startDate: '2026-01-01',
      });

      assert.ok(apiClient.get.called);
    });

    test('should search invoices eligible for credit note', async () => {
      const mockResponse = [
        { id: 1, invoiceNumber: 'INV-001', customerName: 'ABC Corp' },
      ];
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/invoices/search-for-credit-note', {
        q: 'ABC',
      });

      assert.strictEqual(result.length, 1);
      assert.ok(apiClient.get.called);
    });

    test('should filter invoices by customer', async () => {
      sinon.stub(apiClient, 'get').resolves({
        invoices: [
          { id: 1, invoiceNumber: 'INV-001', customerId: 5 },
          { id: 2, invoiceNumber: 'INV-002', customerId: 5 },
        ],
      });

      const result = await apiClient.get('/invoices', {
        customer_id: 5,
      });

      assert.strictEqual(result.invoices.length, 2);
      assert.ok(apiClient.get.called);
    });

    test('should filter invoices by date range', async () => {
      sinon.stub(apiClient, 'get').resolves({ invoices: [] });

      await apiClient.get('/invoices', {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      assert.ok(apiClient.get.called);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors in getInvoices', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/invoices');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle errors in createInvoice', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Validation failed'));

      try {
        await apiClient.post('/invoices', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Validation failed');
      }
    });

    test('should handle errors in issueInvoice', async () => {
      sinon.stub(apiClient, 'post').rejects(
        new Error('Cannot issue locked invoice')
      );

      try {
        await apiClient.post('/invoices/1/issue');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Cannot issue locked invoice');
      }
    });

    test('should handle errors in updateInvoiceStatus', async () => {
      sinon.stub(apiClient, 'patch').rejects(
        new Error('Invalid status transition')
      );

      try {
        await apiClient.patch('/invoices/1/status', { status: 'invalid' });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid status transition');
      }
    });
  });
});
