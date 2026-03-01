/**
 * Template Service Unit Tests
 * Tests template management operations (invoices, delivery notes, etc.)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api.js";
import { templateService } from "../templateService.js";

describe("templateService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTemplates", () => {
    it("should get all templates", async () => {
      const mockTemplates = [
        { id: 1, name: "Invoice Standard", type: "invoice", status: "active" },
        { id: 2, name: "Delivery Note Default", type: "delivery", status: "active" },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValue(mockTemplates);

      const result = await templateService.getTemplates();

      expect(result).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/templates");
    });

    it("should handle empty template list", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue([]);

      const result = await templateService.getTemplates();

      expect(result).toBeTruthy();
    });

    it("should handle API errors", async () => {
      const error = new Error("Network error");
      vi.spyOn(apiClient, "get").mockRejectedValue(error);

      await expect(templateService.getTemplates()).rejects.toThrow();
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockTemplate);

      const result = await templateService.getTemplate(1);

      expect(result).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/templates/1");
    });

    it("should handle template not found", async () => {
      const error = new Error("Not found");
      vi.spyOn(apiClient, "get").mockRejectedValue(error);

      await expect(templateService.getTemplate(999)).rejects.toThrow();
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

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await templateService.createTemplate(templateData);

      expect(result).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalledWith("/templates", templateData);
    });

    it("should handle creation errors", async () => {
      const error = new Error("Invalid template");
      vi.spyOn(apiClient, "post").mockRejectedValue(error);

      await expect(templateService.createTemplate({})).rejects.toThrow();
    });
  });

  describe("updateTemplate", () => {
    it("should update existing template", async () => {
      const updateData = {
        name: "Updated Invoice",
        content: "<html>Updated content</html>",
      };

      const mockResponse = { id: 1, ...updateData, status: "active", type: "invoice" };

      vi.spyOn(apiClient, "put").mockResolvedValue(mockResponse);

      const result = await templateService.updateTemplate(1, updateData);

      expect(result).toBeTruthy();
      expect(apiClient.put).toHaveBeenCalledWith("/templates/1", updateData);
    });

    it("should handle update errors", async () => {
      const error = new Error("Template in use");
      vi.spyOn(apiClient, "put").mockRejectedValue(error);

      await expect(templateService.updateTemplate(1, {})).rejects.toThrow();
    });
  });

  describe("deleteTemplate", () => {
    it("should delete template", async () => {
      const mockResponse = { id: 1, deleted: true };

      vi.spyOn(apiClient, "delete").mockResolvedValue(mockResponse);

      const result = await templateService.deleteTemplate(1);

      expect(result).toBeTruthy();
      expect(apiClient.delete).toHaveBeenCalledWith("/templates/1");
    });

    it("should handle deletion errors", async () => {
      const error = new Error("Cannot delete default template");
      vi.spyOn(apiClient, "delete").mockRejectedValue(error);

      await expect(templateService.deleteTemplate(1)).rejects.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should propagate all API errors", async () => {
      const error = new Error("Server error");
      vi.spyOn(apiClient, "get").mockRejectedValue(error);

      await expect(templateService.getTemplates()).rejects.toThrow();
    });
  });
});
