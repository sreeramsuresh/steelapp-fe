import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

import { renderWithProviders } from "../../../test/component-setup";
import LazyBarChart from "../LazyBarChart";

describe("LazyBarChart", () => {
  const defaultProps = {
    data: [
      { name: "Jan", sales: 400 },
      { name: "Feb", sales: 300 },
    ],
    bars: [{ dataKey: "sales", color: "#8884d8", name: "Sales" }],
  };

  it("renders without crashing", () => {
    const { container } = renderWithProviders(<LazyBarChart {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders responsive container", () => {
    const { getByTestId } = renderWithProviders(<LazyBarChart {...defaultProps} />);
    expect(getByTestId("responsive-container")).toBeTruthy();
  });

  it("renders bar chart", () => {
    const { getByTestId } = renderWithProviders(<LazyBarChart {...defaultProps} />);
    expect(getByTestId("bar-chart")).toBeTruthy();
  });

  it("renders bars for each data key", () => {
    const props = {
      ...defaultProps,
      bars: [
        { dataKey: "sales", color: "#8884d8" },
        { dataKey: "revenue", color: "#82ca9d" },
      ],
    };
    const { getAllByTestId } = renderWithProviders(<LazyBarChart {...props} />);
    expect(getAllByTestId("bar")).toHaveLength(2);
  });

  it("renders with custom xAxisKey", () => {
    const props = { ...defaultProps, xAxisKey: "month" };
    const { container } = renderWithProviders(<LazyBarChart {...props} />);
    expect(container).toBeTruthy();
  });

  it("renders with vertical layout", () => {
    const props = { ...defaultProps, layout: "vertical" };
    const { container } = renderWithProviders(<LazyBarChart {...props} />);
    expect(container).toBeTruthy();
  });

  it("renders without grid when showGrid is false", () => {
    const props = { ...defaultProps, showGrid: false };
    const { container } = renderWithProviders(<LazyBarChart {...props} />);
    expect(container.querySelector('[data-testid="cartesian-grid"]')).toBeNull();
  });

  it("renders without legend when showLegend is false", () => {
    const props = { ...defaultProps, showLegend: false };
    const { container } = renderWithProviders(<LazyBarChart {...props} />);
    expect(container.querySelector('[data-testid="legend"]')).toBeNull();
  });

  it("renders with empty data array", () => {
    const props = { ...defaultProps, data: [] };
    const { container } = renderWithProviders(<LazyBarChart {...props} />);
    expect(container).toBeTruthy();
  });
});
