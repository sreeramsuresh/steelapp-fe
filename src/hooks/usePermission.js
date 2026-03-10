import { useAuth } from "../contexts/AuthContext";

/**
 * Hook to check user permissions via AuthContext (live state, not localStorage).
 *
 * Usage:
 *   const can = usePermission();
 *   if (can('invoices', 'create')) { return <button>Create</button> }
 *   if (can.read('invoices')) { return <div>Read invoices</div> }
 *   if (can.create('invoices')) { return <button>Create</button> }
 *   if (can.update('invoices')) { return <button>Edit</button> }
 *   if (can.delete('invoices')) { return <button>Delete</button> }
 *   if (can.approve('purchase_orders')) { return <button>Approve</button> }
 *   if (can.void('invoices')) { return <button>Void</button> }
 */
export const usePermission = () => {
  const { hasPermission } = useAuth();

  // Function form: can('resource', 'action')
  const can = (resource, action) => {
    return hasPermission(resource, action);
  };

  // Convenience methods
  can.read = (resource) => hasPermission(resource, "read");
  can.create = (resource) => hasPermission(resource, "create");
  can.update = (resource) => hasPermission(resource, "update");
  can.delete = (resource) => hasPermission(resource, "delete");
  can.approve = (resource) => hasPermission(resource, "approve");
  can.void = (resource) => hasPermission(resource, "void");
  can.issue = (resource) => hasPermission(resource, "issue");
  can.cancel = (resource) => hasPermission(resource, "cancel");
  can.export = (resource) => hasPermission(resource, "export");

  return can;
};
