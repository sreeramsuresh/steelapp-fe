import { beforeEach, describe, expect, it, vi } from "vitest";
import { vatAdjustmentService } from "../vatAdjustmentService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("vatAdjustmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdjustments", () => {
    it("should fetch all VAT adjustments with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            adjustment_number: "VATA-2024-001",
            type: "input_vat_credit",
            amount: 5000,
            status: "approved",
          },
          {
            id: 2,
            adjustment_number: "VATA-2024-002",
            type: "reverse_charge",
            amount: 2500,
            status: "pending",
          },
        ],
        pagination: { total: 2, page: 1 },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await vatAdjustmentService.getAdjustments();

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(api.get).toHaveBeenCalledWith("/vat-adjustments", expect.any(Object));
    });

    it("should filter by adjustment type", async () => {
      api.get.mockResolvedValue({ data: [], pagination: {} });

      await vatAdjustmentService.getAdjustments({
        type: "input_vat_credit",
      });

      expect(api.get).toHaveBeenCalledWith(
        "/vat-adjustments",
        expect.objectContaining({
          params: expect.objectContaining({
            type: "input_vat_credit",
          }),
        })
      );
    });
  });

  describe("getAdjustment", () => {
    it("should fetch single VAT adjustment with details", async () => {
      const mockResponse = {
        id: 1,
        adjustment_number: "VATA-2024-001",
        type: "input_vat_credit",
        amount: 5000,
        description: "Recovered VAT on supplies",
        status: "approved",
        approved_by: "tax_officer@company.com",
        approval_date: "2024-01-15",
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await vatAdjustmentService.getAdjustment(1);

      expect(result.type).toBe("input_vat_credit");
      expect(result.amount).toBe(5000);
      expect(api.get).toHaveBeenCalledWith("/vat-adjustments/1");
    });
  });

  describe("createAdjustment", () => {
    it("should create new VAT adjustment", async () => {
      const mockResponse = {
        id: 1,
        adjustment_number: "VATA-2024-001",
        type: "input_vat_credit",
        status: "pending",
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        type: "input_vat_credit",
        amount: 5000,
        description: "Recovered VAT on supplies",
        reference_invoices: ["INV-001", "INV-002"],
      };

      const result = await vatAdjustmentService.createAdjustment(payload);

      expect(result.adjustment_number).toBe("VATA-2024-001");
      expect(api.post).toHaveBeenCalledWith("/vat-adjustments", payload);
    });
  });

  describe("updateAdjustment", () => {
    it("should update VAT adjustment details", async () => {
      const mockResponse = {
        id: 1,
        adjustment_number: "VATA-2024-001",
        amount: 5500,
        status: "pending",
      };

      api.put.mockResolvedValue(mockResponse);

      const payload = { amount: 5500 };

      const result = await vatAdjustmentService.updateAdjustment(1, payload);

      expect(result.amount).toBe(5500);
      expect(api.put).toHaveBeenCalledWith("/vat-adjustments/1", payload);
    });
  });

  describe("deleteAdjustment", () => {
    it("should delete VAT adjustment", async () => {
      api.delete.mockResolvedValue({ success: true });

      const result = await vatAdjustmentService.deleteAdjustment(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/vat-adjustments/1");
    });
  });

  describe("approveAdjustment", () => {
    it("should approve VAT adjustment", async () => {
      const mockResponse = {
        id: 1,
        status: "approved",
        approved_by: "tax_officer@company.com",
        approval_date: "2024-01-15T10:00:00Z",
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await vatAdjustmentService.approveAdjustment(1, {
        comments: "Approved for processing",
      });

      expect(result.status).toBe("approved");
    });
  });
});
