import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";
import vatAdjustmentService from "../vatAdjustmentService.js";

describe("vatAdjustmentService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {});

  describe("getAll", () => {
    it("should fetch all VAT adjustments with pagination", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue({
        data: [{ id: 1, adjustmentNumber: "VA001", status: "draft" }],
        pagination: { page: 1, totalPages: 1 },
      });

      const result = await vatAdjustmentService.getAll({ page: 1, pageSize: 50 });

      expect(result?.data).toBeTruthy();
      expect(result?.pagination).toBeTruthy();
      expect(Array.isArray(result.data)).toBeTruthy();
    });

    it("should handle array response", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue([{ id: 1, adjustmentNumber: "VA001" }]);

      const result = await vatAdjustmentService.getAll();

      expect(Array.isArray(result.data)).toBeTruthy();
    });

    it("should handle error", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockRejectedValue(new Error("API Error"));

      await expect(vatAdjustmentService.getAll()).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("should fetch adjustment by ID", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue({ id: 1, adjustmentNumber: "VA001" });

      const result = await vatAdjustmentService.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/1");
      expect(result.id).toBe(1);
    });
  });

  describe("getByPeriod", () => {
    it("should fetch adjustments for a period", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue([{ id: 1, adjustmentNumber: "VA001" }]);

      const result = await vatAdjustmentService.getByPeriod("2024-01-01", "2024-12-31");

      expect(Array.isArray(result)).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/by-period", {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
    });
  });

  describe("getPendingApproval", () => {
    it("should fetch pending adjustments", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue([{ id: 1, status: "pending_approval" }]);

      const result = await vatAdjustmentService.getPendingApproval();

      expect(Array.isArray(result)).toBeTruthy();
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

      const postStub = vi.spyOn(apiClient, "post");
      postStub.mockResolvedValue({
        id: 1,
        ...adjustmentData,
      });

      const result = await vatAdjustmentService.create(adjustmentData);

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments", expect.any(Object));
      expect(result?.id).toBeTruthy();
    });
  });

  describe("update", () => {
    it("should update existing adjustment", async () => {
      const adjustmentData = { status: "pending_approval" };

      const putStub = vi.spyOn(apiClient, "put");
      putStub.mockResolvedValue({
        id: 1,
        ...adjustmentData,
      });

      const result = await vatAdjustmentService.update(1, adjustmentData);

      expect(apiClient.put).toHaveBeenCalledWith("/vat-adjustments/1", expect.any(Object));
      expect(result?.id).toBeTruthy();
    });
  });

  describe("delete", () => {
    it("should delete adjustment", async () => {
      const deleteStub = vi.spyOn(apiClient, "delete");
      deleteStub.mockResolvedValue({ success: true });

      await vatAdjustmentService.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith("/vat-adjustments/1");
    });
  });

  describe("submitForApproval", () => {
    it("should submit adjustment for approval", async () => {
      const postStub = vi.spyOn(apiClient, "post");
      postStub.mockResolvedValue({
        id: 1,
        status: "pending_approval",
      });

      const result = await vatAdjustmentService.submitForApproval(1);

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/submit");
      expect(result.status).toBe("pending_approval");
    });
  });

  describe("approve", () => {
    it("should approve adjustment", async () => {
      const postStub = vi.spyOn(apiClient, "post");
      postStub.mockResolvedValue({
        id: 1,
        status: "approved",
      });

      const result = await vatAdjustmentService.approve(1, "Approved");

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/approve", {
        notes: "Approved",
      });
      expect(result.status).toBe("approved");
    });
  });

  describe("reject", () => {
    it("should reject adjustment", async () => {
      const postStub = vi.spyOn(apiClient, "post");
      postStub.mockResolvedValue({
        id: 1,
        status: "rejected",
      });

      const result = await vatAdjustmentService.reject(1, "Incomplete");

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/reject", {
        rejectionReason: "Incomplete",
      });
      expect(result.status).toBe("rejected");
    });
  });

  describe("applyToVatReturn", () => {
    it("should apply adjustment to VAT return", async () => {
      const postStub = vi.spyOn(apiClient, "post");
      postStub.mockResolvedValue({
        id: 1,
        status: "applied",
      });

      const result = await vatAdjustmentService.applyToVatReturn(1, 100);

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/apply", {
        vatReturnId: 100,
      });
      expect(result.status).toBe("applied");
    });
  });

  describe("cancel", () => {
    it("should cancel adjustment", async () => {
      const postStub = vi.spyOn(apiClient, "post");
      postStub.mockResolvedValue({
        id: 1,
        status: "cancelled",
      });

      const result = await vatAdjustmentService.cancel(1, "Changed mind");

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/1/cancel", {
        cancellationReason: "Changed mind",
      });
      expect(result.status).toBe("cancelled");
    });
  });

  describe("getNextNumber", () => {
    it("should get next adjustment number", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue({
        adjustmentNumber: "VA025",
      });

      const result = await vatAdjustmentService.getNextNumber();

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/number/next");
      expect(result?.adjustmentNumber).toBeTruthy();
    });
  });

  describe("checkBadDebtEligibility", () => {
    it("should check bad debt eligibility", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue({
        eligible: true,
        debtAgeDays: 180,
      });

      const result = await vatAdjustmentService.checkBadDebtEligibility(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/bad-debt-eligibility/1");
      expect(result.eligible).toBe(true);
    });
  });

  describe("createBadDebtRelief", () => {
    it("should create bad debt relief adjustment", async () => {
      const postStub = vi.spyOn(apiClient, "post");
      postStub.mockResolvedValue({
        id: 1,
        adjustmentType: "BAD_DEBT_RELIEF",
      });

      const result = await vatAdjustmentService.createBadDebtRelief(1, { notes: "Test" });

      expect(apiClient.post).toHaveBeenCalledWith("/vat-adjustments/bad-debt-relief", {
        invoiceId: 1,
        notes: "Test",
        supportingDocuments: [],
      });
      expect(result?.id).toBeTruthy();
    });
  });

  describe("getSummary", () => {
    it("should get adjustment summary", async () => {
      const params = { startDate: "2024-01-01", endDate: "2024-12-31" };

      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue({
        totalAdjustments: 10,
        totalAmount: 50000,
      });

      const result = await vatAdjustmentService.getSummary(params);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/summary", params);
      expect(result?.totalAdjustments).toBeTruthy();
    });
  });

  describe("getAuditTrail", () => {
    it("should get audit trail", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue([{ action: "created", timestamp: "2024-01-15" }]);

      const result = await vatAdjustmentService.getAuditTrail(1);

      expect(apiClient.get).toHaveBeenCalledWith("/vat-adjustments/1/audit-trail");
      expect(Array.isArray(result)).toBeTruthy();
    });
  });

  describe("search", () => {
    it("should search adjustments", async () => {
      const getStub = vi.spyOn(apiClient, "get");
      getStub.mockResolvedValue({
        data: [{ id: 1, adjustmentNumber: "VA001" }],
      });

      const result = await vatAdjustmentService.search("VA", { status: "draft" });

      expect(Array.isArray(result)).toBeTruthy();
      expect(apiClient.get).toBeTruthy();
    });
  });
});
