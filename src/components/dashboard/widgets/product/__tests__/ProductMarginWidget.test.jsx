import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../../../utils/fieldAccessors", () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || "Unknown",
}));

import ProductMarginWidget from "../ProductMarginWidget";

describe("ProductMarginWidget", () => {
  const sampleData = {
    products: [
      { id: 1, name: "SS 304 Sheet", margin: 18.5, volume: 120, revenue: 2500000 },
      { id: 2, name: "SS 316 Coil", margin: 22.3, volume: 85, revenue: 1800000 },
    ],
    thresholds: { volumeMedian: 100, marginMedian: 20 },
  };

  it("renders without crashing", () => {
    render(<ProductMarginWidget data={sampleData} />);
  });

  it("displays the widget title", () => {
    render(<ProductMarginWidget data={sampleData} />);
    expect(screen.getByText("Product Portfolio Matrix")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<ProductMarginWidget data={null} />);
    // Should show no data state
  });

  it("renders empty state when empty products", () => {
    render(<ProductMarginWidget data={{ products: [] }} />);
    // Should show no data state
  });
});
