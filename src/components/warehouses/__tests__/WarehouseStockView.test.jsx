/**
 * WarehouseStockView Component Tests
 * Tests stock level display for a warehouse with filters
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getStock: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

import WarehouseStockView from "../WarehouseStockView";

describe("WarehouseStockView", () => {
  it("renders without crashing", () => {
    const { container } = render(<WarehouseStockView warehouseId={1} />);
    expect(container).toBeTruthy();
  });

  it("renders search input", () => {
    render(<WarehouseStockView warehouseId={1} />);
    expect(screen.getByPlaceholderText("Search products...")).toBeInTheDocument();
  });

  it("renders All Types filter option", () => {
    render(<WarehouseStockView warehouseId={1} />);
    expect(screen.getByText("All Types")).toBeInTheDocument();
  });

  it("renders Low Stock filter button", () => {
    render(<WarehouseStockView warehouseId={1} />);
    expect(screen.getByText(/Low Stock/)).toBeInTheDocument();
  });

  it("renders View in Inventory link", () => {
    render(<WarehouseStockView warehouseId={1} />);
    expect(screen.getByText(/View in Inventory/)).toBeInTheDocument();
  });

  it("renders results count", () => {
    render(<WarehouseStockView warehouseId={1} />);
    expect(screen.getByText(/Showing \d+ of \d+ products/)).toBeInTheDocument();
  });
});
