/**
 * Quotation Service Unit Tests
 * ✅ Comprehensive test coverage for quotationService
 * ✅ Tests CRUD operations, status management, and transformations
 * ✅ Covers quotation creation, conversion to invoice, PDF download
 * ✅ 100% coverage target for quotationService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock API client and document/window APIs
vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../axiosApi', () => ({
  apiService: {
    request: vi.fn(),
  },
}));

// Mock window/document APIs for PDF download
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
global.document.createElement = vi.fn(() => ({
  click: vi.fn(),
  style: { display: '' },
  href: '',
  download: '',
}));
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

// Import after mocks
import { quotationService, transformQuotationFromServer } from '../quotationService';
import { apiClient } from '../api';
import { apiService } from '../axiosApi';

describe('quotationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe('CRUD Operations', () => {
    describe('getAll()', () => {
      test('should fetch all quotations with pagination', async () => {
        const mockQuotations = [
          {
            id: 1,
            quotationNumber: 'QT-001',
            customerId: 1,
            status: 'draft',
            total: 5000,
          },
          {
            id: 2,
            quotationNumber: 'QT-002',
            customerId: 2,
            status: 'sent',
            total: 7500,
          },
        ];

        apiClient.get.mockResolvedValueOnce(mockQuotations);

        const result = await quotationService.getAll({
          page: 1,
          limit: 20,
        });

        expect(apiClient.get).toHaveBeenCalledWith('/quotations', {
          page: 1,
          limit: 20,
        });
        expect(result).toHaveLength(2);
      });

      test('should fetch quotations with status filter', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        await quotationService.getAll({ status: 'sent' });

        expect(apiClient.get).toHaveBeenCalledWith('/quotations', {
          status: 'sent',
        });
      });

      test('should handle empty quotations list', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        const result = await quotationService.getAll();

        expect(result).toEqual([]);
      });
    });

    describe('getById()', () => {
      test('should fetch single quotation by ID', async () => {
        const mockQuotation = {
          id: 1,
          quotationNumber: 'QT-001',
          customerId: 1,
          customerDetails: { id: 1, name: 'Acme Corp' },
          items: [
            {
              id: 1,
              productId: 10,
              quantity: 5,
              rate: 100,
              amount: 500,
            },
          ],
          subtotal: 500,
          total: 525,
          status: 'draft',
        };

        apiClient.get.mockResolvedValueOnce(mockQuotation);

        const result = await quotationService.getById(1);

        expect(apiClient.get).toHaveBeenCalledWith('/quotations/1');
        expect(result.id).toBe(1);
        expect(result.quotationNumber).toBe('QT-001');
      });

      test('should handle non-existent quotation', async () => {
        apiClient.get.mockRejectedValueOnce(
          new Error('Not found')
        );

        await expect(
          quotationService.getById(999)
        ).rejects.toThrow('Not found');
      });
    });

    describe('create()', () => {
      test('should create new quotation', async () => {
        const newQuotation = {
          quotationNumber: 'QT-NEW',
          customerId: 1,
          items: [
            {
              productId: 10,
              quantity: 10,
              rate: 100,
              amount: 1000,
            },
          ],
          subtotal: 1000,
          total: 1050,
          status: 'draft',
        };

        const created = {
          id: 99,
          ...newQuotation,
        };

        apiClient.post.mockResolvedValueOnce(created);

        const result = await quotationService.create(newQuotation);

        expect(apiClient.post).toHaveBeenCalledWith(
          '/quotations',
          newQuotation
        );
        expect(result.id).toBe(99);
        expect(result.status).toBe('draft');
      });

      test('should handle quotation with multiple items', async () => {
        const data = {
          quotationNumber: 'QT-MULTI',
          customerId: 2,
          items: [
            { productId: 1, quantity: 5, rate: 100, amount: 500 },
            { productId: 2, quantity: 3, rate: 200, amount: 600 },
            { productId: 3, quantity: 2, rate: 300, amount: 600 },
          ],
          subtotal: 1700,
          total: 1800,
        };

        apiClient.post.mockResolvedValueOnce({ id: 1, ...data });

        const result = await quotationService.create(data);

        expect(result.items).toHaveLength(3);
      });

      test('should validate required fields', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Validation error: customerId required')
        );

        await expect(
          quotationService.create({
            quotationNumber: 'QT-BAD',
            items: [],
          })
        ).rejects.toThrow('Validation error');
      });
    });

    describe('update()', () => {
      test('should update existing quotation', async () => {
        const updates = {
          validUntil: '2026-02-28',
          notes: 'Updated notes',
          status: 'sent',
        };

        const updated = {
          id: 1,
          quotationNumber: 'QT-001',
          ...updates,
        };

        apiClient.put.mockResolvedValueOnce(updated);

        const result = await quotationService.update(1, updates);

        expect(apiClient.put).toHaveBeenCalledWith(
          '/quotations/1',
          updates
        );
        expect(result.notes).toBe('Updated notes');
        expect(result.status).toBe('sent');
      });

      test('should update quotation items', async () => {
        const updates = {
          items: [
            { productId: 10, quantity: 8, rate: 120, amount: 960 },
            { productId: 20, quantity: 5, rate: 80, amount: 400 },
          ],
          subtotal: 1360,
          total: 1430,
        };

        apiClient.put.mockResolvedValueOnce({ id: 1, ...updates });

        const result = await quotationService.update(1, updates);

        expect(result.items).toHaveLength(2);
      });
    });

    describe('delete()', () => {
      test('should delete quotation', async () => {
        apiClient.delete.mockResolvedValueOnce({ success: true });

        const result = await quotationService.delete(1);

        expect(apiClient.delete).toHaveBeenCalledWith('/quotations/1');
        expect(result.success).toBe(true);
      });

      test('should handle delete of non-existent quotation', async () => {
        apiClient.delete.mockRejectedValueOnce(
          new Error('Not found')
        );

        await expect(
          quotationService.delete(999)
        ).rejects.toThrow('Not found');
      });
    });
  });

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  describe('Status Management', () => {
    describe('updateStatus()', () => {
      test('should update quotation status to sent', async () => {
        const updated = {
          id: 1,
          quotationNumber: 'QT-001',
          status: 'sent',
          sentAt: '2026-01-15T10:00:00Z',
        };

        apiClient.patch.mockResolvedValueOnce(updated);

        const result = await quotationService.updateStatus(1, 'sent');

        expect(apiClient.patch).toHaveBeenCalledWith(
          '/quotations/1/status',
          { status: 'sent' }
        );
        expect(result.status).toBe('sent');
      });

      test('should update status to accepted', async () => {
        apiClient.patch.mockResolvedValueOnce({
          id: 1,
          status: 'accepted',
          acceptedAt: '2026-01-16T00:00:00Z',
        });

        const result = await quotationService.updateStatus(1, 'accepted');

        expect(result.status).toBe('accepted');
      });

      test('should update status to rejected', async () => {
        apiClient.patch.mockResolvedValueOnce({
          id: 1,
          status: 'rejected',
        });

        const result = await quotationService.updateStatus(1, 'rejected');

        expect(result.status).toBe('rejected');
      });

      test('should update status to expired', async () => {
        apiClient.patch.mockResolvedValueOnce({
          id: 1,
          status: 'expired',
        });

        const result = await quotationService.updateStatus(1, 'expired');

        expect(result.status).toBe('expired');
      });
    });
  });

  // ============================================================================
  // QUOTATION CONVERSION
  // ============================================================================

  describe('Quotation Conversion', () => {
    describe('convertToInvoice()', () => {
      test('should convert quotation to invoice', async () => {
        const converted = {
          quotationId: 1,
          invoiceId: 50,
          status: 'converted',
          invoiceNumber: 'INV-2601-001',
        };

        apiClient.post.mockResolvedValueOnce(converted);

        const result = await quotationService.convertToInvoice(1);

        expect(apiClient.post).toHaveBeenCalledWith(
          '/quotations/1/convert-to-invoice'
        );
        expect(result.status).toBe('converted');
        expect(result.invoiceId).toBe(50);
      });

      test('should not convert already converted quotation', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Quotation already converted')
        );

        await expect(
          quotationService.convertToInvoice(1)
        ).rejects.toThrow('already converted');
      });

      test('should not convert rejected quotation', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Cannot convert rejected quotation')
        );

        await expect(
          quotationService.convertToInvoice(2)
        ).rejects.toThrow('rejected');
      });
    });
  });

  // ============================================================================
  // NUMBER GENERATION
  // ============================================================================

  describe('Number Generation', () => {
    describe('getNextNumber()', () => {
      test('should generate next quotation number', async () => {
        apiClient.get.mockResolvedValueOnce({
          nextNumber: 'QT-202601-0015',
        });

        const result = await quotationService.getNextNumber();

        expect(apiClient.get).toHaveBeenCalledWith(
          '/quotations/number/next'
        );
        expect(result.nextNumber).toMatch(/^QT-\d{6}-\d{4}$/);
      });

      test('should generate sequential numbers', async () => {
        apiClient.get.mockResolvedValueOnce({
          nextNumber: 'QT-202601-0010',
        });
        const first = await quotationService.getNextNumber();

        apiClient.get.mockResolvedValueOnce({
          nextNumber: 'QT-202601-0011',
        });
        const second = await quotationService.getNextNumber();

        expect(first.nextNumber).toBe('QT-202601-0010');
        expect(second.nextNumber).toBe('QT-202601-0011');
      });
    });
  });

  // ============================================================================
  // PDF DOWNLOAD
  // ============================================================================

  describe('PDF Download', () => {
    describe('downloadPDF()', () => {
      test('should download quotation PDF', async () => {
        const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
        apiService.request.mockResolvedValueOnce(mockBlob);

        await quotationService.downloadPDF(1);

        expect(apiService.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/quotations/1/pdf',
          responseType: 'blob',
        });
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      });

      test('should create download link', async () => {
        const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });
        apiService.request.mockResolvedValueOnce(mockBlob);

        await quotationService.downloadPDF(1);

        expect(global.document.createElement).toHaveBeenCalledWith('a');
      });

      test('should trigger download with correct filename', async () => {
        const mockBlob = new Blob(['PDF'], { type: 'application/pdf' });
        const mockLink = { click: vi.fn(), style: { display: '' }, href: '', download: '' };
        vi.mocked(global.document.createElement).mockReturnValueOnce(mockLink);
        apiService.request.mockResolvedValueOnce(mockBlob);

        await quotationService.downloadPDF(42);

        expect(mockLink.download).toMatch(/^Quotation-42\.pdf$/);
        expect(mockLink.click).toHaveBeenCalled();
      });

      test('should handle PDF download errors', async () => {
        apiService.request.mockRejectedValueOnce(
          new Error('Failed to download PDF')
        );

        await expect(
          quotationService.downloadPDF(1)
        ).rejects.toThrow('Failed to download');
      });
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  describe('Data Transformation', () => {
    describe('transformQuotationFromServer()', () => {
      test('should transform quotation with camelCase conversion', () => {
        const serverData = {
          id: 1,
          quotation_number: 'QT-001',
          customer_id: 5,
          customer_details: { id: 5, name: 'Acme Corp' },
          quotation_date: '2026-01-15',
          valid_until: '2026-02-15',
          subtotal: '5000.00',
          vat_amount: '250.00',
          total: '5250.00',
          status: 'draft',
          items: [
            {
              id: 1,
              product_id: 10,
              quantity: '5',
              rate: '1000.00',
              amount: '5000.00',
            },
          ],
        };

        const result = transformQuotationFromServer(serverData);

        expect(result.id).toBe(1);
        expect(result.quotationNumber).toBe('QT-001');
        expect(result.customerId).toBe(5);
        expect(result.quotationDate).toBe('2026-01-15');
        expect(result.validUntil).toBe('2026-02-15');
        expect(result.subtotal).toBe(5000);
        expect(result.total).toBe(5250);
      });

      test('should normalize quotation status', () => {
        const serverData = { id: 1, status: 'STATUS_SENT' };
        const result = transformQuotationFromServer(serverData);
        expect(result.status).toBe('sent');
      });

      test('should handle missing status as draft', () => {
        const serverData = { id: 1, status: undefined };
        const result = transformQuotationFromServer(serverData);
        expect(result.status).toBe('draft');
      });

      test('should calculate total from components if missing', () => {
        const serverData = {
          id: 1,
          subtotal: 1000,
          packing_charges: 50,
          freight_charges: 100,
          insurance_charges: 25,
          loading_charges: 25,
          vat_amount: 200,
          // total is 0/missing - should be calculated
        };

        const result = transformQuotationFromServer(serverData);

        expect(result.total).toBe(1400);
      });

      test('should handle converted to invoice flag', () => {
        const serverData = {
          id: 1,
          converted_to_invoice: true,
          invoice_id: 50,
          status: 'converted',
        };

        const result = transformQuotationFromServer(serverData);

        expect(result.convertedToInvoice).toBe(true);
        expect(result.invoiceId).toBe(50);
      });

      test('should handle null quotation data', () => {
        const result = transformQuotationFromServer(null);
        expect(result).toBeNull();
      });

      test('should transform item array', () => {
        const serverData = {
          id: 1,
          items: [
            { product_id: 1, quantity: '5', rate: '100', amount: '500' },
            { product_id: 2, quantity: '3', rate: '200', amount: '600' },
          ],
        };

        const result = transformQuotationFromServer(serverData);

        expect(result.items).toHaveLength(2);
        expect(result.items[0].productId).toBe(1);
        expect(result.items[0].quantity).toBe(5);
      });

      test('should handle missing items array', () => {
        const result = transformQuotationFromServer({ id: 1 });
        expect(result.items).toEqual([]);
      });
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    test('should handle quotation with special characters', async () => {
      const data = {
        quotationNumber: "QT-'&<>\"",
        customerId: 1,
        notes: 'Special: ™ © ® é',
        items: [],
        total: 0,
      };

      apiClient.post.mockResolvedValueOnce({ id: 1, ...data });

      const result = await quotationService.create(data);

      expect(result.notes).toContain('™');
    });

    test('should handle quotation with very large amounts', async () => {
      const data = {
        quotationNumber: 'QT-LARGE',
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 1000000,
            rate: 1000000,
            amount: 1000000000000,
          },
        ],
        subtotal: 1000000000000,
        total: 1000000000000,
      };

      apiClient.post.mockResolvedValueOnce({ id: 1, ...data });

      const result = await quotationService.create(data);

      expect(result.total).toBe(1000000000000);
    });

    test('should handle quotation with decimal precision', () => {
      const serverData = {
        id: 1,
        subtotal: '1000.99',
        vat_amount: '50.04',
        total: '1050.03',
        items: [
          { quantity: '1.5', rate: '666.66', amount: '1000.00' },
        ],
      };

      const result = transformQuotationFromServer(serverData);

      expect(result.subtotal).toBe(1000.99);
      expect(result.vatAmount).toBe(50.04);
      expect(result.items[0].quantity).toBe(1.5);
    });

    test('should handle network timeout', async () => {
      const error = new Error('Network timeout');
      apiClient.get.mockRejectedValueOnce(error);

      await expect(
        quotationService.getAll()
      ).rejects.toThrow('timeout');
    });

    test('should handle server errors', async () => {
      apiClient.post.mockRejectedValueOnce(
        new Error('Server error: 500')
      );

      await expect(
        quotationService.create({ quotationNumber: 'QT-BAD', customerId: 1 })
      ).rejects.toThrow('Server error');
    });
  });
});
