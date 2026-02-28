import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/api", () => ({
  productsAPI: {
    list: vi.fn().mockResolvedValue({ data: { products: [] } }),
  },
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <span data-testid="alert-circle" {...props} />,
  Search: (props) => <span data-testid="search-icon" {...props} />,
  Trash2: (props) => <span data-testid="trash-icon" {...props} />,
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

import AlternativeProductsModal from "../AlternativeProductsModal";

describe("AlternativeProductsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    alternatives: [],
    onSave: vi.fn(),
    currentProductId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(<AlternativeProductsModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header when open", () => {
    render(<AlternativeProductsModal {...defaultProps} />);
    expect(screen.getByText("Alternative Products")).toBeTruthy();
  });

  it("shows subtitle text", () => {
    render(<AlternativeProductsModal {...defaultProps} />);
    expect(screen.getByText("Add up to 3 substitute products if primary is unavailable")).toBeTruthy();
  });

  it("shows empty state when no alternatives", () => {
    render(<AlternativeProductsModal {...defaultProps} />);
    expect(screen.getByText("No alternative products added yet. Search and add up to 3 alternatives.")).toBeTruthy();
  });

  it("shows search input", () => {
    render(<AlternativeProductsModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search by name, grade, specification...")).toBeTruthy();
  });

  it("shows Save and Cancel buttons", () => {
    render(<AlternativeProductsModal {...defaultProps} />);
    expect(screen.getByText("Save Alternatives")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<AlternativeProductsModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onSave and onClose when Save is clicked", () => {
    render(<AlternativeProductsModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Save Alternatives"));
    expect(defaultProps.onSave).toHaveBeenCalledWith([]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders existing alternatives", () => {
    const alternatives = [{ productId: 2, productName: "Alt Product 1", priceDifference: 5, notes: "" }];
    render(<AlternativeProductsModal {...defaultProps} alternatives={alternatives} />);
    // The input with the product name should be displayed
    const input = screen.getByDisplayValue("Alt Product 1");
    expect(input).toBeTruthy();
  });
});
