/**
 * QuickAddChips Component Tests
 * Tests quick-add chips showing product name with pin functionality
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

import QuickAddChips from "../QuickAddChips";

describe("QuickAddChips", () => {
  const mockProducts = [
    { id: 1, name: "Steel Plate 10mm" },
    { id: 2, name: "Steel Rod 12mm" },
    { id: 3, name: "Angle Bar 50x50" },
  ];

  it("renders without crashing with empty products", () => {
    const { container } = render(<QuickAddChips products={[]} onSelect={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("returns null when products array is empty", () => {
    const { container } = render(<QuickAddChips products={[]} onSelect={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders product chips", () => {
    render(<QuickAddChips products={mockProducts} onSelect={vi.fn()} />);
    expect(screen.getByText("Steel Plate 10mm")).toBeInTheDocument();
    expect(screen.getByText("Steel Rod 12mm")).toBeInTheDocument();
    expect(screen.getByText("Angle Bar 50x50")).toBeInTheDocument();
  });

  it("renders default label", () => {
    render(<QuickAddChips products={mockProducts} onSelect={vi.fn()} />);
    expect(screen.getByText(/Quick Add/)).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<QuickAddChips products={mockProducts} onSelect={vi.fn()} label="Frequently Used" />);
    expect(screen.getByText("Frequently Used")).toBeInTheDocument();
  });

  it("renders pin buttons when onTogglePin is provided", () => {
    render(<QuickAddChips products={mockProducts} pinnedIds={[1]} onSelect={vi.fn()} onTogglePin={vi.fn()} />);
    const pinButtons = screen.getAllByTitle(/pin product/i);
    expect(pinButtons.length).toBeGreaterThan(0);
  });
});
