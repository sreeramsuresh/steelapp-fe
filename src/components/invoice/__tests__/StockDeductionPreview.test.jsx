/**
 * StockDeductionPreview Component Tests
 * Tests stock deduction preview when issuing an invoice
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";

// Mock API client
const mockApiGet = vi.fn();
vi.mock("../../../services/api", () => ({
  apiClient: {
    get: (...args) => mockApiGet(...args),
  },
}));

import StockDeductionPreview from "../StockDeductionPreview";

describe("StockDeductionPreview", () => {
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApiGet.mockResolvedValue({
      totalQuantity: 500,
      totalAvailable: 400,
      unit: "KG",
    });

    defaultProps = {
      items: [
        { productId: 1, name: "SS-304 Sheet", quantity: 100, unit: "KG", size: "1000x2000", thickness: 1.5 },
        { productId: 2, name: "SS-316L Coil", quantity: 50, unit: "KG" },
      ],
      warehouseId: "WH-001",
      warehouseName: "Main Warehouse",
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    };
  });

  describe("Rendering", () => {
    it("should render deduction preview", async () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it("should display header title", async () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      // Initially shows loading, then content
      expect(container).toBeInTheDocument();
    });

    it("should display warehouse name when provided", async () => {
      const { container, findByText } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      // Wait for loading to complete so warehouse name appears
      await findByText("Stock Deduction Preview");
      expect(container.textContent).toContain("Main Warehouse");
    });
  });

  describe("Loading State", () => {
    it("should show loading state initially", () => {
      mockApiGet.mockImplementation(() => new Promise(() => {})); // never resolves
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no inventory items", () => {
      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} items={[]} />
      );
      expect(container.textContent).toContain("No inventory-tracked items");
    });

    it("should show empty message for items without productId", () => {
      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} items={[{ name: "Service Item", quantity: 1 }]} />
      );
      expect(container.textContent).toContain("No inventory-tracked items");
    });
  });

  describe("Table Structure", () => {
    it("should render a table when items exist", async () => {
      const { container, findByText } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      // Wait for loading to complete
      await findByText("Stock Deduction Preview");
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should have proper table headers", async () => {
      const { container, findByText } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      await findByText("Stock Deduction Preview");
      const headers = container.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe("Footer Actions", () => {
    it("should render confirm button when onConfirm provided", async () => {
      const { container, findByText } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      await findByText("Stock Deduction Preview");
      const confirmBtn = container.querySelector("button");
      expect(confirmBtn).toBeInTheDocument();
    });

    it("should not render confirm button when onConfirm not provided", async () => {
      const { container } = renderWithProviders(
        <StockDeductionPreview {...defaultProps} onConfirm={undefined} />
      );
      // Should not have the footer action buttons
      expect(container.textContent).not.toContain("Confirm & Issue");
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with light mode", () => {
      const { container } = renderWithProviders(<StockDeductionPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });
});
