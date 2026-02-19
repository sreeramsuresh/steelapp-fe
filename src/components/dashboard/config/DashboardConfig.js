// ============================================================================
// DASHBOARD CONFIGURATION
// Role-based widget visibility and organization
// ============================================================================

/**
 * Dashboard user roles
 * Maps to user.role field from authentication
 */
export const DASHBOARD_ROLES = {
  CEO: "ceo",
  CFO: "cfo",
  SALES_MANAGER: "sales_manager",
  OPERATIONS_MANAGER: "operations_manager",
  WAREHOUSE_MANAGER: "warehouse_manager",
  SALES_AGENT: "sales_agent",
  ACCOUNTANT: "accountant",
  ADMIN: "admin",
};

/**
 * Widget visibility configuration
 * Key: widget ID
 * Value: Array of roles that can view this widget
 */
export const WIDGET_VISIBILITY = {
  // ============================================================================
  // FINANCIAL WIDGETS
  // ============================================================================
  "revenue-kpi": ["ceo", "cfo", "sales_manager", "admin"],
  "profit-kpi": ["ceo", "cfo", "admin"],
  "cash-flow": ["ceo", "cfo", "accountant", "admin"],
  "ap-aging": ["ceo", "cfo", "accountant", "admin"],
  "ar-aging": ["ceo", "cfo", "sales_manager", "accountant", "admin"],
  "gross-margin": ["ceo", "cfo", "sales_manager", "admin"],
  dso: ["ceo", "cfo", "sales_manager", "accountant", "admin"],
  "credit-utilization": ["ceo", "cfo", "sales_manager", "admin"],
  "revenue-trend": ["ceo", "cfo", "sales_manager", "admin"],
  "expense-breakdown": ["ceo", "cfo", "accountant", "admin"],

  // ============================================================================
  // PRODUCT WIDGETS
  // ============================================================================
  "top-products": ["ceo", "cfo", "sales_manager", "operations_manager", "admin"],
  "product-margin": ["ceo", "cfo", "admin"],
  "category-performance": ["ceo", "cfo", "sales_manager", "operations_manager", "admin"],
  "grade-analysis": ["ceo", "operations_manager", "warehouse_manager", "admin"],
  "price-trends": ["ceo", "cfo", "sales_manager", "admin"],
  "fast-moving": ["ceo", "operations_manager", "warehouse_manager", "admin"],
  "slow-moving": ["ceo", "operations_manager", "warehouse_manager", "admin"],

  // ============================================================================
  // SALES AGENT WIDGETS
  // ============================================================================
  "agent-scorecard": ["ceo", "sales_manager", "sales_agent", "admin"],
  leaderboard: ["ceo", "sales_manager", "sales_agent", "admin"],
  commission: ["ceo", "cfo", "sales_manager", "sales_agent", "admin"],
  "commission-forecast": ["ceo", "cfo", "sales_manager", "admin"],
  "conversion-rate": ["ceo", "sales_manager", "admin"],
  "customer-portfolio": ["ceo", "sales_manager", "sales_agent", "admin"],
  "sales-pipeline": ["ceo", "sales_manager", "sales_agent", "admin"],
  "target-achievement": ["ceo", "sales_manager", "sales_agent", "admin"],

  // ============================================================================
  // INVENTORY WIDGETS
  // ============================================================================
  "inventory-health": ["ceo", "operations_manager", "warehouse_manager", "admin"],
  "reorder-alerts": ["operations_manager", "warehouse_manager", "admin"],
  "stock-turnover": ["ceo", "cfo", "operations_manager", "admin"],
  "warehouse-utilization": ["ceo", "operations_manager", "warehouse_manager", "admin"],
  "stock-value": ["ceo", "cfo", "operations_manager", "admin"],
  transfers: ["operations_manager", "warehouse_manager", "admin"],
  reservations: ["sales_manager", "operations_manager", "warehouse_manager", "admin"],

  // ============================================================================
  // VAT & COMPLIANCE WIDGETS
  // ============================================================================
  "vat-collection": ["ceo", "cfo", "accountant", "admin"],
  "vat-return-status": ["ceo", "cfo", "accountant", "admin"],
  "compliance-alerts": ["ceo", "cfo", "accountant", "admin"],
  "vat-summary": ["ceo", "cfo", "accountant", "admin"],

  // ============================================================================
  // CUSTOMER WIDGETS
  // ============================================================================
  "customer-clv": ["ceo", "cfo", "sales_manager", "admin"],
  "at-risk-customers": ["ceo", "sales_manager", "sales_agent", "admin"],
  "customer-segments": ["ceo", "sales_manager", "admin"],
  "new-customers": ["ceo", "sales_manager", "admin"],
  "customer-growth": ["ceo", "cfo", "sales_manager", "admin"],

  // ============================================================================
  // SUPPLIER WIDGETS
  // ============================================================================
  "supplier-scorecard": ["ceo", "operations_manager", "admin"],
  "supplier-quality": ["ceo", "operations_manager", "warehouse_manager", "admin"],
  "supplier-lead-time": ["ceo", "operations_manager", "warehouse_manager", "admin"],
  "supplier-spend": ["ceo", "cfo", "operations_manager", "admin"],
};

