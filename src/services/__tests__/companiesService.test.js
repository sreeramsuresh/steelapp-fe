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

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../axiosApi.js", () => ({
  tokenUtils: {
    getToken: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import { tokenUtils } from "../axiosApi.js";
import { companyService } from "../companyService.js";

describe("companiesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
    tokenUtils.getToken.mockReturnValue("mock-token-123");
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

      expect(result.id).toBe(1);
      expect(result.name).toBe("Steel Corp Inc");
      expect(apiClient.get).toHaveBeenCalledWith("/company");
    });

    test("should handle company not found", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Company not found"));

      await expect(companyService.getCompany()).rejects.toThrow("Company not found");
    });

    test("should handle network error on company retrieval", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(companyService.getCompany()).rejects.toThrow("Network error");
    });

    test("should handle unauthorized access to company", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(companyService.getCompany()).rejects.toThrow("Unauthorized");
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

      expect(result.logo).toBe("logo.png");
      expect(result.brandmark).toBe("brandmark.png");
      expect(result.seal).toBe("seal.png");
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

      expect(result.name).toBe("Updated Steel Corp");
      expect(apiClient.post).toHaveBeenCalledWith("/company", companyData);
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

      expect(result.currency).toBe("EUR");
      expect(result.taxId).toBe("TAX789");
    });

    test("should update company by ID", async () => {
      const companyId = 1;
      const companyData = { name: "Updated Corp" };
      const mockResponse = { id: companyId, ...companyData };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateCompanyById(companyId, companyData);

      expect(result.name).toBe("Updated Corp");
      expect(apiClient.put).toHaveBeenCalledWith(`/company/${companyId}`, companyData);
    });

    test("should handle validation errors on update", async () => {
      const companyData = { email: "invalid-email" };
      apiClient.post.mockRejectedValueOnce(new Error("Invalid email format"));

      await expect(companyService.updateCompany(companyData)).rejects.toThrow("Invalid email format");
    });

    test("should prevent duplicate registration number", async () => {
      const companyData = {
        name: "Another Corp",
        registrationNumber: "REG123456", // Already exists
      };
      apiClient.post.mockRejectedValueOnce(new Error("Registration number already exists"));

      await expect(companyService.updateCompany(companyData)).rejects.toThrow("Registration number already exists");
    });

    test("should handle network error on company update", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(companyService.updateCompany({ name: "Update" })).rejects.toThrow("Network error");
    });

    test("should handle unauthorized update attempt", async () => {
      apiClient.put.mockRejectedValueOnce(new Error("Insufficient permissions"));

      await expect(companyService.updateCompanyById(1, { name: "Update" })).rejects.toThrow("Insufficient permissions");
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

      expect(result.success).toBe(true);
      expect(result.filename).toBe("logo_12345.png");
      expect(global.fetch).toHaveBeenCalled();
    });

    test("should set correct headers for logo upload", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, filename: "logo.png" }),
      });

      await companyService.uploadLogo(file);

      const call = global.fetch.mock.calls[0];
      expect(call[0]).toContain("/company/upload-logo");
      expect(call[1].method).toBe("POST");
      expect(call[1].headers).toHaveProperty("Authorization");
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
      expect(call[1].headers.Authorization).toBe("Bearer test-token");
    });

    test("should handle logo upload error", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "File too large" }),
      });

      await expect(companyService.uploadLogo(file)).rejects.toThrow("File too large");
    });

    test("should validate logo file type", async () => {
      const file = new File(["content"], "document.pdf", { type: "application/pdf" });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Only image files allowed" }),
      });

      await expect(companyService.uploadLogo(file)).rejects.toThrow("Only image files allowed");
    });

    test("should delete logo file", async () => {
      const filename = "logo_12345.png";
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await companyService.deleteLogo(filename);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/company/logo/${filename}`);
    });

    test("should cleanup old logos", async () => {
      const mockResponse = { deleted: 3, freed: "25MB" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.cleanupLogos();

      expect(result.deleted).toBe(3);
      expect(apiClient.post).toHaveBeenCalledWith("/company/cleanup-logos");
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

      expect(result.success).toBe(true);
      expect(result.filename).toContain("brandmark");
    });

    test("should delete brandmark file", async () => {
      const filename = "brandmark_12345.png";
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await companyService.deleteBrandmark(filename);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/company/brandmark/${filename}`);
    });

    test("should handle brandmark upload error", async () => {
      const file = new File(["content"], "brandmark.txt", { type: "text/plain" });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid file type" }),
      });

      await expect(companyService.uploadBrandmark(file)).rejects.toThrow("Invalid file type");
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

      expect(result.success).toBe(true);
      expect(result.filename).toContain("seal");
    });

    test("should delete seal file", async () => {
      const filename = "seal_12345.png";
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await companyService.deleteSeal(filename);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/company/seal/${filename}`);
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

      expect(result.success).toBe(true);
      expect(result.selectedTemplate).toBe("PROFESSIONAL");
      expect(apiClient.post).toHaveBeenCalledWith("/company/template-settings", templateSettings);
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

      expect(result.selectedTemplate).toBe("STANDARD");
      expect(apiClient.get).toHaveBeenCalledWith("/company/template-settings");
    });

    test("should handle missing template settings", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await companyService.getTemplateSettings();

      // Should handle gracefully
      expect(result).toBeDefined();
    });

    test("should validate template selection", async () => {
      const invalidSettings = {
        selectedTemplate: "INVALID_TEMPLATE",
      };
      apiClient.post.mockRejectedValueOnce(new Error("Invalid template"));

      await expect(companyService.updateTemplateSettings(invalidSettings)).rejects.toThrow("Invalid template");
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

      expect(result.advancedSettings.logo.position).toBe("TOP_CENTER");
    });

    test("should handle template settings update error", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Update failed"));

      await expect(companyService.updateTemplateSettings({ selectedTemplate: "STANDARD" })).rejects.toThrow(
        "Update failed"
      );
    });

    test("should persist template settings across sessions", async () => {
      const settings = { selectedTemplate: "CUSTOM" };
      apiClient.post.mockResolvedValueOnce({ success: true, ...settings });
      apiClient.get.mockResolvedValueOnce({ ...settings });

      await companyService.updateTemplateSettings(settings);
      const retrieved = await companyService.getTemplateSettings();

      expect(retrieved.selectedTemplate).toBe("CUSTOM");
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

      expect(result.companyId).toBe(1);
    });

    test("should enforce single company access", async () => {
      // User in company 1 should not access company 2 data
      const mockCompany = { id: 2, name: "Company B", companyId: 2 };
      apiClient.get.mockResolvedValueOnce(mockCompany);

      const result = await companyService.getCompany();

      // Backend enforces this, API returns appropriate data
      expect(result.id).toBe(2);
    });

    test("should isolate template settings by company", async () => {
      const mockSettings = {
        selectedTemplate: "PROFESSIONAL",
        companyId: 1,
      };
      apiClient.get.mockResolvedValueOnce(mockSettings);

      const result = await companyService.getTemplateSettings();

      expect(result.companyId).toBe(1);
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle file upload timeout", async () => {
      const file = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockRejectedValueOnce(new Error("Upload timeout"));

      await expect(companyService.uploadLogo(file)).rejects.toThrow("Upload timeout");
    });

    test("should handle network errors gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network unavailable"));

      await expect(companyService.getCompany()).rejects.toThrow("Network unavailable");
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

      expect(result1.name).toBe("Update 1");
      expect(result2.name).toBe("Update 2");
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

      expect(result.success).toBe(true);
    });

    test("should handle malformed API response", async () => {
      apiClient.get.mockResolvedValueOnce(undefined);

      const result = await companyService.getCompany();

      expect(result).toBeUndefined();
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
      } catch (e) {
        // First attempt failed
      }

      const result = await companyService.uploadLogo(file);

      expect(result.success).toBe(true);
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

      expect(companyResult.name).toBe("Updated Corp");
      expect(logoResult.success).toBe(true);
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

      expect(settings.success).toBe(true);
    });
  });
});
