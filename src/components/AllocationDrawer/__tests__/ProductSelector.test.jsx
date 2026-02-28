/**
 * ProductSelector Component Tests
 *
 * Tests autocomplete product search with debounced API calls
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSearch = vi.fn();

vi.mock("../../../services/api", () => ({
  productsAPI: {
    search: (...args) => mockSearch(...args),
  },
}));

vi.mock("../../../utils/fieldAccessors", () => ({
  getProductDisplayName: (product) => product.displayName || product.uniqueName || product.name || "Unknown",
  normalizeProduct: (product) => ({
    ...product,
    displayName: product.displayName || product.name,
  }),
}));

import ProductSelector from "../ProductSelector";

describe("ProductSelector", () => {
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue({
      data: {
        products: [
          { id: 1, name: "Steel Plate A", grade: "S275", form: "Plate", width: 1500, thickness: 10 },
          { id: 2, name: "Steel Coil B", grade: "S355", form: "Coil", width: 1200, thickness: 5 },
        ],
      },
    });

    defaultProps = {
      companyId: 1,
      selectedProduct: null,
      onSelectProduct: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render product search input", () => {
      render(<ProductSelector {...defaultProps} />);
      expect(screen.getByLabelText(/Product/)).toBeInTheDocument();
    });

    it("should render search placeholder text", () => {
      render(<ProductSelector {...defaultProps} />);
      expect(screen.getByPlaceholderText(/Search products by name/)).toBeInTheDocument();
    });

    it("should display selected product name when provided", () => {
      const props = {
        ...defaultProps,
        selectedProduct: { id: 1, name: "Steel Plate A", displayName: "Steel Plate A" },
      };
      render(<ProductSelector {...props} />);
      expect(screen.getByDisplayValue("Steel Plate A")).toBeInTheDocument();
    });
  });

  describe("Search Behavior", () => {
    it("should not search when query is less than 2 characters", async () => {
      const user = userEvent.setup();
      render(<ProductSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Search products/);
      await user.type(input, "S");

      // Wait a bit for debounce
      await new Promise((r) => setTimeout(r, 300));
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it("should search when query is 2 or more characters", async () => {
      const user = userEvent.setup();
      render(<ProductSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Search products/);
      await user.type(input, "Steel");

      await waitFor(
        () => {
          expect(mockSearch).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });

    it("should display dropdown with search results", async () => {
      const user = userEvent.setup();
      render(<ProductSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Search products/);
      await user.type(input, "Steel");

      await waitFor(() => {
        expect(screen.getByText("Steel Plate A")).toBeInTheDocument();
        expect(screen.getByText("Steel Coil B")).toBeInTheDocument();
      });
    });

    it("should show no products found message when results are empty", async () => {
      mockSearch.mockResolvedValue({ data: { products: [] } });
      const user = userEvent.setup();
      render(<ProductSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Search products/);
      await user.type(input, "ZZZ");

      await waitFor(() => {
        expect(screen.getByText(/No products found/)).toBeInTheDocument();
      });
    });
  });

  describe("Product Selection", () => {
    it("should call onSelectProduct when a product is clicked", async () => {
      const user = userEvent.setup();
      render(<ProductSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Search products/);
      await user.type(input, "Steel");

      await waitFor(() => {
        expect(screen.getByText("Steel Plate A")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Steel Plate A"));

      expect(defaultProps.onSelectProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });
  });
});
