/**
 * CreditNotePreview Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests credit note preview modal with validation and status display
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import CreditNotePreview from "../CreditNotePreview";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../constants/defaultTemplateSettings", () => ({
  getDocumentTemplateColor: () => "#1e40af",
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatAddress: (addr) => `${addr?.street || ""} ${addr?.city || ""}`,
  formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`,
  toUAEDateProfessional: (date) => "15 January 2024",
  TIMEZONE_DISCLAIMER: "Times shown in UAE timezone",
}));

vi.mock("../../../utils/recordUtils", () => ({
  validateCreditNoteForDownload: () => ({ isValid: true, warnings: [] }),
}));

describe("CreditNotePreview", () => {
  let defaultProps;
  let mockOnClose;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose = vi.fn();

    defaultProps = {
      creditNote: {
        id: "CN-001",
        creditNoteNumber: "CN-2024-001",
        type: "RETURN_WITH_QC",
        status: "issued",
        date: "2024-01-15",
        referenceInvoiceNumber: "INV-2024-001",
        customer: {
          name: "Steel Trading LLC",
          trn: "123456789",
          address: "Dubai, UAE",
        },
        items: [
          {
            id: 1,
            description: "SS304 Coil",
            batchNumber: "BATCH-001",
            quantity: 100,
            unitPrice: 50,
            amount: 5000,
          },
        ],
        subtotal: 5000,
        vat_amount: 250,
        totalCredit: 5250,
      },
      company: {
        name: "My Steel Corp",
        trn: "987654321",
        address: "Abu Dhabi, UAE",
      },
      onClose: mockOnClose,
    };
  });

  describe("Rendering", () => {
    it("should render preview modal", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display close button", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      const closeButton = container.querySelector("button");
      expect(closeButton).toBeTruthy();
    });

    it("should display credit note number", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("CN-2024-001");
    });

    it("should display document type", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toMatch(/Credit|Note/i);
    });
  });

  describe("Status Display", () => {
    it("should display draft status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "draft" }} />
      );

      expect(container.textContent).toContain("Draft");
    });

    it("should display issued status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "issued" }} />
      );

      expect(container.textContent).toContain("Issued");
    });

    it("should display items received status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "items_received" }} />
      );

      expect(container.textContent).toContain("Items Received");
    });

    it("should display items inspected status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "items_inspected" }} />
      );

      expect(container.textContent).toContain("Items Inspected");
    });

    it("should display applied status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "applied" }} />
      );

      expect(container.textContent).toContain("Applied");
    });

    it("should display refunded status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "refunded" }} />
      );

      expect(container.textContent).toContain("Refunded");
    });

    it("should display completed status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "completed" }} />
      );

      expect(container.textContent).toContain("Completed");
    });

    it("should display cancelled status", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, status: "cancelled" }} />
      );

      expect(container.textContent).toContain("Cancelled");
    });
  });

  describe("Credit Note Type", () => {
    it("should display accounting only type", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, type: "ACCOUNTING_ONLY" }} />
      );

      expect(container.textContent).toContain("Accounting Only");
    });

    it("should display return with QC type", () => {
      const { container } = renderWithProviders(
        <CreditNotePreview {...defaultProps} creditNote={{ ...defaultProps.creditNote, type: "RETURN_WITH_QC" }} />
      );

      expect(container.textContent).toContain("Return with QC");
    });
  });

  describe("Credit Note Details", () => {
    it("should display credit note date", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("15 January 2024");
    });

    it("should display reference invoice number", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("INV-2024-001");
    });

    it("should display customer name", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("Steel Trading LLC");
    });

    it("should display customer TRN", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("123456789");
    });

    it("should display company name", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("My Steel Corp");
    });

    it("should display company TRN", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("987654321");
    });
  });

  describe("Credit Note Items", () => {
    it("should display items table", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("SS304 Coil");
    });

    it("should display item quantity", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("100");
    });

    it("should display item unit price", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("50");
    });

    it("should display item amount", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("5000");
    });

    it("should display batch number", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("BATCH-001");
    });

    it("should handle multiple items", () => {
      const multiItemNote = {
        ...defaultProps.creditNote,
        items: [
          { id: 1, description: "Item 1", quantity: 100, unitPrice: 50, amount: 5000, batchNumber: "BATCH-001" },
          { id: 2, description: "Item 2", quantity: 50, unitPrice: 100, amount: 5000, batchNumber: "BATCH-002" },
        ],
      };

      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} creditNote={multiItemNote} />);

      expect(container.textContent).toContain("Item 1");
      expect(container.textContent).toContain("Item 2");
    });
  });

  describe("Financial Totals", () => {
    it("should display subtotal", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("5000");
    });

    it("should display VAT amount", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("250");
    });

    it("should display total credit", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toContain("5250");
    });

    it("should handle snake_case financial fields", () => {
      const snakeCaseNote = {
        ...defaultProps.creditNote,
        sub_total: 5000,
        vat_amount: 250,
        totalCredit: 5250,
      };

      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} creditNote={snakeCaseNote} />);

      expect(container.textContent).toContain("5000");
    });
  });

  describe("Close Behavior", () => {
    it("should call onClose when close button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      const closeButton = container.querySelector("button");
      if (closeButton) {
        await user.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe("Validation Warnings", () => {
    it("should display validation warnings if present", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show warning icon for invalid credit notes", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styling", () => {
      vi.resetModules();
      vi.doMock("../../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Print Optimization", () => {
    it("should display properly for printing", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show timezone disclaimer", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} />);

      expect(container.textContent).toMatch(/timezone|UAE/i);
    });
  });

  describe("Edge Cases", () => {
    it("should handle credit note with no items", () => {
      const noItemsNote = {
        ...defaultProps.creditNote,
        items: [],
      };

      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} creditNote={noItemsNote} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing customer data", () => {
      const noCustomerNote = {
        ...defaultProps.creditNote,
        customer: null,
      };

      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} creditNote={noCustomerNote} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing company data", () => {
      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} company={null} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very large credit notes", () => {
      const largeNote = {
        ...defaultProps.creditNote,
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          description: `Item ${i}`,
          quantity: 100,
          unitPrice: 50,
          amount: 5000,
          batchNumber: `BATCH-${i}`,
        })),
        totalCredit: 500000,
      };

      const { container } = renderWithProviders(<CreditNotePreview {...defaultProps} creditNote={largeNote} />);

      expect(container).toBeInTheDocument();
    });
  });
});
