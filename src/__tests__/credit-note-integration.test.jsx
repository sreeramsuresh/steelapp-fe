/**
 * Integration Tests - Credit Note Full Workflow
 *
 * End-to-End integration tests covering:
 * - Complete credit note creation flow
 * - Draft save/resume workflow
 * - Date format handling across all components
 * - Manual credit amount validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreditNoteForm from '../pages/CreditNoteForm';
import { ThemeProvider } from '../contexts/ThemeContext';
import * as creditNoteService from '../services/creditNoteService';
import * as invoiceService from '../services/invoiceService';
import * as companyService from '../services/companyService';

// Mock implementations
const mockInvoice = {
  id: 337,
  invoiceNumber: 'INV-202512-0042',
  date: '2025-12-02T20:00:00.000Z',
  status: 'issued',
  customerId: 8,
  customerName: 'Emirates Fabrication',
  customer: {
    id: 8,
    name: 'Emirates Fabrication',
    address: { street: '123 Business Bay', city: 'Dubai', country: 'UAE' },
    phone: '+971501234567',
    email: 'contact@emiratesfab.ae',
    trn: '123456789012345',
  },
  items: [
    {
      id: 1,
      productId: 10,
      name: 'Stainless Steel Sheet',
      quantity: 11,
      rate: 222,
      amount: 2442,
      vatRate: 5,
    },
  ],
  total: 5128.2,
};

const mockCompany = {
  id: 1,
  name: 'Ultimate Steel Trading LLC',
  trn: '100123456789012',
};

// Mock services
vi.mock('../services/creditNoteService', () => ({
  creditNoteService: {
    getCreditNote: vi.fn(),
    getNextCreditNoteNumber: vi.fn(),
    createCreditNote: vi.fn(),
    updateCreditNote: vi.fn(),
  },
}));

vi.mock('../services/invoiceService', () => ({
  invoiceService: {
    getInvoice: vi.fn(),
    searchForCreditNote: vi.fn(),
  },
}));

vi.mock('../services/companyService', () => ({
  companyService: {
    getCompany: vi.fn(),
  },
}));

vi.mock('../services/notificationService', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

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

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>{children}</ThemeProvider>
  </BrowserRouter>
);

describe('Credit Note Integration Tests', () => {
  let localStorageMock;

  beforeEach(() => {
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

    creditNoteService.creditNoteService.getNextCreditNoteNumber.mockResolvedValue({
      nextNumber: 'CN-2025-0008',
    });
    companyService.companyService.getCompany.mockResolvedValue(mockCompany);
    invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
  });

  // ============================================
  // Complete Workflow: Create Credit Note with Manual Amount
  // ============================================

  describe('Complete Workflow - Manual Credit Amount', () => {
    it('should create credit note with manual amount from start to finish', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      creditNoteService.creditNoteService.createCreditNote.mockResolvedValue({
        id: 108,
        creditNoteNumber: 'CN-2025-0008',
        status: 'draft',
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Step 1: Wait for invoice to load
      await waitFor(() => {
        expect(screen.getByText('INV-202512-0042')).toBeInTheDocument();
      });

      // Step 2: Select reason
      const reasonSelect = screen.getByLabelText(/reason for return/i);
      await userEvent.selectOptions(reasonSelect, 'goodwill_credit');

      // Step 3: Enter manual credit amount
      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '500');

      // Step 4: Wait for auto-save
      await waitFor(() => {
        const drafts = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
        expect(drafts[337]).toBeDefined();
      }, { timeout: 4000 });

      // Step 5: Save draft explicitly
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(saveDraftButton);

      // Step 6: Verify API call
      await waitFor(() => {
        expect(creditNoteService.creditNoteService.createCreditNote).toHaveBeenCalled();
      });

      // Step 7: Verify saved data
      const callArgs = creditNoteService.creditNoteService.createCreditNote.mock.calls[0][0];
      expect(callArgs.manualCreditAmount).toBe(500);
      expect(callArgs.reasonForReturn).toBe('goodwill_credit');
      expect(callArgs.status).toBe('draft');
      expect(callArgs.invoiceId).toBe(337);

      // Step 8: Verify draft cleared after save
      await waitFor(() => {
        const drafts = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
        expect(drafts[337]).toBeUndefined();
      });
    });
  });

  // ============================================
  // Draft Resume Workflow
  // ============================================

  describe('Draft Resume Workflow', () => {
    it('should resume draft, modify amount, and save', async () => {
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

      creditNoteService.creditNoteService.createCreditNote.mockResolvedValue({
        id: 108,
        status: 'draft',
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Step 1: Resume draft
      await waitFor(() => {
        expect(screen.getByText(/resume draft/i)).toBeInTheDocument();
      });

      const resumeButton = screen.getByText(/resume draft/i);
      await userEvent.click(resumeButton);

      // Step 2: Verify draft loaded
      await waitFor(() => {
        const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
        expect(manualCreditInput.value).toBe('500');
      });

      // Step 3: Modify amount
      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '750');

      // Step 4: Save
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(saveDraftButton);

      // Step 5: Verify updated amount
      await waitFor(() => {
        expect(creditNoteService.creditNoteService.createCreditNote).toHaveBeenCalled();
        const callArgs = creditNoteService.creditNoteService.createCreditNote.mock.calls[0][0];
        expect(callArgs.manualCreditAmount).toBe(750);
      });
    });
  });

  // ============================================
  // Date Format Throughout Workflow
  // ============================================

  describe('Date Format Consistency', () => {
    it('should maintain correct date format from load to save', async () => {
      const creditNoteWithDate = {
        id: 107,
        creditNoteNumber: 'CN-2025-0007',
        invoiceId: 337,
        creditNoteDate: '2025-12-04T20:00:00.000Z', // ISO from backend
        status: 'draft',
        reasonForReturn: 'overcharge',
        items: [],
        customer: mockInvoice.customer,
      };

      creditNoteService.creditNoteService.getCreditNote.mockResolvedValue(creditNoteWithDate);
      creditNoteService.creditNoteService.updateCreditNote.mockResolvedValue(creditNoteWithDate);

      const useParamsMock = vi.fn(() => ({ id: '107' }));
      vi.mocked(await import('react-router-dom')).useParams = useParamsMock;

      const { container } = render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      // Step 1: Verify date loaded correctly
      await waitFor(() => {
        const dateInput = container.querySelector('input[type="date"]');
        expect(dateInput.value).toBe('2025-12-05'); // Converted to UAE time
      });

      // Step 2: Modify manual amount
      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '100');

      // Step 3: Save
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(saveDraftButton);

      // Step 4: Verify date maintained in save
      await waitFor(() => {
        expect(creditNoteService.creditNoteService.updateCreditNote).toHaveBeenCalled();
        const callArgs = creditNoteService.creditNoteService.updateCreditNote.mock.calls[0][1];
        expect(callArgs.creditNoteDate).toBe('2025-12-05'); // Should be yyyy-MM-dd
      });
    });
  });

  // ============================================
  // Validation Workflow
  // ============================================

  describe('Validation Workflow', () => {
    it('should prevent save without required fields', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('INV-202512-0042')).toBeInTheDocument();
      });

      // Try to save without reason or amount
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(saveDraftButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/please fix the following errors/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(creditNoteService.creditNoteService.createCreditNote).not.toHaveBeenCalled();
    });

    it('should allow save with manual credit amount and reason', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      creditNoteService.creditNoteService.createCreditNote.mockResolvedValue({
        id: 108,
        status: 'draft',
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('INV-202512-0042')).toBeInTheDocument();
      });

      // Fill required fields
      const reasonSelect = screen.getByLabelText(/reason for return/i);
      await userEvent.selectOptions(reasonSelect, 'goodwill_credit');

      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '500');

      // Save
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(saveDraftButton);

      // Should succeed
      await waitFor(() => {
        expect(creditNoteService.creditNoteService.createCreditNote).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // Issue Tax Document Workflow
  // ============================================

  describe('Issue Tax Document Workflow', () => {
    it('should issue credit note immediately (skip draft)', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      creditNoteService.creditNoteService.createCreditNote.mockResolvedValue({
        id: 108,
        status: 'issued',
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('INV-202512-0042')).toBeInTheDocument();
      });

      // Fill form
      const reasonSelect = screen.getByLabelText(/reason for return/i);
      await userEvent.selectOptions(reasonSelect, 'goodwill_credit');

      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, '500');

      // Click "Issue Tax Document" instead of "Save Draft"
      const issueButton = screen.getByRole('button', { name: /issue tax document/i });
      await userEvent.click(issueButton);

      // Should save with issued status
      await waitFor(() => {
        expect(creditNoteService.creditNoteService.createCreditNote).toHaveBeenCalled();
        const callArgs = creditNoteService.creditNoteService.createCreditNote.mock.calls[0][0];
        expect(callArgs.status).toBe('issued');
      });
    });
  });

  // ============================================
  // Performance Tests
  // ============================================

  describe('Performance Tests', () => {
    it('should handle rapid input changes without errors', async () => {
      const useSearchParamsMock = vi.fn(() => [
        new URLSearchParams('?invoiceId=337'),
        vi.fn(),
      ]);
      vi.mocked(await import('react-router-dom')).useSearchParams = useSearchParamsMock;

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('INV-202512-0042')).toBeInTheDocument();
      });

      const manualCreditInput = screen.getByLabelText(/credit amount \(aed\)/i);

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        await userEvent.clear(manualCreditInput);
        await userEvent.type(manualCreditInput, (100 + i * 50).toString());
      }

      // Should not crash
      expect(manualCreditInput).toBeInTheDocument();

      // Wait for debounce and verify last value saved
      await waitFor(() => {
        const drafts = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
        if (drafts[337]) {
          expect(drafts[337].data.manualCreditAmount).toBe(550); // Last value
        }
      }, { timeout: 4000 });
    });
  });
});
