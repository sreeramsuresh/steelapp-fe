/**
 * E2E Tests for Credit Note Form - Date Format & Auto-Save
 *
 * Test Coverage:
 * 1. Date format handling (ISO timestamp -> yyyy-MM-dd)
 * 2. Manual credit amount auto-save (without items)
 * 3. Draft persistence across reload
 * 4. Save Draft button functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreditNoteForm from '../CreditNoteForm';
import { ThemeProvider } from '../../contexts/ThemeContext';
import * as creditNoteService from '../../services/creditNoteService';
import * as invoiceService from '../../services/invoiceService';
import * as companyService from '../../services/companyService';

// Mock data
const mockCreditNote = {
  id: 107,
  creditNoteNumber: 'CN-2025-0007',
  invoiceId: 337,
  invoiceNumber: 'INV-202512-0042',
  customerId: 8,
  customerName: 'Emirates Fabrication',
  creditNoteDate: '2025-12-04T20:00:00.000Z', // ISO timestamp from backend
  status: 'draft',
  reasonForReturn: 'overcharge',
  creditNoteType: 'ACCOUNTING_ONLY',
  manualCreditAmount: 0,
  items: [],
  subtotal: 0,
  vatAmount: 0,
  totalCredit: 0,
  notes: '',
  customer: {
    id: 8,
    name: 'Emirates Fabrication',
    address: {
      street: '123 Business Bay',
      city: 'Dubai',
      state: 'Dubai',
      postal_code: '12345',
      country: 'UAE',
    },
    phone: '+971501234567',
    email: 'contact@emiratesfab.ae',
    trn: '123456789012345',
  },
};

const mockInvoice = {
  id: 337,
  invoiceNumber: 'INV-202512-0042',
  date: '2025-12-02T20:00:00.000Z', // ISO timestamp
  status: 'issued',
  customerId: 8,
  customerName: 'Emirates Fabrication',
  customer: {
    id: 8,
    name: 'Emirates Fabrication',
    address: {
      street: '123 Business Bay',
      city: 'Dubai',
      state: 'Dubai',
      postal_code: '12345',
      country: 'UAE',
    },
    phone: '+971501234567',
    email: 'contact@emiratesfab.ae',
    trn: '123456789012345',
  },
  items: [
    {
      id: 1,
      productId: 10,
      name: 'Stainless Steel Sheet',
      description: '304 Grade',
      quantity: 11,
      rate: 222,
      amount: 2442,
      vatRate: 5,
      vatAmount: 122.1,
    },
    {
      id: 2,
      productId: 20,
      name: 'Stainless Steel Pipe',
      description: '316 Grade',
      quantity: 11,
      rate: 222,
      amount: 2442,
      vatRate: 5,
      vatAmount: 122.1,
    },
  ],
  subtotal: 4884,
  vatAmount: 244.2,
  total: 5128.2,
};

const mockCompany = {
  id: 1,
  name: 'Ultimate Steel Trading LLC',
  trn: '100123456789012',
  logoUrl: '/uploads/logo.png',
};

// Mock services
vi.mock('../../services/creditNoteService', () => ({
  creditNoteService: {
    getCreditNote: vi.fn(),
    getNextCreditNoteNumber: vi.fn(),
    createCreditNote: vi.fn(),
    updateCreditNote: vi.fn(),
  },
}));

vi.mock('../../services/invoiceService', () => ({
  invoiceService: {
    getInvoice: vi.fn(),
    searchForCreditNote: vi.fn(),
  },
}));

vi.mock('../../services/companyService', () => ({
  companyService: {
    getCompany: vi.fn(),
  },
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock router hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: undefined }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Credit Note Form - Date Format & Auto-Save Tests', () => {
  let localStorageMock;

  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    };

    // Setup service mocks with default implementations
    creditNoteService.creditNoteService.getNextCreditNoteNumber.mockResolvedValue({
      nextNumber: 'CN-2025-0008',
    });

    companyService.companyService.getCompany.mockResolvedValue(mockCompany);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
  });

  // ============================================
  // Test Suite 1: Date Format Handling
  // ============================================

  describe('Suite 1: Date Format Handling', () => {
    it('Test 1: Load existing credit note with ISO timestamp and verify date input format', async () => {
      // Mock the service to return credit note with ISO timestamp
      creditNoteService.creditNoteService.getCreditNote.mockResolvedValue(mockCreditNote);
      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      // Mock useParams to return credit note ID
      const useParamsMock = vi.fn(() => ({ id: '107' }));
      vi.mocked(await import('react-router-dom')).useParams = useParamsMock;

      const { container } = render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Wait for data to load
      await waitFor(() => {
        expect(creditNoteService.creditNoteService.getCreditNote).toHaveBeenCalledWith('107');
      });

      // Find date input
      const dateInput = container.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();

      // Verify date is formatted correctly (ISO -> yyyy-MM-dd)
      // ISO: 2025-12-04T20:00:00.000Z should become 2025-12-05 in UAE timezone (UTC+4)
      await waitFor(() => {
        expect(dateInput.value).toBe('2025-12-05');
      });

      // Verify no console warnings about invalid date format
      // (This is implicit - invalid date would show empty value or default)
      expect(dateInput.value).not.toBe('');
      expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('Test 2: Resume draft with ISO timestamp and verify formatted date', async () => {
      // Setup draft in localStorage with ISO timestamp
      const draftData = {
        337: {
          data: {
            invoiceId: 337,
            invoiceNumber: 'INV-202512-0042',
            creditNoteNumber: 'CN-2025-0008',
            creditNoteDate: '2025-12-03T20:00:00.000Z', // ISO timestamp
            reasonForReturn: 'goodwill_credit',
            creditNoteType: 'ACCOUNTING_ONLY',
            manualCreditAmount: 750,
            items: [],
            customer: mockInvoice.customer,
          },
          invoiceId: 337,
          invoiceNumber: 'INV-202512-0042',
          customerName: 'Emirates Fabrication',
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000, // 24 hours
        },
      };

      localStorageMock['credit_note_drafts'] = JSON.stringify(draftData);

      // Mock search params to load invoice
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      const { container } = render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Wait for conflict modal or resume banner
      await waitFor(() => {
        const resumeButton = screen.queryByText(/resume draft/i);
        expect(resumeButton).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click resume draft button
      const resumeButton = screen.getByText(/resume draft/i);
      await userEvent.click(resumeButton);

      // Wait for draft to be loaded
      await waitFor(() => {
        const dateInput = container.querySelector('input[type="date"]');
        expect(dateInput).toBeInTheDocument();
        // ISO: 2025-12-03T20:00:00.000Z should become 2025-12-04 in UAE timezone
        expect(dateInput.value).toBe('2025-12-04');
      });
    });
  });

  // ============================================
  // Test Suite 2: Manual Credit Amount Auto-Save
  // ============================================

  describe('Suite 2: Manual Credit Amount Auto-Save', () => {
    it('Test 3: Auto-save with manual credit amount only (no items selected)', async () => {
      // Mock search params with invoice ID
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Wait for invoice to load
      await waitFor(() => {
        expect(screen.getByText('INV-202512-0042')).toBeInTheDocument();
      });

      // Enter manual credit amount
      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '500');

      // Wait for auto-save debounce (2500ms)
      await waitFor(() => {
        const savedDrafts = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
        expect(savedDrafts[337]).toBeDefined();
        expect(savedDrafts[337].data.manualCreditAmount).toBe(500);
      }, { timeout: 4000 });

      // Verify draft structure
      const savedDrafts = JSON.parse(localStorageMock['credit_note_drafts']);
      expect(savedDrafts[337]).toMatchObject({
        invoiceId: 337,
        invoiceNumber: 'INV-202512-0042',
        customerName: 'Emirates Fabrication',
      });
      expect(savedDrafts[337].data.manualCreditAmount).toBe(500);
      expect(savedDrafts[337].timestamp).toBeDefined();
      expect(savedDrafts[337].expiresAt).toBeDefined();
    });

    it('Test 4: Auto-save with both items and manual amount', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Wait for invoice to load
      await waitFor(() => {
        expect(screen.getByText('Stainless Steel Sheet')).toBeInTheDocument();
      });

      // Select an item
      const checkboxes = screen.getAllByRole('checkbox');
      const firstItemCheckbox = checkboxes.find(cb => !cb.disabled);
      await userEvent.click(firstItemCheckbox);

      // Enter quantity
      const quantityInputs = screen.getAllByLabelText(/return qty/i);
      await userEvent.clear(quantityInputs[0]);
      await userEvent.type(quantityInputs[0], '5');

      // Enter manual credit amount
      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '250');

      // Wait for auto-save
      await waitFor(() => {
        const savedDrafts = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
        expect(savedDrafts[337]).toBeDefined();
      }, { timeout: 4000 });

      // Verify both items and manual amount are saved
      const savedDrafts = JSON.parse(localStorageMock['credit_note_drafts']);
      expect(savedDrafts[337].data.items.some(item => item.selected)).toBe(true);
      expect(savedDrafts[337].data.manualCreditAmount).toBe(250);
    });

    it('Test 5: Draft persistence across reload', async () => {
      // Setup existing draft
      const existingDraft = {
        337: {
          data: {
            invoiceId: 337,
            invoiceNumber: 'INV-202512-0042',
            creditNoteNumber: 'CN-2025-0008',
            creditNoteDate: '2025-12-05',
            reasonForReturn: 'goodwill_credit',
            creditNoteType: 'ACCOUNTING_ONLY',
            manualCreditAmount: 500,
            items: [],
            customer: mockInvoice.customer,
          },
          invoiceId: 337,
          invoiceNumber: 'INV-202512-0042',
          customerName: 'Emirates Fabrication',
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000,
        },
      };

      localStorageMock['credit_note_drafts'] = JSON.stringify(existingDraft);

      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Check that "Resume Draft" banner appears
      await waitFor(() => {
        expect(screen.getByText(/resume draft/i)).toBeInTheDocument();
      });

      // Click Resume Draft
      const resumeButton = screen.getByText(/resume draft/i);
      await userEvent.click(resumeButton);

      // Verify manual amount is restored
      await waitFor(() => {
        const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
        expect(manualCreditInput.value).toBe('500');
      });
    });
  });

  // ============================================
  // Test Suite 3: Save Draft Button
  // ============================================

  describe('Suite 3: Save Draft Button', () => {
    it('Test 6: Explicit save draft with manual amount', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);
      creditNoteService.creditNoteService.createCreditNote.mockResolvedValue({
        ...mockCreditNote,
        manualCreditAmount: 500,
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Wait for invoice to load
      await waitFor(() => {
        expect(screen.getByText('INV-202512-0042')).toBeInTheDocument();
      });

      // Select reason
      const reasonSelect = screen.getByLabelText(/reason for return/i);
      await userEvent.selectOptions(reasonSelect, 'goodwill_credit');

      // Enter manual credit amount
      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '500');

      // Click Save Draft button
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(saveDraftButton);

      // Verify API was called
      await waitFor(() => {
        expect(creditNoteService.creditNoteService.createCreditNote).toHaveBeenCalled();
      });

      // Verify saved data contains manual amount
      const callArgs = creditNoteService.creditNoteService.createCreditNote.mock.calls[0][0];
      expect(callArgs.manualCreditAmount).toBe(500);
      expect(callArgs.reasonForReturn).toBe('goodwill_credit');
      expect(callArgs.status).toBe('draft');
    });
  });

  // ============================================
  // Test Suite 4: Invoice Date Formats
  // ============================================

  describe('Suite 4: Invoice and Delivery Note Date Formats', () => {
    it('Test 7: Load invoice with ISO date', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Wait for invoice info to display
      await waitFor(() => {
        const invoiceInfo = screen.getByText(/invoice:/i).closest('div');
        expect(invoiceInfo).toBeInTheDocument();

        // Verify date is displayed (converted from ISO)
        // ISO: 2025-12-02T20:00:00.000Z should show as Dec 3, 2025 (UAE time)
        expect(screen.getByText(/12\/3\/2025/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Negative Test Cases
  // ============================================

  describe('Negative Test Cases', () => {
    it('Should not auto-save without invoice ID', async () => {
      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Try entering data without selecting invoice
      const noteField = screen.queryByLabelText(/notes/i);
      if (noteField) {
        await userEvent.type(noteField, 'Test note');
      }

      // Wait some time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify no draft saved
      const savedDrafts = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
      expect(Object.keys(savedDrafts).length).toBe(0);
    });

    it('Should handle invalid date gracefully', async () => {
      const invalidCreditNote = {
        ...mockCreditNote,
        creditNoteDate: 'invalid-date',
      };

      creditNoteService.creditNoteService.getCreditNote.mockResolvedValue(invalidCreditNote);

      const useParamsMock = vi.fn(() => ({ id: '107' }));
      vi.mocked(await import('react-router-dom')).useParams = useParamsMock;

      const { container } = render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      await waitFor(() => {
        const dateInput = container.querySelector('input[type="date"]');
        // Should fallback to today's date
        expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('Should clear draft after successful save', async () => {
      // Setup draft
      const existingDraft = {
        337: {
          data: {
            invoiceId: 337,
            manualCreditAmount: 500,
            reasonForReturn: 'goodwill_credit',
            items: [],
          },
          invoiceId: 337,
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000,
        },
      };

      localStorageMock['credit_note_drafts'] = JSON.stringify(existingDraft);

      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);
      creditNoteService.creditNoteService.createCreditNote.mockResolvedValue(mockCreditNote);

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Resume draft
      await waitFor(() => {
        expect(screen.getByText(/resume draft/i)).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText(/resume draft/i));

      // Save
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(saveDraftButton);

      // Verify draft is cleared from localStorage
      await waitFor(() => {
        const drafts = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
        expect(drafts[337]).toBeUndefined();
      });
    });
  });
});
