// Initialize test environment first
// Simple mock implementations for testing
import { beforeEach, describe, expect, it } from "vitest";

const createMockAuthService = () => {
  const tokenStore = {};
  const userStore = {};

  return {
    setToken(token) {
      tokenStore.token = token;
    },
    getToken() {
      return tokenStore.token || null;
    },
    setUser(user) {
      userStore.user = user;
    },
    getUser() {
      return userStore.user || null;
    },
    isAuthenticated() {
      return !!tokenStore.token && !!userStore.user;
    },
    logout() {
      delete tokenStore.token;
      delete userStore.user;
    },
  };
};

describe("Simple Auth Service", () => {
  let authService;

  beforeEach(() => {
    authService = createMockAuthService();
  });

  it("should set and get token", async () => {
    authService.setToken("test-token-123");
    const token = authService.getToken();

    expect(token).toBe("test-token-123", "token should match");
  });

  it("should set and get user", async () => {
    const user = { id: 1, email: "test@example.com" };
    authService.setUser(user);
    const retrievedUser = authService.getUser();

    expect(retrievedUser).toEqual(user, "user should match");
  });

  it("should return false when not authenticated", async () => {
    const isAuth = authService.isAuthenticated();
    expect(isAuth).toBe(false, "should not be authenticated");
  });

  it("should return true when authenticated", async () => {
    authService.setToken("token");
    authService.setUser({ id: 1 });
    const isAuth = authService.isAuthenticated();

    expect(isAuth).toBe(true, "should be authenticated");
  });

  it("should logout and clear state", async () => {
    authService.setToken("token");
    authService.setUser({ id: 1 });
    authService.logout();

    expect(authService.getToken()).toBe(null, "token should be cleared");
    expect(authService.getUser()).toBe(null, "user should be cleared");
    expect(authService.isAuthenticated()).toBe(false, "should not be authenticated");
  });

  it("should handle multiple users (separate instances)", async () => {
    const service1 = createMockAuthService();
    const service2 = createMockAuthService();

    service1.setUser({ id: 1, name: "User 1" });
    service2.setUser({ id: 2, name: "User 2" });

    const user1 = service1.getUser();
    const user2 = service2.getUser();

    expect(user1.id).toBe(1, "service1 should have user1");
    expect(user2.id).toBe(2, "service2 should have user2");
  });
});
