import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

import { renderWithProviders } from "../../../test/component-setup";
import LazyLineChart from "../LazyLineChart";

describe("LazyLineChart", () => {
  const defaultProps = {
    data: [
      { date: "2024-01", revenue: 1000 },
      { date: "2024-02", revenue: 1500 },
    ],
    lines: [{ dataKey: "revenue", color: "#8884d8", name: "Revenue" }],
  };

  it("renders without crashing", () => {
    const { container } = renderWithProviders(<LazyLineChart {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders responsive container", () => {
    const { getByTestId } = renderWithProviders(<LazyLineChart {...defaultProps} />);
    expect(getByTestId("responsive-container")).toBeTruthy();
  });

  it("renders line chart", () => {
    const { getByTestId } = renderWithProviders(<LazyLineChart {...defaultProps} />);
    expect(getByTestId("line-chart")).toBeTruthy();
  });

  it("renders lines for each data key", () => {
    const props = {
      ...defaultProps,
      lines: [
        { dataKey: "revenue", color: "#8884d8" },
        { dataKey: "profit", color: "#82ca9d" },
      ],
    };
    const { getAllByTestId } = renderWithProviders(<LazyLineChart {...props} />);
    expect(getAllByTestId("line")).toHaveLength(2);
  });

  it("renders with custom xAxisKey", () => {
    const props = { ...defaultProps, xAxisKey: "month" };
    const { container } = renderWithProviders(<LazyLineChart {...props} />);
    expect(container).toBeTruthy();
  });

  it("renders without grid when showGrid is false", () => {
    const props = { ...defaultProps, showGrid: false };
    const { container } = renderWithProviders(<LazyLineChart {...props} />);
    expect(container.querySelector('[data-testid="cartesian-grid"]')).toBeNull();
  });

  it("renders without legend when showLegend is false", () => {
    const props = { ...defaultProps, showLegend: false };
    const { container } = renderWithProviders(<LazyLineChart {...props} />);
    expect(container.querySelector('[data-testid="legend"]')).toBeNull();
  });

  it("renders with empty data array", () => {
    const props = { ...defaultProps, data: [] };
    const { container } = renderWithProviders(<LazyLineChart {...props} />);
    expect(container).toBeTruthy();
  });

  it("renders with custom line properties", () => {
    const props = {
      ...defaultProps,
      lines: [{ dataKey: "revenue", color: "#ff0000", strokeWidth: 3, dot: false }],
    };
    const { container } = renderWithProviders(<LazyLineChart {...props} />);
    expect(container).toBeTruthy();
  });
});
