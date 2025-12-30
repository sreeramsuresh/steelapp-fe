/**
 * LazyWidgets - Lazy-loaded versions of all dashboard widgets
 * Grouped by category for optimal code-splitting
 */

import { lazy } from 'react';

// ============================================================================
// FINANCIAL WIDGETS
// ============================================================================
export const LazyRevenueKPIWidget = lazy(
  () => import('./widgets/financial/RevenueKPIWidget'),
);
export const LazyRevenueAnalyticsWidget = lazy(
  () => import('./widgets/financial/RevenueAnalyticsWidget'),
);
export const LazyProfitSummaryWidget = lazy(
  () => import('./widgets/financial/ProfitSummaryWidget'),
);
export const LazyCashFlowWidget = lazy(
  () => import('./widgets/financial/CashFlowWidget'),
);
export const LazyGrossMarginWidget = lazy(
  () => import('./widgets/financial/GrossMarginWidget'),
);
export const LazyDSOWidget = lazy(
  () => import('./widgets/financial/DSOWidget'),
);
export const LazyCreditManagementWidget = lazy(
  () => import('./widgets/financial/CreditManagementWidget'),
);
export const LazyCreditUtilizationWidget = lazy(
  () => import('./widgets/financial/CreditUtilizationWidget'),
);
export const LazyARAgingWidget = lazy(
  () => import('./widgets/financial/ARAgingWidget'),
);
export const LazyAPAgingWidget = lazy(
  () => import('./widgets/financial/APAgingWidget'),
);
export const LazyFinancialKPICards = lazy(
  () => import('./widgets/financial/FinancialKPICards'),
);

// ============================================================================
// INVENTORY WIDGETS
// ============================================================================
export const LazyInventoryHealthWidget = lazy(
  () => import('./widgets/inventory/InventoryHealthWidget'),
);
export const LazyFastMovingWidget = lazy(
  () => import('./widgets/inventory/FastMovingWidget'),
);
export const LazySlowMovingWidget = lazy(
  () => import('./widgets/inventory/SlowMovingWidget'),
);
export const LazyReorderAlertsWidget = lazy(
  () => import('./widgets/inventory/ReorderAlertsWidget'),
);
export const LazyStockTurnoverWidget = lazy(
  () => import('./widgets/inventory/StockTurnoverWidget'),
);
export const LazyWarehouseUtilizationWidget = lazy(
  () => import('./widgets/inventory/WarehouseUtilizationWidget'),
);

// ============================================================================
// PRODUCT WIDGETS
// ============================================================================
export const LazyTopProductsWidget = lazy(
  () => import('./widgets/product/TopProductsWidget'),
);
export const LazyCategoryPerformanceWidget = lazy(
  () => import('./widgets/product/CategoryPerformanceWidget'),
);
export const LazyGradeAnalysisWidget = lazy(
  () => import('./widgets/product/GradeAnalysisWidget'),
);
export const LazyProductMarginWidget = lazy(
  () => import('./widgets/product/ProductMarginWidget'),
);
export const LazyPriceTrendWidget = lazy(
  () => import('./widgets/product/PriceTrendWidget'),
);

// ============================================================================
// CUSTOMER WIDGETS
// ============================================================================
export const LazyCustomerCLVWidget = lazy(
  () => import('./widgets/customer/CustomerCLVWidget'),
);
export const LazyAtRiskCustomersWidget = lazy(
  () => import('./widgets/customer/AtRiskCustomersWidget'),
);
export const LazyCustomerSegmentsWidget = lazy(
  () => import('./widgets/customer/CustomerSegmentsWidget'),
);
export const LazyNewCustomerWidget = lazy(
  () => import('./widgets/customer/NewCustomerWidget'),
);

// ============================================================================
// SALES AGENT WIDGETS
// ============================================================================
export const LazyAgentScorecardWidget = lazy(
  () => import('./widgets/sales-agent/AgentScorecardWidget'),
);
export const LazyLeaderboardWidget = lazy(
  () => import('./widgets/sales-agent/LeaderboardWidget'),
);
export const LazyCommissionTrackerWidget = lazy(
  () => import('./widgets/sales-agent/CommissionTrackerWidget'),
);
export const LazyCommissionForecastWidget = lazy(
  () => import('./widgets/sales-agent/CommissionForecastWidget'),
);
export const LazyConversionFunnelWidget = lazy(
  () => import('./widgets/sales-agent/ConversionFunnelWidget'),
);
export const LazyCustomerPortfolioWidget = lazy(
  () => import('./widgets/sales-agent/CustomerPortfolioWidget'),
);
export const LazyCollectionPerformanceWidget = lazy(
  () => import('./widgets/sales-agent/CollectionPerformanceWidget'),
);

