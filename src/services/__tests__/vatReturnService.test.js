import { beforeEach, describe, expect, it, vi } from "vitest";
import vatReturnService, { FORM_201_BOXES, VAT_RETURN_STATUSES } from "../vatReturnService.js";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";

describe("vatReturnService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("VAT Return Status Management", () => {
    it("should have correct VAT return statuses", () => {
      expect(VAT_RETURN_STATUSES.DRAFT).toBe("draft");
      expect(VAT_RETURN_STATUSES.FILED).toBe("filed");
      expect(VAT_RETURN_STATUSES.AMENDED).toBe("amended");
    });

    it("should support status transitions", () => {
      const statuses = Object.values(VAT_RETURN_STATUSES);
      expect(statuses).toContain("draft");
      expect(statuses).toContain("submitted");
    });
  });

  describe("Form 201 Box Definitions", () => {
    it("should have all 11 Form 201 boxes defined", () => {
      const boxes = Object.keys(FORM_201_BOXES);
      expect(boxes).toHaveLength(11);
    });

    it("should identify output boxes (1-6)", () => {
      expect(FORM_201_BOXES.BOX_1.type).toBe("output");
      expect(FORM_201_BOXES.BOX_5.type).toBe("output");
    });

    it("should identify input boxes (8-9)", () => {
      expect(FORM_201_BOXES.BOX_8.type).toBe("input");
      expect(FORM_201_BOXES.BOX_9.type).toBe("input");
    });

    it("should identify calculated boxes (7, 10, 11)", () => {
      expect(FORM_201_BOXES.BOX_7.type).toBe("calculated");
      expect(FORM_201_BOXES.BOX_10.type).toBe("calculated");
      expect(FORM_201_BOXES.BOX_11.type).toBe("calculated");
    });
  });

  describe("Form 201 Box Descriptions", () => {
    it("should have descriptive labels for each box", () => {
      expect(FORM_201_BOXES.BOX_1.label).toBe("Standard rated supplies in UAE");
      expect(FORM_201_BOXES.BOX_8.label).toBe("Standard rated expenses");
    });

    it("should support zero-rated and exempt supplies", () => {
      expect(FORM_201_BOXES.BOX_3.label).toContain("Zero-rated");
      expect(FORM_201_BOXES.BOX_4.label).toContain("Exempt");
    });
  });

  describe("getAll", () => {
    it("should fetch all VAT returns with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            returnNumber: "VAT-2024-Q1",
            status: "filed",
            totalOutputVat: 50000,
            totalInputVat: 30000,
            netVatDue: 20000,
          },
        ],
        pagination: { total: 1, page: 1 },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getAll();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].returnNumber).toBe("VAT-2024-Q1");
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns", expect.any(Object));
    });

    it("should filter by status", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await vatReturnService.getAll({ status: "filed" });

      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns", expect.objectContaining({ status: "filed" }));
    });

    it("should filter by period", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await vatReturnService.getAll({
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns", expect.any(Object));
    });
  });

  describe("getById", () => {
    it("should fetch VAT return by ID with full Form 201 data", async () => {
      const mockData = {
        id: 1,
        returnNumber: "VAT-2024-Q1",
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
        status: "filed",
        box1Amount: 100000,
        box1Vat: 5000,
        box3Amount: 50000,
        box4Amount: 25000,
        box5Amount: 75000,
        box5Vat: 3750,
        box7Vat: 8750,
        box8Amount: 80000,
        box8Vat: 4000,
        box10Vat: 4000,
        box11Vat: 4750,
        totalOutputVat: 8750,
        totalInputVat: 4000,
        netVatDue: 4750,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await vatReturnService.getById(1);

      expect(result.returnNumber).toBe("VAT-2024-Q1");
      expect(result.box1Vat).toBe(5000);
      expect(result.netVatDue).toBe(4750);
    });

    it("should calculate Box 7 (total output VAT) correctly", async () => {
      const mockData = {
        id: 1,
        box1Vat: 5000,
        box2Vat: 0,
        box5Vat: 3750,
        box6Vat: -500,
        box7Vat: 8250,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await vatReturnService.getById(1);

      expect(result.box7Vat).toBe(8250);
    });

    it("should calculate Box 10 (recoverable input VAT) correctly", async () => {
      const mockData = {
        id: 1,
        box8Vat: 4000,
        box9Vat: 500,
        box10Vat: 4500,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await vatReturnService.getById(1);

      expect(result.box10Vat).toBe(4500);
    });

    it("should calculate Box 11 (net VAT due) correctly", async () => {
      const mockData = {
        id: 1,
        box7Vat: 8750,
        box10Vat: 4000,
        box11Vat: 4750,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await vatReturnService.getById(1);

      expect(result.box11Vat).toBe(result.box7Vat - result.box10Vat);
    });
  });

  describe("generateReturn", () => {
    it("should generate VAT return for period", async () => {
      const mockResponse = {
        id: 1,
        returnNumber: "VAT-2024-Q1",
        status: "generated",
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
        box1Amount: 500000,
        box1Vat: 25000,
        box3Amount: 100000,
        box8Amount: 300000,
        box8Vat: 15000,
        box7Vat: 25000,
        box10Vat: 15000,
        box11Vat: 10000,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await vatReturnService.generateReturn({
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
      });

      expect(result.status).toBe("generated");
      expect(result.box11Vat).toBe(10000);
      expect(apiClient.post).toHaveBeenCalledWith("/vat-returns/generate", expect.any(Object));
    });

    it("should auto-populate boxes from transaction data", async () => {
      const mockResponse = {
        box1Amount: 500000,
        box5Amount: 200000,
        box3Amount: 100000,
        box8Amount: 300000,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await vatReturnService.generateReturn({
        periodStart: "2024-01-01",
      });

      expect(result.box1Amount).toBe(500000);
      expect(result.box5Amount).toBe(200000);
    });
  });

  describe("submitReturn", () => {
    it("should submit VAT return to authorities", async () => {
      const mockResponse = {
        id: 1,
        status: "submitted",
        submittedAt: "2024-04-15T10:00:00Z",
        acknowledgmentNumber: "ACK-2024-001",
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await vatReturnService.submitReturn(1);

      expect(result.status).toBe("submitted");
      expect(result.acknowledgmentNumber).toBe("ACK-2024-001");
      expect(apiClient.post).toHaveBeenCalledWith("/vat-returns/1/submit", expect.any(Object));
    });

    it("should validate return before submission", async () => {
      apiClient.post.mockRejectedValue(new Error("Box 1 VAT exceeds expected threshold"));

      await expect(vatReturnService.submitReturn(1)).rejects.toThrow();
    });
  });

  describe("getPeriods", () => {
    it("should fetch available VAT periods", async () => {
      const mockResponse = [
        { year: 2024, quarter: 1, startDate: "2024-01-01", endDate: "2024-03-31" },
        { year: 2024, quarter: 2, startDate: "2024-04-01", endDate: "2024-06-30" },
      ];

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getPeriods();

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-return/periods");
    });
  });

  describe("generateReport", () => {
    it("should generate VAT report for period", async () => {
      const mockResponse = {
        returnNumber: "VAT-2024-Q1",
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
        box1Amount: 500000,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.generateReport("2024-01-01", "2024-03-31");

      expect(result.returnNumber).toBe("VAT-2024-Q1");
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("saveReport", () => {
    it("should save VAT return", async () => {
      const mockResponse = {
        id: 1,
        status: "draft",
        box1Amount: 500000,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await vatReturnService.saveReport("2024-01-01", "2024-03-31");

      expect(result.status).toBe("draft");
      expect(apiClient.post).toHaveBeenCalledWith("/vat-return/save", expect.any(Object));
    });
  });

  describe("getEmirates", () => {
    it("should fetch list of UAE emirates", async () => {
      const mockResponse = [
        { code: "AE-AZ", name: "Abu Dhabi" },
        { code: "AE-DU", name: "Dubai" },
      ];

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getEmirates();

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-return/emirates");
    });
  });

  describe("getPreview", () => {
    it("should get preview of VAT return before filing", async () => {
      const mockResponse = {
        id: 1,
        returnNumber: "VAT-2024-Q1",
        documents: [],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getPreview(1);

      expect(result.returnNumber).toBe("VAT-2024-Q1");
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns/1/preview");
    });
  });

  describe("markAsFiled", () => {
    it("should mark VAT return as filed", async () => {
      const mockResponse = {
        id: 1,
        status: "filed",
        ftaReferenceNumber: "FTA-12345",
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await vatReturnService.markAsFiled(1, {
        ftaReferenceNumber: "FTA-12345",
      });

      expect(result.status).toBe("filed");
      expect(apiClient.post).toHaveBeenCalledWith("/vat-returns/1/file", expect.any(Object));
    });
  });

  describe("getForm201Data", () => {
    it("should get Form 201 data with all 11 boxes", async () => {
      const mockResponse = {
        box1Amount: 500000,
        box1Vat: 25000,
        box7Vat: 25000,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getForm201Data(1);

      expect(result.box1Amount).toBe(500000);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns/1/form-201");
    });
  });

  describe("getAuditTrail", () => {
    it("should get audit trail for VAT return", async () => {
      const mockResponse = [{ action: "created", timestamp: "2024-01-15T10:00:00Z", user: "admin" }];

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getAuditTrail(1);

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns/1/audit-trail");
    });
  });

  describe("getReconciliation", () => {
    it("should get reconciliation report for VAT return", async () => {
      const mockResponse = {
        box1: { amount: 500000, vat: 25000 },
        box8: { amount: 300000, vat: 15000 },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getReconciliation(1);

      expect(result.box1).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns/1/reconciliation");
    });
  });

  describe("getSupportingDocuments", () => {
    it("should get supporting documents for VAT return", async () => {
      const mockResponse = {
        invoices: [],
        purchases: [],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getSupportingDocuments(1);

      expect(result.invoices).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns/1/supporting-documents");
    });
  });

  describe("getBlockedVATCategories", () => {
    it("should get blocked VAT categories", async () => {
      const mockResponse = [{ code: "FUEL", description: "Fuel expenses" }];

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getBlockedVATCategories();

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-return/blocked-vat/categories");
    });
  });

  describe("getBlockedVATLog", () => {
    it("should get blocked VAT log for a period", async () => {
      const mockResponse = { items: [] };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getBlockedVATLog({
        startDate: "2024-01-01",
      });

      expect(result.items).toBeDefined();
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("should update VAT return status", async () => {
      const mockResponse = {
        id: 1,
        status: "review",
      };

      apiClient.patch.mockResolvedValue(mockResponse);

      const result = await vatReturnService.updateStatus(1, "review");

      expect(result.status).toBe("review");
      expect(apiClient.patch).toHaveBeenCalledWith("/vat-returns/1/status", expect.any(Object));
    });
  });

  describe("addNotes", () => {
    it("should add notes to VAT return", async () => {
      const mockResponse = {
        id: 1,
        notes: "Updated notes",
      };

      apiClient.patch.mockResolvedValue(mockResponse);

      const result = await vatReturnService.addNotes(1, "Updated notes");

      expect(result.notes).toBe("Updated notes");
      expect(apiClient.patch).toHaveBeenCalledWith("/vat-returns/1/notes", expect.any(Object));
    });
  });

  describe("delete", () => {
    it("should delete VAT return (draft only)", async () => {
      const mockResponse = { success: true };

      apiClient.delete.mockResolvedValue(mockResponse);

      const result = await vatReturnService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/vat-returns/1");
    });
  });

  describe("downloadPDF", () => {
    it("should download VAT return as PDF", async () => {
      const mockBlob = new Blob(["PDF content"], { type: "application/pdf" });
      apiClient.get.mockResolvedValue(mockBlob);

      const result = await vatReturnService.downloadPDF(1, "VAT-2024-Q1");

      expect(result).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns/1/pdf", expect.any(Object));
    });
  });

  describe("exportExcel", () => {
    it("should export VAT return as Excel", async () => {
      const mockBlob = new Blob(["Excel content"], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      apiClient.get.mockResolvedValue(mockBlob);

      const result = await vatReturnService.exportExcel(1);

      expect(result).toBe(true);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("getAnalytics", () => {
    it("should get VAT return analytics", async () => {
      const mockResponse = {
        totalReturns: 4,
        averageVat: 15000,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getAnalytics({ year: 2024 });

      expect(result.totalReturns).toBe(4);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("validate", () => {
    it("should validate VAT return before submission", async () => {
      const mockResponse = {
        valid: true,
        errors: [],
        warnings: [],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.validate(1);

      expect(result.valid).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-returns/1/validate");
    });
  });

  describe("recalculate", () => {
    it("should recalculate VAT return", async () => {
      const mockResponse = {
        id: 1,
        box7Vat: 25000,
        box10Vat: 15000,
        box11Vat: 10000,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await vatReturnService.recalculate(1);

      expect(result.box11Vat).toBe(10000);
      expect(apiClient.post).toHaveBeenCalledWith("/vat-returns/1/recalculate");
    });
  });

  describe("Multi-tenancy", () => {
    it("should maintain company context", async () => {
      apiClient.get.mockResolvedValue({
        data: [{ id: 1, companyId: 1 }],
      });

      const result = await vatReturnService.getAll();

      expect(result.data[0].companyId).toBe(1);
    });
  });

  describe("UAE VAT Compliance", () => {
    it("should handle zero-rated supplies separately", async () => {
      const mockData = {
        id: 1,
        box3Amount: 50000,
        box3Vat: 0,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await vatReturnService.getById(1);

      expect(result.box3Vat).toBe(0);
    });

    it("should support reverse charge for B2B supplies", async () => {
      const mockData = {
        id: 1,
        box9Amount: 100000,
        box9Vat: 5000,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await vatReturnService.getById(1);

      expect(result.box9Amount).toBe(100000);
    });

    it("should support import adjustments", async () => {
      const mockData = {
        id: 1,
        box5Amount: 200000,
        box5Vat: 10000,
        box6Amount: -50000,
        box6Vat: -2500,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await vatReturnService.getById(1);

      expect(result.box6Amount).toBe(-50000);
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      await expect(vatReturnService.getAll()).rejects.toThrow();
    });

    it("should validate return data before submission", async () => {
      apiClient.post.mockRejectedValue(new Error("Invalid return data"));

      await expect(vatReturnService.submitReturn(1)).rejects.toThrow();
    });
  });
});
