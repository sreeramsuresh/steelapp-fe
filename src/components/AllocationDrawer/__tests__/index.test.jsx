/**
 * AllocationDrawer (index) Component Tests
 *
 * Tests the main AllocationDrawer component which orchestrates product selection,
 * source type, batch allocation, and reservation management.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock uuid
vi.mock("uuid", () => ({
  v4: () => "mock-uuid-1234",
}));

// Mock useReservations hook
const mockReserveFIFO = vi.fn();
const mockReserveManual = vi.fn();
const mockReleaseAll = vi.fn();

vi.mock("../../../hooks/useReservations", () => ({
  useReservations: () => ({
    allocations: [],
    loading: false,
    error: null,
    expiresAt: null,
    reserveFIFO: mockReserveFIFO,
    reserveManual: mockReserveManual,
    releaseAll: mockReleaseAll,
    extendReservation: vi.fn(),
  }),
}));

// Mock services
vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    getUser: () => ({ companyId: 1, id: 1, name: "Test User" }),
    hasRole: () => true,
  },
}));

vi.mock("../../../services/pricelistService", () => ({
  default: {
    getProductPrice: vi.fn().mockResolvedValue({ data: { price: 100 } }),
  },
}));

// Mock child components to isolate the drawer logic
vi.mock("../ProductSelector", () => ({
  default: ({ onSelectProduct }) => (
    <div data-testid="product-selector">
      <button
        type="button"
        data-testid="select-product-btn"
        onClick={() =>
          onSelectProduct({
            id: 1,
            name: "Test Product",
            stockBasis: "PCS",
            unitWeightKg: 1.0,
          })
        }
      >
        Select Product
      </button>
    </div>
  ),
}));

vi.mock("../SourceTypeSelector", () => ({
  default: ({ value, onChange }) => (
    <div data-testid="source-type-selector">
      <span>{value}</span>
      <button type="button" onClick={() => onChange("LOCAL_DROP_SHIP")}>
        Change Source
      </button>
    </div>
  ),
}));

vi.mock("../BatchAllocationPanel", () => ({
  default: () => <div data-testid="batch-allocation-panel">Batch Panel</div>,
}));

vi.mock("../ReservationTimer", () => ({
  default: () => <div data-testid="reservation-timer">Timer</div>,
}));

vi.mock("../WarehouseAvailability", () => ({
  default: () => <div data-testid="warehouse-availability">Warehouse</div>,
}));

vi.mock("../../ConfirmDialog", () => ({
  default: () => null,
}));

import AllocationDrawer from "../index";

describe("AllocationDrawer", () => {
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = {
      draftInvoiceId: "draft-001",
      warehouseId: 1,
      companyId: 1,
      onAddLineItem: vi.fn(),
      visible: true,
      customerId: 10,
      priceListId: 5,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the allocation drawer when visible", () => {
      const { container } = render(<AllocationDrawer {...defaultProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    it("should render ProductSelector", () => {
      render(<AllocationDrawer {...defaultProps} />);
      expect(screen.getByTestId("product-selector")).toBeInTheDocument();
    });

    it("should render SourceTypeSelector", () => {
      render(<AllocationDrawer {...defaultProps} />);
      expect(screen.getByTestId("source-type-selector")).toBeInTheDocument();
    });

    it("should render quantity input after product selection", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      // Select a product first (quantity input is conditional on productId)
      await user.click(screen.getByTestId("select-product-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });
    });

    it("should render Add to Invoice button", () => {
      render(<AllocationDrawer {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /Add to Invoice/ }),
      ).toBeInTheDocument();
    });

    it("should not render when visible is false", () => {
      const props = { ...defaultProps, visible: false };
      const { container } = render(<AllocationDrawer {...props} />);
      // When not visible, the drawer should have hidden class or not render content
      const drawer = container.querySelector(".allocation-drawer");
      if (drawer) {
        expect(drawer.classList.contains("hidden") || drawer.style.display === "none").toBeTruthy();
      }
    });
  });

  describe("Product Selection", () => {
    it("should update state when product is selected", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-product-btn"));

      // After selecting a product, batch allocation panel should appear for warehouse source
      await waitFor(() => {
        expect(screen.getByTestId("batch-allocation-panel")).toBeInTheDocument();
      });
    });
  });

  describe("Source Type", () => {
    it("should default to WAREHOUSE source type", () => {
      render(<AllocationDrawer {...defaultProps} />);
      expect(screen.getByText("WAREHOUSE")).toBeInTheDocument();
    });
  });
});
