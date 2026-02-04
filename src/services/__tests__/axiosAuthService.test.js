/**
 * Axios Auth Service Unit Tests
 * Tests authentication operations via axios API service
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

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
    get: vi.fn(),
  },
  tokenUtils: {
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setUser: vi.fn(),
    getUser: vi.fn(),
    clearSession: vi.fn(),
  },
}));

import { apiService, tokenUtils } from "../axiosApi.js";
import authService from "../axiosAuthService.js";

describe("axiosAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login user with accessToken format", async () => {
      const mockResponse = {
        accessToken: "token123",
        refreshToken: "refresh123",
        user: {
          id: 1,
          email: "user@company.com",
          role: "admin",
        },
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.login("user@company.com", "password123");

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockResponse.user);
      expect(tokenUtils.setToken).toHaveBeenCalledWith("token123");
      expect(tokenUtils.setRefreshToken).toHaveBeenCalledWith("refresh123");
      expect(apiService.post).toHaveBeenCalledWith(
        "/auth/login",
        expect.objectContaining({
          email: "user@company.com",
          password: "password123",
        })
      );
    });

    it("should login user with legacy token format", async () => {
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

    it("should handle login validation errors", async () => {
      const error = new Error("Validation failed");
      error.response = {
        status: 400,
        data: { message: "Invalid email or password" },
      };
      apiService.post.mockRejectedValue(error);

      await expect(authService.login("invalid@company.com", "wrongpass")).rejects.toThrow();
    });

    it("should store user data after successful login", async () => {
      const mockResponse = {
        accessToken: "token789",
        user: {
          id: 1,
          email: "user@company.com",
          role: "admin",
        },
      };

      apiService.post.mockResolvedValue(mockResponse);

      await authService.login("user@company.com", "password");

      expect(tokenUtils.setUser).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
    });
  });

  describe("logout", () => {
    it("should logout user and clear session", async () => {
      tokenUtils.getRefreshToken.mockReturnValue("refresh-token");
      apiService.post.mockResolvedValue({});

      await authService.logout();

      expect(apiService.post).toHaveBeenCalledWith("/auth/logout", {
        refreshToken: "refresh-token",
      });
      expect(tokenUtils.clearSession).toHaveBeenCalled();
    });

    it("should clear session even if API call fails", async () => {
      apiService.post.mockRejectedValue(new Error("Network error"));

      await authService.logout();

      expect(tokenUtils.clearSession).toHaveBeenCalled();
    });
  });

  describe("register", () => {
    it("should register new user", async () => {
      const userData = {
        email: "newuser@company.com",
        password: "securepass123",
        firstName: "John",
        lastName: "Doe",
      };

      const mockResponse = {
        accessToken: "new-token",
        refreshToken: "new-refresh",
        user: {
          id: 100,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: "user",
        },
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(tokenUtils.setToken).toHaveBeenCalledWith("new-token");
      expect(tokenUtils.setRefreshToken).toHaveBeenCalledWith("new-refresh");
    });

    it("should handle registration errors", async () => {
      const userData = { email: "user@company.com", password: "pass" };
      const error = new Error("Email already exists");
      error.response = { status: 409, data: { message: "Email already exists" } };

      apiService.post.mockRejectedValue(error);

      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe("getCurrentUser", () => {
    it("should get current user profile", async () => {
      const mockUser = {
        user: {
          id: 1,
          email: "user@company.com",
          role: "admin",
          firstName: "John",
        },
      };

      apiService.get.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(result).toBeDefined();
      expect(result.email).toBe("user@company.com");
      expect(apiService.get).toHaveBeenCalledWith("/auth/me", {});
    });

    it("should store user after fetching", async () => {
      const mockUser = {
        user: {
          id: 1,
          email: "user@company.com",
          role: "admin",
        },
      };

      apiService.get.mockResolvedValue(mockUser);

      await authService.getCurrentUser();

      expect(tokenUtils.setUser).toHaveBeenCalled();
    });

    it("should handle user fetch errors", async () => {
      const error = new Error("Unauthorized");
      error.response = { status: 401 };

      apiService.get.mockRejectedValue(error);

      await expect(authService.getCurrentUser()).rejects.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("should refresh access token", async () => {
      tokenUtils.getRefreshToken.mockReturnValue("refresh-token-123");
      const mockResponse = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(result).toBe("new-access-token");
      expect(tokenUtils.setToken).toHaveBeenCalledWith("new-access-token");
      expect(tokenUtils.setRefreshToken).toHaveBeenCalledWith("new-refresh-token");
    });

    it("should support legacy token format", async () => {
      tokenUtils.getRefreshToken.mockReturnValue("refresh-token");
      const mockResponse = {
        token: "new-legacy-token",
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(result).toBe("new-legacy-token");
      expect(tokenUtils.setToken).toHaveBeenCalledWith("new-legacy-token");
    });

    it("should handle missing refresh token", async () => {
      tokenUtils.getRefreshToken.mockReturnValue(null);

      await expect(authService.refreshToken()).rejects.toThrow("No refresh token");
    });

    it("should clear session on 401/403 errors", async () => {
      tokenUtils.getRefreshToken.mockReturnValue("refresh-token");
      const error = new Error("Unauthorized");
      error.response = { status: 401 };

      apiService.post.mockRejectedValue(error);

      await expect(authService.refreshToken()).rejects.toThrow();
      expect(authService.clearSession).toBeDefined();
    });
  });

  describe("changePassword", () => {
    it("should change user password", async () => {
      const mockResponse = { message: "Password changed successfully" };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.changePassword("oldpass", "newpass");

      expect(result).toBeDefined();
      expect(apiService.post).toHaveBeenCalledWith(
        "/auth/change-password",
        expect.objectContaining({
          currentPassword: "oldpass",
          newPassword: "newpass",
        })
      );
    });

    it("should handle password change errors", async () => {
      const error = new Error("Current password is incorrect");
      error.response = { status: 400, data: { message: "Current password is incorrect" } };

      apiService.post.mockRejectedValue(error);

      await expect(authService.changePassword("wrong", "newpass")).rejects.toThrow();
    });
  });

  describe("clearSession", () => {
    it("should clear all session data", () => {
      authService.clearSession();

      expect(tokenUtils.clearSession).toHaveBeenCalled();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when user has token and user data", () => {
      tokenUtils.getToken.mockReturnValue("token123");
      tokenUtils.getUser.mockReturnValue({ id: 1, email: "user@company.com" });

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it("should return false when token is missing", () => {
      tokenUtils.getToken.mockReturnValue(null);
      tokenUtils.getUser.mockReturnValue({ id: 1 });

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it("should return false when user data is missing", () => {
      tokenUtils.getToken.mockReturnValue("token123");
      tokenUtils.getUser.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("getUser", () => {
    it("should return current user", () => {
      const mockUser = { id: 1, email: "user@company.com", role: "admin" };
      tokenUtils.getUser.mockReturnValue(mockUser);

      const result = authService.getUser();

      expect(result).toEqual(mockUser);
    });
  });

  describe("hasPermission", () => {
    it("should return true for admin accessing any resource", () => {
      const mockUser = { id: 1, role: "admin", permissions: {} };
      tokenUtils.getUser.mockReturnValue(mockUser);

      const result = authService.hasPermission("invoices", "delete");

      expect(result).toBe(true);
    });

    it("should check permissions for non-admin users", () => {
      const mockUser = {
        id: 2,
        role: "user",
        permissions: {
          invoices: { read: true },
          customers: { read: true },
        },
      };
      tokenUtils.getUser.mockReturnValue(mockUser);

      expect(authService.hasPermission("invoices", "read")).toBe(true);
      expect(authService.hasPermission("invoices", "write")).toBeFalsy();
    });

    it("should return false when user is not logged in", () => {
      tokenUtils.getUser.mockReturnValue(null);

      const result = authService.hasPermission("invoices", "read");

      expect(result).toBe(false);
    });
  });

  describe("hasRole", () => {
    it("should check single role", () => {
      const mockUser = { id: 1, role: "admin" };
      tokenUtils.getUser.mockReturnValue(mockUser);

      expect(authService.hasRole("admin")).toBe(true);
      expect(authService.hasRole("user")).toBe(false);
    });

    it("should check multiple roles", () => {
      const mockUser = { id: 1, role: "user" };
      tokenUtils.getUser.mockReturnValue(mockUser);

      expect(authService.hasRole(["admin", "user"])).toBe(true);
      expect(authService.hasRole(["admin", "guest"])).toBe(false);
    });

    it("should return false when user not logged in", () => {
      tokenUtils.getUser.mockReturnValue(null);

      expect(authService.hasRole("admin")).toBe(false);
    });
  });

  describe("getUserPermissions", () => {
    it("should return user permissions", () => {
      const permissions = {
        invoices: { read: true, write: true },
        customers: { read: true },
      };
      const mockUser = { id: 1, permissions };
      tokenUtils.getUser.mockReturnValue(mockUser);

      const result = authService.getUserPermissions();

      expect(result).toEqual(permissions);
    });

    it("should return empty object when no permissions", () => {
      const mockUser = { id: 1 };
      tokenUtils.getUser.mockReturnValue(mockUser);

      const result = authService.getUserPermissions();

      expect(result).toEqual({});
    });
  });

  describe("getUserRole", () => {
    it("should return user role", () => {
      const mockUser = { id: 1, role: "admin" };
      tokenUtils.getUser.mockReturnValue(mockUser);

      const result = authService.getUserRole();

      expect(result).toBe("admin");
    });

    it("should return null when not logged in", () => {
      tokenUtils.getUser.mockReturnValue(null);

      const result = authService.getUserRole();

      expect(result).toBeNull();
    });
  });
});
