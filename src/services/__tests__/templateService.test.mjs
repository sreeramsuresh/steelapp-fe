/**
 * Template Service Unit Tests
 * Tests template management operations (invoices, delivery notes, etc.)
 */

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

      apiClient.get.mockResolvedValueOnce(mockTemplates);

      const result = await templateService.getTemplates();

      assert.ok(result).toEqual(mockTemplates);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/templates");
    });

    test("should handle empty template list", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await templateService.getTemplates();

      assert.ok(result).toEqual([]);
    });

    test("should handle API errors", async () => {
      const error = new Error("Network error");
      apiClient.get.mockRejectedValueOnce(error);

      assert.rejects(templateService.getTemplates(), Error);
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

      apiClient.get.mockResolvedValueOnce(mockTemplate);

      const result = await templateService.getTemplate(1);

      assert.ok(result).toEqual(mockTemplate);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/templates/1");
    });

    test("should handle template not found", async () => {
      const error = new Error("Not found");
      apiClient.get.mockRejectedValueOnce(error);

      assert.rejects(templateService.getTemplate(999), Error);
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

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await templateService.createTemplate(templateData);

      assert.ok(result).toEqual(mockResponse);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/templates", templateData);
    });

    test("should handle creation errors", async () => {
      const error = new Error("Invalid template");
      apiClient.post.mockRejectedValueOnce(error);

      assert.rejects(templateService.createTemplate({}), Error);
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

      assert.ok(result).toEqual(mockResponse);
      assert.ok(apiClient.put).toHaveBeenCalledWith("/templates/1", updateData);
    });

    test("should handle update errors", async () => {
      const error = new Error("Template in use");
      apiClient.put.mockRejectedValueOnce(error);

      assert.rejects(templateService.updateTemplate(1, {}), Error);
    });
  });

  describe("deleteTemplate", () => {
    test("should delete template", async () => {
      const mockResponse = { id: 1, deleted: true };

      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await templateService.deleteTemplate(1);

      assert.ok(result).toEqual(mockResponse);
      assert.ok(apiClient.delete).toHaveBeenCalledWith("/templates/1");
    });

    test("should handle deletion errors", async () => {
      const error = new Error("Cannot delete default template");
      apiClient.delete.mockRejectedValueOnce(error);

      assert.rejects(templateService.deleteTemplate(1), Error);
    });
  });

  describe("Error Handling", () => {
    test("should propagate all API errors", async () => {
      const error = new Error("Server error");
      apiClient.get.mockRejectedValueOnce(error);

      assert.rejects(templateService.getTemplates(), Error);
    });
  });
});