/**
 * Widget categories for dashboard organization
 * Used for filtering and grouping widgets in the UI
 */
export const WIDGET_CATEGORIES = {
  FINANCIAL: [
    "revenue-kpi",
    "profit-kpi",
    "cash-flow",
    "ap-aging",
    "ar-aging",
    "gross-margin",
    "dso",
    "credit-utilization",
    "revenue-trend",
    "expense-breakdown",
  ],
  PRODUCT: [
    "top-products",
    "product-margin",
    "category-performance",
    "grade-analysis",
    "price-trends",
    "fast-moving",
    "slow-moving",
  ],
  SALES_AGENT: [
    "agent-scorecard",
    "leaderboard",
    "commission",
    "commission-forecast",
    "conversion-rate",
    "customer-portfolio",
    "sales-pipeline",
    "target-achievement",
  ],
  INVENTORY: [
    "inventory-health",
    "reorder-alerts",
    "stock-turnover",
    "warehouse-utilization",
    "stock-value",
    "transfers",
    "reservations",
  ],
  VAT: ["vat-collection", "vat-return-status", "compliance-alerts", "vat-summary"],
  CUSTOMER: ["customer-clv", "at-risk-customers", "customer-segments", "new-customers", "customer-growth"],
  SUPPLIER: ["supplier-scorecard", "supplier-quality", "supplier-lead-time", "supplier-spend"],
};

/**
 * Widget metadata for rendering and configuration
 */
