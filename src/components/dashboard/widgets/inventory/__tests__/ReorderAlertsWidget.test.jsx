import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../../../utils/fieldAccessors", () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || "Unknown",
}));

import ReorderAlertsWidget from "../ReorderAlertsWidget";

describe("ReorderAlertsWidget", () => {
  const sampleData = {
    products: [
      {
        id: 1,
        name: "SS 304 Sheet",
        currentStock: 10,
        reorderPoint: 50,
        severity: "critical",
        daysUntilStockout: 3,
      },
      {
        id: 2,
        name: "SS 316 Coil",
        currentStock: 30,
        reorderPoint: 40,
        severity: "warning",
        daysUntilStockout: 10,
      },
    ],
    summary: { critical: 1, warning: 1, total: 2 },
  };

  it("renders without crashing", () => {
    render(<ReorderAlertsWidget data={sampleData} />);
  });

  it("displays products needing reorder", () => {
    render(<ReorderAlertsWidget data={sampleData} />);
    expect(screen.getByText("SS 304 Sheet")).toBeInTheDocument();
    expect(screen.getByText("SS 316 Coil")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<ReorderAlertsWidget data={null} />);
    // Should show empty state
  });

  it("renders with empty products array", () => {
    render(<ReorderAlertsWidget data={{ products: [], summary: null }} />);
    // Should render without crashing
  });
});
