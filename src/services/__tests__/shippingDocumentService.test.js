/**
 * Shipping Document Service Unit Tests
 * Tests packing lists, shipping labels, and export documents
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from "../api";
import shippingDocumentService from "../shippingDocumentService";

describe("shippingDocumentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getShippingDocuments", () => {
    test("should fetch shipping documents", async () => {
      const mockResponse = {
        data: [{ id: 1, docNumber: "SHP-001", type: "PACKING_LIST", status: "DRAFT" }],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await shippingDocumentService.getShippingDocuments({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe("PACKING_LIST");
    });

    test("should filter by document type", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await shippingDocumentService.getShippingDocuments({ type: "INVOICE" });

      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("getShippingDocument", () => {
    test("should fetch shipping document", async () => {
      const mockResponse = {
        id: 1,
        docNumber: "SHP-001",
        type: "PACKING_LIST",
        items: [{ description: "Product", quantity: 100 }],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await shippingDocumentService.getShippingDocument(1);

      expect(result.type).toBe("PACKING_LIST");
      expect(result.items).toBeDefined();
    });
  });

  describe("createShippingDocument", () => {
    test("should create shipping document", async () => {
      const docData = { type: "PACKING_LIST", items: [] };
      apiClient.post.mockResolvedValueOnce({ id: 1, docNumber: "SHP-001" });

      const result = await shippingDocumentService.createShippingDocument(docData);

      expect(result.id).toBe(1);
    });
  });

  describe("updateShippingDocument", () => {
    test("should update document", async () => {
      const updateData = { status: "READY" };
      apiClient.put.mockResolvedValueOnce({ id: 1, ...updateData });

      const result = await shippingDocumentService.updateShippingDocument(1, updateData);

      expect(result.status).toBe("READY");
    });
  });

  describe("Document Types", () => {
    test("should support various document types", async () => {
      const mockResponse = { id: 1, type: "PACKING_LIST" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await shippingDocumentService.getShippingDocument(1);

      expect(["PACKING_LIST", "INVOICE", "CERTIFICATE", "LABEL"]).toContain(result.type);
    });
  });

  describe("Error Handling", () => {
    test("should handle errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Error"));

      await expect(shippingDocumentService.getShippingDocuments()).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty items", async () => {
      const mockResponse = { id: 1, items: [] };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await shippingDocumentService.getShippingDocument(1);

      expect(result.items).toEqual([]);
    });
  });
});
