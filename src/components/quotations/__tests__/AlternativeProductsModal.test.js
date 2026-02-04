/**
 * AlternativeProductsModal Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests alternative products modal for quotations with product search
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlternativeProductsModal from "../AlternativeProductsModal";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/api", () => ({
  productsAPI: {
    list: vi.fn(),
  },
}));

const mockProductsAPI = () => require("../../../services/api").productsAPI;

describe("AlternativeProductsModal", () => {
  let mockOnClose;
  let mockOnSave;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnSave = vi.fn();
    vi.clearAllMocks();
    mockProductsAPI().list.mockResolvedValue({
      data: {
        products: [
          {
            id: "prod-2",
            name: "SS316 Coil",
            specifications: "316 Grade, 1.5mm",
          },
          {
            id: "prod-3",
            name: "SS410 Sheet",
            specifications: "410 Grade, 2mm",
          },
        ],
      },
    });
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <AlternativeProductsModal
        isOpen={false}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render modal when isOpen is true", () => {
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    expect(screen.getByText("Alternative Products")).toBeInTheDocument();
    expect(screen.getByText(/up to 3 substitute products/)).toBeInTheDocument();
  });

  it("should close modal when X button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const closeButton = screen.getByRole("button", { name: "" }).closest("button");
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should close modal when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const backdrop = container.querySelector(".fixed.inset-0.transition-opacity");
    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should search for products when search button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(searchInput, "SS316");
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockProductsAPI().list).toHaveBeenCalledWith({
        search: "SS316",
        limit: 20,
      });
    });
  });

  it("should display search results", async () => {
    const user = userEvent.setup();
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(searchInput, "SS");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("SS316 Coil")).toBeInTheDocument();
      expect(screen.getByText("SS410 Sheet")).toBeInTheDocument();
    });
  });

  it("should add alternative product when result is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(searchInput, "SS");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("SS316 Coil")).toBeInTheDocument();
    });

    const addButton = screen.getByText("SS316 Coil").closest("button");
    await user.click(addButton);

    // Should show the added alternative
    await waitFor(() => {
      expect(screen.getByText("SS316 Coil")).toBeInTheDocument();
    });
  });

  it("should prevent adding current product as alternative", async () => {
    const user = userEvent.setup();
    mockProductsAPI().list.mockResolvedValueOnce({
      data: {
        products: [
          {
            id: "prod-1", // Same as currentProductId
            name: "SS304 Coil",
            specifications: "304 Grade",
          },
          {
            id: "prod-2",
            name: "SS316 Coil",
            specifications: "316 Grade",
          },
        ],
      },
    });

    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(searchInput, "SS");
    await user.click(searchButton);

    await waitFor(() => {
      // Only SS316 should be shown (not SS304 which is current)
      expect(screen.getByText("SS316 Coil")).toBeInTheDocument();
      expect(screen.queryByText("SS304 Coil")).not.toBeInTheDocument();
    });
  });

  it("should not allow more than 3 alternatives", async () => {
    const user = userEvent.setup();
    const alternatives = [
      { productId: "prod-2", productName: "Product 2", priceDifference: 0, notes: "" },
      { productId: "prod-3", productName: "Product 3", priceDifference: 0, notes: "" },
      { productId: "prod-4", productName: "Product 4", priceDifference: 0, notes: "" },
    ];

    mockProductsAPI().list.mockResolvedValueOnce({
      data: {
        products: [
          {
            id: "prod-5",
            name: "Product 5",
            specifications: "New product",
          },
        ],
      },
    });

    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={alternatives}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(searchInput, "Product");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Product 5")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Product 5").closest("button");
    await user.click(addButton);

    expect(screen.getByText(/Maximum 3 alternative products allowed/)).toBeInTheDocument();
  });

  it("should display existing alternatives on open", () => {
    const alternatives = [
      { productId: "prod-2", productName: "SS316 Coil", priceDifference: 50, notes: "Higher cost" },
      { productId: "prod-3", productName: "SS410 Sheet", priceDifference: -30, notes: "Lower cost" },
    ];

    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={alternatives}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    expect(screen.getByText("SS316 Coil")).toBeInTheDocument();
    expect(screen.getByText("SS410 Sheet")).toBeInTheDocument();
  });

  it("should save alternatives when save button is clicked", async () => {
    const user = userEvent.setup();
    const alternatives = [
      { productId: "prod-2", productName: "SS316 Coil", priceDifference: 0, notes: "" },
    ];

    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={alternatives}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(alternatives);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle search errors gracefully", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockProductsAPI().list.mockRejectedValueOnce(new Error("API error"));

    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(searchInput, "SS");
    await user.click(searchButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should disable search button when query is empty", () => {
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchButton = screen.getByRole("button", { name: /Search/ });
    expect(searchButton).toBeDisabled();
  });

  it("should enable search button when query has content", async () => {
    const user = userEvent.setup();
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    expect(searchButton).toBeDisabled();

    await user.type(searchInput, "SS");

    expect(searchButton).not.toBeDisabled();
  });

  it("should allow Enter key to trigger search", async () => {
    const user = userEvent.setup();
    render(
      <AlternativeProductsModal
        isOpen={true}
        onClose={mockOnClose}
        alternatives={[]}
        onSave={mockOnSave}
        currentProductId="prod-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by name, grade/);
    await user.type(searchInput, "SS{Enter}");

    await waitFor(() => {
      expect(mockProductsAPI().list).toHaveBeenCalledWith({
        search: "SS",
        limit: 20,
      });
    });
  });
});
