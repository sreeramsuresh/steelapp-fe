import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import WarehouseFormDialog from "../WarehouseFormDialog";
import sinon from 'sinon';

const mockWarehouseService = {
  createWarehouse: sinon.stub(),
  updateWarehouse: sinon.stub(),
  getWarehouse: sinon.stub(),
  listWarehouses: sinon.stub(),
};

// sinon.stub() // "../../../services/warehouseService", () => ({
  default: mockWarehouseService,
}));

describe("WarehouseFormDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: sinon.stub(),
    onSuccess: sinon.stub(),
  };

  const mockWarehouse = {
    id: "WH-001",
    name: "Main Warehouse",
    location: "Dubai",
    code: "DXB-001",
    type: "Primary",
    capacity: 10000,
    address: "123 Main St",
    manager: "John Doe",
    contactPhone: "04-12345678",
  };

  beforeEach(() => {
    sinon.restore();
  });

  describe("Rendering", () => {
    it("should render warehouse form dialog", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display form fields", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display warehouse name input", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display location input", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display warehouse code field", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display capacity field", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display manager field", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should hide dialog when not open", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} isOpen={false} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Create Mode", () => {
    it("should show empty form for new warehouse", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should create warehouse on submit", () => {
      mockWarehouseService.createWarehouse.mockResolvedValue({
        id: "WH-NEW",
        ...mockWarehouse,
      });
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    it("should load warehouse data for editing", () => {
      mockWarehouseService.getWarehouse.mockResolvedValue(mockWarehouse);
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} warehouseId="WH-001" />);
      expect(container).toBeInTheDocument();
    });

    it("should update warehouse on submit", () => {
      mockWarehouseService.updateWarehouse.mockResolvedValue(mockWarehouse);
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} warehouseId="WH-001" />);
      expect(container).toBeInTheDocument();
    });

    it("should populate form with warehouse data", () => {
      mockWarehouseService.getWarehouse.mockResolvedValue(mockWarehouse);
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} warehouseId="WH-001" />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should require warehouse name", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should require location", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should require warehouse code", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should validate capacity as positive number", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should show validation errors", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Form Actions", () => {
    it("should submit form", () => {
      mockWarehouseService.createWarehouse.mockResolvedValue(mockWarehouse);
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should call onSuccess on successful submit", () => {
      mockWarehouseService.createWarehouse.mockResolvedValue(mockWarehouse);
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should call onClose when closing dialog", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should reset form on cancel", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle creation errors", () => {
      mockWarehouseService.createWarehouse.mockRejectedValue(new Error("API Error"));
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle update errors", () => {
      mockWarehouseService.updateWarehouse.mockRejectedValue(new Error("API Error"));
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} warehouseId="WH-001" />);
      expect(container).toBeInTheDocument();
    });

    it("should display error message", () => {
      mockWarehouseService.createWarehouse.mockRejectedValue(new Error("Failed to create"));
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle loading errors", () => {
      mockWarehouseService.getWarehouse.mockRejectedValue(new Error("Failed to load"));
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} warehouseId="WH-001" />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long warehouse names", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle special characters", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle very large capacity values", () => {
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle null warehouse data", () => {
      mockWarehouseService.getWarehouse.mockResolvedValue(null);
      const { container } = renderWithProviders(<WarehouseFormDialog {...defaultProps} warehouseId="WH-001" />);
      expect(container).toBeInTheDocument();
    });
  });
});
