/**
 * Invoice Service Unit Tests
 * ✅ Comprehensive test coverage for invoiceService
 * ✅ Tests all CRUD operations, transformations, and integrations
 * ✅ Covers data transformation, pagination, search, and edge cases
 * ✅ 100% coverage target for invoiceService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the API client and utilities
vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('../../utils/fieldAccessors', () => ({
  normalizeUom: vi.fn((item) => item.unit || 'KG'),
}));

// Import after mocks are set up
import { invoiceService } from '../invoiceService';
import { apiClient } from '../api';
import { normalizeUom } from '../../utils/fieldAccessors';

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CRUD OPERATIONS - Core functionality
  // ============================================================================

  describe('CRUD Operations', () => {
    describe('getInvoices()', () => {
      test('should fetch invoices with pagination response', async () => {
        const mockInvoices = [
          {
            id: 1,
            invoiceNumber: 'INV-001',
            customerId: 1,
            customerDetails: { id: 1, name: 'Acme Corp' },
            invoiceDate: '2026-01-01',
            total: 1000,
            status: 'draft',
          },
          {
            id: 2,
            invoiceNumber: 'INV-002',
            customerId: 2,
            customerDetails: { id: 2, name: 'XYZ Ltd' },
            invoiceDate: '2026-01-02',
            total: 2000,
            status: 'issued',
          },
        ];

        apiClient.get.mockResolvedValueOnce({
          invoices: mockInvoices,
          pagination: {
            page: 1,
            totalPages: 2,
            total: 15,
            pageSize: 10,
          },
        });

        const result = await invoiceService.getInvoices({ page: 1, limit: 10 });

        expect(result.invoices).toHaveLength(2);
        expect(result.pagination).toEqual({
          page: 1,
          totalPages: 2,
          total: 15,
          pageSize: 10,
        });
        // Signal is only added to config if truthy, so expect only params when signal=null
        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          params: { page: 1, limit: 10 },
        });
      });

      test('should handle non-paginated response for backward compatibility', async () => {
        const mockInvoices = [
          {
            id: 1,
            invoiceNumber: 'INV-001',
            total: 1000,
          },
        ];

        apiClient.get.mockResolvedValueOnce(mockInvoices);

        const result = await invoiceService.getInvoices();

        expect(result.invoices).toHaveLength(1);
        expect(result.pagination).toBeNull();
      });

      test('should apply pagination parameters', async () => {
        apiClient.get.mockResolvedValueOnce({
          invoices: [],
          pagination: null,
        });

        await invoiceService.getInvoices({ page: 2, limit: 20, status: 'issued' });

        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          params: { page: 2, limit: 20, status: 'issued' },
        });
      });

      test('should support abort signal for cancellation', async () => {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        apiClient.get.mockResolvedValueOnce({
          invoices: [],
          pagination: null,
        });

        await invoiceService.getInvoices({ page: 1 }, abortSignal);

        // Signal is included in config when provided (non-null)
        const callArgs = apiClient.get.mock.calls[0];
        expect(callArgs[0]).toBe('/invoices');
        expect(callArgs[1].params).toEqual({ page: 1 });
        expect(callArgs[1].signal).toBe(abortSignal);
      });

      test('should transform invoice fields from server', async () => {
        const serverInvoice = {
          id: 1,
          invoiceNumber: 'INV-001',
          customerDetails: '{"id":1,"name":"Acme"}',
          invoiceDate: '2026-01-01',
          vatAmount: '100.00',
          total: '1100.00',
        };

        apiClient.get.mockResolvedValueOnce({
          invoices: [serverInvoice],
          pagination: null,
        });

        const result = await invoiceService.getInvoices();

        expect(result.invoices[0].customer).toEqual({ id: 1, name: 'Acme' });
        expect(typeof result.invoices[0].vatAmount).toBe('number');
        expect(result.invoices[0].vatAmount).toBe(100);
      });
    });

    describe('getInvoice()', () => {
      test('should fetch single invoice by ID', async () => {
        const mockInvoice = {
          id: 1,
          invoiceNumber: 'INV-001',
          customerId: 1,
          customerDetails: { id: 1, name: 'Acme Corp' },
          total: 1000,
          status: 'draft',
        };

        apiClient.get.mockResolvedValueOnce(mockInvoice);

        const result = await invoiceService.getInvoice(1);

        expect(result.id).toBe(1);
        expect(result.invoiceNumber).toBe('INV-001');
        expect(apiClient.get).toHaveBeenCalledWith('/invoices/1');
      });

      test('should transform fetched invoice', async () => {
        apiClient.get.mockResolvedValueOnce({
          id: 1,
          invoiceNumber: 'INV-001',
          customerDetails: '{"id":1,"name":"Test"}',
          vatAmount: '50.00',
        });

        const result = await invoiceService.getInvoice(1);

        expect(result.customer).toEqual({ id: 1, name: 'Test' });
        expect(typeof result.vatAmount).toBe('number');
      });

      test('should handle 404 error for non-existent invoice', async () => {
        apiClient.get.mockRejectedValueOnce(
          new Error('Invoice not found')
        );

        await expect(invoiceService.getInvoice(999)).rejects.toThrow(
          'Invoice not found'
        );
      });
    });

    describe('createInvoice()', () => {
      test('should create invoice with proper transformation', async () => {
        const invoiceData = {
          invoiceNumber: 'INV-NEW',
          customer: { id: 1, name: 'Acme Corp' },
          date: '2026-01-15',
          dueDate: '2026-02-15',
          items: [
            {
              productId: 10,
              name: 'Steel Coil',
              quantity: 5,
              rate: 100,
              vatRate: 5,
              amount: 525,
              sourceType: 'WAREHOUSE',
              warehouseId: 1,
            },
          ],
          subtotal: 500,
          vatAmount: 25,
          total: 525,
          status: 'draft',
          discountType: 'amount',
          discountAmount: 0,
          packingCharges: 0,
        };

        const serverInvoice = {
          id: 1,
          ...invoiceData,
          status: 'draft',
        };

        apiClient.post.mockResolvedValueOnce(serverInvoice);

        const result = await invoiceService.createInvoice(invoiceData);

        expect(result.id).toBe(1);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/invoices',
          expect.objectContaining({
            invoice_number: 'INV-NEW',
            customer_id: 1,
            invoice_date: '2026-01-15',
            subtotal: 500,
            total: 525,
          })
        );
      });

      test('should transform items to snake_case and normalize UOM', async () => {
        const invoiceData = {
          invoiceNumber: 'INV-TEST',
          items: [
            {
              productId: 10,
              name: 'Product',
              quantity: 1,
              rate: 100,
              vatRate: 5,
              amount: 105,
              unit: 'MT',  // Should be normalized by normalizeUom
              sourceType: 'WAREHOUSE',
              warehouseId: 1,
              allocationMode: 'AUTO_FIFO',
              manualAllocations: [],
              pricingBasis: 'PER_MT',
              unitWeightKg: 1000,
            },
          ],
          customer: { id: 1 },
          subtotal: 100,
          total: 105,
        };

        apiClient.post.mockResolvedValueOnce({ id: 1, ...invoiceData });

        await invoiceService.createInvoice(invoiceData);

        const callArgs = apiClient.post.mock.calls[0][1];
        // Verify snake_case transformation
        expect(callArgs.items[0]).toEqual(
          expect.objectContaining({
            product_id: 10,
            source_type: 'WAREHOUSE',
            warehouse_id: 1,
            allocation_mode: 'AUTO_FIFO',
            pricing_basis: 'PER_MT',
            unit_weight_kg: 1000,
            vat_rate: 5,  // camelCase to snake_case
          })
        );
        // Verify normalizeUom was called
        expect(normalizeUom).toHaveBeenCalled();
        // Verify quantity_uom is set (normalized unit)
        expect(callArgs.items[0].quantity_uom).toBe('MT');
      });

      test('should transform discounts and charges fields', async () => {
        const invoiceData = {
          invoiceNumber: 'INV-CHARGES',
          customer: { id: 1 },
          items: [],
          subtotal: 1000,
          discountType: 'percentage',
          discountPercentage: 10,
          discountAmount: 100,
          packingCharges: 50,
          freightCharges: 75,
          insuranceCharges: 25,
          loadingCharges: 30,
          otherCharges: 20,
          vatAmount: 0,
          total: 1080,
        };

        apiClient.post.mockResolvedValueOnce({ id: 1, ...invoiceData });

        await invoiceService.createInvoice(invoiceData);

        const callArgs = apiClient.post.mock.calls[0][1];
        // Verify all charges/discounts transformed to snake_case
        expect(callArgs).toEqual(
          expect.objectContaining({
            discount_type: 'percentage',
            discount_percentage: 10,
            discount_amount: 100,
            packing_charges: 50,
            freight_charges: 75,
            insurance_charges: 25,
            loading_charges: 30,
            other_charges: 20,
          })
        );
      });

      test('should handle empty items array', async () => {
        const invoiceData = {
          invoiceNumber: 'INV-EMPTY',
          customer: { id: 1 },
          items: [],
          subtotal: 0,
          total: 0,
        };

        apiClient.post.mockResolvedValueOnce({ id: 1, ...invoiceData });

        const result = await invoiceService.createInvoice(invoiceData);

        expect(result.items).toEqual([]);
      });

      test('should handle null customer gracefully', async () => {
        const invoiceData = {
          invoiceNumber: 'INV-NOCUST',
          customer: null,
          items: [],
          subtotal: 0,
          total: 0,
        };

        apiClient.post.mockResolvedValueOnce({ id: 1, ...invoiceData });

        await invoiceService.createInvoice(invoiceData);

        const callArgs = apiClient.post.mock.calls[0][1];
        expect(callArgs.customer_id).toBeNull();
      });
    });

    describe('updateInvoice()', () => {
      test('should update invoice with transformed data', async () => {
        const invoiceData = {
          invoiceNumber: 'INV-001',
          customer: { id: 1, name: 'Acme' },
          total: 1000,
          items: [],
        };

        const updatedInvoice = {
          id: 1,
          ...invoiceData,
        };

        apiClient.put.mockResolvedValueOnce(updatedInvoice);

        const result = await invoiceService.updateInvoice(1, invoiceData);

        expect(result.id).toBe(1);
        expect(apiClient.put).toHaveBeenCalledWith(
          '/invoices/1',
          expect.objectContaining({
            invoice_number: 'INV-001',
            customer_id: 1,
          })
        );
      });

      test('should throw error when updating with invalid ID', async () => {
        apiClient.put.mockRejectedValueOnce(
          new Error('Invoice not found')
        );

        await expect(
          invoiceService.updateInvoice(999, {})
        ).rejects.toThrow('Invoice not found');
      });
    });

    describe('deleteInvoice()', () => {
      test('should soft delete invoice with reason', async () => {
        apiClient.delete.mockResolvedValueOnce({
          success: true,
          message: 'Invoice deleted',
        });

        const result = await invoiceService.deleteInvoice(1, {
          reason: 'Duplicate entry',
        });

        expect(result.success).toBe(true);
        expect(apiClient.delete).toHaveBeenCalledWith('/invoices/1', {
          data: { reason: 'Duplicate entry' },
        });
      });

      test('should handle delete without reason', async () => {
        apiClient.delete.mockResolvedValueOnce({ success: true });

        await invoiceService.deleteInvoice(1);

        expect(apiClient.delete).toHaveBeenCalledWith('/invoices/1', {
          data: {},
        });
      });
    });

    describe('restoreInvoice()', () => {
      test('should restore soft-deleted invoice', async () => {
        const restoredInvoice = {
          id: 1,
          invoiceNumber: 'INV-001',
          deleted: false,
        };

        apiClient.patch.mockResolvedValueOnce(restoredInvoice);

        const result = await invoiceService.restoreInvoice(1);

        expect(result.deleted).toBe(false);
        expect(apiClient.patch).toHaveBeenCalledWith(
          '/invoices/1/restore',
          {}
        );
      });
    });
  });

  // ============================================================================
  // STATUS OPERATIONS
  // ============================================================================

  describe('Status Operations', () => {
    describe('updateInvoiceStatus()', () => {
      test('should update invoice status', async () => {
        apiClient.patch.mockResolvedValueOnce({
          id: 1,
          status: 'issued',
        });

        const result = await invoiceService.updateInvoiceStatus(1, 'issued');

        expect(result.status).toBe('issued');
        expect(apiClient.patch).toHaveBeenCalledWith(
          '/invoices/1/status',
          { status: 'issued' }
        );
      });

      test('should handle invalid status transition', async () => {
        apiClient.patch.mockRejectedValueOnce(
          new Error('Invalid status transition')
        );

        await expect(
          invoiceService.updateInvoiceStatus(1, 'draft')
        ).rejects.toThrow('Invalid status transition');
      });
    });

    describe('issueInvoice()', () => {
      test('should issue invoice and make it a legal document', async () => {
        const issuedInvoice = {
          id: 1,
          invoiceNumber: 'INV-001',
          status: 'issued',
          isLocked: true,
        };

        apiClient.post.mockResolvedValueOnce(issuedInvoice);

        const result = await invoiceService.issueInvoice(1);

        expect(result.isLocked).toBe(true);
        expect(result.status).toBe('issued');
        expect(apiClient.post).toHaveBeenCalledWith('/invoices/1/issue');
      });

      test('should handle issuing already-issued invoice', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Invoice already issued')
        );

        await expect(invoiceService.issueInvoice(1)).rejects.toThrow(
          'Invoice already issued'
        );
      });
    });
  });

  // ============================================================================
  // BATCH ALLOCATION OPERATIONS
  // ============================================================================

  describe('Batch Allocation Operations', () => {
    describe('confirmInvoiceAllocation()', () => {
      test('should confirm batch allocation for invoice', async () => {
        apiClient.post.mockResolvedValueOnce({
          success: true,
          message: 'Allocation confirmed',
          allocations: [
            {
              lineItemId: 1,
              batchId: 10,
              quantity: 5,
            },
          ],
        });

        const result = await invoiceService.confirmInvoiceAllocation(1);

        expect(result.success).toBe(true);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/invoices/1/confirm-allocation'
        );
      });

      test('should handle already-confirmed allocation', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Allocation already confirmed')
        );

        await expect(
          invoiceService.confirmInvoiceAllocation(1)
        ).rejects.toThrow('Allocation already confirmed');
      });
    });

    describe('releaseInvoiceReservation()', () => {
      test('should release batch reservation', async () => {
        apiClient.post.mockResolvedValueOnce({
          success: true,
          message: 'Reservation released',
        });

        const result = await invoiceService.releaseInvoiceReservation(1);

        expect(result.success).toBe(true);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/invoices/1/release-reservation'
        );
      });

      test('should prevent release of confirmed allocation', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Cannot release confirmed allocation')
        );

        await expect(
          invoiceService.releaseInvoiceReservation(1)
        ).rejects.toThrow('Cannot release confirmed allocation');
      });
    });
  });

  // ============================================================================
  // SEARCH & FILTERING OPERATIONS
  // ============================================================================

  describe('Search & Filtering Operations', () => {
    describe('searchInvoices()', () => {
      test('should search invoices by term', async () => {
        const mockResult = {
          invoices: [{ id: 1, invoiceNumber: 'INV-001' }],
          pagination: null,
        };
        apiClient.get.mockResolvedValueOnce(mockResult);

        const result = await invoiceService.searchInvoices('INV-001');

        // Assert API call
        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          search: 'INV-001',
        });
        // Assert return value (not just silently pass)
        expect(result).toHaveProperty('invoices');
        expect(result.invoices).toHaveLength(1);
        expect(result.invoices[0].id).toBe(1);
      });

      test('should apply filters alongside search', async () => {
        const mockResult = {
          invoices: [{ id: 2, invoiceNumber: 'INV-002', status: 'issued' }],
          pagination: null,
        };
        apiClient.get.mockResolvedValueOnce(mockResult);

        const result = await invoiceService.searchInvoices('Acme', { status: 'issued' });

        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          search: 'Acme',
          status: 'issued',
        });
        expect(result.invoices).toHaveLength(1);
        expect(result.invoices[0].status).toBe('issued');
      });

      test('should handle empty search results', async () => {
        apiClient.get.mockResolvedValueOnce({
          invoices: [],
          pagination: null,
        });

        const result = await invoiceService.searchInvoices('NONEXISTENT');

        expect(result).toHaveProperty('invoices');
        expect(result.invoices).toHaveLength(0);
      });
    });

    describe('searchForCreditNote()', () => {
      test('should search invoices eligible for credit notes', async () => {
        apiClient.get.mockResolvedValueOnce([
          { id: 1, invoiceNumber: 'INV-001', status: 'issued' },
        ]);

        const result = await invoiceService.searchForCreditNote('INV-001');

        expect(apiClient.get).toHaveBeenCalledWith(
          '/invoices/search-for-credit-note',
          { q: 'INV-001' }
        );
        expect(result[0].status).toBe('issued');
      });
    });

    describe('getInvoicesByCustomer()', () => {
      test('should get all invoices for a customer', async () => {
        const mockResult = {
          invoices: [
            { id: 1, customerId: 5, invoiceNumber: 'INV-001' },
            { id: 2, customerId: 5, invoiceNumber: 'INV-002' },
          ],
          pagination: null,
        };
        apiClient.get.mockResolvedValueOnce(mockResult);

        const result = await invoiceService.getInvoicesByCustomer(5);

        // Verify API was called with snake_case customer_id (backend field)
        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          customer_id: 5,
        });
        // Verify return value structure
        expect(result).toHaveProperty('invoices');
        expect(result.invoices).toHaveLength(2);
        expect(result.invoices[0].customerId).toBe(5);
        expect(result.invoices[1].customerId).toBe(5);
      });

      test('should handle customer with no invoices', async () => {
        apiClient.get.mockResolvedValueOnce({
          invoices: [],
          pagination: null,
        });

        const result = await invoiceService.getInvoicesByCustomer(999);

        expect(result.invoices).toHaveLength(0);
        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          customer_id: 999,
        });
      });
    });

    describe('getInvoicesByDateRange()', () => {
      test('should filter invoices by date range', async () => {
        const mockResult = {
          invoices: [
            { id: 1, invoiceNumber: 'INV-001', date: '2026-01-15' },
            { id: 2, invoiceNumber: 'INV-002', date: '2026-01-20' },
          ],
          pagination: null,
        };
        apiClient.get.mockResolvedValueOnce(mockResult);

        const result = await invoiceService.getInvoicesByDateRange(
          '2026-01-01',
          '2026-01-31'
        );

        // Verify API called with snake_case date parameters
        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          start_date: '2026-01-01',
          end_date: '2026-01-31',
        });
        // Verify return value
        expect(result).toHaveProperty('invoices');
        expect(result.invoices).toHaveLength(2);
      });

      test('should handle date range with no invoices', async () => {
        apiClient.get.mockResolvedValueOnce({
          invoices: [],
          pagination: null,
        });

        const result = await invoiceService.getInvoicesByDateRange(
          '2025-01-01',
          '2025-01-31'
        );

        expect(result.invoices).toHaveLength(0);
      });
    });

    describe('getInvoicesByStatus()', () => {
      test('should filter invoices by status', async () => {
        const mockResult = {
          invoices: [
            { id: 1, invoiceNumber: 'INV-001', status: 'issued' },
            { id: 2, invoiceNumber: 'INV-002', status: 'issued' },
          ],
          pagination: null,
        };
        apiClient.get.mockResolvedValueOnce(mockResult);

        const result = await invoiceService.getInvoicesByStatus('issued');

        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          status: 'issued',
        });
        expect(result).toHaveProperty('invoices');
        expect(result.invoices).toHaveLength(2);
        expect(result.invoices.every(inv => inv.status === 'issued')).toBe(true);
      });

      test('should filter invoices by draft status', async () => {
        apiClient.get.mockResolvedValueOnce({
          invoices: [
            { id: 3, invoiceNumber: 'INV-003', status: 'draft' },
          ],
          pagination: null,
        });

        const result = await invoiceService.getInvoicesByStatus('draft');

        expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
          status: 'draft',
        });
        expect(result.invoices[0].status).toBe('draft');
      });

      test('should handle status with no matching invoices', async () => {
        apiClient.get.mockResolvedValueOnce({
          invoices: [],
          pagination: null,
        });

        const result = await invoiceService.getInvoicesByStatus('cancelled');

        expect(result.invoices).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  describe('Analytics & Reporting', () => {
    describe('getNextInvoiceNumber()', () => {
      test('should generate next invoice number', async () => {
        apiClient.get.mockResolvedValueOnce({
          billNumber: 'INV-202601-0001',
        });

        const result = await invoiceService.getNextInvoiceNumber();

        expect(result.billNumber).toMatch(/^INV-\d{6}-\d{4}$/);
        expect(apiClient.get).toHaveBeenCalledWith(
          '/invoices/number/next'
        );
      });
    });

    describe('getInvoiceAnalytics()', () => {
      test('should fetch invoice analytics with date range parameters', async () => {
        const mockAnalytics = {
          totalInvoices: 50,
          totalAmount: 50000,
          avgAmount: 1000,
          outstanding: 12500,
          receivedAmount: 37500,
        };
        apiClient.get.mockResolvedValueOnce(mockAnalytics);

        // Service receives camelCase and passes through as-is (API Gateway converts)
        const result = await invoiceService.getInvoiceAnalytics({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        });

        // Verify API call - params are passed as-is
        expect(apiClient.get).toHaveBeenCalledWith(
          '/invoices/analytics',
          { startDate: '2026-01-01', endDate: '2026-01-31' }
        );
        // Verify return value
        expect(result).toHaveProperty('totalInvoices');
        expect(result.totalInvoices).toBe(50);
        expect(result.outstanding).toBe(12500);
      });

      test('should handle analytics with no parameters', async () => {
        const mockAnalytics = {
          totalInvoices: 100,
          totalAmount: 100000,
          outstanding: 25000,
        };
        apiClient.get.mockResolvedValueOnce(mockAnalytics);

        const result = await invoiceService.getInvoiceAnalytics();

        expect(apiClient.get).toHaveBeenCalledWith(
          '/invoices/analytics',
          {}
        );
        expect(result).toHaveProperty('totalInvoices');
        expect(result.totalInvoices).toBe(100);
      });

      test('should handle analytics with status filter', async () => {
        apiClient.get.mockResolvedValueOnce({
          totalInvoices: 25,
          totalAmount: 25000,
          outstanding: 5000,
        });

        const result = await invoiceService.getInvoiceAnalytics({
          status: 'issued',
        });

        expect(apiClient.get).toHaveBeenCalledWith(
          '/invoices/analytics',
          { status: 'issued' }
        );
        expect(result.totalInvoices).toBe(25);
      });
    });
  });

  // ============================================================================
  // PAYMENT OPERATIONS
  // ============================================================================

  describe('Payment Operations', () => {
    describe('addInvoicePayment()', () => {
      test('should add single payment to invoice', async () => {
        const paymentData = {
          payment_date: '2026-01-20',
          amount: 500,
          method: 'bank_transfer',
          reference_no: 'REF-12345',
          notes: 'First installment',
        };

        apiClient.post.mockResolvedValueOnce({
          id: 1,
          paymentId: 10,
          ...paymentData,
        });

        const result = await invoiceService.addInvoicePayment(1, paymentData);

        expect(result.paymentId).toBe(10);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/invoices/1/payments',
          paymentData
        );
      });

      test('should handle payment rejection', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Payment exceeds outstanding balance')
        );

        await expect(
          invoiceService.addInvoicePayment(1, { amount: 99999 })
        ).rejects.toThrow('Payment exceeds outstanding balance');
      });
    });

    describe('addInvoicePaymentsBatch()', () => {
      test('should add multiple payments in batch', async () => {
        const batchData = {
          payments: [
            { payment_date: '2026-01-10', amount: 250, method: 'check' },
            { payment_date: '2026-01-20', amount: 250, method: 'bank_transfer' },
          ],
        };

        apiClient.post.mockResolvedValueOnce({
          success: true,
          paymentsAdded: 2,
          totalAmount: 500,
        });

        const result = await invoiceService.addInvoicePaymentsBatch(
          1,
          batchData
        );

        expect(result.paymentsAdded).toBe(2);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/invoices/1/payments/batch',
          batchData
        );
      });

      test('should support idempotency key for batch payments', async () => {
        const batchData = {
          payments: [{ amount: 100 }],
          idempotency_key: 'unique-key-123',
        };

        apiClient.post.mockResolvedValueOnce({ success: true });

        await invoiceService.addInvoicePaymentsBatch(1, batchData);

        expect(apiClient.post).toHaveBeenCalledWith(
          '/invoices/1/payments/batch',
          expect.objectContaining({
            idempotency_key: 'unique-key-123',
          })
        );
      });
    });

    describe('voidInvoicePayment()', () => {
      test('should void a specific payment', async () => {
        apiClient.post.mockResolvedValueOnce({
          success: true,
          paymentVoided: true,
        });

        const result = await invoiceService.voidInvoicePayment(
          1,
          10,
          'Duplicate payment'
        );

        expect(result.paymentVoided).toBe(true);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/invoices/1/payments/10/void',
          { reason: 'Duplicate payment' }
        );
      });

      test('should handle voiding already-voided payment', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Payment already voided')
        );

        await expect(
          invoiceService.voidInvoicePayment(1, 10, 'Error')
        ).rejects.toThrow('Payment already voided');
      });
    });
  });

  // ============================================================================
  // STOCK MOVEMENT INTEGRATION
  // ============================================================================

  describe('Stock Movement Integration', () => {
    describe('getInvoiceStockMovements()', () => {
      test('should retrieve stock movements linked to invoice', async () => {
        apiClient.get.mockResolvedValueOnce({
          data: [
            {
              id: 1,
              referenceType: 'INVOICE',
              referenceId: 1,
              type: 'OUT',
              quantity: 5,
            },
            {
              id: 2,
              referenceType: 'INVOICE',
              referenceId: 1,
              type: 'IN',
              quantity: 2,
            },
          ],
        });

        const result = await invoiceService.getInvoiceStockMovements(1);

        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('OUT');
        expect(apiClient.get).toHaveBeenCalledWith(
          '/stock-movements/by-reference/INVOICE/1'
        );
      });

      test('should handle empty stock movements', async () => {
        apiClient.get.mockResolvedValueOnce({ data: [] });

        const result = await invoiceService.getInvoiceStockMovements(1);

        expect(result).toHaveLength(0);
      });

      test('should handle non-standard response format', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        const result = await invoiceService.getInvoiceStockMovements(1);

        expect(result).toEqual([]);
      });
    });

    describe('createStockMovements()', () => {
      test('should create stock movements from invoice', async () => {
        apiClient.post.mockResolvedValueOnce({
          success: true,
          movementsCreated: 3,
        });

        const result = await invoiceService.createStockMovements(1);

        expect(result.movementsCreated).toBe(3);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/stock-movements/from-invoice',
          { invoice_id: 1 }
        );
      });

      test('should specify warehouse when creating movements', async () => {
        apiClient.post.mockResolvedValueOnce({ success: true });

        await invoiceService.createStockMovements(1, 5);

        expect(apiClient.post).toHaveBeenCalledWith(
          '/stock-movements/from-invoice',
          { invoice_id: 1, warehouse_id: 5 }
        );
      });

      test('should handle error when creating movements', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Insufficient stock')
        );

        await expect(
          invoiceService.createStockMovements(1)
        ).rejects.toThrow('Insufficient stock');
      });
    });

    describe('reverseStockMovements()', () => {
      test('should reverse stock movements for invoice', async () => {
        apiClient.post.mockResolvedValueOnce({
          success: true,
          reversalsCreated: 3,
        });

        const result = await invoiceService.reverseStockMovements(
          1,
          'Invoice cancelled'
        );

        expect(result.reversalsCreated).toBe(3);
        expect(apiClient.post).toHaveBeenCalledWith(
          '/stock-movements/reverse-invoice',
          { invoice_id: 1, reason: 'Invoice cancelled' }
        );
      });

      test('should link reversal to credit note when applicable', async () => {
        apiClient.post.mockResolvedValueOnce({ success: true });

        await invoiceService.reverseStockMovements(
          1,
          'Credit note issued',
          20
        );

        expect(apiClient.post).toHaveBeenCalledWith(
          '/stock-movements/reverse-invoice',
          {
            invoice_id: 1,
            reason: 'Credit note issued',
            credit_note_id: 20,
          }
        );
      });

      test('should use default reason if not provided', async () => {
        apiClient.post.mockResolvedValueOnce({ success: true });

        await invoiceService.reverseStockMovements(1);

        expect(apiClient.post).toHaveBeenCalledWith(
          '/stock-movements/reverse-invoice',
          expect.objectContaining({
            reason: 'Invoice cancelled',
          })
        );
      });
    });

    describe('hasStockMovements()', () => {
      test('should return true when stock movements exist', async () => {
        apiClient.get.mockResolvedValueOnce({
          data: [{ id: 1 }],
        });

        const result = await invoiceService.hasStockMovements(1);

        expect(result).toBe(true);
      });

      test('should return false when no stock movements exist', async () => {
        apiClient.get.mockResolvedValueOnce({ data: [] });

        const result = await invoiceService.hasStockMovements(1);

        expect(result).toBe(false);
      });
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION FUNCTIONS
  // ============================================================================

  describe('Data Transformation Functions', () => {
    describe('transformInvoiceForServer()', () => {
      test('should transform invoice data to server format', async () => {
        // This test uses the transformation directly through createInvoice
        const invoiceData = {
          invoiceNumber: 'INV-001',
          customer: { id: 1, name: 'Acme' },
          date: '2026-01-15',
          dueDate: '2026-02-15',
          items: [
            {
              productId: 10,
              name: 'Product',
              quantity: 5,
              rate: 100,
              amount: 500,
            },
          ],
          subtotal: 500,
          vatAmount: 25,
          total: 525,
          discountType: 'amount',
          discountAmount: 0,
          packingCharges: 10,
          freightCharges: 5,
        };

        apiClient.post.mockResolvedValueOnce({ id: 1 });

        await invoiceService.createInvoice(invoiceData);

        const callArgs = apiClient.post.mock.calls[0][1];

        // Verify snake_case conversion
        expect(callArgs).toHaveProperty('invoice_number', 'INV-001');
        expect(callArgs).toHaveProperty('customer_id', 1);
        expect(callArgs).toHaveProperty('invoice_date', '2026-01-15');
        expect(callArgs).toHaveProperty('due_date', '2026-02-15');
        expect(callArgs).toHaveProperty('packing_charges', 10);
        expect(callArgs).toHaveProperty('freight_charges', 5);
      });
    });

    describe('transformInvoiceFromServer()', () => {
      test('should handle camelCase/snake_case field conversion', async () => {
        const serverData = {
          id: 1,
          invoiceNumber: 'INV-001',
          customerDetails: { id: 1, name: 'Acme' },
          invoiceDate: '2026-01-15',
          customer_details: null,
          invoice_date: null,
          vatAmount: '100.00',
          vat_amount: null,
        };

        apiClient.get.mockResolvedValueOnce(serverData);

        const result = await invoiceService.getInvoice(1);

        // Should prefer camelCase but fall back to snake_case
        expect(result.date).toBe('2026-01-15');
        expect(result.vatAmount).toBe(100);
      });

      test('should parse customer JSON when provided as string', async () => {
        const serverData = {
          id: 1,
          customerDetails: '{"id":1,"name":"Acme","email":"acme@test.com"}',
        };

        apiClient.get.mockResolvedValueOnce(serverData);

        const result = await invoiceService.getInvoice(1);

        expect(result.customer).toEqual({
          id: 1,
          name: 'Acme',
          email: 'acme@test.com',
        });
      });

      test('should convert string numbers to actual numbers', async () => {
        const serverData = {
          id: 1,
          subtotal: '100.50',
          vatAmount: '5.25',
          total: '105.75',
          received: '50.00',
          outstanding: '55.75',
        };

        apiClient.get.mockResolvedValueOnce(serverData);

        const result = await invoiceService.getInvoice(1);

        expect(typeof result.subtotal).toBe('number');
        expect(result.subtotal).toBe(100.5);
        expect(typeof result.vatAmount).toBe('number');
        expect(result.received).toBe(50);
        expect(result.outstanding).toBe(55.75);
      });

      test('should handle missing VAT fields', async () => {
        const serverData = {
          id: 1,
          isReverseCharge: undefined,
          reverseChargeAmount: undefined,
        };

        apiClient.get.mockResolvedValueOnce(serverData);

        const result = await invoiceService.getInvoice(1);

        expect(result.isReverseCharge).toBe(false);
        expect(result.reverseChargeAmount).toBe(0);
      });

      test('should handle items array properly', async () => {
        const serverData = {
          id: 1,
          items: [
            { id: 1, name: 'Item1' },
            { id: 2, name: 'Item2' },
          ],
        };

        apiClient.get.mockResolvedValueOnce(serverData);

        const result = await invoiceService.getInvoice(1);

        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items).toHaveLength(2);
      });

      test('should handle non-array items gracefully', async () => {
        const serverData = {
          id: 1,
          items: null,
        };

        apiClient.get.mockResolvedValueOnce(serverData);

        const result = await invoiceService.getInvoice(1);

        expect(result.items).toEqual([]);
      });
    });
  });

  // ============================================================================
  // ERROR SCENARIOS & EDGE CASES
  // ============================================================================

  describe('Error Scenarios & Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      apiClient.get.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(
        invoiceService.getInvoices()
      ).rejects.toThrow('Network timeout');
    });

    test('should handle API errors with proper messages', async () => {
      apiClient.post.mockRejectedValueOnce({
        message: 'Invalid invoice data',
        errorCode: 'INVALID_ARGUMENT',
      });

      await expect(
        invoiceService.createInvoice({})
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Invalid invoice data',
        })
      );
    });

    test('should handle missing required fields', async () => {
      const incompleteData = {
        invoiceNumber: 'INV-001',
        // Missing customer, items, totals
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      // Should not throw, but API will handle validation
      await invoiceService.createInvoice(incompleteData);

      expect(apiClient.post).toHaveBeenCalled();
    });

    test('should handle very large invoice amounts', async () => {
      const largeInvoice = {
        invoiceNumber: 'INV-LARGE',
        customer: { id: 1 },
        items: [
          {
            productId: 1,
            quantity: 1000000,
            rate: 999999.99,
          },
        ],
        subtotal: 999999990000,
        total: 1049999989000,
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await invoiceService.createInvoice(largeInvoice);

      expect(apiClient.post).toHaveBeenCalled();
    });

    test('should handle special characters in invoice number', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-2026-01-15/001',
        customer: { id: 1 },
        items: [],
        subtotal: 0,
        total: 0,
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await invoiceService.createInvoice(invoiceData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.invoice_number).toBe('INV-2026-01-15/001');
    });
  });
});
