import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CollectionPerformanceWidget from "../CollectionPerformanceWidget";

describe("CollectionPerformanceWidget", () => {
  it("renders without crashing", () => {
    render(<CollectionPerformanceWidget />);
  });

  it("displays collection performance content with mock data", () => {
    render(<CollectionPerformanceWidget />);
    expect(screen.getAllByText(/Collection/i).length).toBeGreaterThan(0);
  });

  it("renders with custom data", () => {
    const data = {
      agentId: 1,
      agentName: "Test Agent",
      summary: {
        collectionRate: 90,
        previousCollectionRate: 85,
        dso: 25,
        previousDso: 30,
        totalOutstanding: 1000000,
        overdueAmount: 200000,
        collectedThisMonth: 2500000,
      },
      agingBuckets: [{ label: "0-30 Days", amount: 500000, percent: 50 }],
    };
    render(<CollectionPerformanceWidget data={data} />);
    expect(screen.getAllByText(/Collection/i).length).toBeGreaterThan(0);
  });

  it("renders with isLoading prop", () => {
    const { container } = render(<CollectionPerformanceWidget isLoading={true} />);
    expect(container).toBeTruthy();
  });
});
