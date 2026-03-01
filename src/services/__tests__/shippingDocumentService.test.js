import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api.js";
import { shippingDocumentService } from "../shippingDocumentService.js";

describe("shippingDocumentService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getShippingDocuments", () => {
    it("should fetch all shipping documents", async () => {
      const mockResponse = [
        { id: 1, status: "draft", documentType: "bill_of_lading" },
        { id: 2, status: "confirmed", documentType: "packing_list" },
      ];
      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.getShippingDocuments();

      expect(result).toBeTruthy();
      expect(result.length).toBe(2);
      expect(api.get).toHaveBeenCalledWith("/shipping-documents", { params: {} });
    });

    it("should pass filter params", async () => {
      vi.spyOn(api, "get").mockResolvedValue([]);

      await shippingDocumentService.getShippingDocuments({ status: "in_transit" });

      expect(api.get).toHaveBeenCalledWith("/shipping-documents", {
        params: { status: "in_transit" },
      });
    });
  });

  describe("getShippingDocument", () => {
    it("should fetch a single shipping document by ID", async () => {
      const mockResponse = {
        id: 1,
        status: "confirmed",
        documentType: "bill_of_lading",
      };
      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.getShippingDocument(1);

      expect(result.id).toBe(1);
      expect(api.get).toHaveBeenCalledWith("/shipping-documents/1");
    });
  });

  describe("createShippingDocument", () => {
    it("should create a new shipping document", async () => {
      const payload = { documentType: "bill_of_lading", shipmentId: 5 };
      const mockResponse = { id: 10, ...payload, status: "draft" };
      vi.spyOn(api, "post").mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.createShippingDocument(payload);

      expect(result.id).toBe(10);
      expect(api.post).toHaveBeenCalledWith("/shipping-documents", payload);
    });
  });

  describe("updateShippingDocument", () => {
    it("should update a shipping document", async () => {
      const updates = { status: "confirmed" };
      const mockResponse = { id: 1, status: "confirmed" };
      vi.spyOn(api, "put").mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.updateShippingDocument(1, updates);

      expect(result.status).toBe("confirmed");
      expect(api.put).toHaveBeenCalledWith("/shipping-documents/1", updates);
    });
  });

  describe("deleteShippingDocument", () => {
    it("should delete a shipping document", async () => {
      vi.spyOn(api, "delete").mockResolvedValue({ success: true });

      const result = await shippingDocumentService.deleteShippingDocument(1);

      expect(result.success).toBeTruthy();
      expect(api.delete).toHaveBeenCalledWith("/shipping-documents/1");
    });
  });

  describe("updateStatus", () => {
    it("should update shipping status", async () => {
      const mockResponse = { id: 1, status: "in_transit" };
      vi.spyOn(api, "patch").mockResolvedValue(mockResponse);

      const result = await shippingDocumentService.updateStatus(1, "in_transit", "Shipped via DHL");

      expect(result.status).toBe("in_transit");
      expect(api.patch).toHaveBeenCalledWith("/shipping-documents/1/status", {
        status: "in_transit",
        notes: "Shipped via DHL",
      });
    });
  });

  describe("getStatusOptions", () => {
    it("should return status options", () => {
      const options = shippingDocumentService.getStatusOptions();

      expect(Array.isArray(options)).toBeTruthy();
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toHaveProperty("value");
      expect(options[0]).toHaveProperty("label");
    });
  });
});
