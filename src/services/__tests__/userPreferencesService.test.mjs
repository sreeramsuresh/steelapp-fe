import { beforeEach, describe, expect, test, vi } from "vitest";


import { userAdminAPI } from "../userAdminApi.js";
import { userPreferencesService } from "../userPreferencesService.js";

describe("userPreferencesService", () => {
  beforeEach(() => {
    sinon.restore();
    localStorage.clear();
  });

  describe("getCurrentUser", () => {
    test("should return null when no user in localStorage", () => {
      const user = userPreferencesService.getCurrentUser();
      assert.ok(user).toBeNull();
    });

    test("should return parsed user from localStorage", () => {
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      localStorage.setItem("currentUser", JSON.stringify(mockUser));

      const user = userPreferencesService.getCurrentUser();
      assert.ok(user);
    });

    test("should handle invalid JSON in localStorage", () => {
      localStorage.setItem("currentUser", "invalid-json");

      const user = userPreferencesService.getCurrentUser();
      assert.ok(user).toBeNull();
    });
  });

  describe("updatePermissions", () => {
    test("should call userAdminAPI.update with correct payload", async () => {
      const mockUpdatedUser = {
        id: 1,
        permissions: { ui: { homeSectionOrder: ["a", "b", "c"] } },
      };
      sinon.stub(userAdminAPI, 'update').resolves(mockUpdatedUser);

      const result = await userPreferencesService.updatePermissions(1, {
        ui: { homeSectionOrder: ["a", "b", "c"] },
      });

      assert.ok(userAdminAPI.update).toHaveBeenCalledWith(1, {
        permissions: { ui: { homeSectionOrder: ["a", "b", "c"] } },
      });
      assert.ok(result);
    });

    test("should update currentUser in localStorage when user is logged in", async () => {
      const mockCurrentUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        permissions: {},
      };
      localStorage.setItem("currentUser", JSON.stringify(mockCurrentUser));

      const newPermissions = { ui: { homeSectionOrder: ["a", "b"] } };
      const mockUpdatedUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        permissions: newPermissions,
      };
      sinon.stub(userAdminAPI, 'update').resolves(mockUpdatedUser);

      await userPreferencesService.updatePermissions(1, newPermissions);

      const savedUser = JSON.parse(localStorage.getItem("currentUser"));
      assert.ok(savedUser.permissions);
    });

    test("should not update localStorage if different user is logged in", async () => {
      const mockCurrentUser = {
        id: 2,
        name: "Other User",
        email: "other@example.com",
        permissions: {},
      };
      localStorage.setItem("currentUser", JSON.stringify(mockCurrentUser));

      const newPermissions = { ui: { homeSectionOrder: ["a", "b"] } };
      const mockUpdatedUser = {
        id: 1,
        permissions: newPermissions,
      };
      sinon.stub(userAdminAPI, 'update').resolves(mockUpdatedUser);

      await userPreferencesService.updatePermissions(1, newPermissions);

      const savedUser = JSON.parse(localStorage.getItem("currentUser"));
      assert.ok(savedUser.id);
      assert.ok(savedUser.permissions);
    });
  });

  describe("getHomeSectionOrder", () => {
    test("should return null when no saved order", () => {
      const order = userPreferencesService.getHomeSectionOrder();
      assert.ok(order).toBeNull();
    });

    test("should return parsed order from localStorage", () => {
      const mockOrder = ["createNew", "quickAccess", "recentItems"];
      localStorage.setItem("steelapp_home_section_order", JSON.stringify(mockOrder));

      const order = userPreferencesService.getHomeSectionOrder();
      assert.ok(order);
    });

    test("should return null for invalid JSON", () => {
      localStorage.setItem("steelapp_home_section_order", "invalid-json");

      const order = userPreferencesService.getHomeSectionOrder();
      assert.ok(order).toBeNull();
    });
  });

  describe("setHomeSectionOrder", () => {
    test("should save order to localStorage", () => {
      const mockOrder = ["recentItems", "createNew", "quickAccess"];

      userPreferencesService.setHomeSectionOrder(mockOrder);

      const saved = JSON.parse(localStorage.getItem("steelapp_home_section_order"));
      assert.ok(saved);
    });

    test("should handle localStorage errors gracefully", () => {
      const mockOrder = ["a", "b", "c"];
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Mock localStorage.setItem to throw
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error("QuotaExceededError");
      });

      userPreferencesService.setHomeSectionOrder(mockOrder);

      assert.ok(consoleWarnSpy).toHaveBeenCalledWith("Failed to save section order to localStorage:", );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Integration", () => {
    test("should work with full flow: set, get, update permissions", async () => {
      const mockUser = { id: 1, name: "User", email: "user@test.com", permissions: {} };
      localStorage.setItem("currentUser", JSON.stringify(mockUser));

      // Set order
      const order = ["createNew", "recentItems", "quickAccess"];
      userPreferencesService.setHomeSectionOrder(order);

      // Get order
      assert.ok(userPreferencesService.getHomeSectionOrder());

      // Update permissions
      const mockUpdatedUser = {
        id: 1,
        permissions: { ui: { homeSectionOrder: order } },
      };
      sinon.stub(userAdminAPI, 'update').resolves(mockUpdatedUser);

      const result = await userPreferencesService.updatePermissions(1, {
        ui: { homeSectionOrder: order },
      });

      assert.ok(result.permissions.ui.homeSectionOrder);
    });
  });
});