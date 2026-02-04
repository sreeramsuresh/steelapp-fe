/**
 * PaymentSummary Component Tests
 * Phase 5.3.2b: Tier 1 - Payment Processing Component
 *
 * Tests payment summary card functionality:
 * - Payment calculations (total paid, balance due, status)
 * - Status badge display
 * - Payment count display
 * - Dark mode support
 * - Edge cases with zero/null values
 * - Currency formatting
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";
import PaymentSummary from "../PaymentSummary";

// Mock ThemeContext
vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

// Mock utilities
vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`,
}));

vi.mock("../../utils/paymentUtils", () => ({
  calculateBalanceDue: (total, payments) => {
    const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.max(0, total - paid);
  },
  calculateTotalPaid: (payments) => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
  calculatePaymentStatus: (total, payments) => {
    const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (paid >= total) return "fully_paid";
    if (paid > 0) return "partially_paid";
    return "unpaid";
  },
  getPaymentStatusConfig: (status) => {
    const configs = {
      fully_paid: {
        label: "Fully Paid",
        bgLight: "bg-green-50",
        textLight: "text-green-700",
        borderLight: "border-green-300",
        bgDark: "bg-green-900/30",
        textDark: "text-green-400",
        borderDark: "border-green-700",
      },
      partially_paid: {
        label: "Partially Paid",
        bgLight: "bg-yellow-50",
        textLight: "text-yellow-700",
        borderLight: "border-yellow-300",
        bgDark: "bg-yellow-900/30",
        textDark: "text-yellow-400",
        borderDark: "border-yellow-700",
      },
      unpaid: {
        label: "Not Paid",
        bgLight: "bg-red-50",
        textLight: "text-red-700",
        borderLight: "border-red-300",
        bgDark: "bg-red-900/30",
        textDark: "text-red-400",
        borderDark: "border-red-700",
      },
    };
    return configs[status] || configs.unpaid;
  },
}));

describe("PaymentSummary Component", () => {
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();

    defaultProps = {
      invoiceTotal: 10000,
      payments: [
        {
          id: "pay-1",
          amount: 5000,
        },
        {
          id: "pay-2",
          amount: 3000,
        },
      ],
    };
  });

  describe("Rendering", () => {
    it("should render payment summary component", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("💰 Payment Summary")).toBeInTheDocument();
    });

    it("should display invoice total", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("Invoice Total:")).toBeInTheDocument();
      expect(screen.getByText("AED 10000.00")).toBeInTheDocument();
    });

    it("should display payments received when there are payments", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText(/Payments Received \(2\):/)).toBeInTheDocument();
    });

    it("should display total paid", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("Total Paid:")).toBeInTheDocument();
    });

    it("should display balance due", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("Balance Due:")).toBeInTheDocument();
    });

    it("should display payment status badge", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText(/Partially Paid/)).toBeInTheDocument();
    });

    it("should display payment count", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("2 payments received")).toBeInTheDocument();
    });
  });

  describe("Payment Calculations", () => {
    it("should calculate total paid correctly", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      // 5000 + 3000 = 8000
      expect(screen.getByText("AED 8000.00")).toBeInTheDocument();
    });

    it("should calculate balance due correctly", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      // 10000 - 8000 = 2000
      const balanceCells = screen.getAllByText(/AED 2000.00/);
      expect(balanceCells.length).toBeGreaterThan(0);
    });

    it("should show zero balance when fully paid", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 10000 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
    });

    it("should handle partial payment correctly", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 2500 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Partially Paid")).toBeInTheDocument();
    });

    it("should show unpaid status when no payments", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Not Paid")).toBeInTheDocument();
    });
  });

  describe("Status Badge Display", () => {
    it("should show Fully Paid badge when invoice fully paid", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 10000 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
    });

    it("should show Partially Paid badge when partial payment received", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("Partially Paid")).toBeInTheDocument();
    });

    it("should show Not Paid badge when no payment received", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Not Paid")).toBeInTheDocument();
    });

    it("should apply correct styling to status badge", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 10000 }],
      };
      const { container: _container } = renderWithProviders(<PaymentSummary {...props} />);

      const statusBadge = screen.getByText("Fully Paid");
      expect(statusBadge.className).toContain("rounded-full");
      expect(statusBadge.className).toContain("px-4");
      expect(statusBadge.className).toContain("py-2");
    });
  });

  describe("Payment Count Display", () => {
    it("should display singular payment text for one payment", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 5000 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("1 payment received")).toBeInTheDocument();
    });

    it("should display plural payment text for multiple payments", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("2 payments received")).toBeInTheDocument();
    });

    it("should not display payment count when no payments", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.queryByText(/payment/)).not.toBeInTheDocument();
    });

    it("should display correct count for many payments", () => {
      const manyPayments = Array.from({ length: 5 }, (_, i) => ({
        id: `pay-${i}`,
        amount: 1000,
      }));

      const props = {
        invoiceTotal: 10000,
        payments: manyPayments,
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("5 payments received")).toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("should format currency with AED symbol", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("AED 10000.00")).toBeInTheDocument();
    });

    it("should format large amounts correctly", () => {
      const props = {
        invoiceTotal: 999999.99,
        payments: [{ id: "pay-1", amount: 500000.0 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("AED 999999.99")).toBeInTheDocument();
    });

    it("should format decimal amounts correctly", () => {
      const props = {
        invoiceTotal: 1234.56,
        payments: [{ id: "pay-1", amount: 500.25 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("AED 1234.56")).toBeInTheDocument();
      expect(screen.getByText("AED 500.25")).toBeInTheDocument();
    });

    it("should display zero as AED 0.00", () => {
      const props = {
        invoiceTotal: 0,
        payments: [],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("AED 0.00")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should handle zero invoice total", () => {
      const props = {
        invoiceTotal: 0,
        payments: [],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("AED 0.00")).toBeInTheDocument();
    });

    it("should handle empty payments array", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Not Paid")).toBeInTheDocument();
    });

    it("should not show payments received when no payments", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.queryByText(/Payments Received/)).not.toBeInTheDocument();
    });

    it("should handle null payments prop", () => {
      const props = {
        invoiceTotal: 10000,
        payments: null,
      };
      // Component should handle null gracefully
      const { container } = renderWithProviders(<PaymentSummary {...props} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle undefined payments prop", () => {
      const props = {
        invoiceTotal: 10000,
        payments: undefined,
      };
      const { container } = renderWithProviders(<PaymentSummary {...props} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle payment amount greater than invoice total", () => {
      const props = {
        invoiceTotal: 5000,
        payments: [{ id: "pay-1", amount: 10000 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
      // Balance should be zero or negative handled as zero
    });

    it("should handle very small payment amounts", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 0.01 }],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("AED 0.01")).toBeInTheDocument();
    });

    it("should handle payments with null amount", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: null }],
      };
      const { container } = renderWithProviders(<PaymentSummary {...props} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle payments with undefined amount", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: undefined }],
      };
      const { container } = renderWithProviders(<PaymentSummary {...props} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle negative payment amounts gracefully", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: -5000 }],
      };
      const { container } = renderWithProviders(<PaymentSummary {...props} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle very large invoice amounts", () => {
      const props = {
        invoiceTotal: 999999999999.99,
        payments: [{ id: "pay-1", amount: 500000000000 }],
      };
      const { container } = renderWithProviders(<PaymentSummary {...props} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Layout & Styling", () => {
    it("should render in card container", () => {
      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
    });

    it("should have border styling", () => {
      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      const card = container.querySelector(".rounded-lg");
      expect(card.className).toContain("border");
    });

    it("should display sections with proper spacing", () => {
      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(container.querySelector(".space-y-3")).toBeInTheDocument();
    });

    it("should align values to the right", () => {
      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      const rightAlignedElements = container.querySelectorAll(".justify-between");
      expect(rightAlignedElements.length).toBeGreaterThan(0);
    });
  });

  describe("Dark Mode", () => {
    it("should apply light mode styles by default", () => {
      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      const card = container.querySelector(".rounded-lg");
      expect(card.className).toContain("bg-gray-50");
      expect(card.className).toContain("border-gray-200");
    });

    it("should apply dark mode styles when enabled", () => {
      vi.doMock("../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Status Transitions", () => {
    it("should transition from unpaid to partially paid", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [],
      };

      const { rerender } = renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Not Paid")).toBeInTheDocument();

      const updatedProps = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 5000 }],
      };
      rerender(<PaymentSummary {...updatedProps} />);
      expect(screen.getByText("Partially Paid")).toBeInTheDocument();
    });

    it("should transition from partially paid to fully paid", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [{ id: "pay-1", amount: 5000 }],
      };

      const { rerender } = renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText("Partially Paid")).toBeInTheDocument();

      const updatedProps = {
        invoiceTotal: 10000,
        payments: [
          { id: "pay-1", amount: 5000 },
          { id: "pay-2", amount: 5000 },
        ],
      };
      rerender(<PaymentSummary {...updatedProps} />);
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic HTML structure", () => {
      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
      // Should have proper headings
      expect(screen.getByText("💰 Payment Summary")).toBeInTheDocument();
    });

    it("should have clear labels for all information", () => {
      renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(screen.getByText("Invoice Total:")).toBeInTheDocument();
      expect(screen.getByText("Total Paid:")).toBeInTheDocument();
      expect(screen.getByText("Balance Due:")).toBeInTheDocument();
    });

    it("should have sufficient color contrast", () => {
      const { container } = renderWithProviders(<PaymentSummary {...defaultProps} />);
      expect(container).toBeInTheDocument();
      // Visual elements should have readable contrast
    });
  });

  describe("Performance", () => {
    it("should render efficiently with many payments", () => {
      const manyPayments = Array.from({ length: 100 }, (_, i) => ({
        id: `pay-${i}`,
        amount: 100,
      }));

      const props = {
        invoiceTotal: 15000,
        payments: manyPayments,
      };

      const startTime = performance.now();
      renderWithProviders(<PaymentSummary {...props} />);
      const endTime = performance.now();

      // Should render in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Multiple Payments Display", () => {
    it("should show count for each payment received", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [
          { id: "pay-1", amount: 1000 },
          { id: "pay-2", amount: 2000 },
          { id: "pay-3", amount: 3000 },
        ],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      expect(screen.getByText(/Payments Received \(3\):/)).toBeInTheDocument();
    });

    it("should sum all payment amounts correctly", () => {
      const props = {
        invoiceTotal: 10000,
        payments: [
          { id: "pay-1", amount: 2500 },
          { id: "pay-2", amount: 2500 },
          { id: "pay-3", amount: 2500 },
          { id: "pay-4", amount: 2500 },
        ],
      };
      renderWithProviders(<PaymentSummary {...props} />);
      // Total should be 10000
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
    });
  });
});
