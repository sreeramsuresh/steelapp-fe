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
    'quotations.read': true,
    'quotations.create': true,
    'quotations.update': true,
    'invoices_all.read': true,
    'invoices.read': true,
    'invoices.create': true,
    'invoices.update': true,
    'customers.read': true,
    'customers.create': true,
    'delivery_notes.read': true,
    'delivery_notes.create': true,
    'delivery_notes.update': true,
    'account_statements.read': true,
    'receivables.read': true,
    'analytics.read': true,
    'audit_hub.view': true,
  },
  viewer: {
    // Viewer: read-only access to key documents and reports
    'quotations.read': true,
    'invoices_all.read': true,
    'invoices.read': true,
    'customers.read': true,
    'delivery_notes.read': true,
    'purchase_orders.read': true,
    'inventory.read': true,
    'account_statements.read': true,
    'receivables.read': true,
    'payables.read': true,
    'analytics.read': true,
    'audit_hub.view': true,
  },
  operator: {
    // Operator: can manage inventory, products, and create operational documents
    'products.read': true,
    'products.create': true,
    'products.update': true,
    'inventory.read': true,
    'invoices.read': true,
    'invoices.create': true,
    'delivery_notes.read': true,
    'delivery_notes.create': true,
    'delivery_notes.update': true,
    'purchase_orders.read': true,
    'purchase_orders.create': true,
    'purchase_orders.update': true,
    'payables.read': true,
    'payables.create': true,
    'audit_hub.view': true,
  },
  accountant: {
    // Accountant: can view and prepare periods for audit
    'audit_hub.view': true,
    'audit_hub.close': true,
    'audit_hub.sign_off': true,
    'invoices_all.read': true,
    'account_statements.read': true,
    'receivables.read': true,
    'payables.read': true,
    'analytics.read': true,
  },
  senior_accountant: {
    // Senior Accountant: can review and lock periods
    'audit_hub.view': true,
    'audit_hub.close': true,
    'audit_hub.sign_off': true,
    'audit_hub.lock': true,
    'invoices_all.read': true,
    'account_statements.read': true,
    'receivables.read': true,
    'payables.read': true,
    'analytics.read': true,
  },
  finance_manager: {
    // Finance Manager: full audit hub access
    'audit_hub.view': true,
    'audit_hub.close': true,
    'audit_hub.sign_off': true,
    'audit_hub.lock': true,
    'audit_hub.unlock': true,
    'invoices_all.read': true,
    'account_statements.read': true,
    'receivables.read': true,
    'payables.read': true,
    'analytics.read': true,
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
  if (role === 'admin') {
    return true; // Admin has all permissions
  }

  const permissionKey = `${resource}.${action}`;
  const rolePerms = ROLE_PERMISSIONS[role] || {};
  return !!rolePerms[permissionKey];
};
