import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api';
import { roleService } from '../roleService';

vi.mock("../api);

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRoles', () => {
    it('should fetch all roles', async () => {
      apiClient.get.mockResolvedValue([
        { id: 1, name: 'Admin', permissions: [] },
        { id: 2, name: 'Manager', permissions: [] },
      ]);

      const result = await roleService.getRoles();

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/roles');
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(roleService.getRoles()).rejects.toThrow('API Error');
    });
  });

  describe('getAvailableRoles', () => {
    it('should fetch available roles for dropdowns', async () => {
      apiClient.get.mockResolvedValue([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Manager' },
      ]);

      const result = await roleService.getAvailableRoles();

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/list/available');
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(roleService.getAvailableRoles()).rejects.toThrow();
    });
  });

  describe('getRole', () => {
    it('should fetch role by ID', async () => {
      const mockRole = { id: 1, name: 'Admin', permissions: ['read', 'write'] };

      apiClient.get.mockResolvedValue(mockRole);

      const result = await roleService.getRole(1);

      expect(result).toEqual(mockRole);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/1');
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue(new Error('Not found'));

      await expect(roleService.getRole(999)).rejects.toThrow();
    });
  });

  describe('createRole', () => {
    it('should create new role', async () => {
      const roleData = { name: 'Viewer', permissions: ['read'] };

      apiClient.post.mockResolvedValue({
        id: 3,
        ...roleData,
      });

      const result = await roleService.createRole(roleData);

      expect(result).toHaveProperty('id');
      expect(apiClient.post).toHaveBeenCalledWith('/roles', roleData);
    });

    it('should handle error', async () => {
      const roleData = { name: 'InvalidRole' };

      apiClient.post.mockRejectedValue(new Error('Creation failed'));

      await expect(roleService.createRole(roleData)).rejects.toThrow();
    });
  });

  describe('updateRole', () => {
    it('should update existing role', async () => {
      const roleData = { name: 'Editor', permissions: ['read', 'write', 'delete'] };

      apiClient.put.mockResolvedValue({
        id: 1,
        ...roleData,
      });

      const result = await roleService.updateRole(1, roleData);

      expect(result).toHaveProperty('id');
      expect(apiClient.put).toHaveBeenCalledWith('/roles/1', roleData);
    });

    it('should handle error', async () => {
      apiClient.put.mockRejectedValue(new Error('Update failed'));

      await expect(roleService.updateRole(999, {})).rejects.toThrow();
    });
  });

  describe('deleteRole', () => {
    it('should delete role', async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await roleService.deleteRole(1);

      expect(result).toHaveProperty('success', true);
      expect(apiClient.delete).toHaveBeenCalledWith('/roles/1');
    });

    it('should handle error', async () => {
      apiClient.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(roleService.deleteRole(999)).rejects.toThrow();
    });
  });

  describe('getAllPermissions', () => {
    it('should fetch all permissions grouped by module', async () => {
      const mockPermissions = {
        invoices: ['read', 'create', 'edit', 'delete'],
        payments: ['read', 'process'],
      };

      apiClient.get.mockResolvedValue(mockPermissions);

      const result = await roleService.getAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/permissions/all');
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(roleService.getAllPermissions()).rejects.toThrow();
    });
  });

  describe('getUserPermissions', () => {
    it('should fetch user permissions', async () => {
      const mockPermissions = {
        invoices: ['read', 'create'],
        payments: ['read'],
      };

      apiClient.get.mockResolvedValue(mockPermissions);

      const result = await roleService.getUserPermissions(1);

      expect(result).toEqual(mockPermissions);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/users/1/permissions');
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue(new Error('Not found'));

      await expect(roleService.getUserPermissions(999)).rejects.toThrow();
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to user', async () => {
      apiClient.post.mockResolvedValue({ success: true });

      const result = await roleService.assignRoles(1, [1, 2]);

      expect(result).toHaveProperty('success', true);
      expect(apiClient.post).toHaveBeenCalledWith('/roles/users/1/roles', {
        role_ids: [1, 2],
      });
    });

    it('should handle error', async () => {
      apiClient.post.mockRejectedValue(new Error('Assignment failed'));

      await expect(roleService.assignRoles(999, [1])).rejects.toThrow();
    });
  });

  describe('replaceUserRoles', () => {
    it('should replace all user roles', async () => {
      apiClient.put.mockResolvedValue({ success: true });

      const result = await roleService.replaceUserRoles(1, [2, 3]);

      expect(result).toHaveProperty('success', true);
      expect(apiClient.put).toHaveBeenCalledWith('/roles/users/1/roles', {
        role_ids: [2, 3],
      });
    });

    it('should handle error', async () => {
      apiClient.put.mockRejectedValue(new Error('Replace failed'));

      await expect(roleService.replaceUserRoles(999, [])).rejects.toThrow();
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await roleService.removeRole(1, 2);

      expect(result).toHaveProperty('success', true);
      expect(apiClient.delete).toHaveBeenCalledWith('/roles/users/1/roles/2');
    });

    it('should handle error', async () => {
      apiClient.delete.mockRejectedValue(new Error('Remove failed'));

      await expect(roleService.removeRole(999, 1)).rejects.toThrow();
    });
  });

  describe('grantCustomPermission', () => {
    it('should grant custom permission to user', async () => {
      apiClient.post.mockResolvedValue({ success: true });

      const result = await roleService.grantCustomPermission(1, 'invoices.export', 'Need reports', '2024-12-31');

      expect(result).toHaveProperty('success', true);
      expect(apiClient.post).toHaveBeenCalledWith('/roles/users/1/permissions/grant', {
        permission_key: 'invoices.export',
        reason: 'Need reports',
        expires_at: '2024-12-31',
      });
    });

    it('should handle error', async () => {
      apiClient.post.mockRejectedValue(new Error('Grant failed'));

      await expect(roleService.grantCustomPermission(999, 'test', 'reason')).rejects.toThrow();
    });
  });

  describe('revokeCustomPermission', () => {
    it('should revoke custom permission from user', async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await roleService.revokeCustomPermission(1, 'invoices.export', 'No longer needed');

      expect(result).toHaveProperty('success', true);
      expect(apiClient.delete).toHaveBeenCalledWith('/roles/users/1/permissions/invoices.export', {
        data: { reason: 'No longer needed' },
      });
    });

    it('should handle error', async () => {
      apiClient.delete.mockRejectedValue(new Error('Revoke failed'));

      await expect(roleService.revokeCustomPermission(999, 'test')).rejects.toThrow();
    });
  });

  describe('getAuditLog', () => {
    it('should fetch audit log for user', async () => {
      const mockLog = [
        { action: 'role_assigned', roleId: 1, timestamp: '2024-01-15' },
      ];

      apiClient.get.mockResolvedValue(mockLog);

      const result = await roleService.getAuditLog(1, 50);

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/users/1/audit-log', {
        params: { limit: 50 },
      });
    });

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue(new Error('Audit log error'));

      await expect(roleService.getAuditLog(999)).rejects.toThrow();
    });
  });
});
