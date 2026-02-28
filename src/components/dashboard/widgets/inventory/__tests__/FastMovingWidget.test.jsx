import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../../../utils/fieldAccessors", () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || "Unknown",
}));

import FastMovingWidget from "../FastMovingWidget";

describe("FastMovingWidget", () => {
  const sampleData = {
    products: [
      {
        id: 1,
        name: "SS 304 Sheet",
        turnoverRatio: 5.5,
        currentStock: 120.0,
        reorderPoint: 50,
        daysToSell: 15,
        status: "optimal",
        category: "Sheets",
        lastSaleDate: new Date().toISOString(),
        trend: [100, 110, 130, 120, 140],
      },
      {
        id: 2,
        name: "SS 316 Coil",
        turnoverRatio: 4.2,
        currentStock: 95.0,
        reorderPoint: 40,
        daysToSell: 20,
        status: "optimal",
        category: "Coils",
        lastSaleDate: new Date().toISOString(),
        trend: [80, 85, 90, 95, 100],
      },
    ],
    summary: { totalFastMoving: 2, avgTurnover: 4.85 },
  };

  it("renders without crashing", () => {
    render(<FastMovingWidget data={sampleData} />);
  });

  it("displays products from data", () => {
    render(<FastMovingWidget data={sampleData} />);
    expect(screen.getByText("SS 304 Sheet")).toBeInTheDocument();
    expect(screen.getByText("SS 316 Coil")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<FastMovingWidget data={null} />);
    // Should render without crashing even with no data
  });

  it("renders with empty products array", () => {
    render(<FastMovingWidget data={{ products: [], summary: null }} />);
    // Should render the empty/no data state
  });
});
