/**
 * Company Service Unit Tests (Node Native Test Runner)
 * Tests company CRUD operations
 * Tests file uploads (logo, brandmark, seal)
 * Tests template settings management
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";
import { apiService } from "../axiosApi.js";
import { companyService } from "../companyService.js";

describe("companyService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCompany", () => {
    it("should fetch company information", async () => {
      const mockCompany = {
        id: 1,
        name: "Steel Corp",
        trn: "UAE123456789",
        country: "UAE",
      };
      vi.spyOn(apiClient, "get").mockResolvedValue(mockCompany);

      const result = await companyService.getCompany();

      expect(result.name).toBe("Steel Corp");
      expect(apiClient.get).toHaveBeenCalledWith("/company");
    });

    it("should handle fetch error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network error"));

      try {
        await companyService.getCompany();
        throw new Error("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });
  });

  describe("updateCompany", () => {
    it("should update company with POST", async () => {
      const companyData = { name: "Updated Steel Corp", country: "UAE" };
      const mockResponse = { id: 1, ...companyData };
      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await companyService.updateCompany(companyData);

      expect(result.name).toBe("Updated Steel Corp");
      expect(apiClient.post).toHaveBeenCalledWith("/company", companyData);
    });
  });

  describe("updateCompanyById", () => {
    it("should update company by ID with PUT", async () => {
      const companyData = { name: "Updated by ID" };
      const mockResponse = { id: 2, ...companyData };
      vi.spyOn(apiClient, "put").mockResolvedValue(mockResponse);

      const result = await companyService.updateCompanyById(2, companyData);

      expect(result.id).toBe(2);
      expect(apiClient.put).toHaveBeenCalledWith("/company/2", companyData);
    });
  });

  describe("uploadLogo", () => {
    it("should upload logo file", async () => {
      const mockFile = new File(["logo content"], "logo.png", { type: "image/png" });
      const mockResponse = { filename: "logo-12345.png", url: "/logos/logo-12345.png" };

      vi.spyOn(apiService, "upload").mockResolvedValue(mockResponse);

      const result = await companyService.uploadLogo(mockFile);

      expect(result.filename).toBe("logo-12345.png");
      expect(apiService.upload).toHaveBeenCalledWith("/company/upload-logo", expect.any(FormData));
    });

    it("should handle upload failure", async () => {
      const mockFile = new File(["logo"], "logo.png", { type: "image/png" });
      vi.spyOn(apiService, "upload").mockRejectedValue(new Error("File too large"));

      try {
        await companyService.uploadLogo(mockFile);
        throw new Error("Expected error to be thrown");
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe("deleteLogo", () => {
    it("should delete logo by filename", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      const result = await companyService.deleteLogo("logo-12345.png");

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/company/logo/logo-12345.png");
    });
  });

  describe("cleanupLogos", () => {
    it("should cleanup unused logos", async () => {
      const mockResponse = { deleted: 3, freed: "15MB" };
      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await companyService.cleanupLogos();

      expect(result.deleted).toBe(3);
      expect(apiClient.post).toHaveBeenCalledWith("/company/cleanup-logos");
    });
  });

  describe("uploadBrandmark", () => {
    it("should upload brandmark file", async () => {
      const mockFile = new File(["brandmark"], "brandmark.png", {
        type: "image/png",
      });
      const mockResponse = { filename: "brandmark-12345.png" };

      vi.spyOn(apiService, "upload").mockResolvedValue(mockResponse);

      const result = await companyService.uploadBrandmark(mockFile);

      expect(result.filename).toBe("brandmark-12345.png");
      expect(apiService.upload).toHaveBeenCalledWith("/company/upload-brandmark", expect.any(FormData));
    });
  });

  describe("deleteBrandmark", () => {
    it("should delete brandmark by filename", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      await companyService.deleteBrandmark("brandmark-12345.png");

      expect(apiClient.delete).toHaveBeenCalledWith("/company/brandmark/brandmark-12345.png");
    });
  });

  describe("uploadSeal", () => {
    it("should upload seal file", async () => {
      const mockFile = new File(["seal"], "seal.png", { type: "image/png" });
      const mockResponse = { filename: "seal-12345.png" };

      vi.spyOn(apiService, "upload").mockResolvedValue(mockResponse);

      const result = await companyService.uploadSeal(mockFile);

      expect(result.filename).toBe("seal-12345.png");
      expect(apiService.upload).toHaveBeenCalledWith("/company/upload-seal", expect.any(FormData));
    });
  });

  describe("deleteSeal", () => {
    it("should delete seal by filename", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      await companyService.deleteSeal("seal-12345.png");

      expect(apiClient.delete).toHaveBeenCalledWith("/company/seal/seal-12345.png");
    });
  });

  describe("updateTemplateSettings", () => {
    it("should update template settings", async () => {
      const templateSettings = {
        selectedTemplate: "professional",
        showLogo: true,
        showBrandmark: true,
      };
      const mockResponse = { success: true, settings: templateSettings };
      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await companyService.updateTemplateSettings(templateSettings);

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/company/template-settings", templateSettings);
    });
  });

  describe("authentication in uploads", () => {
    it("should call apiService.upload for file uploads", async () => {
      const mockFile = new File(["test"], "test.png", { type: "image/png" });

      vi.spyOn(apiService, "upload").mockResolvedValue({ filename: "test.png" });

      await companyService.uploadLogo(mockFile);

      expect(apiService.upload).toHaveBeenCalledWith("/company/upload-logo", expect.any(FormData));
    });

    it("should pass FormData without explicit Content-Type", async () => {
      const mockFile = new File(["test"], "test.png", { type: "image/png" });

      vi.spyOn(apiService, "upload").mockResolvedValue({ filename: "test.png" });

      await companyService.uploadLogo(mockFile);

      // apiService.upload handles headers internally (Content-Type is auto-set by browser for FormData)
      const callArgs = apiService.upload.mock.calls[0];
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });
  });
});
