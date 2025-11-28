// ============================================================================
// DASHBOARD MODULE INDEX
// Complete dashboard infrastructure for Steel Trading ERP
// ============================================================================

// Chart wrappers
export * from './charts';

// Configuration
export * from './config/DashboardConfig';

// Widget components
export * from './widgets';

// ============================================================================
// USAGE GUIDE
// ============================================================================

/**
 * CHART COMPONENTS
 * ----------------
 * Recharts (lightweight, common charts):
 * - BarChartWrapper - Vertical/horizontal bars
 * - LineChartWrapper - Trends over time
 * - AreaChartWrapper - Volume trends
 * - PieChartWrapper - Part-of-whole
 * - DonutChartWrapper - Part-of-whole with center
 * - RadarChartWrapper - Multi-dimensional
 *
 * ECharts (specialized charts):
 * - GaugeChartWrapper - Single KPI with thresholds
 * - TreemapChartWrapper - Hierarchical data
 * - WaterfallChartWrapper - Cumulative values
 * - FunnelChartWrapper - Stage-based flows
 * - HeatmapChartWrapper - Matrix data
 *
 * WIDGET COMPONENTS
 * -----------------
 * Financial: RevenueKPIWidget, ARAgingWidget, GrossMarginWidget, DSOWidget, etc.
 * Product: TopProductsWidget, ProductMarginWidget, FastMovingWidget, etc.
 * Sales Agent: LeaderboardWidget, CommissionTrackerWidget, etc.
 * Inventory: InventoryHealthWidget, ReorderAlertsWidget, StockTurnoverWidget, etc.
 * VAT: VATCollectionWidget, VATReturnStatusWidget, etc.
 *
 * CONFIGURATION
 * -------------
 * - DASHBOARD_ROLES - Available user roles
 * - WIDGET_VISIBILITY - Role-based widget access
 * - WIDGET_CATEGORIES - Widget groupings
 * - canViewWidget(widgetId, role) - Check widget visibility
 * - getVisibleWidgets(role) - Get all visible widgets for role
 * - getDefaultLayout(role) - Get default widget layout
 *
 * EXAMPLE USAGE
 * -------------
 * ```jsx
 * import {
 *   BarChartWrapper,
 *   GaugeChartWrapper,
 *   RevenueKPIWidget,
 *   ARAgingWidget,
 *   canViewWidget,
 *   getDefaultLayout,
 * } from './components/dashboard';
 *
 * // Check visibility
 * if (canViewWidget('revenue-kpi', userRole)) {
 *   // Render widget
 * }
 *
 * // Get default layout for role
 * const widgets = getDefaultLayout('sales_manager');
 * ```
 */
