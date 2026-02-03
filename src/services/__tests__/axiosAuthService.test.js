import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthService from "../axiosAuthService.js";

vi.mock("../../config/rolePermissions.js", () => ({
  ROLE_PERMISSIONS: {
    admin: {
      "invoices.read": true,
      "invoices.write": true,
      "customers.read": true,
      "customers.write": true,
    },
    user: {
      "invoices.read": true,
      "customers.read": true,
    },
  },
}));

vi.mock("../axiosApi.js", () => ({
  apiService: {
    post: vi.fn(),
  },
  tokenUtils: {
    setToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

import { apiService, tokenUtils } from "../axiosApi.js";

describe("AuthService", () => {
  let authService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe("initialize", () => {
    it("should initialize auth service only once", () => {
      expect(authService.isInitialized).toBe(false);
      authService.initialize();
      expect(authService.isInitialized).toBe(true);

      // Call again - should not reinitialize
      authService.initialize();
      expect(authService.isInitialized).toBe(true);
    });
  });

  describe("_buildPermissionsObject", () => {
    it("should convert flat permissions to nested structure", () => {
      const flatPerms = {
        "invoices.read": true,
        "invoices.write": true,
        "customers.read": true,
      };

      const nested = authService._buildPermissionsObject(flatPerms);

      expect(nested.invoices).toBeDefined();
      expect(nested.invoices.read).toBe(true);
      expect(nested.invoices.write).toBe(true);
      expect(nested.customers.read).toBe(true);
    });

    it("should handle empty permissions", () => {
      const nested = authService._buildPermissionsObject({});
      expect(nested).toEqual({});
    });
  });

  describe("_populatePermissionsForRole", () => {
    it("should populate permissions for admin role", () => {
      const user = { id: 1, email: "admin@company.com", role: "admin" };

      const result = authService._populatePermissionsForRole(user);

      expect(result.permissions).toBeDefined();
      expect(result.permissions.invoices).toBeDefined();
      expect(result.permissions.invoices.read).toBe(true);
      expect(result.permissions.invoices.write).toBe(true);
    });

    it("should populate permissions for user role", () => {
      const user = { id: 2, email: "user@company.com", role: "user" };

      const result = authService._populatePermissionsForRole(user);

      expect(result.permissions).toBeDefined();
      expect(result.permissions.invoices).toBeDefined();
      expect(result.permissions.invoices.read).toBe(true);
      expect(result.permissions.invoices.write).toBeUndefined();
    });

    it("should handle null user", () => {
      const result = authService._populatePermissionsForRole(null);
      expect(result).toBeNull();
    });

    it("should set empty permissions for unknown role", () => {
      const user = { id: 3, email: "guest@company.com", role: "guest" };

      const result = authService._populatePermissionsForRole(user);

      expect(result.permissions).toEqual({});
    });
  });

  describe("login", () => {
    it("should login user with accessToken format", async () => {
      const mockResponse = {
        accessToken: "token123",
        user: {
          id: 1,
          email: "user@company.com",
          role: "admin",
        },
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.login("user@company.com", "password123");

      expect(result).toBeDefined();
      expect(tokenUtils.setToken).toHaveBeenCalledWith("token123");
      expect(apiService.post).toHaveBeenCalledWith(
        "/auth/login",
        expect.objectContaining({
          email: "user@company.com",
          password: "password123",
        })
      );
    });

    it("should login user with token format (legacy)", async () => {
      const mockResponse = {
        token: "legacy-token-456",
        user: {
          id: 2,
          email: "admin@company.com",
          role: "admin",
        },
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.login("admin@company.com", "password456");

      expect(result).toBeDefined();
      expect(tokenUtils.setToken).toHaveBeenCalledWith("legacy-token-456");
    });

    it("should handle login errors", async () => {
      apiService.post.mockRejectedValue(new Error("Invalid credentials"));

      await expect(
        authService.login("invalid@company.com", "wrongpass")
      ).rejects.toThrow("Invalid credentials");
    });

    it("should populate user permissions after login", async () => {
      const mockResponse = {
        accessToken: "token789",
        user: {
          id: 1,
          email: "user@company.com",
          role: "admin",
        },
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.login("user@company.com", "password");

      expect(result.user.permissions).toBeDefined();
      expect(result.user.permissions.invoices).toBeDefined();
    });
  });
});
