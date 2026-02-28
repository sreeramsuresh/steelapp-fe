import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import vatAmendmentService, {
  AMENDMENT_TYPES,
  ERROR_CATEGORIES,
  AMENDMENT_STATUSES,
} from "../vatAmendmentService.js";

describe("vatAmendmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constants", () => {
    it("exports AMENDMENT_TYPES", () => {
      expect(AMENDMENT_TYPES.VOLUNTARY_DISCLOSURE).toBe("VOLUNTARY_DISCLOSURE");
      expect(AMENDMENT_TYPES.FTA_ASSESSMENT).toBe("FTA_ASSESSMENT");
      expect(AMENDMENT_TYPES.AUDIT_FINDING).toBe("AUDIT_FINDING");
    });

    it("exports ERROR_CATEGORIES", () => {
      expect(ERROR_CATEGORIES.OUTPUT_VAT_UNDERREPORTED).toBe("OUTPUT_VAT_UNDERREPORTED");
      expect(ERROR_CATEGORIES.CALCULATION_ERROR).toBe("CALCULATION_ERROR");
    });

    it("exports AMENDMENT_STATUSES", () => {
      expect(AMENDMENT_STATUSES.DRAFT).toBe("draft");
      expect(AMENDMENT_STATUSES.SUBMITTED).toBe("submitted");
    });
  });

  describe("getAll", () => {
    it("returns transformed amendments from paginated response", async () => {
      apiClient.get.mockResolvedValue({
        data: [{ id: 1, amendmentType: "VOLUNTARY_DISCLOSURE", status: "draft" }],
        pagination: { page: 1, totalPages: 1 },
      });

      const result = await vatAmendmentService.getAll({ page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith("/vat-amendments", expect.any(Object));
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });

    it("handles array response", async () => {
      apiClient.get.mockResolvedValue([
        { id: 1, status: "draft" },
      ]);

      const result = await vatAmendmentService.getAll();

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeNull();
    });

    it("returns empty data for unexpected response shape", async () => {
      apiClient.get.mockResolvedValue({ unexpected: true });

      const result = await vatAmendmentService.getAll();

      expect(result.data).toEqual([]);
    });

    it("throws on API error", async () => {
      apiClient.get.mockRejectedValue(new Error("Network error"));

      await expect(vatAmendmentService.getAll()).rejects.toThrow("Network error");
    });
  });

  describe("getById", () => {
    it("returns transformed amendment", async () => {
      apiClient.get.mockResolvedValue({ id: 1, status: "draft", differenceAmount: "100.50" });

      const result = await vatAmendmentService.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-amendments/1");
      expect(result.id).toBe(1);
      expect(result.differenceAmount).toBe(100.5);
    });
  });

  describe("create", () => {
    it("transforms data and posts to API", async () => {
      apiClient.post.mockResolvedValue({ id: 1, status: "draft" });

      const result = await vatAmendmentService.create({
        amendmentType: "VOLUNTARY_DISCLOSURE",
        originalTaxableAmount: "1000",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/vat-amendments",
        expect.objectContaining({ amendmentType: "VOLUNTARY_DISCLOSURE" })
      );
      expect(result.id).toBe(1);
    });
  });

  describe("submit", () => {
    it("submits amendment to FTA", async () => {
      apiClient.post.mockResolvedValue({ id: 1, status: "submitted" });

      const result = await vatAmendmentService.submit(1);

      expect(apiClient.post).toHaveBeenCalledWith("/vat-amendments/1/submit");
      expect(result.status).toBe("submitted");
    });
  });

  describe("cancel", () => {
    it("cancels amendment with reason", async () => {
      apiClient.post.mockResolvedValue({ id: 1, status: "cancelled" });

      const result = await vatAmendmentService.cancel(1, "No longer needed");

      expect(apiClient.post).toHaveBeenCalledWith("/vat-amendments/1/cancel", {
        cancellationReason: "No longer needed",
      });
      expect(result.status).toBe("cancelled");
    });
  });

  describe("calculatePenalty", () => {
    it("calls penalty calculation endpoint", async () => {
      apiClient.get.mockResolvedValue({ penalty: 200, rate: 0.2 });

      const result = await vatAmendmentService.calculatePenalty(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-amendments/1/calculate-penalty");
      expect(result.penalty).toBe(200);
    });
  });
});
