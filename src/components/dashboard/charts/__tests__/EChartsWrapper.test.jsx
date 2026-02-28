import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("echarts/core", () => {
  const use = vi.fn();
  return {
    default: { use },
    use,
    __esModule: true,
  };
});

vi.mock("echarts/charts", () => ({
  BarChart: {},
  GaugeChart: {},
  FunnelChart: {},
  HeatmapChart: {},
  TreemapChart: {},
}));

vi.mock("echarts/components", () => ({
  GridComponent: {},
  LegendComponent: {},
  TitleComponent: {},
  ToolboxComponent: {},
  TooltipComponent: {},
  VisualMapComponent: {},
}));

vi.mock("echarts/renderers", () => ({
  CanvasRenderer: {},
}));

vi.mock("echarts-for-react/lib/core", () => ({
  default: (props) => <div data-testid="echarts-core" style={props.style} />,
}));

import {
  EChartsWrapper,
  FunnelChartWrapper,
  GaugeChartWrapper,
  getThemeColors,
  HeatmapChartWrapper,
  TreemapChartWrapper,
  WaterfallChartWrapper,
} from "../EChartsWrapper";

describe("EChartsWrapper", () => {
  it("renders without crashing", () => {
    render(<EChartsWrapper option={{}} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });

  it("renders with dark mode", () => {
    render(<EChartsWrapper option={{}} isDarkMode={true} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });

  it("renders with custom height", () => {
    render(<EChartsWrapper option={{}} height={500} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });

  it("renders with toolbox enabled", () => {
    render(<EChartsWrapper option={{}} showToolbox={true} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });
});

describe("GaugeChartWrapper", () => {
  it("renders without crashing", () => {
    render(<GaugeChartWrapper value={75} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });

  it("renders with thresholds", () => {
    render(<GaugeChartWrapper value={85} thresholds={{ warning: 60, danger: 80 }} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });
});

describe("FunnelChartWrapper", () => {
  it("renders without crashing", () => {
    const data = [
      { name: "Step 1", value: 100 },
      { name: "Step 2", value: 80 },
    ];
    render(<FunnelChartWrapper data={data} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });
});

describe("getThemeColors", () => {
  it("returns light mode colors", () => {
    const colors = getThemeColors(false);
    expect(colors.background).toBe("#FFFFFF");
    expect(colors.primary).toBe("#14B8A6");
  });

  it("returns dark mode colors", () => {
    const colors = getThemeColors(true);
    expect(colors.background).toBe("#1E2328");
    expect(colors.primary).toBe("#14B8A6");
  });
});
