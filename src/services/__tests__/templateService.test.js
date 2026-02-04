/**
 * Template Service Unit Tests
 * Tests template management operations (invoices, delivery notes, etc.)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import { templateService } from "../templateService.js";

describe("templateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTemplates", () => {
    it("should get all templates", async () => {
      const mockTemplates = [
        { id: 1, name: "Invoice Standard", type: "invoice", status: "active" },
        { id: 2, name: "Delivery Note Default", type: "delivery", status: "active" },
      ];

      apiClient.get.mockResolvedValueOnce(mockTemplates);

      const result = await templateService.getTemplates();

      expect(result).toEqual(mockTemplates);
      expect(apiClient.get).toHaveBeenCalledWith("/templates");
    });

    it("should handle empty template list", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await templateService.getTemplates();

      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      const error = new Error("Network error");
      apiClient.get.mockRejectedValueOnce(error);

      await expect(templateService.getTemplates()).rejects.toThrow("Network error");
    });
  });

  describe("getTemplate", () => {
    it("should get single template by ID", async () => {
      const mockTemplate = {
        id: 1,
        name: "Invoice Standard",
        type: "invoice",
        status: "active",
        content: "<html>...</html>",
      };

      apiClient.get.mockResolvedValueOnce(mockTemplate);

      const result = await templateService.getTemplate(1);

      expect(result).toEqual(mockTemplate);
      expect(apiClient.get).toHaveBeenCalledWith("/templates/1");
    });

    it("should handle template not found", async () => {
      const error = new Error("Not found");
      apiClient.get.mockRejectedValueOnce(error);

      await expect(templateService.getTemplate(999)).rejects.toThrow("Not found");
    });
  });

  describe("createTemplate", () => {
    it("should create new template", async () => {
      const templateData = {
        name: "Custom Invoice",
        type: "invoice",
        content: "<html>Custom content</html>",
      };

      const mockResponse = { id: 10, ...templateData, status: "active" };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await templateService.createTemplate(templateData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith("/templates", templateData);
    });

    it("should handle creation errors", async () => {
      const error = new Error("Invalid template");
      apiClient.post.mockRejectedValueOnce(error);

      await expect(templateService.createTemplate({})).rejects.toThrow("Invalid template");
    });
  });

  describe("updateTemplate", () => {
    it("should update existing template", async () => {
      const updateData = {
        name: "Updated Invoice",
        content: "<html>Updated content</html>",
      };

      const mockResponse = { id: 1, ...updateData, status: "active", type: "invoice" };

      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await templateService.updateTemplate(1, updateData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith("/templates/1", updateData);
    });

    it("should handle update errors", async () => {
      const error = new Error("Template in use");
      apiClient.put.mockRejectedValueOnce(error);

      await expect(templateService.updateTemplate(1, {})).rejects.toThrow("Template in use");
    });
  });

  describe("deleteTemplate", () => {
    it("should delete template", async () => {
      const mockResponse = { id: 1, deleted: true };

      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await templateService.deleteTemplate(1);

      expect(result).toEqual(mockResponse);
      expect(apiClient.delete).toHaveBeenCalledWith("/templates/1");
    });

    it("should handle deletion errors", async () => {
      const error = new Error("Cannot delete default template");
      apiClient.delete.mockRejectedValueOnce(error);

      await expect(templateService.deleteTemplate(1)).rejects.toThrow("Cannot delete default template");
    });
  });

  describe("Error Handling", () => {
    it("should propagate all API errors", async () => {
      const error = new Error("Server error");
      apiClient.get.mockRejectedValueOnce(error);

      await expect(templateService.getTemplates()).rejects.toThrow("Server error");
    });
  });
});
