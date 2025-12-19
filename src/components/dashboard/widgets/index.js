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
// PRODUCT ANALYTICS WIDGETS
// ============================================================================
export {
  TopProductsWidget,
  CategoryPerformanceWidget,
  GradeAnalysisWidget,
  ProductMarginWidget,
  PriceTrendWidget,
} from './product';

// ============================================================================
// INVENTORY MANAGEMENT WIDGETS
// ============================================================================
export {
  InventoryHealthWidget,
  FastMovingWidget,
  SlowMovingWidget,
  ReorderAlertsWidget,
  StockTurnoverWidget,
  WarehouseUtilizationWidget,
} from './inventory';

// ============================================================================
// FINANCIAL WIDGETS
// ============================================================================
export {
  RevenueKPIWidget,
  ARAgingWidget,
  GrossMarginWidget,
  DSOWidget,
  CreditUtilizationWidget,
  APAgingWidget,
  CashFlowWidget,
  ProfitSummaryWidget,
  FinancialKPICards,
  RevenueAnalyticsWidget,
  CreditManagementWidget,
} from './financial';

// ============================================================================
// CUSTOMER WIDGETS
// ============================================================================
export {
  NewCustomerWidget,
  CustomerSegmentsWidget,
  CustomerCLVWidget,
  AtRiskCustomersWidget,
} from './customer';

// ============================================================================
// SALES AGENT WIDGETS
// ============================================================================
export {
  LeaderboardWidget,
  CommissionTrackerWidget,
  ConversionFunnelWidget,
  CustomerPortfolioWidget,
  AgentScorecardWidget,
  CollectionPerformanceWidget,
} from './sales-agent';

// ============================================================================
// VAT WIDGETS
// ============================================================================
export {
  VATCollectionWidget,
  VATReturnStatusWidget,
  VATReconciliationWidget,
  VATComplianceAlertsWidget,
  TRNValidationWidget,
  ZeroRatedExportsWidget,
  ReverseChargeWidget,
  DesignatedZoneWidget,
} from './vat';

// ============================================================================
// BASE WIDGET
// ============================================================================
export { default as BaseWidget } from './BaseWidget';
