/**
 * PermissibleWidget Component
 * Wrapper component for permission-based widget rendering
 */

import { useDashboardPermissions } from "../../hooks/useDashboardPermissions";

export const PermissibleWidget = ({ widgetId, children, fallback = null }) => {
  const { canViewWidget, isLoading } = useDashboardPermissions();

  if (isLoading) return null;
  if (!canViewWidget(widgetId)) return fallback;

  return <>{children}</>;
};

export const withWidgetPermission = (WrappedComponent, widgetId, fallback = null) => {
  const WithPermission = (props) => {
    const { canViewWidget, isLoading } = useDashboardPermissions();

    if (isLoading) return null;
    if (!canViewWidget(widgetId)) return fallback;

    return <WrappedComponent {...props} />;
  };

  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  WithPermission.displayName = `WithPermission(${displayName})`;

  return WithPermission;
};

export const useWidgetPermissions = (widgetIds) => {
  const { canViewWidget, isLoading } = useDashboardPermissions();

  const permissions = {};
  widgetIds.forEach((id) => {
    permissions[id] = !isLoading && canViewWidget(id);
  });

  return {
    permissions,
    isLoading,
    hasAnyPermission: Object.values(permissions).some(Boolean),
    hasAllPermissions: Object.values(permissions).every(Boolean),
  };
};

export default PermissibleWidget;
