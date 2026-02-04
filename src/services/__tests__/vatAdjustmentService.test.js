import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api";
import vatAdjustmentService from "../vatAdjustmentService";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("vatAdjustmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all VAT adjustments with pagination", async () => {
      apiClient.get.mockResolvedValue({
        data: [{ id: 1, adjustmentNumber: "VA001", status: "draft" }],
        pagination: { page: 1, totalPages: 1 },
      });

      const result = await vatAdjustmentService.getAll({ page: 1, pageSize: 50 });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("pagination");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should handle array response", async () => {
      apiClient.get.mockResolvedValue([{ id: 1, adjustmentNumber: "VA001" }]);

      const result = await vatAdjustmentService.getAll();

      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should handle error", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      await expect(vatAdjustmentService.getAll()).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("should fetch adjustment by ID", async () => {
      apiClient.get.mockResolvedValue({ id: 1, adjustmentNumber: "VA001" });

      const result = await vatAdjustmentService.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/1");
      expect(result).toHaveProperty("id", 1);
    });
  });

  describe("getByPeriod", () => {
    it("should fetch adjustments for a period", async () => {
      apiClient.get.mockResolvedValue([{ id: 1, adjustmentNumber: "VA001" }]);

      const result = await vatAdjustmentService.getByPeriod("2024-01-01", "2024-12-31");

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/by-period", {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
    });
  });

  describe("getPendingApproval", () => {
    it("should fetch pending adjustments", async () => {
      apiClient.get.mockResolvedValue([{ id: 1, status: "pending_approval" }]);

      const result = await vatAdjustmentService.getPendingApproval();

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/pending-approval");
    });
  });

  describe("create", () => {
    it("should create new VAT adjustment", async () => {
      const adjustmentData = {
        adjustmentType: "BAD_DEBT_RELIEF",
        direction: "DECREASE",
        status: "draft",
      };

      apiClient.post.mockResolvedValue({
        id: 1,
        ...adjustmentData,
      });

      const result = await vatAdjustmentService.create(adjustmentData);

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments", expect.any(Object));
      expect(result).toHaveProperty("id");
    });
  });

  describe("update", () => {
    it("should update existing adjustment", async () => {
      const adjustmentData = { status: "pending_approval" };

      apiClient.put.mockResolvedValue({
        id: 1,
        ...adjustmentData,
      });

      const result = await vatAdjustmentService.update(1, adjustmentData);

      expect(apiClient.put).toHaveBeenCalledWith("/vat-adjustments/1", expect.any(Object));
      expect(result).toHaveProperty("id");
    });
  });

  describe("delete", () => {
    it("should delete adjustment", async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      await vatAdjustmentService.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith("/vat-adjustments/1");
    });
  });

  describe("submitForApproval", () => {
    it("should submit adjustment for approval", async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        status: "pending_approval",
      });

      const result = await vatAdjustmentService.submitForApproval(1);

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/submit");
      expect(result).toHaveProperty("status", "pending_approval");
    });
  });

  describe("approve", () => {
    it("should approve adjustment", async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        status: "approved",
      });

      const result = await vatAdjustmentService.approve(1, "Approved");

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/approve", {
        notes: "Approved",
      });
      expect(result).toHaveProperty("status", "approved");
    });
  });

  describe("reject", () => {
    it("should reject adjustment", async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        status: "rejected",
      });

      const result = await vatAdjustmentService.reject(1, "Incomplete");

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/reject", {
        rejectionReason: "Incomplete",
      });
      expect(result).toHaveProperty("status", "rejected");
    });
  });

  describe("applyToVatReturn", () => {
    it("should apply adjustment to VAT return", async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        status: "applied",
      });

      const result = await vatAdjustmentService.applyToVatReturn(1, 100);

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/apply", {
        vatReturnId: 100,
      });
      expect(result).toHaveProperty("status", "applied");
    });
  });

  describe("cancel", () => {
    it("should cancel adjustment", async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        status: "cancelled",
      });

      const result = await vatAdjustmentService.cancel(1, "Changed mind");

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/cancel", {
        cancellationReason: "Changed mind",
      });
      expect(result).toHaveProperty("status", "cancelled");
    });
  });

  describe("getNextNumber", () => {
    it("should get next adjustment number", async () => {
      apiClient.get.mockResolvedValue({
        adjustmentNumber: "VA025",
      });

      const result = await vatAdjustmentService.getNextNumber();

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/number/next");
      expect(result).toHaveProperty("adjustmentNumber");
    });
  });

  describe("checkBadDebtEligibility", () => {
    it("should check bad debt eligibility", async () => {
      apiClient.get.mockResolvedValue({
        eligible: true,
        debtAgeDays: 180,
      });

      const result = await vatAdjustmentService.checkBadDebtEligibility(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/bad-debt-eligibility/1");
      expect(result).toHaveProperty("eligible", true);
    });
  });

  describe("createBadDebtRelief", () => {
    it("should create bad debt relief adjustment", async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        adjustmentType: "BAD_DEBT_RELIEF",
      });

      const result = await vatAdjustmentService.createBadDebtRelief(1, { notes: "Test" });

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/bad-debt-relief", {
        invoiceId: 1,
        notes: "Test",
        supportingDocuments: [],
      });
      expect(result).toHaveProperty("id");
    });
  });

  describe("getSummary", () => {
    it("should get adjustment summary", async () => {
      const params = { startDate: "2024-01-01", endDate: "2024-12-31" };

      apiClient.get.mockResolvedValue({
        totalAdjustments: 10,
        totalAmount: 50000,
      });

      const result = await vatAdjustmentService.getSummary(params);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/summary", params);
      expect(result).toHaveProperty("totalAdjustments");
    });
  });

  describe("getAuditTrail", () => {
    it("should get audit trail", async () => {
      apiClient.get.mockResolvedValue([{ action: "created", timestamp: "2024-01-15" }]);

      const result = await vatAdjustmentService.getAuditTrail(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/1/audit-trail");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("search", () => {
    it("should search adjustments", async () => {
      apiClient.get.mockResolvedValue({
        data: [{ id: 1, adjustmentNumber: "VA001" }],
      });

      const result = await vatAdjustmentService.search("VA", { status: "draft" });

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });
});
