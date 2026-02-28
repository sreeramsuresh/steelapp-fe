import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import RevenueKPIWidget from "../RevenueKPIWidget";

describe("RevenueKPIWidget", () => {
  it("renders without crashing", () => {
    render(<RevenueKPIWidget />);
  });

  it("displays the widget title", () => {
    render(<RevenueKPIWidget />);
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
  });

  it("shows no data state when revenue is zero", () => {
    render(<RevenueKPIWidget totalRevenue={0} />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("displays revenue value when provided", () => {
    render(<RevenueKPIWidget totalRevenue={5000000} />);
    expect(screen.getByText("AED 5,000,000")).toBeInTheDocument();
  });

  it("shows positive revenue change", () => {
    render(<RevenueKPIWidget totalRevenue={5000000} revenueChange={12.5} />);
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });

  it("shows vs previous month text", () => {
    render(<RevenueKPIWidget totalRevenue={1000000} />);
    expect(screen.getByText("vs previous month")).toBeInTheDocument();
  });
});
