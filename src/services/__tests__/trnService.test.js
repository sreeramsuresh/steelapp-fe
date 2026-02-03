import { beforeEach, describe, expect, it, vi } from "vitest";
import { trnService } from "../trnService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("trnService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTrnInfo", () => {
    it("should fetch company TRN information", async () => {
      const mockResponse = {
        trn: "100123456700001",
        company_name: "Ultimate Steel Trading",
        registration_date: "2020-01-15",
        status: "active",
        vat_filer: true,
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await trnService.getTrnInfo();

      expect(result.trn).toBe("100123456700001");
      expect(result.vat_filer).toBe(true);
      expect(api.get).toHaveBeenCalledWith("/trn/info");
    });
  });

  describe("validateTrn", () => {
    it("should validate TRN format and active status", async () => {
      const mockResponse = {
        trn: "100123456700001",
        is_valid: true,
        is_active: true,
        company_name: "Ultimate Steel Trading",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await trnService.validateTrn("100123456700001");

      expect(result.is_valid).toBe(true);
      expect(result.is_active).toBe(true);
      expect(api.post).toHaveBeenCalledWith(
        "/trn/validate",
        expect.any(Object)
      );
    });

    it("should reject invalid TRN format", async () => {
      const mockResponse = {
        trn: "INVALID",
        is_valid: false,
        error: "Invalid TRN format",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await trnService.validateTrn("INVALID");

      expect(result.is_valid).toBe(false);
    });
  });

  describe("getTrnHistory", () => {
    it("should fetch TRN history and changes", async () => {
      const mockResponse = [
        {
          id: 1,
          trn: "100123456700001",
          change_date: "2020-01-15",
          change_type: "registration",
          changed_by: "admin",
        },
        {
          id: 2,
          trn: "100123456700001",
          change_date: "2023-06-01",
          change_type: "status_update",
          changed_by: "compliance",
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await trnService.getTrnHistory();

      expect(result).toHaveLength(2);
      expect(result[0].change_type).toBe("registration");
    });
  });

  describe("updateTrnStatus", () => {
    it("should update TRN status", async () => {
      const mockResponse = {
        trn: "100123456700001",
        status: "suspended",
        effective_date: "2024-01-15T10:00:00Z",
      };

      api.put.mockResolvedValue(mockResponse);

      const payload = { status: "suspended", reason: "Non-compliance" };

      const result = await trnService.updateTrnStatus(payload);

      expect(result.status).toBe("suspended");
      expect(api.put).toHaveBeenCalledWith("/trn/status", payload);
    });
  });

  describe("checkVatComplianceStatus", () => {
    it("should check VAT compliance status", async () => {
      const mockResponse = {
        trn: "100123456700001",
        is_compliant: true,
        last_return_filed: "2024-01-15",
        returns_pending: 0,
        compliance_percentage: 100,
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await trnService.checkVatComplianceStatus();

      expect(result.is_compliant).toBe(true);
      expect(result.compliance_percentage).toBe(100);
    });
  });
});
