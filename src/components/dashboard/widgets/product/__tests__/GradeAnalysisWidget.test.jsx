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
        name: "SS 304",
        revenue: 8000000,
        volume: 250,
        trend: "hot",
        sparkline: [100, 120, 130, 125, 140],
        growth: 15.2,
      },
      {
        name: "SS 316",
        revenue: 5000000,
        volume: 150,
        trend: "hot",
        sparkline: [80, 85, 90, 95, 100],
        growth: 8.5,
      },
      {
        name: "SS 430",
        revenue: 2000000,
        volume: 80,
        trend: "cold",
        sparkline: [60, 55, 50, 48, 45],
        growth: -12.3,
      },
    ],
  };

  it("renders without crashing", () => {
    render(<GradeAnalysisWidget data={sampleData} />);
  });

  it("displays grade names", () => {
    render(<GradeAnalysisWidget data={sampleData} />);
    expect(screen.getByText("SS 304")).toBeInTheDocument();
    expect(screen.getByText("SS 316")).toBeInTheDocument();
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
