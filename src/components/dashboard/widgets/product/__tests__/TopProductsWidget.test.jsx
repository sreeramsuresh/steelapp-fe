import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../../../utils/fieldAccessors", () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || "Unknown",
}));

import TopProductsWidget from "../TopProductsWidget";

describe("TopProductsWidget", () => {
  const sampleData = {
    byRevenue: [
      { id: 1, name: "SS 304 Sheet", revenue: 2500000, margin: 18.5, volume: 120 },
      { id: 2, name: "SS 316 Coil", revenue: 1800000, margin: 22.3, volume: 85 },
    ],
    byMargin: [{ id: 2, name: "SS 316 Coil", revenue: 1800000, margin: 22.3, volume: 85 }],
    byVolume: [{ id: 1, name: "SS 304 Sheet", revenue: 2500000, margin: 18.5, volume: 120 }],
  };

  it("renders without crashing", () => {
    render(<TopProductsWidget data={sampleData} />);
  });

  it("displays top products by revenue by default", () => {
    render(<TopProductsWidget data={sampleData} />);
    expect(screen.getByText("SS 304 Sheet")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<TopProductsWidget data={null} />);
    // Should show no data state
  });

  it("renders empty state when empty arrays", () => {
    render(<TopProductsWidget data={{ byRevenue: [], byMargin: [], byVolume: [] }} />);
    // Should show no data state
  });
});
