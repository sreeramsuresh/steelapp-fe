import { beforeEach, describe, expect, it, vi } from "vitest";
import { templateService } from "../templateService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("templateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTemplates", () => {
    it("should fetch all document templates", async () => {
      const mockResponse = [
        {
          id: 1,
          name: "Invoice Standard",
          type: "invoice",
          status: "active",
        },
        {
          id: 2,
          name: "Purchase Order",
          type: "purchase_order",
          status: "active",
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await templateService.getTemplates();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("invoice");
      expect(api.get).toHaveBeenCalledWith("/templates", { params: {} });
    });

    it("should filter by template type", async () => {
      api.get.mockResolvedValue([]);

      await templateService.getTemplates({ type: "invoice" });

      expect(api.get).toHaveBeenCalledWith(
        "/templates",
        expect.objectContaining({
          params: { type: "invoice" },
        })
      );
    });
  });

  describe("getTemplate", () => {
    it("should fetch template with layout and variables", async () => {
      const mockResponse = {
        id: 1,
        name: "Invoice Standard",
        type: "invoice",
        layout: "<div>Invoice Template</div>",
        variables: ["invoice_number", "date", "customer_name", "items"],
        status: "active",
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await templateService.getTemplate(1);

      expect(result.type).toBe("invoice");
      expect(result.variables).toContain("invoice_number");
      expect(api.get).toHaveBeenCalledWith("/templates/1");
    });
  });

  describe("createTemplate", () => {
    it("should create new document template", async () => {
      const mockResponse = {
        id: 1,
        name: "Custom Invoice",
        type: "invoice",
        status: "pending",
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        name: "Custom Invoice",
        type: "invoice",
        layout: "<div>Template HTML</div>",
      };

      const result = await templateService.createTemplate(payload);

      expect(result.name).toBe("Custom Invoice");
      expect(api.post).toHaveBeenCalledWith("/templates", payload);
    });
  });

  describe("updateTemplate", () => {
    it("should update template layout and variables", async () => {
      const mockResponse = {
        id: 1,
        name: "Invoice Standard",
        layout: "<div>Updated Template</div>",
      };

      api.put.mockResolvedValue(mockResponse);

      const payload = { layout: "<div>Updated Template</div>" };

      const result = await templateService.updateTemplate(1, payload);

      expect(result.layout).toContain("Updated");
      expect(api.put).toHaveBeenCalledWith("/templates/1", payload);
    });
  });

  describe("deleteTemplate", () => {
    it("should delete template", async () => {
      api.delete.mockResolvedValue({ success: true });

      const result = await templateService.deleteTemplate(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/templates/1");
    });
  });

  describe("previewTemplate", () => {
    it("should generate template preview with sample data", async () => {
      const mockResponse = {
        html: "<div>Invoice Preview</div>",
        preview_url: "/previews/template-1.html",
      };

      api.post.mockResolvedValue(mockResponse);

      const sampleData = {
        invoice_number: "INV-001",
        date: "2024-01-15",
        items: [],
      };

      const result = await templateService.previewTemplate(1, sampleData);

      expect(result.html).toContain("Invoice");
      expect(api.post).toHaveBeenCalledWith(
        "/templates/1/preview",
        expect.any(Object)
      );
    });
  });

  describe("cloneTemplate", () => {
    it("should clone existing template", async () => {
      const mockResponse = {
        id: 2,
        name: "Invoice Standard (Copy)",
        type: "invoice",
        status: "active",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await templateService.cloneTemplate(1, {
        name: "Invoice Standard (Copy)",
      });

      expect(result.id).toBe(2);
      expect(api.post).toHaveBeenCalledWith(
        "/templates/1/clone",
        expect.any(Object)
      );
    });
  });
});
