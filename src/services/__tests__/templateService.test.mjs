/**
 * Template Service Unit Tests
 * Tests template management operations (invoices, delivery notes, etc.)
 */
import '../../__tests__/init.mjs';


import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';


import { templateService } from "../templateService.js";
import { apiClient } from "../api.js";

describe("templateService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getTemplates", () => {
    test("should get all templates", async () => {
      const mockTemplates = [
        { id: 1, name: "Invoice Standard", type: "invoice", status: "active" },
        { id: 2, name: "Delivery Note Default", type: "delivery", status: "active" },
      ];

      sinon.stub(apiClient, "get").resolves(mockTemplates);

      const result = await templateService.getTemplates();

      assert.ok(result);
      sinon.assert.calledWith(apiClient.get, "/templates");
    });

    test("should handle empty template list", async () => {
      sinon.stub(apiClient, "get").resolves([]);

      const result = await templateService.getTemplates();

      assert.ok(result);
    });

    test("should handle API errors", async () => {
      const error = new Error("Network error");
      sinon.stub(apiClient, "get").rejects(error);

      await assert.rejects(() => templateService.getTemplates(), Error);
    });
  });

  describe("getTemplate", () => {
    test("should get single template by ID", async () => {
      const mockTemplate = {
        id: 1,
        name: "Invoice Standard",
        type: "invoice",
        status: "active",
        content: "<html>...</html>",
      };

      sinon.stub(apiClient, "get").resolves(mockTemplate);

      const result = await templateService.getTemplate(1);

      assert.ok(result);
      sinon.assert.calledWith(apiClient.get, "/templates/1");
    });

    test("should handle template not found", async () => {
      const error = new Error("Not found");
      sinon.stub(apiClient, "get").rejects(error);

      await assert.rejects(() => templateService.getTemplate(999), Error);
    });
  });

  describe("createTemplate", () => {
    test("should create new template", async () => {
      const templateData = {
        name: "Custom Invoice",
        type: "invoice",
        content: "<html>Custom content</html>",
      };

      const mockResponse = { id: 10, ...templateData, status: "active" };

      sinon.stub(apiClient, "post").resolves(mockResponse);

      const result = await templateService.createTemplate(templateData);

      assert.ok(result);
      sinon.assert.calledWith(apiClient.post, "/templates", templateData);
    });

    test("should handle creation errors", async () => {
      const error = new Error("Invalid template");
      sinon.stub(apiClient, "post").rejects(error);

      await assert.rejects(() => templateService.createTemplate({}), Error);
    });
  });

  describe("updateTemplate", () => {
    test("should update existing template", async () => {
      const updateData = {
        name: "Updated Invoice",
        content: "<html>Updated content</html>",
      };

      const mockResponse = { id: 1, ...updateData, status: "active", type: "invoice" };

      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await templateService.updateTemplate(1, updateData);

      assert.ok(result);
      sinon.assert.calledWith(apiClient.put, "/templates/1", updateData);
    });

    test("should handle update errors", async () => {
      const error = new Error("Template in use");
      apiClient.put.mockRejectedValueOnce(error);

      await assert.rejects(() => templateService.updateTemplate(1, {}), Error);
    });
  });

  describe("deleteTemplate", () => {
    test("should delete template", async () => {
      const mockResponse = { id: 1, deleted: true };

      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await templateService.deleteTemplate(1);

      assert.ok(result);
      sinon.assert.calledWith(apiClient.delete, "/templates/1");
    });

    test("should handle deletion errors", async () => {
      const error = new Error("Cannot delete default template");
      apiClient.delete.mockRejectedValueOnce(error);

      await assert.rejects(() => templateService.deleteTemplate(1), Error);
    });
  });

  describe("Error Handling", () => {
    test("should propagate all API errors", async () => {
      const error = new Error("Server error");
      sinon.stub(apiClient, "get").rejects(error);

      await assert.rejects(() => templateService.getTemplates(), Error);
    });
  });
});