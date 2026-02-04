import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { materialCertificateService } from "../materialCertificateService.js";


import { api } from "../api.js";

describe("materialCertificateService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getMaterialCertificates", () => {
    test("should fetch all material certificates", async () => {
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

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await materialCertificateService.getMaterialCertificates();

      assert.ok(result);
      assert.ok(result[0].material);
      assert.ok(api.get).toHaveBeenCalledWith("/material-certificates", { params: {} });
    });

    test("should filter by material type", async () => {
      sinon.stub(api, 'get').resolves([]);

      await materialCertificateService.getMaterialCertificates({
        material: "SS304",
      });

      assert.ok(api.get).toHaveBeenCalledWith(
        "/material-certificates",
        Object.keys({
          params: { material: "SS304" },
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getMaterialCertificate", () => {
    test("should fetch certificate by ID with tests", async () => {
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

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await materialCertificateService.getMaterialCertificate(1);

      assert.ok(result.material);
      assert.ok(result.test_results.tensile_strength.status);
      assert.ok(api.get).toHaveBeenCalledWith("/material-certificates/1");
    });
  });

  describe("createMaterialCertificate", () => {
    test("should create new material certificate", async () => {
      const mockResponse = {
        id: 1,
        certificate_number: "CERT-304-001",
        material: "SS304",
        status: "pending",
      };

      sinon.stub(api, 'post').resolves(mockResponse);

      const payload = {
        material: "SS304",
        mill: "POSCO",
        batch_number: "BATCH-123",
      };

      const result = await materialCertificateService.createMaterialCertificate(payload);

      assert.ok(result.certificate_number);
      assert.ok(api.post).toHaveBeenCalledWith("/material-certificates", payload);
    });
  });

  describe("updateMaterialCertificate", () => {
    test("should update material certificate", async () => {
      const mockResponse = {
        id: 1,
        certificate_number: "CERT-304-001",
        status: "verified",
      };

      sinon.stub(api, 'put').resolves(mockResponse);

      const payload = { status: "verified" };

      const result = await materialCertificateService.updateMaterialCertificate(1, payload);

      assert.ok(result.status);
      assert.ok(api.put).toHaveBeenCalledWith("/material-certificates/1", payload);
    });
  });

  describe("deleteMaterialCertificate", () => {
    test("should delete certificate", async () => {
      sinon.stub(api, 'delete').resolves({ success: true });

      const result = await materialCertificateService.deleteMaterialCertificate(1);

      assert.ok(result.success);
      assert.ok(api.delete).toHaveBeenCalledWith("/material-certificates/1");
    });
  });

  describe("uploadTestReport", () => {
    test("should upload test report for certificate", async () => {
      const mockResponse = {
        id: 1,
        test_report_url: "/files/test-report-123.pdf",
        uploaded_at: "2024-01-15T10:00:00Z",
      };

      sinon.stub(api, 'post').resolves(mockResponse);

      const result = await materialCertificateService.uploadTestReport(1, "file-content");

      assert.ok(result.test_report_url);
      assert.ok(api.post).toHaveBeenCalledWith("/material-certificates/1/test-report", );
    });
  });

  describe("verifyTestResults", () => {
    test("should verify test results against standards", async () => {
      const mockResponse = {
        all_tests_pass: true,
        results: [
          { test_name: "tensile_strength", status: "pass" },
          { test_name: "yield_strength", status: "pass" },
          { test_name: "elongation", status: "pass" },
        ],
      };

      sinon.stub(api, 'post').resolves(mockResponse);

      const result = await materialCertificateService.verifyTestResults(1);

      assert.ok(result.all_tests_pass);
      assert.ok(result.results);
      assert.ok(api.post).toHaveBeenCalledWith("/material-certificates/1/verify", );
    });
  });
});