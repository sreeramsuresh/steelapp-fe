import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BulkPriceModal from "../BulkPriceModal";

describe("BulkPriceModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedCount: 5,
    isDarkMode: false,
    onApply: vi.fn().mockResolvedValue(undefined),
  };

  it("returns null when not open", () => {
    const { container } = render(<BulkPriceModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders modal when open", () => {
    render(<BulkPriceModal {...defaultProps} />);
    expect(screen.getByText("Adjust Prices")).toBeInTheDocument();
  });

  it("shows selected product count", () => {
    render(<BulkPriceModal {...defaultProps} />);
    expect(screen.getByText("5 products selected")).toBeInTheDocument();
  });

  it("has increase and decrease radio options", () => {
    render(<BulkPriceModal {...defaultProps} />);
    expect(screen.getByLabelText(/Increase/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Decrease/)).toBeInTheDocument();
  });

  it("defaults to increase (multiply) operation", () => {
    render(<BulkPriceModal {...defaultProps} />);
    const increase = screen.getByLabelText(/Increase/);
    expect(increase).toBeChecked();
  });

  it("shows percentage input", () => {
    render(<BulkPriceModal {...defaultProps} />);
    expect(screen.getByLabelText(/Percentage/)).toBeInTheDocument();
  });

  it("shows warning about irreversibility", () => {
    render(<BulkPriceModal {...defaultProps} />);
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
  });

  it("calls onClose when Cancel clicked", () => {
    render(<BulkPriceModal {...defaultProps} />);
    screen.getByText("Cancel").click();
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("has Apply Changes button", () => {
    render(<BulkPriceModal {...defaultProps} />);
    expect(screen.getByText("Apply Changes")).toBeInTheDocument();
  });
});
