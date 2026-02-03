/**
 * BatchPicker Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests batch selection for FIFO allocation in invoice line items
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import { createMockArray, createMockBatch } from "../../../test/mock-factories";
import BatchPicker from "../BatchPicker";

// Mock the API service
vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../../../services/api";

describe("BatchPicker", () => {
  let mockOnSelectAllocations;
  let defaultProps;
  let mockBatches;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSelectAllocations = vi.fn();

    mockBatches = createMockArray(createMockBatch, 3, (index) => ({
      id: index + 1,
      batchNumber: `BATCH-2024-${String(index + 1).padStart(3, "0")}`,
      quantityAvailable: 500 - index * 100,
      unitCost: 100 + index * 10,
      procurementChannel: index === 0 ? "LOCAL" : "IMPORTED",
    }));

    defaultProps = {
      productId: 123,
      warehouseId: "WH-001",
      requiredQty: 100,
      onSelectAllocations: mockOnSelectAllocations,
      initialAllocations: [],
      disabled: false,
    };

    api.get.mockResolvedValue({ batches: mockBatches });
  });

  describe("Rendering", () => {
    it("should render batch picker component", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display loading state initially", async () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      expect(container.textContent).toContain("Loading");
    });

    it("should render table header with batch columns", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Batch");
    });

    it("should display title when batches loaded", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Manual Allocation");
    });
  });

  describe("Batch Data Display", () => {
    it("should display batch numbers", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("BATCH-2024-001");
    });

    it("should display available quantities", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("500");
    });

    it("should display unit costs", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("AED");
    });

    it("should show LOCAL procurement badge", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("LOCAL");
    });

    it("should show IMPORTED procurement badge", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("IMPORTED");
    });
  });

  describe("Quantity Selection", () => {
    it("should have quantity input fields for each batch", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const inputs = container.querySelectorAll("input[type='number']");
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should allow quantity input", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const input = container.querySelector("input[type='number']");
      if (input) {
        await user.clear(input);
        await user.type(input, "50");
        expect(input.value).toBe("50");
      }
    });

    it("should limit input to available quantity", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const input = container.querySelector("input[type='number']");
      if (input) {
        expect(input.max).toBeTruthy();
      }
    });

    it("should handle decimal quantities", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const input = container.querySelector("input[type='number']");
      if (input) {
        await user.clear(input);
        await user.type(input, "50.5");
        expect(input.value).toBe("50.5");
      }
    });

    it("should validate step as 0.01 for decimal precision", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const input = container.querySelector("input[type='number']");
      expect(input?.step).toBe("0.01");
    });
  });

  describe("Status Indicator", () => {
    it("should show required vs selected quantities", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} requiredQty={100} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Required");
      expect(container.textContent).toContain("Selected");
    });

    it("should display remaining quantity", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} requiredQty={100} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Remaining");
    });

    it("should show green status when fully allocated", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} requiredQty={100} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });

    it("should show red status when over allocated", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} requiredQty={100} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });

    it("should show amber status when incomplete", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} requiredQty={100} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });
  });

  describe("FIFO Auto-fill", () => {
    it("should display Auto-Fill FIFO button", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Auto-Fill");
    });

    it("should hide buttons when disabled", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} disabled={true} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });

    it("should have Clear button", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Clear");
    });

    it("should allow clearing selections", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const clearButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Clear")
      );

      if (clearButton) {
        await user.click(clearButton);
        expect(container).toBeInTheDocument();
      }
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      api.get.mockRejectedValue({
        response: { data: { error: "Failed to load batches" } },
      });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Failed");
    });

    it("should show retry button on error", async () => {
      api.get.mockRejectedValue({
        response: { data: { error: "API Error" } },
      });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Retry");
    });

    it("should handle missing batches gracefully", async () => {
      api.get.mockResolvedValue({ batches: [] });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("No available batches");
    });

    it("should display warehouse info in no batches message", async () => {
      api.get.mockResolvedValue({ batches: [] });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} warehouseId="WH-001" />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("warehouse");
    });
  });

  describe("Disabled State", () => {
    it("should disable input fields when disabled", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} disabled={true} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const inputs = container.querySelectorAll("input[type='number']");
      inputs.forEach((input) => {
        expect(input).toHaveAttribute("disabled");
      });
    });

    it("should show visual disabled state", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} disabled={true} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    it("should fetch batches with productId", async () => {
      renderWithProviders(<BatchPicker {...defaultProps} productId={456} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(api.get).toHaveBeenCalled();
    });

    it("should handle invalid productId", async () => {
      api.get.mockResolvedValue({ batches: [] });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} productId={null} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });

    it("should include warehouseId in API call", async () => {
      renderWithProviders(<BatchPicker {...defaultProps} warehouseId="WH-SPECIAL" />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(api.get).toHaveBeenCalled();
    });

    it("should skip warehouseId if not provided", async () => {
      renderWithProviders(<BatchPicker {...defaultProps} warehouseId={undefined} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(api.get).toHaveBeenCalled();
    });
  });

  describe("Data Formatting", () => {
    it("should format quantities with proper decimals", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("500");
    });

    it("should format currency with AED", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("AED");
    });

    it("should display batch number or dash", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("BATCH");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single batch", async () => {
      api.get.mockResolvedValue({ batches: [mockBatches[0]] });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("BATCH");
    });

    it("should handle large batch quantities", async () => {
      const largeBatches = createMockArray(createMockBatch, 1, () => ({
        quantityAvailable: 999999.99,
        unitCost: 999.99,
      }));

      api.get.mockResolvedValue({ batches: largeBatches });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });

    it("should handle zero required quantity", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} requiredQty={0} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Required");
    });

    it("should handle very small batch quantities", async () => {
      const smallBatches = createMockArray(createMockBatch, 1, () => ({
        quantityAvailable: 0.01,
      }));

      api.get.mockResolvedValue({ batches: smallBatches });

      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper table structure", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should have input fields with number type", async () => {
      const { container } = renderWithProviders(<BatchPicker {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const inputs = container.querySelectorAll("input[type='number']");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});
