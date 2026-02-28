/**
 * WarehouseSummaryCards Component Tests
 * Tests KPI summary cards at the top of warehouse list page
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

import WarehouseSummaryCards from "../WarehouseSummaryCards";

describe("WarehouseSummaryCards", () => {
  const defaultSummary = {
    totalWarehouses: 5,
    activeWarehouses: 4,
    totalInventoryItems: 1250,
    lowStockItems: 3,
  };

  it("renders without crashing", () => {
    const { container } = render(
      <WarehouseSummaryCards summary={defaultSummary} loading={false} />
    );
    expect(container).toBeTruthy();
  });

  it("renders all four card titles", () => {
    render(<WarehouseSummaryCards summary={defaultSummary} loading={false} />);
    expect(screen.getByText("Total Warehouses")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Total Items")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Alerts")).toBeInTheDocument();
  });

  it("renders summary values", () => {
    render(<WarehouseSummaryCards summary={defaultSummary} loading={false} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders loading placeholders when loading", () => {
    const { container } = render(
      <WarehouseSummaryCards summary={defaultSummary} loading={true} />
    );
    const placeholders = container.querySelectorAll(".animate-pulse");
    expect(placeholders.length).toBe(4);
  });

  it("shows info message when total items is 0", () => {
    const zeroItems = { ...defaultSummary, totalInventoryItems: 0 };
    render(<WarehouseSummaryCards summary={zeroItems} loading={false} />);
    expect(screen.getByText(/Products Catalog/)).toBeInTheDocument();
  });
});
