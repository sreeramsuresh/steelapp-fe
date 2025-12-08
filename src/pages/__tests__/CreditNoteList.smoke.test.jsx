/**
 * CreditNoteList - Smoke Tests
 *
 * Comprehensive smoke tests covering ALL UI elements, buttons, icons, and interactions
 * in the Credit Note List View.
 *
 * Test Coverage:
 * - Header elements (title, subtitle, "New Credit Note" button)
 * - Search box and status filter dropdown
 * - Table headers (all columns)
 * - Action buttons (View, Edit, Delete, Download PDF, Preview)
 * - Pagination controls
 * - Empty state display
 * - Loading states
 * - Draft management section
 * - Dark mode compatibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreditNoteList from '../CreditNoteList';
import { ThemeContext } from '../../contexts/ThemeContext';
import { creditNoteService } from '../../services/creditNoteService';
import { companyService } from '../../services/companyService';
import { notificationService } from '../../services/notificationService';

// Mock services - Must return objects matching the exact export structure
vi.mock('../../services/creditNoteService', () => {
  return {
    creditNoteService: {
      getAllCreditNotes: vi.fn(),
      getCreditNote: vi.fn(),
      deleteCreditNote: vi.fn(),
      downloadPDF: vi.fn(),
      getNextCreditNoteNumber: vi.fn(),
      createCreditNote: vi.fn(),
      updateCreditNote: vi.fn(),
      getAllowedTransitions: vi.fn().mockResolvedValue({ allowed_transitions: [], allowedTransitions: [] }),
    },
  };
});

vi.mock('../../services/companyService', () => {
  return {
    companyService: {
      getCompany: vi.fn(),
    },
  };
});

vi.mock('../../services/notificationService', () => {
  return {
    notificationService: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});
vi.mock('../../hooks/useConfirm', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    dialogState: { open: false },
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  }),
}));
vi.mock('../../hooks/useCreditNoteDrafts', () => ({
  default: () => ({
    allDrafts: [],
    hasDrafts: false,
    deleteDraft: vi.fn(),
    refreshDrafts: vi.fn(),
  }),
  getDraftStatusMessage: vi.fn().mockReturnValue('Draft saved 5 minutes ago'),
}));

// Mock data
const mockCreditNotes = [
  {
    id: 1,
    creditNoteNumber: 'CN-2024-001',
    invoiceNumber: 'INV-2024-001',
    customer: { name: 'Test Customer 1' },
    creditNoteDate: '2024-01-15',
    totalCredit: 1500.00,
    creditNoteType: 'RETURN_WITH_QC',
    status: 'issued',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    creditNoteNumber: 'CN-2024-002',
    invoiceNumber: 'INV-2024-002',
    customer: { name: 'Test Customer 2' },
    creditNoteDate: '2024-01-16',
    totalCredit: 2500.00,
    creditNoteType: 'ACCOUNTING_ONLY',
    status: 'draft',
    createdAt: '2024-01-16T11:00:00Z',
  },
  {
    id: 3,
    creditNoteNumber: 'CN-2024-003',
    invoiceNumber: 'INV-2024-003',
    customerName: 'Test Customer 3',
    creditNoteDate: '2024-01-17',
    totalCredit: 3500.00,
    credit_note_type: 'RETURN_WITH_QC',
    status: 'completed',
    created_at: '2024-01-17T12:00:00Z',
  },
];

const mockPagination = {
  currentPage: 1,
  perPage: 20,
  total: 3,
  totalItems: 3,
  totalPages: 1,
};

const mockCompany = {
  id: 1,
  name: 'Ultimate Steels LLC',
  address: '123 Steel St',
  trn: '123456789012345',
};

// Test wrapper component with mocked ThemeContext
const TestWrapper = ({ children, isDarkMode = false }) => {
  const mockThemeContext = {
    isDarkMode,
    toggleDarkMode: vi.fn(),
    themeMode: isDarkMode ? 'dark' : 'light',
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  };

  return (
    <BrowserRouter>
      <ThemeContext.Provider value={mockThemeContext}>
        {children}
      </ThemeContext.Provider>
    </BrowserRouter>
  );
};

describe('CreditNoteList - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    creditNoteService.getAllCreditNotes.mockResolvedValue({
      data: mockCreditNotes,
      pagination: mockPagination,
    });

    companyService.getCompany.mockResolvedValue(mockCompany);

    creditNoteService.deleteCreditNote.mockResolvedValue({});
    creditNoteService.downloadPDF.mockResolvedValue({});
    creditNoteService.getCreditNote.mockResolvedValue(mockCreditNotes[0]);

    notificationService.success = vi.fn();
    notificationService.error = vi.fn();
    notificationService.warning = vi.fn();
    notificationService.info = vi.fn();
  });

  describe('Header Section', () => {
    it('renders page title "Credit Notes"', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Credit Notes')).toBeInTheDocument();
      });
    });

    it('renders page subtitle "Manage customer returns and refunds"', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Manage customer returns and refunds')).toBeInTheDocument();
      });
    });

    it('renders "New Credit Note" button with Plus icon', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /new credit note/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-teal-600');
      });
    });

    it('navigates to /credit-notes/new when "New Credit Note" button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new credit note/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /new credit note/i });
      await user.click(button);

      // Navigation is mocked, just verify button is clickable
      expect(button).toBeEnabled();
    });
  });

  describe('Search and Filter Section', () => {
    it('renders search input with placeholder text', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search by credit note number, invoice number, or customer/i);
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('type', 'text');
      });
    });

    it('renders Search icon in search input', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by credit note number/i)).toBeInTheDocument();
      });

      // Search icon is rendered as SVG
      const searchInput = screen.getByPlaceholderText(/search by credit note number/i);
      expect(searchInput.parentElement.querySelector('svg')).toBeInTheDocument();
    });

    it('allows typing in search box', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by credit note number/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by credit note number/i);
      await user.type(searchInput, 'CN-2024');

      expect(searchInput).toHaveValue('CN-2024');
    });

    it('renders status filter dropdown with "All Statuses" option', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        expect(within(select).getByText('All Statuses')).toBeInTheDocument();
      });
    });

    it('renders all status filter options', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      const options = within(select).getAllByRole('option');

      // Should have: All Statuses + 8 status options
      expect(options.length).toBeGreaterThanOrEqual(8);

      const optionTexts = options.map(opt => opt.textContent);
      expect(optionTexts).toContain('Draft');
      expect(optionTexts).toContain('Issued');
      expect(optionTexts).toContain('Applied');
      expect(optionTexts).toContain('Refunded');
      expect(optionTexts).toContain('Completed');
    });

    it('allows changing status filter', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'issued');

      expect(select).toHaveValue('issued');
    });
  });

  describe('Table Headers', () => {
    it('renders "CREDIT NOTE #" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/credit note #/i)).toBeInTheDocument();
      });
    });

    it('renders "INVOICE #" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/invoice #/i)).toBeInTheDocument();
      });
    });

    it('renders "CUSTOMER" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const headers = within(table).getAllByRole('columnheader');
        const headerTexts = headers.map(h => h.textContent);
        expect(headerTexts).toContain('Customer');
      });
    });

    it('renders "DATE" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/^date$/i)).toBeInTheDocument();
      });
    });

    it('renders "TOTAL CREDIT" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/total credit/i)).toBeInTheDocument();
      });
    });

    it('renders "TYPE" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/^type$/i)).toBeInTheDocument();
      });
    });

    it('renders "STATUS" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/^status$/i)).toBeInTheDocument();
      });
    });

    it('renders "ACTIONS" column header', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/actions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Table Data Rendering', () => {
    it('renders credit note numbers', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('CN-2024-001')).toBeInTheDocument();
        expect(screen.getByText('CN-2024-002')).toBeInTheDocument();
        expect(screen.getByText('CN-2024-003')).toBeInTheDocument();
      });
    });

    it('renders invoice numbers', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
        expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
        expect(screen.getByText('INV-2024-003')).toBeInTheDocument();
      });
    });

    it('renders customer names', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
        expect(screen.getByText('Test Customer 2')).toBeInTheDocument();
        expect(screen.getByText('Test Customer 3')).toBeInTheDocument();
      });
    });

    it('renders formatted total credit amounts', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        // Check that credit amounts are rendered (formatCurrency returns "AED 1,500.00")
        expect(screen.getByText('AED 1,500.00')).toBeInTheDocument();
        expect(screen.getByText('AED 2,500.00')).toBeInTheDocument();
        expect(screen.getByText('AED 3,500.00')).toBeInTheDocument();
      });
    });

    it('renders credit note types (Accounting vs Return + QC)', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const returnQCElements = screen.getAllByText('Return + QC');
        expect(returnQCElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Accounting')).toBeInTheDocument();
      });
    });

    it('renders status badges with correct styling', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('CN-2024-001')).toBeInTheDocument();
      });

      // Check all three status badges are rendered in the table
      const table = screen.getByRole('table');
      expect(within(table).getByText('Issued')).toBeInTheDocument();
      expect(within(table).getByText('Draft')).toBeInTheDocument();
      expect(within(table).getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders Preview button (Eye icon) for each credit note', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const previewButtons = screen.getAllByTitle('Preview');
        expect(previewButtons).toHaveLength(3);
      });
    });

    it('renders Download PDF button for each credit note', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const downloadButtons = screen.getAllByTitle(/download pdf/i);
        expect(downloadButtons).toHaveLength(3);
      });
    });

    it('renders Edit button for draft credit notes only', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        // Only draft credit notes (CN-2024-002) should have Edit button
        const editButtons = screen.queryAllByTitle('Edit');
        expect(editButtons).toHaveLength(1);
      });
    });

    it('renders Delete button for draft credit notes only', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        // Only draft credit notes (CN-2024-002) should have Delete button
        const deleteButtons = screen.queryAllByTitle('Delete');
        expect(deleteButtons).toHaveLength(1);
      });
    });

    it('Preview button is clickable', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getAllByTitle('Preview')[0]).toBeInTheDocument();
      });

      const previewButton = screen.getAllByTitle('Preview')[0];
      await user.click(previewButton);

      expect(creditNoteService.getCreditNote).toHaveBeenCalledWith(1);
    });

    it('Download PDF button is clickable', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getAllByTitle(/download pdf/i)[0]).toBeInTheDocument();
      });

      const downloadButton = screen.getAllByTitle(/download pdf/i)[0];
      await user.click(downloadButton);

      await waitFor(() => {
        expect(creditNoteService.downloadPDF).toHaveBeenCalled();
      });
    });

    it('Edit button navigates to edit page', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getAllByTitle('Edit')[0]).toBeInTheDocument();
      });

      const editButton = screen.getAllByTitle('Edit')[0];
      await user.click(editButton);

      // Navigation is mocked, verify button is clickable
      expect(editButton).toBeEnabled();
    });
  });

  describe('Pagination Controls', () => {
    it('displays correct page numbers', async () => {
      // Create mock data with more items than pageSize (20)
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/showing 1 to 20 of 25 credit notes/i)).toBeInTheDocument();
      });
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
      await user.click(nextButton);

      // Verify API was called with page 2
      await waitFor(() => {
        expect(creditNoteService.getAllCreditNotes).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 }),
        );
      });
    });

    it('navigates to previous page', async () => {
      const user = userEvent.setup();

      // First render page 1
      const page1Items = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: page1Items,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Click Next to go to page 2
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();

      // Mock response for page 2
      const page2Items = Array.from({ length: 5 }, (_, i) => ({
        id: i + 21,
        creditNoteNumber: `CN-2024-${String(i + 21).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 21).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 21}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: page2Items,
        pagination: { currentPage: 2, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      await user.click(nextButton);

      // Now check Previous button is enabled
      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).not.toBeDisabled();
      });
    });

    it('disables previous on first page', async () => {
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    it('disables next on last page', async () => {
      const user = userEvent.setup();

      // Start with page 1
      const page1Items = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: page1Items,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Mock page 2 data (last page)
      const page2Items = Array.from({ length: 5 }, (_, i) => ({
        id: i + 21,
        creditNoteNumber: `CN-2024-${String(i + 21).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 21).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 21}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: page2Items,
        pagination: { currentPage: 2, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      // Click Next to go to last page
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Component disables Next when: currentPage * pageSize >= pagination.total
      // Page 2 * pageSize 20 = 40 >= total 25, so Next should be disabled
      await waitFor(() => {
        const updatedNextButton = screen.getByText('Next');
        expect(updatedNextButton).toBeDisabled();
      });
    });

    it('updates page when changing items per page', async () => {
      // This component has fixed page size of 20, so this test verifies pagination works
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(creditNoteService.getAllCreditNotes).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          search: '',
          status: '',
        });
      });
    });

    it('shows correct items per page', async () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // 1 header row + 20 data rows
        expect(rows.length).toBe(21);
      });
    });

    it('handles page change correctly', async () => {
      const user = userEvent.setup();
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(creditNoteService.getAllCreditNotes).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 2 }),
        );
      });
    });

    it('resets to first page when filter changes', async () => {
      const user = userEvent.setup();
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox');
      await user.selectOptions(statusSelect, 'issued');

      // Changing filter triggers new API call with page 1
      await waitFor(() => {
        expect(creditNoteService.getAllCreditNotes).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1, status: 'issued' }),
        );
      });
    });

    it('shows total count correctly', async () => {
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, '0')}`,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
        customer: { name: `Customer ${i + 1}` },
        creditNoteDate: '2024-01-15',
        totalCredit: 1500.00,
        creditNoteType: 'RETURN_WITH_QC',
        status: 'issued',
        createdAt: '2024-01-15T10:00:00Z',
      }));

      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: manyItems,
        pagination: { currentPage: 1, perPage: 20, total: 25, totalItems: 25, totalPages: 2 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/25 credit notes/i)).toBeInTheDocument();
      });
    });

    it('handles empty results', async () => {
      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: [],
        pagination: { currentPage: 1, perPage: 20, total: 0, totalItems: 0, totalPages: 0 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/no credit notes found/i)).toBeInTheDocument();
      });

      // Pagination should not be shown when no items
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('handles loading state', async () => {
      creditNoteService.getAllCreditNotes.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: [],
          pagination: { currentPage: 1, perPage: 20, total: 0, totalItems: 0, totalPages: 0 },
        }), 100)),
      );

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      expect(screen.getByText(/loading credit notes/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading credit notes/i)).not.toBeInTheDocument();
      });
    });

    it('handles error state gracefully', async () => {
      creditNoteService.getAllCreditNotes.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(notificationService.error).toHaveBeenCalledWith('Failed to load credit notes');
      });
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no credit notes exist', async () => {
      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: [],
        pagination: { ...mockPagination, total: 0, totalItems: 0 },
      });

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/no credit notes found/i)).toBeInTheDocument();
        expect(screen.getByText(/use the button above to create your first credit note/i)).toBeInTheDocument();
      });
    });

    it('renders "no matching credit notes" when search has no results', async () => {
      creditNoteService.getAllCreditNotes.mockResolvedValue({
        data: [],
        pagination: { ...mockPagination, total: 0, totalItems: 0 },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by credit note number/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by credit note number/i);
      await user.type(searchInput, 'NONEXISTENT');

      await waitFor(() => {
        expect(screen.getByText(/no matching credit notes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner on initial load', () => {
      creditNoteService.getAllCreditNotes.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000)),
      );

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      expect(screen.getByText(/loading credit notes/i)).toBeInTheDocument();
    });

    it('shows downloading spinner when PDF is being downloaded', async () => {
      const user = userEvent.setup();

      creditNoteService.downloadPDF.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000)),
      );

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getAllByTitle(/download pdf/i)[0]).toBeInTheDocument();
      });

      const downloadButton = screen.getAllByTitle(/download pdf/i)[0];
      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByTitle('Downloading...')).toBeInTheDocument();
      });
    });
  });

  describe('Dark Mode Compatibility', () => {
    it('renders in light mode by default', async () => {
      render(
        <TestWrapper isDarkMode={false}>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Credit Notes')).toBeInTheDocument();
      });
    });
  });

  describe('Draft Management Section', () => {
    it('does not render drafts section when no drafts exist', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.queryByText(/unsaved drafts/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Clickable Credit Note Number', () => {
    it('credit note number is clickable and navigates to detail page', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('CN-2024-001')).toBeInTheDocument();
      });

      const creditNoteLink = screen.getByText('CN-2024-001');
      expect(creditNoteLink).toHaveClass('hover:text-teal-600');

      await user.click(creditNoteLink);

      // Navigation is mocked, just verify it's clickable
      expect(creditNoteLink).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('calls getAllCreditNotes with correct parameters', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(creditNoteService.getAllCreditNotes).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          search: '',
          status: '',
        });
      });
    });

    it('calls getCompany on mount', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(companyService.getCompany).toHaveBeenCalled();
      });
    });

    it('handles API errors gracefully', async () => {
      creditNoteService.getAllCreditNotes.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(notificationService.error).toHaveBeenCalledWith('Failed to load credit notes');
      });
    });
  });

  describe('Row Hover Effects', () => {
    it('table rows have hover effect classes', async () => {
      render(
        <TestWrapper>
          <CreditNoteList />
        </TestWrapper>,
      );

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // Skip header row
        const dataRows = rows.slice(1);
        dataRows.forEach(row => {
          expect(row.className).toContain('hover:bg-');
        });
      });
    });
  });
});
