// Initialize test environment first
import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Simple mock implementations for testing
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

  test("should set and get token", async () => {
    authService.setToken("test-token-123");
    const token = authService.getToken();

    assert.strictEqual(token, "test-token-123", "token should match");
  });

  test("should set and get user", async () => {
    const user = { id: 1, email: "test@example.com" };
    authService.setUser(user);
    const retrievedUser = authService.getUser();

    assert.deepStrictEqual(retrievedUser, user, "user should match");
  });

  test("should return false when not authenticated", async () => {
    const isAuth = authService.isAuthenticated();
    assert.strictEqual(isAuth, false, "should not be authenticated");
  });

  test("should return true when authenticated", async () => {
    authService.setToken("token");
    authService.setUser({ id: 1 });
    const isAuth = authService.isAuthenticated();

    assert.strictEqual(isAuth, true, "should be authenticated");
  });

  test("should logout and clear state", async () => {
    authService.setToken("token");
    authService.setUser({ id: 1 });
    authService.logout();

    assert.strictEqual(authService.getToken(), null, "token should be cleared");
    assert.strictEqual(authService.getUser(), null, "user should be cleared");
    assert.strictEqual(authService.isAuthenticated(), false, "should not be authenticated");
  });

  test("should handle multiple users (separate instances)", async () => {
    const service1 = createMockAuthService();
    const service2 = createMockAuthService();

    service1.setUser({ id: 1, name: "User 1" });
    service2.setUser({ id: 2, name: "User 2" });

    const user1 = service1.getUser();
    const user2 = service2.getUser();

    assert.strictEqual(user1.id, 1, "service1 should have user1");
    assert.strictEqual(user2.id, 2, "service2 should have user2");
  });
});
