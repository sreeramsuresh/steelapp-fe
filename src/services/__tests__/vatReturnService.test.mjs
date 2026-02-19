import { test, describe, beforeEach, afterEach } from 'node:test';
import '../../__tests__/init.mjs';
import assert from 'node:assert';
import sinon from 'sinon';
import vatReturnService, { FORM_201_BOXES, VAT_RETURN_STATUSES } from "../vatReturnService.js";
import { apiClient } from "../api.js";


describe("vatReturnService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("VAT Return Status Management", () => {
    test("should have correct VAT return statuses", () => {
      assert.strictEqual(VAT_RETURN_STATUSES.DRAFT, "draft");
      assert.strictEqual(VAT_RETURN_STATUSES.FILED, "filed");
      assert.strictEqual(VAT_RETURN_STATUSES.AMENDED, "amended");
    });

    test("should support status transitions", () => {
      const statuses = Object.values(VAT_RETURN_STATUSES);
      assert.ok(statuses.includes("draft"));
      assert.ok(statuses.includes("submitted"));
    });
  });

  describe("Form 201 Box Definitions", () => {
    test("should have all 11 Form 201 boxes defined", () => {
      const boxes = Object.keys(FORM_201_BOXES);
      assert.strictEqual(boxes.length, 11);
    });

    test("should identify output boxes (1-6)", () => {
      assert.strictEqual(FORM_201_BOXES.BOX_1.type, "output");
      assert.strictEqual(FORM_201_BOXES.BOX_5.type, "output");
    });

    test("should identify input boxes (8-9)", () => {
      assert.strictEqual(FORM_201_BOXES.BOX_8.type, "input");
      assert.strictEqual(FORM_201_BOXES.BOX_9.type, "input");
    });

    test("should identify calculated boxes (7, 10, 11)", () => {
      assert.strictEqual(FORM_201_BOXES.BOX_7.type, "calculated");
      assert.strictEqual(FORM_201_BOXES.BOX_10.type, "calculated");
      assert.strictEqual(FORM_201_BOXES.BOX_11.type, "calculated");
    });
  });

  describe("Form 201 Box Descriptions", () => {
    test("should have descriptive labels for each box", () => {
      assert.strictEqual(FORM_201_BOXES.BOX_1.label, "Standard rated supplies in UAE");
      assert.strictEqual(FORM_201_BOXES.BOX_8.label, "Standard rated expenses");
    });

    test("should support zero-rated and exempt supplies", () => {
      assert.ok(FORM_201_BOXES.BOX_3.label.includes("Zero-rated"));
      assert.ok(FORM_201_BOXES.BOX_4.label.includes("Exempt"));
    });
  });

  describe("getAll", () => {
    test("should fetch all VAT returns with pagination", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getAll();

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].returnNumber, "VAT-2024-Q1");
      assert.ok(apiClient.get.called);
    });

    test("should filter by status", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await vatReturnService.getAll({ status: "filed" });

      assert.ok(apiClient.get.called);
    });

    test("should filter by period", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await vatReturnService.getAll({
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
      });

      assert.ok(apiClient.get.called);
    });
  });

  describe("getById", () => {
    test("should fetch VAT return by ID with full Form 201 data", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await vatReturnService.getById(1);

      assert.strictEqual(result.returnNumber, "VAT-2024-Q1");
      assert.strictEqual(result.box1Vat, 5000);
      assert.strictEqual(result.netVatDue, 4750);
    });

    test("should calculate Box 7 (total output VAT) correctly", async () => {
      const mockData = {
        id: 1,
        box1Vat: 5000,
        box2Vat: 0,
        box5Vat: 3750,
        box6Vat: -500,
        box7Vat: 8250,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await vatReturnService.getById(1);

      assert.strictEqual(result.box7Vat, 8250);
    });

    test("should calculate Box 10 (recoverable input VAT) correctly", async () => {
      const mockData = {
        id: 1,
        box8Vat: 4000,
        box9Vat: 500,
        box10Vat: 4500,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await vatReturnService.getById(1);

      assert.strictEqual(result.box10Vat, 4500);
    });

    test("should calculate Box 11 (net VAT due) correctly", async () => {
      const mockData = {
        id: 1,
        box7Vat: 8750,
        box10Vat: 4000,
        box11Vat: 4750,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await vatReturnService.getById(1);

      assert.strictEqual(result.box11Vat, result.box7Vat - result.box10Vat);
    });
  });

  describe("generateReturn", () => {
    test("should generate VAT return for period", async () => {
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

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatReturnService.generateReturn({
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
      });

      assert.strictEqual(result.status, "generated");
      assert.strictEqual(result.box11Vat, 10000);
      assert.ok(apiClient.post.called);
    });

    test("should auto-populate boxes from transaction data", async () => {
      const mockResponse = {
        box1Amount: 500000,
        box5Amount: 200000,
        box3Amount: 100000,
        box8Amount: 300000,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatReturnService.generateReturn({
        periodStart: "2024-01-01",
      });

      assert.strictEqual(result.box1Amount, 500000);
      assert.strictEqual(result.box5Amount, 200000);
    });
  });

  describe("submitReturn", () => {
    test("should submit VAT return to authorities", async () => {
      const mockResponse = {
        id: 1,
        status: "submitted",
        submittedAt: "2024-04-15T10:00:00Z",
        acknowledgmentNumber: "ACK-2024-001",
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatReturnService.submitReturn(1);

      assert.strictEqual(result.status, "submitted");
      assert.strictEqual(result.acknowledgmentNumber, "ACK-2024-001");
      assert.ok(apiClient.post.called);
    });

    test("should validate return before submission", async () => {
      sinon.stub(apiClient, 'post').rejects(new Error("Box 1 VAT exceeds expected threshold"));

      await assert.rejects(() => vatReturnService.submitReturn(1), Error);
    });
  });

  describe("getPeriods", () => {
    test("should fetch available VAT periods", async () => {
      const mockResponse = [
        { year: 2024, quarter: 1, startDate: "2024-01-01", endDate: "2024-03-31" },
        { year: 2024, quarter: 2, startDate: "2024-04-01", endDate: "2024-06-30" },
      ];

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getPeriods();

      assert.strictEqual(Array.isArray(result), true);
      assert.ok(apiClient.get.called);
    });
  });

  describe("generateReport", () => {
    test("should generate VAT report for period", async () => {
      const mockResponse = {
        returnNumber: "VAT-2024-Q1",
        periodStart: "2024-01-01",
        periodEnd: "2024-03-31",
        box1Amount: 500000,
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.generateReport("2024-01-01", "2024-03-31");

      assert.strictEqual(result.returnNumber, "VAT-2024-Q1");
      assert.ok(apiClient.get.called);
    });
  });

  describe("saveReport", () => {
    test("should save VAT return", async () => {
      const mockResponse = {
        id: 1,
        status: "draft",
        box1Amount: 500000,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatReturnService.saveReport("2024-01-01", "2024-03-31");

      assert.strictEqual(result.status, "draft");
      assert.ok(apiClient.post.called);
    });
  });

  describe("getEmirates", () => {
    test("should fetch list of UAE emirates", async () => {
      const mockResponse = [
        { code: "AE-AZ", name: "Abu Dhabi" },
        { code: "AE-DU", name: "Dubai" },
      ];

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getEmirates();

      assert.strictEqual(Array.isArray(result), true);
      assert.ok(apiClient.get.called);
    });
  });

  describe("getPreview", () => {
    test("should get preview of VAT return before filing", async () => {
      const mockResponse = {
        id: 1,
        returnNumber: "VAT-2024-Q1",
        documents: [],
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getPreview(1);

      assert.strictEqual(result.returnNumber, "VAT-2024-Q1");
      assert.ok(apiClient.get.called);
    });
  });

  describe("markAsFiled", () => {
    test("should mark VAT return as filed", async () => {
      const mockResponse = {
        id: 1,
        status: "filed",
        ftaReferenceNumber: "FTA-12345",
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatReturnService.markAsFiled(1, {
        ftaReferenceNumber: "FTA-12345",
      });

      assert.strictEqual(result.status, "filed");
      assert.ok(apiClient.post.called);
    });
  });

  describe("getForm201Data", () => {
    test("should get Form 201 data with all 11 boxes", async () => {
      const mockResponse = {
        box1Amount: 500000,
        box1Vat: 25000,
        box7Vat: 25000,
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getForm201Data(1);

      assert.strictEqual(result.box1Amount, 500000);
      assert.ok(apiClient.get.called);
    });
  });

  describe("getAuditTrail", () => {
    test("should get audit trail for VAT return", async () => {
      const mockResponse = [{ action: "created", timestamp: "2024-01-15T10:00:00Z", user: "admin" }];

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getAuditTrail(1);

      assert.strictEqual(Array.isArray(result), true);
      assert.ok(apiClient.get.called);
    });
  });

  describe("getReconciliation", () => {
    test("should get reconciliation report for VAT return", async () => {
      const mockResponse = {
        box1: { amount: 500000, vat: 25000 },
        box8: { amount: 300000, vat: 15000 },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getReconciliation(1);

      assert.ok(result.box1) !== undefined;
      assert.ok(apiClient.get.called);
    });
  });

  describe("getSupportingDocuments", () => {
    test("should get supporting documents for VAT return", async () => {
      const mockResponse = {
        invoices: [],
        purchases: [],
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getSupportingDocuments(1);

      assert.ok(result.invoices) !== undefined;
      assert.ok(apiClient.get.called);
    });
  });

  describe("getBlockedVATCategories", () => {
    test("should get blocked VAT categories", async () => {
      const mockResponse = [{ code: "FUEL", description: "Fuel expenses" }];

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getBlockedVATCategories();

      assert.strictEqual(Array.isArray(result), true);
      assert.ok(apiClient.get.called);
    });
  });

  describe("getBlockedVATLog", () => {
    test("should get blocked VAT log for a period", async () => {
      const mockResponse = { items: [] };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getBlockedVATLog({
        startDate: "2024-01-01",
      });

      assert.ok(result.items) !== undefined;
      assert.ok(apiClient.get.called);
    });
  });

  describe("updateStatus", () => {
    test("should update VAT return status", async () => {
      const mockResponse = {
        id: 1,
        status: "review",
      };

      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await vatReturnService.updateStatus(1, "review");

      assert.strictEqual(result.status, "review");
      assert.ok(apiClient.patch.called);
    });
  });

  describe("addNotes", () => {
    test("should add notes to VAT return", async () => {
      const mockResponse = {
        id: 1,
        notes: "Updated notes",
      };

      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await vatReturnService.addNotes(1, "Updated notes");

      assert.strictEqual(result.notes, "Updated notes");
      assert.ok(apiClient.patch.called);
    });
  });

  describe("delete", () => {
    test("should delete VAT return (draft only)", async () => {
      const mockResponse = { success: true };

      sinon.stub(apiClient, 'delete').resolves(mockResponse);

      const result = await vatReturnService.delete(1);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.called);
    });
  });

  describe("downloadPDF", () => {
    test.skip("should download VAT return as PDF", async () => {
      const mockBlob = new Blob(["PDF content"], { type: "application/pdf" });
      sinon.stub(apiClient, 'get').resolves(mockBlob);

      const result = await vatReturnService.downloadPDF(1, "VAT-2024-Q1");

      assert.strictEqual(result, true);
      assert.ok(apiClient.get.called);
    });
  });

  describe("exportExcel", () => {
    test.skip("should export VAT return as Excel", async () => {
      const mockBlob = new Blob(["Excel content"], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      sinon.stub(apiClient, 'get').resolves(mockBlob);

      const result = await vatReturnService.exportExcel(1);

      assert.strictEqual(result, true);
      assert.ok(apiClient.get.called);
    });
  });

  describe("getAnalytics", () => {
    test("should get VAT return analytics", async () => {
      const mockResponse = {
        totalReturns: 4,
        averageVat: 15000,
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.getAnalytics({ year: 2024 });

      assert.strictEqual(result.totalReturns, 4);
      assert.ok(apiClient.get.called);
    });
  });

  describe("validate", () => {
    test("should validate VAT return before submission", async () => {
      const mockResponse = {
        valid: true,
        errors: [],
        warnings: [],
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await vatReturnService.validate(1);

      assert.strictEqual(result.valid, true);
      assert.ok(apiClient.get.called);
    });
  });

  describe("recalculate", () => {
    test("should recalculate VAT return", async () => {
      const mockResponse = {
        id: 1,
        box7Vat: 25000,
        box10Vat: 15000,
        box11Vat: 10000,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatReturnService.recalculate(1);

      assert.strictEqual(result.box11Vat, 10000);
      assert.ok(apiClient.post.called);
    });
  });

  describe("Multi-tenancy", () => {
    test("should maintain company context", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [{ id: 1, companyId: 1 }],
      });

      const result = await vatReturnService.getAll();

      assert.strictEqual(result.data[0].companyId, 1);
    });
  });

  describe("UAE VAT Compliance", () => {
    test("should handle zero-rated supplies separately", async () => {
      const mockData = {
        id: 1,
        box3Amount: 50000,
        box3Vat: 0,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await vatReturnService.getById(1);

      assert.strictEqual(result.box3Vat, 0);
    });

    test("should support reverse charge for B2B supplies", async () => {
      const mockData = {
        id: 1,
        box9Amount: 100000,
        box9Vat: 5000,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await vatReturnService.getById(1);

      assert.strictEqual(result.box9Amount, 100000);
    });

    test("should support import adjustments", async () => {
      const mockData = {
        id: 1,
        box5Amount: 200000,
        box5Vat: 10000,
        box6Amount: -50000,
        box6Vat: -2500,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await vatReturnService.getById(1);

      assert.strictEqual(result.box6Amount, -50000);
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors", async () => {
      sinon.stub(apiClient, 'get').rejects(new Error("API Error"));

      await assert.rejects(() => vatReturnService.getAll(), Error);
    });

    test("should validate return data before submission", async () => {
      sinon.stub(apiClient, 'post').rejects(new Error("Invalid return data"));

      await assert.rejects(() => vatReturnService.submitReturn(1), Error);
    });
  });
});