import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import vatAdjustmentService from "../vatAdjustmentService";


describe("vatAdjustmentService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAll", () => {
    test("should fetch all VAT adjustments with pagination", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [{ id: 1, adjustmentNumber: "VA001", status: "draft" }],
        pagination: { page: 1, totalPages: 1 },
      });

      const result = await vatAdjustmentService.getAll({ page: 1, pageSize: 50 });

      assert.ok(result).toHaveProperty("data");
      assert.ok(result).toHaveProperty("pagination");
      assert.ok(Array.isArray(result.data));
    });

    test("should handle array response", async () => {
      sinon.stub(apiClient, 'get').resolves([{ id: 1, adjustmentNumber: "VA001" }]);

      const result = await vatAdjustmentService.getAll();

      assert.ok(Array.isArray(result.data));
    });

    test("should handle error", async () => {
      sinon.stub(apiClient, 'get').rejects(new Error("API Error"));

      assert.rejects(vatAdjustmentService.getAll(), Error);
    });
  });

  describe("getById", () => {
    test("should fetch adjustment by ID", async () => {
      sinon.stub(apiClient, 'get').resolves({ id: 1, adjustmentNumber: "VA001" });

      const result = await vatAdjustmentService.getById(1);

      sinon.assert.calledWith(apiClient.get, "/vat-adjustments/1");
      assert.ok(result).toHaveProperty("id", 1);
    });
  });

  describe("getByPeriod", () => {
    test("should fetch adjustments for a period", async () => {
      sinon.stub(apiClient, 'get').resolves([{ id: 1, adjustmentNumber: "VA001" }]);

      const result = await vatAdjustmentService.getByPeriod("2024-01-01", "2024-12-31");

      assert.ok(Array.isArray(result));
      sinon.assert.calledWith(apiClient.get, "/vat-adjustments/by-period", {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
    });
  });

  describe("getPendingApproval", () => {
    test("should fetch pending adjustments", async () => {
      sinon.stub(apiClient, 'get').resolves([{ id: 1, status: "pending_approval" }]);

      const result = await vatAdjustmentService.getPendingApproval();

      assert.ok(Array.isArray(result));
      sinon.assert.calledWith(apiClient.get, "/vat-adjustments/pending-approval");
    });
  });

  describe("create", () => {
    test("should create new VAT adjustment", async () => {
      const adjustmentData = {
        adjustmentType: "BAD_DEBT_RELIEF",
        direction: "DECREASE",
        status: "draft",
      };

      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        ...adjustmentData,
      });

      const result = await vatAdjustmentService.create(adjustmentData);

      sinon.assert.calledWith(apiClient.post, "/vat-adjustments", );
      assert.ok(result).toHaveProperty("id");
    });
  });

  describe("update", () => {
    test("should update existing adjustment", async () => {
      const adjustmentData = { status: "pending_approval" };

      sinon.stub(apiClient, 'put').resolves({
        id: 1,
        ...adjustmentData,
      });

      const result = await vatAdjustmentService.update(1, adjustmentData);

      sinon.assert.calledWith(apiClient.put, "/vat-adjustments/1", );
      assert.ok(result).toHaveProperty("id");
    });
  });

  describe("delete", () => {
    test("should delete adjustment", async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      await vatAdjustmentService.delete(1);

      sinon.assert.calledWith(apiClient.delete, "/vat-adjustments/1");
    });
  });

  describe("submitForApproval", () => {
    test("should submit adjustment for approval", async () => {
      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        status: "pending_approval",
      });

      const result = await vatAdjustmentService.submitForApproval(1);

      sinon.assert.calledWith(apiClient.post, "/vat-adjustments/1/submit");
      assert.ok(result).toHaveProperty("status", "pending_approval");
    });
  });

  describe("approve", () => {
    test("should approve adjustment", async () => {
      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        status: "approved",
      });

      const result = await vatAdjustmentService.approve(1, "Approved");

      sinon.assert.calledWith(apiClient.post, "/vat-adjustments/1/approve", {
        notes: "Approved",
      });
      assert.ok(result).toHaveProperty("status", "approved");
    });
  });

  describe("reject", () => {
    test("should reject adjustment", async () => {
      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        status: "rejected",
      });

      const result = await vatAdjustmentService.reject(1, "Incomplete");

      sinon.assert.calledWith(apiClient.post, "/vat-adjustments/1/reject", {
        rejectionReason: "Incomplete",
      });
      assert.ok(result).toHaveProperty("status", "rejected");
    });
  });

  describe("applyToVatReturn", () => {
    test("should apply adjustment to VAT return", async () => {
      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        status: "applied",
      });

      const result = await vatAdjustmentService.applyToVatReturn(1, 100);

      sinon.assert.calledWith(apiClient.post, "/vat-adjustments/1/apply", {
        vatReturnId: 100,
      });
      assert.ok(result).toHaveProperty("status", "applied");
    });
  });

  describe("cancel", () => {
    test("should cancel adjustment", async () => {
      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        status: "cancelled",
      });

      const result = await vatAdjustmentService.cancel(1, "Changed mind");

      sinon.assert.calledWith(apiClient.post, "/vat-adjustments/1/cancel", {
        cancellationReason: "Changed mind",
      });
      assert.ok(result).toHaveProperty("status", "cancelled");
    });
  });

  describe("getNextNumber", () => {
    test("should get next adjustment number", async () => {
      sinon.stub(apiClient, 'get').resolves({
        adjustmentNumber: "VA025",
      });

      const result = await vatAdjustmentService.getNextNumber();

      sinon.assert.calledWith(apiClient.get, "/vat-adjustments/number/next");
      assert.ok(result).toHaveProperty("adjustmentNumber");
    });
  });

  describe("checkBadDebtEligibility", () => {
    test("should check bad debt eligibility", async () => {
      sinon.stub(apiClient, 'get').resolves({
        eligible: true,
        debtAgeDays: 180,
      });

      const result = await vatAdjustmentService.checkBadDebtEligibility(1);

      sinon.assert.calledWith(apiClient.get, "/vat-adjustments/bad-debt-eligibility/1");
      assert.ok(result).toHaveProperty("eligible", true);
    });
  });

  describe("createBadDebtRelief", () => {
    test("should create bad debt relief adjustment", async () => {
      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        adjustmentType: "BAD_DEBT_RELIEF",
      });

      const result = await vatAdjustmentService.createBadDebtRelief(1, { notes: "Test" });

      sinon.assert.calledWith(apiClient.post, "/vat-adjustments/bad-debt-relief", {
        invoiceId: 1,
        notes: "Test",
        supportingDocuments: [],
      });
      assert.ok(result).toHaveProperty("id");
    });
  });

  describe("getSummary", () => {
    test("should get adjustment summary", async () => {
      const params = { startDate: "2024-01-01", endDate: "2024-12-31" };

      sinon.stub(apiClient, 'get').resolves({
        totalAdjustments: 10,
        totalAmount: 50000,
      });

      const result = await vatAdjustmentService.getSummary(params);

      sinon.assert.calledWith(apiClient.get, "/vat-adjustments/summary", params);
      assert.ok(result).toHaveProperty("totalAdjustments");
    });
  });

  describe("getAuditTrail", () => {
    test("should get audit trail", async () => {
      sinon.stub(apiClient, 'get').resolves([{ action: "created", timestamp: "2024-01-15" }]);

      const result = await vatAdjustmentService.getAuditTrail(1);

      sinon.assert.calledWith(apiClient.get, "/vat-adjustments/1/audit-trail");
      assert.ok(Array.isArray(result));
    });
  });

  describe("search", () => {
    test("should search adjustments", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [{ id: 1, adjustmentNumber: "VA001" }],
      });

      const result = await vatAdjustmentService.search("VA", { status: "draft" });

      assert.ok(Array.isArray(result));
      assert.ok(apiClient.get);
    });
  });
});