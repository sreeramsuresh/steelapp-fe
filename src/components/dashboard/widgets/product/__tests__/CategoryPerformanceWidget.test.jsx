import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CategoryPerformanceWidget from "../CategoryPerformanceWidget";

describe("CategoryPerformanceWidget", () => {
  const sampleData = {
    categories: [
      { id: 1, name: "Sheets", revenue: 5000000, growth: 12.5, margin: 18.5, orders: 45, volume: 120 },
      { id: 2, name: "Coils", revenue: 3500000, growth: -5.2, margin: 15.2, orders: 32, volume: 85 },
      { id: 3, name: "Pipes", revenue: 2000000, growth: 8.1, margin: 20.1, orders: 28, volume: 60 },
    ],
  };

  it("renders without crashing", () => {
    render(<CategoryPerformanceWidget data={sampleData} />);
  });

  it("displays category names", () => {
    render(<CategoryPerformanceWidget data={sampleData} />);
    expect(screen.getByText("Sheets")).toBeInTheDocument();
    expect(screen.getByText("Coils")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<CategoryPerformanceWidget data={null} />);
    // Should show no data state with title
    expect(screen.getByText("Category Performance")).toBeInTheDocument();
  });

  it("renders empty state when empty categories", () => {
    render(<CategoryPerformanceWidget data={{ categories: [] }} />);
    expect(screen.getByText("Category Performance")).toBeInTheDocument();
  });
});
