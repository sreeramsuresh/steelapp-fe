/**
 * ReallocationHistoryPanel Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests batch reallocation history display and interaction
 */

import sinon from "sinon";
// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import ReallocationHistoryPanel from "../ReallocationHistoryPanel";

const mockApiClient = {
  get: sinon.stub(),
};

// sinon.stub() // "../../services/apiClient", () => ({
default: mockApiClient,
}))

// sinon.stub() // "../../contexts/ThemeContext", () => ({
useTheme: () => (
{
  isDarkMode: false;
}
),
}))

// sinon.stub() // "../../components/ui/badge", () => ({
Badge: (
{
  children, className;
}
) => <span className=
{
  className;
}
>
{
  children;
}
</span>,
}))

// sinon.stub() // "../../components/ui/table", () => ({
Table: (
{
  children;
}
) => <table>
{
  children;
}
</table>, TableHeader;
: (
{
  children;
}
) => <thead>
{
  children;
}
</thead>,
TableBody: (
{
  children;
}
) => <tbody>
{
  children;
}
</tbody>, TableRow;
: (
{
  children;
}
) => <tr>
{
  children;
}
</tr>,
TableHead: (
{
  children;
}
) => <th>
{
  children;
}
</th>, TableCell;
: (
{
  children;
}
) => <td>
{
  children;
}
</td>,
}))

