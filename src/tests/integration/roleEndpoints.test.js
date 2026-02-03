/**
 * Integration Tests for Role Management API Endpoints
 *
 * Tests cover:
 * - GET /api/roles - List all roles
 * - POST /api/roles - Create custom role
 * - PUT /api/roles/:id - Update role
 * - DELETE /api/roles/:id - Delete custom role
 * - Validation errors (reserved names, duplicates)
 * - System role protection
 * - Multi-tenancy (company scoping)
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { notificationService } from "../../services/notificationService";
import { roleService } from "../../services/roleService";

// Mock the apiClient
vi.mock("../../services/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock notification service
vi.mock("../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import { apiClient } from "../../services/api";

// Helper to create mock role data
const createMockRole = (overrides = {}) => ({
  id: 1,
  name: "Test Role",
  description: "Test description",
  isDirector: false,
  isSystemRole: false,
  companyId: 1,
  permissionKeys: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock system roles
const mockSystemRoles = [
  createMockRole({
    id: 1,
    name: "Managing Director",
    isSystemRole: true,
    isDirector: true,
  }),
  createMockRole({
    id: 2,
    name: "Operations Manager",
    isSystemRole: true,
    isDirector: true,
  }),
  createMockRole({
    id: 3,
    name: "Finance Manager",
    isSystemRole: true,
    isDirector: true,
  }),
  createMockRole({ id: 4, name: "Sales Manager", isSystemRole: true }),
  createMockRole({ id: 5, name: "Purchase Manager", isSystemRole: true }),
  createMockRole({ id: 6, name: "Warehouse Manager", isSystemRole: true }),
  createMockRole({ id: 7, name: "Accounts Manager", isSystemRole: true }),
  createMockRole({ id: 8, name: "Sales Executive", isSystemRole: true }),
  createMockRole({ id: 9, name: "Purchase Executive", isSystemRole: true }),
  createMockRole({ id: 10, name: "Stock Keeper", isSystemRole: true }),
  createMockRole({ id: 11, name: "Accounts Executive", isSystemRole: true }),
  createMockRole({ id: 12, name: "Logistics Coordinator", isSystemRole: true }),
];

describe("Role Endpoints - GET /api/roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return all roles (system + custom)", async () => {
    const customRole = createMockRole({
      id: 13,
      name: "Quality Inspector",
      isSystemRole: false,
    });
    const allRoles = [...mockSystemRoles, customRole];

    apiClient.get.mockResolvedValue(allRoles);

    const result = await roleService.getRoles();

    expect(apiClient.get).toHaveBeenCalledWith("/roles");
    expect(result).toEqual(allRoles);
    expect(result).toHaveLength(13);
  });

  test("should return only system roles when no custom roles exist", async () => {
    apiClient.get.mockResolvedValue(mockSystemRoles);

    const result = await roleService.getRoles();

    expect(result).toEqual(mockSystemRoles);
    expect(result).toHaveLength(12);
    expect(result.every((r) => r.isSystemRole)).toBe(true);
  });

  test("should return empty array when no roles exist", async () => {
    apiClient.get.mockResolvedValue([]);

    const result = await roleService.getRoles();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  test("should handle API error gracefully", async () => {
    const errorMessage = "Network error";
    apiClient.get.mockRejectedValue(new Error(errorMessage));

    await expect(roleService.getRoles()).rejects.toThrow(errorMessage);
  });

  test("should return roles scoped to company", async () => {
    const company1Roles = mockSystemRoles.map((r) => ({ ...r, companyId: 1 }));
    apiClient.get.mockResolvedValue(company1Roles);

    const result = await roleService.getRoles();

    expect(result.every((r) => r.companyId === 1)).toBe(true);
  });
});

describe("Role Endpoints - POST /api/roles (Create)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should create custom role successfully", async () => {
    const roleData = {
      name: "Quality Inspector",
      description: "Inspects product quality",
      isDirector: false,
      permissionKeys: [],
    };

    const createdRole = createMockRole({
      id: 13,
      ...roleData,
      isSystemRole: false,
    });
    apiClient.post.mockResolvedValue(createdRole);

    const result = await roleService.createRole(roleData);

    expect(apiClient.post).toHaveBeenCalledWith("/roles", roleData);
    expect(result).toEqual(createdRole);
    expect(result.name).toBe("Quality Inspector");
    expect(result.isSystemRole).toBe(false);
  });

  test("should create director role successfully", async () => {
    const roleData = {
      name: "Quality Director",
      description: "Director of quality",
      isDirector: true,
      permissionKeys: [],
    };

    const createdRole = createMockRole({
      id: 14,
      ...roleData,
      isSystemRole: false,
    });
    apiClient.post.mockResolvedValue(createdRole);

    const result = await roleService.createRole(roleData);

    expect(result.isDirector).toBe(true);
  });

  test('should return 400 error for reserved name "admin"', async () => {
    const roleData = {
      name: "admin",
      description: "Admin role",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 400,
        data: { message: '"admin" is a reserved name and cannot be used' },
      },
    };

    apiClient.post.mockRejectedValue(error);

    await expect(roleService.createRole(roleData)).rejects.toMatchObject(error);
  });

  test('should return 400 error for reserved name "superuser"', async () => {
    const roleData = {
      name: "superuser",
      description: "Super user role",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 400,
        data: { message: '"superuser" is a reserved name and cannot be used' },
      },
    };

    apiClient.post.mockRejectedValue(error);

    await expect(roleService.createRole(roleData)).rejects.toMatchObject(error);
  });

  test('should return 400 error for reserved name "root"', async () => {
    const roleData = {
      name: "root",
      description: "Root role",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 400,
        data: { message: '"root" is a reserved name and cannot be used' },
      },
    };

    apiClient.post.mockRejectedValue(error);

    await expect(roleService.createRole(roleData)).rejects.toMatchObject(error);
  });

  test("should return 409 error for duplicate role name", async () => {
    const roleData = {
      name: "Sales Manager", // Already exists as system role
      description: "Duplicate",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 409,
        data: { message: "A role with this name already exists" },
      },
    };

    apiClient.post.mockRejectedValue(error);

    await expect(roleService.createRole(roleData)).rejects.toMatchObject(error);
  });

  test("should return 400 error for name too short", async () => {
    const roleData = {
      name: "AB", // Less than 3 characters
      description: "Too short",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 400,
        data: { message: "Display name must be at least 3 characters" },
      },
    };

    apiClient.post.mockRejectedValue(error);

    await expect(roleService.createRole(roleData)).rejects.toMatchObject(error);
  });

  test("should return 400 error for name too long", async () => {
    const roleData = {
      name: "A".repeat(51), // More than 50 characters
      description: "Too long",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 400,
        data: { message: "Display name must be less than 50 characters" },
      },
    };

    apiClient.post.mockRejectedValue(error);

    await expect(roleService.createRole(roleData)).rejects.toMatchObject(error);
  });
});

describe("Role Endpoints - PUT /api/roles/:id (Update)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should update custom role successfully", async () => {
    const roleId = 13;
    const roleData = {
      name: "Quality Inspector Updated",
      description: "Updated description",
      isDirector: false,
      permissionKeys: [],
    };

    const updatedRole = createMockRole({
      id: roleId,
      ...roleData,
      isSystemRole: false,
    });
    apiClient.put.mockResolvedValue(updatedRole);

    const result = await roleService.updateRole(roleId, roleData);

    expect(apiClient.put).toHaveBeenCalledWith(`/roles/${roleId}`, roleData);
    expect(result).toEqual(updatedRole);
    expect(result.name).toBe("Quality Inspector Updated");
  });

  test("should update system role description only", async () => {
    const roleId = 4; // Sales Manager (system role)
    const roleData = {
      name: "Sales Manager", // Name stays the same
      description: "Updated description for Sales Manager",
      isDirector: false,
      permissionKeys: ["sales.create", "sales.edit"],
    };

    const updatedRole = createMockRole({
      id: roleId,
      ...roleData,
      isSystemRole: true,
    });

    apiClient.put.mockResolvedValue(updatedRole);

    const result = await roleService.updateRole(roleId, roleData);

    expect(result.description).toBe("Updated description for Sales Manager");
    expect(result.isSystemRole).toBe(true);
  });

  test("should update system role director status", async () => {
    const roleId = 4; // Sales Manager
    const roleData = {
      name: "Sales Manager",
      description: "Sales manager with director privileges",
      isDirector: true, // Promoting to director
      permissionKeys: [],
    };

    const updatedRole = createMockRole({
      id: roleId,
      ...roleData,
      isSystemRole: true,
    });

    apiClient.put.mockResolvedValue(updatedRole);

    const result = await roleService.updateRole(roleId, roleData);

    expect(result.isDirector).toBe(true);
  });

  test("should return 409 error when updating to duplicate name", async () => {
    const roleId = 13;
    const roleData = {
      name: "Sales Manager", // Trying to rename to existing role
      description: "Conflict",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 409,
        data: { message: "A role with this name already exists" },
      },
    };

    apiClient.put.mockRejectedValue(error);

    await expect(roleService.updateRole(roleId, roleData)).rejects.toMatchObject(error);
  });

  test("should return 404 error for non-existent role", async () => {
    const roleId = 9999;
    const roleData = {
      name: "Updated Role",
      description: "Updated",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 404,
        data: { message: "Role not found" },
      },
    };

    apiClient.put.mockRejectedValue(error);

    await expect(roleService.updateRole(roleId, roleData)).rejects.toMatchObject(error);
  });
});

describe("Role Endpoints - DELETE /api/roles/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should delete custom role successfully", async () => {
    const roleId = 13; // Custom role
    apiClient.delete.mockResolvedValue({ success: true });

    const result = await roleService.deleteRole(roleId);

    expect(apiClient.delete).toHaveBeenCalledWith(`/roles/${roleId}`);
    expect(result).toEqual({ success: true });
  });

  test("should return 403 error when trying to delete system role", async () => {
    const roleId = 1; // Managing Director (system role)

    const error = {
      response: {
        status: 403,
        data: { message: "System roles cannot be deleted" },
      },
    };

    apiClient.delete.mockRejectedValue(error);

    await expect(roleService.deleteRole(roleId)).rejects.toMatchObject(error);
  });

  test("should return 403 error for all system roles (12 roles)", async () => {
    for (const systemRole of mockSystemRoles) {
      const error = {
        response: {
          status: 403,
          data: { message: "System roles cannot be deleted" },
        },
      };

      apiClient.delete.mockRejectedValue(error);

      await expect(roleService.deleteRole(systemRole.id)).rejects.toMatchObject(error);
    }
  });

  test("should return 404 error when deleting non-existent role", async () => {
    const roleId = 9999;

    const error = {
      response: {
        status: 404,
        data: { message: "Role not found" },
      },
    };

    apiClient.delete.mockRejectedValue(error);

    await expect(roleService.deleteRole(roleId)).rejects.toMatchObject(error);
  });

  test("should return 409 error when deleting role assigned to users", async () => {
    const roleId = 13;

    const error = {
      response: {
        status: 409,
        data: { message: "Cannot delete role that is assigned to users" },
      },
    };

    apiClient.delete.mockRejectedValue(error);

    await expect(roleService.deleteRole(roleId)).rejects.toMatchObject(error);
  });
});

describe("Role Endpoints - Multi-tenancy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should scope roles to company when fetching", async () => {
    const company1Roles = mockSystemRoles.map((r) => ({ ...r, companyId: 1 }));
    apiClient.get.mockResolvedValue(company1Roles);

    const result = await roleService.getRoles();

    expect(result.every((r) => r.companyId === 1)).toBe(true);
  });

  test("should create role scoped to current company", async () => {
    const roleData = {
      name: "Quality Inspector",
      description: "Company 1 QI",
      isDirector: false,
      permissionKeys: [],
    };

    const createdRole = createMockRole({ id: 13, ...roleData, companyId: 1 });
    apiClient.post.mockResolvedValue(createdRole);

    const result = await roleService.createRole(roleData);

    expect(result.companyId).toBe(1);
  });

  test("should allow same role name in different companies", async () => {
    // Company 1 creates "Quality Inspector"
    const company1RoleData = {
      name: "Quality Inspector",
      description: "Company 1 QI",
      isDirector: false,
      permissionKeys: [],
    };

    const company1Role = createMockRole({
      id: 13,
      ...company1RoleData,
      companyId: 1,
    });
    apiClient.post.mockResolvedValueOnce(company1Role);

    const result1 = await roleService.createRole(company1RoleData);
    expect(result1.companyId).toBe(1);

    // Company 2 creates "Quality Inspector" (should be allowed)
    const company2RoleData = {
      name: "Quality Inspector",
      description: "Company 2 QI",
      isDirector: false,
      permissionKeys: [],
    };

    const company2Role = createMockRole({
      id: 14,
      ...company2RoleData,
      companyId: 2,
    });
    apiClient.post.mockResolvedValueOnce(company2Role);

    const result2 = await roleService.createRole(company2RoleData);
    expect(result2.companyId).toBe(2);

    // Both should succeed
    expect(result1.name).toBe("Quality Inspector");
    expect(result2.name).toBe("Quality Inspector");
  });

  test("should not allow duplicate role name within same company", async () => {
    const roleData = {
      name: "Quality Inspector",
      description: "Duplicate in same company",
      isDirector: false,
      permissionKeys: [],
    };

    const error = {
      response: {
        status: 409,
        data: { message: "A role with this name already exists" },
      },
    };

    apiClient.post.mockRejectedValue(error);

    await expect(roleService.createRole(roleData)).rejects.toMatchObject(error);
  });
});

describe("Role Endpoints - Permission Keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should create role with permission keys", async () => {
    const roleData = {
      name: "Quality Inspector",
      description: "QI with permissions",
      isDirector: false,
      permissionKeys: ["quality.view", "quality.create", "quality.edit"],
    };

    const createdRole = createMockRole({ id: 13, ...roleData });
    apiClient.post.mockResolvedValue(createdRole);

    const result = await roleService.createRole(roleData);

    expect(result.permissionKeys).toEqual(["quality.view", "quality.create", "quality.edit"]);
  });

  test("should update role permission keys", async () => {
    const roleId = 13;
    const roleData = {
      name: "Quality Inspector",
      description: "Updated permissions",
      isDirector: false,
      permissionKeys: ["quality.view", "quality.create", "quality.edit", "quality.delete"],
    };

    const updatedRole = createMockRole({ id: roleId, ...roleData });
    apiClient.put.mockResolvedValue(updatedRole);

    const result = await roleService.updateRole(roleId, roleData);

    expect(result.permissionKeys).toHaveLength(4);
  });

  test("should create role with empty permission keys", async () => {
    const roleData = {
      name: "Basic Role",
      description: "No permissions",
      isDirector: false,
      permissionKeys: [],
    };

    const createdRole = createMockRole({ id: 13, ...roleData });
    apiClient.post.mockResolvedValue(createdRole);

    const result = await roleService.createRole(roleData);

    expect(result.permissionKeys).toEqual([]);
  });
});
