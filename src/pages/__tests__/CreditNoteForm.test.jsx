/**
 * E2E Tests for Credit Note Form - Date Format & Auto-Save
 *
 * Test Coverage:
 * 1. Date format handling (ISO timestamp -> yyyy-MM-dd)
 * 2. Manual credit amount auto-save (without items)
 * 3. Draft persistence across reload
 * 4. Save Draft button functionality
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import * as companyService from "../../services/companyService";
import * as creditNoteService from "../../services/creditNoteService";
import * as invoiceService from "../../services/invoiceService";
import CreditNoteForm from "../CreditNoteForm";
import sinon from 'sinon';

// Mock data
const _mockCreditNote = {
  id: 107,
  creditNoteNumber: "CN-2025-0007",
  invoiceId: 337,
  invoiceNumber: "INV-202512-0042",
  customerId: 8,
  customerName: "Emirates Fabrication",
  creditNoteDate: "2025-12-04T20:00:00.000Z", // ISO timestamp from backend
  status: "draft",
  reasonForReturn: "overcharge",
  creditNoteType: "ACCOUNTING_ONLY",
  manualCreditAmount: 0,
  items: [],
  subtotal: 0,
  vatAmount: 0,
  totalCredit: 0,
  notes: "",
  customer: {
    id: 8,
    name: "Emirates Fabrication",
    address: {
      street: "123 Business Bay",
      city: "Dubai",
      state: "Dubai",
      postal_code: "12345",
      country: "UAE",
    },
    phone: "+971501234567",
    email: "contact@emiratesfab.ae",
    trn: "123456789012345",
  },
};

const mockInvoice = {
  id: 337,
  invoiceNumber: "INV-202512-0042",
  date: "2025-12-02T20:00:00.000Z", // ISO timestamp
  status: "issued",
  customerId: 8,
  customerName: "Emirates Fabrication",
  customer: {
    id: 8,
    name: "Emirates Fabrication",
    address: {
      street: "123 Business Bay",
      city: "Dubai",
      state: "Dubai",
      postal_code: "12345",
      country: "UAE",
    },
    phone: "+971501234567",
    email: "contact@emiratesfab.ae",
    trn: "123456789012345",
  },
  items: [
    {
      id: 1,
      productId: 10,
      name: "Stainless Steel Sheet",
      description: "304 Grade",
      quantity: 11,
      rate: 222,
      amount: 2442,
      vatRate: 5,
      vatAmount: 122.1,
    },
    {
      id: 2,
      productId: 20,
      name: "Stainless Steel Pipe",
      description: "316 Grade",
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
  name: "Ultimate Steel Trading LLC",
  trn: "100123456789012",
  logoUrl: "/uploads/logo.png",
};

// Mock services
// sinon.stub() // "../../services/creditNoteService", () => ({
  creditNoteService: {
    getCreditNote: sinon.stub(),
    getNextCreditNoteNumber: sinon.stub(),
    createCreditNote: sinon.stub(),
    updateCreditNote: sinon.stub(),
  },
}));

// sinon.stub() // "../../services/invoiceService", () => ({
  invoiceService: {
    getInvoice: sinon.stub(),
    searchForCreditNote: sinon.stub(),
  },
}));

// sinon.stub() // "../../services/companyService", () => ({
  companyService: {
    getCompany: sinon.stub(),
  },
}));

// sinon.stub() // "../../services/notificationService", () => ({
  notificationService: {
    success: sinon.stub(),
    error: sinon.stub(),
    warning: sinon.stub(),
    info: sinon.stub(),
  },
}));

// DON'T mock useCreditNoteDrafts - use the real implementation
// The real hook properly reads from localStorage which the tests setup
// Mocking it prevents conflict detection from working

// Mock router hooks - hoist for vi.mock
const { mockNavigate, mockUseParams, mockUseSearchParams } = // Hoisted: {
  mockNavigate: sinon.stub(),
  mockUseParams: vi.fn(() => ({ id: undefined })),
  mockUseSearchParams: vi.fn(() => [new URLSearchParams(), sinon.stub()]),
}));

// sinon.stub() // "react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
});

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>{children}</ThemeProvider>
  </BrowserRouter>
);

describe("Credit Note Form - Date Format & Auto-Save Tests", () => {
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

    // Reset router mocks to defaults
    mockUseParams.mockReturnValue({ id: undefined });
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), sinon.stub()]);

    // No need to reset useCreditNoteDrafts mocks - we're using the real implementation

    // Setup service mocks with default implementations
    creditNoteService.creditNoteService.getNextCreditNoteNumber.mockResolvedValue({
      nextNumber: "CN-2025-0008",
    });

    companyService.companyService.getCompany.mockResolvedValue(mockCompany);

    // Mock searchForCreditNote to return empty array by default
    invoiceService.invoiceService.searchForCreditNote.mockResolvedValue([]);
  });

  afterEach(() => {
    sinon.restore();
    localStorageMock = {};
  });

  // ============================================
  // Test Suite 1: Date Format Handling
  // ============================================

  describe("Suite 1: Date Format Handling", () => {
    it("Test 2: Resume draft with ISO timestamp and verify formatted date", async () => {
      // Setup draft in localStorage with ISO timestamp
      const draftData = {
        337: {
          data: {
            invoiceId: 337,
            invoiceNumber: "INV-202512-0042",
            creditNoteNumber: "CN-2025-0008",
            creditNoteDate: "2025-12-03T20:00:00.000Z", // ISO timestamp
            reasonForReturn: "goodwill_credit",
            creditNoteType: "ACCOUNTING_ONLY",
            manualCreditAmount: 750,
            items: [],
            customer: mockInvoice.customer,
          },
          invoiceId: 337,
          invoiceNumber: "INV-202512-0042",
          customerName: "Emirates Fabrication",
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000, // 24 hours
        },
      };

      localStorageMock.credit_note_drafts = JSON.stringify(draftData);

      // Mock search params to load invoice
      mockUseSearchParams.mockReturnValue([new URLSearchParams("?invoiceId=337"), sinon.stub()]);

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      const { container } = render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      // Wait for conflict modal or resume banner
      await waitFor(
        () => {
          expect(screen.getByRole("button", { name: /resume draft/i })).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click resume draft button
      const resumeButton = screen.getByRole("button", {
        name: /resume draft/i,
      });
      await userEvent.click(resumeButton);

      // Wait for draft to be loaded
      await waitFor(() => {
        const dateInput = container.querySelector('input[type="date"]');
        expect(dateInput).toBeInTheDocument();
        // ISO: 2025-12-03T20:00:00.000Z should become 2025-12-04 in UAE timezone
        expect(dateInput.value).toBe("2025-12-04");
      });
    });
  });

  // ============================================
  // Test Suite 2: Draft Persistence
  // ============================================

  describe("Suite 2: Draft Persistence", () => {
    it("Test 5: Draft persistence across reload", async () => {
      // Setup existing draft
      const existingDraft = {
        337: {
          data: {
            invoiceId: 337,
            invoiceNumber: "INV-202512-0042",
            creditNoteNumber: "CN-2025-0008",
            creditNoteDate: "2025-12-05",
            reasonForReturn: "goodwill_credit",
            creditNoteType: "ACCOUNTING_ONLY",
            manualCreditAmount: 500,
            items: [],
            customer: mockInvoice.customer,
          },
          invoiceId: 337,
          invoiceNumber: "INV-202512-0042",
          customerName: "Emirates Fabrication",
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000,
        },
      };

      localStorageMock.credit_note_drafts = JSON.stringify(existingDraft);

      mockUseSearchParams.mockReturnValue([new URLSearchParams("?invoiceId=337"), sinon.stub()]);

      invoiceService.invoiceService.getInvoice.mockResolvedValue(mockInvoice);

      render(
        <TestWrapper>
          <CreditNoteForm />
        </TestWrapper>
      );

      // Check that "Resume Draft" banner appears
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /resume draft/i })).toBeInTheDocument();
      });

      // Click Resume Draft
      const resumeButton = screen.getByRole("button", {
        name: /resume draft/i,
      });
      await userEvent.click(resumeButton);

      // Verify manual amount is restored
      await waitFor(() => {
        const manualCreditInput = screen.getByTestId("manual-credit-amount");
        expect(manualCreditInput.value).toBe("500");
      });
    });
  });
});
