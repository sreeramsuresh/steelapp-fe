import { authService } from '../services/axiosAuthService';

/**
 * Hook to check user permissions
 * Makes it easier to conditionally render UI elements based on permissions
 *
 * Usage:
 *   const can = usePermission();
 *   if (can('invoices', 'create')) { return <button>Create</button> }
 *   if (can.read('invoices')) { return <div>Read invoices</div> }
 *   if (can.create('invoices')) { return <button>Create</button> }
 *   if (can.update('invoices')) { return <button>Edit</button> }
 *   if (can.delete('invoices')) { return <button>Delete</button> }
 */
export const usePermission = () => {
  // Function form: can('resource', 'action')
  const can = (resource, action) => {
    return authService.hasPermission(resource, action);
  };

  // Convenience methods: can.read('resource'), can.create('resource'), etc.
  can.read = (resource) => authService.hasPermission(resource, 'read');
  can.create = (resource) => authService.hasPermission(resource, 'create');
  can.update = (resource) => authService.hasPermission(resource, 'update');
  can.delete = (resource) => authService.hasPermission(resource, 'delete');

  return can;
};
