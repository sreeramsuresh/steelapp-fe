/**
 * WarehouseAvailability Component Tests
 * Phase 5.3.2c: Tier 1 - Inventory & Stock Component
 *
 * Tests warehouse stock availability display and selection
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import sinon from "sinon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { productService } from "../../../services/productService";
import WarehouseAvailability from "../WarehouseAvailability";

// sinon.stub() // "../../../services/productService");

describe("WarehouseAvailability", () => {
  let mockOnWarehouseSelect;

  beforeEach(() => {
    sinon.restore();
    mockOnWarehouseSelect = sinon.stub();

    productService.getWarehouseStock = sinon.stub().mockResolvedValue({
      data: [
        {
          warehouseId: 1,
          warehouseName: "Main Warehouse",
          warehouseCode: "WH-001",
          availableQuantity: 500,
          unit: "PCS",
        },
        {
          warehouseId: 2,
          warehouseName: "Secondary Warehouse",
          warehouseCode: "WH-002",
          availableQuantity: 300,
          unit: "PCS",
        },
        {
          warehouseId: 3,
          warehouseName: "Empty Warehouse",
          warehouseCode: "WH-003",
          availableQuantity: 0,
          unit: "PCS",
        },
      ],
    });
  });

  describe("Rendering", () => {
    it("should not render when productId is not provided", () => {
      const { container } = render(<WarehouseAvailability productId={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render label when productId provided", () => {
      render(<WarehouseAvailability productId={123} />);
      expect(screen.getByText("Warehouse Availability")).toBeInTheDocument();
    });

    it("should display loading state initially", async () => {
      productService.getWarehouseStock = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
      );

      render(<WarehouseAvailability productId={123} />);

      expect(screen.getByText("Loading warehouse stock...")).toBeInTheDocument();
    });

    it("should display empty state when no warehouses", async () => {
      productService.getWarehouseStock = sinon.stub().mockResolvedValue({ data: [] });

      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("No warehouses found")).toBeInTheDocument();
      });
    });

    it("should display error message on fetch failure", async () => {
      productService.getWarehouseStock = sinon.stub().mockRejectedValue(new Error("API Error"));

      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load warehouse availability")).toBeInTheDocument();
      });
    });
  });

  describe("Warehouse List Display", () => {
    it("should display all warehouses with stock", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
        expect(screen.getByText("Secondary Warehouse")).toBeInTheDocument();
        expect(screen.getByText("Empty Warehouse")).toBeInTheDocument();
      });
    });

    it("should display warehouse codes", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("(WH-001)")).toBeInTheDocument();
        expect(screen.getByText("(WH-002)")).toBeInTheDocument();
      });
    });

    it("should display available quantities", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("500.00")).toBeInTheDocument();
        expect(screen.getByText("300.00")).toBeInTheDocument();
        expect(screen.getByText("0.00")).toBeInTheDocument();
      });
    });

    it("should display unit for each warehouse", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        const pcsLabels = screen.getAllByText("PCS");
        expect(pcsLabels.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("Warehouse Selection", () => {
    it("should call onWarehouseSelect when warehouse clicked", async () => {
      const user = userEvent.setup();
      render(<WarehouseAvailability productId={123} onWarehouseSelect={mockOnWarehouseSelect} />);

      await waitFor(() => {
        expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      });

      const mainWarehouseButton = screen.getByRole("button", { name: /Main Warehouse/ });
      await user.click(mainWarehouseButton);

      expect(mockOnWarehouseSelect).toHaveBeenCalledWith(1);
    });

    it("should highlight selected warehouse", async () => {
      render(
        <WarehouseAvailability productId={123} selectedWarehouseId={1} onWarehouseSelect={mockOnWarehouseSelect} />
      );

      await waitFor(() => {
        const mainWarehouseButton = screen.getByRole("button", { name: /Main Warehouse/ });
        expect(mainWarehouseButton).toHaveAttribute("data-selected", "true");
      });
    });

    it("should support keyboard selection (Enter)", async () => {
      const user = userEvent.setup();
      render(<WarehouseAvailability productId={123} onWarehouseSelect={mockOnWarehouseSelect} />);

      await waitFor(() => {
        expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      });

      const mainWarehouseButton = screen.getByRole("button", { name: /Main Warehouse/ });
      mainWarehouseButton.focus();
      await user.keyboard("{Enter}");

      expect(mockOnWarehouseSelect).toHaveBeenCalledWith(1);
    });

    it("should support keyboard selection (Space)", async () => {
      const user = userEvent.setup();
      render(<WarehouseAvailability productId={123} onWarehouseSelect={mockOnWarehouseSelect} />);

      await waitFor(() => {
        expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      });

      const mainWarehouseButton = screen.getByRole("button", { name: /Main Warehouse/ });
      mainWarehouseButton.focus();
      await user.keyboard(" ");

      expect(mockOnWarehouseSelect).toHaveBeenCalledWith(1);
    });
  });

  describe("Stock Status Indicators", () => {
    it("should mark warehouses with stock as has-stock", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        const mainWarehouse = screen.getByRole("button", { name: /Main Warehouse/ });
        expect(mainWarehouse).toHaveAttribute("data-has-stock", "true");
      });
    });

    it("should mark warehouses without stock as no-stock", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        const emptyWarehouse = screen.getByRole("button", { name: /Empty Warehouse/ });
        expect(emptyWarehouse).toHaveAttribute("data-has-stock", "false");
      });
    });

    it("should apply different styling for no-stock warehouses", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        const emptyWarehouse = screen.getByRole("button", { name: /Empty Warehouse/ });
        expect(emptyWarehouse.className).toContain("no-stock");
      });
    });
  });

  describe("Auto-Selection", () => {
    it("should auto-select first warehouse with stock when enabled", async () => {
      render(
        <WarehouseAvailability productId={123} autoSelectFirst={true} onWarehouseSelect={mockOnWarehouseSelect} />
      );

      await waitFor(() => {
        expect(mockOnWarehouseSelect).toHaveBeenCalledWith(1);
      });
    });

    it("should not auto-select when autoSelectFirst is false", async () => {
      mockOnWarehouseSelect.mockClear();

      render(
        <WarehouseAvailability productId={123} autoSelectFirst={false} onWarehouseSelect={mockOnWarehouseSelect} />
      );

      await waitFor(() => {
        expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      });

      // Should not have been called for auto-selection
      expect(mockOnWarehouseSelect).not.toHaveBeenCalled();
    });

    it("should not auto-select when selection already exists", async () => {
      mockOnWarehouseSelect.mockClear();

      render(
        <WarehouseAvailability
          productId={123}
          selectedWarehouseId={2}
          autoSelectFirst={true}
          onWarehouseSelect={mockOnWarehouseSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      });

      // Should not call for auto-selection since one already selected
      expect(mockOnWarehouseSelect).not.toHaveBeenCalled();
    });

    it("should skip warehouses with zero stock for auto-selection", async () => {
      productService.getWarehouseStock = sinon.stub().mockResolvedValue({
        data: [
          {
            warehouseId: 3,
            warehouseName: "Empty Warehouse",
            warehouseCode: "WH-003",
            availableQuantity: 0,
            unit: "PCS",
          },
          {
            warehouseId: 1,
            warehouseName: "Main Warehouse",
            warehouseCode: "WH-001",
            availableQuantity: 500,
            unit: "PCS",
          },
        ],
      });

      mockOnWarehouseSelect.mockClear();

      render(
        <WarehouseAvailability productId={123} autoSelectFirst={true} onWarehouseSelect={mockOnWarehouseSelect} />
      );

      await waitFor(() => {
        // Should select warehouse 1 (first with stock), not warehouse 3
        expect(mockOnWarehouseSelect).toHaveBeenCalledWith(1);
      });
    });
  });

  describe("Product Selection Changes", () => {
    it("should refetch warehouses when productId changes", async () => {
      const { rerender } = render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(productService.getWarehouseStock).toHaveBeenCalledWith(123);
      });

      rerender(<WarehouseAvailability productId={456} />);

      await waitFor(() => {
        expect(productService.getWarehouseStock).toHaveBeenCalledWith(456);
      });
    });

    it("should clear warehouses when productId becomes null", async () => {
      const { rerender } = render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      });

      rerender(<WarehouseAvailability productId={null} />);

      expect(screen.queryByText("Main Warehouse")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have descriptive label for warehouse list", async () => {
      const { getByRole } = render(<WarehouseAvailability productId={123} />);

      const warehouseList =
        getByRole("region", { hidden: true }) || screen.getByText("Warehouse Availability").parentElement;
      expect(warehouseList).toBeInTheDocument();
    });

    it("should have proper button roles", async () => {
      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it("should have aria-label for interactive buttons", async () => {
      render(<WarehouseAvailability productId={123} onWarehouseSelect={mockOnWarehouseSelect} />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
          expect(button.textContent || button.getAttribute("aria-label")).toBeTruthy();
        });
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle warehouses with very large quantities", async () => {
      productService.getWarehouseStock = sinon.stub().mockResolvedValue({
        data: [
          {
            warehouseId: 1,
            warehouseName: "Large Warehouse",
            warehouseCode: "WH-001",
            availableQuantity: 999999.99,
            unit: "KG",
          },
        ],
      });

      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("1000000.00")).toBeInTheDocument();
      });
    });

    it("should handle warehouses with decimal quantities", async () => {
      productService.getWarehouseStock = sinon.stub().mockResolvedValue({
        data: [
          {
            warehouseId: 1,
            warehouseName: "Precision Warehouse",
            warehouseCode: "WH-001",
            availableQuantity: 123.456,
            unit: "KG",
          },
        ],
      });

      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("123.46")).toBeInTheDocument();
      });
    });

    it("should handle missing warehouse code gracefully", async () => {
      productService.getWarehouseStock = sinon.stub().mockResolvedValue({
        data: [
          {
            warehouseId: 1,
            warehouseName: "No Code Warehouse",
            // warehouseCode is missing
            availableQuantity: 500,
            unit: "PCS",
          },
        ],
      });

      render(<WarehouseAvailability productId={123} />);

      await waitFor(() => {
        expect(screen.getByText("No Code Warehouse")).toBeInTheDocument();
      });
    });
  });

  describe("Selection Hint", () => {
    it("should show selection hint when warehouse selected and callback provided", async () => {
      render(
        <WarehouseAvailability productId={123} selectedWarehouseId={1} onWarehouseSelect={mockOnWarehouseSelect} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Click to change/)).toBeInTheDocument();
      });
    });

    it("should not show selection hint when no callback", async () => {
      render(<WarehouseAvailability productId={123} selectedWarehouseId={1} />);

      await waitFor(() => {
        expect(screen.queryByText(/Click to change/)).not.toBeInTheDocument();
      });
    });
  });
});
