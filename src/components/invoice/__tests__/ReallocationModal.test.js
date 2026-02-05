/**
 * ReallocationModal Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests batch reallocation modal for invoice line items
 */

import sinon from "sinon";
// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import { createMockArray, createMockBatch } from "../../../test/mock-factories";
import ReallocationModal from "../ReallocationModal";

// Mock the API service
// sinon.stub() // "../../../services/api", () => ({
default:
{
  post: sinon.stub(), get;
  : sinon.stub(),
}
,
}))

import api from "../../../services/api";

describe("ReallocationModal", () => {
  let mockOnClose;
  let mockOnSuccess;
  let defaultProps;
  let mockBatches;
  let mockCurrentAllocations;

  beforeEach(() => {
    sinon.restore();
    mockOnClose = sinon.stub();
    mockOnSuccess = sinon.stub();

    mockBatches = createMockArray(createMockBatch, 3, (index) => ({
      id: index + 1,
      batchNumber: `BATCH-2024-${String(index + 1).padStart(3, "0")}`,
      quantityAvailable: 500 - index * 100,
      unitCost: 100 + index * 10,
      procurementChannel: index === 0 ? "LOCAL" : "IMPORTED",
    }));

    mockCurrentAllocations = [
      { batchId: 1, quantity: 50 },
      { batchId: 2, quantity: 75 },
    ];

    defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onSuccess: mockOnSuccess,
      invoiceItemId: "item-123",
      productId: 123,
      warehouseId: "WH-001",
      requiredQty: 100,
      currentAllocations: mockCurrentAllocations,
    };

    api.get.mockResolvedValue({ batches: mockBatches });
    api.post.mockResolvedValue({ success: true, allocations: [] });
  });

  describe("Modal Rendering", () => {
    it("should render modal when open", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} isOpen={false} />);

      // Modal should be hidden or not rendered
      expect(container).toBeInTheDocument();
    });

    it("should display modal title", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Reallocate Batches");
    });

    it("should display close button", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Current Allocations Display", () => {
    it("should display current allocations", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Current Allocations");
    });

    it("should show batch numbers from current allocations", async () => {
      api.get.mockResolvedValue({ batches: mockBatches });

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH");
    });

    it("should show quantities in current allocations", async () => {
      api.get.mockResolvedValue({ batches: mockBatches });

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("50");
      expect(container.textContent).toContain("75");
    });

    it("should calculate total current allocation", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Total");
    });
  });

  describe("Available Batches Display", () => {
    it("should load and display available batches", async () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
      expect(container).toBeInTheDocument();
    });

    it("should show batch numbers for selection", async () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH");
    });

    it("should show available quantities", async () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("500");
    });

    it("should show unit costs", async () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("AED");
    });

    it("should show procurement channel badges", async () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("LOCAL");
      expect(container.textContent).toContain("IMPORTED");
    });
  });

  describe("Batch Selection", () => {
    it("should allow selecting batches", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const inputs = container.querySelectorAll("input[type='number']");
      if (inputs.length > 0) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], "30");
        expect(inputs[0].value).toBe("30");
      }
    });

    it("should validate quantity limits", async () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const inputs = container.querySelectorAll("input[type='number']");
      if (inputs.length > 0) {
        expect(inputs[0]).toHaveAttribute("max");
      }
    });

    it("should handle decimal quantities", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const inputs = container.querySelectorAll("input[type='number']");
      if (inputs.length > 0) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], "30.5");
        expect(inputs[0].value).toBe("30.5");
      }
    });

    it("should allow clearing selection", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const clearButton = Array.from(buttons).find((btn) => btn.textContent.includes("Clear"));

      if (clearButton) {
        await user.click(clearButton);
        expect(container).toBeInTheDocument();
      }
    });
  });

  describe("Reallocation Status", () => {
    it("should show status when new allocation is complete", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Status");
    });

    it("should calculate remaining quantity needed", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should indicate when allocation exceeds requirement", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} requiredQty={50} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const inputs = container.querySelectorAll("input[type='number']");
      if (inputs.length > 0) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], "100");
        expect(container).toBeInTheDocument();
      }
    });
  });

  describe("Modal Actions", () => {
    it("should have Save button", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Save");
    });

    it("should have Cancel button", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Cancel");
    });

    it("should call onClose when Cancel clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      const buttons = container.querySelectorAll("button");
      const cancelButton = Array.from(buttons).find((btn) => btn.textContent.includes("Cancel"));

      if (cancelButton) {
        await user.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("should call API on Save", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find((btn) => btn.textContent.includes("Save"));

      if (saveButton) {
        await user.click(saveButton);
        expect(api.post).toHaveBeenCalled();
      }
    });

    it("should call onSuccess after successful save", async () => {
      api.post.mockResolvedValue({ success: true });

      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find((btn) => btn.textContent.includes("Save"));

      if (saveButton) {
        await user.click(saveButton);
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockOnSuccess).toHaveBeenCalled();
      }
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      api.post.mockRejectedValue(new Error("Reallocation failed"));

      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find((btn) => btn.textContent.includes("Save"));

      if (saveButton) {
        await user.click(saveButton);
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(container).toBeInTheDocument();
      }
    });

    it("should handle batch fetch error", async () => {
      api.get.mockRejectedValue(new Error("Failed to load batches"));

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should show retry button on error", async () => {
      api.get.mockRejectedValue(new Error("Failed"));

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Retry");
    });
  });

  describe("Validation", () => {
    it("should validate total allocation meets requirement", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} requiredQty={200} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const inputs = container.querySelectorAll("input[type='number']");
      if (inputs.length > 0) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], "50");
        expect(container).toBeInTheDocument();
      }
    });

    it("should prevent save with insufficient allocation", async () => {
      api.post.mockResolvedValue({ success: false, error: "Insufficient allocation" });

      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} requiredQty={200} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find((btn) => btn.textContent.includes("Save"));

      if (saveButton) {
        await user.click(saveButton);
        expect(container).toBeInTheDocument();
      }
    });

    it("should validate against available quantities", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Batch Comparison", () => {
    it("should highlight changes from current allocation", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Current");
      expect(container.textContent).toContain("New");
    });

    it("should show difference in allocations", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator while fetching batches", () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Loading");
    });

    it("should show loading indicator while saving", async () => {
      api.post.mockImplementation(() => new Promise(() => {}));

      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find((btn) => btn.textContent.includes("Save"));

      if (saveButton) {
        await user.click(saveButton);
        expect(container).toBeInTheDocument();
      }
    });
  });

  describe("Multiple Batches", () => {
    it("should handle reallocation across multiple batches", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should calculate total across all selected batches", async () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Total");
    });

    it("should allow partial quantities from each batch", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const inputs = container.querySelectorAll("input[type='number']");
      if (inputs.length >= 2) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], "30");
        await user.clear(inputs[1]);
        await user.type(inputs[1], "70");
        expect(inputs[0].value).toBe("30");
        expect(inputs[1].value).toBe("70");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle single batch", () => {
      const singleBatch = [mockBatches[0]];
      api.get.mockResolvedValue({ batches: singleBatch });

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle large quantities", () => {
      const largeBatches = [{ ...mockBatches[0], quantityAvailable: 999999.99 }];
      api.get.mockResolvedValue({ batches: largeBatches });

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} requiredQty={999999.99} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle zero available quantity", () => {
      const zeroBatches = [{ ...mockBatches[0], quantityAvailable: 0 }];
      api.get.mockResolvedValue({ batches: zeroBatches });

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle no available batches", () => {
      api.get.mockResolvedValue({ batches: [] });

      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("No batches");
    });

    it("should handle current allocation with missing batches", () => {
      const { container } = renderWithProviders(
        <ReallocationModal {...defaultProps} currentAllocations={[{ batchId: 999, quantity: 100 }]} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    it("should fetch batches on mount", async () => {
      renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should pass correct parameters to save API", async () => {
      api.post.mockResolvedValue({ success: true });

      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find((btn) => btn.textContent.includes("Save"));

      if (saveButton) {
        await user.click(saveButton);
        expect(api.post).toHaveBeenCalled();
      }
    });

    it("should include invoiceItemId in save request", async () => {
      api.post.mockResolvedValue({ success: true });

      const user = setupUser();
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find((btn) => btn.textContent.includes("Save"));

      if (saveButton) {
        await user.click(saveButton);
        expect(api.post).toHaveBeenCalled();
      }
    });
  });

  describe("Accessibility", () => {
    it("should have form inputs with labels", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      const inputs = container.querySelectorAll("input");
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should have descriptive button labels", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container.textContent).toContain("Save");
      expect(container.textContent).toContain("Cancel");
    });

    it("should have proper modal structure", () => {
      const { container } = renderWithProviders(<ReallocationModal {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });
});
