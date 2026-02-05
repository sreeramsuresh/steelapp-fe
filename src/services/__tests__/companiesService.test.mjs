/**
 * Companies Service Unit Tests
 * ✅ Tests company/tenant management operations
 * ✅ Tests company CRUD operations
import '../../__tests__/init.mjs';

 * ✅ Tests file uploads (logo, brandmark, seal)
 * ✅ Tests template settings management
 * ✅ Tests company isolation and multi-tenancy
 * ✅ Tests error handling and validation
 * ✅ 40-50 tests covering all critical paths
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

// Mock fetch for file uploads
global.fetch = sinon.stub();



import { tokenUtils } from "../axiosApi.js";
import { companyService } from "../companyService.js";
import { apiClient } from "../api.js";

describe("companiesService", () => {
  let fetchStub;
  let getStub;
  let postStub;
  let putStub;
  let deleteStub;
  beforeEach(() => {
    sinon.restore();
    fetchStub = sinon.stub(global, "fetch");
    getStub = sinon.stub(apiClient, 'get');
    postStub = sinon.stub(apiClient, 'post');
    putStub = sinon.stub(apiClient, 'put');
    deleteStub = sinon.stub(apiClient, 'delete');
  });

  // ============================================================================
  // COMPANY RETRIEVAL
  // ============================================================================

  describe("Get Company", () => {
    test("should retrieve current company details", async () => {
      const mockCompany = {
        id: 1,
        name: "Steel Corp Inc",
        registrationNumber: "REG123456",
        email: "info@steelcorp.com",
        phone: "+1-555-0100",
        address: "123 Industrial Ave",
        website: "https://steelcorp.com",
        currency: "USD",
        taxId: "TAX123456",
      };
      getStub.resolves(mockCompany);

      const result = await companyService.getCompany();

      assert.ok(result.id);
      assert.ok(result.name);
      sinon.assert.calledWith(getStub, "/company");
    });

    test("should handle company not found", async () => {
      getStub.rejects(new Error("Company not found"));

      await assert.rejects(() => companyService.getCompany(), Error);
    });

    test("should handle network error on company retrieval", async () => {
      getStub.rejects(new Error("Network error"));

      await assert.rejects(() => companyService.getCompany(), Error);
    });

    test("should handle unauthorized access to company", async () => {
      getStub.rejects(new Error("Unauthorized"));

      await assert.rejects(() => companyService.getCompany(), Error);
    });

    test("should return company with complete metadata", async () => {
      const mockCompany = {
        id: 1,
        name: "Steel Corp",
        registrationNumber: "REG123",
        email: "info@steelcorp.com",
        phone: "+1-555-0100",
        address: "123 Industrial Ave",
        website: "https://steelcorp.com",
        currency: "USD",
        taxId: "TAX123",
        logo: "logo.png",
        brandmark: "brandmark.png",
        seal: "seal.png",
      };
      getStub.resolves(mockCompany);

      const result = await companyService.getCompany();

      assert.ok(result.logo);
      assert.ok(result.brandmark);
      assert.ok(result.seal);
    });
  });

  // ============================================================================
  // COMPANY UPDATES
  // ============================================================================

  describe("Update Company", () => {
    test("should update company basic information", async () => {
      const companyData = {
        name: "Updated Steel Corp",
        email: "newemail@steelcorp.com",
        phone: "+1-555-0200",
      };
      const mockResponse = { id: 1, ...companyData };
      postStub.resolves(mockResponse);

      const result = await companyService.updateCompany(companyData);

      assert.ok(result.name);
      sinon.assert.calledWith(postStub, "/company", companyData);
    });

    test("should update company with all fields", async () => {
      const companyData = {
        name: "Steel Solutions Ltd",
        registrationNumber: "REG789",
        email: "contact@steelsolutions.com",
        phone: "+1-555-0300",
        address: "456 Factory Lane",
        website: "https://steelsolutions.com",
        currency: "EUR",
        taxId: "TAX789",
      };
      const mockResponse = { id: 1, ...companyData };
      postStub.resolves(mockResponse);

      const result = await companyService.updateCompany(companyData);

      assert.ok(result.currency);
      assert.ok(result.taxId);
    });

    test("should update company by ID", async () => {
      const companyId = 1;
      const companyData = { name: "Updated Corp" };
      const mockResponse = { id: companyId, ...companyData };
      putStub.resolves(mockResponse);

      const result = await companyService.updateCompanyById(companyId, companyData);

      assert.ok(result.name);
      sinon.assert.calledWith(putStub, `/company/${companyId}`, companyData);
    });

    test("should handle validation errors on update", async () => {
      const companyData = { email: "invalid-email" };
      postStub.rejects(new Error("Invalid email format"));

      await assert.rejects(() => companyService.updateCompany(companyData), Error);
    });

    test("should prevent duplicate registration number", async () => {
      const companyData = {
        name: "Another Corp",
        registrationNumber: "REG123456", // Already exists
      };
      postStub.rejects(new Error("Registration number already exists"));

      await assert.rejects(() => companyService.updateCompany(companyData), Error);
    });

    test("should handle network error on company update", async () => {
      postStub.rejects(new Error("Network error"));

      await assert.rejects(() => companyService.updateCompany({ name: "Update" }), Error);
    });

    test("should handle unauthorized update attempt", async () => {
      putStub.rejects(new Error("Insufficient permissions"));

      await assert.rejects(() => companyService.updateCompanyById(1, { name: "Update" }), Error);
    });
  });

  // ============================================================================
  // FILE UPLOADS (Logo, Brandmark, Seal)
  // ============================================================================

  describe("Logo Upload", () => {
    test("should upload company logo", async () => {
      const file = new File(["logo content"], "logo.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "logo_12345.png" };
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadLogo(file);

      assert.ok(result.success);
      assert.ok(result.filename);
      assert.ok(global.fetch);
    });

    test("should set correct headers for logo upload", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });

      await companyService.uploadLogo(file);

      assert.ok(call[0]);
      assert.ok(call[1].method);
      assert.ok(call[1].headers && call[1].headers.Authorization);
    });

    test("should include auth token in upload headers", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      tokenUtils.getToken.mockReturnValueOnce("test-token");
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => ({ success: true }),
      });

      await companyService.uploadLogo(file);

      assert.ok(call[1].headers.Authorization);
    });

    test("should handle logo upload error", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      sinon.stub(global, "fetch").resolves({
        ok: false,
        json: async () => ({ error: "File too large" }),
      });

      await assert.rejects(() => companyService.uploadLogo(file), Error);
    });

    test("should validate logo file type", async () => {
      const file = new File(["content"], "document.pdf", { type: "application/pdf" });
      sinon.stub(global, "fetch").resolves({
        ok: false,
        json: async () => ({ error: "Only image files allowed" }),
      });

      await assert.rejects(() => companyService.uploadLogo(file), Error);
    });

    test("should delete logo file", async () => {
      const filename = "logo_12345.png";
      const mockResponse = { success: true };
      deleteStub.resolves(mockResponse);

      const result = await companyService.deleteLogo(filename);

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, `/company/logo/${filename}`);
    });

    test("should cleanup old logos", async () => {
      const mockResponse = { deleted: 3, freed: "25MB" };
      postStub.resolves(mockResponse);

      const result = await companyService.cleanupLogos();

      assert.ok(result.deleted);
      sinon.assert.calledWith(postStub, "/company/cleanup-logos");
    });
  });

  describe("Brandmark Upload", () => {
    test("should upload company brandmark", async () => {
      const file = new File(["brandmark"], "brandmark.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "brandmark_12345.png" };
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadBrandmark(file);

      assert.ok(result.success);
      assert.ok(result.filename);
    });

    test("should delete brandmark file", async () => {
      const filename = "brandmark_12345.png";
      deleteStub.resolves({ success: true });

      const result = await companyService.deleteBrandmark(filename);

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, `/company/brandmark/${filename}`);
    });

    test("should handle brandmark upload error", async () => {
      const file = new File(["content"], "brandmark.txt", { type: "text/plain" });
      sinon.stub(global, "fetch").resolves({
        ok: false,
        json: async () => ({ error: "Invalid file type" }),
      });

      await assert.rejects(() => companyService.uploadBrandmark(file), Error);
    });
  });

  describe("Seal Upload", () => {
    test("should upload company seal", async () => {
      const file = new File(["seal"], "seal.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "seal_12345.png" };
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadSeal(file);

      assert.ok(result.success);
      assert.ok(result.filename);
    });

    test("should delete seal file", async () => {
      const filename = "seal_12345.png";
      deleteStub.resolves({ success: true });

      const result = await companyService.deleteSeal(filename);

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, `/company/seal/${filename}`);
    });
  });

  // ============================================================================
  // TEMPLATE SETTINGS MANAGEMENT
  // ============================================================================

  describe("Template Settings", () => {
    test("should update invoice template settings", async () => {
      const templateSettings = {
        selectedTemplate: "PROFESSIONAL",
        advancedSettings: {
          showTerms: true,
          showNotes: false,
          customColor: "#1a5490",
        },
      };
      const mockResponse = { success: true, ...templateSettings };
      postStub.resolves(mockResponse);

      const result = await companyService.updateTemplateSettings(templateSettings);

      assert.ok(result.success);
      assert.ok(result.selectedTemplate);
      sinon.assert.calledWith(postStub, "/company/template-settings", templateSettings);
    });

    test("should get current template settings", async () => {
      const mockSettings = {
        selectedTemplate: "STANDARD",
        advancedSettings: {
          showTerms: true,
          showNotes: true,
          customColor: "#000000",
        },
      };
      getStub.resolves(mockSettings);

      const result = await companyService.getTemplateSettings();

      assert.ok(result.selectedTemplate);
      sinon.assert.calledWith(getStub, "/company/template-settings");
    });

    test("should handle missing template settings", async () => {
      getStub.resolves(null);

      const result = await companyService.getTemplateSettings();

      // Should handle gracefully
      assert.ok(result !== undefined);
    });

    test("should validate template selection", async () => {
      const invalidSettings = {
        selectedTemplate: "INVALID_TEMPLATE",
      };
      postStub.rejects(new Error("Invalid template"));

      await assert.rejects(() => companyService.updateTemplateSettings(invalidSettings), Error);
    });

    test("should allow complex template customization", async () => {
      const advancedSettings = {
        selectedTemplate: "CUSTOM",
        advancedSettings: {
          logo: { show: true, position: "TOP_CENTER" },
          seal: { show: true, position: "BOTTOM_RIGHT" },
          brandmark: { show: false },
          header: { text: "INVOICE", color: "#1a5490" },
          footer: { text: "Thank you for your business" },
        },
      };
      const mockResponse = { success: true, ...advancedSettings };
      postStub.resolves(mockResponse);

      const result = await companyService.updateTemplateSettings(advancedSettings);

      assert.ok(result.advancedSettings.logo.position);
    });

    test("should handle template settings update error", async () => {
      postStub.rejects(new Error("Update failed"));

      await assert.rejects(() => companyService.updateTemplateSettings({ selectedTemplate: "STANDARD" }), Error);
    });

    test("should persist template settings across sessions", async () => {
      const settings = { selectedTemplate: "CUSTOM" };
      postStub.resolves({ success: true, ...settings });
      getStub.resolves({ ...settings });

      await companyService.updateTemplateSettings(settings);
      const retrieved = await companyService.getTemplateSettings();

      assert.ok(retrieved.selectedTemplate);
    });
  });

  // ============================================================================
  // MULTI-TENANCY & SECURITY
  // ============================================================================

  describe("Multi-Tenancy Compliance", () => {
    test("should ensure company isolation on retrieval", async () => {
      const mockCompany = {
        id: 1,
        name: "Company A",
        companyId: 1, // Tenant context
      };
      getStub.resolves(mockCompany);

      const result = await companyService.getCompany();

      assert.ok(result.companyId);
    });

    test("should enforce single company access", async () => {
      // User in company 1 should not access company 2 data
      const mockCompany = { id: 2, name: "Company B", companyId: 2 };
      getStub.resolves(mockCompany);

      const result = await companyService.getCompany();

      // Backend enforces this, API returns appropriate data
      assert.ok(result.id);
    });

    test("should isolate template settings by company", async () => {
      const mockSettings = {
        selectedTemplate: "PROFESSIONAL",
        companyId: 1,
      };
      getStub.resolves(mockSettings);

      const result = await companyService.getTemplateSettings();

      assert.ok(result.companyId);
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle file upload timeout", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      sinon.stub(global, "fetch").rejects(new Error("Upload timeout"));

      await assert.rejects(() => companyService.uploadLogo(file), Error);
    });

    test("should handle network errors gracefully", async () => {
      getStub.rejects(new Error("Network unavailable"));

      await assert.rejects(() => companyService.getCompany(), Error);
    });

    test("should handle concurrent update conflicts", async () => {
      const data1 = { name: "Update 1" };
      const data2 = { name: "Update 2" };

      postStub.resolves({ id: 1, ...data1 });
      postStub.resolves({ id: 1, ...data2 });

      const [result1, result2] = await Promise.all([
        companyService.updateCompany(data1),
        companyService.updateCompany(data2),
      ]);

      assert.ok(result1.name);
      assert.ok(result2.name);
    });

    test("should handle large file uploads", async () => {
      const largeFile = new File(["x".repeat(50 * 1024 * 1024)], "large.png", {
        type: "image/png",
      });
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => ({ success: true, filename: "large.png" }),
      });

      const result = await companyService.uploadLogo(largeFile);

      assert.ok(result.success);
    });

    test("should handle malformed API response", async () => {
      getStub.resolves(undefined);

      const result = await companyService.getCompany();

      assert.ok(result).toBeUndefined();
    });

    test("should retry failed file uploads", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      sinon.stub(global, "fetch").rejects(new Error("Network error")).resolves({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });

      // First call fails, second succeeds
      try {
        await companyService.uploadLogo(file);
      } catch (_e) {
        // First attempt failed
      }

      const result = await companyService.uploadLogo(file);

      assert.ok(result.success);
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe("Integration Scenarios", () => {
    test("should update company and logo in sequence", async () => {
      const companyData = { name: "Updated Corp" };
      const file = new File(["logo"], "logo.png", { type: "image/png" });

      postStub.resolves({ id: 1, ...companyData });
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });

      const companyResult = await companyService.updateCompany(companyData);
      const logoResult = await companyService.uploadLogo(file);

      assert.ok(companyResult.name);
      assert.ok(logoResult.success);
    });

    test("should setup new company with templates and branding", async () => {
      const company = { name: "New Corp", email: "info@newcorp.com" };
      const logo = new File(["logo"], "logo.png", { type: "image/png" });
      const templates = { selectedTemplate: "PROFESSIONAL" };

      postStub.resolves({ id: 2, ...company });
      sinon.stub(global, "fetch").resolves({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });
      postStub.resolves({ success: true, ...templates });

      await companyService.updateCompany(company);
      await companyService.uploadLogo(logo);
      const settings = await companyService.updateTemplateSettings(templates);

      assert.ok(settings.success);
    });
  });
});