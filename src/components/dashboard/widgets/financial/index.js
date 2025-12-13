/**
 * Financial Dashboard Widgets
 *
 * A collection of financial and KPI widgets for the Steel Trading ERP Dashboard.
 * All widgets support dark mode via ThemeContext and include mock data for demo purposes.
 *
 * Usage:
 * import { RevenueKPIWidget, ARAgingWidget, ... } from './components/dashboard/widgets/financial';
 */

// Core KPI widgets
export { RevenueKPIWidget } from './RevenueKPIWidget';
export { ARAgingWidget } from './ARAgingWidget';
export { GrossMarginWidget } from './GrossMarginWidget';
export { DSOWidget } from './DSOWidget';
export { CreditUtilizationWidget } from './CreditUtilizationWidget';

// Legacy exports (for backward compatibility if these files exist)
export { default as APAgingWidget } from './APAgingWidget';
export { default as CashFlowWidget } from './CashFlowWidget';
export { default as ProfitSummaryWidget } from './ProfitSummaryWidget';
export { default as FinancialKPICards } from './FinancialKPICards';
export { default as RevenueAnalyticsWidget } from './RevenueAnalyticsWidget';
export { default as CreditManagementWidget } from './CreditManagementWidget';
