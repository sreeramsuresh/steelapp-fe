import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../charts", () => ({
  GaugeChartWrapper: ({ value }) => <div data-testid="gauge-chart">Gauge: {value}</div>,
}));

import GrossMarginWidget from "../GrossMarginWidget";

describe("GrossMarginWidget", () => {
  it("renders without crashing", () => {
    render(<GrossMarginWidget />);
  });

  it("displays the widget title", () => {
    render(<GrossMarginWidget />);
    expect(screen.getByText("Gross Margin")).toBeInTheDocument();
  });

  it("shows fallback margin when no data provided", () => {
    render(<GrossMarginWidget />);
    expect(screen.getByText("18.5%")).toBeInTheDocument();
  });

  it("shows custom margin value", () => {
    render(<GrossMarginWidget grossMargin={25.3} />);
    expect(screen.getByText("25.3%")).toBeInTheDocument();
  });

  it("renders gauge chart when showGauge is true", () => {
    render(<GrossMarginWidget showGauge={true} />);
    expect(screen.getByTestId("gauge-chart")).toBeInTheDocument();
  });

  it("shows description label in non-gauge mode", () => {
    render(<GrossMarginWidget />);
    expect(screen.getByText("Weighted average across all sales")).toBeInTheDocument();
  });
});
