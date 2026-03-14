import { createContext, useCallback, useContext, useMemo } from "react";

export const AuthContext = createContext();

/**
 * Auth Context Provider
 * Provides user information from App.jsx to child components
 */
export function AuthProvider({ children, user, onLogout }) {
  const permissions = user?.permissions || {};
  const roleNames = user?.roleNames || [];

  /**
   * Check if the current user has a specific permission.
   * @param {string} resource - e.g. "invoices", "purchase_orders"
   * @param {string} action - e.g. "read", "approve", "void"
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (resource, action) => {
      if (!user) return false;
      if (user.role === "admin") return true;

      // Director roles bypass
      const directorRoles = [
        "admin",
        "managing_director",
        "operations_manager",
        "finance_manager",
        "finance_manager_predefined",
      ];
      if (roleNames.some((r) => directorRoles.includes(r))) return true;

      // Try exact match, then camelCase conversion
      let resourcePerms = permissions[resource];
      if (!resourcePerms && resource.includes("_")) {
        const camelKey = resource.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        resourcePerms = permissions[camelKey];
      }
      return !!resourcePerms?.[action];
    },
    [user, permissions, roleNames]
  );

  /**
   * Check if the current user has any of the specified roles.
   * @param {string|string[]} roles
   * @returns {boolean}
   */
  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      if (roleNames.some((r) => allowed.includes(r))) return true;
      return allowed.includes(user.role);
    },
    [user, roleNames]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      userId: user?.id,
      companyId: user?.companyId,
      companyName: user?.companyName,
      role: user?.role,
      permissions,
      roleNames,
      hasPermission,
      hasRole,
      onLogout,
    }),
    [user, permissions, roleNames, hasPermission, hasRole, onLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Returns user and authentication state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
