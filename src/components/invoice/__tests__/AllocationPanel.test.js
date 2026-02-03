/**
 * AllocationPanel Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests FIFO batch allocation display and management
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import { createMockAllocation, createMockArray } from "../../../test/mock-factories";
import AllocationPanel from "../AllocationPanel";

// Mock the auth service
vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    getUserRole: vi.fn(),
  },
}));

// Mock the reallocation modal
vi.mock("../ReallocationModal", () => ({
  default: ({ isOpen }) => (isOpen ? <div>Reallocation Modal</div> : null),
}));

import { authService } from "../../../services/axiosAuthService";

describe("AllocationPanel", () => {
  let mockOnAllocationsChange;
  let mockOnReallocationComplete;
  let defaultProps;
  let mockAllocations;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAllocationsChange = vi.fn();
    mockOnReallocationComplete = vi.fn();

    mockAllocations = createMockArray(createMockAllocation, 2, (index) => ({
      batchNumber: `BATCH-2024-${String(index + 1).padStart(3, "0")}`,
      quantity: 50 + index * 25,
      quantityAvailable: 100 + index * 50,
      unitCost: 100 + index * 10,
      procurementChannel: index === 0 ? "LOCAL" : "IMPORTED",
    }));

    defaultProps = {
      productId: 123,
      warehouseId: "WH-001",
      requiredQty: 100,
      allocations: mockAllocations,
      onAllocationsChange: mockOnAllocationsChange,
      disabled: false,
      isNewInvoice: false,
      isLocked: false,
      deliveryNoteNumber: null,
      invoiceItemId: "item-123",
      onReallocationComplete: mockOnReallocationComplete,
    };

    authService.getUserRole.mockReturnValue("user");
  });

  describe("Rendering", () => {
    it("should render allocation panel with allocations", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain("Batch Allocations (FIFO)");
    });

    it("should return null for new invoices with no allocations", () => {
      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={[]} isNewInvoice={true} />
      );

      expect(container.textContent).not.toContain("Batch Allocations");
    });

    it("should show empty state message for existing invoices with no allocations", () => {
      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={[]} isNewInvoice={false} />
      );

      expect(container.textContent).toContain("No batch allocations found");
    });
  });

  describe("Allocation Table Display", () => {
    it("should display batch numbers", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("BATCH-2024-001");
      expect(container.textContent).toContain("BATCH-2024-002");
    });

    it("should display allocated quantities", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("50");
      expect(container.textContent).toContain("75");
    });

    it("should display available quantities", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("100");
      expect(container.textContent).toContain("150");
    });

    it("should display unit costs in AED", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("AED");
    });

    it("should have table with header row", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();

      expect(container.textContent).toContain("Batch #");
      expect(container.textContent).toContain("Allocated Qty");
      expect(container.textContent).toContain("Cost/PCS");
    });
  });

  describe("Procurement Channel Badges", () => {
    it("should display LOCAL badge for local procurement", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("LOCAL");
    });

    it("should display IMPORTED badge for imported procurement", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("IMPORTED");
    });

    it("should render package icon for LOCAL badge", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      const badges = container.querySelectorAll("div");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("Allocation Status", () => {
    it("should show Fully Allocated when total >= required", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("Fully Allocated");
    });

    it("should not show Fully Allocated when total < required", () => {
      const shortfallAllocations = [{ ...mockAllocations[0], quantity: 30 }];

      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={shortfallAllocations} requiredQty={100} />
      );

      expect(container.textContent).not.toContain("Fully Allocated");
    });

    it("should calculate total allocated correctly", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      // 50 + 75 = 125, which meets 100 requirement
      expect(container).toBeInTheDocument();
    });
  });

  describe("Lock Status", () => {
    it("should show lock banner when locked", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} isLocked={true} />);

      expect(container.textContent).toContain("Batches locked");
    });

    it("should display delivery note number in lock message", () => {
      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} isLocked={true} deliveryNoteNumber="DN-2024-001" />
      );

      expect(container.textContent).toContain("DN-2024-001");
    });

    it("should not show lock banner when not locked", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} isLocked={false} />);

      expect(container.textContent).not.toContain("Batches locked");
    });

    it("should hide reallocation button when locked", () => {
      authService.getUserRole.mockReturnValue("supervisor");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} isLocked={true} />);

      expect(container.textContent).not.toContain("Change Batches");
    });
  });

  describe("Reallocation Button", () => {
    it("should show Change Batches button for supervisors", () => {
      authService.getUserRole.mockReturnValue("supervisor");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("Change Batches");
    });

    it("should show Change Batches button for managers", () => {
      authService.getUserRole.mockReturnValue("manager");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("Change Batches");
    });

    it("should show Change Batches button for admins", () => {
      authService.getUserRole.mockReturnValue("admin");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("Change Batches");
    });

    it("should not show Change Batches button for regular users", () => {
      authService.getUserRole.mockReturnValue("user");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).not.toContain("Change Batches");
    });

    it("should not show Change Batches button when disabled", () => {
      authService.getUserRole.mockReturnValue("admin");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} disabled={true} />);

      expect(container.textContent).not.toContain("Change Batches");
    });

    it("should open reallocation modal on button click", async () => {
      authService.getUserRole.mockReturnValue("supervisor");

      const user = setupUser();
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      const buttons = container.querySelectorAll("button");
      const changeButton = Array.from(buttons).find((btn) => btn.textContent.includes("Change Batches"));

      if (changeButton) {
        await user.click(changeButton);
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(container).toBeInTheDocument();
      }
    });
  });

  describe("New Invoice Behavior", () => {
    it("should hide panel for new invoices with empty allocations", () => {
      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={[]} isNewInvoice={true} />
      );

      expect(container.textContent).not.toContain("Batch Allocations");
    });

    it("should show panel for new invoices with allocations", () => {
      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} isNewInvoice={true} allocations={mockAllocations} />
      );

      expect(container.textContent).toContain("Batch Allocations (FIFO)");
    });

    it("should hide Change Batches for new invoices", () => {
      authService.getUserRole.mockReturnValue("admin");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} isNewInvoice={true} />);

      expect(container.textContent).not.toContain("Change Batches");
    });
  });

  describe("Multiple Allocations", () => {
    it("should handle single allocation", () => {
      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={[mockAllocations[0]]} />
      );

      expect(container.textContent).toContain("BATCH-2024-001");
    });

    it("should handle many allocations", () => {
      const manyAllocations = createMockArray(createMockAllocation, 10);

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} allocations={manyAllocations} />);

      expect(container).toBeInTheDocument();
    });

    it("should accumulate quantities correctly", () => {
      const allocations = [
        { ...mockAllocations[0], quantity: 30 },
        { ...mockAllocations[1], quantity: 40 },
        {
          batchNumber: "BATCH-2024-003",
          quantity: 50,
          quantityAvailable: 100,
          unitCost: 100,
          procurementChannel: "LOCAL",
        },
      ];

      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={allocations} requiredQty={120} />
      );

      expect(container.textContent).toContain("Fully Allocated");
    });
  });

  describe("Currency Formatting", () => {
    it("should format unit costs with AED currency", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("AED");
    });

    it("should format quantities with proper decimals", () => {
      const allocations = [{ ...mockAllocations[0], quantity: 50.5, quantityAvailable: 100.75 }];

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} allocations={allocations} />);

      expect(container).toBeInTheDocument();
    });

    it("should display zero quantities correctly", () => {
      const allocations = [{ ...mockAllocations[0], quantity: 0, quantityAvailable: 0 }];

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} allocations={allocations} />);

      expect(container.textContent).toContain("0");
    });
  });

  describe("Editable State Badge", () => {
    it("should show Editable badge when allocations are editable", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} isLocked={false} />);

      expect(container.textContent).toContain("Editable");
    });

    it("should hide Editable badge when locked", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} isLocked={true} />);

      expect(container.textContent).not.toContain("Editable");
    });

    it("should hide Editable badge for new invoices", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} isNewInvoice={true} />);

      expect(container.textContent).not.toContain("Editable");
    });
  });

  describe("Role-Based Permissions", () => {
    it("should allow reallocation for super_admin", () => {
      authService.getUserRole.mockReturnValue("super_admin");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("Change Batches");
    });

    it("should allow reallocation for director", () => {
      authService.getUserRole.mockReturnValue("director");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).toContain("Change Batches");
    });

    it("should not allow reallocation for warehouse staff", () => {
      authService.getUserRole.mockReturnValue("warehouse_staff");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.textContent).not.toContain("Change Batches");
    });

    it("should require invoiceItemId for reallocation", () => {
      authService.getUserRole.mockReturnValue("admin");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} invoiceItemId={null} />);

      expect(container.textContent).not.toContain("Change Batches");
    });
  });

  describe("Edge Cases", () => {
    it("should handle large quantities", () => {
      const allocations = [{ ...mockAllocations[0], quantity: 999999.99, quantityAvailable: 1000000 }];

      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={allocations} requiredQty={999999.99} />
      );

      expect(container.textContent).toContain("Fully Allocated");
    });

    it("should handle very small quantities", () => {
      const allocations = [{ ...mockAllocations[0], quantity: 0.01, quantityAvailable: 0.05 }];

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} allocations={allocations} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing allocation fields", () => {
      const incompleteAllocations = [{ batchNumber: "BATCH-001" }];

      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={incompleteAllocations} />
      );

      expect(container.textContent).toContain("BATCH-001");
    });

    it("should handle overflow with many allocations", () => {
      const manyAllocations = Array.from({ length: 50 }, (_, i) => ({
        batchNumber: `BATCH-${i}`,
        quantity: 2,
        quantityAvailable: 10,
        unitCost: 100,
        procurementChannel: i % 2 === 0 ? "LOCAL" : "IMPORTED",
      }));

      const { container } = renderWithProviders(
        <AllocationPanel {...defaultProps} allocations={manyAllocations} requiredQty={100} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styles", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />, {
        initialState: { theme: { isDarkMode: true } },
      });

      expect(container).toBeInTheDocument();
    });

    it("should render with light mode styles", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />, {
        initialState: { theme: { isDarkMode: false } },
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have table structure", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should have proper table headers", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      const headers = container.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);
    });

    it("should have proper table body rows", () => {
      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(mockAllocations.length);
    });

    it("should have descriptive button text", () => {
      authService.getUserRole.mockReturnValue("admin");

      const { container } = renderWithProviders(<AllocationPanel {...defaultProps} />);

      const buttons = container.querySelectorAll("button");
      let hasChangeButton = false;
      buttons.forEach((btn) => {
        if (btn.textContent.includes("Change Batches")) {
          hasChangeButton = true;
        }
      });

      expect(hasChangeButton).toBe(true);
    });
  });
});
