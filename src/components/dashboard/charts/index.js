// ============================================================================
// CHART WRAPPERS INDEX
// ============================================================================

// ECharts wrappers - for specialized chart types
export {
  EChartsWrapper,
  FunnelChartWrapper,
  GaugeChartWrapper,
  getThemeColors as getEChartsThemeColors,
  HeatmapChartWrapper,
  TreemapChartWrapper,
  WaterfallChartWrapper,
} from "./EChartsWrapper";
// Recharts wrappers - for common chart types
export {
  AreaChartWrapper,
  BarChartWrapper,
  DonutChartWrapper,
  getThemeColors as getRechartsThemeColors,
  LineChartWrapper,
  PieChartWrapper,
  RadarChartWrapper,
} from "./RechartsWrapper";

// ============================================================================
// CHART TYPE MAPPING
// ============================================================================

/**
 * Chart type reference for widget developers
 *
 * RECHARTS (react-native, lightweight):
 * - BarChartWrapper: Vertical/horizontal bars, comparisons
 * - LineChartWrapper: Trends over time, continuous data
 * - AreaChartWrapper: Volume trends, stacked comparisons
 * - PieChartWrapper: Part-of-whole relationships
 * - DonutChartWrapper: Part-of-whole with center metric
 * - RadarChartWrapper: Multi-dimensional comparisons
 *
 * ECHARTS (feature-rich, specialized):
 * - GaugeChartWrapper: Single KPI with thresholds
 * - TreemapChartWrapper: Hierarchical data visualization
 * - WaterfallChartWrapper: Cumulative effect of values
 * - FunnelChartWrapper: Stage-based conversion flows
 * - HeatmapChartWrapper: Matrix data with color intensity
 *
 * USAGE EXAMPLE:
 * ```jsx
 * import { BarChartWrapper, GaugeChartWrapper } from '../charts';
 *
 * // Bar chart for revenue by product
 * <BarChartWrapper
 *   data={productData}
 *   dataKey="revenue"
 *   xAxisKey="productName"
 *   isDarkMode={isDarkMode}
 *   formatter={(val) => `AED ${val.toLocaleString()}`}
 * />
 *
 * // Gauge for credit utilization
 * <GaugeChartWrapper
 *   value={75}
 *   min={0}
 *   max={100}
 *   title="Credit Utilization"
 *   isDarkMode={isDarkMode}
 *   thresholds={{ warning: 60, danger: 80 }}
 *   formatValue={(val) => `${val}%`}
 * />
 * ```
 */
