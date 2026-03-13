/**
 * Coil Weight Derivation Tests — AllocationDrawer
 *
 * Tests the variable-weight coil business logic:
 * - Input is always PCS (integer only for coils)
 * - Weight (MT) derived from batch allocations (warehouse) or manual entry (drop-ship)
 * - Payload sends MT quantity with explicit displayPcs/actualWeightMt/weightBasis
 * - Non-coil regression: unchanged PCS behavior
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock uuid
vi.mock("uuid", () => ({
  v4: () => "mock-uuid-coil-test",
}));

// Track useReservations return value so tests can override allocations
let mockReservationState;
const mockReserveFIFO = vi.fn();
const mockReserveManual = vi.fn();
const mockCancelReservation = vi.fn();
const mockExtendReservation = vi.fn();

vi.mock("../../../hooks/useReservations", () => ({
  useReservations: () => mockReservationState,
}));

// Mock services
vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    getUser: () => ({ companyId: 1, id: 1, name: "Test User" }),
    hasRole: () => true, // canViewMargins = true
  },
}));

vi.mock("../../../services/pricelistService", () => ({
  default: {
    getProductPrice: vi.fn().mockResolvedValue({ price: 5500, pricingBasis: "PER_MT" }),
  },
}));

// Mock child components — ProductSelector supports both coil and non-coil selection
vi.mock("../ProductSelector", () => ({
  default: ({ onSelectProduct }) => {
    return (
      <div data-testid="product-selector">
        <button
          type="button"
          data-testid="select-sheet"
          onClick={() =>
            onSelectProduct({
              id: 1,
              name: "Steel Sheet",
              displayName: "Steel Sheet 4x8",
              productCategory: "SHEET",
              form: "Sheet",
              unitWeightKg: 25,
            })
          }
        >
          Select Sheet
        </button>
        <button
          type="button"
          data-testid="select-coil"
          onClick={() =>
            onSelectProduct({
              id: 2,
              name: "HR Coil",
              displayName: "HR Coil 1.5mm",
              productCategory: "COIL",
              form: "Coil",
              unitWeightKg: 1000,
            })
          }
        >
          Select Coil
        </button>
      </div>
    );
  },
}));

// SourceTypeSelector — allows switching to drop-ship
vi.mock("../SourceTypeSelector", () => ({
  default: ({ value, onChange }) => {
    return (
      <div data-testid="source-type-selector">
        <span data-testid="source-type-value">{value}</span>
        <button type="button" data-testid="switch-dropship" onClick={() => onChange("LOCAL_DROP_SHIP")}>
          Switch Drop-Ship
        </button>
        <button type="button" data-testid="switch-warehouse" onClick={() => onChange("WAREHOUSE")}>
          Switch Warehouse
        </button>
      </div>
    );
  },
}));

vi.mock("../BatchAllocationPanel", () => ({
  default: (props) => (
    <div data-testid="batch-allocation-panel">
      <span data-testid="bap-is-coil">{String(props.isCoilProduct)}</span>
      <span data-testid="bap-coil-weight">{props.coilWeightMt}</span>
    </div>
  ),
}));

vi.mock("../ReservationTimer", () => ({
  default: () => <div data-testid="reservation-timer">Timer</div>,
}));

vi.mock("../WarehouseAvailability", () => ({
  default: () => <div data-testid="warehouse-availability">Warehouse</div>,
}));

vi.mock("../../ConfirmDialog", () => ({
  default: ({ onConfirm }) => (
    <div data-testid="confirm-dialog">
      <button type="button" data-testid="confirm-yes" onClick={onConfirm}>
        Confirm
      </button>
    </div>
  ),
}));

import AllocationDrawer from "../index";

// Coil allocation fixtures — variable weight coils
const coilAllocations = [
  {
    batchId: 101,
    quantity: "1356", // KG as string (backend contract)
    pcsAllocated: 1,
    totalCost: 7458, // 1.356 MT × 5500 AED/MT
  },
  {
    batchId: 102,
    quantity: "1403", // KG as string
    pcsAllocated: 1,
    totalCost: 7716.5, // 1.403 MT × 5500 AED/MT
  },
];

describe("AllocationDrawer — Coil Weight Derivation", () => {
  let defaultProps;
  let mockOnAddLineItem;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAddLineItem = vi.fn();

    mockReservationState = {
      reservationId: null,
      expiresAt: null,
      allocations: [],
      loading: false,
      error: null,
      reserveFIFO: mockReserveFIFO,
      reserveManual: mockReserveManual,
      cancelReservation: mockCancelReservation,
      extendReservation: mockExtendReservation,
    };

    defaultProps = {
      draftInvoiceId: 1,
      warehouseId: 1,
      companyId: 1,
      onAddLineItem: mockOnAddLineItem,
      visible: true,
      customerId: 10,
      priceListId: 5,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // 1. Unit always PCS for input
  // ──────────────────────────────────────────────
  describe("Unit display — always PCS for input", () => {
    it("should show PCS unit after selecting a coil product", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      // Unit display should say PCS, not MT
      const unitDisplay = screen.getByText("PCS");
      expect(unitDisplay).toBeInTheDocument();
    });

    it("should show PCS unit after selecting a non-coil product", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-sheet"));

      await waitFor(() => {
        expect(screen.getByText("PCS")).toBeInTheDocument();
      });
    });
  });

  // ──────────────────────────────────────────────
  // 2. Integer-only quantity input for coils
  // ──────────────────────────────────────────────
  describe("Integer-only PCS input for coils", () => {
    it("should accept integer input for coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "3");
      expect(qtyInput).toHaveValue("3");
    });

    it("should reject decimal input for coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2.5");
      // "." should be rejected, so only "25" remains (2 then 5, dot ignored)
      expect(qtyInput).toHaveValue("25");
    });

    it("should allow decimal input for non-coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-sheet"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2.5");
      expect(qtyInput).toHaveValue("2.5");
    });

    it("should show integer placeholder for coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        const qtyInput = screen.getByTestId("drawer-quantity");
        expect(qtyInput).toHaveAttribute("placeholder", "0");
      });
    });

    it("should show decimal placeholder for non-coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-sheet"));

      await waitFor(() => {
        const qtyInput = screen.getByTestId("drawer-quantity");
        expect(qtyInput).toHaveAttribute("placeholder", "0.00");
      });
    });
  });

  // ──────────────────────────────────────────────
  // 3. Coil weight from batch allocations (warehouse)
  // ──────────────────────────────────────────────
  describe("Coil weight derived from batch allocations", () => {
    it("should display actual batch weight when coil allocations exist", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = coilAllocations;
      mockReservationState.reservationId = "res-123";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      // Should display actual weight: (1356 + 1403) / 1000 = 2.759 MT
      await waitFor(() => {
        // Weight info and allocation summary both show 2.759 MT
        const weightMatches = screen.getAllByText(/2\.759/);
        expect(weightMatches.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/actual batch weights/)).toBeInTheDocument();
      });
    });

    it("should show allocation prompt when coil has quantity but no allocations", async () => {
      const user = userEvent.setup();
      // No allocations
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      await waitFor(() => {
        expect(screen.getByText(/Allocate batches to determine actual weight/)).toBeInTheDocument();
      });
    });

    it("should pass isCoilProduct and coilWeightMt to BatchAllocationPanel", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = coilAllocations;
      mockReservationState.reservationId = "res-123";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("bap-is-coil")).toHaveTextContent("true");
      });

      // coilWeightMt = (1356 + 1403) / 1000 = 2.759
      await waitFor(() => {
        const weightEl = screen.getByTestId("bap-coil-weight");
        expect(parseFloat(weightEl.textContent)).toBeCloseTo(2.759, 3);
      });
    });
  });

  // ──────────────────────────────────────────────
  // 4. Drop-ship coil manual weight input
  // ──────────────────────────────────────────────
  describe("Drop-ship coil — manual weight input", () => {
    it("should show weight input for drop-ship coils", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByLabelText(/Actual Weight \(MT\)/)).toBeInTheDocument();
      });
    });

    it("should NOT show weight input for drop-ship non-coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-sheet"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.queryByLabelText(/Actual Weight \(MT\)/)).not.toBeInTheDocument();
      });
    });

    it("should NOT show weight input for warehouse coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      // Should be WAREHOUSE by default
      await waitFor(() => {
        expect(screen.queryByLabelText(/Actual Weight \(MT\)/)).not.toBeInTheDocument();
      });
    });

    it("should show estimated weight placeholder from nominal weight", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "3");

      // Placeholder should be "Est: 3.000" (3 PCS × 1000 kg / 1000)
      await waitFor(() => {
        const weightInput = screen.getByLabelText(/Actual Weight \(MT\)/);
        expect(weightInput).toHaveAttribute("placeholder", "Est: 3.000");
      });
    });

    it("should accept manual weight and format on blur", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByLabelText(/Actual Weight \(MT\)/)).toBeInTheDocument();
      });

      const weightInput = screen.getByLabelText(/Actual Weight \(MT\)/);
      await user.type(weightInput, "2.9856");
      await user.tab(); // Trigger blur

      // Should round to 3 decimal places
      await waitFor(() => {
        expect(weightInput).toHaveValue("2.986");
      });
    });
  });

  // ──────────────────────────────────────────────
  // 5. Warehouse coil — blocked without allocation
  // ──────────────────────────────────────────────
  describe("Warehouse coil — blocked without allocation", () => {
    it("should block Add when warehouse coil has no allocations", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      // Set a price
      const priceInput = screen.getByTestId("drawer-unit-price");
      await user.type(priceInput, "5500");

      // Click Add
      await user.click(screen.getByTestId("drawer-add-to-invoice"));

      await waitFor(() => {
        expect(screen.getByText(/Allocate batches to determine actual coil weight/)).toBeInTheDocument();
      });

      expect(mockOnAddLineItem).not.toHaveBeenCalled();
    });

    it("should disable Add when allocated coil count < requested PCS", async () => {
      const user = userEvent.setup();
      // Only 1 coil allocated but 2 requested
      mockReservationState.allocations = [coilAllocations[0]];
      mockReservationState.reservationId = "res-partial";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      // Wait for auto-fetched price
      const priceInput = screen.getByTestId("drawer-unit-price");
      await waitFor(() => {
        expect(priceInput.value).not.toBe("");
      });

      // Button should be disabled because allocated (1) < required (2)
      await waitFor(() => {
        const addBtn = screen.getByTestId("drawer-add-to-invoice");
        expect(addBtn).toBeDisabled();
      });

      expect(mockOnAddLineItem).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // 6. Drop-ship coil — blocked without weight
  // ──────────────────────────────────────────────
  describe("Drop-ship coil — blocked without weight", () => {
    it("should block Add when drop-ship coil has no weight entered", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "3");

      const priceInput = screen.getByTestId("drawer-unit-price");
      await user.type(priceInput, "5500");

      // Don't enter weight — leave empty
      await user.click(screen.getByTestId("drawer-add-to-invoice"));

      await waitFor(() => {
        expect(screen.getByText(/Enter actual coil weight \(MT\) for drop-ship/)).toBeInTheDocument();
      });

      expect(mockOnAddLineItem).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // 7. Coil payload structure
  // ──────────────────────────────────────────────
  describe("Coil payload — correct structure", () => {
    it("should send MT quantity with displayPcs and actualWeightMt for warehouse coil", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = coilAllocations;
      mockReservationState.reservationId = "res-123";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      // Wait for auto-fetched price (5500 from mock)
      const priceInput = screen.getByTestId("drawer-unit-price");
      await waitFor(() => {
        expect(priceInput.value).toBe("5500");
      });

      await user.click(screen.getByTestId("drawer-add-to-invoice"));

      await waitFor(() => {
        expect(mockOnAddLineItem).toHaveBeenCalledTimes(1);
      });

      const payload = mockOnAddLineItem.mock.calls[0][0];

      // Transaction unit = MT
      expect(payload.unit).toBe("MT");
      // Quantity = weight in MT (not PCS count)
      expect(payload.quantity).toBeCloseTo(2.759, 3);
      // Display PCS = 2 (what the user entered)
      expect(payload.displayPcs).toBe(2);
      // Actual weight = same as quantity for warehouse
      expect(payload.actualWeightMt).toBeCloseTo(2.759, 3);
      // Weight basis = ACTUAL_ALLOCATED
      expect(payload.weightBasis).toBe("ACTUAL_ALLOCATED");
      // Amount = 2.759 × 5500
      expect(payload.amount).toBeCloseTo(15174.5, 0);
    });

    it("should send MT quantity with MANUAL_ENTRY for drop-ship coil", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "3");

      // Wait for auto-fetched price (5500 from mock)
      const priceInput = screen.getByTestId("drawer-unit-price");
      await waitFor(() => {
        expect(priceInput.value).toBe("5500");
      });

      const weightInput = screen.getByLabelText(/Actual Weight \(MT\)/);
      await user.type(weightInput, "2.985");

      await user.click(screen.getByTestId("drawer-add-to-invoice"));

      await waitFor(() => {
        expect(mockOnAddLineItem).toHaveBeenCalledTimes(1);
      });

      const payload = mockOnAddLineItem.mock.calls[0][0];

      expect(payload.unit).toBe("MT");
      expect(payload.quantity).toBeCloseTo(2.985, 3);
      expect(payload.displayPcs).toBe(3);
      expect(payload.actualWeightMt).toBeCloseTo(2.985, 3);
      expect(payload.weightBasis).toBe("MANUAL_ENTRY");
      expect(payload.amount).toBeCloseTo(16417.5, 0);
    });
  });

  // ──────────────────────────────────────────────
  // 8. Non-coil regression — unchanged behavior
  // ──────────────────────────────────────────────
  describe("Non-coil regression — PCS behavior unchanged", () => {
    it("should send PCS quantity with null coil fields for sheets (drop-ship)", async () => {
      const user = userEvent.setup();
      // Use drop-ship to avoid allocation confirm dialogs
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-sheet"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "50");

      // Clear auto-fetched price and type 75
      const priceInput = screen.getByTestId("drawer-unit-price");
      await user.clear(priceInput);
      await user.type(priceInput, "75");

      await user.click(screen.getByTestId("drawer-add-to-invoice"));

      await waitFor(() => {
        expect(mockOnAddLineItem).toHaveBeenCalledTimes(1);
      });

      const payload = mockOnAddLineItem.mock.calls[0][0];

      expect(payload.unit).toBe("PCS");
      expect(payload.quantity).toBe(50);
      expect(payload.displayPcs).toBeNull();
      expect(payload.actualWeightMt).toBeNull();
      expect(payload.weightBasis).toBeNull();
      expect(payload.amount).toBe(3750);
    });

    it("should allow decimal quantity for non-coils", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-sheet"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "10.5");
      expect(qtyInput).toHaveValue("10.5");
    });

    it("should not show drop-ship weight input for non-coils", async () => {
      const user = userEvent.setup();
      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-sheet"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.queryByLabelText(/Actual Weight \(MT\)/)).not.toBeInTheDocument();
      });
    });
  });

  // ──────────────────────────────────────────────
  // 9. Margin labels — per MT for coils
  // ──────────────────────────────────────────────
  describe("Margin labels — per MT for coils, per PCS for non-coils", () => {
    it("should show AED/MT in margin section for coils", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = coilAllocations;
      mockReservationState.reservationId = "res-margin";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      // Wait for auto-fetched price
      const priceInput = screen.getByTestId("drawer-unit-price");
      await waitFor(() => {
        expect(priceInput.value).toBe("5500");
      });

      await waitFor(() => {
        expect(screen.getByText("Pricing & Margin")).toBeInTheDocument();
        // Should show AED/MT, not AED/PCS — multiple margin rows have this
        const mtLabels = screen.getAllByText(/AED\/MT/);
        expect(mtLabels.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ──────────────────────────────────────────────
  // 10. Allocation summary — PCS + MT for coils
  // ──────────────────────────────────────────────
  describe("Allocation summary — PCS + MT for coils", () => {
    it("should show coil count and weight in allocation summary", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = coilAllocations;
      mockReservationState.reservationId = "res-summary";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      // Summary should show "2 / 2 PCS" and weight appears in multiple places
      await waitFor(() => {
        expect(screen.getByText(/2 \/ 2 PCS/)).toBeInTheDocument();
        // 2.759 MT appears in both weight info and summary — just check it exists
        const weightMatches = screen.getAllByText(/2\.759/);
        expect(weightMatches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("should show coil shortfall in PCS", async () => {
      const user = userEvent.setup();
      // Only 1 coil allocated of 3 requested
      mockReservationState.allocations = [coilAllocations[0]];
      mockReservationState.reservationId = "res-shortfall";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "3");

      // Shortfall = 3 - 1 = 2 PCS
      await waitFor(() => {
        expect(screen.getByText(/Shortfall:/)).toBeInTheDocument();
        expect(screen.getByText(/2 PCS/)).toBeInTheDocument();
      });
    });
  });

  // ──────────────────────────────────────────────
  // 11. Clear resets coil state
  // ──────────────────────────────────────────────
  describe("Clear resets coil-specific state", () => {
    it("should reset dropShipWeightMt on clear", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = [];

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));
      await user.click(screen.getByTestId("switch-dropship"));

      await waitFor(() => {
        expect(screen.getByLabelText(/Actual Weight \(MT\)/)).toBeInTheDocument();
      });

      const weightInput = screen.getByLabelText(/Actual Weight \(MT\)/);
      await user.type(weightInput, "2.5");
      expect(weightInput).toHaveValue("2.5");

      // Clear
      await user.click(screen.getByTestId("drawer-clear"));

      // After clear, the product is deselected so weight input shouldn't be visible
      await waitFor(() => {
        expect(screen.queryByLabelText(/Actual Weight \(MT\)/)).not.toBeInTheDocument();
      });
    });
  });

  // ──────────────────────────────────────────────
  // 12. totalCost calculation
  // ──────────────────────────────────────────────
  describe("totalCost calculation", () => {
    it("coil: amount = weight(MT) × price, not PCS × price", async () => {
      const user = userEvent.setup();
      mockReservationState.allocations = coilAllocations;
      mockReservationState.reservationId = "res-cost";

      render(<AllocationDrawer {...defaultProps} />);

      await user.click(screen.getByTestId("select-coil"));

      await waitFor(() => {
        expect(screen.getByTestId("drawer-quantity")).toBeInTheDocument();
      });

      const qtyInput = screen.getByTestId("drawer-quantity");
      await user.type(qtyInput, "2");

      // Wait for auto-fetched price (5500 from mock)
      const priceInput = screen.getByTestId("drawer-unit-price");
      await waitFor(() => {
        expect(priceInput.value).toBe("5500");
      });

      // Line Amount = 2.759 MT × 5500 = 15,174.50 AED
      // The amount is rendered as "15174.50 AED" in the allocation summary
      await waitFor(() => {
        expect(screen.getByText(/15174\.50 AED/)).toBeInTheDocument();
      });
    });
  });
});
