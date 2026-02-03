import { beforeEach, describe, expect, it, vi } from "vitest";
import { materialCertificateService } from "../materialCertificateService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("materialCertificateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMaterialCertificates", () => {
    it("should fetch all material certificates", async () => {
      const mockResponse = [
        {
          id: 1,
          certificate_number: "CERT-304-001",
          material: "SS304",
          status: "active",
        },
        {
          id: 2,
          certificate_number: "CERT-316L-001",
          material: "SS316L",
          status: "active",
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await materialCertificateService.getMaterialCertificates();

      expect(result).toHaveLength(2);
      expect(result[0].material).toBe("SS304");
      expect(api.get).toHaveBeenCalledWith(
        "/material-certificates",
        { params: {} }
      );
    });

    it("should filter by material type", async () => {
      api.get.mockResolvedValue([]);

      await materialCertificateService.getMaterialCertificates({
        material: "SS304",
      });

      expect(api.get).toHaveBeenCalledWith(
        "/material-certificates",
        expect.objectContaining({
          params: { material: "SS304" },
        })
      );
    });
  });

  describe("getMaterialCertificate", () => {
    it("should fetch certificate by ID with tests", async () => {
      const mockResponse = {
        id: 1,
        certificate_number: "CERT-304-001",
        material: "SS304",
        mill: "POSCO",
        test_results: {
          tensile_strength: { value: 515, unit: "MPa", status: "pass" },
          yield_strength: { value: 205, unit: "MPa", status: "pass" },
          elongation: { value: 40, unit: "%", status: "pass" },
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await materialCertificateService.getMaterialCertificate(1);

      expect(result.material).toBe("SS304");
      expect(result.test_results.tensile_strength.status).toBe("pass");
      expect(api.get).toHaveBeenCalledWith("/material-certificates/1");
    });
  });

  describe("createMaterialCertificate", () => {
    it("should create new material certificate", async () => {
      const mockResponse = {
        id: 1,
        certificate_number: "CERT-304-001",
        material: "SS304",
        status: "pending",
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        material: "SS304",
        mill: "POSCO",
        batch_number: "BATCH-123",
      };

      const result = await materialCertificateService.createMaterialCertificate(
        payload
      );

      expect(result.certificate_number).toBe("CERT-304-001");
      expect(api.post).toHaveBeenCalledWith(
        "/material-certificates",
        payload
      );
    });
  });

  describe("updateMaterialCertificate", () => {
    it("should update material certificate", async () => {
      const mockResponse = {
        id: 1,
        certificate_number: "CERT-304-001",
        status: "verified",
      };

      api.put.mockResolvedValue(mockResponse);

      const payload = { status: "verified" };

      const result = await materialCertificateService.updateMaterialCertificate(
        1,
        payload
      );

      expect(result.status).toBe("verified");
      expect(api.put).toHaveBeenCalledWith(
        "/material-certificates/1",
        payload
      );
    });
  });

  describe("deleteMaterialCertificate", () => {
    it("should delete certificate", async () => {
      api.delete.mockResolvedValue({ success: true });

      const result = await materialCertificateService.deleteMaterialCertificate(
        1
      );

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/material-certificates/1");
    });
  });

  describe("uploadTestReport", () => {
    it("should upload test report for certificate", async () => {
      const mockResponse = {
        id: 1,
        test_report_url: "/files/test-report-123.pdf",
        uploaded_at: "2024-01-15T10:00:00Z",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await materialCertificateService.uploadTestReport(
        1,
        "file-content"
      );

      expect(result.test_report_url).toContain("test-report");
      expect(api.post).toHaveBeenCalledWith(
        "/material-certificates/1/test-report",
        expect.any(Object)
      );
    });
  });

  describe("verifyTestResults", () => {
    it("should verify test results against standards", async () => {
      const mockResponse = {
        all_tests_pass: true,
        results: [
          { test_name: "tensile_strength", status: "pass" },
          { test_name: "yield_strength", status: "pass" },
          { test_name: "elongation", status: "pass" },
        ],
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await materialCertificateService.verifyTestResults(1);

      expect(result.all_tests_pass).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(api.post).toHaveBeenCalledWith(
        "/material-certificates/1/verify",
        expect.any(Object)
      );
    });
  });
});
