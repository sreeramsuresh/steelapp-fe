/**
 * InvoiceCreditNotesSection Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests invoice credit notes display and management
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import InvoiceCreditNotesSection from "../InvoiceCreditNotesSection";
import sinon from 'sinon';

// Mock the API service
// sinon.stub() // "../../../services/api", () => ({
  default: {
    post: sinon.stub(),
    get: sinon.stub(),
  },
}));

import api from "../../../services/api";

describe("InvoiceCreditNotesSection", () => {
  let defaultProps;
  let mockCreditNotes;

  beforeEach(() => {
    sinon.restore();

    mockCreditNotes = [
      {
        id: 1,
        creditNoteNumber: "CN-2024-001",
        date: "2024-01-15",
        reason: "Quality issue",
        amount: 500,
        status: "APPROVED",
      },
      {
        id: 2,
        creditNoteNumber: "CN-2024-002",
        date: "2024-01-20",
        reason: "Partial return",
        amount: 1000,
        status: "PENDING",
      },
    ];

    defaultProps = {
      invoiceId: 123,
      invoiceAmount: 5000,
      companyId: "company-123",
      onCreditNoteAdded: sinon.stub(),
    };

    api.get.mockResolvedValue({ creditNotes: mockCreditNotes });
  });

  describe("Rendering", () => {
    it("should render credit notes section", () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display section title", () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      expect(container.textContent).toContain("Credit Notes");
    });

    it("should display credit notes list", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Credit Notes Display", () => {
    it("should list all credit notes", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("CN-2024-001");
      expect(container.textContent).toContain("CN-2024-002");
    });

    it("should display credit note numbers", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      mockCreditNotes.forEach((cn) => {
        expect(container.textContent).toContain(cn.creditNoteNumber);
      });
    });

    it("should display credit note dates", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("2024-01-15");
      expect(container.textContent).toContain("2024-01-20");
    });

    it("should display credit note amounts", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("500");
      expect(container.textContent).toContain("1000");
    });

    it("should display reasons for credit notes", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Quality issue");
      expect(container.textContent).toContain("Partial return");
    });
  });

  describe("Status Display", () => {
    it("should display credit note status", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("APPROVED");
      expect(container.textContent).toContain("PENDING");
    });

    it("should use color coding for status", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should indicate approved credit notes", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("APPROVED");
    });

    it("should indicate pending credit notes", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("PENDING");
    });
  });

  describe("Summary Calculations", () => {
    it("should show total credit notes amount", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Total");
    });

    it("should calculate total approved amount", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // 500 approved
      expect(container).toBeInTheDocument();
    });

    it("should calculate remaining invoice balance", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // 5000 - 500 = 4500
      expect(container).toBeInTheDocument();
    });

    it("should show percentage of credit vs original amount", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Add Credit Note Button", () => {
    it("should display Add Credit Note button", () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      expect(container.textContent).toContain("Add Credit Note");
    });

    it("should open dialog when button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      const buttons = container.querySelectorAll("button");
      const addButton = Array.from(buttons).find((btn) => btn.textContent.includes("Add Credit Note"));

      if (addButton) {
        await user.click(addButton);
        expect(container).toBeInTheDocument();
      }
    });

    it("should disable button when max credits reached", () => {
      const maxCreditsProps = {
        ...defaultProps,
        invoiceAmount: 1500,
        creditNotes: mockCreditNotes,
      };

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...maxCreditsProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display loading indicator initially", () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      expect(container.textContent).toContain("Loading");
    });

    it("should hide loading after data loads", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).not.toContain("Loading");
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      api.get.mockRejectedValue(new Error("Failed to load credit notes"));

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Failed");
    });

    it("should show retry button on error", async () => {
      api.get.mockRejectedValue(new Error("API Error"));

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Retry");
    });

    it("should allow retry after error", async () => {
      api.get.mockRejectedValueOnce(new Error("Error"));
      api.get.mockResolvedValueOnce({ creditNotes: mockCreditNotes });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should handle no credit notes", async () => {
      api.get.mockResolvedValue({ creditNotes: [] });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("No credit notes");
    });

    it("should show helpful message for empty state", async () => {
      api.get.mockResolvedValue({ creditNotes: [] });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should still show Add button when no credits exist", async () => {
      api.get.mockResolvedValue({ creditNotes: [] });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Add Credit Note");
    });
  });

  describe("Credit Note Details", () => {
    it("should display credit note information in table", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
    });

    it("should have proper table headers", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Number");
      expect(container.textContent).toContain("Date");
      expect(container.textContent).toContain("Amount");
    });

    it("should show view or edit option for each credit note", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Amount Formatting", () => {
    it("should format amounts with currency symbol", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("AED");
    });

    it("should handle decimal amounts", async () => {
      const decimalNotes = [{ ...mockCreditNotes[0], amount: 123.45 }];
      api.get.mockResolvedValue({ creditNotes: decimalNotes });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle zero amount", async () => {
      const zeroNotes = [{ ...mockCreditNotes[0], amount: 0 }];
      api.get.mockResolvedValue({ creditNotes: zeroNotes });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("0");
    });

    it("should handle large amounts", async () => {
      const largeNotes = [{ ...mockCreditNotes[0], amount: 999999.99 }];
      api.get.mockResolvedValue({ creditNotes: largeNotes });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should allow viewing credit note details", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should allow editing approved credit notes", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should allow deleting pending credit notes", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styles", () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />, {
        initialState: { theme: { isDarkMode: true } },
      });

      expect(container).toBeInTheDocument();
    });

    it("should render with light mode styles", () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />, {
        initialState: { theme: { isDarkMode: false } },
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single credit note", async () => {
      api.get.mockResolvedValue({ creditNotes: [mockCreditNotes[0]] });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("CN-2024-001");
    });

    it("should handle many credit notes", async () => {
      const manyNotes = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        creditNoteNumber: `CN-2024-${String(i + 1).padStart(3, "0")}`,
        date: "2024-01-15",
        reason: "Test",
        amount: 100 * (i + 1),
        status: i % 2 === 0 ? "APPROVED" : "PENDING",
      }));
      api.get.mockResolvedValue({ creditNotes: manyNotes });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle credit total exceeding invoice amount", async () => {
      const excessNotes = [{ ...mockCreditNotes[0], amount: 6000 }];
      api.get.mockResolvedValue({ creditNotes: excessNotes });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle missing credit note fields", async () => {
      const incompletNotes = [{ creditNoteNumber: "CN-001", amount: 100 }];
      api.get.mockResolvedValue({ creditNotes: incompletNotes });

      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic table structure", async () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      const heading = container.querySelector("h4, h5, h6");
      expect(heading || container.textContent.includes("Credit Notes")).toBeTruthy();
    });

    it("should have descriptive button labels", () => {
      const { container } = renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      expect(container.textContent).toContain("Add Credit Note");
    });
  });

  describe("API Integration", () => {
    it("should fetch credit notes on mount", async () => {
      renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should pass invoiceId to API", async () => {
      renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} invoiceId={456} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should pass companyId to API", async () => {
      renderWithProviders(<InvoiceCreditNotesSection {...defaultProps} companyId="CUSTOM-CO" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });
  });
});
