/**
 * Role Service Unit Tests
 * ✅ Tests role CRUD operations
 * ✅ Tests permission management
 * ✅ Tests role-permission mapping
 * ✅ 100% coverage target for roleService.js
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

import { apiClient } from "../api";
import { roleService } from "../roleService";

describe("roleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRoles", () => {
    test("should fetch all roles", async () => {
      const mockRoles = [
        { id: 1, name: "Admin", description: "Administrator" },
        { id: 2, name: "Manager", description: "Manager" },
        { id: 3, name: "User", description: "Regular User" },
      ];
      apiClient.get.mockResolvedValueOnce(mockRoles);

      const result = await roleService.getRoles();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Admin");
      expect(apiClient.get).toHaveBeenCalledWith("/roles");
    });

    test("should handle empty roles list", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await roleService.getRoles();

      expect(result).toEqual([]);
    });
  });

  describe("getAvailableRoles", () => {
    test("should fetch available roles for dropdowns", async () => {
      const mockRoles = [
        { id: 1, name: "Admin" },
        { id: 2, name: "Manager" },
      ];
      apiClient.get.mockResolvedValueOnce(mockRoles);

      const result = await roleService.getAvailableRoles();

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith("/roles/list/available");
    });
  });

  describe("getRole", () => {
    test("should fetch single role with permissions", async () => {
      const mockRole = {
        id: 1,
        name: "Admin",
        description: "Administrator role",
        permissions: ["users.create", "users.edit", "users.delete"],
      };
      apiClient.get.mockResolvedValueOnce(mockRole);

      const result = await roleService.getRole(1);

      expect(result.name).toBe("Admin");
      expect(result.permissions).toHaveLength(3);
      expect(apiClient.get).toHaveBeenCalledWith("/roles/1");
    });

    test("should handle role not found", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await roleService.getRole(999);

      expect(result).toBeNull();
    });
  });

  describe("createRole", () => {
    test("should create new role", async () => {
      const roleData = {
        name: "Accountant",
        description: "Financial accounting role",
        permissions: ["reports.view", "payments.approve"],
      };
      const mockResponse = { id: 4, ...roleData };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.createRole(roleData);

      expect(result.id).toBe(4);
      expect(result.name).toBe("Accountant");
      expect(apiClient.post).toHaveBeenCalledWith("/roles", roleData);
    });

    test("should reject duplicate role name", async () => {
      const roleData = { name: "Admin", description: "Duplicate" };
      apiClient.post.mockRejectedValueOnce(new Error("Role already exists"));

      await expect(roleService.createRole(roleData)).rejects.toThrow("Role already exists");
    });
  });

  describe("updateRole", () => {
    test("should update existing role", async () => {
      const updates = {
        name: "Senior Manager",
        permissions: ["reports.create", "users.manage"],
      };
      const mockResponse = { id: 2, ...updates };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await roleService.updateRole(2, updates);

      expect(result.name).toBe("Senior Manager");
      expect(apiClient.put).toHaveBeenCalledWith("/roles/2", updates);
    });

    test("should handle update not found", async () => {
      apiClient.put.mockRejectedValueOnce(new Error("Not found"));

      await expect(roleService.updateRole(999, { name: "Unknown" })).rejects.toThrow("Not found");
    });
  });

  describe("deleteRole", () => {
    test("should delete role", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await roleService.deleteRole(3);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/roles/3");
    });

    test("should handle delete not found", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Not found"));

      await expect(roleService.deleteRole(999)).rejects.toThrow("Not found");
    });
  });

  describe("getAllPermissions", () => {
    test("should fetch all permissions grouped by module", async () => {
      const mockPermissions = {
        users: [
          { id: "users.create", name: "Create Users", module: "users" },
          { id: "users.edit", name: "Edit Users", module: "users" },
        ],
        reports: [
          { id: "reports.view", name: "View Reports", module: "reports" },
          { id: "reports.create", name: "Create Reports", module: "reports" },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockPermissions);

      const result = await roleService.getAllPermissions();

      expect(result.users).toHaveLength(2);
      expect(result.reports).toHaveLength(2);
    });
  });

  describe("getUserPermissions", () => {
    test("should fetch permissions for a user", async () => {
      const mockPermissions = [
        { id: "users.create", name: "Create Users" },
        { id: "users.view", name: "View Users" },
      ];
      apiClient.get.mockResolvedValueOnce(mockPermissions);

      await roleService.getUserPermissions(1);

      expect(apiClient.get).toHaveBeenCalledWith("/users/1/permissions");
    });
  });

  describe("assignRoles", () => {
    test("should assign roles to a user", async () => {
      const roleIds = [1, 2];
      const mockResponse = { success: true, rolesAssigned: 2 };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.assignRoles(5, roleIds);

      expect(result.rolesAssigned).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith("/users/5/roles/assign", {
        role_ids: roleIds,
      });
    });
  });

  describe("replaceUserRoles", () => {
    test("should replace all user roles", async () => {
      const roleIds = [1, 3];
      const mockResponse = { success: true };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      await roleService.replaceUserRoles(5, roleIds);

      expect(apiClient.put).toHaveBeenCalledWith("/users/5/roles", {
        role_ids: roleIds,
      });
    });
  });

  describe("removeRole", () => {
    test("should remove a specific role", async () => {
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await roleService.removeRole(1, 2);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/users/1/roles/2");
    });
  });

  describe("grantCustomPermission", () => {
    test("should grant custom permission to user", async () => {
      const mockResponse = { success: true };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await roleService.grantCustomPermission(1, "reports.export");

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/users/1/permissions/grant", {
        permission: "reports.export",
      });
    });
  });

  describe("revokeCustomPermission", () => {
    test("should revoke custom permission from user", async () => {
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      await roleService.revokeCustomPermission(1, "reports.export");

      expect(apiClient.delete).toHaveBeenCalledWith("/users/1/permissions/revoke/reports.export");
    });
  });

  describe("getAuditLog", () => {
    test("should fetch audit log for user role changes", async () => {
      const mockLog = [{ timestamp: "2024-02-02T10:00:00Z", action: "role_assigned", roleId: 1 }];
      apiClient.get.mockResolvedValueOnce(mockLog);

      await roleService.getAuditLog(1, 50);

      expect(apiClient.get).toHaveBeenCalledWith("/users/1/roles/audit", {
        limit: 50,
      });
    });
  });
});
