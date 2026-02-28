/**
 * LineItemCard Component Tests
 * Tests two-row card layout for line items with index badge, delete button, and amount display
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

import LineItemCard from "../LineItemCard";

describe("LineItemCard", () => {
  const defaultProps = {
    index: 0,
    row1Content: <div>Row 1 Content</div>,
    row2Content: <div>Row 2 Content</div>,
    onDelete: vi.fn(),
  };

  it("renders without crashing", () => {
    const { container } = render(<LineItemCard {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders row number badge with 1-based index", () => {
    render(<LineItemCard {...defaultProps} index={0} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders row1Content and row2Content", () => {
    render(<LineItemCard {...defaultProps} />);
    expect(screen.getByText("Row 1 Content")).toBeInTheDocument();
    expect(screen.getByText("Row 2 Content")).toBeInTheDocument();
  });

  it("renders row3Content when provided", () => {
    render(<LineItemCard {...defaultProps} row3Content={<div>Row 3 Content</div>} />);
    expect(screen.getByText("Row 3 Content")).toBeInTheDocument();
  });

  it("renders amount display when provided", () => {
    render(<LineItemCard {...defaultProps} amountDisplay="AED 14,750.00" />);
    expect(screen.getByText("AED 14,750.00")).toBeInTheDocument();
  });

  it("renders amount breakdown when provided", () => {
    render(<LineItemCard {...defaultProps} amountDisplay="AED 14,750.00" amountBreakdown="50 pcs x 295.00/MT" />);
    expect(screen.getByText("50 pcs x 295.00/MT")).toBeInTheDocument();
  });

  it("renders delete button with title", () => {
    render(<LineItemCard {...defaultProps} />);
    expect(screen.getByTitle("Remove item")).toBeInTheDocument();
  });

  it("disables delete button when disabled prop is true", () => {
    render(<LineItemCard {...defaultProps} disabled />);
    const deleteBtn = screen.getByTitle("Remove item");
    expect(deleteBtn).toBeDisabled();
  });
});
