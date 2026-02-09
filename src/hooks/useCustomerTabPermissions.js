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

import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/axiosAuthService";

export function useCustomerTabPermissions() {
  const { user } = useAuth();

  /**
   * Helper to check if user has a specific permission.
   * Uses authService.hasPermission for role-based checks,
   * falling back to user.permissions array if available.
   * @param {string} permission - Permission string (e.g. "customers.read")
   * @returns {boolean} True if user has permission
   */
  const hasPermission = (permission) => {
    if (!user) return false;
    // Parse "resource.action" format for authService check
    const [resource, action] = permission.split(".");
    if (resource && action) {
      try {
        return authService.hasPermission(resource, action) || authService.hasRole("admin");
      } catch {
        // authService not available, fall back to permissions array
      }
    }
    // Fallback: check user.permissions array directly
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    // Default: admin role has all permissions
    return user.role === "admin" || user.role === "Administrator";
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
