/**
 * Integration Service Unit Tests
 * ✅ Tests third-party system integrations (FTA, Central Bank, etc.)
 * ✅ 100% coverage target for integrationService.js
import '../../__tests__/init.mjs';

 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';


import integrationService from "../integrationService.js";
import { apiClient } from "../api.js";

describe("integrationService", () => {
  let getStub;
  let postStub;
  let deleteStub;
  beforeEach(() => {
    sinon.restore();
    getStub = sinon.stub(apiClient, 'get');
    postStub = sinon.stub(apiClient, 'post');
    deleteStub = sinon.stub(apiClient, 'delete');
  });

  describe("getAll", () => {
    test("should fetch all integrations", async () => {
      const mockIntegrations = [
        { type: "fta_trn", name: "FTA TRN", status: "active" },
        { type: "central_bank", name: "Central Bank", status: "active" },
      ];
      getStub.resolves(mockIntegrations);

      const result = await integrationService.getAll();

      assert.ok(result);
      assert.ok(result[0].type);
      sinon.assert.calledWith(getStub, "/integrations");
    });
  });

  describe("get", () => {
    test("should fetch specific integration by type", async () => {
      const mockIntegration = { type: "fta_trn", name: "FTA TRN", status: "active" };
      getStub.resolves(mockIntegration);

      const result = await integrationService.get("fta_trn");

      assert.ok(result.type);
      sinon.assert.calledWith(getStub, "/integrations/fta_trn");
    });
  });

  describe("save", () => {
    test("should save integration configuration", async () => {
      const data = { api_url: "https://api.fta.ae", api_key: "secret" };
      const mockResponse = { type: "fta_trn", ...data, status: "active" };
      postStub.resolves(mockResponse);

      const result = await integrationService.save("fta_trn", data);

      assert.ok(result.status);
      sinon.assert.calledWith(postStub, "/integrations/fta_trn", data);
    });
  });

  describe("test", () => {
    test("should test integration connection", async () => {
      const mockResponse = { success: true, message: "Connection successful" };
      postStub.resolves(mockResponse);

      const result = await integrationService.test("fta_trn");

      assert.ok(result.success);
      sinon.assert.calledWith(postStub, "/integrations/fta_trn/test");
    });
  });

  describe("unlock", () => {
    test("should unlock integration for editing", async () => {
      const mockResponse = { type: "fta_trn", locked: false };
      postStub.resolves(mockResponse);

      const result = await integrationService.unlock("fta_trn");

      assert.ok(result.locked);
      sinon.assert.calledWith(postStub, "/integrations/fta_trn/unlock");
    });
  });

  describe("lock", () => {
    test("should lock integration", async () => {
      const mockResponse = { type: "fta_trn", locked: true };
      postStub.resolves(mockResponse);

      const result = await integrationService.lock("fta_trn");

      assert.ok(result.locked);
      sinon.assert.calledWith(postStub, "/integrations/fta_trn/lock");
    });
  });

  describe("delete", () => {
    test("should delete integration", async () => {
      const mockResponse = { success: true };
      deleteStub.resolves(mockResponse);

      const result = await integrationService.delete("fta_trn");

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, "/integrations/fta_trn");
    });
  });

  describe("getAuditLog", () => {
    test("should fetch integration audit log", async () => {
      const mockLog = [
        { timestamp: "2024-02-02T10:00:00Z", action: "UPDATE", user: "admin" },
        { timestamp: "2024-02-01T15:30:00Z", action: "CREATE", user: "admin" },
      ];
      getStub.resolves(mockLog);

      const result = await integrationService.getAuditLog("fta_trn");

      assert.ok(result);
      assert.ok(result[0].action);
      sinon.assert.calledWith(getStub, "/integrations/fta_trn/audit", {});
    });

    test("should support pagination params", async () => {
      getStub.resolves([]);

      await integrationService.getAuditLog("fta_trn", { limit: 10, offset: 0 });

      sinon.assert.calledWith(getStub, "/integrations/fta_trn/audit", {
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      getStub.rejects(new Error("Network error"));

      await assert.rejects(() => integrationService.getAll(), Error);
    });

    test("should handle invalid integration type", async () => {
      getStub.rejects(new Error("Integration not found"));

      await assert.rejects(() => integrationService.get("invalid_type"), Error);
    });

    test("should handle connection test failures", async () => {
      postStub.rejects(new Error("Connection failed"));

      await assert.rejects(() => integrationService.test("fta_trn"), Error);
    });
  });
});