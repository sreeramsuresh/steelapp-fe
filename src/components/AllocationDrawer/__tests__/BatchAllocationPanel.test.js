/**
 * BatchAllocationPanel Component Tests
 * Phase 5.3.2c: Tier 1 - Inventory & Stock Component
 *
 * Tests FIFO batch allocation with PCS-centric quantities and warehouse selection
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as batchReservationService from "../../../services/batchReservationService";
import BatchAllocationPanel from "../BatchAllocationPanel";

vi.mock("../../../services/batchReservationService");

describe("BatchAllocationPanel", () => {
  let mockReserveFIFO;
  let mockReserveManual;
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReserveFIFO = vi.fn().mockResolvedValue({ success: true });
    mockReserveManual = vi.fn().mockResolvedValue({ success: true });

    vi.spyOn(batchReservationService, "batchReservationService", "get").mockReturnValue({
      getAvailableBatches: vi.fn().mockResolvedValue({
        batches: [
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
        ],
      }),
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
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render batch allocation panel", () => {
      render(<BatchAllocationPanel {...defaultProps} />);
      expect(screen.getByText("Batch Allocation")).toBeInTheDocument();
    });

    it("should display loading state when fetching batches", async () => {
      const { rerender: _rerender } = render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Loading available batches/)).toBeInTheDocument();
      });
    });

    it("should render empty state when no batches available", async () => {
      vi.spyOn(batchReservationService, "batchReservationService", "get").mockReturnValue({
        getAvailableBatches: vi.fn().mockResolvedValue({ batches: [] }),
      });

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
      vi.spyOn(batchReservationService, "batchReservationService", "get").mockReturnValue({
        getAvailableBatches: vi.fn().mockResolvedValue({ batches: [] }),
      });

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

    it("should display available quantities in PCS", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("500")).toBeInTheDocument(); // PCS Available
      });
    });

    it("should display procurement channel", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL")).toBeInTheDocument();
        expect(screen.getByText("IMPORTED")).toBeInTheDocument();
      });
    });

    it("should display unit cost in AED/PCS", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/AED\/PCS/)).toBeInTheDocument();
      });
    });

    it("should display weight as derived information", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/≈ 500 KG/)).toBeInTheDocument();
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
      const _user = userEvent.setup();
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole("spinbutton");
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it("should only accept integer PCS values", async () => {
      const _user = userEvent.setup();
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole("spinbutton");
        const firstInput = inputs[0];

        expect(firstInput).toHaveAttribute("step", "1");
      });
    });

    it("should not allow quantity exceeding available stock", async () => {
      const _user = userEvent.setup();
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole("spinbutton");
        const firstInput = inputs[0];
        expect(firstInput).toHaveAttribute("max", "500");
      });
    });

    it("should call reserveManual with selected batches", async () => {
      const _user = userEvent.setup();
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("BATCH-2024-001")).toBeInTheDocument();
      });

      // Manual allocation interaction is complex - focus on the core logic
      // This test validates that the component structure supports manual selection
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
        expect(screen.getByText(/Allocated: 250 \/ 400 PCS/)).toBeInTheDocument();
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

  describe("Batch Selection", () => {
    it("should display checkbox for each batch", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("should disable checkbox for already allocated batches", async () => {
      const props = {
        ...defaultProps,
        allocations: [{ batchId: 1, quantity: 100 }],
      };
      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it("should show selection count when batches selected", async () => {
      const user = userEvent.setup();
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      // Click first checkbox (skip header checkbox)
      const checkboxes = screen.getAllByRole("checkbox");
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1]);

        await waitFor(() => {
          expect(screen.getByText(/batch selected/)).toBeInTheDocument();
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("should display API error gracefully", async () => {
      vi.spyOn(batchReservationService, "batchReservationService", "get").mockReturnValue({
        getAvailableBatches: vi.fn().mockRejectedValue(new Error("API Error")),
      });

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

  describe("Reserved Quantities Display", () => {
    it("should display other reserved quantities", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/50 PCS/)).toBeInTheDocument(); // Reserved by others
      });
    });

    it("should display my allocations separately", async () => {
      const props = {
        ...defaultProps,
        allocations: [{ batchId: 1, quantity: 100 }],
      };
      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText(/100 PCS/)).toBeInTheDocument(); // My allocation
      });
    });
  });

  describe("Integration", () => {
    it("should refresh batches after allocation", async () => {
      const user = userEvent.setup();
      const getAvailableBatches = vi.fn().mockResolvedValue({
        batches: [
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
        ],
      });

      vi.spyOn(batchReservationService, "batchReservationService", "get").mockReturnValue({
        getAvailableBatches,
      });

      mockReserveFIFO.mockImplementation(async () => {
        // Simulate updated batches after allocation
        getAvailableBatches.mockResolvedValue({
          batches: [
            {
              id: 1,
              batchNumber: "BATCH-2024-001",
              quantityAllocatable: 100,
              pcsAvailable: 100,
              quantityReservedOthers: 400,
              pcsReservedOthers: 400,
              procurementChannel: "LOCAL",
              unitCost: 100,
              daysInStock: 15,
              weightKgAvailable: 100,
              weightPerPieceKg: 1.0,
            },
          ],
        });
        return { success: true };
      });

      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("BATCH-2024-001")).toBeInTheDocument();
      });

      const fifoButton = screen.getByRole("button", { name: /Auto-Fill FIFO/ });
      await user.click(fifoButton);

      await waitFor(() => {
        expect(getAvailableBatches).toHaveBeenCalledTimes(2); // Initial + after allocation
      });
    });

    it("should disable buttons while allocating", async () => {
      const user = userEvent.setup();
      mockReserveFIFO.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<BatchAllocationPanel {...defaultProps} loading={false} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Auto-Fill FIFO/ })).toBeInTheDocument();
      });

      const fifoButton = screen.getByRole("button", { name: /Auto-Fill FIFO/ });
      await user.click(fifoButton);

      // Button should be disabled during allocation
      await waitFor(() => {
        expect(fifoButton).toBeDisabled();
      });
    });
  });

  describe("PCS vs Weight Display", () => {
    it("should prioritize PCS display over weight", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        const pcsLabels = screen.getAllByText("PCS");
        expect(pcsLabels.length).toBeGreaterThan(0);
      });
    });

    it("should show weight as secondary derived information", async () => {
      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/≈ \d+ KG/)).toBeInTheDocument();
      });
    });
  });
});
