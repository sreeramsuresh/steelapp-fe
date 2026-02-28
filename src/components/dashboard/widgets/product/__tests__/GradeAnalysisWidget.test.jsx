import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import GradeAnalysisWidget from "../GradeAnalysisWidget";

describe("GradeAnalysisWidget", () => {
  const sampleData = {
    grades: [
      {
        grade: "SS 304",
        revenue: 8000000,
        volume: 250,
        demand: "high",
        margin: 18.5,
        avgPrice: 320,
        priceChange: 5.2,
        trend: [100, 120, 130, 125, 140],
      },
      {
        grade: "SS 316",
        revenue: 5000000,
        volume: 150,
        demand: "high",
        margin: 22.3,
        avgPrice: 450,
        priceChange: 3.1,
        trend: [80, 85, 90, 95, 100],
      },
      {
        grade: "SS 430",
        revenue: 2000000,
        volume: 80,
        demand: "low",
        margin: 12.0,
        avgPrice: 180,
        priceChange: -2.5,
        trend: [60, 55, 50, 48, 45],
      },
    ],
  };

  it("renders without crashing", () => {
    render(<GradeAnalysisWidget data={sampleData} />);
  });

  it("displays grade names", () => {
    render(<GradeAnalysisWidget data={sampleData} />);
    expect(screen.getAllByText("SS 304").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SS 316").length).toBeGreaterThan(0);
  });

  it("renders empty state when no data", () => {
    render(<GradeAnalysisWidget data={null} />);
    // Should render without crashing
  });

  it("renders with empty grades array", () => {
    render(<GradeAnalysisWidget data={{ grades: [] }} />);
    // Should render without crashing
  });
});
