/**
 * useDashboardPermissions Hook
 * Integrates auth system with dashboard widget permissions
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/authService";
import {
  canViewWidget,
  getVisibleWidgets,
  getWidgetsByCategory,
  getDefaultLayout,
  DASHBOARD_ROLES,
} from "../components/dashboard/config/DashboardConfig";

// Alias for cleaner code
const ROLES = DASHBOARD_ROLES;

/**
 * Maps auth service roles to dashboard config roles
 */
const mapAuthRoleToDashboardRole = (authRole) => {
  if (!authRole) return ROLES.SALES_AGENT;

  const normalizedRole = String(authRole)
    .toLowerCase()
    .replace(/[-_\s]/g, "");

  const roleMap = {
    admin: ROLES.ADMIN,
    administrator: ROLES.ADMIN,
    superadmin: ROLES.ADMIN,
    ceo: ROLES.CEO,
    chiefexecutiveofficer: ROLES.CEO,
    cfo: ROLES.CFO,
    chieffinancialofficer: ROLES.CFO,
    financemanager: ROLES.CFO,
    salesmanager: ROLES.SALES_MANAGER,
    salesdirector: ROLES.SALES_MANAGER,
    operationsmanager: ROLES.OPERATIONS_MANAGER,
    opsmanager: ROLES.OPERATIONS_MANAGER,
    warehousemanager: ROLES.WAREHOUSE_MANAGER,
    inventorymanager: ROLES.WAREHOUSE_MANAGER,
    salesagent: ROLES.SALES_AGENT,
    salesperson: ROLES.SALES_AGENT,
    salesrep: ROLES.SALES_AGENT,
    accountant: ROLES.ACCOUNTANT,
    bookkeeper: ROLES.ACCOUNTANT,
  };

  const mappedRole = roleMap[normalizedRole];
  if (mappedRole) return mappedRole;

  if (normalizedRole.includes("admin")) return ROLES.ADMIN;
  if (normalizedRole.includes("ceo")) return ROLES.CEO;
  if (normalizedRole.includes("cfo")) return ROLES.CFO;
  if (normalizedRole.includes("salesmanager")) return ROLES.SALES_MANAGER;
  if (normalizedRole.includes("operations")) return ROLES.OPERATIONS_MANAGER;
  if (normalizedRole.includes("warehouse")) return ROLES.WAREHOUSE_MANAGER;
  if (normalizedRole.includes("accountant")) return ROLES.ACCOUNTANT;
  if (normalizedRole.includes("sales")) return ROLES.SALES_AGENT;

  return ROLES.SALES_AGENT;
};

export const useDashboardPermissions = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authService.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("[useDashboardPermissions] Error loading user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    const handleStorageChange = (e) => {
      if (e.key === "steel-app-user" || e.key === "steel-app-token") {
        loadUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const role = useMemo(() => {
    if (!user) return ROLES.SALES_AGENT;
    return mapAuthRoleToDashboardRole(user.role);
  }, [user]);

  const checkCanViewWidget = useCallback(
    (widgetId) => canViewWidget(widgetId, role),
    [role],
  );

  const visibleWidgets = useMemo(() => getVisibleWidgets(role), [role]);

  const getWidgetsForCategory = useCallback(
    (category) => getWidgetsByCategory(category, role),
    [role],
  );

  const defaultLayout = useMemo(() => getDefaultLayout(role), [role]);

  const isAuthenticated = useMemo(
    () => !!(user && authService.getToken()),
    [user],
  );

  return {
    user,
    role,
    isLoading,
    isAuthenticated,
    canViewWidget: checkCanViewWidget,
    getVisibleWidgets: () => visibleWidgets,
    getWidgetsByCategory: getWidgetsForCategory,
    getDefaultLayout: () => defaultLayout,
    visibleWidgets,
    defaultLayout,
  };
};

export default useDashboardPermissions;
