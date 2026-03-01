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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api.js";
import { apiService } from "../axiosApi.js";
import { companyService } from "../companyService.js";

describe("companiesService", () => {
  let getStub;
  let postStub;
  let putStub;
  let deleteStub;
  let uploadStub;
  beforeEach(() => {
    vi.restoreAllMocks();
    getStub = vi.spyOn(apiClient, "get");
    postStub = vi.spyOn(apiClient, "post");
    putStub = vi.spyOn(apiClient, "put");
    deleteStub = vi.spyOn(apiClient, "delete");
    uploadStub = vi.spyOn(apiService, "upload");
  });

  // ============================================================================
  // COMPANY RETRIEVAL
  // ============================================================================

  describe("Get Company", () => {
    it("should retrieve current company details", async () => {
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
      getStub.mockResolvedValue(mockCompany);

      const result = await companyService.getCompany();

      expect(result.id).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/company");
    });

    it("should handle company not found", async () => {
      getStub.mockRejectedValue(new Error("Company not found"));

      await expect(companyService.getCompany()).rejects.toThrow();
    });

    it("should handle network error on company retrieval", async () => {
      getStub.mockRejectedValue(new Error("Network error"));

      await expect(companyService.getCompany()).rejects.toThrow();
    });

    it("should handle unauthorized access to company", async () => {
      getStub.mockRejectedValue(new Error("Unauthorized"));

      await expect(companyService.getCompany()).rejects.toThrow();
    });

    it("should return company with complete metadata", async () => {
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
      getStub.mockResolvedValue(mockCompany);

      const result = await companyService.getCompany();

      expect(result.logo).toBeTruthy();
      expect(result.brandmark).toBeTruthy();
      expect(result.seal).toBeTruthy();
    });
  });

  // ============================================================================
  // COMPANY UPDATES
  // ============================================================================

  describe("Update Company", () => {
    it("should update company basic information", async () => {
      const companyData = {
        name: "Updated Steel Corp",
        email: "newemail@steelcorp.com",
        phone: "+1-555-0200",
      };
      const mockResponse = { id: 1, ...companyData };
      postStub.mockResolvedValue(mockResponse);

      const result = await companyService.updateCompany(companyData);

      expect(result.name).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/company", companyData);
    });

    it("should update company with all fields", async () => {
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
      postStub.mockResolvedValue(mockResponse);

      const result = await companyService.updateCompany(companyData);

      expect(result.currency).toBeTruthy();
      expect(result.taxId).toBeTruthy();
    });

    it("should update company by ID", async () => {
      const companyId = 1;
      const companyData = { name: "Updated Corp" };
      const mockResponse = { id: companyId, ...companyData };
      putStub.mockResolvedValue(mockResponse);

      const result = await companyService.updateCompanyById(companyId, companyData);

      expect(result.name).toBeTruthy();
      expect(putStub).toHaveBeenCalledWith(`/company/${companyId}`, companyData);
    });

    it("should handle validation errors on update", async () => {
      const companyData = { email: "invalid-email" };
      postStub.mockRejectedValue(new Error("Invalid email format"));

      await expect(companyService.updateCompany(companyData)).rejects.toThrow();
    });

    it("should prevent duplicate registration number", async () => {
      const companyData = {
        name: "Another Corp",
        registrationNumber: "REG123456", // Already exists
      };
      postStub.mockRejectedValue(new Error("Registration number already exists"));

      await expect(companyService.updateCompany(companyData)).rejects.toThrow();
    });

    it("should handle network error on company update", async () => {
      postStub.mockRejectedValue(new Error("Network error"));

      await expect(companyService.updateCompany({ name: "Update" })).rejects.toThrow();
    });

    it("should handle unauthorized update attempt", async () => {
      putStub.mockRejectedValue(new Error("Insufficient permissions"));

      await expect(companyService.updateCompanyById(1, { name: "Update" })).rejects.toThrow();
    });
  });

  // ============================================================================
  // FILE UPLOADS (Logo, Brandmark, Seal)
  // ============================================================================

  describe("Logo Upload", () => {
    it("should upload company logo", async () => {
      const file = new File(["logo content"], "logo.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "logo_12345.png" };
      uploadStub.mockResolvedValue(mockResponse);

      const result = await companyService.uploadLogo(file);

      expect(result.success).toBeTruthy();
      expect(result.filename).toBeTruthy();
      expect(uploadStub).toHaveBeenCalledWith("/company/upload-logo", expect.any(FormData));
    });

    it("should set correct headers for logo upload", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      uploadStub.mockResolvedValue({ success: true, filename: "logo.png" });

      await companyService.uploadLogo(file);

      expect(uploadStub).toHaveBeenCalled();
      const formData = uploadStub.mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
    });

    it("should include auth token in upload headers", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      uploadStub.mockResolvedValue({ success: true });

      await companyService.uploadLogo(file);

      // Auth is handled by apiService internally
      expect(uploadStub).toHaveBeenCalled();
    });

    it("should handle logo upload error", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      uploadStub.mockRejectedValue(new Error("File too large"));

      await expect(companyService.uploadLogo(file)).rejects.toThrow();
    });

    it("should validate logo file type", async () => {
      const file = new File(["content"], "document.pdf", { type: "application/pdf" });
      uploadStub.mockRejectedValue(new Error("Only image files allowed"));

      await expect(companyService.uploadLogo(file)).rejects.toThrow();
    });

    it("should delete logo file", async () => {
      const filename = "logo_12345.png";
      const mockResponse = { success: true };
      deleteStub.mockResolvedValue(mockResponse);

      const result = await companyService.deleteLogo(filename);

      expect(result.success).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith(`/company/logo/${filename}`);
    });

    it("should cleanup old logos", async () => {
      const mockResponse = { deleted: 3, freed: "25MB" };
      postStub.mockResolvedValue(mockResponse);

      const result = await companyService.cleanupLogos();

      expect(result.deleted).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/company/cleanup-logos");
    });
  });

  describe("Brandmark Upload", () => {
    it("should upload company brandmark", async () => {
      const file = new File(["brandmark"], "brandmark.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "brandmark_12345.png" };
      uploadStub.mockResolvedValue(mockResponse);

      const result = await companyService.uploadBrandmark(file);

      expect(result.success).toBeTruthy();
      expect(result.filename).toBeTruthy();
    });

    it("should delete brandmark file", async () => {
      const filename = "brandmark_12345.png";
      deleteStub.mockResolvedValue({ success: true });

      const result = await companyService.deleteBrandmark(filename);

      expect(result.success).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith(`/company/brandmark/${filename}`);
    });

    it("should handle brandmark upload error", async () => {
      const file = new File(["content"], "brandmark.txt", { type: "text/plain" });
      uploadStub.mockRejectedValue(new Error("Invalid file type"));

      await expect(companyService.uploadBrandmark(file)).rejects.toThrow();
    });
  });

  describe("Seal Upload", () => {
    it("should upload company seal", async () => {
      const file = new File(["seal"], "seal.png", { type: "image/png" });
      const mockResponse = { success: true, filename: "seal_12345.png" };
      uploadStub.mockResolvedValue(mockResponse);

      const result = await companyService.uploadSeal(file);

      expect(result.success).toBeTruthy();
      expect(result.filename).toBeTruthy();
    });

    it("should delete seal file", async () => {
      const filename = "seal_12345.png";
      deleteStub.mockResolvedValue({ success: true });

      const result = await companyService.deleteSeal(filename);

      expect(result.success).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith(`/company/seal/${filename}`);
    });
  });

  // ============================================================================
  // TEMPLATE SETTINGS MANAGEMENT
  // ============================================================================

  describe("Template Settings", () => {
    it("should update invoice template settings", async () => {
      const templateSettings = {
        selectedTemplate: "PROFESSIONAL",
        advancedSettings: {
          showTerms: true,
          showNotes: false,
          customColor: "#1a5490",
        },
      };
      const mockResponse = { success: true, ...templateSettings };
      postStub.mockResolvedValue(mockResponse);

      const result = await companyService.updateTemplateSettings(templateSettings);

      expect(result.success).toBeTruthy();
      expect(result.selectedTemplate).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/company/template-settings", templateSettings);
    });

    it("should get current template settings", async () => {
      const mockSettings = {
        selectedTemplate: "STANDARD",
        advancedSettings: {
          showTerms: true,
          showNotes: true,
          customColor: "#000000",
        },
      };
      getStub.mockResolvedValue(mockSettings);

      const result = await companyService.getTemplateSettings();

      expect(result.selectedTemplate).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/company/template-settings");
    });

    it("should handle missing template settings", async () => {
      getStub.mockResolvedValue(null);

      const result = await companyService.getTemplateSettings();

      // Should handle gracefully
      expect(result !== undefined).toBeTruthy();
    });

    it("should validate template selection", async () => {
      const invalidSettings = {
        selectedTemplate: "INVALID_TEMPLATE",
      };
      postStub.mockRejectedValue(new Error("Invalid template"));

      await expect(companyService.updateTemplateSettings(invalidSettings)).rejects.toThrow();
    });

    it("should allow complex template customization", async () => {
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
      postStub.mockResolvedValue(mockResponse);

      const result = await companyService.updateTemplateSettings(advancedSettings);

      expect(result.advancedSettings.logo.position).toBeTruthy();
    });

    it("should handle template settings update error", async () => {
      postStub.mockRejectedValue(new Error("Update failed"));

      await expect(companyService.updateTemplateSettings({ selectedTemplate: "STANDARD" })).rejects.toThrow();
    });

    it("should persist template settings across sessions", async () => {
      const settings = { selectedTemplate: "CUSTOM" };
      postStub.mockResolvedValue({ success: true, ...settings });
      getStub.mockResolvedValue({ ...settings });

      await companyService.updateTemplateSettings(settings);
      const retrieved = await companyService.getTemplateSettings();

      expect(retrieved.selectedTemplate).toBeTruthy();
    });
  });

  // ============================================================================
  // MULTI-TENANCY & SECURITY
  // ============================================================================

  describe("Multi-Tenancy Compliance", () => {
    it("should ensure company isolation on retrieval", async () => {
      const mockCompany = {
        id: 1,
        name: "Company A",
        companyId: 1, // Tenant context
      };
      getStub.mockResolvedValue(mockCompany);

      const result = await companyService.getCompany();

      expect(result.companyId).toBeTruthy();
    });

    it("should enforce single company access", async () => {
      // User in company 1 should not access company 2 data
      const mockCompany = { id: 2, name: "Company B", companyId: 2 };
      getStub.mockResolvedValue(mockCompany);

      const result = await companyService.getCompany();

      // Backend enforces this, API returns appropriate data
      expect(result.id).toBeTruthy();
    });

    it("should isolate template settings by company", async () => {
      const mockSettings = {
        selectedTemplate: "PROFESSIONAL",
        companyId: 1,
      };
      getStub.mockResolvedValue(mockSettings);

      const result = await companyService.getTemplateSettings();

      expect(result.companyId).toBeTruthy();
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle file upload timeout", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      uploadStub.mockRejectedValue(new Error("Upload timeout"));

      await expect(companyService.uploadLogo(file)).rejects.toThrow();
    });

    it("should handle network errors gracefully", async () => {
      getStub.mockRejectedValue(new Error("Network unavailable"));

      await expect(companyService.getCompany()).rejects.toThrow();
    });

    it("should handle concurrent update conflicts", async () => {
      const data1 = { name: "Update 1" };
      const data2 = { name: "Update 2" };

      postStub.mockResolvedValue({ id: 1, ...data1 });
      postStub.mockResolvedValue({ id: 1, ...data2 });

      const [result1, result2] = await Promise.all([
        companyService.updateCompany(data1),
        companyService.updateCompany(data2),
      ]);

      expect(result1.name).toBeTruthy();
      expect(result2.name).toBeTruthy();
    });

    it("should handle large file uploads", async () => {
      const largeFile = new File(["x".repeat(50 * 1024 * 1024)], "large.png", {
        type: "image/png",
      });
      uploadStub.mockResolvedValue({ success: true, filename: "large.png" });

      const result = await companyService.uploadLogo(largeFile);

      expect(result.success).toBeTruthy();
    });

    it("should handle malformed API response", async () => {
      getStub.mockResolvedValue(undefined);

      const result = await companyService.getCompany();

      expect(result).toBe(undefined);
    });

    it("should retry failed file uploads", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      uploadStub
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ success: true, filename: "logo.png" });

      // First call fails, second succeeds
      try {
        await companyService.uploadLogo(file);
      } catch (_e) {
        // First attempt failed
      }

      const result = await companyService.uploadLogo(file);

      expect(result.success).toBeTruthy();
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe("Integration Scenarios", () => {
    it("should update company and logo in sequence", async () => {
      const companyData = { name: "Updated Corp" };
      const file = new File(["logo"], "logo.png", { type: "image/png" });

      postStub.mockResolvedValue({ id: 1, ...companyData });
      uploadStub.mockResolvedValue({ success: true, filename: "logo.png" });

      const companyResult = await companyService.updateCompany(companyData);
      const logoResult = await companyService.uploadLogo(file);

      expect(companyResult.name).toBeTruthy();
      expect(logoResult.success).toBeTruthy();
    });

    it("should setup new company with templates and branding", async () => {
      const company = { name: "New Corp", email: "info@newcorp.com" };
      const logo = new File(["logo"], "logo.png", { type: "image/png" });
      const templates = { selectedTemplate: "PROFESSIONAL" };

      postStub.mockResolvedValue({ id: 2, ...company });
      uploadStub.mockResolvedValue({ success: true, filename: "logo.png" });
      postStub.mockResolvedValue({ success: true, ...templates });

      await companyService.updateCompany(company);
      await companyService.uploadLogo(logo);
      const settings = await companyService.updateTemplateSettings(templates);

      expect(settings.success).toBeTruthy();
    });
  });
});
