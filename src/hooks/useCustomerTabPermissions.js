/**
 * Custom hook to determine which Customer Detail tabs are visible
 * based on user permissions
 *
 * Returns object with tab keys and boolean visibility:
 * {
 *   overview: true,
 *   'ar-aging': true,
 *   invoices: true,
 *   payments: false,
 *   'credit-notes': false,
 *   activity: true
 * }
 *
 * @returns {Object} Tab permissions and utility functions
 * @property {Object} tabPermissions - Map of tab keys to boolean visibility
 * @property {Function} getFirstAllowedTab - Returns first allowed tab key or null
 * @property {boolean} hasAnyTabAccess - True if user can access at least one tab
 */

// TODO: Replace with actual auth context once implemented
// For now, using mock permissions for development
const useMockAuth = () => {
  // Mock user with full permissions for development
  // In production, replace with: const { user } = useAuth();
  return {
    user: {
      id: 1,
      name: "Developer",
      permissions: [
        "customers.read",
        "finance.view",
        "invoices.read",
        "payments.read",
        "credit_notes.read",
        "activity.read",
      ],
    },
  };
};

export function useCustomerTabPermissions() {
  const { user } = useMockAuth();

  /**
   * Helper to check if user has a specific permission
   * @param {string} permission - Permission string to check
   * @returns {boolean} True if user has permission
   */
  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  /**
   * Define which permissions are required for each tab
   * Tabs are only visible if ALL required permissions are present
   */
  const tabPermissions = {
    overview: hasPermission("customers.read"), // Always visible if can read customers
    "ar-aging": hasPermission("customers.read") && hasPermission("finance.view"), // Finance only
    invoices: hasPermission("invoices.read"),
    payments: hasPermission("payments.read"),
    "credit-notes": hasPermission("credit_notes.read"),
    activity: hasPermission("customers.read"), // All customer viewers can see activity
  };

  /**
   * Get the first allowed tab for redirect purposes
   * Used when user navigates to a forbidden tab
   * @returns {string|null} First allowed tab key or null if none
   */
  const getFirstAllowedTab = () => {
    const allowedTabs = Object.entries(tabPermissions)
      .filter(([_, allowed]) => allowed)
      .map(([tab, _]) => tab);

    return allowedTabs.length > 0 ? allowedTabs[0] : null;
  };

  /**
   * Check if user has access to at least one tab
   * Used to show "Access Denied" message if no tabs are available
   */
  const hasAnyTabAccess = Object.values(tabPermissions).some((allowed) => allowed);

  return {
    tabPermissions,
    getFirstAllowedTab,
    hasAnyTabAccess,
  };
}
