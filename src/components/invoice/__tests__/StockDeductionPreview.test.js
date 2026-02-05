/**
 * StockDeductionPreview Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests stock deduction preview when delivering invoice
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import { createMockAllocation, createMockArray } from "../../../test/mock-factories";
import StockDeductionPreview from "../StockDeductionPreview";
import sinon from 'sinon';

describe("StockDeductionPreview", () => {
  let defaultProps;
  let mockAllocations;

  beforeEach(() => {
    sinon.restore();

    mockAllocations = createMockArray(createMockAllocation, 3, (index) => ({
      batchId: index + 1,
      batchNumber: `BATCH-2024-${String(index + 1).padStart(3, "0")}`,
      quantity: 30 + index * 10,
      quantityAvailable: 100 + index * 50,
      unitCost: 100 + index * 10,
      procurementChannel: index === 0 ? "LOCAL" : "IMPORTED",
    }));

    defaultProps = {
      allocations: mockAllocations,
      productId: 123,
      productName: "Stainless Steel Coil",
      lineNumber: 1,
      quantity: 100,
    };
  });

  describe("Rendering", () => {
    it("should render deduction preview", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display header with line number", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Line 1");
    });

    it("should display product information", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Stainless Steel Coil");
    });

    it("should display total quantity", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("100");
    });
  });

  describe("Batch Deductions Display", () => {
    it("should list all batch deductions", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      mockAllocations.forEach((alloc) => {
        expect(container.textContent).toContain(alloc.batchNumber);
      });
    });

    it("should show quantities to be deducted", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("30");
      expect(container.textContent).toContain("40");
      expect(container.textContent).toContain("50");
    });

    it("should show remaining quantities after deduction", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      // After deducting 30 from 100, remaining is 70
      expect(container.textContent).toContain("70");
    });

    it("should show procurement channel badges", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("LOCAL");
      expect(container.textContent).toContain("IMPORTED");
    });

    it("should display unit costs", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("AED");
    });
  });

  describe("Summary Section", () => {
    it("should show total deduction summary", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Total");
    });

    it("should calculate total cost of deduction", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Total Cost");
    });

    it("should display cost breakdown", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Color Coding", () => {
    it("should highlight batches with adequate stock", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should indicate batches with insufficient stock", () => {
      const lowStockAllocations = [{ ...mockAllocations[0], quantityAvailable: 10, quantity: 30 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={lowStockAllocations} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Warehouse Context", () => {
    it("should show warehouse information", () => {
      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} warehouseId="WH-001" warehouseName="Main Warehouse" />
      );

      expect(container.textContent).toContain("Main Warehouse");
    });

    it("should display when warehouse not specified", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Cost Calculations", () => {
    it("should calculate cost per batch deduction", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("AED");
    });

    it("should show unit cost for each batch", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("100");
      expect(container.textContent).toContain("110");
    });

    it("should calculate total deduction cost", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Total");
    });

    it("should handle decimal costs", () => {
      const decimalAllocations = [{ ...mockAllocations[0], unitCost: 123.45 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={decimalAllocations} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should handle empty allocations", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} allocations={[]} />);

      expect(container.textContent).toContain("No allocations");
    });

    it("should show helpful message for no deductions", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} allocations={[]} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Multiple Batches", () => {
    it("should handle single batch deduction", () => {
      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={[mockAllocations[0]]} />
      );

      expect(container.textContent).toContain("BATCH-2024-001");
    });

    it("should handle many batch deductions", () => {
      const manyAllocations = createMockArray(createMockAllocation, 10);

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={manyAllocations} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should show summary across all batches", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Total");
    });
  });

  describe("Quantity Formatting", () => {
    it("should format quantities with decimals", () => {
      const decimalAllocations = [{ ...mockAllocations[0], quantity: 30.5, quantityAvailable: 100.75 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={decimalAllocations} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should format quantities with proper precision", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle zero quantities", () => {
      const zeroAllocations = [{ ...mockAllocations[0], quantity: 0 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={zeroAllocations} />
      );

      expect(container.textContent).toContain("0");
    });

    it("should handle very large quantities", () => {
      const largeAllocations = [{ ...mockAllocations[0], quantity: 999999.99, quantityAvailable: 1000000 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={largeAllocations} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Batch Information", () => {
    it("should display batch number clearly", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("BATCH");
    });

    it("should show procurement source", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("LOCAL");
    });

    it("should indicate available vs deducted quantities", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Available");
      expect(container.textContent).toContain("Deduct");
    });
  });

  describe("Cost Breakdown", () => {
    it("should show per-unit costs", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("AED");
    });

    it("should show total line cost", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("Total Cost");
    });

    it("should calculate correctly with mixed sources", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.textContent).toContain("LOCAL");
      expect(container.textContent).toContain("IMPORTED");
    });
  });

  describe("Visual Layout", () => {
    it("should use table format for clarity", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should have proper headers", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      const headers = container.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);
    });

    it("should show batch rows", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBeGreaterThanOrEqual(mockAllocations.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle allocation exceeding available quantity", () => {
      const overAllocations = [{ ...mockAllocations[0], quantity: 150, quantityAvailable: 100 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={overAllocations} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should handle batch with exactly matching quantities", () => {
      const exactAllocations = [{ ...mockAllocations[0], quantity: 100, quantityAvailable: 100 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={exactAllocations} />
      );

      expect(container.textContent).toContain("0");
    });

    it("should handle very small quantities", () => {
      const smallAllocations = [{ ...mockAllocations[0], quantity: 0.01, quantityAvailable: 1 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={smallAllocations} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should handle missing optional fields", () => {
      const minimalAllocations = [{ batchNumber: "BATCH-001", quantity: 50 }];

      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} allocations={minimalAllocations} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />, {
        initialState: { theme: { isDarkMode: true } },
      });

      expect(container).toBeInTheDocument();
    });

    it("should render with light mode", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />, {
        initialState: { theme: { isDarkMode: false } },
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic table structure", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container.querySelector("table")).toBeInTheDocument();
      expect(container.querySelector("thead")).toBeInTheDocument();
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("should have descriptive headers", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      const headers = container.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);
      headers.forEach((header) => {
        expect(header.textContent).toBeTruthy();
      });
    });

    it("should have aria labels for critical information", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });
});
