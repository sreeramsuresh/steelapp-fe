/**
 * BatchAllocationPanel — Coil-specific Tests
 *
 * Tests per-coil weight display and coil weight totals in the batch table.
 */

import { render, screen, waitFor } from "@testing-library/react";
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

// Coil batches with variable weight
const coilBatches = [
  {
    id: 1,
    batchNumber: "COIL-001",
    quantityAllocatable: 1,
    pcsAvailable: 1,
    quantityReservedOthers: 0,
    pcsReservedOthers: 0,
    procurementChannel: "LOCAL",
    unitCost: 7458,
    daysInStock: 10,
    weightKgAvailable: 1356,
    weightPerPieceKg: 1356,
  },
  {
    id: 2,
    batchNumber: "COIL-002",
    quantityAllocatable: 1,
    pcsAvailable: 1,
    quantityReservedOthers: 0,
    pcsReservedOthers: 0,
    procurementChannel: "LOCAL",
    unitCost: 7716,
    daysInStock: 5,
    weightKgAvailable: 1403,
    weightPerPieceKg: 1403,
  },
  {
    id: 3,
    batchNumber: "COIL-003",
    quantityAllocatable: 3,
    pcsAvailable: 3,
    quantityReservedOthers: 0,
    pcsReservedOthers: 0,
    procurementChannel: "IMPORTED",
    unitCost: 5200,
    daysInStock: 20,
    weightKgAvailable: 3150,
    weightPerPieceKg: 1050,
  },
];

// Non-coil batches
const sheetBatches = [
  {
    id: 10,
    batchNumber: "SHEET-001",
    quantityAllocatable: 500,
    pcsAvailable: 500,
    quantityReservedOthers: 0,
    pcsReservedOthers: 0,
    procurementChannel: "LOCAL",
    unitCost: 75,
    daysInStock: 15,
    weightKgAvailable: 12500,
    weightPerPieceKg: 25,
  },
];

describe("BatchAllocationPanel — Coil-specific", () => {
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();

    defaultProps = {
      productId: 100,
      warehouseId: 1,
      draftInvoiceId: 1,
      requiredQuantity: 2,
      unit: "PCS",
      reserveFIFO: vi.fn().mockResolvedValue({ success: true }),
      reserveManual: vi.fn().mockResolvedValue({ success: true }),
      allocations: [],
      loading: false,
      error: null,
      isCoilProduct: true,
      coilWeightMt: 0,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // Per-coil weight display (MT/pc)
  // ──────────────────────────────────────────────
  describe("Per-coil weight display", () => {
    it("should show MT/pc for each coil batch row", async () => {
      mockGetAvailableBatches.mockResolvedValue({ batches: coilBatches });

      render(<BatchAllocationPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("COIL-001")).toBeInTheDocument();
      });

      // Each coil batch shows "X.XXX MT/pc" — 3 rows, 3 MT/pc labels
      const mtPcLabels = screen.getAllByText(/MT\/pc/);
      expect(mtPcLabels).toHaveLength(3);

      // COIL-001: 1356 KG / 1 PCS / 1000 = 1.356 MT/pc
      expect(screen.getByText(/1\.356/)).toBeInTheDocument();
      // COIL-002: 1403 KG / 1 PCS / 1000 = 1.403 MT/pc
      expect(screen.getByText(/1\.403/)).toBeInTheDocument();
      // COIL-003: 3150 KG / 3 PCS / 1000 = 1.050 MT/pc
      expect(screen.getByText(/1\.050/)).toBeInTheDocument();
    });

    it("should show KG weight for non-coil products (not MT/pc)", async () => {
      mockGetAvailableBatches.mockResolvedValue({ batches: sheetBatches });

      const props = {
        ...defaultProps,
        isCoilProduct: false,
        requiredQuantity: 100,
      };

      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText("SHEET-001")).toBeInTheDocument();
      });

      // Non-coil: should show KG, not MT/pc
      expect(screen.getByText(/12500\.0 KG/)).toBeInTheDocument();
      expect(screen.queryByText(/MT\/pc/)).not.toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────
  // Coil weight in totals
  // ──────────────────────────────────────────────
  describe("Coil weight in totals section", () => {
    it("should show MT in totals when coilWeightMt > 0", async () => {
      mockGetAvailableBatches.mockResolvedValue({ batches: coilBatches });

      const coilAllocations = [
        { batchId: 1, quantity: "1356", pcsAllocated: 1, totalCost: 7458 },
        { batchId: 2, quantity: "1403", pcsAllocated: 1, totalCost: 7716 },
      ];

      const props = {
        ...defaultProps,
        allocations: coilAllocations,
        coilWeightMt: 2.759,
      };

      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        // Totals should include "(2.759 MT)"
        expect(screen.getByText(/2\.759 MT/)).toBeInTheDocument();
        // Also shows PCS totals
        expect(screen.getByText(/2 \/ 2 PCS/)).toBeInTheDocument();
      });
    });

    it("should NOT show MT in totals when coilWeightMt is 0", async () => {
      mockGetAvailableBatches.mockResolvedValue({ batches: coilBatches });

      const props = {
        ...defaultProps,
        allocations: [],
        coilWeightMt: 0,
      };

      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText("COIL-001")).toBeInTheDocument();
      });

      // No MT totals shown when weight is 0 — only per-coil MT/pc is visible
      expect(screen.queryByText(/2\.759 MT/)).not.toBeInTheDocument();
    });

    it("should NOT show MT in totals for non-coil products", async () => {
      mockGetAvailableBatches.mockResolvedValue({ batches: sheetBatches });

      const sheetAllocations = [{ batchId: 10, quantity: "100", pcsAllocated: 100, totalCost: 7500 }];

      const props = {
        ...defaultProps,
        isCoilProduct: false,
        coilWeightMt: 0,
        allocations: sheetAllocations,
        requiredQuantity: 100,
      };

      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText(/100 \/ 100 PCS/)).toBeInTheDocument();
      });

      // No MT shown for non-coil
      const totalsArea = screen.getByText(/100 \/ 100 PCS/).closest("strong");
      expect(totalsArea.textContent).not.toContain("MT");
    });
  });

  // ──────────────────────────────────────────────
  // Coil shortfall in PCS (not MT)
  // ──────────────────────────────────────────────
  describe("Coil shortfall display", () => {
    it("should show shortfall in PCS for coils", async () => {
      mockGetAvailableBatches.mockResolvedValue({ batches: coilBatches });

      const partialAlloc = [{ batchId: 1, quantity: "1356", pcsAllocated: 1, totalCost: 7458 }];

      const props = {
        ...defaultProps,
        allocations: partialAlloc,
        requiredQuantity: 3,
        coilWeightMt: 1.356,
      };

      render(<BatchAllocationPanel {...props} />);

      await waitFor(() => {
        // Shortfall = 3 - 1 = 2 PCS
        expect(screen.getByText(/Shortfall: 2 PCS/)).toBeInTheDocument();
      });
    });
  });
});
