/**
 * Widget Integration Tests
 */

import { fireEvent, render, screen } from "@testing-library/react";
import sinon from "sinon";
import { describe, expect, it, vi } from "vitest";
import { ThemeContext } from "../../../contexts/ThemeContext";

const renderWithTheme = (component, isDarkMode = false) => {
  return render(
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme: sinon.stub() }}>{component}</ThemeContext.Provider>
  );
};

// sinon.stub() // "../widgets/BaseWidget", () => ({
default: (
{
  title, children, loading, error, onRefresh;
}
) => (
    <div data-testid="base-widget">
      <h3>
{
  title;
}
</h3>
{
  loading && <div data-testid="loading">Loading...</div>;
}
{
  error && <div data-testid="error">{error}</div>;
}
{
  !loading && !error && children;
}
{
  onRefresh && (
    <button type="button" onClick={onRefresh}>
      Refresh
    </button>
  );
}
</div>
  ),
  WidgetEmptyState: (
{
  message;
}
) => <div>
{
  message;
}
</div>,
MetricValue: (
{
  value;
}
) => <div>
{
  value;
}
</div>, WidgetListItem;
: (
{
  title;
}
) => <div>
{
  title;
}
</div>,
}))

// sinon.stub() // "../charts/RechartsWrapper", () => ({
BarChartWrapper: () => <div data-testid="bar-chart" />, LineChartWrapper
: () => <div data-testid="line-chart" />,
  PieChartWrapper: () => <div data-testid="pie-chart" />,
  DonutChartWrapper: () => <div data-testid="donut-chart" />,
}))

// sinon.stub() // "../charts/EChartsWrapper", () => ({
GaugeChartWrapper: () => <div data-testid="gauge-chart" />, TreemapChartWrapper
: () => <div data-testid="treemap-chart" />,
  FunnelChartWrapper: () => <div data-testid="funnel-chart" />,
}))

import RevenueKPIWidget from "../widgets/financial/RevenueKPIWidget";
import InventoryHealthWidget from "../widgets/inventory/InventoryHealthWidget";
import VATCollectionWidget from "../widgets/vat/VATCollectionWidget";

describe("RevenueKPIWidget", () => {
  it("renders widget", () => {
    renderWithTheme(<RevenueKPIWidget totalRevenue={500000} revenueChange={12.5} />);
    expect(screen.getByTestId("base-widget")).toBeInTheDocument();
  });

  it("handles loading state", () => {
    renderWithTheme(<RevenueKPIWidget loading={true} />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("handles refresh", () => {
    const onRefresh = sinon.stub();
    renderWithTheme(<RevenueKPIWidget onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText("Refresh"));
    expect(onRefresh).toHaveBeenCalled();
  });
});

describe("VATCollectionWidget", () => {
  it("renders widget", () => {
    renderWithTheme(<VATCollectionWidget outputVAT={25000} inputVAT={18000} />);
    expect(screen.getByText("VAT Collection")).toBeInTheDocument();
  });

  it("handles loading state", () => {
    renderWithTheme(<VATCollectionWidget isLoading={true} />);
    // VATCollectionWidget shows content even while loading (spinner on refresh button)
    expect(screen.getByText("VAT Collection")).toBeInTheDocument();
  });
});

describe("InventoryHealthWidget", () => {
  it("renders widget", () => {
    renderWithTheme(
      <InventoryHealthWidget
        data={{
          healthScore: 85,
          totalValue: 2500000,
          daysOfStock: 45,
          breakdown: {},
          alerts: {},
        }}
      />
    );
    expect(screen.getByText("Inventory Health")).toBeInTheDocument();
  });

  it("handles no data state", () => {
    renderWithTheme(<InventoryHealthWidget />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });
});

describe("Widget Edge Cases", () => {
  it("handles zero values", () => {
    renderWithTheme(<RevenueKPIWidget totalRevenue={0} revenueChange={0} />);
    expect(screen.getByTestId("base-widget")).toBeInTheDocument();
  });

  it("handles negative changes", () => {
    renderWithTheme(<RevenueKPIWidget totalRevenue={100000} revenueChange={-5.5} />);
    expect(screen.getByTestId("base-widget")).toBeInTheDocument();
  });
});
