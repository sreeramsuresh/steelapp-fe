/**
 * Route Labels - SSOT for route-to-title mapping
 * Used by CoreERPLayout, AnalyticsLayout, and FeedbackWidget
 */

const coreRouteLabels = {
  "/app/quotations": "Quotations",
  "/app/invoices": "Invoices",
  "/app/delivery-notes": "Delivery Notes",
  "/app/credit-notes": "Credit Notes",
  "/app/purchases": "Purchases",
  "/app/purchase-orders": "Purchase Orders",
  "/app/supplier-bills": "Supplier Bills",
  "/app/debit-notes": "Debit Notes",
  "/app/advance-payments": "Advance Payments",
  "/app/supplier-quotations": "Supplier Quotations",
  "/app/finance": "Finance",
  "/app/receivables": "Receivables",
  "/app/payables": "Payables",
  "/app/operating-expenses": "Operating Expenses",
  "/app/my-commissions": "My Commissions",
  "/app/account-statements": "Account Statements",
  "/app/warehouses": "Warehouses",
  "/app/inventory": "Stock Levels",
  "/app/stock-movements": "Stock Movements",
  "/app/import-export": "Import / Export",
  "/app/containers": "Containers",
  "/app/customers": "Customers",
  "/app/products": "Products",
  "/app/pricelists": "Price Lists",
  "/app/suppliers": "Suppliers",
  "/app/settings": "Settings",
  "/app/roles": "Roles",
  "/app/permissions-matrix": "Permissions Matrix",
  "/app/audit-logs": "Audit Trail",
  "/app/audit-hub": "Audit Hub",
  "/app/base-prices": "Base Prices",
  "/app/profile": "Profile",
  "/app/feedback": "Feedback Management",
  "/app/home": "Home",
  "/app": "Home",
};

const analyticsRouteLabels = {
  "/analytics": "Analytics Overview",
  "/analytics/dashboard": "Executive Dashboard",
  "/analytics/reports": "Reports Hub",
  "/analytics/ar-aging": "AR Aging Report",
  "/analytics/batch-analytics": "Batch Analytics",
  "/analytics/delivery-performance": "Delivery Performance",
  "/analytics/profit-analysis": "Profit Analysis",
  "/analytics/price-history": "Price History",
  "/analytics/stock-movement-report": "Stock Movement Report",
  "/analytics/supplier-performance": "Supplier Performance",
  "/analytics/commission-dashboard": "Commission Dashboard",
  "/analytics/bank-ledger": "Bank Ledger",
  "/analytics/bank-reconciliation": "Bank Reconciliation",
  "/analytics/cash-book": "Cash Book",
  "/analytics/journal-register": "Journal Register",
  "/analytics/trial-balance": "Trial Balance",
  "/analytics/cogs-analysis": "COGS Analysis",
  "/analytics/normalized-margin": "Normalized Margin Report",
  "/analytics/reconciliation": "Stock Reconciliation",
  "/analytics/vat-return": "VAT Return",
};

/**
 * Get a human-readable label for a given route pathname
 */
export function getRouteLabel(pathname) {
  // Check exact match first
  const allLabels = { ...coreRouteLabels, ...analyticsRouteLabels };
  if (allLabels[pathname]) return allLabels[pathname];

  // Check prefix matches (for /app/invoices/123 → "Invoices")
  for (const [route, title] of Object.entries(allLabels)) {
    if (pathname.startsWith(`${route}/`)) return title;
  }

  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/app")) return "Core ERP";

  return null;
}

export { coreRouteLabels, analyticsRouteLabels };
