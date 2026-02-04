/**
 * Integration Service Unit Tests
 * ✅ Tests third-party system integrations (FTA, Central Bank, etc.)
 * ✅ 100% coverage target for integrationService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";


import integrationService from "../integrationService.js";
import { apiClient } from "../api.js";

describe("integrationService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getAll", () => {
    test("should fetch all integrations", async () => {
      const mockIntegrations = [
        { type: "fta_trn", name: "FTA TRN", status: "active" },
        { type: "central_bank", name: "Central Bank", status: "active" },
      ];
      apiClient.get.mockResolvedValueOnce(mockIntegrations);

      const result = await integrationService.getAll();

      assert.ok(result);
      assert.ok(result[0].type);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/integrations");
    });
  });

  describe("get", () => {
    test("should fetch specific integration by type", async () => {
      const mockIntegration = { type: "fta_trn", name: "FTA TRN", status: "active" };
      apiClient.get.mockResolvedValueOnce(mockIntegration);

      const result = await integrationService.get("fta_trn");

      assert.ok(result.type);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/integrations/fta_trn");
    });
  });

  describe("save", () => {
    test("should save integration configuration", async () => {
      const data = { api_url: "https://api.fta.ae", api_key: "secret" };
      const mockResponse = { type: "fta_trn", ...data, status: "active" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.save("fta_trn", data);

      assert.ok(result.status);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/integrations/fta_trn", data);
    });
  });

  describe("test", () => {
    test("should test integration connection", async () => {
      const mockResponse = { success: true, message: "Connection successful" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.test("fta_trn");

      assert.ok(result.success);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/integrations/fta_trn/test");
    });
  });

  describe("unlock", () => {
    test("should unlock integration for editing", async () => {
      const mockResponse = { type: "fta_trn", locked: false };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.unlock("fta_trn");

      assert.ok(result.locked);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/integrations/fta_trn/unlock");
    });
  });

  describe("lock", () => {
    test("should lock integration", async () => {
      const mockResponse = { type: "fta_trn", locked: true };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.lock("fta_trn");

      assert.ok(result.locked);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/integrations/fta_trn/lock");
    });
  });

  describe("delete", () => {
    test("should delete integration", async () => {
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.delete("fta_trn");

      assert.ok(result.success);
      assert.ok(apiClient.delete).toHaveBeenCalledWith("/integrations/fta_trn");
    });
  });

  describe("getAuditLog", () => {
    test("should fetch integration audit log", async () => {
      const mockLog = [
        { timestamp: "2024-02-02T10:00:00Z", action: "UPDATE", user: "admin" },
        { timestamp: "2024-02-01T15:30:00Z", action: "CREATE", user: "admin" },
      ];
      apiClient.get.mockResolvedValueOnce(mockLog);

      const result = await integrationService.getAuditLog("fta_trn");

      assert.ok(result);
      assert.ok(result[0].action);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/integrations/fta_trn/audit", {});
    });

    test("should support pagination params", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await integrationService.getAuditLog("fta_trn", { limit: 10, offset: 0 });

      assert.ok(apiClient.get).toHaveBeenCalledWith("/integrations/fta_trn/audit", {
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(integrationService.getAll(), Error);
    });

    test("should handle invalid integration type", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Integration not found"));

      assert.rejects(integrationService.get("invalid_type"), Error);
    });

    test("should handle connection test failures", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Connection failed"));

      assert.rejects(integrationService.test("fta_trn"), Error);
    });
  });
});