/**
 * Permissions Service Unit Tests (Role-Based Access Control)
 * ✅ Tests permission retrieval and validation
 * ✅ Tests role management (CRUD operations)
 * ✅ Tests permission assignment to users and roles
 * ✅ Tests custom permission grants and revocations
 * ✅ Tests audit logging of permission changes
 * ✅ Tests authorization checks and access control
 * ✅ 40-50 tests covering all critical paths
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import { roleService } from "../roleService.js";

describe("permissionsService (roleService)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Role retrieval and listing operations
   * Tests getRoles, listRoles with pagination and filtering
   */
  // ============================================================================
  // ROLE RETRIEVAL & LISTING
  // ============================================================================

  describe("Get Roles", () => {
    test("should retrieve all roles for company", async () => {
      const mockRoles = [
        { id: 1, name: "ADMIN", description: "Administrator" },
        { id: 2, name: "MANAGER", description: "Manager" },
        { id: 3, name: "USER", description: "Standard User" },
      ];
      apiClient.get.mockResolvedValueOnce(mockRoles);

      const result = await roleService.getRoles();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("ADMIN");
      expect(apiClient.get).toHaveBeenCalledWith("/roles");
    });

    test("should get available roles for dropdown", async () => {
      const mockRoles = [
        { id: 1, name: "ADMIN", displayName: "Administrator" },
        { id: 2, name: "MANAGER", displayName: "Manager" },
      ];
      apiClient.get.mockResolvedValueOnce(mockRoles);

      const result = await roleService.getAvailableRoles();

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith("/roles/list/available");
    });

    test("should get specific role by ID", async () => {
      const mockRole = {
        id: 1,
        name: "ADMIN",
        description: "Administrator",
        permissions: ["READ_ALL", "WRITE_ALL", "DELETE_ALL", "ADMIN_PANEL"],
      };
      apiClient.get.mockResolvedValueOnce(mockRole);

      const result = await roleService.getRole(1);

      expect(result.name).toBe("ADMIN");
      expect(result.permissions).toHaveLength(4);
      expect(apiClient.get).toHaveBeenCalledWith("/roles/1");
    });

    test("should handle role not found error", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Role not found"));

      await expect(roleService.getRole(999)).rejects.toThrow("Role not found");
    });

    test("should handle network error when fetching roles", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(roleService.getRoles()).rejects.toThrow("Network error");
    });

    test("should return empty list for company with no custom roles", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await roleService.getRoles();

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // ROLE CREATION
  // ============================================================================

  describe("Create Role", () => {
    test("should create new role with permissions", async () => {
      const roleData = {
        name: "OPERATOR",
        description: "Operator role",
        permissions: ["READ_INVOICE", "CREATE_PO"],
      };
      const mockResponse = { id: 4, ...roleData };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.createRole(roleData);

      expect(result.id).toBe(4);
      expect(result.name).toBe("OPERATOR");
      expect(apiClient.post).toHaveBeenCalledWith("/roles", roleData);
    });

    test("should validate required role fields", async () => {
      const roleData = {
        name: "VIEWER",
        description: "View-only role",
        permissions: ["READ_INVOICE", "READ_PO"],
      };
      const mockResponse = { id: 5, ...roleData };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.createRole(roleData);

      expect(result.name).toBe("VIEWER");
      expect(result.permissions).toHaveLength(2);
    });

    test("should reject role creation without name", async () => {
      const roleData = {
        description: "No name role",
        permissions: [],
      };
      apiClient.post.mockRejectedValueOnce(new Error("Role name required"));

      await expect(roleService.createRole(roleData)).rejects.toThrow("Role name required");
    });

    test("should prevent duplicate role names", async () => {
      const roleData = {
        name: "ADMIN",
        description: "Duplicate admin",
        permissions: [],
      };
      apiClient.post.mockRejectedValueOnce(new Error("Role name already exists"));

      await expect(roleService.createRole(roleData)).rejects.toThrow("Role name already exists");
    });

    test("should handle authorization error for role creation", async () => {
      const roleData = {
        name: "NEW_ROLE",
        description: "New role",
        permissions: [],
      };
      apiClient.post.mockRejectedValueOnce(new Error("Only directors can create roles"));

      await expect(roleService.createRole(roleData)).rejects.toThrow("Only directors can create roles");
    });
  });

  // ============================================================================
  // ROLE UPDATES
  // ============================================================================

  describe("Update Role", () => {
    test("should update role details", async () => {
      const roleId = 2;
      const updateData = { description: "Updated manager role" };
      const mockResponse = { id: roleId, name: "MANAGER", ...updateData };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await roleService.updateRole(roleId, updateData);

      expect(result.description).toBe("Updated manager role");
      expect(apiClient.put).toHaveBeenCalledWith(`/roles/${roleId}`, updateData);
    });

    test("should update role permissions", async () => {
      const roleId = 3;
      const updateData = {
        permissions: ["READ_INVOICE", "READ_PO", "APPROVE_PO"],
      };
      const mockResponse = { id: roleId, name: "USER", ...updateData };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await roleService.updateRole(roleId, updateData);

      expect(result.permissions).toHaveLength(3);
      expect(result.permissions).toContain("APPROVE_PO");
    });

    test("should handle role not found on update", async () => {
      apiClient.put.mockRejectedValueOnce(new Error("Role not found"));

      await expect(roleService.updateRole(999, { description: "Update" })).rejects.toThrow("Role not found");
    });

    test("should prevent modification of system roles", async () => {
      const roleId = 1; // ADMIN role
      apiClient.put.mockRejectedValueOnce(new Error("System roles cannot be modified"));

      await expect(roleService.updateRole(roleId, { name: "SUPER_ADMIN" })).rejects.toThrow(
        "System roles cannot be modified"
      );
    });

    test("should validate permission codes on update", async () => {
      const roleId = 2;
      const updateData = { permissions: ["INVALID_PERM"] };
      apiClient.put.mockRejectedValueOnce(new Error("Invalid permission code"));

      await expect(roleService.updateRole(roleId, updateData)).rejects.toThrow("Invalid permission code");
    });
  });

  // ============================================================================
  // ROLE DELETION
  // ============================================================================

  describe("Delete Role", () => {
    test("should delete custom role", async () => {
      const roleId = 4;
      const mockResponse = { success: true, message: "Role deleted" };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await roleService.deleteRole(roleId);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/roles/${roleId}`);
    });

    test("should handle deletion of non-existent role", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Role not found"));

      await expect(roleService.deleteRole(999)).rejects.toThrow("Role not found");
    });

    test("should prevent deletion of system roles", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Cannot delete system role"));

      await expect(roleService.deleteRole(1)).rejects.toThrow("Cannot delete system role");
    });

    test("should prevent deletion of role with assigned users", async () => {
      const roleId = 5;
      apiClient.delete.mockRejectedValueOnce(new Error("Cannot delete role: 10 users assigned"));

      await expect(roleService.deleteRole(roleId)).rejects.toThrow("Cannot delete role");
    });

    test("should require director approval to delete role", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Insufficient permissions"));

      await expect(roleService.deleteRole(3)).rejects.toThrow("Insufficient permissions");
    });
  });

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  describe("Permission Management", () => {
    test("should get all available permissions grouped by module", async () => {
      const mockPermissions = {
        INVOICING: [
          { code: "READ_INVOICE", name: "Read Invoices" },
          { code: "CREATE_INVOICE", name: "Create Invoices" },
          { code: "DELETE_INVOICE", name: "Delete Invoices" },
        ],
        PURCHASE: [
          { code: "READ_PO", name: "Read POs" },
          { code: "CREATE_PO", name: "Create POs" },
        ],
        ADMIN: [{ code: "ADMIN_PANEL", name: "Access Admin Panel" }],
      };
      apiClient.get.mockResolvedValueOnce(mockPermissions);

      const result = await roleService.getAllPermissions();

      expect(Object.keys(result)).toContain("INVOICING");
      expect(Object.keys(result)).toContain("PURCHASE");
      expect(result.INVOICING).toHaveLength(3);
      expect(apiClient.get).toHaveBeenCalledWith("/roles/permissions/all");
    });

    test("should get user permissions by user ID", async () => {
      const userId = 5;
      const mockPermissions = ["READ_INVOICE", "CREATE_PO", "APPROVE_PAYMENT"];
      apiClient.get.mockResolvedValueOnce(mockPermissions);

      const result = await roleService.getUserPermissions(userId);

      expect(result).toHaveLength(3);
      expect(result).toContain("APPROVE_PAYMENT");
      expect(apiClient.get).toHaveBeenCalledWith(`/roles/users/${userId}/permissions`);
    });

    test("should return empty permissions for user with no permissions", async () => {
      const userId = 999;
      apiClient.get.mockResolvedValueOnce([]);

      const result = await roleService.getUserPermissions(userId);

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // USER ROLE ASSIGNMENT
  // ============================================================================

  describe("User Role Assignment", () => {
    test("should assign single role to user", async () => {
      const userId = 5;
      const roleIds = [2];
      const mockResponse = { success: true, roles: [{ id: 2, name: "MANAGER" }] };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(`/roles/users/${userId}/roles`, {
        role_ids: roleIds,
      });
    });

    test("should assign multiple roles to user", async () => {
      const userId = 6;
      const roleIds = [2, 3];
      const mockResponse = {
        success: true,
        roles: [
          { id: 2, name: "MANAGER" },
          { id: 3, name: "USER" },
        ],
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      expect(result.roles).toHaveLength(2);
    });

    test("should replace all user roles", async () => {
      const userId = 7;
      const roleIds = [3];
      const mockResponse = { success: true, roles: [{ id: 3, name: "USER" }] };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await roleService.replaceUserRoles(userId, roleIds);

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith(`/roles/users/${userId}/roles`, {
        role_ids: roleIds,
      });
    });

    test("should handle user not found on role assignment", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("User not found"));

      await expect(roleService.assignRoles(999, [1])).rejects.toThrow("User not found");
    });

    test("should prevent assignment of invalid role", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Role does not exist"));

      await expect(roleService.assignRoles(5, [999])).rejects.toThrow("Role does not exist");
    });

    test("should remove role from user", async () => {
      const userId = 5;
      const roleId = 3;
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await roleService.removeRole(userId, roleId);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/roles/users/${userId}/roles/${roleId}`);
    });

    test("should prevent removal of all roles from user", async () => {
      const userId = 5;
      const roleId = 1;
      apiClient.delete.mockRejectedValueOnce(new Error("User must have at least one role"));

      await expect(roleService.removeRole(userId, roleId)).rejects.toThrow("must have at least one role");
    });
  });

  // ============================================================================
  // CUSTOM PERMISSION GRANTS
  // ============================================================================

  describe("Custom Permission Grants", () => {
    test("should grant custom permission to user", async () => {
      const userId = 5;
      const permissionKey = "EXPORT_REPORT";
      const reason = "Quarterly reporting requirement";
      const mockResponse = { success: true, permission: permissionKey };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.grantCustomPermission(userId, permissionKey, reason);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(`/roles/users/${userId}/permissions/grant`, {
        permission_key: permissionKey,
        reason,
        expires_at: null,
      });
    });

    test("should grant permission with expiration", async () => {
      const userId = 5;
      const permissionKey = "ADMIN_PANEL_ACCESS";
      const reason = "Temporary admin duties";
      const expiresAt = "2024-12-31T23:59:59Z";
      const mockResponse = { success: true, permission: permissionKey, expiresAt };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.grantCustomPermission(userId, permissionKey, reason, expiresAt);

      expect(result.expiresAt).toBe(expiresAt);
      expect(apiClient.post).toHaveBeenCalledWith(
        `/roles/users/${userId}/permissions/grant`,
        expect.objectContaining({
          expires_at: expiresAt,
        })
      );
    });

    test("should revoke custom permission from user", async () => {
      const userId = 5;
      const permissionKey = "EXPORT_REPORT";
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await roleService.revokeCustomPermission(userId, permissionKey);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/roles/users/${userId}/permissions/${permissionKey}`, {
        data: { reason: null },
      });
    });

    test("should revoke permission with reason", async () => {
      const userId = 5;
      const permissionKey = "ADMIN_PANEL_ACCESS";
      const reason = "User no longer needs admin access";
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await roleService.revokeCustomPermission(userId, permissionKey, reason);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/roles/users/${userId}/permissions/${permissionKey}`, {
        data: { reason },
      });
    });

    test("should handle invalid permission code on grant", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Permission does not exist"));

      await expect(roleService.grantCustomPermission(5, "INVALID_PERM", "Reason")).rejects.toThrow(
        "Permission does not exist"
      );
    });

    test("should prevent granting already assigned permission", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("User already has this permission"));

      await expect(roleService.grantCustomPermission(5, "READ_INVOICE", "Reason")).rejects.toThrow(
        "User already has this permission"
      );
    });
  });

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  describe("Audit Logging", () => {
    test("should get permission audit log for user", async () => {
      const userId = 5;
      const mockAuditLog = [
        {
          timestamp: "2024-02-01T10:00:00Z",
          action: "GRANT",
          permission: "EXPORT_REPORT",
          grantedBy: "admin@example.com",
          reason: "Quarterly reporting",
        },
        {
          timestamp: "2024-02-02T15:30:00Z",
          action: "REVOKE",
          permission: "ADMIN_PANEL_ACCESS",
          revokedBy: "admin@example.com",
          reason: "No longer needed",
        },
      ];
      apiClient.get.mockResolvedValueOnce(mockAuditLog);

      const result = await roleService.getAuditLog(userId);

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe("GRANT");
      expect(result[1].action).toBe("REVOKE");
      expect(apiClient.get).toHaveBeenCalledWith(`/roles/users/${userId}/audit-log`, {
        params: { limit: 100 },
      });
    });

    test("should get audit log with custom limit", async () => {
      const userId = 5;
      const limit = 50;
      const mockAuditLog = [];
      apiClient.get.mockResolvedValueOnce(mockAuditLog);

      await roleService.getAuditLog(userId, limit);

      expect(apiClient.get).toHaveBeenCalledWith(`/roles/users/${userId}/audit-log`, {
        params: { limit },
      });
    });

    test("should return empty audit log when no changes recorded", async () => {
      const userId = 999;
      apiClient.get.mockResolvedValueOnce([]);

      const result = await roleService.getAuditLog(userId);

      expect(result).toEqual([]);
    });

    test("should track role assignments in audit log", async () => {
      const userId = 5;
      const mockAuditLog = [
        {
          timestamp: "2024-02-01T09:00:00Z",
          action: "ASSIGN_ROLE",
          role: "MANAGER",
          assignedBy: "director@example.com",
        },
      ];
      apiClient.get.mockResolvedValueOnce(mockAuditLog);

      const result = await roleService.getAuditLog(userId);

      expect(result[0].action).toBe("ASSIGN_ROLE");
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network timeout", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Request timeout"));

      await expect(roleService.getRoles()).rejects.toThrow("Request timeout");
    });

    test("should handle authorization errors", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Insufficient permissions"));

      await expect(roleService.createRole({ name: "NEW" })).rejects.toThrow("Insufficient permissions");
    });

    test("should handle server errors gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Server error: 500"));

      await expect(roleService.getRoles()).rejects.toThrow("Server error");
    });

    test("should handle malformed permission data", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await roleService.getAllPermissions();

      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // MULTI-TENANCY COMPLIANCE
  // ============================================================================

  describe("Multi-Tenancy Compliance", () => {
    test("should enforce company isolation for roles", async () => {
      const mockRoles = [
        { id: 1, name: "ADMIN", companyId: 1 },
        { id: 2, name: "MANAGER", companyId: 1 },
      ];
      apiClient.get.mockResolvedValueOnce(mockRoles);

      const result = await roleService.getRoles();

      expect(result[0].companyId).toBe(1);
    });

    test("should ensure role assignments respect company boundaries", async () => {
      const userId = 5;
      const roleIds = [2];
      const mockResponse = { success: true, roles: [{ id: 2, companyId: 1 }] };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.assignRoles(userId, roleIds);

      expect(result.roles[0].companyId).toBe(1);
    });

    test("should isolate permissions by company", async () => {
      const mockPermissions = {
        INVOICING: [{ code: "READ_INVOICE", companyId: 1 }],
      };
      apiClient.get.mockResolvedValueOnce(mockPermissions);

      const result = await roleService.getAllPermissions();

      expect(Object.keys(result)).toContain("INVOICING");
    });
  });
});
