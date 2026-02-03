import { beforeEach, describe, expect, it, vi } from "vitest";
import { vatAmendmentService } from "../vatAmendmentService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("vatAmendmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAmendments", () => {
    it("should fetch all VAT amendments with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            amendment_number: "VAAM-2024-001",
            original_return_id: 1,
            reason: "Correction of Box 8 expense",
            status: "filed",
          },
          {
            id: 2,
            amendment_number: "VAAM-2024-002",
            original_return_id: 2,
            reason: "Adjustment for reverse charge",
            status: "pending",
          },
        ],
        pagination: { total: 2, page: 1 },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await vatAmendmentService.getAmendments();

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(api.get).toHaveBeenCalledWith("/vat-amendments", expect.any(Object));
    });

    it("should filter by status", async () => {
      api.get.mockResolvedValue({ data: [], pagination: {} });

      await vatAmendmentService.getAmendments({ status: "filed" });

      expect(api.get).toHaveBeenCalledWith(
        "/vat-amendments",
        expect.objectContaining({
          params: expect.objectContaining({
            status: "filed",
          }),
        })
      );
    });
  });

  describe("getAmendment", () => {
    it("should fetch single VAT amendment with full details", async () => {
      const mockResponse = {
        id: 1,
        amendment_number: "VAAM-2024-001",
        original_return_id: 1,
        original_return_number: "VAT-2024-Q1",
        reason: "Correction of Box 8 expense",
        status: "filed",
        box8_original: 80000,
        box8_amended: 85000,
        box8_vat_original: 4000,
        box8_vat_amended: 4250,
        impact_amount: 250,
        filed_date: "2024-02-15T10:00:00Z",
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await vatAmendmentService.getAmendment(1);

      expect(result.amendment_number).toBe("VAAM-2024-001");
      expect(result.impact_amount).toBe(250);
      expect(api.get).toHaveBeenCalledWith("/vat-amendments/1");
    });
  });

  describe("createAmendment", () => {
    it("should create new VAT amendment for return", async () => {
      const mockResponse = {
        id: 1,
        amendment_number: "VAAM-2024-001",
        original_return_id: 1,
        status: "draft",
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        original_return_id: 1,
        reason: "Correction of Box 8 expense",
        amended_boxes: {
          box8_amount: 85000,
          box8_vat: 4250,
        },
      };

      const result = await vatAmendmentService.createAmendment(payload);

      expect(result.amendment_number).toBe("VAAM-2024-001");
      expect(api.post).toHaveBeenCalledWith("/vat-amendments", payload);
    });
  });

  describe("updateAmendment", () => {
    it("should update VAT amendment details before filing", async () => {
      const mockResponse = {
        id: 1,
        amendment_number: "VAAM-2024-001",
        reason: "Updated reason",
        status: "draft",
      };

      api.put.mockResolvedValue(mockResponse);

      const payload = { reason: "Updated reason" };

      const result = await vatAmendmentService.updateAmendment(1, payload);

      expect(result.reason).toBe("Updated reason");
      expect(api.put).toHaveBeenCalledWith("/vat-amendments/1", payload);
    });
  });

  describe("deleteAmendment", () => {
    it("should delete draft VAT amendment", async () => {
      api.delete.mockResolvedValue({ success: true });

      const result = await vatAmendmentService.deleteAmendment(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/vat-amendments/1");
    });
  });

  describe("fileAmendment", () => {
    it("should submit VAT amendment to authorities", async () => {
      const mockResponse = {
        id: 1,
        status: "filed",
        filed_date: "2024-02-15T10:00:00Z",
        acknowledgment_number: "ACK-VAAM-2024-001",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await vatAmendmentService.fileAmendment(1);

      expect(result.status).toBe("filed");
      expect(result.acknowledgment_number).toContain("ACK");
      expect(api.post).toHaveBeenCalledWith("/vat-amendments/1/file", expect.any(Object));
    });
  });

  describe("calculateImpact", () => {
    it("should calculate amendment impact on VAT position", async () => {
      const mockResponse = {
        box7_original: 8750,
        box7_amended: 9000,
        box7_change: 250,
        box11_original: 4750,
        box11_amended: 5000,
        vat_impact: 250,
        refund_due: false,
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await vatAmendmentService.calculateImpact(1, {
        box8_amount: 85000,
      });

      expect(result.vat_impact).toBe(250);
      expect(result.box11_amended).toBe(5000);
    });
  });
});
