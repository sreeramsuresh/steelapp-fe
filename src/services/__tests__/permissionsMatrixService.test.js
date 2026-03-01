import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";
import { permissionsMatrixService } from "../permissionsMatrixService.js";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("permissionsMatrixService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getMatrix", () => {
    it("should fetch the permissions matrix", async () => {
      const mockMatrix = {
        roles: ["admin", "viewer"],
        permissions: { admin: ["read", "write"], viewer: ["read"] },
      };
      vi.spyOn(apiClient, "get").mockResolvedValue(mockMatrix);

      const result = await permissionsMatrixService.getMatrix();

      expect(result).toEqual(mockMatrix);
      expect(apiClient.get).toHaveBeenCalledWith("/roles/permissions/matrix");
    });

    it("should propagate API errors", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Forbidden"));

      await expect(permissionsMatrixService.getMatrix()).rejects.toThrow("Forbidden");
    });
  });

  describe("setCustomPermission", () => {
    it("should set a custom permission with reason", async () => {
      vi.spyOn(apiClient, "put").mockResolvedValue({ success: true });

      const result = await permissionsMatrixService.setCustomPermission(
        5,
        "invoices.create",
        "grant",
        "Manager request"
      );

      expect(result).toEqual({ success: true });
      expect(apiClient.put).toHaveBeenCalledWith("/roles/users/5/custom-permissions", {
        permission_key: "invoices.create",
        action: "grant",
        reason: "Manager request",
      });
    });

    it("should omit reason when not provided", async () => {
      vi.spyOn(apiClient, "put").mockResolvedValue({ success: true });

      await permissionsMatrixService.setCustomPermission(5, "invoices.delete", "deny");

      expect(apiClient.put).toHaveBeenCalledWith("/roles/users/5/custom-permissions", {
        permission_key: "invoices.delete",
        action: "deny",
        reason: undefined,
      });
    });

    it("should omit reason when empty string provided", async () => {
      vi.spyOn(apiClient, "put").mockResolvedValue({ success: true });

      await permissionsMatrixService.setCustomPermission(5, "invoices.delete", "deny", "");

      expect(apiClient.put).toHaveBeenCalledWith("/roles/users/5/custom-permissions", {
        permission_key: "invoices.delete",
        action: "deny",
        reason: undefined,
      });
    });
  });

  describe("removeCustomPermission", () => {
    it("should remove a custom permission", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      const result = await permissionsMatrixService.removeCustomPermission(5, "invoices.create");

      expect(result).toEqual({ success: true });
      expect(apiClient.delete).toHaveBeenCalledWith("/roles/users/5/custom-permissions/invoices.create");
    });
  });
});
