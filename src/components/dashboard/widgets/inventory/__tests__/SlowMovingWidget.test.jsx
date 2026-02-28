import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../../../utils/fieldAccessors", () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || "Unknown",
}));

import SlowMovingWidget from "../SlowMovingWidget";

describe("SlowMovingWidget", () => {
  const sampleData = {
    products: [
      {
        id: 1,
        name: "SS 410 Coil",
        category: "Coils",
        currentStock: 50.0,
        value: 150000,
        daysInStock: 90,
      },
      {
        id: 2,
        name: "SS 202 Plate",
        category: "Plates",
        currentStock: 30.0,
        value: 80000,
        daysInStock: 75,
      },
    ],
    summary: { totalSlowMoving: 2, totalValue: 230000 },
  };

  it("renders without crashing", () => {
    render(<SlowMovingWidget data={sampleData} />);
  });

  it("displays slow-moving products", () => {
    render(<SlowMovingWidget data={sampleData} />);
    expect(screen.getByText("SS 410 Coil")).toBeInTheDocument();
    expect(screen.getByText("SS 202 Plate")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<SlowMovingWidget data={null} />);
    // Should show empty state
  });

  it("renders with empty products array", () => {
    render(<SlowMovingWidget data={{ products: [], summary: null }} />);
    // Should render without crashing
  });
});
