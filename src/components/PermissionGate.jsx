import { usePermission } from "../hooks/usePermission";

/**
 * Declarative permission gate for conditional rendering.
 *
 * Usage:
 *   <PermissionGate permission="invoices.create">
 *     <Button>Create Invoice</Button>
 *   </PermissionGate>
 *
 *   <PermissionGate permission="invoices.delete" fallback={<Tooltip>No permission</Tooltip>}>
 *     <Button>Delete</Button>
 *   </PermissionGate>
 *
 *   <PermissionGate anyPermission={["invoices.void", "invoices.delete"]}>
 *     <DangerZone />
 *   </PermissionGate>
 */
const PermissionGate = ({ permission, anyPermission, children, fallback = null }) => {
  const can = usePermission();

  let hasAccess = false;

  if (permission) {
    const [resource, action] = permission.split(".");
    hasAccess = can(resource, action);
  } else if (anyPermission) {
    hasAccess = anyPermission.some((p) => {
      const [resource, action] = p.split(".");
      return can(resource, action);
    });
  }

  return hasAccess ? children : fallback;
};

export default PermissionGate;
