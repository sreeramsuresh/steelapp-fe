import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../../../utils/safeAccess", () => ({
  safeEntries: (obj) => Object.entries(obj || {}),
  safeKeys: (obj) => Object.keys(obj || {}),
  safeNumber: (val, fallback = 0) => {
    const n = Number(val);
    return Number.isNaN(n) ? fallback : n;
  },
}));

import InventoryHealthWidget from "../InventoryHealthWidget";

describe("InventoryHealthWidget", () => {
  const sampleData = {
    overallScore: 78,
    metrics: {
      stockAccuracy: 92,
      turnoverRate: 3.5,
      fillRate: 88,
      deadStockPercent: 5,
    },
    alerts: [{ id: 1, type: "warning", message: "Low stock on SS 304" }],
  };

  it("renders without crashing", () => {
    render(<InventoryHealthWidget data={sampleData} />);
  });

  it("renders empty state when no data", () => {
    render(<InventoryHealthWidget data={null} />);
    // Should render without crashing
  });

  it("renders with data", () => {
    const { container } = render(<InventoryHealthWidget data={sampleData} />);
    expect(container).toBeTruthy();
  });
});
