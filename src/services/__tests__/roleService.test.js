/**
 * Role Service Unit Tests (Node Native Test Runner)
 * Tests role management and permissions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import { roleService } from '../roleService.js';

describe('roleService', () => {
  beforeEach(() => {
    // Stub all methods at the start
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRoles', () => {
    it('should fetch all roles', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([
        { id: 1, name: 'Admin', permissions: [] },
        { id: 2, name: 'Manager', permissions: [] },
      ]);

      const result = await roleService.getRoles();

      expect(Array.isArray(result)).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith('/roles');
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('API Error'));

      try {
        await roleService.getRoles();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('API Error');
      }
    });
  });

  describe('getAvailableRoles', () => {
    it('should fetch available roles for dropdowns', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Manager' },
      ]);

      const result = await roleService.getAvailableRoles();

      expect(Array.isArray(result)).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith('/roles/list/available');
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('API Error'));

      try {
        await roleService.getAvailableRoles();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('getRole', () => {
    it('should fetch role by ID', async () => {
      const mockRole = { id: 1, name: 'Admin', permissions: ['read', 'write'] };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockRole);

      const result = await roleService.getRole(1);

      expect(result).toEqual(mockRole);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/1');
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Not found'));

      try {
        await roleService.getRole(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('createRole', () => {
    it('should create new role', async () => {
      const roleData = { name: 'Viewer', permissions: ['read'] };

      vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 3,
        ...roleData,
      });

      const result = await roleService.createRole(roleData);

      expect(result.id).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalledWith('/roles', roleData);
    });

    it('should handle error', async () => {
      const roleData = { name: 'InvalidRole' };

      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Creation failed'));

      try {
        await roleService.createRole(roleData);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('updateRole', () => {
    it('should update existing role', async () => {
      const roleData = { name: 'Editor', permissions: ['read', 'write', 'delete'] };

      vi.spyOn(apiClient, 'put').mockResolvedValue({
        id: 1,
        ...roleData,
      });

      const result = await roleService.updateRole(1, roleData);

      expect(result.id).toBeTruthy();
      expect(apiClient.put).toHaveBeenCalledWith('/roles/1', roleData);
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Update failed'));

      try {
        await roleService.updateRole(999, {});
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('deleteRole', () => {
    it('should delete role', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      const result = await roleService.deleteRole(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/roles/1');
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Delete failed'));

      try {
        await roleService.deleteRole(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('getAllPermissions', () => {
    it('should fetch all permissions grouped by module', async () => {
      const mockPermissions = {
        invoices: ['read', 'create', 'edit', 'delete'],
        payments: ['read', 'process'],
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPermissions);

      const result = await roleService.getAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/permissions/all');
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('API Error'));

      try {
        await roleService.getAllPermissions();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('getUserPermissions', () => {
    it('should fetch user permissions', async () => {
      const mockPermissions = {
        invoices: ['read', 'create'],
        payments: ['read'],
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPermissions);

      const result = await roleService.getUserPermissions(1);

      expect(result).toEqual(mockPermissions);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/users/1/permissions');
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Not found'));

      try {
        await roleService.getUserPermissions(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to user', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({ success: true });

      const result = await roleService.assignRoles(1, [1, 2]);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/roles/users/1/roles', {
        role_ids: [1, 2],
      });
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Assignment failed'));

      try {
        await roleService.assignRoles(999, [1]);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('replaceUserRoles', () => {
    it('should replace all user roles', async () => {
      vi.spyOn(apiClient, 'put').mockResolvedValue({ success: true });

      const result = await roleService.replaceUserRoles(1, [2, 3]);

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith('/roles/users/1/roles', {
        role_ids: [2, 3],
      });
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Replace failed'));

      try {
        await roleService.replaceUserRoles(999, []);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      const result = await roleService.removeRole(1, 2);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/roles/users/1/roles/2');
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Remove failed'));

      try {
        await roleService.removeRole(999, 1);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('grantCustomPermission', () => {
    it('should grant custom permission to user', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({ success: true });

      const result = await roleService.grantCustomPermission(1, 'invoices.export', 'Need reports', '2024-12-31');

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/roles/users/1/permissions/grant', {
        permission_key: 'invoices.export',
        reason: 'Need reports',
        expires_at: '2024-12-31',
      });
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Grant failed'));

      try {
        await roleService.grantCustomPermission(999, 'test', 'reason');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('revokeCustomPermission', () => {
    it('should revoke custom permission from user', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      const result = await roleService.revokeCustomPermission(1, 'invoices.export', 'No longer needed');

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/roles/users/1/permissions/invoices.export', {
        data: { reason: 'No longer needed' },
      });
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Revoke failed'));

      try {
        await roleService.revokeCustomPermission(999, 'test');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('getAuditLog', () => {
    it('should fetch audit log for user', async () => {
      const mockLog = [{ action: 'role_assigned', roleId: 1, timestamp: '2024-01-15' }];

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockLog);

      const result = await roleService.getAuditLog(1, 50);

      expect(Array.isArray(result)).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith('/roles/users/1/audit-log', {
        params: { limit: 50 },
      });
    });

    it('should handle error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Audit log error'));

      try {
        await roleService.getAuditLog(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });
});
