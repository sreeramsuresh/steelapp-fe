/**
 * Audit Hub Service Unit Tests
 * Tests for accounting periods, datasets, exports, reconciliations, and sign-offs
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from "../api.js";
import auditHubService from "../auditHubService.js";

describe("auditHubService", () => {
  const companyId = "company-123";
  const periodId = "period-456";
  const datasetId = "dataset-789";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Accounting Periods", () => {
    it("should get periods with filters", async () => {
      const mockPeriods = [
        { id: 1, year: 2024, month: 1, status: "OPEN" },
        { id: 2, year: 2024, month: 2, status: "OPEN" },
      ];
      api.get.mockResolvedValueOnce({ data: mockPeriods });

      const result = await auditHubService.getPeriods(companyId, {
        year: 2024,
        status: "OPEN",
      });

      expect(result).toEqual(mockPeriods);
      expect(api.get).toHaveBeenCalled();
      const call = api.get.mock.calls[0];
      expect(call[0]).toContain("/accounting-periods");
      expect(call[1].headers["X-Company-Id"]).toBe(companyId);
    });

    it("should get period by ID", async () => {
      const mockPeriod = {
        id: 1,
        year: 2024,
        month: 1,
        status: "OPEN",
        openingBalance: 1000000,
      };
      api.get.mockResolvedValueOnce({ data: mockPeriod });

      const result = await auditHubService.getPeriodById(companyId, periodId);

      expect(result).toEqual(mockPeriod);
      expect(api.get).toHaveBeenCalledWith(`/accounting-periods/${periodId}`, {
        headers: { "X-Company-Id": companyId },
      });
    });

    it("should create new period", async () => {
      const mockResponse = {
        id: 3,
        year: 2024,
        month: 3,
        status: "OPEN",
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.createPeriod(companyId, "MONTHLY", 2024, 3);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        "/accounting-periods",
        {
          periodType: "MONTHLY",
          year: 2024,
          month: 3,
        },
        {
          headers: { "X-Company-Id": companyId },
        }
      );
    });

    it("should close accounting period", async () => {
      const mockResponse = { id: 1, status: "CLOSED" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.closePeriod(companyId, periodId);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        `/accounting-periods/${periodId}/close`,
        {},
        {
          headers: { "X-Company-Id": companyId },
        }
      );
    });

    it("should lock accounting period", async () => {
      const mockResponse = { id: 1, status: "LOCKED" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.lockPeriod(companyId, periodId);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        `/accounting-periods/${periodId}/lock`,
        {},
        {
          headers: { "X-Company-Id": companyId },
        }
      );
    });
  });

  describe("Datasets", () => {
    it("should get datasets for period", async () => {
      const mockDatasets = [
        { id: 1, name: "January Data", period_id: periodId },
        { id: 2, name: "February Data", period_id: periodId },
      ];
      api.get.mockResolvedValueOnce({ data: mockDatasets });

      const result = await auditHubService.getDatasets(companyId, periodId);

      expect(result).toEqual(mockDatasets);
      expect(api.get).toHaveBeenCalledWith(`/audit-hub/datasets?period_id=${periodId}`, {
        headers: { "X-Company-Id": companyId },
      });
    });

    it("should get dataset by ID", async () => {
      const mockDataset = {
        id: datasetId,
        name: "January Data",
        period_id: periodId,
        recordCount: 1500,
      };
      api.get.mockResolvedValueOnce({ data: mockDataset });

      const result = await auditHubService.getDatasetById(companyId, datasetId);

      expect(result).toEqual(mockDataset);
      expect(api.get).toHaveBeenCalledWith(`/audit-hub/datasets/${datasetId}`, {
        headers: { "X-Company-Id": companyId },
      });
    });

    it("should get dataset transactions with pagination", async () => {
      const mockTransactions = [
        { id: 1, type: "INVOICE", amount: 1000 },
        { id: 2, type: "PAYMENT", amount: 500 },
      ];
      api.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await auditHubService.getDatasetTransactions(
        companyId,
        datasetId,
        "INVOICES",
        { page: 1, limit: 20 }
      );

      expect(result).toEqual(mockTransactions);
      const call = api.get.mock.calls[0];
      expect(call[0]).toContain(`/audit-hub/datasets/${datasetId}/transactions`);
      expect(call[0]).toContain("module=INVOICES");
      expect(call[0]).toContain("page=1");
      expect(call[0]).toContain("limit=20");
    });
  });

  describe("Exports", () => {
    it("should generate Excel export", async () => {
      const mockResponse = { jobId: "job-123", status: "QUEUED" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.generateExcelExport(companyId, datasetId);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        `/audit-hub/datasets/${datasetId}/export/excel`,
        {},
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should generate PDF export", async () => {
      const mockResponse = { jobId: "job-124", status: "QUEUED" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.generatePDFExport(companyId, datasetId);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        `/audit-hub/datasets/${datasetId}/export/pdf`,
        {},
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should generate CSV export with module", async () => {
      const mockResponse = { jobId: "job-125", status: "QUEUED" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.generateCSVExport(companyId, datasetId, "INVOICES");

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        `/audit-hub/datasets/${datasetId}/export/csv/invoices`,
        {},
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should get export status", async () => {
      const mockStatus = { status: "COMPLETED", downloadUrl: "https://example.com/file.xlsx" };
      api.get.mockResolvedValueOnce({ data: mockStatus });

      const result = await auditHubService.getExportStatus(companyId, datasetId);

      expect(result).toEqual(mockStatus);
      expect(api.get).toHaveBeenCalledWith(`/audit-hub/datasets/${datasetId}/export/status`, {
        headers: { "X-Company-Id": companyId },
      });
    });

    it("should download export", async () => {
      const mockBlob = new Blob(["test data"]);
      api.get.mockResolvedValueOnce(mockBlob);

      const result = await auditHubService.downloadExport(companyId, datasetId, "EXCEL");

      expect(result).toEqual(mockBlob);
      expect(api.get).toHaveBeenCalledWith(
        `/audit-hub/exports/download/${datasetId}/excel`,
        {
          headers: { "X-Company-Id": companyId },
          responseType: "blob",
        }
      );
    });

    it("should verify export regeneration", async () => {
      const mockResponse = { verified: true, checksum: "abc123" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.verifyExportRegeneration(companyId, datasetId, "EXCEL");

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        `/audit-hub/datasets/${datasetId}/export/verify`,
        { export_type: "EXCEL" },
        { headers: { "X-Company-Id": companyId } }
      );
    });
  });

  describe("Reconciliations", () => {
    it("should get reconciliations for fiscal period", async () => {
      const mockReconciliations = [
        { id: 1, type: "AR", status: "PASSED", differences: 0 },
        { id: 2, type: "AP", status: "REVIEW_NEEDED", differences: 150.50 },
      ];
      api.get.mockResolvedValueOnce({ data: mockReconciliations });

      const result = await auditHubService.getReconciliations(companyId, "2024-Q1");

      expect(result).toEqual(mockReconciliations);
      expect(api.get).toHaveBeenCalledWith(
        "/reconciliations?fiscal_period=2024-Q1",
        {
          headers: { "X-Company-Id": companyId },
        }
      );
    });

    it("should reconcile AR", async () => {
      const mockResult = {
        reconciliationId: 1,
        status: "COMPLETED",
        matched: 145,
        unmatched: 3,
      };
      api.post.mockResolvedValueOnce({ data: mockResult });

      const result = await auditHubService.reconcileAR(companyId, "2024-Q1");

      expect(result).toEqual(mockResult);
      expect(api.post).toHaveBeenCalledWith(
        "/reconciliations/ar",
        { fiscal_period: "2024-Q1" },
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should reconcile AP", async () => {
      const mockResult = {
        reconciliationId: 2,
        status: "COMPLETED",
        matched: 98,
        unmatched: 2,
      };
      api.post.mockResolvedValueOnce({ data: mockResult });

      const result = await auditHubService.reconcileAP(companyId, "2024-Q1");

      expect(result).toEqual(mockResult);
      expect(api.post).toHaveBeenCalledWith(
        "/reconciliations/ap",
        { fiscal_period: "2024-Q1" },
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should reconcile inventory", async () => {
      const mockResult = {
        reconciliationId: 3,
        status: "COMPLETED",
        matchedItems: 450,
        discrepancies: 5,
      };
      api.post.mockResolvedValueOnce({ data: mockResult });

      const result = await auditHubService.reconcileInventory(companyId, "2024-Q1");

      expect(result).toEqual(mockResult);
      expect(api.post).toHaveBeenCalledWith(
        "/reconciliations/inventory",
        { fiscal_period: "2024-Q1" },
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should get reconciliation exceptions", async () => {
      const mockExceptions = [
        { id: 1, type: "AMOUNT_MISMATCH", amount: 150.50 },
        { id: 2, type: "MISSING_DOCUMENT", amount: 0 },
      ];
      api.get.mockResolvedValueOnce({ data: mockExceptions });

      const result = await auditHubService.getReconciliationExceptions(companyId, 1);

      expect(result).toEqual(mockExceptions);
      expect(api.get).toHaveBeenCalledWith("/reconciliations/1/exceptions", {
        headers: { "X-Company-Id": companyId },
      });
    });
  });

  describe("Sign-Offs", () => {
    it("should submit sign-off", async () => {
      const mockResponse = { id: 1, status: "PENDING_REVIEW", submittedAt: "2024-02-01T10:00:00Z" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.submitSignOff(companyId, datasetId, "PREPARED_BY", "Initial submission");

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        "/audit-hub/sign-offs",
        { datasetId, signOffType: "PREPARED_BY", notes: "Initial submission" },
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should get sign-offs for dataset", async () => {
      const mockSignOffs = [
        { id: 1, type: "PREPARED_BY", status: "COMPLETED", user: "alice@example.com" },
        { id: 2, type: "REVIEWED_BY", status: "PENDING", user: "bob@example.com" },
      ];
      api.get.mockResolvedValueOnce({ data: mockSignOffs });

      const result = await auditHubService.getSignOffs(companyId, datasetId);

      expect(result).toEqual(mockSignOffs);
      expect(api.get).toHaveBeenCalledWith(`/audit-hub/sign-offs/dataset/${datasetId}`, {
        headers: { "X-Company-Id": companyId },
      });
    });

    it("should get sign-off status", async () => {
      const mockStatus = { totalRequired: 3, completed: 2, pending: 1, completionPercent: 67 };
      api.get.mockResolvedValueOnce({ data: mockStatus });

      const result = await auditHubService.getSignOffStatus(companyId, datasetId);

      expect(result).toEqual(mockStatus);
      expect(api.get).toHaveBeenCalledWith(`/audit-hub/sign-offs/dataset/${datasetId}/status`, {
        headers: { "X-Company-Id": companyId },
      });
    });

    it("should approve sign-off", async () => {
      const mockResponse = { id: 1, status: "APPROVED", approvedAt: "2024-02-01T11:00:00Z" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.approveSignOff(companyId, 1, "Looks good");

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        "/audit-hub/sign-offs/1/approve",
        { approvalNotes: "Looks good" },
        { headers: { "X-Company-Id": companyId } }
      );
    });

    it("should reject sign-off", async () => {
      const mockResponse = { id: 1, status: "REJECTED", rejectionReason: "Please fix the discrepancies" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.rejectSignOff(companyId, 1, "Please fix the discrepancies");

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(
        "/audit-hub/sign-offs/1/reject",
        { rejectionReason: "Please fix the discrepancies" },
        { headers: { "X-Company-Id": companyId } }
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle period fetch errors", async () => {
      const error = new Error("Network error");
      api.get.mockRejectedValueOnce(error);

      await expect(auditHubService.getPeriods(companyId)).rejects.toThrow("Network error");
    });

    it("should handle dataset creation errors", async () => {
      const error = new Error("Validation failed");
      api.post.mockRejectedValueOnce(error);

      await expect(auditHubService.generateExcelExport(companyId, datasetId)).rejects.toThrow(
        "Validation failed"
      );
    });

    it("should include company ID in all requests", async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await auditHubService.getPeriods(companyId);

      const call = api.get.mock.calls[0];
      expect(call[1].headers["X-Company-Id"]).toBe(companyId);
    });
  });

  describe("Multi-tenancy Compliance", () => {
    it("should enforce company_id in all GET operations", async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      await auditHubService.getPeriodById(companyId, periodId);

      const call = api.get.mock.calls[0];
      expect(call[1]).toHaveProperty("headers");
      expect(call[1].headers).toHaveProperty("X-Company-Id");
      expect(call[1].headers["X-Company-Id"]).toBe(companyId);
    });

    it("should enforce company_id in all POST operations", async () => {
      api.post.mockResolvedValueOnce({ data: {} });

      await auditHubService.closePeriod(companyId, periodId);

      const call = api.post.mock.calls[0];
      expect(call[2]).toHaveProperty("headers");
      expect(call[2].headers).toHaveProperty("X-Company-Id");
      expect(call[2].headers["X-Company-Id"]).toBe(companyId);
    });
  });
});
