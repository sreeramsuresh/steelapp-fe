import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { userAdminAPI } from "../userAdminApi.js";
import { userPreferencesService } from "../userPreferencesService.js";

describe("userPreferencesService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("getCurrentUser", () => {
    it("should return null when no user in localStorage", () => {
      const user = userPreferencesService.getCurrentUser();
      expect(user).toBe(null);
    });

    it("should return parsed user from localStorage", () => {
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      localStorage.setItem("currentUser", JSON.stringify(mockUser));

      const user = userPreferencesService.getCurrentUser();
      expect(user).toBeTruthy();
    });

    it("should handle invalid JSON in localStorage", () => {
      localStorage.setItem("currentUser", "invalid-json");

      const user = userPreferencesService.getCurrentUser();
      expect(user).toBe(null);
    });
  });

  describe("updatePermissions", () => {
    it("should call userAdminAPI.update with correct payload", async () => {
      const mockUpdatedUser = {
        id: 1,
        permissions: { ui: { homeSectionOrder: ["a", "b", "c"] } },
      };
      vi.spyOn(userAdminAPI, 'update').mockResolvedValue(mockUpdatedUser);

      const result = await userPreferencesService.updatePermissions(1, {
        ui: { homeSectionOrder: ["a", "b", "c"] },
      });

      expect(userAdminAPI.update).toHaveBeenCalledWith(1, {
        permissions: { ui: { homeSectionOrder: ["a", "b", "c"] } },
      });
      expect(result).toBeTruthy();
    });

    it("should update currentUser in localStorage when user is logged in", async () => {
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
      vi.spyOn(userAdminAPI, 'update').mockResolvedValue(mockUpdatedUser);

      await userPreferencesService.updatePermissions(1, newPermissions);

      const savedUser = JSON.parse(localStorage.getItem("currentUser"));
      expect(savedUser.permissions).toBeTruthy();
    });

    it("should not update localStorage if different user is logged in", async () => {
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
      vi.spyOn(userAdminAPI, 'update').mockResolvedValue(mockUpdatedUser);

      await userPreferencesService.updatePermissions(1, newPermissions);

      const savedUser = JSON.parse(localStorage.getItem("currentUser"));
      expect(savedUser.id).toBeTruthy();
      expect(savedUser.permissions).toBeTruthy();
    });
  });

  describe("getHomeSectionOrder", () => {
    it("should return null when no saved order", () => {
      const order = userPreferencesService.getHomeSectionOrder();
      expect(order).toBe(null);
    });

    it("should return parsed order from localStorage", () => {
      const mockOrder = ["createNew", "quickAccess", "recentItems"];
      localStorage.setItem("steelapp_home_section_order", JSON.stringify(mockOrder));

      const order = userPreferencesService.getHomeSectionOrder();
      expect(order).toBeTruthy();
    });

    it("should return null for invalid JSON", () => {
      localStorage.setItem("steelapp_home_section_order", "invalid-json");

      const order = userPreferencesService.getHomeSectionOrder();
      expect(order).toBe(null);
    });
  });

  describe("setHomeSectionOrder", () => {
    it("should save order to localStorage", () => {
      const mockOrder = ["recentItems", "createNew", "quickAccess"];

      userPreferencesService.setHomeSectionOrder(mockOrder);

      const saved = JSON.parse(localStorage.getItem("steelapp_home_section_order"));
      expect(saved).toBeTruthy();
    });

    it("should handle localStorage errors gracefully", () => {
      const mockOrder = ["a", "b", "c"];
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Mock localStorage.setItem to throw
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error("QuotaExceededError");
      });

      userPreferencesService.setHomeSectionOrder(mockOrder);

      expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to save section order to localStorage:", );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Integration", () => {
    it("should work with full flow: set, get, update permissions", async () => {
      const mockUser = { id: 1, name: "User", email: "user@test.com", permissions: {} };
      localStorage.setItem("currentUser", JSON.stringify(mockUser));

      // Set order
      const order = ["createNew", "recentItems", "quickAccess"];
      userPreferencesService.setHomeSectionOrder(order);

      // Get order
      expect(userPreferencesService.getHomeSectionOrder().toBeTruthy());

      // Update permissions
      const mockUpdatedUser = {
        id: 1,
        permissions: { ui: { homeSectionOrder: order } },
      };
      vi.spyOn(userAdminAPI, 'update').mockResolvedValue(mockUpdatedUser);

      const result = await userPreferencesService.updatePermissions(1, {
        ui: { homeSectionOrder: order },
      });

      expect(result.permissions.ui.homeSectionOrder).toBeTruthy();
    });
  });
});