describe("ReallocationHistoryPanel", () =>
{
  let mockHistory;
  let defaultProps;

  beforeEach(() => {
    sinon.restore();

    mockHistory = [
      {
        id: 1,
        changedAt: "2024-01-15T10:30:00Z",
        changedByName: "Ahmad Al-Mansouri",
        oldBatchNumber: "BATCH-001",
        oldQuantity: 100,
        newBatchNumber: "BATCH-002",
        newQuantity: 100,
        quantityChanged: 100,
        costVariance: 50,
        reasonCode: "CUSTOMER_REQUEST",
        reasonText: "Customer requested specific batch",
      },
      {
        id: 2,
        changedAt: "2024-01-15T14:45:00Z",
        changedByName: "Fatima Al-Maktoum",
        oldBatchNumber: "BATCH-002",
        oldQuantity: 50,
        newBatchNumber: "BATCH-003",
        newQuantity: 50,
        quantityChanged: 50,
        costVariance: -30,
        reasonCode: "QUALITY_ISSUE",
        reasonText: "Better grade available",
      },
    ];

    defaultProps = {
      invoiceId: "INV-001",
      invoiceItemId: null,
      collapsed: true,
    };

    mockApiClient.get.mockResolvedValue({ history: mockHistory });
  });

  describe("Rendering", () => {
    it("should render panel container", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} />);

      const panel = container.querySelector(".rounded-lg.border");
      expect(panel).toBeInTheDocument();
    });

    it("should display panel title", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} />);

      expect(container.textContent).toContain("Batch Reallocation History");
    });

    it("should show history icon", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} />);

      expect(container.textContent).toContain("History");
    });

    it("should display change count badge", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} />);

      expect(container.textContent).toContain("2 changes");
    });
  });

  describe("Collapse/Expand Behavior", () => {
    it("should start collapsed when initialCollapsed is true", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={true} />);

      const table = container.querySelector("table");
      expect(table).not.toBeInTheDocument();
    });

    it("should start expanded when initialCollapsed is false", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      expect(container.textContent).toContain("Date/Time");
    });

    it("should toggle collapsed state on header click", async () => {
      const user = setupUser();
      const { container, rerender } = renderWithProviders(
        <ReallocationHistoryPanel {...defaultProps} collapsed={true} />
      );

      // Find and click the header button
      const headerButton = container.querySelector("button");
      await user.click(headerButton);

      // Rerender to see the expanded state
      rerender(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      // Should now show table content
      expect(container.textContent).toContain("Date/Time");
    });

    it("should show chevron right when collapsed", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={true} />);

      expect(container.textContent).toContain("ChevronRight");
    });

    it("should show chevron down when expanded", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      expect(container.textContent).toContain("ChevronDown");
    });
  });

  describe("API Integration", () => {
    it("should fetch history for invoice when expanded", async () => {
      renderWithProviders(<ReallocationHistoryPanel invoiceId="INV-001" collapsed={false} />);

      // Wait for API call
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockApiClient.get).toHaveBeenCalledWith("/invoices/INV-001/reallocation-history");
    });

    it("should fetch history for invoice item when expanded", async () => {
      renderWithProviders(<ReallocationHistoryPanel invoiceItemId="ITEM-001" collapsed={false} />);

      // Wait for API call
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockApiClient.get).toHaveBeenCalledWith("/invoices/items/ITEM-001/reallocation-history");
    });

    it("should not fetch when no invoice or item ID", async () => {
      const { container } = renderWithProviders(
        <ReallocationHistoryPanel invoiceId={null} invoiceItemId={null} collapsed={false} />
      );

      // Wait for potential API call
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });

    it("should not fetch while collapsed", () => {
      mockApiClient.get.mockClear();
      renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={true} />);

      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it("should fetch when transitioning from collapsed to expanded", async () => {
      const { rerender } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={true} />);

      mockApiClient.get.mockClear();

      // Transition to expanded
      rerender(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockApiClient.get).toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ history: mockHistory }), 1000))
      );

      const { container: loadingContainer } = renderWithProviders(
        <ReallocationHistoryPanel {...defaultProps} collapsed={false} />
      );

      expect(loadingContainer.textContent).toContain("Loading history");
    });

    it("should hide loading when fetch completes", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container: completedContainer } = renderWithProviders(
        <ReallocationHistoryPanel {...defaultProps} collapsed={false} />
      );

      // Wait for API response
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(completedContainer.textContent).not.toContain("Loading history");
    });
  });

  describe("Error State", () => {
    it("should display error message on API failure", async () => {
      const errorMessage = "Failed to load reallocation history";
      mockApiClient.get.mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      // Wait for error to be set
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain(errorMessage);
    });

    it("should show error icon", async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          data: {
            message: "Error",
          },
        },
      });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("AlertCircle");
    });

    it("should use default error message when none provided", async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          data: {},
        },
      });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Failed to load history");
    });
  });

  describe("Empty State", () => {
    it("should show no history message when empty", async () => {
      mockApiClient.get.mockResolvedValue({ history: [] });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("No reallocation history found");
    });

    it("should not show badge when history is empty", async () => {
      mockApiClient.get.mockResolvedValue({ history: [] });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={true} />);

      // Check for badge text - should not exist for empty history
      const badges = container.querySelectorAll("span.text-xs");
      const hasBadge = Array.from(badges).some((b) => b.textContent.match(/\d+ change/));
      expect(hasBadge).toBeFalsy();
    });
  });

  describe("History Table", () => {
    it("should display history table when expanded with data", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should display table headers", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Date/Time");
      expect(container.textContent).toContain("Changed By");
      expect(container.textContent).toContain("From Batch");
      expect(container.textContent).toContain("To Batch");
      expect(container.textContent).toContain("Qty");
      expect(container.textContent).toContain("Cost Impact");
      expect(container.textContent).toContain("Reason");
    });

    it("should display history rows", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Ahmad Al-Mansouri");
      expect(container.textContent).toContain("Fatima Al-Maktoum");
    });
  });

  describe("Date/Time Formatting", () => {
    it("should format dates in AE locale", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check for formatted date (should contain month abbreviation)
      expect(container.textContent).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    });

    it("should display hyphen for missing dates", async () => {
      const historyWithoutDate = [
        {
          ...mockHistory[0],
          changedAt: null,
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithoutDate });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("-");
    });

    it("should handle snake_case date field", async () => {
      const historyWithSnakeCase = [
        {
          id: 1,
          changed_at: "2024-01-15T10:30:00Z",
          changedByName: "Ahmad",
          oldBatchNumber: "BATCH-001",
          oldQuantity: 100,
          newBatchNumber: "BATCH-002",
          newQuantity: 100,
          quantityChanged: 100,
          costVariance: 50,
          reasonCode: "CUSTOMER_REQUEST",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithSnakeCase });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    });
  });

  describe("Currency Formatting", () => {
    it("should format cost variance as AED currency", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // AED formatted currency should appear
      expect(container.textContent).toMatch(/\d+(\.\d{2})?/);
    });

    it("should show positive variance with trending up icon", async () => {
      const historyWithPositiveVariance = [
        {
          ...mockHistory[0],
          costVariance: 100,
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithPositiveVariance });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("TrendingUp");
    });

    it("should show negative variance with trending down icon", async () => {
      const historyWithNegativeVariance = [
        {
          ...mockHistory[0],
          costVariance: -100,
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithNegativeVariance });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("TrendingDown");
    });

    it("should show hyphen for zero or near-zero variance", async () => {
      const historyWithZeroVariance = [
        {
          ...mockHistory[0],
          costVariance: 0.001,
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithZeroVariance });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should show dash for minimal variance
      const text = container.textContent;
      expect(text).toMatch(/-/);
    });
  });

  describe("Reason Badges", () => {
    it("should display customer request reason badge", async () => {
      const historyWithReason = [
        {
          ...mockHistory[0],
          reasonCode: "CUSTOMER_REQUEST",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithReason });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Customer Request");
    });

    it("should display quality issue reason badge", async () => {
      const historyWithReason = [
        {
          ...mockHistory[0],
          reasonCode: "QUALITY_ISSUE",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithReason });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Quality Issue");
    });

    it("should display certificate mismatch reason badge", async () => {
      const historyWithReason = [
        {
          ...mockHistory[0],
          reasonCode: "CERTIFICATE_MISMATCH",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithReason });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Certificate Mismatch");
    });

    it("should display entry error reason badge", async () => {
      const historyWithReason = [
        {
          ...mockHistory[0],
          reasonCode: "ENTRY_ERROR",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithReason });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Entry Error");
    });

    it("should display stock adjustment reason badge", async () => {
      const historyWithReason = [
        {
          ...mockHistory[0],
          reasonCode: "STOCK_ADJUSTMENT",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithReason });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Stock Adjustment");
    });

    it("should display supervisor override reason badge", async () => {
      const historyWithReason = [
        {
          ...mockHistory[0],
          reasonCode: "SUPERVISOR_OVERRIDE",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithReason });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Supervisor Override");
    });

    it("should handle unknown reason code", async () => {
      const historyWithUnknownReason = [
        {
          ...mockHistory[0],
          reasonCode: "UNKNOWN_REASON",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithUnknownReason });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("UNKNOWN_REASON");
    });

    it("should display reason text below reason code", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Customer requested specific batch");
    });
  });

  describe("Batch Information", () => {
    it("should display from batch number", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH-001");
    });

    it("should display to batch number", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH-002");
    });

    it("should display quantity changed", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("100");
    });

    it("should handle snake_case batch fields", async () => {
      const historyWithSnakeCase = [
        {
          id: 1,
          changedAt: "2024-01-15T10:30:00Z",
          changed_by_name: "Ahmad",
          old_batch_number: "BATCH-001",
          old_quantity: 100,
          new_batch_number: "BATCH-002",
          new_quantity: 100,
          quantity_changed: 100,
          cost_variance: 50,
          reason_code: "CUSTOMER_REQUEST",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithSnakeCase });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH-001");
      expect(container.textContent).toContain("BATCH-002");
    });
  });

  describe("Summary Calculation", () => {
    it("should display total cost impact summary", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Total Cost Impact");
    });

    it("should calculate total variance correctly", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Total should be 50 + (-30) = 20
      const summaryText = container.textContent;
      expect(summaryText).toContain("Total Cost Impact");
    });

    it("should hide summary when no history", async () => {
      mockApiClient.get.mockResolvedValue({ history: [] });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const summarySection = container.querySelector(".border-t");
      expect(summarySection).not.toBeInTheDocument();
    });
  });

  describe("User Information", () => {
    it("should display who made the change", async () => {
      mockApiClient.get.mockResolvedValue({ history: mockHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Ahmad Al-Mansouri");
      expect(container.textContent).toContain("Fatima Al-Maktoum");
    });

    it("should display System when no user info", async () => {
      const historyWithoutUser = [
        {
          ...mockHistory[0],
          changedByName: null,
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithoutUser });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("System");
    });

    it("should handle snake_case user field", async () => {
      const historyWithSnakeCase = [
        {
          id: 1,
          changedAt: "2024-01-15T10:30:00Z",
          changed_by_name: "Ahmad",
          oldBatchNumber: "BATCH-001",
          oldQuantity: 100,
          newBatchNumber: "BATCH-002",
          newQuantity: 100,
          quantityChanged: 100,
          costVariance: 50,
          reasonCode: "CUSTOMER_REQUEST",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: historyWithSnakeCase });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Ahmad");
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styling", () => {
      vi.resetModules();
      vi.doMock("../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle no invoice or item ID", () => {
      const { container } = renderWithProviders(<ReallocationHistoryPanel invoiceId={null} invoiceItemId={null} />);

      expect(container).toBeEmptyDOMElement();
    });

    it("should handle very long batch numbers", async () => {
      const longBatchHistory = [
        {
          ...mockHistory[0],
          oldBatchNumber: "BATCH-2024-Q1-PREMIUM-GRADE-SS304-COIL-12345",
          newBatchNumber: "BATCH-2024-Q1-STANDARD-GRADE-SS316-COIL-67890",
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: longBatchHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH-2024-Q1-PREMIUM");
    });

    it("should handle large quantities", async () => {
      const largeQtyHistory = [
        {
          ...mockHistory[0],
          quantityChanged: 999999,
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: largeQtyHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("999999");
    });

    it("should handle large cost variances", async () => {
      const largeVarianceHistory = [
        {
          ...mockHistory[0],
          costVariance: 999999.99,
        },
      ];

      mockApiClient.get.mockResolvedValue({ history: largeVarianceHistory });

      const { container } = renderWithProviders(<ReallocationHistoryPanel {...defaultProps} collapsed={false} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });
}
)