export const WIDGET_METADATA = {
  // Financial
  "revenue-kpi": {
    title: "Total Revenue",
    description: "Sum of all invoice amounts",
    category: "FINANCIAL",
    size: "sm", // sm, md, lg, xl
  },
  "profit-kpi": {
    title: "Net Profit",
    description: "Revenue minus costs and expenses",
    category: "FINANCIAL",
    size: "sm",
  },
  "ar-aging": {
    title: "AR Aging",
    description: "Receivables grouped by days overdue",
    category: "FINANCIAL",
    size: "md",
  },
  "revenue-trend": {
    title: "Revenue Trend",
    description: "Monthly revenue over time",
    category: "FINANCIAL",
    size: "lg",
  },
  "gross-margin": {
    title: "Gross Margin",
    description: "Percentage of revenue after COGS",
    category: "FINANCIAL",
    size: "sm",
  },
  dso: {
    title: "DSO",
    description: "Days Sales Outstanding",
    category: "FINANCIAL",
    size: "sm",
  },
  "credit-utilization": {
    title: "Credit Utilization",
    description: "Outstanding vs credit limits",
    category: "FINANCIAL",
    size: "sm",
  },

  // Product
  "top-products": {
    title: "Top Products",
    description: "Best performing products by revenue",
    category: "PRODUCT",
    size: "md",
  },
  "product-margin": {
    title: "Product Margins",
    description: "Profit margins by product",
    category: "PRODUCT",
    size: "md",
  },
  "fast-moving": {
    title: "Fast Moving Stock",
    description: "Products with high turnover",
    category: "PRODUCT",
    size: "md",
  },
  "slow-moving": {
    title: "Slow Moving Stock",
    description: "Products with low turnover",
    category: "PRODUCT",
    size: "md",
  },

  // Sales Agent
  leaderboard: {
    title: "Sales Leaderboard",
    description: "Top performing sales agents",
    category: "SALES_AGENT",
    size: "md",
  },
  commission: {
    title: "Commission Summary",
    description: "Commission earned and pending",
    category: "SALES_AGENT",
    size: "md",
  },
  "commission-forecast": {
    title: "Commission Forecast",
    description: "Trend analysis and projections",
    category: "SALES_AGENT",
    size: "lg",
  },
  "target-achievement": {
    title: "Target Achievement",
    description: "Sales targets vs actuals",
    category: "SALES_AGENT",
    size: "md",
  },

  // Inventory
  "inventory-health": {
    title: "Inventory Health",
    description: "Overall stock status",
    category: "INVENTORY",
    size: "md",
  },
  "reorder-alerts": {
    title: "Reorder Alerts",
    description: "Items below minimum stock",
    category: "INVENTORY",
    size: "md",
  },
  "stock-turnover": {
    title: "Stock Turnover",
    description: "Inventory rotation rate",
    category: "INVENTORY",
    size: "md",
  },

  // VAT
  "vat-collection": {
    title: "VAT Collection",
    description: "VAT collected vs paid",
    category: "VAT",
    size: "md",
  },
  "vat-return-status": {
    title: "VAT Return Status",
    description: "Filing status and deadlines",
    category: "VAT",
    size: "md",
  },

  // Customer
  "customer-clv": {
    title: "Customer Lifetime Value",
    description: "Top customers by CLV",
    category: "CUSTOMER",
    size: "md",
  },
  "at-risk-customers": {
    title: "At-Risk Customers",
    description: "Customers requiring attention",
    category: "CUSTOMER",
    size: "md",
  },

  // Supplier
  "supplier-scorecard": {
    title: "Supplier Scorecard",
    description: "Supplier performance metrics",
    category: "SUPPLIER",
    size: "md",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user role can view a specific widget
 * @param {string} widgetId - Widget identifier
 * @param {string} userRole - User's role
 * @returns {boolean} - True if user can view widget
 */
export const canViewWidget = (widgetId, userRole) => {
  const allowedRoles = WIDGET_VISIBILITY[widgetId];
  if (!allowedRoles) return true; // Default to visible if not configured
  return allowedRoles.includes(userRole?.toLowerCase());
};

/**
 * Get all widgets visible to a specific role
 * @param {string} userRole - User's role
 * @returns {string[]} - Array of widget IDs
 */
export const getVisibleWidgets = (userRole) => {
  const role = userRole?.toLowerCase();
  return Object.entries(WIDGET_VISIBILITY)
    .filter(([, roles]) => roles.includes(role))
    .map(([widgetId]) => widgetId);
};

/**
 * Get widgets by category for a specific role
 * @param {string} category - Category name (e.g., 'FINANCIAL')
 * @param {string} userRole - User's role
 * @returns {string[]} - Array of widget IDs in that category visible to user
 */
export const getWidgetsByCategory = (category, userRole) => {
  const categoryWidgets = WIDGET_CATEGORIES[category] || [];
  const role = userRole?.toLowerCase();

  return categoryWidgets.filter((widgetId) => {
    const allowedRoles = WIDGET_VISIBILITY[widgetId];
    return !allowedRoles || allowedRoles.includes(role);
  });
};

/**
 * Get widget metadata
 * @param {string} widgetId - Widget identifier
 * @returns {Object|null} - Widget metadata or null
 */
export const getWidgetMetadata = (widgetId) => {
  return WIDGET_METADATA[widgetId] || null;
};

/**
 * Get default dashboard layout for a role
 * Returns an ordered array of widget IDs for initial display
 * @param {string} userRole - User's role
 * @returns {string[]} - Ordered array of widget IDs
 */
export const getDefaultLayout = (userRole) => {
  const role = userRole?.toLowerCase();

  // Role-specific default layouts
  const roleLayouts = {
    ceo: [
      "revenue-kpi",
      "profit-kpi",
      "gross-margin",
      "revenue-trend",
      "ar-aging",
      "top-products",
      "leaderboard",
      "commission-forecast",
      "inventory-health",
    ],
    cfo: [
      "revenue-kpi",
      "profit-kpi",
      "cash-flow",
      "ar-aging",
      "ap-aging",
      "dso",
      "commission-forecast",
      "vat-collection",
      "expense-breakdown",
    ],
    sales_manager: [
      "revenue-kpi",
      "revenue-trend",
      "leaderboard",
      "target-achievement",
      "commission-forecast",
      "top-products",
      "ar-aging",
      "at-risk-customers",
    ],
    operations_manager: [
      "inventory-health",
      "reorder-alerts",
      "stock-turnover",
      "fast-moving",
      "slow-moving",
      "warehouse-utilization",
      "supplier-scorecard",
    ],
    warehouse_manager: [
      "inventory-health",
      "reorder-alerts",
      "transfers",
      "reservations",
      "fast-moving",
      "slow-moving",
    ],
    sales_agent: ["leaderboard", "commission", "target-achievement", "customer-portfolio", "at-risk-customers"],
    accountant: ["ar-aging", "ap-aging", "vat-collection", "vat-return-status", "cash-flow", "dso"],
    admin: [
      "revenue-kpi",
      "profit-kpi",
      "revenue-trend",
      "ar-aging",
      "top-products",
      "inventory-health",
      "vat-collection",
    ],
  };

  return roleLayouts[role] || roleLayouts.admin;
};

/**
 * Widget size to grid span mapping
 * For CSS Grid layouts
 */
export const SIZE_TO_SPAN = {
  sm: { cols: 1, rows: 1 },
  md: { cols: 1, rows: 1 },
  lg: { cols: 2, rows: 1 },
  xl: { cols: 2, rows: 2 },
};
