/**
 * Role Service Unit Tests (Node Native Test Runner)
 * Tests role management and permissions
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { roleService } from '../roleService.js';

describe('roleService', () => {
  beforeEach(() => {
    // Stub all methods at the start
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getRoles', () => {
    test('should fetch all roles', async () => {
      sinon.stub(apiClient, 'get').resolves([
        { id: 1, name: 'Admin', permissions: [] },
        { id: 2, name: 'Manager', permissions: [] },
      ]);

      const result = await roleService.getRoles();

      assert.ok(Array.isArray(result));
      assert.ok(apiClient.get.calledWith('/roles'));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('API Error'));

      try {
        await roleService.getRoles();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'API Error');
      }
    });
  });

  describe('getAvailableRoles', () => {
    test('should fetch available roles for dropdowns', async () => {
      sinon.stub(apiClient, 'get').resolves([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Manager' },
      ]);

      const result = await roleService.getAvailableRoles();

      assert.ok(Array.isArray(result));
      assert.ok(apiClient.get.calledWith('/roles/list/available'));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('API Error'));

      try {
        await roleService.getAvailableRoles();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('getRole', () => {
    test('should fetch role by ID', async () => {
      const mockRole = { id: 1, name: 'Admin', permissions: ['read', 'write'] };

      sinon.stub(apiClient, 'get').resolves(mockRole);

      const result = await roleService.getRole(1);

      assert.deepStrictEqual(result, mockRole);
      assert.ok(apiClient.get.calledWith('/roles/1'));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Not found'));

      try {
        await roleService.getRole(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('createRole', () => {
    test('should create new role', async () => {
      const roleData = { name: 'Viewer', permissions: ['read'] };

      sinon.stub(apiClient, 'post').resolves({
        id: 3,
        ...roleData,
      });

      const result = await roleService.createRole(roleData);

      assert.ok(result.id);
      assert.ok(apiClient.post.calledWith('/roles', roleData));
    });

    test('should handle error', async () => {
      const roleData = { name: 'InvalidRole' };

      sinon.stub(apiClient, 'post').rejects(new Error('Creation failed'));

      try {
        await roleService.createRole(roleData);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('updateRole', () => {
    test('should update existing role', async () => {
      const roleData = { name: 'Editor', permissions: ['read', 'write', 'delete'] };

      sinon.stub(apiClient, 'put').resolves({
        id: 1,
        ...roleData,
      });

      const result = await roleService.updateRole(1, roleData);

      assert.ok(result.id);
      assert.ok(apiClient.put.calledWith('/roles/1', roleData));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'put').rejects(new Error('Update failed'));

      try {
        await roleService.updateRole(999, {});
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('deleteRole', () => {
    test('should delete role', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await roleService.deleteRole(1);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith('/roles/1'));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error('Delete failed'));

      try {
        await roleService.deleteRole(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('getAllPermissions', () => {
    test('should fetch all permissions grouped by module', async () => {
      const mockPermissions = {
        invoices: ['read', 'create', 'edit', 'delete'],
        payments: ['read', 'process'],
      };

      sinon.stub(apiClient, 'get').resolves(mockPermissions);

      const result = await roleService.getAllPermissions();

      assert.deepStrictEqual(result, mockPermissions);
      assert.ok(apiClient.get.calledWith('/roles/permissions/all'));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('API Error'));

      try {
        await roleService.getAllPermissions();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('getUserPermissions', () => {
    test('should fetch user permissions', async () => {
      const mockPermissions = {
        invoices: ['read', 'create'],
        payments: ['read'],
      };

      sinon.stub(apiClient, 'get').resolves(mockPermissions);

      const result = await roleService.getUserPermissions(1);

      assert.deepStrictEqual(result, mockPermissions);
      assert.ok(apiClient.get.calledWith('/roles/users/1/permissions'));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Not found'));

      try {
        await roleService.getUserPermissions(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('assignRoles', () => {
    test('should assign roles to user', async () => {
      sinon.stub(apiClient, 'post').resolves({ success: true });

      const result = await roleService.assignRoles(1, [1, 2]);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.post.calledWith('/roles/users/1/roles', {
        role_ids: [1, 2],
      }));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Assignment failed'));

      try {
        await roleService.assignRoles(999, [1]);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('replaceUserRoles', () => {
    test('should replace all user roles', async () => {
      sinon.stub(apiClient, 'put').resolves({ success: true });

      const result = await roleService.replaceUserRoles(1, [2, 3]);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.put.calledWith('/roles/users/1/roles', {
        role_ids: [2, 3],
      }));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'put').rejects(new Error('Replace failed'));

      try {
        await roleService.replaceUserRoles(999, []);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('removeRole', () => {
    test('should remove role from user', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await roleService.removeRole(1, 2);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith('/roles/users/1/roles/2'));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error('Remove failed'));

      try {
        await roleService.removeRole(999, 1);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('grantCustomPermission', () => {
    test('should grant custom permission to user', async () => {
      sinon.stub(apiClient, 'post').resolves({ success: true });

      const result = await roleService.grantCustomPermission(1, 'invoices.export', 'Need reports', '2024-12-31');

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.post.calledWith('/roles/users/1/permissions/grant', {
        permission_key: 'invoices.export',
        reason: 'Need reports',
        expires_at: '2024-12-31',
      }));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Grant failed'));

      try {
        await roleService.grantCustomPermission(999, 'test', 'reason');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('revokeCustomPermission', () => {
    test('should revoke custom permission from user', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await roleService.revokeCustomPermission(1, 'invoices.export', 'No longer needed');

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith('/roles/users/1/permissions/invoices.export', {
        data: { reason: 'No longer needed' },
      }));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'delete').rejects(new Error('Revoke failed'));

      try {
        await roleService.revokeCustomPermission(999, 'test');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('getAuditLog', () => {
    test('should fetch audit log for user', async () => {
      const mockLog = [{ action: 'role_assigned', roleId: 1, timestamp: '2024-01-15' }];

      sinon.stub(apiClient, 'get').resolves(mockLog);

      const result = await roleService.getAuditLog(1, 50);

      assert.ok(Array.isArray(result));
      assert.ok(apiClient.get.calledWith('/roles/users/1/audit-log', {
        params: { limit: 50 },
      }));
    });

    test('should handle error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Audit log error'));

      try {
        await roleService.getAuditLog(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });
});
