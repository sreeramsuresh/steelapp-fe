/**
 * redirects.js
 * Mapping of old routes to new routes for backwards compatibility
 * Old bookmarks/links will redirect to new prefixed routes
 *
 * Core ERP: /app/* (operational workflows)
 * Analytics Hub: /analytics/* (view/report pages)
 */

export const REDIRECTS = {
  // Root redirect
  '/': '/app',

  // Dashboard - goes to analytics (full dashboard is analytics)
  '/dashboard': '/analytics/dashboard',

  // Sales (operational → /app)
  '/quotations': '/app/quotations',
  '/invoices': '/app/invoices',
  '/delivery-notes': '/app/delivery-notes',
  '/credit-notes': '/app/credit-notes',

  // Purchases (operational → /app)
  '/purchases': '/app/purchases',
  '/purchase-orders': '/app/purchase-orders',
  '/vendor-bills': '/app/vendor-bills',
  '/debit-notes': '/app/debit-notes',
  '/advance-payments': '/app/advance-payments',

  // Finance (operational → /app)
  '/finance': '/app/finance',
  '/dashboards/commission-approvals': '/app/finance', // Now a tab in Finance
  '/dashboards/customer-credit': '/app/finance', // Now a tab in Finance
  '/commission-approvals': '/app/finance', // Now a tab in Finance
  '/credit-management': '/app/finance', // Now a tab in Finance
  '/receivables': '/app/receivables',
  '/payables': '/app/payables',
  '/account-statements': '/app/account-statements',

  // Inventory (operational → /app)
  '/warehouses': '/app/warehouses',
  '/inventory': '/app/inventory',
  '/stock-movements': '/app/stock-movements',

  // Trade (operational → /app)
  '/import-export': '/app/import-export',
  '/containers': '/app/containers',
  '/import-orders': '/app/import-orders',
  '/export-orders': '/app/export-orders',

  // Masters (operational → /app)
  '/customers': '/app/customers',
  '/products': '/app/products',
  '/pricelists': '/app/pricelists',
  '/suppliers': '/app/suppliers',

  // Settings (operational → /app)
  '/settings': '/app/settings',
  '/roles': '/app/roles',
  '/audit-logs': '/app/audit-logs',

  // Analytics redirects (reports/dashboards → /analytics)
  '/reports': '/analytics/reports',
  '/dashboards/ar-aging': '/analytics/ar-aging',
  '/batch-analytics': '/analytics/batch-analytics',
  '/dashboards/delivery-variance': '/analytics/delivery-performance',
  '/profit-analysis': '/analytics/profit-analysis',
  '/price-history': '/analytics/price-history',
  '/stock-movement-report': '/analytics/stock-movement-report',
  '/supplier-performance': '/analytics/supplier-performance',
  '/commission-dashboard': '/analytics/commission-dashboard',
  '/agent-commission-dashboard': '/analytics/agent-commission-dashboard',
};

/**
 * Get the new path for an old route
 * Returns null if no redirect exists
 */
export function getRedirectPath(oldPath) {
  // Exact match
  if (REDIRECTS[oldPath]) {
    return REDIRECTS[oldPath];
  }

  // Check if oldPath starts with any redirect key (for nested routes)
  for (const [oldRoute, newRoute] of Object.entries(REDIRECTS)) {
    if (oldPath.startsWith(oldRoute + '/')) {
      const suffix = oldPath.slice(oldRoute.length);
      return newRoute + suffix;
    }
  }

  return null;
}

/**
 * Check if a path needs redirecting
 */
export function needsRedirect(path) {
  return getRedirectPath(path) !== null;
}
