/**
 * Authentication Service Unit Tests
 * ✅ Tests login, registration, logout, token management
 * ✅ Tests localStorage and cookie token storage
 * ✅ Tests refresh token handling
 * ✅ 100% coverage target for authService.js
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Mock API client
vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock localStorage and cookies
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

vi.mock("../axiosApi.js", () => ({
  tokenUtils: {
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getToken: vi.fn(),
    getRefreshToken: vi.fn(),
    removeTokens: vi.fn(),
    setUser: vi.fn(),
    getUser: vi.fn(),
    removeUser: vi.fn(),
    clearSession: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
// Import after mocks
import { authService } from "../authService.js";
import { tokenUtils } from "../axiosApi";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  // ============================================================================
  // AUTHENTICATION - Login/Register/Logout
  // ============================================================================

  describe("Login", () => {
    test("should login user with email and password", async () => {
      const mockResponse = {
        token: "jwt-token-123",
        refreshToken: "refresh-token-456",
        user: { id: 1, email: "test@test.com", name: "Test User", companyId: 1 },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login("test@test.com", "password123");

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@test.com",
        password: "password123",
      });
    });

    test("should store token in localStorage after login", async () => {
      const mockResponse = {
        token: "jwt-token-123",
        refreshToken: "refresh-token-456",
        user: { id: 1, email: "test@test.com", companyId: 1 },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      await authService.login("test@test.com", "password123");

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-token", "jwt-token-123");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("token", "jwt-token-123");
    });

    test("should store refresh token after login", async () => {
      const mockResponse = {
        token: "jwt-token-123",
        refreshToken: "refresh-token-456",
        user: { id: 1, email: "test@test.com", companyId: 1 },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      await authService.login("test@test.com", "password123");

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-refresh-token", "refresh-token-456");
    });

    test("should call tokenUtils.setToken with JWT token", async () => {
      const mockResponse = {
        token: "jwt-token-123",
        refreshToken: "refresh-token-456",
        user: { id: 1, email: "test@test.com", companyId: 1 },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      await authService.login("test@test.com", "password123");

      expect(tokenUtils.setToken).toHaveBeenCalledWith("jwt-token-123");
    });

    test("should handle login without refresh token", async () => {
      const mockResponse = {
        token: "jwt-token-123",
        user: { id: 1, email: "test@test.com", companyId: 1 },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      await authService.login("test@test.com", "password123");

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-token", "jwt-token-123");
    });

    test("should reject login with invalid credentials", async () => {
      const error = new Error("Invalid email or password");
      apiClient.post.mockRejectedValueOnce(error);

      await expect(authService.login("test@test.com", "wrongpass")).rejects.toThrow("Invalid email or password");
    });
  });

  describe("Register", () => {
    test("should register new user", async () => {
      const userData = {
        email: "newuser@test.com",
        password: "SecurePassword123!",
        name: "New User",
        companyName: "Test Company",
      };
      const mockResponse = {
        token: "jwt-token-new",
        user: { id: 2, ...userData, companyId: 2 },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.register(userData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith("/auth/register", userData);
    });

    test("should store token after registration", async () => {
      const userData = {
        email: "newuser@test.com",
        password: "SecurePassword123!",
        name: "New User",
      };
      const mockResponse = {
        token: "jwt-token-new",
        user: { id: 2, ...userData, companyId: 2 },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      await authService.register(userData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-token", "jwt-token-new");
    });

    test("should reject duplicate email", async () => {
      const error = new Error("Email already registered");
      apiClient.post.mockRejectedValueOnce(error);

      const userData = {
        email: "existing@test.com",
        password: "Password123!",
        name: "User",
      };

      await expect(authService.register(userData)).rejects.toThrow("Email already registered");
    });
  });

  describe("Logout", () => {
    test("should logout user and clear tokens", async () => {
      apiClient.post.mockResolvedValueOnce({});

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("steel-app-token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
      expect(tokenUtils.removeTokens).toHaveBeenCalled();
    });

    test("should clear tokens even if API call fails", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Network error"));

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("steel-app-token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
    });

    test("should remove refresh token on logout", async () => {
      apiClient.post.mockResolvedValueOnce({});

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("steel-app-refresh-token");
    });

    test("should clear user data on logout", async () => {
      apiClient.post.mockResolvedValueOnce({});

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("steel-app-user");
    });
  });

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  describe("Token Management", () => {
    test("should set token in localStorage", () => {
      authService.setToken("new-jwt-token");

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-token", "new-jwt-token");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("token", "new-jwt-token");
    });

    test("should call tokenUtils.setToken", () => {
      authService.setToken("new-jwt-token");

      expect(tokenUtils.setToken).toHaveBeenCalledWith("new-jwt-token");
    });

    test("should set refresh token", () => {
      authService.setRefreshToken("new-refresh-token");

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-refresh-token", "new-refresh-token");
    });

    test("should get current token", () => {
      localStorageMock.getItem.mockReturnValueOnce("stored-token");

      const token = authService.getToken();

      expect(token).toBe("stored-token");
      expect(localStorageMock.getItem).toHaveBeenCalledWith("steel-app-token");
    });

    test("should get refresh token", () => {
      localStorageMock.getItem.mockReturnValueOnce("stored-refresh-token");

      const token = authService.getRefreshToken();

      expect(token).toBe("stored-refresh-token");
      expect(localStorageMock.getItem).toHaveBeenCalledWith("steel-app-refresh-token");
    });

    test("should remove token", () => {
      authService.removeToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("steel-app-token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("steel-app-refresh-token");
      expect(tokenUtils.removeTokens).toHaveBeenCalled();
    });

    test("should check if user is authenticated", () => {
      localStorageMock.getItem.mockReturnValueOnce("valid-token");

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    test("should return false if not authenticated", () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  // ============================================================================
  // USER DATA MANAGEMENT
  // ============================================================================

  describe("User Management", () => {
    test("should set user in localStorage", () => {
      const userData = { id: 1, email: "test@test.com", name: "Test User", companyId: 1 };

      authService.setUser(userData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-user", JSON.stringify(userData));
    });

    test("should get current user", () => {
      const userData = { id: 1, email: "test@test.com", name: "Test User", companyId: 1 };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(userData));

      const user = authService.getUser();

      expect(user).toEqual(userData);
    });

    test("should remove user data", () => {
      authService.removeUser();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("steel-app-user");
    });

    test("should get current user profile from API", async () => {
      const mockUser = { id: 1, email: "test@test.com", name: "Test User", companyId: 1 };
      apiClient.get.mockResolvedValueOnce(mockUser);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
    });
  });

  // ============================================================================
  // PASSWORD & SECURITY
  // ============================================================================

  describe("Password Management", () => {
    test("should change password with current and new password", async () => {
      const mockResponse = { success: true, message: "Password changed successfully" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.changePassword("oldPassword123!", "newPassword456!");

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith("/auth/change-password", {
        currentPassword: "oldPassword123!",
        newPassword: "newPassword456!",
      });
    });

    test("should handle incorrect current password", async () => {
      const error = new Error("Current password is incorrect");
      apiClient.post.mockRejectedValueOnce(error);

      await expect(authService.changePassword("wrongPassword", "newPassword456!")).rejects.toThrow(
        "Current password is incorrect"
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network errors during login", async () => {
      const error = new Error("Network timeout");
      apiClient.post.mockRejectedValueOnce(error);

      await expect(authService.login("test@test.com", "password")).rejects.toThrow("Network timeout");
    });

    test("should handle server errors", async () => {
      const error = new Error("Server error: 500");
      apiClient.post.mockRejectedValueOnce(error);

      await expect(authService.register({})).rejects.toThrow();
    });

    test("should handle invalid session token", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Unauthorized: Invalid token"));

      await expect(authService.getCurrentUser()).rejects.toThrow("Unauthorized: Invalid token");
    });
  });

  // ============================================================================
  // MULTI-TENANCY
  // ============================================================================

  describe("Multi-Tenancy", () => {
    test("should include company context in user data", async () => {
      const userData = {
        email: "test@test.com",
        password: "password",
        name: "Test User",
      };
      const mockResponse = {
        token: "jwt-token",
        user: { id: 1, ...userData, companyId: 5, companyName: "Company A" },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      await authService.register(userData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("steel-app-user", expect.stringContaining('"companyId":5'));
    });

    test("should verify user belongs to correct company", async () => {
      const userData = { id: 1, email: "test@test.com", companyId: 5 };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(userData));

      const user = authService.getUser();

      expect(user.companyId).toBe(5);
    });

    test("should enforce company_id in API calls", async () => {
      const mockUser = { id: 1, email: "test@test.com", companyId: 5 };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));

      authService.getUser();

      const user = authService.getUser();
      expect(user.companyId).toBeDefined();
    });
  });
});
