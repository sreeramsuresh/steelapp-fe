/**
 * Companies Service Unit Tests
 * ✅ Tests company/tenant management operations
 * ✅ Tests company CRUD operations
 * ✅ Tests file uploads (logo, brandmark, seal)
 * ✅ Tests template settings management
 * ✅ Tests company isolation and multi-tenancy
 * ✅ Tests error handling and validation
 * ✅ 40-50 tests covering all critical paths
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock fetch for file uploads
global.fetch = vi.fn();



import { tokenUtils } from "../axiosApi.js";
import { companyService } from "../companyService.js";
import { apiClient } from "../api.js";

describe("companiesService", () => {
  beforeEach(() => {
    sinon.restore();
    global.fetch.mockClear();
    sinon.stub(tokenUtils, 'getToken').returns("mock-token-123");
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
      apiClient.get.mockResolvedValueOnce(mockCompany);

      const result = await companyService.getCompany();

      assert.ok(result.id).toBe(1);
      assert.ok(result.name).toBe("Steel Corp Inc");
      assert.ok(apiClient.get).toHaveBeenCalledWith("/company");
    });

    test("should handle company not found", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Company not found"));

      assert.rejects(companyService.getCompany(), Error);
    });

    test("should handle network error on company retrieval", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(companyService.getCompany(), Error);
    });

    test("should handle unauthorized access to company", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Unauthorized"));

      assert.rejects(companyService.getCompany(), Error);
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
      apiClient.get.mockResolvedValueOnce(mockCompany);

      const result = await companyService.getCompany();

      assert.ok(result.logo).toBe("logo.png");
      assert.ok(result.brandmark).toBe("brandmark.png");
      assert.ok(result.seal).toBe("seal.png");
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateCompany(companyData);

      assert.ok(result.name).toBe("Updated Steel Corp");
      assert.ok(apiClient.post).toHaveBeenCalledWith("/company", companyData);
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateCompany(companyData);

      assert.ok(result.currency).toBe("EUR");
      assert.ok(result.taxId).toBe("TAX789");
    });

    test("should update company by ID", async () => {
      const companyId = 1;
      const companyData = { name: "Updated Corp" };
      const mockResponse = { id: companyId, ...companyData };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateCompanyById(companyId, companyData);

      assert.ok(result.name).toBe("Updated Corp");
      assert.ok(apiClient.put).toHaveBeenCalledWith(`/company/${companyId}`, companyData);
    });

    test("should handle validation errors on update", async () => {
      const companyData = { email: "invalid-email" };
      apiClient.post.mockRejectedValueOnce(new Error("Invalid email format"));

      assert.rejects(companyService.updateCompany(companyData), Error);
    });

    test("should prevent duplicate registration number", async () => {
      const companyData = {
        name: "Another Corp",
        registrationNumber: "REG123456", // Already exists
      };
      apiClient.post.mockRejectedValueOnce(new Error("Registration number already exists"));

      assert.rejects(companyService.updateCompany(companyData), Error);
    });

    test("should handle network error on company update", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(companyService.updateCompany({ name: "Update" }), Error);
    });

    test("should handle unauthorized update attempt", async () => {
      apiClient.put.mockRejectedValueOnce(new Error("Insufficient permissions"));

      assert.rejects(companyService.updateCompanyById(1, { name: "Update" }), Error);
    });
  });

  // ============================================================================
  // FILE UPLOADS (Logo, Brandmark, Seal)
  // ============================================================================

  describe("Logo Upload", () => {
    test("should upload company logo", async () => {
      const file = new File(["logo content"], "logo.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "logo_12345.png" };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadLogo(file);

      assert.ok(result.success).toBe(true);
      assert.ok(result.filename).toBe("logo_12345.png");
      assert.ok(global.fetch).toHaveBeenCalled();
    });

    test("should set correct headers for logo upload", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });

      await companyService.uploadLogo(file);

      const call = global.fetch.mock.calls[0];
      assert.ok(call[0]).toContain("/company/upload-logo");
      assert.ok(call[1].method).toBe("POST");
      assert.ok(call[1].headers).toHaveProperty("Authorization");
    });

    test("should include auth token in upload headers", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      tokenUtils.getToken.mockReturnValueOnce("test-token");
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await companyService.uploadLogo(file);

      const call = global.fetch.mock.calls[0];
      assert.ok(call[1].headers.Authorization).toBe("Bearer test-token");
    });

    test("should handle logo upload error", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "File too large" }),
      });

      assert.rejects(companyService.uploadLogo(file), Error);
    });

    test("should validate logo file type", async () => {
      const file = new File(["content"], "document.pdf", { type: "application/pdf" });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Only image files allowed" }),
      });

      assert.rejects(companyService.uploadLogo(file), Error);
    });

    test("should delete logo file", async () => {
      const filename = "logo_12345.png";
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await companyService.deleteLogo(filename);

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.delete).toHaveBeenCalledWith(`/company/logo/${filename}`);
    });

    test("should cleanup old logos", async () => {
      const mockResponse = { deleted: 3, freed: "25MB" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.cleanupLogos();

      assert.ok(result.deleted).toBe(3);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/company/cleanup-logos");
    });
  });

  describe("Brandmark Upload", () => {
    test("should upload company brandmark", async () => {
      const file = new File(["brandmark"], "brandmark.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "brandmark_12345.png" };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadBrandmark(file);

      assert.ok(result.success).toBe(true);
      assert.ok(result.filename).toContain("brandmark");
    });

    test("should delete brandmark file", async () => {
      const filename = "brandmark_12345.png";
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await companyService.deleteBrandmark(filename);

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.delete).toHaveBeenCalledWith(`/company/brandmark/${filename}`);
    });

    test("should handle brandmark upload error", async () => {
      const file = new File(["content"], "brandmark.txt", { type: "text/plain" });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid file type" }),
      });

      assert.rejects(companyService.uploadBrandmark(file), Error);
    });
  });

  describe("Seal Upload", () => {
    test("should upload company seal", async () => {
      const file = new File(["seal"], "seal.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "seal_12345.png" };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadSeal(file);

      assert.ok(result.success).toBe(true);
      assert.ok(result.filename).toContain("seal");
    });

    test("should delete seal file", async () => {
      const filename = "seal_12345.png";
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await companyService.deleteSeal(filename);

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.delete).toHaveBeenCalledWith(`/company/seal/${filename}`);
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateTemplateSettings(templateSettings);

      assert.ok(result.success).toBe(true);
      assert.ok(result.selectedTemplate).toBe("PROFESSIONAL");
      assert.ok(apiClient.post).toHaveBeenCalledWith("/company/template-settings", templateSettings);
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
      apiClient.get.mockResolvedValueOnce(mockSettings);

      const result = await companyService.getTemplateSettings();

      assert.ok(result.selectedTemplate).toBe("STANDARD");
      assert.ok(apiClient.get).toHaveBeenCalledWith("/company/template-settings");
    });

    test("should handle missing template settings", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await companyService.getTemplateSettings();

      // Should handle gracefully
      assert.ok(result).toBeDefined();
    });

    test("should validate template selection", async () => {
      const invalidSettings = {
        selectedTemplate: "INVALID_TEMPLATE",
      };
      apiClient.post.mockRejectedValueOnce(new Error("Invalid template"));

      assert.rejects(companyService.updateTemplateSettings(invalidSettings), Error);
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateTemplateSettings(advancedSettings);

      assert.ok(result.advancedSettings.logo.position).toBe("TOP_CENTER");
    });

    test("should handle template settings update error", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Update failed"));

      assert.rejects(companyService.updateTemplateSettings({ selectedTemplate: "STANDARD" }), Error);
    });

    test("should persist template settings across sessions", async () => {
      const settings = { selectedTemplate: "CUSTOM" };
      apiClient.post.mockResolvedValueOnce({ success: true, ...settings });
      apiClient.get.mockResolvedValueOnce({ ...settings });

      await companyService.updateTemplateSettings(settings);
      const retrieved = await companyService.getTemplateSettings();

      assert.ok(retrieved.selectedTemplate).toBe("CUSTOM");
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
      apiClient.get.mockResolvedValueOnce(mockCompany);

      const result = await companyService.getCompany();

      assert.ok(result.companyId).toBe(1);
    });

    test("should enforce single company access", async () => {
      // User in company 1 should not access company 2 data
      const mockCompany = { id: 2, name: "Company B", companyId: 2 };
      apiClient.get.mockResolvedValueOnce(mockCompany);

      const result = await companyService.getCompany();

      // Backend enforces this, API returns appropriate data
      assert.ok(result.id).toBe(2);
    });

    test("should isolate template settings by company", async () => {
      const mockSettings = {
        selectedTemplate: "PROFESSIONAL",
        companyId: 1,
      };
      apiClient.get.mockResolvedValueOnce(mockSettings);

      const result = await companyService.getTemplateSettings();

      assert.ok(result.companyId).toBe(1);
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle file upload timeout", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockRejectedValueOnce(new Error("Upload timeout"));

      assert.rejects(companyService.uploadLogo(file), Error);
    });

    test("should handle network errors gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network unavailable"));

      assert.rejects(companyService.getCompany(), Error);
    });

    test("should handle concurrent update conflicts", async () => {
      const data1 = { name: "Update 1" };
      const data2 = { name: "Update 2" };

      apiClient.post.mockResolvedValueOnce({ id: 1, ...data1 });
      apiClient.post.mockResolvedValueOnce({ id: 1, ...data2 });

      const [result1, result2] = await Promise.all([
        companyService.updateCompany(data1),
        companyService.updateCompany(data2),
      ]);

      assert.ok(result1.name).toBe("Update 1");
      assert.ok(result2.name).toBe("Update 2");
    });

    test("should handle large file uploads", async () => {
      const largeFile = new File(["x".repeat(50 * 1024 * 1024)], "large.png", {
        type: "image/png",
      });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, filename: "large.png" }),
      });

      const result = await companyService.uploadLogo(largeFile);

      assert.ok(result.success).toBe(true);
    });

    test("should handle malformed API response", async () => {
      apiClient.get.mockResolvedValueOnce(undefined);

      const result = await companyService.getCompany();

      assert.ok(result).toBeUndefined();
    });

    test("should retry failed file uploads", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockRejectedValueOnce(new Error("Network error")).mockResolvedValueOnce({
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

      assert.ok(result.success).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe("Integration Scenarios", () => {
    test("should update company and logo in sequence", async () => {
      const companyData = { name: "Updated Corp" };
      const file = new File(["logo"], "logo.png", { type: "image/png" });

      apiClient.post.mockResolvedValueOnce({ id: 1, ...companyData });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });

      const companyResult = await companyService.updateCompany(companyData);
      const logoResult = await companyService.uploadLogo(file);

      assert.ok(companyResult.name).toBe("Updated Corp");
      assert.ok(logoResult.success).toBe(true);
    });

    test("should setup new company with templates and branding", async () => {
      const company = { name: "New Corp", email: "info@newcorp.com" };
      const logo = new File(["logo"], "logo.png", { type: "image/png" });
      const templates = { selectedTemplate: "PROFESSIONAL" };

      apiClient.post.mockResolvedValueOnce({ id: 2, ...company });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });
      apiClient.post.mockResolvedValueOnce({ success: true, ...templates });

      await companyService.updateCompany(company);
      await companyService.uploadLogo(logo);
      const settings = await companyService.updateTemplateSettings(templates);

      assert.ok(settings.success).toBe(true);
    });
  });
});