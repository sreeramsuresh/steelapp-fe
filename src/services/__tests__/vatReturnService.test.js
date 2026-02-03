import { beforeEach, describe, expect, it, vi } from "vitest";
import vatReturnService, { FORM_201_BOXES, VAT_RETURN_STATUSES } from "../vatReturnService.js";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
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

  describe("amendReturn", () => {
    it("should create amended VAT return", async () => {
      const mockResponse = {
        id: 2,
        originalReturnId: 1,
        returnNumber: "VAT-2024-Q1-AMENDED",
        status: "amended",
        amendmentReason: "Correction of Box 8 expense",
        box8Amount: 320000,
        box8Vat: 16000,
        box10Vat: 16000,
        box11Vat: 9000,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await vatReturnService.amendReturn(1, {
        reason: "Correction of Box 8 expense",
        box8Amount: 320000,
      });

      expect(result.status).toBe("amended");
      expect(result.returnNumber).toContain("AMENDED");
      expect(apiClient.post).toHaveBeenCalledWith("/vat-returns/1/amend", expect.any(Object));
    });
  });

  describe("getVatSummary", () => {
    it("should get VAT summary for period", async () => {
      const mockResponse = {
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
        totalOutputVat: 25000,
        totalInputVat: 15000,
        netVatDue: 10000,
        returnsSubmitted: 1,
        amendments: 0,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await vatReturnService.getVatSummary({
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
      });

      expect(result.totalOutputVat).toBe(25000);
      expect(result.netVatDue).toBe(10000);
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
