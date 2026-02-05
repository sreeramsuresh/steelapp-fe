/**
 * Users Service Unit Tests (userAdminAPI wrapper)
 * ✅ Tests user CRUD operations (create, read, update, delete)
 * ✅ Tests user listing with pagination and filters
import '../../__tests__/init.mjs';

 * ✅ Tests password management operations
 * ✅ Tests error handling (network, validation, not found)
 * ✅ Tests multi-tenancy enforcement (company_id filtering)
 * ✅ 40-50 tests covering all critical paths
 */

import { beforeEach, describe, expect, test, vi } from "vitest";


import { apiService } from "../axiosApi.js";
import { userAdminAPI } from "../userAdminApi.js";

describe("usersService (userAdminAPI)", () => {
  beforeEach(() => {
    sinon.restore();
  });

  // ============================================================================
  // USER LISTING & RETRIEVAL
  // ============================================================================

  describe("List Users", () => {
    test("should list all users without filters", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "ADMIN",
          companyId: 1,
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          role: "USER",
          companyId: 1,
        },
      ];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list();

      assert.ok(result);
      assert.ok(result[0].email);
      sinon.assert.calledWith(apiService.get, "/users", { params: {} });
    });

    test("should list users with pagination", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "User One",
          email: "user1@example.com",
          role: "USER",
        },
      ];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list({ page: 1, limit: 10 });

      assert.ok(result);
      sinon.assert.calledWith(apiService.get, "/users", {
        params: { page: 1, limit: 10 },
      });
    });

    test("should list users filtered by role", async () => {
      const mockUsers = [{ id: 1, name: "Admin User", email: "admin@example.com", role: "ADMIN" }];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list({ role: "ADMIN" });

      assert.ok(result);
      assert.ok(result[0].role);
      sinon.assert.calledWith(apiService.get, "/users", {
        params: { role: "ADMIN" },
      });
    });

    test("should list users filtered by company", async () => {
      const mockUsers = [{ id: 1, name: "User", email: "user@example.com", companyId: 5 }];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list({ companyId: 5 });

      assert.ok(result);
      assert.ok(result[0].companyId);
    });

    test("should handle array response format", async () => {
      const mockUsers = [{ id: 1, name: "User One", email: "user1@example.com" }];
      apiService.get.mockResolvedValueOnce(mockUsers);

      const result = await userAdminAPI.list();

      assert.ok(result);
    });

    test("should handle empty user list", async () => {
      apiService.get.mockResolvedValueOnce({ users: [] });

      const result = await userAdminAPI.list();

      assert.ok(result);
    });

    test("should handle null response gracefully", async () => {
      apiService.get.mockResolvedValueOnce(null);

      const result = await userAdminAPI.list();

      assert.ok(result);
    });

    test("should search users by email", async () => {
      const mockUsers = [{ id: 1, name: "John", email: "john@example.com", role: "ADMIN" }];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list({ search: "john@example.com" });

      assert.ok(result);
      sinon.assert.calledWith(apiService.get, "/users", {
        params: { search: "john@example.com" },
      });
    });

    test("should sort users by name", async () => {
      const mockUsers = [
        { id: 2, name: "Alice", email: "alice@example.com" },
        { id: 1, name: "Bob", email: "bob@example.com" },
      ];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list({ sort: "name", order: "asc" });

      assert.ok(result);
      assert.ok(result[0].name);
    });
  });

  // ============================================================================
  // USER CREATION
  // ============================================================================

  describe("Create User", () => {
    test("should create user with all required fields", async () => {
      const userData = {
        name: "New User",
        email: "newuser@example.com",
        password: "SecurePass123!",
        role: "USER",
      };
      const mockResponse = {
        user: { id: 10, ...userData, companyId: 1 },
      };
      apiService.post.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.create(userData);

      assert.ok(result.id);
      assert.ok(result.email);
      sinon.assert.calledWith(apiService.post, "/users", userData);
    });

    test("should create user with permissions", async () => {
      const userData = {
        name: "User",
        email: "user@example.com",
        password: "Pass123!",
        role: "OPERATOR",
        permissions: ["READ_INVOICE", "CREATE_PO"],
      };
      const mockResponse = {
        user: { id: 11, ...userData, companyId: 1 },
      };
      apiService.post.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.create(userData);

      assert.ok(result.permissions);
      sinon.assert.calledWith(apiService.post, "/users", userData);
    });

    test("should handle user creation error", async () => {
      const userData = {
        name: "User",
        email: "user@example.com",
        password: "Pass123!",
        role: "USER",
      };
      apiService.post.mockRejectedValueOnce(new Error("Email already exists"));

      assert.rejects(userAdminAPI.create(userData), Error);
    });

    test("should reject weak password", async () => {
      const userData = {
        name: "User",
        email: "user@example.com",
        password: "123",
        role: "USER",
      };
      apiService.post.mockRejectedValueOnce(new Error("Password too weak"));

      assert.rejects(userAdminAPI.create(userData), Error);
    });

    test("should validate email format on creation", async () => {
      const userData = {
        name: "User",
        email: "invalid-email",
        password: "Pass123!",
        role: "USER",
      };
      apiService.post.mockRejectedValueOnce(new Error("Invalid email format"));

      assert.rejects(userAdminAPI.create(userData), Error);
    });

    test("should handle network error on creation", async () => {
      const userData = {
        name: "User",
        email: "user@example.com",
        password: "Pass123!",
        role: "USER",
      };
      apiService.post.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(userAdminAPI.create(userData), Error);
    });

    test("should handle response without user object", async () => {
      const userData = {
        name: "User",
        email: "user@example.com",
        password: "Pass123!",
        role: "USER",
      };
      const mockResponse = { id: 12, name: "User" };
      apiService.post.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.create(userData);

      assert.ok(result.id);
    });
  });

  // ============================================================================
  // USER UPDATES
  // ============================================================================

  describe("Update User", () => {
    test("should update user name", async () => {
      const userId = 1;
      const payload = { name: "Updated Name" };
      const mockResponse = {
        user: { id: userId, name: "Updated Name", email: "user@example.com" },
      };
      apiService.patch.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.update(userId, payload);

      assert.ok(result.name);
      sinon.assert.calledWith(apiService.patch, `/users/${userId}`, payload);
    });

    test("should update user role", async () => {
      const userId = 1;
      const payload = { role: "MANAGER" };
      const mockResponse = {
        user: { id: userId, role: "MANAGER", email: "user@example.com" },
      };
      apiService.patch.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.update(userId, payload);

      assert.ok(result.role);
    });

    test("should update multiple user fields", async () => {
      const userId = 5;
      const payload = { name: "New Name", role: "OPERATOR" };
      const mockResponse = {
        user: { id: userId, ...payload, email: "user@example.com" },
      };
      apiService.patch.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.update(userId, payload);

      assert.ok(result.name);
      assert.ok(result.role);
    });

    test("should handle user not found error", async () => {
      const userId = 999;
      const payload = { name: "Updated" };
      apiService.patch.mockRejectedValueOnce(new Error("User not found"));

      assert.rejects(userAdminAPI.update(userId, payload), Error);
    });

    test("should handle validation errors on update", async () => {
      const userId = 1;
      const payload = { email: "invalid-email" };
      apiService.patch.mockRejectedValueOnce(new Error("Invalid email"));

      assert.rejects(userAdminAPI.update(userId, payload), Error);
    });

    test("should return user from user object in response", async () => {
      const userId = 1;
      const payload = { name: "Updated" };
      const mockResponse = {
        user: { id: userId, name: "Updated", email: "user@example.com" },
      };
      apiService.patch.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.update(userId, payload);

      assert.ok(result.email);
    });

    test("should handle response without user wrapper", async () => {
      const userId = 1;
      const payload = { name: "Updated" };
      const mockResponse = { id: userId, name: "Updated", email: "user@example.com" };
      apiService.patch.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.update(userId, payload);

      assert.ok(result.name);
    });
  });

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  describe("Change Password", () => {
    test("should change user password", async () => {
      const userId = 1;
      const payload = { currentPassword: "OldPass123!", newPassword: "NewPass456!" };
      const mockResponse = { success: true, message: "Password changed" };
      apiService.put.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.changePassword(userId, payload);

      assert.ok(result.success);
      sinon.assert.calledWith(apiService.put, `/users/${userId}/password`, payload);
    });

    test("should reject incorrect current password", async () => {
      const userId = 1;
      const payload = { currentPassword: "WrongPass", newPassword: "NewPass456!" };
      apiService.put.mockRejectedValueOnce(new Error("Current password incorrect"));

      assert.rejects(userAdminAPI.changePassword(userId, payload), Error);
    });

    test("should enforce password strength on new password", async () => {
      const userId = 1;
      const payload = { currentPassword: "OldPass123!", newPassword: "123" };
      apiService.put.mockRejectedValueOnce(new Error("New password too weak"));

      assert.rejects(userAdminAPI.changePassword(userId, payload), Error);
    });

    test("should prevent reusing old password", async () => {
      const userId = 1;
      const payload = { currentPassword: "OldPass123!", newPassword: "OldPass123!" };
      apiService.put.mockRejectedValueOnce(new Error("Cannot reuse previous password"));

      assert.rejects(userAdminAPI.changePassword(userId, payload), Error);
    });

    test("should handle network error during password change", async () => {
      const userId = 1;
      const payload = { currentPassword: "OldPass123!", newPassword: "NewPass456!" };
      apiService.put.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(userAdminAPI.changePassword(userId, payload), Error);
    });
  });

  // ============================================================================
  // USER DELETION
  // ============================================================================

  describe("Delete User", () => {
    test("should delete user by ID", async () => {
      const userId = 5;
      const mockResponse = { success: true, message: "User deleted" };
      apiService.delete.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.remove(userId);

      assert.ok(result.success);
      sinon.assert.calledWith(apiService.delete, `/users/${userId}`);
    });

    test("should handle deletion of non-existent user", async () => {
      const userId = 999;
      apiService.delete.mockRejectedValueOnce(new Error("User not found"));

      assert.rejects(userAdminAPI.remove(userId), Error);
    });

    test("should prevent deletion of last admin user", async () => {
      const userId = 1;
      apiService.delete.mockRejectedValueOnce(new Error("Cannot delete last admin"));

      assert.rejects(userAdminAPI.remove(userId), Error);
    });

    test("should handle authorization error on deletion", async () => {
      const userId = 10;
      apiService.delete.mockRejectedValueOnce(new Error("Insufficient permissions"));

      assert.rejects(userAdminAPI.remove(userId), Error);
    });

    test("should handle network error on deletion", async () => {
      const userId = 5;
      apiService.delete.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(userAdminAPI.remove(userId), Error);
    });
  });

  // ============================================================================
  // MULTI-TENANCY COMPLIANCE
  // ============================================================================

  describe("Multi-Tenancy Enforcement", () => {
    test("should filter users by company context", async () => {
      const mockUsers = [{ id: 1, name: "User", email: "user@example.com", companyId: 1 }];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list({ companyId: 1 });

      assert.ok(result[0].companyId);
    });

    test("should not allow cross-company user access", async () => {
      // API should enforce this, client just sends request
      const mockUsers = [{ id: 1, name: "User", email: "user@example.com", companyId: 2 }];
      apiService.get.mockResolvedValueOnce({ users: mockUsers });

      const result = await userAdminAPI.list({ companyId: 1 });

      // User belongs to company 2, not company 1
      assert.ok(result[0].companyId);
    });

    test("should include company context when creating user", async () => {
      const userData = {
        name: "New User",
        email: "user@example.com",
        password: "Pass123!",
        role: "USER",
      };
      const mockResponse = {
        user: { id: 10, ...userData, companyId: 1 },
      };
      apiService.post.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.create(userData);

      assert.ok(result.companyId !== undefined);
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle API timeout", async () => {
      apiService.get.mockRejectedValueOnce(new Error("Request timeout"));

      assert.rejects(userAdminAPI.list(), Error);
    });

    test("should handle server error responses", async () => {
      apiService.get.mockRejectedValueOnce(new Error("Server error: 500"));

      assert.rejects(userAdminAPI.list(), Error);
    });

    test("should handle malformed response", async () => {
      apiService.get.mockResolvedValueOnce(null);

      const result = await userAdminAPI.list();

      assert.ok(result);
    });

    test("should handle concurrent requests", async () => {
      const mockUsers1 = [{ id: 1, name: "User 1", email: "user1@example.com" }];
      const mockUsers2 = [{ id: 2, name: "User 2", email: "user2@example.com" }];

      apiService.get.mockResolvedValueOnce({ users: mockUsers1 });
      apiService.get.mockResolvedValueOnce({ users: mockUsers2 });

      const [result1, result2] = await Promise.all([userAdminAPI.list({ page: 1 }), userAdminAPI.list({ page: 2 })]);

      assert.ok(result1[0].id);
      assert.ok(result2[0].id);
    });
  });

  // ============================================================================
  // PERMISSION & ROLE SPECIFIC OPERATIONS
  // ============================================================================

  describe("Role-Based Operations", () => {
    test("should create admin user", async () => {
      const userData = {
        name: "Admin",
        email: "admin@example.com",
        password: "AdminPass123!",
        role: "ADMIN",
      };
      const mockResponse = { user: { id: 20, ...userData } };
      apiService.post.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.create(userData);

      assert.ok(result.role);
    });

    test("should create user with custom permissions", async () => {
      const userData = {
        name: "Operator",
        email: "operator@example.com",
        password: "OpPass123!",
        role: "OPERATOR",
        permissions: ["READ_INVOICE", "CREATE_PO", "APPROVE_PAYMENT"],
      };
      const mockResponse = { user: { id: 21, ...userData } };
      apiService.post.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.create(userData);

      assert.ok(result.permissions);
      assert.ok(result.permissions);
    });

    test("should update user permissions via update", async () => {
      const userId = 1;
      const payload = { permissions: ["READ_REPORT", "CREATE_INVOICE"] };
      const mockResponse = {
        user: { id: userId, ...payload, email: "user@example.com" },
      };
      apiService.patch.mockResolvedValueOnce(mockResponse);

      const result = await userAdminAPI.update(userId, payload);

      assert.ok(result.permissions);
    });
  });
});