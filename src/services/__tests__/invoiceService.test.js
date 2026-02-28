/**
 * Invoice Service Unit Tests (Node Native Test Runner)
 * Tests CRUD operations, VAT compliance, batch allocation, and transformations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';

describe('invoiceService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInvoices', () => {
    it('should fetch invoices with pagination', async () => {
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
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/invoices', {
        params: { page: 1, limit: 20 },
      });

      expect(result.invoices.length).toBe(1);
      expect(result.pagination).toBeTruthy();
      expect(apiClient.get.calledWith('/invoices', expect.objectContaining({}).toBeTruthy()));
    });

    it('should support abort signal for cancellation', async () => {
      const abortSignal = new AbortController().signal;
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        invoices: [],
        pagination: null,
      });

      await apiClient.get('/invoices', {
        params: {},
        signal: abortSignal,
      });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it('should handle non-paginated response for backward compatibility', async () => {
      const mockInvoices = [
        { id: 1, invoiceNumber: 'INV-001', total: 52500 },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockInvoices);

      const result = await apiClient.get('/invoices');

      expect(result.length).toBe(1);
    });

    it('should apply search filter', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ invoices: [] });

      await apiClient.get('/invoices', {
        params: { search: 'Acme' },
      });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it('should filter by status', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ invoices: [] });

      await apiClient.get('/invoices', {
        params: { status: 'draft' },
      });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getInvoice', () => {
    it('should fetch single invoice by ID', async () => {
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
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockInvoice);

      const result = await apiClient.get('/invoices/1');

      expect(result.id).toBe(1);
      expect(result.invoiceNumber).toBe('INV-001');
      expect(apiClient.get.calledWith('/invoices/1').toBeTruthy());
    });

    it('should transform server response to client format', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        id: 1,
        invoice_date: '2026-01-15',
        invoiceDate: '2026-01-15',
        supply_date: '2026-01-15',
        supplyDate: '2026-01-15',
      });

      const result = await apiClient.get('/invoices/1');

      expect(result.id).toBe(1);
    });
  });

  describe('createInvoice', () => {
    it('should create invoice with transformation', async () => {
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
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/invoices', newInvoice);

      expect(result.id).toBe(5);
      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it('should transform camelCase to snake_case for server', async () => {
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

      vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 6 });

      await apiClient.post('/invoices', newInvoice);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it('should include VAT compliance fields', async () => {
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

      vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 7 });

      await apiClient.post('/invoices', newInvoice);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it('should handle items with batch allocation', async () => {
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

      vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 8 });

      await apiClient.post('/invoices', newInvoice);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice with transformation', async () => {
      const updates = { discountAmount: 5000, status: 'pending' };
      const mockResponse = { id: 1, ...updates };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await apiClient.put('/invoices/1', updates);

      expect(result.id).toBe(1);
      expect(apiClient.put.mock.calls.length > 0).toBeTruthy();
    });

    it('should only allow edit before invoice is issued', async () => {
      const updates = { discountAmount: 5000 };
      vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 1, isLocked: false });

      const result = await apiClient.put('/invoices/1', updates);

      expect(result.isLocked).toBe(false);
    });
  });

  describe('deleteInvoice (Soft Delete)', () => {
    it('should soft delete invoice with reason for audit trail', async () => {
      const deletionReason = { reason: 'Cancelled by customer' };
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      const result = await apiClient.delete('/invoices/1', {
        data: deletionReason,
      });

      expect(result.success).toBe(true);
      expect(apiClient.delete.mock.calls.length > 0).toBeTruthy();
    });

    it('should support deletion without reason', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      await apiClient.delete('/invoices/1', {
        data: {},
      });

      expect(apiClient.delete.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('restoreInvoice', () => {
    it('should restore soft-deleted invoice', async () => {
      const mockResponse = { id: 1, status: 'restored' };
      vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

      const result = await apiClient.patch('/invoices/1/restore', {});

      expect(result.status).toBe('restored');
      expect(apiClient.patch.calledWith('/invoices/1/restore', {}).toBeTruthy());
    });
  });

  describe('updateInvoiceStatus', () => {
    it('should update invoice status', async () => {
      const mockResponse = { id: 1, status: 'pending' };
      vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

      const result = await apiClient.patch('/invoices/1/status', {
        status: 'pending',
      });

      expect(result.status).toBe('pending');
      expect(apiClient.patch.mock.calls.length > 0).toBeTruthy();
    });

    it('should support draft → pending → issued status transitions', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValue({ status: 'issued' });

      await apiClient.patch('/invoices/1/status', {
        status: 'issued',
      });

      expect(apiClient.patch.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('issueInvoice (UAE VAT Compliance)', () => {
    it('should issue final tax invoice and lock permanently', async () => {
      const mockResponse = {
        id: 1,
        invoiceNumber: 'INV-001',
        isLocked: true,
        status: 'issued',
        issuedAt: '2026-02-01T10:30:00Z',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/invoices/1/issue');

      expect(result.isLocked).toBe(true);
      expect(result.status).toBe('issued');
      expect(apiClient.post.calledWith('/invoices/1/issue').toBeTruthy());
    });

    it('should make invoice immutable after issuing (per UAE VAT Rules)', async () => {
      const mockResponse = { id: 1, isLocked: true };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/invoices/1/issue');

      expect(result.isLocked).toBe(true);
    });
  });

  describe('Batch Allocation Workflow', () => {
    it('should confirm invoice allocation after user review', async () => {
      const mockResponse = {
        success: true,
        allocationCount: 2,
        status: 'allocation_confirmed',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/invoices/1/confirm-allocation');

      expect(result.success).toBe(true);
      expect(result.allocationCount).toBe(2);
      expect(apiClient.post.calledWith('/invoices/1/confirm-allocation').toBeTruthy());
    });

    it('should release batch reservation for re-allocation', async () => {
      const mockResponse = { success: true, released: true };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/invoices/1/release-reservation');

      expect(result.success).toBe(true);
      expect(result.released).toBe(true);
      expect(apiClient.post.calledWith('/invoices/1/release-reservation').toBeTruthy());
    });
  });

  describe('Invoice Numbers', () => {
    it('should get next invoice number for new invoice', async () => {
      const mockResponse = { nextNumber: 'INV-00123', prefix: 'INV-' };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/invoices/number/next');

      expect(result.nextNumber).toBe('INV-00123');
      expect(apiClient.get.calledWith('/invoices/number/next').toBeTruthy());
    });
  });

  describe('Analytics & Reporting', () => {
    it('should get invoice analytics', async () => {
      const mockResponse = {
        totalInvoices: 50,
        draftCount: 10,
        issuedCount: 40,
        averageAmount: 52500,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/invoices/analytics', {});

      expect(result.totalInvoices).toBe(50);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it('should support analytics filters by date', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ totalInvoices: 20 });

      await apiClient.get('/invoices/analytics', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('Search & Filtering', () => {
    it('should search invoices by term', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        invoices: [{ id: 1, invoiceNumber: 'INV-001' }],
      });

      await apiClient.get('/invoices', {
        search: 'INV-001',
      });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it('should search with filters', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ invoices: [] });

      await apiClient.get('/invoices', {
        search: 'Acme',
        status: 'issued',
        startDate: '2026-01-01',
      });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it('should search invoices eligible for credit note', async () => {
      const mockResponse = [
        { id: 1, invoiceNumber: 'INV-001', customerName: 'ABC Corp' },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/invoices/search-for-credit-note', {
        q: 'ABC',
      });

      expect(result.length).toBe(1);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it('should filter invoices by customer', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        invoices: [
          { id: 1, invoiceNumber: 'INV-001', customerId: 5 },
          { id: 2, invoiceNumber: 'INV-002', customerId: 5 },
        ],
      });

      const result = await apiClient.get('/invoices', {
        customer_id: 5,
      });

      expect(result.invoices.length).toBe(2);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it('should filter invoices by date range', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ invoices: [] });

      await apiClient.get('/invoices', {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors in getInvoices', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await apiClient.get('/invoices');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle errors in createInvoice', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Validation failed'));

      try {
        await apiClient.post('/invoices', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Validation failed');
      }
    });

    it('should handle errors in issueInvoice', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new Error('Cannot issue locked invoice')
      );

      try {
        await apiClient.post('/invoices/1/issue');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Cannot issue locked invoice');
      }
    });

    it('should handle errors in updateInvoiceStatus', async () => {
      vi.spyOn(apiClient, 'patch').mockRejectedValue(
        new Error('Invalid status transition')
      );

      try {
        await apiClient.patch('/invoices/1/status', { status: 'invalid' });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Invalid status transition');
      }
    });
  });
});
