import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PriceOverrideModal from "../PriceOverrideModal";

describe("PriceOverrideModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    product: { product_name: "Steel Rod 12mm" },
    defaultPrice: 100,
    currentPrice: 90,
    onSave: vi.fn().mockResolvedValue(undefined),
    isDarkMode: false,
  };

  it("returns null when not open", () => {
    const { container } = render(<PriceOverrideModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders modal when open", () => {
    render(<PriceOverrideModal {...defaultProps} />);
    expect(screen.getByText("Set Customer Price Override")).toBeInTheDocument();
  });

  it("shows product name", () => {
    render(<PriceOverrideModal {...defaultProps} />);
    expect(screen.getByText("Steel Rod 12mm")).toBeInTheDocument();
  });

  it("shows company base price", () => {
    render(<PriceOverrideModal {...defaultProps} />);
    expect(screen.getByText("AED 100.00")).toBeInTheDocument();
  });

  it("shows price input with current value", () => {
    render(<PriceOverrideModal {...defaultProps} />);
    expect(screen.getByDisplayValue("90")).toBeInTheDocument();
  });

  it("calls onClose when Cancel clicked", () => {
    render(<PriceOverrideModal {...defaultProps} />);
    screen.getByText("Cancel").click();
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("has Save Override button", () => {
    render(<PriceOverrideModal {...defaultProps} />);
    expect(screen.getByText("Save Override")).toBeInTheDocument();
  });
});
