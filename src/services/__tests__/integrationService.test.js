/**
 * Integration Service Unit Tests
 * ✅ Tests third-party system integrations (FTA, Central Bank, etc.)
 * ✅ 100% coverage target for integrationService.js
*/

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import integrationService from "../integrationService.js";
import { apiClient } from "../api.js";

describe("integrationService", () => {
  let getStub;
  let postStub;
  let deleteStub;
  beforeEach(() => {
    vi.restoreAllMocks();
    getStub = vi.spyOn(apiClient, 'get');
    postStub = vi.spyOn(apiClient, 'post');
    deleteStub = vi.spyOn(apiClient, 'delete');
  });

  describe("getAll", () => {
    it("should fetch all integrations", async () => {
      const mockIntegrations = [
        { type: "fta_trn", name: "FTA TRN", status: "active" },
        { type: "central_bank", name: "Central Bank", status: "active" },
      ];
      getStub.mockResolvedValue(mockIntegrations);

      const result = await integrationService.getAll();

      expect(result).toBeTruthy();
      expect(result[0].type).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/integrations");
    });
  });

  describe("get", () => {
    it("should fetch specific integration by type", async () => {
      const mockIntegration = { type: "fta_trn", name: "FTA TRN", status: "active" };
      getStub.mockResolvedValue(mockIntegration);

      const result = await integrationService.get("fta_trn");

      expect(result.type).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/integrations/fta_trn");
    });
  });

  describe("save", () => {
    it("should save integration configuration", async () => {
      const data = { api_url: "https://api.fta.ae", api_key: "secret" };
      const mockResponse = { type: "fta_trn", ...data, status: "active" };
      postStub.mockResolvedValue(mockResponse);

      const result = await integrationService.save("fta_trn", data);

      expect(result.status).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/integrations/fta_trn", data);
    });
  });

  describe("test", () => {
    it("should test integration connection", async () => {
      const mockResponse = { success: true, message: "Connection successful" };
      postStub.mockResolvedValue(mockResponse);

      const result = await integrationService.test("fta_trn");

      expect(result.success).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/integrations/fta_trn/test");
    });
  });

  describe("unlock", () => {
    it("should unlock integration for editing", async () => {
      const mockResponse = { type: "fta_trn", locked: false };
      postStub.mockResolvedValue(mockResponse);

      const result = await integrationService.unlock("fta_trn");

      expect(result.locked).toBe(false);
      expect(postStub).toHaveBeenCalledWith("/integrations/fta_trn/unlock");
    });
  });

  describe("lock", () => {
    it("should lock integration", async () => {
      const mockResponse = { type: "fta_trn", locked: true };
      postStub.mockResolvedValue(mockResponse);

      const result = await integrationService.lock("fta_trn");

      expect(result.locked).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/integrations/fta_trn/lock");
    });
  });

  describe("delete", () => {
    it("should delete integration", async () => {
      const mockResponse = { success: true };
      deleteStub.mockResolvedValue(mockResponse);

      const result = await integrationService.delete("fta_trn");

      expect(result.success).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith("/integrations/fta_trn");
    });
  });

  describe("getAuditLog", () => {
    it("should fetch integration audit log", async () => {
      const mockLog = [
        { timestamp: "2024-02-02T10:00:00Z", action: "UPDATE", user: "admin" },
        { timestamp: "2024-02-01T15:30:00Z", action: "CREATE", user: "admin" },
      ];
      getStub.mockResolvedValue(mockLog);

      const result = await integrationService.getAuditLog("fta_trn");

      expect(result).toBeTruthy();
      expect(result[0].action).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/integrations/fta_trn/audit", {});
    });

    it("should support pagination params", async () => {
      getStub.mockResolvedValue([]);

      await integrationService.getAuditLog("fta_trn", { limit: 10, offset: 0 });

      expect(getStub).toHaveBeenCalledWith("/integrations/fta_trn/audit", {
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      getStub.mockRejectedValue(new Error("Network error"));

      await expect(integrationService.getAll()).rejects.toThrow();
    });

    it("should handle invalid integration type", async () => {
      getStub.mockRejectedValue(new Error("Integration not found"));

      await expect(integrationService.get("invalid_type")).rejects.toThrow();
    });

    it("should handle connection test failures", async () => {
      postStub.mockRejectedValue(new Error("Connection failed"));

      await expect(integrationService.test("fta_trn")).rejects.toThrow();
    });
  });
});