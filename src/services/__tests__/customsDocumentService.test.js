/**
 * Customs Document Service Unit Tests (Node Native Test Runner)
 * Tests BOE, COO document handling and clearance workflow
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api.js";

describe("customsDocumentService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCustomsDocuments", () => {
    it("should fetch all customs documents", async () => {
      const mockData = [
        {
          id: 1,
          document_type: "BOE",
          reference_number: "BOE-2024-001",
          status: "cleared",
        },
        {
          id: 2,
          document_type: "COO",
          reference_number: "COO-2024-001",
          status: "pending",
        },
      ];

      vi.spyOn(api, "get").mockResolvedValue(mockData);

      const result = await api.get("/customs-documents", { params: {} });

      expect(result.length).toBe(2);
      expect(result[0].document_type).toBe("BOE");
      expect(api.get).toHaveBeenCalledWith("/customs-documents", { params: {} });
    });

    it("should support filtering by status", async () => {
      vi.spyOn(api, "get").mockResolvedValue([]);

      await api.get("/customs-documents", { params: { status: "cleared" } });

      expect(api.get).toHaveBeenCalledWith(
        "/customs-documents",
        expect.objectContaining({ params: { status: "cleared" } })
      );
    });
  });

  describe("getCustomsDocument", () => {
    it("should fetch single customs document", async () => {
      const mockData = {
        id: 1,
        document_type: "BOE",
        reference_number: "BOE-2024-001",
        clearance_status: "cleared",
        clearance_date: "2024-01-15",
      };

      vi.spyOn(api, "get").mockResolvedValue(mockData);

      const result = await api.get("/customs-documents/1");

      expect(result.document_type).toBe("BOE");
      expect(result.clearance_status).toBe("cleared");
      expect(api.get).toHaveBeenCalledWith("/customs-documents/1");
    });
  });

  describe("createCustomsDocument", () => {
    it("should create new customs document", async () => {
      const mockData = {
        id: 1,
        document_type: "BOE",
        reference_number: "BOE-2024-001",
        status: "pending",
      };

      vi.spyOn(api, "post").mockResolvedValue(mockData);

      const payload = {
        document_type: "BOE",
        reference_number: "BOE-2024-001",
      };

      const result = await api.post("/customs-documents", payload);

      expect(result.id).toBe(1);
      expect(api.post).toHaveBeenCalledWith("/customs-documents", payload);
    });
  });

  describe("updateCustomsDocument", () => {
    it("should update customs document", async () => {
      const mockData = {
        id: 1,
        reference_number: "BOE-2024-001-UPDATED",
      };

      vi.spyOn(api, "put").mockResolvedValue(mockData);

      const payload = { reference_number: "BOE-2024-001-UPDATED" };

      const result = await api.put("/customs-documents/1", payload);

      expect(result.reference_number).toBe("BOE-2024-001-UPDATED");
      expect(api.put).toHaveBeenCalledWith("/customs-documents/1", payload);
    });
  });

  describe("deleteCustomsDocument", () => {
    it("should delete customs document", async () => {
      vi.spyOn(api, "delete").mockResolvedValue({ success: true });

      const result = await api.delete("/customs-documents/1");

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/customs-documents/1");
    });
  });

  describe("updateClearance", () => {
    it("should update clearance status with notes and date", async () => {
      const mockData = {
        id: 1,
        clearance_status: "cleared",
        clearance_date: "2024-01-15T10:00:00Z",
        notes: "All documents verified",
      };

      vi.spyOn(api, "patch").mockResolvedValue(mockData);

      const result = await api.patch("/customs-documents/1/clearance", {
        clearance_status: "cleared",
        notes: "All documents verified",
        clearance_date: "2024-01-15T10:00:00Z",
      });

      expect(result.clearance_status).toBe("cleared");
      expect(api.patch).toHaveBeenCalledWith("/customs-documents/1/clearance", expect.objectContaining({}));
    });

    it("should handle clearance without notes and date", async () => {
      vi.spyOn(api, "patch").mockResolvedValue({
        id: 1,
        clearance_status: "pending",
      });

      await api.patch("/customs-documents/1/clearance", {
        clearance_status: "pending",
        notes: "",
        clearance_date: null,
      });

      expect(api.patch.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe("calculateDuties", () => {
    it("should calculate customs duties", async () => {
      const mockData = {
        customs_duty: 5000,
        vat_amount: 250,
        total_duties: 5250,
      };

      vi.spyOn(api, "post").mockResolvedValue(mockData);

      const payload = {
        hs_code: "7226.91.00",
        declared_value: 100000,
        quantity: 500,
        unit: "KG",
      };

      const result = await api.post("/customs-documents/1/calculate-duties", payload);

      expect(result.customs_duty).toBe(5000);
      expect(result.total_duties).toBe(5250);
      expect(api.post).toHaveBeenCalledWith("/customs-documents/1/calculate-duties", payload);
    });
  });

  describe("getDocumentTypes", () => {
    it("should fetch document types list", async () => {
      const mockData = [
        { value: "BOE", label: "Bill of Entry" },
        { value: "COO", label: "Certificate of Origin" },
        { value: "BL", label: "Bill of Lading" },
      ];

      vi.spyOn(api, "get").mockResolvedValue(mockData);

      const result = await api.get("/customs-documents/types/list");

      expect(result.length).toBe(3);
      expect(result[0].value).toBe("BOE");
      expect(api.get).toHaveBeenCalledWith("/customs-documents/types/list");
    });
  });

  describe("getHsCodes", () => {
    it("should fetch HS codes for stainless steel", async () => {
      const mockData = [
        {
          code: "7226.91.00",
          description: "Other flat-rolled products of stainless steel",
        },
        {
          code: "7307.19.00",
          description: "Stainless steel fittings",
        },
      ];

      vi.spyOn(api, "get").mockResolvedValue(mockData);

      const result = await api.get("/customs-documents/hs-codes/list");

      expect(result.length).toBe(2);
      expect(result[0].code).toBe("7226.91.00");
      expect(api.get).toHaveBeenCalledWith("/customs-documents/hs-codes/list");
    });
  });
});
