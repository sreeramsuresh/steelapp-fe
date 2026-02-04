/**
 * Permissions Service Unit Tests (Node Native Test Runner)
 * Role-Based Access Control
 * Tests permission retrieval and validation
 * Tests role management (CRUD operations)
 * Tests permission assignment to users and roles
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { roleService } from '../roleService.js';

describe('permissionsService (roleService)', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Get Roles', () => {
    test('should retrieve all roles for company', async () => {
      const mockRoles = [
        { id: 1, name: 'ADMIN', description: 'Administrator' },
        { id: 2, name: 'MANAGER', description: 'Manager' },
        { id: 3, name: 'USER', description: 'Standard User' },
      ];
      sinon.stub(apiClient, 'get').resolves(mockRoles);

      const result = await roleService.getRoles();

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].name, 'ADMIN');
      assert.ok(apiClient.get.calledWith('/roles'));
    });

    test('should get available roles for dropdown', async () => {
      const mockRoles = [
        { id: 1, name: 'ADMIN', displayName: 'Administrator' },
        { id: 2, name: 'MANAGER', displayName: 'Manager' },
      ];
      sinon.stub(apiClient, 'get').resolves(mockRoles);

      const result = await roleService.getAvailableRoles();

      assert.strictEqual(result.length, 2);
      assert.ok(apiClient.get.calledWith('/roles/list/available'));
    });

    test('should get specific role by ID', async () => {
      const mockRole = {
        id: 1,
        name: 'ADMIN',
        description: 'Administrator',
        permissions: ['READ_ALL', 'WRITE_ALL', 'DELETE_ALL', 'ADMIN_PANEL'],
      };
      sinon.stub(apiClient, 'get').resolves(mockRole);

      const result = await roleService.getRole(1);

      assert.strictEqual(result.name, 'ADMIN');
      assert.strictEqual(result.permissions.length, 4);
      assert.ok(apiClient.get.calledWith('/roles/1'));
    });

    test('should handle role not found error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Role not found'));

      try {
        await roleService.getRole(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Role not found');
      }
    });

    test('should handle network error when fetching roles', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await roleService.getRoles();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should return empty list for company with no custom roles', async () => {
      sinon.stub(apiClient, 'get').resolves([]);

      const result = await roleService.getRoles();

      assert.deepStrictEqual(result, []);
    });
  });

  describe('Create Role', () => {
    test('should create new role with permissions', async () => {
      const roleData = {
        name: 'OPERATOR',
        description: 'Operator role',
        permissions: ['READ_INVOICE', 'CREATE_PO'],
      };
      const mockResponse = { id: 4, ...roleData };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await roleService.createRole(roleData);

      assert.strictEqual(result.id, 4);
      assert.strictEqual(result.name, 'OPERATOR');
      assert.ok(apiClient.post.calledWith('/roles', roleData));
    });

    test('should validate required role fields', async () => {
      const roleData = {
        name: 'VIEWER',
        description: 'View-only role',
        permissions: ['READ_INVOICE', 'READ_PO'],
      };
      const mockResponse = { id: 5, ...roleData };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await roleService.createRole(roleData);

      assert.strictEqual(result.name, 'VIEWER');
      assert.strictEqual(result.permissions.length, 2);
    });

    test('should reject role creation without name', async () => {
      const roleData = {
        description: 'No name role',
        permissions: [],
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Role name required'));

      try {
        await roleService.createRole(roleData);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('Role name required'));
      }
    });

    test('should prevent duplicate role names', async () => {
      const roleData = {
        name: 'ADMIN',
        description: 'Duplicate admin',
        permissions: [],
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Role name already exists'));

      try {
        await roleService.createRole(roleData);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('Role name already exists'));
      }
    });

    test('should handle authorization error for role creation', async () => {
      const roleData = {
        name: 'NEW_ROLE',
        description: 'New role',
        permissions: [],
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Only directors can create roles'));

      try {
        await roleService.createRole(roleData);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('Only directors'));
      }
    });
  });

  describe('Update Role', () => {
    test('should update role details', async () => {
      const roleId = 2;
      const updateData = { description: 'Updated manager role' };
      const mockResponse = { id: roleId, name: 'MANAGER', ...updateData };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await roleService.updateRole(roleId, updateData);

      assert.strictEqual(result.description, 'Updated manager role');
      assert.ok(apiClient.put.calledWith(`/roles/${roleId}`, updateData));
    });

    test('should update role permissions', async () => {
      const roleId = 3;
      const updateData = {
        permissions: ['READ_INVOICE', 'READ_PO', 'APPROVE_PO'],
      };
      const mockResponse = { id: roleId, name: 'USER', ...updateData };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await roleService.updateRole(roleId, updateData);

      assert.strictEqual(result.permissions.length, 3);
      assert.ok(result.permissions.includes('APPROVE_PO'));
    });

    test('should handle role not found on update', async () => {
      sinon.stub(apiClient, 'put').rejects(new Error('Role not found'));

      try {
        await roleService.updateRole(999, { description: 'Update' });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Role not found');
      }
    });

    test('should prevent modification of system roles', async () => {
      const roleId = 1;
      sinon.stub(apiClient, 'put').rejects(new Error('System roles cannot be modified'));

      try {
        await roleService.updateRole(roleId, { name: 'SUPER_ADMIN' });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('System roles cannot be modified'));
      }
    });

    test('should validate permission codes on update', async () => {
      const roleId = 2;
      const updateData = { permissions: ['INVALID_PERM'] };
      sinon.stub(apiClient, 'put').rejects(new Error('Invalid permission code'));

      try {
        await roleService.updateRole(roleId, updateData);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid permission code');
      }
    });
  });

  describe('Delete Role', () => {
    test('should delete custom role', async () => {
      const roleId = 4;
      const mockResponse = { success: true, message: 'Role deleted' };
      sinon.stub(apiClient, 'delete').resolves(mockResponse);

      const result = await roleService.deleteRole(roleId);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith(`/roles/${roleId}`));
    });

    test('should handle deletion of non-existent role', async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error('Role not found'));

      try {
        await roleService.deleteRole(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Role not found');
      }
    });

    test('should prevent deletion of system roles', async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error('Cannot delete system role'));

      try {
        await roleService.deleteRole(1);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('Cannot delete system role'));
      }
    });

    test('should prevent deletion of role with assigned users', async () => {
      const roleId = 5;
      sinon.stub(apiClient, 'delete').rejects(new Error('Cannot delete role: 10 users assigned'));

      try {
        await roleService.deleteRole(roleId);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('Cannot delete role'));
      }
    });

    test('should require director approval to delete role', async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error('Insufficient permissions'));

      try {
        await roleService.deleteRole(3);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Insufficient permissions');
      }
    });
  });

  describe('Permission Management', () => {
    test('should get all available permissions grouped by module', async () => {
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
      sinon.stub(apiClient, 'get').resolves(mockPermissions);

      const result = await roleService.getAllPermissions();

      assert.ok(Object.keys(result).includes('INVOICING'));
      assert.ok(Object.keys(result).includes('PURCHASE'));
      assert.strictEqual(result.INVOICING.length, 3);
      assert.ok(apiClient.get.calledWith('/roles/permissions/all'));
    });

    test('should get user permissions by user ID', async () => {
      const userId = 5;
      const mockPermissions = ['READ_INVOICE', 'CREATE_PO', 'APPROVE_PAYMENT'];
      sinon.stub(apiClient, 'get').resolves(mockPermissions);

      const result = await roleService.getUserPermissions(userId);

      assert.strictEqual(result.length, 3);
      assert.ok(result.includes('APPROVE_PAYMENT'));
      assert.ok(apiClient.get.calledWith(`/roles/users/${userId}/permissions`));
    });

    test('should return empty permissions for user with no permissions', async () => {
      const userId = 999;
      sinon.stub(apiClient, 'get').resolves([]);

      const result = await roleService.getUserPermissions(userId);

      assert.deepStrictEqual(result, []);
    });
  });

  describe('User Role Assignment', () => {
    test('should assign single role to user', async () => {
      const userId = 5;
      const roleIds = [2];
      const mockResponse = { success: true, roles: [{ id: 2, name: 'MANAGER' }] };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.post.calledWith(`/roles/users/${userId}/roles`, {
        role_ids: roleIds,
      }));
    });

    test('should assign multiple roles to user', async () => {
      const userId = 6;
      const roleIds = [2, 3];
      const mockResponse = {
        success: true,
        roles: [
          { id: 2, name: 'MANAGER' },
          { id: 3, name: 'USER' },
        ],
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      assert.strictEqual(result.roles.length, 2);
    });

    test('should replace all user roles', async () => {
      const userId = 7;
      const roleIds = [3];
      const mockResponse = { success: true, roles: [{ id: 3, name: 'USER' }] };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await roleService.replaceUserRoles(userId, roleIds);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.put.calledWith(`/roles/users/${userId}/roles`, {
        role_ids: roleIds,
      }));
    });

    test('should handle user not found on role assignment', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('User not found'));

      try {
        await roleService.assignRoles(999, [1]);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'User not found');
      }
    });

    test('should prevent assignment of invalid role', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Role does not exist'));

      try {
        await roleService.assignRoles(5, [999]);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Role does not exist');
      }
    });

    test('should remove role from user', async () => {
      const userId = 5;
      const roleId = 3;
      const mockResponse = { success: true };
      sinon.stub(apiClient, 'delete').resolves(mockResponse);

      const result = await roleService.removeRole(userId, roleId);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith(`/roles/users/${userId}/roles/${roleId}`));
    });

    test('should prevent removal of all roles from user', async () => {
      const userId = 5;
      const roleId = 1;
      sinon.stub(apiClient, 'delete').rejects(new Error('User must have at least one role'));

      try {
        await roleService.removeRole(userId, roleId);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('must have at least one role'));
      }
    });
  });

  describe('Custom Permission Grants', () => {
    test('should grant custom permission to user', async () => {
      const userId = 5;
      const permissionKey = 'EXPORT_REPORT';
      const reason = 'Quarterly reporting requirement';
      const mockResponse = { success: true, permission: permissionKey };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await roleService.grantCustomPermission(userId, permissionKey, reason);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.post.calledWith(`/roles/users/${userId}/permissions/grant`, {
        permission_key: permissionKey,
        reason,
        expires_at: null,
      }));
    });

    test('should grant permission with expiration', async () => {
      const userId = 5;
      const permissionKey = 'ADMIN_PANEL_ACCESS';
      const reason = 'Temporary admin duties';
      const expiresAt = '2024-12-31T23:59:59Z';
      const mockResponse = { success: true, permission: permissionKey, expiresAt };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await roleService.grantCustomPermission(userId, permissionKey, reason, expiresAt);

      assert.strictEqual(result.expiresAt, expiresAt);
      assert.ok(apiClient.post.calledWith(
        `/roles/users/${userId}/permissions/grant`,
        sinon.match.has('expires_at', expiresAt)
      ));
    });

    test('should revoke custom permission from user', async () => {
      const userId = 5;
      const permissionKey = 'EXPORT_REPORT';
      const mockResponse = { success: true };
      sinon.stub(apiClient, 'delete').resolves(mockResponse);

      const result = await roleService.revokeCustomPermission(userId, permissionKey);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith(`/roles/users/${userId}/permissions/${permissionKey}`, {
        data: { reason: null },
      }));
    });

    test('should revoke permission with reason', async () => {
      const userId = 5;
      const permissionKey = 'ADMIN_PANEL_ACCESS';
      const reason = 'User no longer needs admin access';
      const mockResponse = { success: true };
      sinon.stub(apiClient, 'delete').resolves(mockResponse);

      const result = await roleService.revokeCustomPermission(userId, permissionKey, reason);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith(`/roles/users/${userId}/permissions/${permissionKey}`, {
        data: { reason },
      }));
    });

    test('should handle invalid permission code on grant', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Permission does not exist'));

      try {
        await roleService.grantCustomPermission(5, 'INVALID_PERM', 'Reason');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('Permission does not exist'));
      }
    });

    test('should prevent granting already assigned permission', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('User already has this permission'));

      try {
        await roleService.grantCustomPermission(5, 'READ_INVOICE', 'Reason');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('User already has this permission'));
      }
    });
  });

  describe('Audit Logging', () => {
    test('should get permission audit log for user', async () => {
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
      sinon.stub(apiClient, 'get').resolves(mockAuditLog);

      const result = await roleService.getAuditLog(userId);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].action, 'GRANT');
      assert.strictEqual(result[1].action, 'REVOKE');
      assert.ok(apiClient.get.calledWith(`/roles/users/${userId}/audit-log`, {
        params: { limit: 100 },
      }));
    });

    test('should get audit log with custom limit', async () => {
      const userId = 5;
      const limit = 50;
      const mockAuditLog = [];
      sinon.stub(apiClient, 'get').resolves(mockAuditLog);

      await roleService.getAuditLog(userId, limit);

      assert.ok(apiClient.get.calledWith(`/roles/users/${userId}/audit-log`, {
        params: { limit },
      }));
    });

    test('should return empty audit log when no changes recorded', async () => {
      const userId = 999;
      sinon.stub(apiClient, 'get').resolves([]);

      const result = await roleService.getAuditLog(userId);

      assert.deepStrictEqual(result, []);
    });

    test('should track role assignments in audit log', async () => {
      const userId = 5;
      const mockAuditLog = [
        {
          timestamp: '2024-02-01T09:00:00Z',
          action: 'ASSIGN_ROLE',
          role: 'MANAGER',
          assignedBy: 'director@example.com',
        },
      ];
      sinon.stub(apiClient, 'get').resolves(mockAuditLog);

      const result = await roleService.getAuditLog(userId);

      assert.strictEqual(result[0].action, 'ASSIGN_ROLE');
    });
  });

  describe('Error Handling', () => {
    test('should handle network timeout', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Request timeout'));

      try {
        await roleService.getRoles();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Request timeout');
      }
    });

    test('should handle authorization errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Insufficient permissions'));

      try {
        await roleService.createRole({ name: 'NEW' });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Insufficient permissions');
      }
    });

    test('should handle server errors gracefully', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Server error: 500'));

      try {
        await roleService.getRoles();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error.message.includes('Server error'));
      }
    });

    test('should handle malformed permission data', async () => {
      sinon.stub(apiClient, 'get').resolves(null);

      const result = await roleService.getAllPermissions();

      assert.ok(result !== undefined);
    });
  });

  describe('Multi-Tenancy Compliance', () => {
    test('should enforce company isolation for roles', async () => {
      const mockRoles = [
        { id: 1, name: 'ADMIN', companyId: 1 },
        { id: 2, name: 'MANAGER', companyId: 1 },
      ];
      sinon.stub(apiClient, 'get').resolves(mockRoles);

      const result = await roleService.getRoles();

      assert.strictEqual(result[0].companyId, 1);
    });

    test('should ensure role assignments respect company boundaries', async () => {
      const userId = 5;
      const roleIds = [2];
      const mockResponse = { success: true, roles: [{ id: 2, companyId: 1 }] };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      assert.strictEqual(result.roles[0].companyId, 1);
    });

    test('should isolate permissions by company', async () => {
      const mockPermissions = {
        INVOICING: [{ code: 'READ_INVOICE', companyId: 1 }],
      };
      sinon.stub(apiClient, 'get').resolves(mockPermissions);

      const result = await roleService.getAllPermissions();

      assert.ok(Object.keys(result).includes('INVOICING'));
    });
  });
});
