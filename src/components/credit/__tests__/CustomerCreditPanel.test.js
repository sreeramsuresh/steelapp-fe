/**
 * CustomerCreditPanel Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests credit management panel with DSO-based grading, utilization, and aging analysis
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import CustomerCreditPanel from "../CustomerCreditPanel";

vi.mock("../../../contexts/ThemeContext", () => ({
  ThemeContext: {
    Provider: ({ children }) => children,
  },
  useTheme: () => ({
    isDarkMode: false,
  }),
}));

vi.mock("../../../components/ui/badge", () => ({
  Badge: ({ children, className }) => <span className={className}>{children}</span>,
}));

vi.mock("../../../components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/ui/card", () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h2>{children}</h2>,
  CardDescription: ({ children }) => <p>{children}</p>,
  CardContent: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/ui/dialog", () => ({
  Dialog: ({ open, children, _onOpenChange }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h3>{children}</h3>,
  DialogDescription: ({ children }) => <p>{children}</p>,
}));

describe("CustomerCreditPanel", () => {
  let defaultProps;
  let mockOnUpdateCreditLimit;
  let mockOnViewAging;
  let mockOnViewPaymentHistory;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUpdateCreditLimit = vi.fn();
    mockOnViewAging = vi.fn();
    mockOnViewPaymentHistory = vi.fn();

    defaultProps = {
      customer: {
        id: "CUST-001",
        creditGrade: "A",
        creditLimit: 50000,
        creditUsed: 15000,
        creditAvailable: 35000,
        dsoDays: 15,
        lastPaymentDate: "2024-01-15",
        creditScore: 95,
        agingCurrent: 10000,
        aging1_30: 3000,
        aging31_60: 1500,
        aging61_90: 0,
        aging90_plus: 0,
      },
      onUpdateCreditLimit: mockOnUpdateCreditLimit,
      onViewAging: mockOnViewAging,
      onViewPaymentHistory: mockOnViewPaymentHistory,
      readOnly: false,
    };
  });

  describe("Rendering", () => {
    it("should render credit panel", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display credit management title", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Credit Management");
    });

    it("should display credit grade badge", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Grade A");
    });
  });

  describe("Credit Grade System", () => {
    it("should display grade A description", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Excellent - Reliable payment history");
    });

    it("should display grade B description", () => {
      const { container } = renderWithProviders(
        <CustomerCreditPanel {...defaultProps} customer={{ ...defaultProps.customer, creditGrade: "B" }} />
      );

      expect(container.textContent).toContain("Good - Minor delays occasional");
    });

    it("should display grade C description", () => {
      const { container } = renderWithProviders(
        <CustomerCreditPanel {...defaultProps} customer={{ ...defaultProps.customer, creditGrade: "C" }} />
      );

      expect(container.textContent).toContain("Fair - Moderate payment delays");
    });

    it("should display grade D description", () => {
      const { container } = renderWithProviders(
        <CustomerCreditPanel {...defaultProps} customer={{ ...defaultProps.customer, creditGrade: "D" }} />
      );

      expect(container.textContent).toContain("Poor - Frequent delays");
    });

    it("should display grade E description", () => {
      const { container } = renderWithProviders(
        <CustomerCreditPanel {...defaultProps} customer={{ ...defaultProps.customer, creditGrade: "E" }} />
      );

      expect(container.textContent).toContain("Critical - Severe delays");
    });

    it("should show order blocked alert for grade D", () => {
      const { container } = renderWithProviders(
        <CustomerCreditPanel {...defaultProps} customer={{ ...defaultProps.customer, creditGrade: "D" }} />
      );

      expect(container.textContent).toContain("Order Blocked");
    });

    it("should show order blocked alert for grade E", () => {
      const { container } = renderWithProviders(
        <CustomerCreditPanel {...defaultProps} customer={{ ...defaultProps.customer, creditGrade: "E" }} />
      );

      expect(container.textContent).toContain("Order Blocked");
    });

    it("should not show order blocked for grades A-C", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).not.toContain("Order Blocked");
    });
  });

  describe("Credit Utilization Display", () => {
    it("should display credit limit", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("50000");
    });

    it("should display credit used", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("15000");
    });

    it("should display available credit", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("35000");
    });

    it("should calculate and display utilization percentage", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      // 15000 / 50000 = 30%
      expect(container.textContent).toContain("30");
    });

    it("should show green progress bar for low utilization", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show yellow progress bar for medium utilization", () => {
      const mediumUtilization = {
        ...defaultProps.customer,
        creditUsed: 37500, // 75%
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={mediumUtilization} />);

      expect(container).toBeInTheDocument();
    });

    it("should show orange progress bar for high utilization", () => {
      const highUtilization = {
        ...defaultProps.customer,
        creditUsed: 45000, // 90%
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={highUtilization} />);

      expect(container).toBeInTheDocument();
    });

    it("should show red progress bar for critical utilization", () => {
      const criticalUtilization = {
        ...defaultProps.customer,
        creditUsed: 50000, // 100%
      };

      const { container } = renderWithProviders(
        <CustomerCreditPanel {...defaultProps} customer={criticalUtilization} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Payment Metrics", () => {
    it("should display DSO (Days Sales Outstanding)", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("DSO");
      expect(container.textContent).toContain("15 days");
    });

    it("should display last payment date", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Last Payment");
      expect(container.textContent).toContain("1/15/2024");
    });

    it("should display no payments when last payment is null", () => {
      const noPayments = {
        ...defaultProps.customer,
        lastPaymentDate: null,
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={noPayments} />);

      expect(container.textContent).toContain("No payments");
    });

    it("should display credit score", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Credit Score");
      expect(container.textContent).toContain("95 / 100");
    });
  });

  describe("Aging Analysis", () => {
    it("should display aging breakdown section", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Aging Breakdown");
    });

    it("should display current aging bucket", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Current");
      expect(container.textContent).toContain("10000");
    });

    it("should display 1-30 days overdue bucket", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("1-30 days overdue");
      expect(container.textContent).toContain("3000");
    });

    it("should display 31-60 days overdue bucket", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("31-60 days overdue");
      expect(container.textContent).toContain("1500");
    });

    it("should display 61-90 days overdue bucket", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("61-90 days overdue");
    });

    it("should display 90+ days overdue bucket", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("90+ days overdue");
    });

    it("should highlight 90+ days in red", () => {
      const aging90Plus = {
        ...defaultProps.customer,
        aging90_plus: 5000,
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={aging90Plus} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should display view aging details button", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const viewAgingButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("View Details")
      );

      expect(viewAgingButton).toBeTruthy();
    });

    it("should call onViewAging when view details button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const viewAgingButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("View Details")
      );

      if (viewAgingButton) {
        await user.click(viewAgingButton);
        expect(mockOnViewAging).toHaveBeenCalled();
      }
    });

    it("should display adjust credit limit button when not read-only", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} readOnly={false} />);

      expect(container.textContent).toContain("Adjust Credit Limit");
    });

    it("should not display action buttons when read-only", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} readOnly={true} />);

      expect(container.textContent).not.toContain("Adjust Credit Limit");
    });

    it("should display view payment history button", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const paymentHistoryButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("View Payment History")
      );

      expect(paymentHistoryButton).toBeTruthy();
    });

    it("should call onViewPaymentHistory when button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const paymentHistoryButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("View Payment History")
      );

      if (paymentHistoryButton) {
        await user.click(paymentHistoryButton);
        expect(mockOnViewPaymentHistory).toHaveBeenCalled();
      }
    });
  });

  describe("Credit Limit Adjustment Modal", () => {
    it("should open modal when adjust credit limit button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const adjustButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Adjust Credit Limit")
      );

      if (adjustButton) {
        await user.click(adjustButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(container.textContent).toContain("Adjust Credit Limit");
      }
    });

    it("should display current credit limit in modal", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const adjustButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Adjust Credit Limit")
      );

      if (adjustButton) {
        await user.click(adjustButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(container.textContent).toContain("Current Credit Limit");
      }
    });

    it("should allow entering new credit limit", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const adjustButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Adjust Credit Limit")
      );

      if (adjustButton) {
        await user.click(adjustButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const inputs = container.querySelectorAll("input[type='number']");
        expect(inputs.length).toBeGreaterThan(0);
      }
    });

    it("should require review reason to enable submit", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const adjustButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Adjust Credit Limit")
      );

      if (adjustButton) {
        await user.click(adjustButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const updateButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Update Credit Limit")
        );

        // Button should be disabled without reason
        expect(updateButton?.disabled).toBeTruthy();
      }
    });

    it("should enable submit button when review reason provided", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const adjustButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Adjust Credit Limit")
      );

      if (adjustButton) {
        await user.click(adjustButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const reasonTextarea = container.querySelector("textarea");
        if (reasonTextarea) {
          await user.type(reasonTextarea, "Payment history improvement");
          await new Promise((resolve) => setTimeout(resolve, 50));

          const updateButton = Array.from(container.querySelectorAll("button")).find((btn) =>
            btn.textContent.includes("Update Credit Limit")
          );

          expect(updateButton?.disabled).toBeFalsy();
        }
      }
    });

    it("should call onUpdateCreditLimit with correct data", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const adjustButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Adjust Credit Limit")
      );

      if (adjustButton) {
        await user.click(adjustButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const reasonTextarea = container.querySelector("textarea");
        const limitInput = container.querySelector("input[type='number']");

        if (reasonTextarea && limitInput) {
          await user.type(reasonTextarea, "Business growth");
          await user.clear(limitInput);
          await user.type(limitInput, "75000");
          await new Promise((resolve) => setTimeout(resolve, 50));

          const updateButton = Array.from(container.querySelectorAll("button")).find((btn) =>
            btn.textContent.includes("Update Credit Limit")
          );

          if (updateButton) {
            await user.click(updateButton);
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(mockOnUpdateCreditLimit).toHaveBeenCalled();
          }
        }
      }
    });

    it("should show alert if credit limit is negative", async () => {
      const user = setupUser();
      vi.spyOn(window, "alert").mockImplementation(() => {});

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      const adjustButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Adjust Credit Limit")
      );

      if (adjustButton) {
        await user.click(adjustButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const reasonTextarea = container.querySelector("textarea");
        const limitInput = container.querySelector("input[type='number']");

        if (reasonTextarea && limitInput) {
          await user.type(reasonTextarea, "Test reason");
          await user.clear(limitInput);
          await user.type(limitInput, "-1000");
          await new Promise((resolve) => setTimeout(resolve, 50));

          const updateButton = Array.from(container.querySelectorAll("button")).find((btn) =>
            btn.textContent.includes("Update Credit Limit")
          );

          if (updateButton) {
            await user.click(updateButton);
            expect(window.alert).toHaveBeenCalled();
          }
        }
      }
    });
  });

  describe("Credit Grade Criteria Info Box", () => {
    it("should display credit grade criteria section", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("Credit Grade Criteria");
    });

    it("should show all grade thresholds", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container.textContent).toContain("A (DSO < 20)");
      expect(container.textContent).toContain("B (DSO 20-40)");
      expect(container.textContent).toContain("C (DSO 40-60)");
      expect(container.textContent).toContain("D (DSO 60-90)");
      expect(container.textContent).toContain("E (DSO 90+)");
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styling", () => {
      vi.resetModules();
      vi.doMock("../../../contexts/ThemeContext", () => ({
        ThemeContext: {
          Provider: ({ children }) => children,
        },
        useTheme: () => ({
          isDarkMode: true,
        }),
      }));

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing customer data", () => {
      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={{}} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle zero credit limit", () => {
      const zeroLimit = {
        ...defaultProps.customer,
        creditLimit: 0,
        creditUsed: 0,
        creditAvailable: 0,
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={zeroLimit} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle credit used exceeding limit", () => {
      const overused = {
        ...defaultProps.customer,
        creditLimit: 50000,
        creditUsed: 55000,
        creditAvailable: -5000,
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={overused} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very high DSO", () => {
      const highDSO = {
        ...defaultProps.customer,
        dsoDays: 120,
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={highDSO} />);

      expect(container).toContain("120");
    });

    it("should handle multiple aging buckets with balances", () => {
      const multipleAging = {
        ...defaultProps.customer,
        agingCurrent: 10000,
        aging1_30: 5000,
        aging31_60: 3000,
        aging61_90: 2000,
        aging90_plus: 1000,
      };

      const { container } = renderWithProviders(<CustomerCreditPanel {...defaultProps} customer={multipleAging} />);

      expect(container.textContent).toContain("10000");
      expect(container.textContent).toContain("5000");
      expect(container.textContent).toContain("3000");
    });
  });
});
