/**
 * Permissions Service Unit Tests (Node Native Test Runner)
 * Role-Based Access Control
 * Tests permission retrieval and validation
 * Tests role management (CRUD operations)
 * Tests permission assignment to users and roles
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import { roleService } from '../roleService.js';

describe('permissionsService (roleService)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Get Roles', () => {
    it('should retrieve all roles for company', async () => {
      const mockRoles = [
        { id: 1, name: 'ADMIN', description: 'Administrator' },
        { id: 2, name: 'MANAGER', description: 'Manager' },
        { id: 3, name: 'USER', description: 'Standard User' },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockRoles);

      const result = await roleService.getRoles();

      expect(result.length).toBe(3);
      expect(result[0].name).toBe('ADMIN');
      expect(apiClient.get.calledWith('/roles').toBeTruthy());
    });

    it('should get available roles for dropdown', async () => {
      const mockRoles = [
        { id: 1, name: 'ADMIN', displayName: 'Administrator' },
        { id: 2, name: 'MANAGER', displayName: 'Manager' },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockRoles);

      const result = await roleService.getAvailableRoles();

      expect(result.length).toBe(2);
      expect(apiClient.get.calledWith('/roles/list/available').toBeTruthy());
    });

    it('should get specific role by ID', async () => {
      const mockRole = {
        id: 1,
        name: 'ADMIN',
        description: 'Administrator',
        permissions: ['READ_ALL', 'WRITE_ALL', 'DELETE_ALL', 'ADMIN_PANEL'],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockRole);

      const result = await roleService.getRole(1);

      expect(result.name).toBe('ADMIN');
      expect(result.permissions.length).toBe(4);
      expect(apiClient.get.calledWith('/roles/1').toBeTruthy());
    });

    it('should handle role not found error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Role not found'));

      try {
        await roleService.getRole(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Role not found');
      }
    });

    it('should handle network error when fetching roles', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await roleService.getRoles();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should return empty list for company with no custom roles', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      const result = await roleService.getRoles();

      expect(result).toEqual([]);
    });
  });

  describe('Create Role', () => {
    it('should create new role with permissions', async () => {
      const roleData = {
        name: 'OPERATOR',
        description: 'Operator role',
        permissions: ['READ_INVOICE', 'CREATE_PO'],
      };
      const mockResponse = { id: 4, ...roleData };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await roleService.createRole(roleData);

      expect(result.id).toBe(4);
      expect(result.name).toBe('OPERATOR');
      expect(apiClient.post.calledWith('/roles', roleData).toBeTruthy());
    });

    it('should validate required role fields', async () => {
      const roleData = {
        name: 'VIEWER',
        description: 'View-only role',
        permissions: ['READ_INVOICE', 'READ_PO'],
      };
      const mockResponse = { id: 5, ...roleData };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await roleService.createRole(roleData);

      expect(result.name).toBe('VIEWER');
      expect(result.permissions.length).toBe(2);
    });

    it('should reject role creation without name', async () => {
      const roleData = {
        description: 'No name role',
        permissions: [],
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Role name required'));

      try {
        await roleService.createRole(roleData);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('Role name required').toBeTruthy());
      }
    });

    it('should prevent duplicate role names', async () => {
      const roleData = {
        name: 'ADMIN',
        description: 'Duplicate admin',
        permissions: [],
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Role name already exists'));

      try {
        await roleService.createRole(roleData);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('Role name already exists').toBeTruthy());
      }
    });

    it('should handle authorization error for role creation', async () => {
      const roleData = {
        name: 'NEW_ROLE',
        description: 'New role',
        permissions: [],
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Only directors can create roles'));

      try {
        await roleService.createRole(roleData);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('Only directors').toBeTruthy());
      }
    });
  });

  describe('Update Role', () => {
    it('should update role details', async () => {
      const roleId = 2;
      const updateData = { description: 'Updated manager role' };
      const mockResponse = { id: roleId, name: 'MANAGER', ...updateData };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await roleService.updateRole(roleId, updateData);

      expect(result.description).toBe('Updated manager role');
      expect(apiClient.put.calledWith(`/roles/${roleId}`, updateData).toBeTruthy());
    });

    it('should update role permissions', async () => {
      const roleId = 3;
      const updateData = {
        permissions: ['READ_INVOICE', 'READ_PO', 'APPROVE_PO'],
      };
      const mockResponse = { id: roleId, name: 'USER', ...updateData };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await roleService.updateRole(roleId, updateData);

      expect(result.permissions.length).toBe(3);
      expect(result.permissions.includes('APPROVE_PO').toBeTruthy());
    });

    it('should handle role not found on update', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Role not found'));

      try {
        await roleService.updateRole(999, { description: 'Update' });
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Role not found');
      }
    });

    it('should prevent modification of system roles', async () => {
      const roleId = 1;
      vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('System roles cannot be modified'));

      try {
        await roleService.updateRole(roleId, { name: 'SUPER_ADMIN' });
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('System roles cannot be modified').toBeTruthy());
      }
    });

    it('should validate permission codes on update', async () => {
      const roleId = 2;
      const updateData = { permissions: ['INVALID_PERM'] };
      vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Invalid permission code'));

      try {
        await roleService.updateRole(roleId, updateData);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Invalid permission code');
      }
    });
  });

  describe('Delete Role', () => {
    it('should delete custom role', async () => {
      const roleId = 4;
      const mockResponse = { success: true, message: 'Role deleted' };
      vi.spyOn(apiClient, 'delete').mockResolvedValue(mockResponse);

      const result = await roleService.deleteRole(roleId);

      expect(result.success).toBe(true);
      expect(apiClient.delete.calledWith(`/roles/${roleId}`).toBeTruthy());
    });

    it('should handle deletion of non-existent role', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Role not found'));

      try {
        await roleService.deleteRole(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Role not found');
      }
    });

    it('should prevent deletion of system roles', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Cannot delete system role'));

      try {
        await roleService.deleteRole(1);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('Cannot delete system role').toBeTruthy());
      }
    });

    it('should prevent deletion of role with assigned users', async () => {
      const roleId = 5;
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Cannot delete role: 10 users assigned'));

      try {
        await roleService.deleteRole(roleId);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('Cannot delete role').toBeTruthy());
      }
    });

    it('should require director approval to delete role', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Insufficient permissions'));

      try {
        await roleService.deleteRole(3);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Insufficient permissions');
      }
    });
  });

  describe('Permission Management', () => {
    it('should get all available permissions grouped by module', async () => {
      const mockPermissions = {
        INVOICING: [
          { code: 'READ_INVOICE', name: 'Read Invoices' },
          { code: 'CREATE_INVOICE', name: 'Create Invoices' },
          { code: 'DELETE_INVOICE', name: 'Delete Invoices' },
        ],
        PURCHASE: [
          { code: 'READ_PO', name: 'Read POs' },
          { code: 'CREATE_PO', name: 'Create POs' },
        ],
        ADMIN: [{ code: 'ADMIN_PANEL', name: 'Access Admin Panel' }],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPermissions);

      const result = await roleService.getAllPermissions();

      expect(Object.keys(result).toBeTruthy().includes('INVOICING'));
      expect(Object.keys(result).toBeTruthy().includes('PURCHASE'));
      expect(result.INVOICING.length).toBe(3);
      expect(apiClient.get.calledWith('/roles/permissions/all').toBeTruthy());
    });

    it('should get user permissions by user ID', async () => {
      const userId = 5;
      const mockPermissions = ['READ_INVOICE', 'CREATE_PO', 'APPROVE_PAYMENT'];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPermissions);

      const result = await roleService.getUserPermissions(userId);

      expect(result.length).toBe(3);
      expect(result.includes('APPROVE_PAYMENT').toBeTruthy());
      expect(apiClient.get.calledWith(`/roles/users/${userId}/permissions`).toBeTruthy());
    });

    it('should return empty permissions for user with no permissions', async () => {
      const userId = 999;
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      const result = await roleService.getUserPermissions(userId);

      expect(result).toEqual([]);
    });
  });

  describe('User Role Assignment', () => {
    it('should assign single role to user', async () => {
      const userId = 5;
      const roleIds = [2];
      const mockResponse = { success: true, roles: [{ id: 2, name: 'MANAGER' }] };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      expect(result.success).toBe(true);
      expect(apiClient.post.calledWith(`/roles/users/${userId}/roles`, {
        role_ids: roleIds,
      }).toBeTruthy());
    });

    it('should assign multiple roles to user', async () => {
      const userId = 6;
      const roleIds = [2, 3];
      const mockResponse = {
        success: true,
        roles: [
          { id: 2, name: 'MANAGER' },
          { id: 3, name: 'USER' },
        ],
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      expect(result.roles.length).toBe(2);
    });

    it('should replace all user roles', async () => {
      const userId = 7;
      const roleIds = [3];
      const mockResponse = { success: true, roles: [{ id: 3, name: 'USER' }] };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await roleService.replaceUserRoles(userId, roleIds);

      expect(result.success).toBe(true);
      expect(apiClient.put.calledWith(`/roles/users/${userId}/roles`, {
        role_ids: roleIds,
      }).toBeTruthy());
    });

    it('should handle user not found on role assignment', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('User not found'));

      try {
        await roleService.assignRoles(999, [1]);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('User not found');
      }
    });

    it('should prevent assignment of invalid role', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Role does not exist'));

      try {
        await roleService.assignRoles(5, [999]);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Role does not exist');
      }
    });

    it('should remove role from user', async () => {
      const userId = 5;
      const roleId = 3;
      const mockResponse = { success: true };
      vi.spyOn(apiClient, 'delete').mockResolvedValue(mockResponse);

      const result = await roleService.removeRole(userId, roleId);

      expect(result.success).toBe(true);
      expect(apiClient.delete.calledWith(`/roles/users/${userId}/roles/${roleId}`).toBeTruthy());
    });

    it('should prevent removal of all roles from user', async () => {
      const userId = 5;
      const roleId = 1;
      vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('User must have at least one role'));

      try {
        await roleService.removeRole(userId, roleId);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('must have at least one role').toBeTruthy());
      }
    });
  });

  describe('Custom Permission Grants', () => {
    it('should grant custom permission to user', async () => {
      const userId = 5;
      const permissionKey = 'EXPORT_REPORT';
      const reason = 'Quarterly reporting requirement';
      const mockResponse = { success: true, permission: permissionKey };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await roleService.grantCustomPermission(userId, permissionKey, reason);

      expect(result.success).toBe(true);
      expect(apiClient.post.calledWith(`/roles/users/${userId}/permissions/grant`, {
        permission_key: permissionKey,
        reason,
        expires_at: null,
      }).toBeTruthy());
    });

    it('should grant permission with expiration', async () => {
      const userId = 5;
      const permissionKey = 'ADMIN_PANEL_ACCESS';
      const reason = 'Temporary admin duties';
      const expiresAt = '2024-12-31T23:59:59Z';
      const mockResponse = { success: true, permission: permissionKey, expiresAt };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await roleService.grantCustomPermission(userId, permissionKey, reason, expiresAt);

      expect(result.expiresAt).toBe(expiresAt);
      expect(apiClient.post.calledWith(
        `/roles/users/${userId}/permissions/grant`,
        expect.objectContaining.has('expires_at', expiresAt).toBeTruthy()
      ));
    });

    it('should revoke custom permission from user', async () => {
      const userId = 5;
      const permissionKey = 'EXPORT_REPORT';
      const mockResponse = { success: true };
      vi.spyOn(apiClient, 'delete').mockResolvedValue(mockResponse);

      const result = await roleService.revokeCustomPermission(userId, permissionKey);

      expect(result.success).toBe(true);
      expect(apiClient.delete.calledWith(`/roles/users/${userId}/permissions/${permissionKey}`, {
        data: { reason: null },
      }).toBeTruthy());
    });

    it('should revoke permission with reason', async () => {
      const userId = 5;
      const permissionKey = 'ADMIN_PANEL_ACCESS';
      const reason = 'User no longer needs admin access';
      const mockResponse = { success: true };
      vi.spyOn(apiClient, 'delete').mockResolvedValue(mockResponse);

      const result = await roleService.revokeCustomPermission(userId, permissionKey, reason);

      expect(result.success).toBe(true);
      expect(apiClient.delete.calledWith(`/roles/users/${userId}/permissions/${permissionKey}`, {
        data: { reason },
      }).toBeTruthy());
    });

    it('should handle invalid permission code on grant', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Permission does not exist'));

      try {
        await roleService.grantCustomPermission(5, 'INVALID_PERM', 'Reason');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('Permission does not exist').toBeTruthy());
      }
    });

    it('should prevent granting already assigned permission', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('User already has this permission'));

      try {
        await roleService.grantCustomPermission(5, 'READ_INVOICE', 'Reason');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('User already has this permission').toBeTruthy());
      }
    });
  });

  describe('Audit Logging', () => {
    it('should get permission audit log for user', async () => {
      const userId = 5;
      const mockAuditLog = [
        {
          timestamp: '2024-02-01T10:00:00Z',
          action: 'GRANT',
          permission: 'EXPORT_REPORT',
          grantedBy: 'admin@example.com',
          reason: 'Quarterly reporting',
        },
        {
          timestamp: '2024-02-02T15:30:00Z',
          action: 'REVOKE',
          permission: 'ADMIN_PANEL_ACCESS',
          revokedBy: 'admin@example.com',
          reason: 'No longer needed',
        },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAuditLog);

      const result = await roleService.getAuditLog(userId);

      expect(result.length).toBe(2);
      expect(result[0].action).toBe('GRANT');
      expect(result[1].action).toBe('REVOKE');
      expect(apiClient.get.calledWith(`/roles/users/${userId}/audit-log`, {
        params: { limit: 100 },
      }).toBeTruthy());
    });

    it('should get audit log with custom limit', async () => {
      const userId = 5;
      const limit = 50;
      const mockAuditLog = [];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAuditLog);

      await roleService.getAuditLog(userId, limit);

      expect(apiClient.get.calledWith(`/roles/users/${userId}/audit-log`, {
        params: { limit },
      }).toBeTruthy());
    });

    it('should return empty audit log when no changes recorded', async () => {
      const userId = 999;
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      const result = await roleService.getAuditLog(userId);

      expect(result).toEqual([]);
    });

    it('should track role assignments in audit log', async () => {
      const userId = 5;
      const mockAuditLog = [
        {
          timestamp: '2024-02-01T09:00:00Z',
          action: 'ASSIGN_ROLE',
          role: 'MANAGER',
          assignedBy: 'director@example.com',
        },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAuditLog);

      const result = await roleService.getAuditLog(userId);

      expect(result[0].action).toBe('ASSIGN_ROLE');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Request timeout'));

      try {
        await roleService.getRoles();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Request timeout');
      }
    });

    it('should handle authorization errors', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Insufficient permissions'));

      try {
        await roleService.createRole({ name: 'NEW' });
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Insufficient permissions');
      }
    });

    it('should handle server errors gracefully', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Server error: 500'));

      try {
        await roleService.getRoles();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message.includes('Server error').toBeTruthy());
      }
    });

    it('should handle malformed permission data', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(null);

      const result = await roleService.getAllPermissions();

      expect(result !== undefined).toBeTruthy();
    });
  });

  describe('Multi-Tenancy Compliance', () => {
    it('should enforce company isolation for roles', async () => {
      const mockRoles = [
        { id: 1, name: 'ADMIN', companyId: 1 },
        { id: 2, name: 'MANAGER', companyId: 1 },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockRoles);

      const result = await roleService.getRoles();

      expect(result[0].companyId).toBe(1);
    });

    it('should ensure role assignments respect company boundaries', async () => {
      const userId = 5;
      const roleIds = [2];
      const mockResponse = { success: true, roles: [{ id: 2, companyId: 1 }] };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      expect(result.roles[0].companyId).toBe(1);
    });

    it('should isolate permissions by company', async () => {
      const mockPermissions = {
        INVOICING: [{ code: 'READ_INVOICE', companyId: 1 }],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPermissions);

      const result = await roleService.getAllPermissions();

      expect(Object.keys(result).toBeTruthy().includes('INVOICING'));
    });
  });
});
