import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api.js";
import { materialCertificateService } from "../materialCertificateService.js";

describe("materialCertificateService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await materialCertificateService.getMaterialCertificates();

      expect(result).toBeTruthy();
      expect(result[0].material).toBeTruthy();
      expect(api.get).toHaveBeenCalledWith("/material-certificates", { params: {} });
    });

    it("should filter by material type", async () => {
      vi.spyOn(api, "get").mockResolvedValue([]);

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

      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await materialCertificateService.getMaterialCertificate(1);

      expect(result.material).toBeTruthy();
      expect(result.test_results.tensile_strength.status).toBeTruthy();
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

      vi.spyOn(api, "post").mockResolvedValue(mockResponse);

      const payload = {
        material: "SS304",
        mill: "POSCO",
        batch_number: "BATCH-123",
      };

      const result = await materialCertificateService.createMaterialCertificate(payload);

      expect(result.certificate_number).toBeTruthy();
      expect(api.post).toHaveBeenCalledWith("/material-certificates", payload);
    });
  });

  describe("updateMaterialCertificate", () => {
    it("should update material certificate", async () => {
      const mockResponse = {
        id: 1,
        certificate_number: "CERT-304-001",
        status: "verified",
      };

      vi.spyOn(api, "put").mockResolvedValue(mockResponse);

      const payload = { status: "verified" };

      const result = await materialCertificateService.updateMaterialCertificate(1, payload);

      expect(result.status).toBeTruthy();
      expect(api.put).toHaveBeenCalledWith("/material-certificates/1", payload);
    });
  });

  describe("deleteMaterialCertificate", () => {
    it("should delete certificate", async () => {
      vi.spyOn(api, "delete").mockResolvedValue({ success: true });

      const result = await materialCertificateService.deleteMaterialCertificate(1);

      expect(result.success).toBeTruthy();
      expect(api.delete).toHaveBeenCalledWith("/material-certificates/1");
    });
  });

  describe("updateVerification", () => {
    it("should update verification status", async () => {
      const mockResponse = {
        id: 1,
        verification_status: "verified",
      };

      vi.spyOn(api, "patch").mockResolvedValue(mockResponse);

      const result = await materialCertificateService.updateVerification(1, "verified", "All checks passed");

      expect(result.verification_status).toBe("verified");
      expect(api.patch).toHaveBeenCalledWith("/material-certificates/1/verify", {
        verification_status: "verified",
        notes: "All checks passed",
      });
    });
  });
});
