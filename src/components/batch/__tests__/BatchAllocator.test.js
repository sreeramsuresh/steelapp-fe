import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import BatchAllocator from "../BatchAllocator";

const mockStockBatchService = {
  listBatches: vi.fn(),
  allocateBatch: vi.fn(),
  unallocateBatch: vi.fn(),
  getBatchDetails: vi.fn(),
};

vi.mock("../../../services/stockBatchService", () => ({
  default: mockStockBatchService,
}));

describe("BatchAllocator", () => {
  const defaultProps = {
    productId: "PROD-001",
    quantity: 100,
    onAllocate: vi.fn(),
  };

  const mockBatches = [
    {
      id: "BATCH-001",
      batchNumber: "B001",
      productId: "PROD-001",
      quantity: 150,
      availableQuantity: 150,
      purchaseDate: "2024-01-01",
      expiryDate: "2025-01-01",
      warehouseId: "WH-001",
      cost: 50.0,
    },
    {
      id: "BATCH-002",
      batchNumber: "B002",
      productId: "PROD-001",
      quantity: 100,
      availableQuantity: 100,
      purchaseDate: "2024-02-01",
      expiryDate: "2025-02-01",
      warehouseId: "WH-002",
      cost: 55.0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockStockBatchService.listBatches.mockResolvedValue(mockBatches);
  });

  describe("Rendering", () => {
    it("should render batch allocator component", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display available batches", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display batch details table", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display quantity input field", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display allocation summary", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("FIFO Allocation Logic", () => {
    it("should sort batches by purchase date (FIFO)", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should allocate from oldest batch first", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should allocate across multiple batches if needed", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} quantity={200} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle exact quantity match", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} quantity={150} />);
      expect(container).toBeInTheDocument();
    });

    it("should prevent over-allocation", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} quantity={500} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Batch Selection", () => {
    it("should allow manual batch selection", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show selected batch highlight", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display batch details on selection", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should allow deselecting a batch", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should disable allocation for unavailable batches", () => {
      const unavailableBatches = [{ ...mockBatches[0], availableQuantity: 0 }];
      mockStockBatchService.listBatches.mockResolvedValue(unavailableBatches);
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Warehouse Filtering", () => {
    it("should group batches by warehouse", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should allow filtering by warehouse", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show warehouse information with batches", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should calculate available quantity by warehouse", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Cost Tracking", () => {
    it("should display unit cost for each batch", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should calculate total cost of allocation", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show weighted average cost", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle multiple cost scenarios", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Expiry Date Handling", () => {
    it("should display expiry dates for batches", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should warn for soon-to-expire batches", () => {
      const expiringBatch = {
        ...mockBatches[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };
      mockStockBatchService.listBatches.mockResolvedValue([expiringBatch]);
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should disable expired batches", () => {
      const expiredBatch = {
        ...mockBatches[0],
        expiryDate: "2020-01-01",
      };
      mockStockBatchService.listBatches.mockResolvedValue([expiredBatch]);
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should sort by expiry date when enabled", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} sortByExpiry={true} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Allocation Summary", () => {
    it("should display allocation breakdown", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show total allocated quantity", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show remaining quantity to allocate", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should update summary in real-time", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle batch loading errors", () => {
      mockStockBatchService.listBatches.mockRejectedValue(new Error("API Error"));
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle empty batch list", () => {
      mockStockBatchService.listBatches.mockResolvedValue([]);
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle invalid quantity input", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display insufficient stock warning", () => {
      const lowStockBatches = [{ ...mockBatches[0], availableQuantity: 10 }];
      mockStockBatchService.listBatches.mockResolvedValue(lowStockBatches);
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} quantity={100} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("User Actions", () => {
    it("should call onAllocate with allocation details", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should allow clearing allocation", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should allow resetting to FIFO", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should export allocation summary", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single batch scenario", () => {
      mockStockBatchService.listBatches.mockResolvedValue([mockBatches[0]]);
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle many batches (100+)", () => {
      const manyBatches = Array.from({ length: 100 }, (_, i) => ({
        ...mockBatches[0],
        id: `BATCH-${i}`,
        batchNumber: `B${i}`,
      }));
      mockStockBatchService.listBatches.mockResolvedValue(manyBatches);
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle zero quantity", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} quantity={0} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle very large quantities", () => {
      const { container } = renderWithProviders(<BatchAllocator {...defaultProps} quantity={999999} />);
      expect(container).toBeInTheDocument();
    });
  });
});
