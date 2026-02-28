import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import APAgingWidget from "../APAgingWidget";

describe("APAgingWidget", () => {
  it("renders without crashing", () => {
    render(<APAgingWidget />);
  });

  it("displays the widget title", () => {
    render(<APAgingWidget />);
    expect(screen.getByText("AP Aging")).toBeInTheDocument();
  });

  it("displays aging buckets from fallback data", () => {
    render(<APAgingWidget />);
    expect(screen.getByText("0-30 Days")).toBeInTheDocument();
    expect(screen.getByText("31-60 Days")).toBeInTheDocument();
    expect(screen.getByText("61-90 Days")).toBeInTheDocument();
    expect(screen.getByText("90+ Days")).toBeInTheDocument();
  });

  it("displays total AP and overdue amounts", () => {
    render(<APAgingWidget />);
    expect(screen.getByText("Total AP")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows critical suppliers section", () => {
    render(<APAgingWidget />);
    expect(screen.getByText("Critical Suppliers")).toBeInTheDocument();
    expect(screen.getByText("Steel Corp Ltd")).toBeInTheDocument();
  });

  it("renders with custom prop data", () => {
    const customData = {
      buckets: [
        { label: "Current", amount: 50000, percentage: 60, count: 5 },
        { label: "Overdue", amount: 30000, percentage: 40, count: 3 },
      ],
      totalAP: 80000,
      overdueAP: 30000,
      criticalSuppliers: [],
    };
    render(<APAgingWidget data={customData} />);
    expect(screen.getByText("Current")).toBeInTheDocument();
  });
});
