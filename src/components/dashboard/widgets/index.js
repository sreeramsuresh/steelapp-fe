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
// VAT WIDGETS
// ============================================================================
export {
  DesignatedZoneWidget,
  ReverseChargeWidget,
  TRNValidationWidget,
  VATCollectionWidget,
  VATComplianceAlertsWidget,
  VATReconciliationWidget,
  VATReturnStatusWidget,
  ZeroRatedExportsWidget,
} from "./vat";
