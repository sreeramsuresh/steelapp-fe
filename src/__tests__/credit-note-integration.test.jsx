import sinon from "sinon";
/**
 * Integration Tests - Credit Note Full Workflow
 *
 * End-to-End integration tests covering:
 * - Complete credit note creation flow
 * - Draft save/resume workflow
 * - Date format handling across all components
 * - Manual credit amount validation
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../contexts/ThemeContext";
import CreditNoteForm from "../pages/CreditNoteForm";

// Mock implementations
const mockInvoice = {
  id: 337,
  invoiceNumber: "INV-202512-0042",
  date: "2025-12-02T20:00:00.000Z",
  status: "issued",
  customerId: 8,
  customerName: "Emirates Fabrication",
  customer: {
    id: 8,
    name: "Emirates Fabrication",
    address: { street: "123 Business Bay", city: "Dubai", country: "UAE" },
    phone: "+971501234567",
    email: "contact@emiratesfab.ae",
    trn: "123456789012345",
  },
  items: [
    {
      id: 1,
      productId: 10,
      name: "Stainless Steel Sheet",
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
  name: "Ultimate Steel Trading LLC",
  trn: "100123456789012",
};

// Hoist service mock functions to ensure they're the same instances
const {
  mockGetCreditNote,
  mockGetNextCreditNoteNumber,
  mockCreateCreditNote,
  mockUpdateCreditNote,
  mockGetInvoice,
  mockSearchForCreditNote,
  mockGetCompany,
  mockNotificationSuccess,
  mockNotificationError,
  mockNotificationWarning,
  mockNotificationInfo,
} = // Hoisted: {
  mockGetCreditNote;
: sinon.stub(),
  mockGetNextCreditNoteNumber: sinon.stub(),
  mockCreateCreditNote: sinon.stub(),
  mockUpdateCreditNote: sinon.stub(),
  mockGetInvoice: sinon.stub(),
  mockSearchForCreditNote: sinon.stub(),
  mockGetCompany: sinon.stub(),
  mockNotificationSuccess: sinon.stub(),
  mockNotificationError: sinon.stub(),
  mockNotificationWarning: sinon.stub(),
  mockNotificationInfo: sinon.stub(),
}))

// sinon.stub() // "../services/creditNoteService", () => ({
{
  getCreditNote: mockGetCreditNote, getNextCreditNoteNumber;
  : mockGetNextCreditNoteNumber,
    createCreditNote: mockCreateCreditNote,
    updateCreditNote: mockUpdateCreditNote,
}
,
}))

// sinon.stub() // "../services/invoiceService", () => ({
{
  getInvoice: mockGetInvoice, searchForCreditNote;
  : mockSearchForCreditNote,
}
,
}))

// sinon.stub() // "../services/companyService", () => ({
{
  getCompany: mockGetCompany,
}
,
}))

// sinon.stub() // "../services/notificationService", () => ({
{
  success: mockNotificationSuccess, error;
  : mockNotificationError,
    warning: mockNotificationWarning,
    info: mockNotificationInfo,
}
,
}))

// Mock useCreditNoteDrafts hook - use vi.hoisted for variables used in vi.mock
const {
  mockCheckConflict,
  mockSaveDraft,
  mockDeleteDraft,
  mockGetDraft,
  mockHasDraftForInvoice,
  mockRefreshDrafts,
  mockSetPendingSave,
  mockClearPendingSave,
} = // Hoisted: {
  mockCheckConflict;
: sinon.stub().mockReturnValue(
{
  type: null, existingDraft;
  : null, allDrafts: []
}
),
  mockSaveDraft: sinon.stub().mockReturnValue(true),
  mockDeleteDraft: sinon.stub().mockReturnValue(true),
  mockGetDraft: sinon.stub().mockReturnValue(null),
  mockHasDraftForInvoice: sinon.stub().mockReturnValue(false),
  mockRefreshDrafts: sinon.stub().mockReturnValue(
{
}
),
  mockSetPendingSave: sinon.stub(),
  mockClearPendingSave: sinon.stub(),
}))

// sinon.stub() // "../hooks/useCreditNoteDrafts", () => ({
default: () => (
{
  ,
    currentDraft: null,
    conflictInfo: null,
    allDrafts: [],
    hasDrafts: false,
    // Actions
    saveDraft: mockSaveDraft,
    getDraft: mockGetDraft,
    deleteDraft: mockDeleteDraft,
    clearAllDrafts: sinon.stub(),
    hasDraftForInvoice: mockHasDraftForInvoice,
    checkConflict: mockCheckConflict,
    refreshDrafts: mockRefreshDrafts,
    // For silent save
    setPendingSave: mockSetPendingSave,
    clearPendingSave: mockClearPendingSave,
    // Utilities
    cleanupExpiredDrafts: sinon.stub().mockReturnValue(),
}
),
  getDraftStatusMessage: sinon.stub().mockReturnValue("Draft saved 5 minutes ago"),
  formatRelativeTime: sinon.stub().mockReturnValue("5 minutes ago"),
  formatTimeUntilExpiry: sinon.stub().mockReturnValue("6h 30m"),
  cleanupExpiredDrafts: sinon.stub().mockReturnValue(
{
}
),
}))

// Hoist router mocks for use in vi.mock
const {
  mockNavigate,
  mockUseParams,
  mockUseSearchParams,
} = // Hoisted: {
  mockNavigate;
: sinon.stub(),
  mockUseParams: vi.fn(() => (
{
  id: undefined;
}
)),
  mockUseSearchParams: vi.fn(() => [new URLSearchParams(), sinon.stub()]),
}))

// sinon.stub() // "react-router-dom", async () => {
const actual = await vi.importActual("react-router-dom");
return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
})

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>{children}</ThemeProvider>
  </BrowserRouter>
);

describe("Credit Note Integration Tests", () => {
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

    // Reset router mocks to defaults
    mockUseParams.mockReturnValue({ id: undefined });
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), sinon.stub()]);

    // Reset useCreditNoteDrafts mocks
    mockCheckConflict.mockReturnValue({
      type: null,
      existingDraft: null,
      allDrafts: [],
    });
    mockSaveDraft.mockReturnValue(true);
    mockDeleteDraft.mockReturnValue(true);
    mockGetDraft.mockReturnValue(null);
    mockHasDraftForInvoice.mockReturnValue(false);
    mockRefreshDrafts.mockReturnValue({});

    // Use hoisted mock functions directly for service mocks
    mockGetNextCreditNoteNumber.mockResolvedValue({
      nextNumber: "CN-2025-0008",
    });
    mockGetCompany.mockResolvedValue(mockCompany);
    mockGetInvoice.mockResolvedValue(mockInvoice);
  });

  afterEach(() => {
    sinon.restore();
    localStorageMock = {};
  });

  // ============================================
  // Complete Workflow: Create Credit Note with Manual Amount
  // ============================================

  describe("Complete Workflow - Manual Credit Amount", () => {
    it("should create credit note with manual amount from start to finish", async () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("invoiceId=337"), sinon.stub()]);

      mockCreateCreditNote.mockResolvedValue({
        id: 108,
        creditNoteNumber: "CN-2025-0008",
        status: "draft",
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      // Step 1: Wait for invoice to load
      await waitFor(() => {
        expect(screen.getByText(/INV-202512-0042/)).toBeInTheDocument();
      });

      // Step 2: Select reason
      const reasonSelect = screen.getByDisplayValue("Select reason...");
      await userEvent.selectOptions(reasonSelect, "goodwill_credit");

      // Step 3: Enter manual credit amount
      const manualCreditInput = screen.getByTestId("manual-credit-amount");
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, "500");

      // Step 4: Select settlement method (required when manual credit amount > 0)
      const settlementMethodSelect = screen.getByDisplayValue("Select settlement method...");
      await userEvent.selectOptions(settlementMethodSelect, "credit_adjustment");

      // Step 5: Save draft explicitly (skip localStorage auto-save check since hook is mocked)
      const saveDraftButton = screen.getByRole("button", {
        name: /save draft/i,
      });
      await userEvent.click(saveDraftButton);

      // Step 6: Verify API call
      await waitFor(() => {
        assert.ok(mockCreateCreditNote.called);
      });

      // Step 7: Verify saved data
      const callArgs = mockCreateCreditNote.mock.calls[0][0];
      expect(callArgs.manualCreditAmount).toBe(500);
      expect(callArgs.reasonForReturn).toBe("goodwill_credit");
      expect(callArgs.refundMethod).toBe("credit_adjustment");
      expect(callArgs.status).toBe("draft");
      expect(callArgs.invoiceId).toBe(337);
    });
  });

  // ============================================
  // Draft Resume Workflow
  // ============================================

  describe("Draft Resume Workflow", () => {
    it("should resume draft, modify amount, and save", async () => {
      // Setup existing draft via the mocked hook
      const existingDraft = {
        data: {
          invoiceId: 337,
          invoiceNumber: "INV-202512-0042",
          creditNoteNumber: "CN-2025-0008",
          creditNoteDate: "2025-12-05",
          reasonForReturn: "goodwill_credit",
          creditNoteType: "ACCOUNTING_ONLY",
          manualCreditAmount: 500,
          refundMethod: "credit_adjustment",
          items: mockInvoice.items.map((item) => ({
            ...item,
            selected: false,
            quantityReturned: 0,
            originalQuantity: item.quantity,
          })),
          customer: mockInvoice.customer,
        },
        invoiceId: 337,
        invoiceNumber: "INV-202512-0042",
        customerName: "Emirates Fabrication",
        timestamp: Date.now(),
        expiresAt: Date.now() + 86400000,
      };

      // Configure mock to return a draft conflict
      mockCheckConflict.mockReturnValue({
        type: "same_invoice",
        existingDraft,
        allDrafts: [existingDraft],
      });

      // Mock getDraft to return the draft data when resumed
      mockGetDraft.mockReturnValue(existingDraft);

      mockUseSearchParams.mockReturnValue([new URLSearchParams("invoiceId=337"), sinon.stub()]);

      mockCreateCreditNote.mockResolvedValue({
        id: 108,
        status: "draft",
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      // Step 1: Wait for conflict modal with Resume Draft option
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /resume draft/i })).toBeInTheDocument();
      });

      const resumeButton = screen.getByRole("button", {
        name: /resume draft/i,
      });
      await userEvent.click(resumeButton);

      // Step 2: Wait for form to load with draft data
      await waitFor(() => {
        expect(screen.getByText(/INV-202512-0042/)).toBeInTheDocument();
      });

      // Step 3: Verify draft loaded and modify amount
      const manualCreditInput = screen.getByTestId("manual-credit-amount");
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, "750");

      // Step 4: Save
      const saveDraftButton = screen.getByRole("button", {
        name: /save draft/i,
      });
      await userEvent.click(saveDraftButton);

      // Step 5: Verify updated amount
      await waitFor(() => {
        assert.ok(mockCreateCreditNote.called);
        const callArgs = mockCreateCreditNote.mock.calls[0][0];
        expect(callArgs.manualCreditAmount).toBe(750);
      });
    });
  });

  // ============================================
  // Date Format Throughout Workflow
  // ============================================

  describe("Date Format Consistency", () => {
    it("should maintain correct date format from load to save", async () => {
      const creditNoteWithDate = {
        id: 107,
        creditNoteNumber: "CN-2025-0007",
        invoiceId: 337,
        creditNoteDate: "2025-12-04T20:00:00.000Z", // ISO from backend
        status: "draft",
        reasonForReturn: "overcharge",
        creditNoteType: "ACCOUNTING_ONLY",
        manualCreditAmount: 0,
        items: [],
        customer: mockInvoice.customer,
      };

      mockGetCreditNote.mockResolvedValue(creditNoteWithDate);
      mockUpdateCreditNote.mockResolvedValue(creditNoteWithDate);

      mockUseParams.mockReturnValue({ id: "107" });

      const { container } = render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      // Step 1: Verify date loaded correctly
      await waitFor(() => {
        const dateInput = container.querySelector('input[type="date"]');
        expect(dateInput.value).toBe("2025-12-05"); // Converted to UAE time
      });

      // Step 2: Modify manual amount
      const manualCreditInput = screen.getByTestId("manual-credit-amount");
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, "100");

      // Step 3: Wait for and select settlement method (appears after manual credit amount > 0)
      await waitFor(() => {
        expect(screen.getByDisplayValue("Select settlement method...")).toBeInTheDocument();
      });
      const settlementMethodSelect = screen.getByDisplayValue("Select settlement method...");
      await userEvent.selectOptions(settlementMethodSelect, "credit_adjustment");

      // Step 4: Save
      const saveDraftButton = screen.getByRole("button", {
        name: /save draft/i,
      });
      await userEvent.click(saveDraftButton);

      // Step 5: Verify date maintained in save
      await waitFor(() => {
        assert.ok(mockUpdateCreditNote.called);
        const callArgs = mockUpdateCreditNote.mock.calls[0][1];
        expect(callArgs.creditNoteDate).toBe("2025-12-05"); // Should be yyyy-MM-dd
      });
    });
  });

  // ============================================
  // Validation Workflow
  // ============================================

  describe("Validation Workflow", () => {
    it("should prevent save without required fields", async () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("invoiceId=337"), sinon.stub()]);

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/INV-202512-0042/)).toBeInTheDocument();
      });

      // Try to save without reason or amount
      const saveDraftButton = screen.getByRole("button", {
        name: /save draft/i,
      });
      await userEvent.click(saveDraftButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/please fix the following errors/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(mockCreateCreditNote).not.toHaveBeenCalled();
    });

    it("should allow save with manual credit amount and reason", async () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("invoiceId=337"), sinon.stub()]);

      mockCreateCreditNote.mockResolvedValue({
        id: 108,
        status: "draft",
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/INV-202512-0042/)).toBeInTheDocument();
      });

      // Fill required fields
      const reasonSelect = screen.getByDisplayValue("Select reason...");
      await userEvent.selectOptions(reasonSelect, "goodwill_credit");

      const manualCreditInput = screen.getByTestId("manual-credit-amount");
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, "500");

      // Select settlement method (required when manual credit amount > 0)
      const settlementMethodSelect = screen.getByDisplayValue("Select settlement method...");
      await userEvent.selectOptions(settlementMethodSelect, "credit_adjustment");

      // Save
      const saveDraftButton = screen.getByRole("button", {
        name: /save draft/i,
      });
      await userEvent.click(saveDraftButton);

      // Should succeed
      await waitFor(() => {
        assert.ok(mockCreateCreditNote.called);
      });
    });
  });

  // ============================================
  // Issue Tax Document Workflow
  // ============================================

  describe("Issue Tax Document Workflow", () => {
    it("should issue credit note immediately (skip draft)", async () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("invoiceId=337"), sinon.stub()]);

      mockCreateCreditNote.mockResolvedValue({
        id: 108,
        status: "issued",
      });

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/INV-202512-0042/)).toBeInTheDocument();
      });

      // Fill form
      const reasonSelect = screen.getByDisplayValue("Select reason...");
      await userEvent.selectOptions(reasonSelect, "goodwill_credit");

      const manualCreditInput = screen.getByTestId("manual-credit-amount");
      await userEvent.clear(manualCreditInput);
      await userEvent.type(manualCreditInput, "500");

      // Select settlement method (required when manual credit amount > 0)
      const settlementMethodSelect = screen.getByDisplayValue("Select settlement method...");
      await userEvent.selectOptions(settlementMethodSelect, "credit_adjustment");

      // Click "Issue Tax Document" instead of "Save Draft"
      const issueButton = screen.getByRole("button", {
        name: /issue tax document/i,
      });
      await userEvent.click(issueButton);

      // Should save with issued status
      await waitFor(() => {
        assert.ok(mockCreateCreditNote.called);
        const callArgs = mockCreateCreditNote.mock.calls[0][0];
        expect(callArgs.status).toBe("issued");
      });
    });
  });
});