// ============================================================================
// VAT WIDGETS
// ============================================================================
export const LazyVATCollectionWidget = lazy(
  () => import('./widgets/vat/VATCollectionWidget'),
);
export const LazyVATReturnStatusWidget = lazy(
  () => import('./widgets/vat/VATReturnStatusWidget'),
);
export const LazyVATComplianceAlertsWidget = lazy(
  () => import('./widgets/vat/VATComplianceAlertsWidget'),
);
export const LazyDesignatedZoneWidget = lazy(
  () => import('./widgets/vat/DesignatedZoneWidget'),
);
export const LazyZeroRatedExportsWidget = lazy(
  () => import('./widgets/vat/ZeroRatedExportsWidget'),
);
export const LazyReverseChargeWidget = lazy(
  () => import('./widgets/vat/ReverseChargeWidget'),
);
export const LazyVATReconciliationWidget = lazy(
  () => import('./widgets/vat/VATReconciliationWidget'),
);
export const LazyTRNValidationWidget = lazy(
  () => import('./widgets/vat/TRNValidationWidget'),
);

// ============================================================================
// CATEGORY GROUPINGS FOR PRELOADING
// ============================================================================
export const LAZY_WIDGET_CATEGORIES = {
  financial: [
    () => import('./widgets/financial/RevenueKPIWidget'),
    () => import('./widgets/financial/RevenueAnalyticsWidget'),
    () => import('./widgets/financial/ProfitSummaryWidget'),
    () => import('./widgets/financial/CashFlowWidget'),
    () => import('./widgets/financial/GrossMarginWidget'),
    () => import('./widgets/financial/DSOWidget'),
    () => import('./widgets/financial/CreditManagementWidget'),
    () => import('./widgets/financial/CreditUtilizationWidget'),
    () => import('./widgets/financial/ARAgingWidget'),
    () => import('./widgets/financial/APAgingWidget'),
    () => import('./widgets/financial/FinancialKPICards'),
  ],
  inventory: [
    () => import('./widgets/inventory/InventoryHealthWidget'),
    () => import('./widgets/inventory/FastMovingWidget'),
    () => import('./widgets/inventory/SlowMovingWidget'),
    () => import('./widgets/inventory/ReorderAlertsWidget'),
    () => import('./widgets/inventory/StockTurnoverWidget'),
    () => import('./widgets/inventory/WarehouseUtilizationWidget'),
  ],
  product: [
    () => import('./widgets/product/TopProductsWidget'),
    () => import('./widgets/product/CategoryPerformanceWidget'),
    () => import('./widgets/product/GradeAnalysisWidget'),
    () => import('./widgets/product/ProductMarginWidget'),
    () => import('./widgets/product/PriceTrendWidget'),
  ],
  customer: [
    () => import('./widgets/customer/CustomerCLVWidget'),
    () => import('./widgets/customer/AtRiskCustomersWidget'),
    () => import('./widgets/customer/CustomerSegmentsWidget'),
    () => import('./widgets/customer/NewCustomerWidget'),
  ],
  sales: [
    () => import('./widgets/sales-agent/AgentScorecardWidget'),
    () => import('./widgets/sales-agent/LeaderboardWidget'),
    () => import('./widgets/sales-agent/CommissionTrackerWidget'),
    () => import('./widgets/sales-agent/CommissionForecastWidget'),
    () => import('./widgets/sales-agent/ConversionFunnelWidget'),
    () => import('./widgets/sales-agent/CustomerPortfolioWidget'),
    () => import('./widgets/sales-agent/CollectionPerformanceWidget'),
  ],
  vat: [
    () => import('./widgets/vat/VATCollectionWidget'),
    () => import('./widgets/vat/VATReturnStatusWidget'),
    () => import('./widgets/vat/VATComplianceAlertsWidget'),
    () => import('./widgets/vat/DesignatedZoneWidget'),
    () => import('./widgets/vat/ZeroRatedExportsWidget'),
    () => import('./widgets/vat/ReverseChargeWidget'),
    () => import('./widgets/vat/VATReconciliationWidget'),
    () => import('./widgets/vat/TRNValidationWidget'),
  ],
};
