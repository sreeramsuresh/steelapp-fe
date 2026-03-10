/**
 * Role-to-Permission Mapping
 * Defines which permissions each role has in the system
 *
 * Admin: Full access to everything
 * Sales: Can create and manage invoices, quotations, delivery notes, customers
 * Viewer: Read-only access to documents and analytics
 * Operator: Can create invoices and delivery notes, manage products and inventory
 */

export const ROLE_PERMISSIONS = {
  admin: {
    // Admin has full access - no need to list permissions
    // hasFullAccess is handled specially in authService.hasPermission()
  },
  sales: {
    // Sales: manage customer interactions, quotations, invoices, and delivery
    "quotations.read": true,
    "quotations.create": true,
    "quotations.update": true,
    "quotations.delete": true,
    "invoices.read": true,
    "invoices.create": true,
    "invoices.update": true,
    "customers.read": true,
    "customers.create": true,
    "customers.update": true,
    "delivery_notes.read": true,
    "delivery_notes.create": true,
    "delivery_notes.update": true,
    "delivery_notes.delete": true,
    "credit_notes.read": true,
    "account_statements.read": true,
    "analytics.read": true,
    "commissions.read": true,
  },
  viewer: {
    // Viewer: read-only access to key documents and reports
    "quotations.read": true,
    "invoices.read": true,
    "customers.read": true,
    "delivery_notes.read": true,
    "purchase_orders.read": true,
    "inventory.read": true,
    "account_statements.read": true,
    "analytics.read": true,
    "products.read": true,
    "suppliers.read": true,
  },
  operator: {
    // Operator: can manage inventory, products, and create operational documents
    "products.read": true,
    "products.create": true,
    "products.update": true,
    "products.delete": true,
    "inventory.read": true,
    "inventory.create": true,
    "inventory.update": true,
    "invoices.read": true,
    "invoices.create": true,
    "delivery_notes.read": true,
    "delivery_notes.create": true,
    "delivery_notes.update": true,
    "delivery_notes.delete": true,
    "purchase_orders.read": true,
    "purchase_orders.create": true,
    "purchase_orders.update": true,
    "grns.read": true,
    "grns.create": true,
    "warehouses.read": true,
    "stock_movements.read": true,
  },
  accountant: {
    // Accountant: can view financial data and prepare periods for audit
    "invoices.read": true,
    "payments.read": true,
    "payments.create": true,
    "journal_entries.read": true,
    "journal_entries.create": true,
    "audit_hub.read": true,
    "audit_logs.read": true,
    "account_statements.read": true,
    "analytics.read": true,
    "supplier_bills.read": true,
    "operating_expenses.read": true,
    "vat_return.read": true,
    "bank_reconciliation.read": true,
  },
  senior_accountant: {
    // Senior Accountant: everything accountant has plus approvals
    "invoices.read": true,
    "payments.read": true,
    "payments.create": true,
    "payments.update": true,
    "journal_entries.read": true,
    "journal_entries.create": true,
    "journal_entries.post": true,
    "audit_hub.read": true,
    "audit_hub.approve": true,
    "audit_hub.export": true,
    "audit_logs.read": true,
    "account_statements.read": true,
    "analytics.read": true,
    "supplier_bills.read": true,
    "supplier_bills.create": true,
    "supplier_bills.update": true,
    "supplier_bills.approve": true,
    "operating_expenses.read": true,
    "vat_return.read": true,
    "bank_reconciliation.read": true,
  },
  finance_manager: {
    // Finance Manager: everything senior_accountant has plus full invoice/payment control
    "invoices.read": true,
    "invoices.create": true,
    "invoices.update": true,
    "invoices.delete": true,
    "payments.read": true,
    "payments.create": true,
    "payments.update": true,
    "payments.delete": true,
    "journal_entries.read": true,
    "journal_entries.create": true,
    "journal_entries.post": true,
    "audit_hub.read": true,
    "audit_hub.approve": true,
    "audit_hub.export": true,
    "audit_logs.read": true,
    "account_statements.read": true,
    "analytics.read": true,
    "supplier_bills.read": true,
    "supplier_bills.create": true,
    "supplier_bills.update": true,
    "supplier_bills.approve": true,
    "operating_expenses.read": true,
    "operating_expenses.approve": true,
    "vat_return.read": true,
    "bank_reconciliation.read": true,
    "payroll.read": true,
  },
};

/**
 * Get all permissions for a role
 * @param {string} role - The user's role
 * @returns {object} Permissions object for that role
 */
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || {};
};

/**
 * Check if a role has a specific permission
 * @param {string} role - The user's role
 * @param {string} resource - Resource name (e.g., 'invoices')
 * @param {string} action - Action name (e.g., 'read', 'create', 'update')
 * @returns {boolean} True if role has permission
 */
export const roleHasPermission = (role, resource, action) => {
  if (role === "admin") {
    return true; // Admin has all permissions
  }

  const permissionKey = `${resource}.${action}`;
  const rolePerms = ROLE_PERMISSIONS[role] || {};
  return !!rolePerms[permissionKey];
};
