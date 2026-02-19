/**
 * Dashboard Widgets - Central Export
 *
 * A comprehensive collection of dashboard widgets for the Steel Trading ERP.
 * All widgets support dark mode via ThemeContext and include mock data.
 *
 * Usage:
 * import { TopProductsWidget, InventoryHealthWidget, ... } from './components/dashboard/widgets';
 */

// ============================================================================
// BASE WIDGET
// ============================================================================
export { default as BaseWidget } from "./BaseWidget";
// ============================================================================
// CUSTOMER WIDGETS
// ============================================================================
export {
  AtRiskCustomersWidget,
  CustomerCLVWidget,
  CustomerSegmentsWidget,
  NewCustomerWidget,
} from "./customer";

// ============================================================================
// FINANCIAL WIDGETS
// ============================================================================
export {
  APAgingWidget,
  ARAgingWidget,
  CashFlowWidget,
  CreditManagementWidget,
  CreditUtilizationWidget,
  DSOWidget,
  FinancialKPICards,
  GrossMarginWidget,
  ProfitSummaryWidget,
  RevenueAnalyticsWidget,
  RevenueKPIWidget,
} from "./financial";
// ============================================================================
// INVENTORY MANAGEMENT WIDGETS
// ============================================================================
export {
  FastMovingWidget,
  InventoryHealthWidget,
  ReorderAlertsWidget,
  SlowMovingWidget,
  StockTurnoverWidget,
  WarehouseUtilizationWidget,
} from "./inventory";
// ============================================================================
// PRODUCT ANALYTICS WIDGETS
// ============================================================================
export {
  CategoryPerformanceWidget,
  GradeAnalysisWidget,
  PriceTrendWidget,
  ProductMarginWidget,
  TopProductsWidget,
} from "./product";
// ============================================================================
// SALES AGENT WIDGETS
// ============================================================================
export {
  AgentScorecardWidget,
  CollectionPerformanceWidget,
  CommissionForecastWidget,
  CommissionTrackerWidget,
  ConversionFunnelWidget,
  CustomerPortfolioWidget,
  LeaderboardWidget,
} from "./sales-agent";
// ============================================================================
// VAT WIDGETS — lazy-loaded only (via LazyWidgets.jsx / DashboardV2.jsx)
// Static re-exports removed to enable code-splitting.
// Config/constants available via: import { VAT_WIDGET_CONFIG } from './vat';
// ============================================================================
export { FORM_201_BOXES, UAE_DESIGNATED_ZONES, UAE_VAT_CONSTANTS, VAT_WIDGET_CONFIG, VATWidgets } from "./vat";
