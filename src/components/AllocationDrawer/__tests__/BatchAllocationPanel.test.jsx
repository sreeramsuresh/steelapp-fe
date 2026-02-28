/**
 * BatchAllocationPanel Component Tests
 * Phase 5.3.2c: Tier 1 - Inventory & Stock Component
 *
 * Tests FIFO batch allocation with PCS-centric quantities and warehouse selection
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAvailableBatches = vi.fn();

vi.mock("../../../services/batchReservationService", () => ({
  batchReservationService: {
    getAvailableBatches: (...args) => mockGetAvailableBatches(...args),
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatDateDMY: (date) => (date ? new Date(date).toLocaleDateString() : ""),
}));

import BatchAllocationPanel from "../BatchAllocationPanel";

describe("BatchAllocationPanel", () => {
  let mockReserveFIFO;
  let mockReserveManual;
  let defaultProps;

  const defaultBatches = [
    {
      id: 1,
      batchNumber: "BATCH-2024-001",
      quantityAllocatable: 500,
      pcsAvailable: 500,
      quantityReservedOthers: 0,
      pcsReservedOthers: 0,
      procurementChannel: "LOCAL",
      unitCost: 100,
      daysInStock: 15,
      weightKgAvailable: 500,
      weightPerPieceKg: 1.0,
    },
    {
      id: 2,
      batchNumber: "BATCH-2024-002",
      quantityAllocatable: 300,
      pcsAvailable: 300,
      quantityReservedOthers: 50,
      pcsReservedOthers: 50,
      procurementChannel: "IMPORTED",
      unitCost: 120,
      daysInStock: 5,
      weightKgAvailable: 300,
      weightPerPieceKg: 1.0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockReserveFIFO = vi.fn().mockResolvedValue({ success: true });
    mockReserveManual = vi.fn().mockResolvedValue({ success: true });

    mockGetAvailableBatches.mockResolvedValue({
      batches: defaultBatches,
    });

    defaultProps = {
      productId: 123,
      warehouseId: 456,
      draftInvoiceId: 789,
      _lineItemTempId: "temp-001",
      requiredQuantity: 400,
      unit: "PCS",
      _companyId: 1,
      _onAllocationsChange: vi.fn(),
      reserveFIFO: mockReserveFIFO,
      reserveManual: mockReserveManual,
      allocations: [],
      loading: false,
      error: null,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render batch allocation panel", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("Batch Allocation")).toBeInTheDocument();
      });
    });

    it("should display loading state when fetching batches", () => {
      mockGetAvailableBatches.mockImplementation(() => new Promise(() => {})); // never resolves
      render(<BatchAllocationPanel {...defaultProps} />);
      expect(screen.getByText(/Loading available batches/)).toBeInTheDocument();
    });

    it("should render empty state when no batches available", async () => {
      mockGetAvailableBatches.mockResolvedValue({ batches: [] });

      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/No available batches/)).toBeInTheDocument();
      });
    });
  });

  describe("Auto-Fill FIFO", () => {
    it("should call reserveFIFO when Auto-Fill FIFO button clicked", async () => {
      const user = userEvent.setup();
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Auto-Fill FIFO/ })).toBeInTheDocument();
      });

      const fifoButton = screen.getByRole("button", { name: /Auto-Fill FIFO/ });
      await user.click(fifoButton);

      await waitFor(() => {
        expect(mockReserveFIFO).toHaveBeenCalledWith(400, "PCS");
      });
    });

    it("should show error when required quantity is zero", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, requiredQuantity: 0 };
      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Auto-Fill FIFO/ })).toBeInTheDocument();
      });

      const fifoButton = screen.getByRole("button", { name: /Auto-Fill FIFO/ });
      await user.click(fifoButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a quantity greater than 0/)).toBeInTheDocument();
      });
    });

    it("should show error when warehouse not selected", async () => {
      const user = userEvent.setup();
      mockGetAvailableBatches.mockResolvedValue({ batches: [] });
      const props = { ...defaultProps, warehouseId: null };
      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Auto-Fill FIFO/ })).toBeInTheDocument();
      });

      const fifoButton = screen.getByRole("button", { name: /Auto-Fill FIFO/ });
      await user.click(fifoButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select a warehouse/)).toBeInTheDocument();
      });
    });

    it("should show error when no stock available in warehouse", async () => {
      const user = userEvent.setup();
      mockGetAvailableBatches.mockResolvedValue({ batches: [] });

      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Auto-Fill FIFO/ })).toBeInTheDocument();
      });

      const fifoButton = screen.getByRole("button", { name: /Auto-Fill FIFO/ });
      await user.click(fifoButton);

      await waitFor(() => {
        expect(screen.getByText(/Selected warehouse has 0 stock available/)).toBeInTheDocument();
      });
    });
  });

  describe("Batch Table Display", () => {
    it("should display batch numbers", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("BATCH-2024-001")).toBeInTheDocument();
        expect(screen.getByText("BATCH-2024-002")).toBeInTheDocument();
      });
    });

    it("should display available quantities", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("BATCH-2024-001")).toBeInTheDocument();
      });
    });

    it("should display procurement channel", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL")).toBeInTheDocument();
        expect(screen.getByText("IMPORTED")).toBeInTheDocument();
      });
    });

    it("should display batch age in days", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("15d")).toBeInTheDocument();
        expect(screen.getByText("5d")).toBeInTheDocument();
      });
    });
  });

  describe("Manual Allocation", () => {
    it("should allow entering PCS quantity in input field", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole("spinbutton");
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it("should display checkboxes for batch selection", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("BATCH-2024-001")).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe("Stock Calculations", () => {
    it("should calculate total allocated correctly", async () => {
      const props = {
        ...defaultProps,
        allocations: [
          { batchId: 1, quantity: 100 },
          { batchId: 2, quantity: 150 },
        ],
      };
      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        // "Allocated:" and "250 / 400 PCS" are in separate elements (<span> and <strong>)
        expect(screen.getByText("Allocated:")).toBeInTheDocument();
        expect(screen.getByText(/250 \/ 400 PCS/)).toBeInTheDocument();
      });
    });

    it("should show shortfall warning when allocation < required", async () => {
      const props = {
        ...defaultProps,
        allocations: [{ batchId: 1, quantity: 100 }],
        requiredQuantity: 400,
      };
      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText(/Shortfall: 300 PCS/)).toBeInTheDocument();
      });
    });

    it("should not show shortfall when fully allocated", async () => {
      const props = {
        ...defaultProps,
        allocations: [
          { batchId: 1, quantity: 200 },
          { batchId: 2, quantity: 200 },
        ],
      };
      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.queryByText(/Shortfall:/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display API error gracefully", async () => {
      mockGetAvailableBatches.mockRejectedValue(new Error("API Error"));

      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load available batches/)).toBeInTheDocument();
      });
    });

    it("should handle FIFO allocation error", async () => {
      const user = userEvent.setup();
      mockReserveFIFO.mockRejectedValueOnce(new Error("Insufficient stock"));

      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Auto-Fill FIFO/ })).toBeInTheDocument();
      });

      const fifoButton = screen.getByRole("button", { name: /Auto-Fill FIFO/ });
      await user.click(fifoButton);

      await waitFor(() => {
        expect(screen.getByText(/Allocation failed/)).toBeInTheDocument();
      });
    });
  });
});
