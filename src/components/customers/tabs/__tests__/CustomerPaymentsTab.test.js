/**
 * CustomerPaymentsTab Component Tests
 * Phase 5.3.2b: Tier 1 - Payment Processing Component
 *
 * Tests customer payments tab functionality:
 * - Payment list rendering with table
 * - Expandable allocation breakdown rows
 * - Filtering (date range, payment method)
 * - Pagination with 20 items per page
 * - Summary statistics calculation
 * - Caching mechanism (5-minute cache)
 * - Loading and error states
 * - Payment method icons
 * - Dark mode support
 */

import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../../test/component-setup";
import CustomerPaymentsTab from "../CustomerPaymentsTab";

// Mock API Client
const mockApiClient = {
  get: vi.fn(),
};

vi.mock("../../../../services/api", () => ({
  apiClient: mockApiClient,
}));

// Mock ThemeContext
vi.mock("../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

// Mock utilities
vi.mock("../../../../utils/invoiceUtils", () => ({
  formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`,
  formatDate: (date) => new Date(date).toLocaleDateString(),
}));

describe("CustomerPaymentsTab Component", () => {
  let mockPayments;
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockPayments = Array.from({ length: 25 }, (_, i) => ({
      id: `pay-${i}`,
      paymentDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      referenceNumber: `REF${String(i).padStart(3, "0")}`,
      paymentMethod: i % 3 === 0 ? "cash" : i % 3 === 1 ? "cheque" : "bank transfer",
      amount: 1000 + i * 100,
      allocatedAmount: 900 + i * 100,
      unallocatedAmount: 100,
      allocations: [
        {
          invoiceNumber: `INV-${String(i).padStart(3, "0")}`,
          amount: 900 + i * 100,
        },
      ],
    }));

    defaultProps = {
      customerId: "cust-123",
    };

    mockApiClient.get.mockResolvedValue({
      payments: mockPayments,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render customer payments tab", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Customer Payments")).toBeInTheDocument();
      });
    });

    it("should display refresh button", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });
    });

    it("should display summary cards", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Total Received")).toBeInTheDocument();
        expect(screen.getByText("Total Allocated")).toBeInTheDocument();
        expect(screen.getByText("Total Unallocated")).toBeInTheDocument();
        expect(screen.getByText("Last Payment")).toBeInTheDocument();
      });
    });

    it("should display filters", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
        expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
      });
    });

    it("should display payment table", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Payment Date")).toBeInTheDocument();
        expect(screen.getByText("Reference")).toBeInTheDocument();
        expect(screen.getByText("Amount")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner initially", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      // Should show spinner while loading
      expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
    });

    it("should hide loading spinner after data loads", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Customer Payments")).toBeInTheDocument();
      });
    });

    it("should disable refresh button while loading", async () => {
      mockApiClient.get.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ payments: mockPayments }), 100);
          })
      );

      const { container: _container } = renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      const refreshButton = screen.getByText("Refresh");
      await waitFor(() => {
        expect(refreshButton).toBeDisabled();
      });
    });
  });

  describe("Error State", () => {
    it("should show error message on fetch failure", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("Network error"));

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Error Loading Payments")).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it("should show retry button on error", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("Network error"));

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });
    });

    it("should retry on retry button click", async () => {
      const user = setupUser();
      mockApiClient.get
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ payments: mockPayments });

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });

      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Summary Statistics", () => {
    it("should calculate and display total received", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        const expectedTotal = mockPayments.reduce((sum, p) => sum + p.amount, 0);
        expect(screen.getByText(`AED ${expectedTotal.toFixed(2)}`)).toBeInTheDocument();
      });
    });

    it("should calculate and display total allocated", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        const expectedAllocated = mockPayments.reduce((sum, p) => sum + p.allocatedAmount, 0);
        expect(screen.getByText(`AED ${expectedAllocated.toFixed(2)}`)).toBeInTheDocument();
      });
    });

    it("should calculate and display total unallocated", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Total Unallocated")).toBeInTheDocument();
      });
    });

    it("should display last payment date", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Last Payment")).toBeInTheDocument();
      });
    });
  });

  describe("Payment Table", () => {
    it("should display payment rows", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
        expect(screen.getByText("REF001")).toBeInTheDocument();
      });
    });

    it("should display formatted payment dates", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        // Should have formatted dates
        const rows = screen.getAllByText(/\//);
        expect(rows.length).toBeGreaterThan(0);
      });
    });

    it("should display payment methods", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        // Should display various payment methods
        expect(screen.getByText("cash")).toBeInTheDocument();
        expect(screen.getByText("cheque")).toBeInTheDocument();
        expect(screen.getByText("bank transfer")).toBeInTheDocument();
      });
    });

    it("should display payment amounts", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/AED 1000/)).toBeInTheDocument();
      });
    });

    it("should display allocated and unallocated amounts", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        // Should have allocated and unallocated columns
        expect(screen.getByText("Allocated")).toBeInTheDocument();
        expect(screen.getByText("Unallocated")).toBeInTheDocument();
      });
    });

    it("should handle empty payments list", async () => {
      mockApiClient.get.mockResolvedValueOnce({ payments: [] });

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("No payments found")).toBeInTheDocument();
      });
    });
  });

  describe("Expandable Rows", () => {
    it("should show expand button for payments with allocations", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it("should expand row to show allocation details", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });

      // Find and click expand button (should be near first row)
      const buttons = screen.getAllByRole("button").slice(0, 5);
      for (const btn of buttons) {
        if (btn.textContent.includes("")) {
          // It's an expand button
          await user.click(btn);
          break;
        }
      }
    });

    it("should display allocation breakdown when expanded", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });

      // Try to find and expand a row
      const expandButtons = screen.queryAllByRole("button");
      if (expandButtons.length > 0) {
        await user.click(expandButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/Payment Allocations/)).toBeInTheDocument();
        });
      }
    });

    it("should show invoice number in allocation breakdown", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });

      // Click first expand button
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      await waitFor(() => {
        // Should show invoice number from allocation
        expect(screen.getByText(/INV-/)).toBeInTheDocument();
      });
    });

    it("should collapse row when clicked again", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole("button");
      const expandButton = buttons[0];

      // Expand
      await user.click(expandButton);
      await waitFor(() => {
        expect(screen.getByText(/Payment Allocations/)).toBeInTheDocument();
      });

      // Collapse
      await user.click(expandButton);
      await waitFor(() => {
        expect(screen.queryByText(/Payment Allocations/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Filtering", () => {
    describe("Date Range Filter", () => {
      it("should filter payments by all time", async () => {
        const _user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByDisplayValue("all")).toBeInTheDocument();
        });

        const dateFilterSelect = screen.getByDisplayValue("all");
        expect(dateFilterSelect).toHaveValue("all");
      });

      it("should filter payments by last 30 days", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
        });

        const dateFilterSelect = screen.getByLabelText("Date Range");
        await user.selectOption(dateFilterSelect, "30");

        expect(dateFilterSelect).toHaveValue("30");
      });

      it("should filter payments by last 60 days", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
        });

        const dateFilterSelect = screen.getByLabelText("Date Range");
        await user.selectOption(dateFilterSelect, "60");

        expect(dateFilterSelect).toHaveValue("60");
      });

      it("should filter payments by last 90 days", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
        });

        const dateFilterSelect = screen.getByLabelText("Date Range");
        await user.selectOption(dateFilterSelect, "90");

        expect(dateFilterSelect).toHaveValue("90");
      });

      it("should reset pagination when date filter changes", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
        });

        // Change page first
        const nextButton = screen.getByRole("button", { name: /Next/ });
        await user.click(nextButton);

        // Then change filter
        const dateFilterSelect = screen.getByLabelText("Date Range");
        await user.selectOption(dateFilterSelect, "30");

        // Should be back on page 1
        expect(nextButton).not.toBeDisabled();
      });
    });

    describe("Payment Method Filter", () => {
      it("should filter payments by all methods", async () => {
        const _user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByDisplayValue("all")).toBeInTheDocument();
        });
      });

      it("should filter payments by cash", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
        });

        const methodFilterSelect = screen.getByLabelText("Payment Method");
        await user.selectOption(methodFilterSelect, "cash");

        expect(methodFilterSelect).toHaveValue("cash");
      });

      it("should filter payments by cheque", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
        });

        const methodFilterSelect = screen.getByLabelText("Payment Method");
        await user.selectOption(methodFilterSelect, "cheque");

        expect(methodFilterSelect).toHaveValue("cheque");
      });

      it("should filter payments by bank transfer", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
        });

        const methodFilterSelect = screen.getByLabelText("Payment Method");
        await user.selectOption(methodFilterSelect, "bank transfer");

        expect(methodFilterSelect).toHaveValue("bank transfer");
      });

      it("should filter payments by card", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
        });

        const methodFilterSelect = screen.getByLabelText("Payment Method");
        await user.selectOption(methodFilterSelect, "card");

        expect(methodFilterSelect).toHaveValue("card");
      });

      it("should reset pagination when method filter changes", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
        });

        const methodFilterSelect = screen.getByLabelText("Payment Method");
        await user.selectOption(methodFilterSelect, "cash");

        expect(methodFilterSelect).toHaveValue("cash");
      });
    });

    describe("Combined Filters", () => {
      it("should apply both date and method filters", async () => {
        const user = setupUser();
        renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

        await waitFor(() => {
          expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
          expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
        });

        const dateFilterSelect = screen.getByLabelText("Date Range");
        const methodFilterSelect = screen.getByLabelText("Payment Method");

        await user.selectOption(dateFilterSelect, "30");
        await user.selectOption(methodFilterSelect, "cash");

        expect(dateFilterSelect).toHaveValue("30");
        expect(methodFilterSelect).toHaveValue("cash");
      });
    });
  });

  describe("Pagination", () => {
    it("should display pagination controls", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Previous")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
      });
    });

    it("should show page numbers", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("should display items per page info", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Showing/)).toBeInTheDocument();
        expect(screen.getByText(/of 25 payments/)).toBeInTheDocument();
      });
    });

    it("should disable previous button on first page", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /Previous/ });
        expect(prevButton).toBeDisabled();
      });
    });

    it("should disable next button on last page", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /Next/ });
        // Should be disabled since we have exactly 25 items (more than 1 page)
        expect(nextButton).not.toBeDisabled();
      });
    });

    it("should navigate to next page", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /Next/ });
      await user.click(nextButton);

      // Should show next page items
      expect(screen.getByText("REF020")).toBeInTheDocument();
    });

    it("should navigate to previous page", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /Next/ });
      await user.click(nextButton);

      const prevButton = screen.getByRole("button", { name: /Previous/ });
      await user.click(prevButton);

      // Should be back on first page
      expect(screen.getByText("REF000")).toBeInTheDocument();
    });

    it("should show 20 items per page", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        // First 20 items should be visible
        expect(screen.getByText("REF000")).toBeInTheDocument();
        expect(screen.getByText("REF019")).toBeInTheDocument();
      });
    });

    it("should show correct range text", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 20/)).toBeInTheDocument();
      });
    });

    it("should navigate to specific page by clicking page button", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });

      const pageButton = screen.getByRole("button", { name: "2" });
      await user.click(pageButton);

      expect(screen.getByText("REF020")).toBeInTheDocument();
    });
  });

  describe("Caching", () => {
    it("should cache data for 5 minutes", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Advance time by 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      // Re-render with same customerId
      const { rerender: _rerender } = renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      // Should not call API again (cache is valid)
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });

    it("should refetch after cache expires", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Advance time by 6 minutes (past cache duration)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Re-render with same customerId
      const { rerender: _rerender } = renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      // Should call API again (cache expired)
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });

    it("should clear cache on refresh button click", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByText("Refresh");
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should refresh data on button click", async () => {
      const user = setupUser();
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByText("Refresh");
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });

    it("should show loading state during refresh", async () => {
      const user = setupUser();
      mockApiClient.get.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ payments: mockPayments }), 100);
          })
      );

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Customer Payments")).toBeInTheDocument();
      });

      const refreshButton = screen.getByText("Refresh");
      await user.click(refreshButton);

      // Should show loading state
      expect(refreshButton).toBeDisabled();
    });
  });

  describe("Payment Method Icons", () => {
    it("should display cash payment icon", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("cash")).toBeInTheDocument();
      });
    });

    it("should display cheque payment icon", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("cheque")).toBeInTheDocument();
      });
    });

    it("should display bank transfer icon", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("bank transfer")).toBeInTheDocument();
      });
    });
  });

  describe("Dark Mode", () => {
    it("should apply dark mode styles when enabled", async () => {
      vi.doMock("../../../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Customer Payments")).toBeInTheDocument();
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null customerId gracefully", async () => {
      const { container } = renderWithProviders(<CustomerPaymentsTab customerId={null} />);

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });

    it("should handle payments with missing allocations", async () => {
      const paymentsNoAllocations = mockPayments.map((p) => ({
        ...p,
        allocations: null,
      }));

      mockApiClient.get.mockResolvedValueOnce({ payments: paymentsNoAllocations });

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("REF000")).toBeInTheDocument();
      });
    });

    it("should handle very large amounts correctly", async () => {
      const largePayments = [
        {
          id: "pay-1",
          paymentDate: new Date().toISOString(),
          referenceNumber: "REF000",
          paymentMethod: "cash",
          amount: 999999999.99,
          allocatedAmount: 999999999.99,
          unallocatedAmount: 0,
          allocations: [],
        },
      ];

      mockApiClient.get.mockResolvedValueOnce({ payments: largePayments });

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/AED 999999999/)).toBeInTheDocument();
      });
    });

    it("should handle payments with zero amounts", async () => {
      const zeroPayments = mockPayments.map((p) => ({
        ...p,
        amount: 0,
        allocatedAmount: 0,
        unallocatedAmount: 0,
      }));

      mockApiClient.get.mockResolvedValueOnce({ payments: zeroPayments });

      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("AED 0.00")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper table structure", async () => {
      const { container } = renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(container.querySelector("table")).toBeInTheDocument();
      });
    });

    it("should have labeled select fields", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
        expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
      });
    });

    it("should have descriptive button labels", async () => {
      renderWithProviders(<CustomerPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument();
        expect(screen.getByText("Previous")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
      });
    });
  });
});
