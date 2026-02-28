import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CustomerPortfolioWidget from "../CustomerPortfolioWidget";

describe("CustomerPortfolioWidget", () => {
  it("renders without crashing", () => {
    render(<CustomerPortfolioWidget />);
  });

  it("displays portfolio content with mock data", () => {
    render(<CustomerPortfolioWidget />);
    expect(screen.getByText(/Customer Portfolio/i)).toBeInTheDocument();
  });

  it("shows customer names from mock data", () => {
    render(<CustomerPortfolioWidget />);
    expect(screen.getByText("Al Rashid Steel Works")).toBeInTheDocument();
  });

  it("renders with custom data", () => {
    const data = {
      agentId: 1,
      agentName: "Test Agent",
      summary: {
        totalCustomers: 20,
        activeCustomers: 15,
        inactiveCustomers: 5,
        top3Concentration: 50,
        diversificationScore: 60,
        riskLevel: "Low",
      },
      topCustomers: [{ id: 1, name: "Test Corp", revenue: 500000, percent: 25 }],
      segments: [],
      trendData: {
        newThisMonth: 2,
        churnedThisMonth: 0,
        reactivated: 1,
      },
    };
    render(<CustomerPortfolioWidget data={data} />);
    expect(screen.getByText("Test Corp")).toBeInTheDocument();
  });
});
