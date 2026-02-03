import { beforeEach, describe, expect, it, vi } from "vitest";
import { supplierQuotationService } from "../supplierQuotationService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("supplierQuotationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getQuotations", () => {
    it("should fetch all supplier quotations with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            supplier_id: 100,
            quotation_number: "SQ-2024-001",
            amount: 50000,
            status: "active",
          },
          {
            id: 2,
            supplier_id: 101,
            quotation_number: "SQ-2024-002",
            amount: 75000,
            status: "active",
          },
        ],
        pagination: { total: 2, page: 1 },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await supplierQuotationService.getQuotations();

      expect(result.data).toHaveLength(2);
      expect(api.get).toHaveBeenCalledWith(
        "/supplier-quotations",
        expect.any(Object)
      );
    });

    it("should filter by supplier", async () => {
      api.get.mockResolvedValue({ data: [], pagination: {} });

      await supplierQuotationService.getQuotations({ supplier_id: 100 });

      expect(api.get).toHaveBeenCalledWith(
        "/supplier-quotations",
        expect.objectContaining({
          params: expect.objectContaining({
            supplier_id: 100,
          }),
        })
      );
    });
  });

  describe("getQuotation", () => {
    it("should fetch quotation with line items", async () => {
      const mockResponse = {
        id: 1,
        quotation_number: "SQ-2024-001",
        supplier_id: 100,
        supplier_name: "POSCO",
        items: [
          {
            id: 101,
            product_id: 1,
            product_name: "SS304 Sheet",
            quantity: 100,
            unit_price: 500,
            total: 50000,
          },
        ],
        total_amount: 50000,
        valid_until: "2024-02-15",
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await supplierQuotationService.getQuotation(1);

      expect(result.items).toHaveLength(1);
      expect(result.total_amount).toBe(50000);
      expect(api.get).toHaveBeenCalledWith("/supplier-quotations/1");
    });
  });

  describe("createQuotation", () => {
    it("should create new supplier quotation", async () => {
      const mockResponse = {
        id: 1,
        quotation_number: "SQ-2024-001",
        status: "pending",
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        supplier_id: 100,
        items: [
          { product_id: 1, quantity: 100, unit_price: 500 },
        ],
      };

      const result = await supplierQuotationService.createQuotation(payload);

      expect(result.quotation_number).toBe("SQ-2024-001");
      expect(api.post).toHaveBeenCalledWith(
        "/supplier-quotations",
        payload
      );
    });
  });

  describe("updateQuotation", () => {
    it("should update supplier quotation", async () => {
      const mockResponse = {
        id: 1,
        quotation_number: "SQ-2024-001",
        status: "updated",
      };

      api.put.mockResolvedValue(mockResponse);

      const payload = { valid_until: "2024-02-28" };

      const result = await supplierQuotationService.updateQuotation(1, payload);

      expect(result.status).toBe("updated");
      expect(api.put).toHaveBeenCalledWith(
        "/supplier-quotations/1",
        payload
      );
    });
  });

  describe("deleteQuotation", () => {
    it("should delete quotation", async () => {
      api.delete.mockResolvedValue({ success: true });

      const result = await supplierQuotationService.deleteQuotation(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/supplier-quotations/1");
    });
  });

  describe("acceptQuotation", () => {
    it("should accept supplier quotation", async () => {
      const mockResponse = {
        id: 1,
        status: "accepted",
        accepted_at: "2024-01-15T10:00:00Z",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await supplierQuotationService.acceptQuotation(1);

      expect(result.status).toBe("accepted");
      expect(api.post).toHaveBeenCalledWith(
        "/supplier-quotations/1/accept",
        expect.any(Object)
      );
    });
  });

  describe("rejectQuotation", () => {
    it("should reject supplier quotation with reason", async () => {
      const mockResponse = {
        id: 1,
        status: "rejected",
        rejected_at: "2024-01-15T10:00:00Z",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await supplierQuotationService.rejectQuotation(1, {
        reason: "Price too high",
      });

      expect(result.status).toBe("rejected");
    });
  });
});
