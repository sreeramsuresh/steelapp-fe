/**
 * Company Service Unit Tests
 * ✅ Tests company CRUD operations
 * ✅ Tests file uploads (logo, brandmark, seal)
 * ✅ Tests template settings management
 * ✅ 100% coverage target for companyService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

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
    getToken: vi.fn(() => "mock-token-123"),
  },
}));

global.fetch = vi.fn();

import { apiClient } from "../api";
import { tokenUtils } from "../axiosApi";
import { companyService } from "../companyService";

describe("companyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
    import.meta.env.VITE_API_BASE_URL = "http://api.test";
  });

  describe("getCompany", () => {
    test("should fetch company information", async () => {
      const mockCompany = {
        id: 1,
        name: "Steel Corp",
        trn: "UAE123456789",
        country: "UAE",
      };
      apiClient.get.mockResolvedValueOnce(mockCompany);

      const result = await companyService.getCompany();

      expect(result.name).toBe("Steel Corp");
      expect(apiClient.get).toHaveBeenCalledWith("/company");
    });

    test("should handle fetch error", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(companyService.getCompany()).rejects.toThrow("Network error");
    });
  });

  describe("updateCompany", () => {
    test("should update company with POST", async () => {
      const companyData = { name: "Updated Steel Corp", country: "UAE" };
      const mockResponse = { id: 1, ...companyData };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateCompany(companyData);

      expect(result.name).toBe("Updated Steel Corp");
      expect(apiClient.post).toHaveBeenCalledWith("/company", companyData);
    });
  });

  describe("updateCompanyById", () => {
    test("should update company by ID with PUT", async () => {
      const companyData = { name: "Updated by ID" };
      const mockResponse = { id: 2, ...companyData };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateCompanyById(2, companyData);

      expect(result.id).toBe(2);
      expect(apiClient.put).toHaveBeenCalledWith("/company/2", companyData);
    });
  });

  describe("uploadLogo", () => {
    test("should upload logo file", async () => {
      const mockFile = new File(["logo content"], "logo.png", { type: "image/png" });
      const mockResponse = { filename: "logo-12345.png", url: "/logos/logo-12345.png" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadLogo(mockFile);

      expect(result.filename).toBe("logo-12345.png");
      expect(global.fetch).toHaveBeenCalled();
      const call = global.fetch.mock.calls[0];
      expect(call[0]).toBe("http://api.test/company/upload-logo");
      expect(call[1].method).toBe("POST");
    });

    test("should handle upload failure", async () => {
      const mockFile = new File(["logo"], "logo.png", { type: "image/png" });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "File too large" }),
      });

      await expect(companyService.uploadLogo(mockFile)).rejects.toThrow("File too large");
    });
  });

  describe("deleteLogo", () => {
    test("should delete logo by filename", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await companyService.deleteLogo("logo-12345.png");

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/company/logo/logo-12345.png");
    });
  });

  describe("cleanupLogos", () => {
    test("should cleanup unused logos", async () => {
      const mockResponse = { deleted: 3, freed: "15MB" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.cleanupLogos();

      expect(result.deleted).toBe(3);
      expect(apiClient.post).toHaveBeenCalledWith("/company/cleanup-logos");
    });
  });

  describe("uploadBrandmark", () => {
    test("should upload brandmark file", async () => {
      const mockFile = new File(["brandmark"], "brandmark.png", {
        type: "image/png",
      });
      const mockResponse = { filename: "brandmark-12345.png" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadBrandmark(mockFile);

      expect(result.filename).toBe("brandmark-12345.png");
      const call = global.fetch.mock.calls[0];
      expect(call[0]).toBe("http://api.test/company/upload-brandmark");
    });
  });

  describe("deleteBrandmark", () => {
    test("should delete brandmark by filename", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      await companyService.deleteBrandmark("brandmark-12345.png");

      expect(apiClient.delete).toHaveBeenCalledWith("/company/brandmark/brandmark-12345.png");
    });
  });

  describe("uploadSeal", () => {
    test("should upload seal file", async () => {
      const mockFile = new File(["seal"], "seal.png", { type: "image/png" });
      const mockResponse = { filename: "seal-12345.png" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadSeal(mockFile);

      expect(result.filename).toBe("seal-12345.png");
      const call = global.fetch.mock.calls[0];
      expect(call[0]).toBe("http://api.test/company/upload-seal");
    });
  });

  describe("deleteSeal", () => {
    test("should delete seal by filename", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      await companyService.deleteSeal("seal-12345.png");

      expect(apiClient.delete).toHaveBeenCalledWith("/company/seal/seal-12345.png");
    });
  });

  describe("updateTemplateSettings", () => {
    test("should update template settings", async () => {
      const templateSettings = {
        selectedTemplate: "professional",
        showLogo: true,
        showBrandmark: true,
      };
      const mockResponse = { success: true, settings: templateSettings };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await companyService.updateTemplateSettings(templateSettings);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/company/template-settings", templateSettings);
    });
  });

  describe("authentication in uploads", () => {
    test("should include authorization token in upload requests", async () => {
      tokenUtils.getToken.mockReturnValueOnce("test-token-xyz");
      const mockFile = new File(["test"], "test.png", { type: "image/png" });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: "test.png" }),
      });

      await companyService.uploadLogo(mockFile);

      const call = global.fetch.mock.calls[0];
      expect(call[1].headers.Authorization).toBe("Bearer test-token-xyz");
    });

    test("should set correct content headers for uploads", async () => {
      const mockFile = new File(["test"], "test.png", { type: "image/png" });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: "test.png" }),
      });

      await companyService.uploadLogo(mockFile);

      const call = global.fetch.mock.calls[0];
      // Content-Type should NOT be set (let browser set it with boundary)
      expect(call[1].headers["Content-Type"]).toBeUndefined();
    });
  });
});
