import { afterEach, describe, expect, it, vi } from "vitest";
import { apiService } from "../axiosApi.js";
import { productNamingService } from "../productNamingService.js";

describe("productNamingService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("verifyNamingLogic", () => {
    it("should verify sheet product naming", async () => {
      const mockResult = {
        uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        displayName: "304 Sheet 2B 1220x2x2440",
        isValid: true,
      };
      vi.spyOn(apiService, "post").mockResolvedValue(mockResult);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      expect(result.uniqueName).toBeTruthy();
      expect(result.displayName).toBeTruthy();
      expect(apiService.post).toHaveBeenCalledWith("/product-naming/verify", {
        productType: "sheet",
        grade: "304",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });
    });

    it("should verify pipe product naming", async () => {
      const mockResult = {
        uniqueName: "SS-316L-PIPE-BA-2inch-Sch40",
        displayName: '316L Pipe BA 2" Sch40',
        isValid: true,
      };
      vi.spyOn(apiService, "post").mockResolvedValue(mockResult);

      const result = await productNamingService.verifyNamingLogic("pipe", {
        grade: "316L",
        finish: "BA",
        diameter: "2inch",
        schedule: "Sch40",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should verify tube product naming", async () => {
      const mockResult = {
        uniqueName: "SS-316-TUBE-2B-25mm-1.5mm",
        displayName: "316 Tube 2B 25x1.5",
        isValid: true,
      };
      vi.spyOn(apiService, "post").mockResolvedValue(mockResult);

      const result = await productNamingService.verifyNamingLogic("tube", {
        grade: "316",
        finish: "2B",
        diameter: "25mm",
        thickness: "1.5mm",
      });

      expect(result.uniqueName).toBeTruthy();
      expect(result.displayName).toBeTruthy();
    });

    it("should verify coil product naming", async () => {
      const mockResult = {
        uniqueName: "SS-304-COIL-2B-1000mm-1mm",
        displayName: "304 Coil 2B 1000x1",
        isValid: true,
      };
      vi.spyOn(apiService, "post").mockResolvedValue(mockResult);

      const result = await productNamingService.verifyNamingLogic("coil", {
        grade: "304",
        finish: "2B",
        width: "1000mm",
        thickness: "1mm",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should include mill information in naming", async () => {
      const mockResult = {
        uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm-POSCO-KR",
        displayName: "304 Sheet 2B 1220x2x2440 (POSCO, Korea)",
        isValid: true,
      };
      vi.spyOn(apiService, "post").mockResolvedValue(mockResult);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
        mill: "POSCO",
        millCountry: "KR",
      });

      expect(result.uniqueName).toBeTruthy();
      expect(result.displayName).toBeTruthy();
    });

    it("should handle various grade variants", async () => {
      const grades = ["201", "304", "304L", "316", "316L", "430"];

      for (const grade of grades) {
        vi.spyOn(apiService, "post").mockResolvedValue({
          uniqueName: `SS-${grade}-SHEET-2B`,
          displayName: `${grade} Sheet 2B`,
          isValid: true,
        });

        const result = await productNamingService.verifyNamingLogic("sheet", {
          grade,
          finish: "2B",
        });

        expect(result.uniqueName).toBeTruthy();
      }
    });

    it("should handle various finish types", async () => {
      const finishes = ["2B", "BA", "2D", "1D", "Bright"];

      for (const finish of finishes) {
        vi.spyOn(apiService, "post").mockResolvedValue({
          uniqueName: `SS-304-SHEET-${finish}`,
          displayName: `304 Sheet ${finish}`,
          isValid: true,
        });

        const result = await productNamingService.verifyNamingLogic("sheet", {
          grade: "304",
          finish,
        });

        expect(result.displayName).toBeTruthy();
      }
    });

    it("should return error on API failure", async () => {
      vi.spyOn(apiService, "post").mockRejectedValue(new Error("Invalid grade specification"));

      await expect(productNamingService.verifyNamingLogic("sheet", { grade: "INVALID" })).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      vi.spyOn(apiService, "post").mockRejectedValue(new Error("Network error"));

      await expect(productNamingService.verifyNamingLogic("sheet", { grade: "304" })).rejects.toThrow();
    });

    it("should include mandatory SSOT concatenation format", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-316L-SHEET-2B-1220mm-2mm-2440mm",
        displayName: "316L Sheet 2B 1220x2x2440",
        isValid: true,
        format: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
      });

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "316L",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      expect(result.uniqueName).toMatch(/^SS-[A-Z0-9]+-SHEET-[A-Z0-9]+-\d+mm-[\d.]+mm-\d+mm$/);
    });
  });

  describe("verifyAllProductTypes", () => {
    it("should verify all product types with sample data", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-TEST-PRODUCT",
        displayName: "Test Product",
        isValid: true,
      });

      const results = await productNamingService.verifyAllProductTypes();

      expect(results).toBeTruthy();
      expect(Array.isArray(results)).toBeTruthy();
      expect(results.length).toBe(6); // sheet, pipe, tube, coil, bar, anglebar
      expect(results[0].uniqueName).toBeTruthy();
    });

    it("should verify standard product type sample data", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-TEST",
        displayName: "Test",
        isValid: true,
      });

      const results = await productNamingService.verifyAllProductTypes();

      expect(results).toBeTruthy();
      expect(results.length).toBe(6);
    });
  });

  describe("Product Type Support", () => {
    it("should support sheet products", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
      });

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support pipe products", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-304-PIPE-BA-2inch-Sch40",
      });

      const result = await productNamingService.verifyNamingLogic("pipe", {
        grade: "304",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support tube products", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-316-TUBE-2B-25mm-1.5mm",
      });

      const result = await productNamingService.verifyNamingLogic("tube", {
        grade: "316",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support coil products", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-304-COIL-2B-1000mm-1mm",
      });

      const result = await productNamingService.verifyNamingLogic("coil", {
        grade: "304",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support bar products", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-304-BAR-Bright-16mm",
      });

      const result = await productNamingService.verifyNamingLogic("bar", {
        grade: "304",
        diameter: "16mm",
      });

      expect(result.uniqueName).toBeTruthy();
    });
  });

  describe("Dimension Support", () => {
    it("should support standard metric dimensions", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
      });

      const result = await productNamingService.verifyNamingLogic("sheet", {
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      expect(result.uniqueName).toMatch(/\d+mm/);
    });

    it("should support imperial dimensions", async () => {
      vi.spyOn(apiService, "post").mockResolvedValue({
        uniqueName: "SS-304-PIPE-BA-2inch-Sch40",
      });

      const result = await productNamingService.verifyNamingLogic("pipe", {
        diameter: "2inch",
        schedule: "Sch40",
      });

      expect(result.uniqueName).toBeTruthy();
    });
  });

  describe("Naming Uniqueness", () => {
    it("should generate unique names for different products", async () => {
      vi.spyOn(apiService, "post")
        .mockResolvedValueOnce({ uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm" })
        .mockResolvedValueOnce({ uniqueName: "SS-316L-SHEET-2B-1220mm-3mm-2440mm" });

      const result1 = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
        thickness: "2mm",
      });

      const result2 = await productNamingService.verifyNamingLogic("sheet", {
        grade: "316L",
        thickness: "3mm",
      });

      expect(result1.uniqueName).not.toBe(result2.uniqueName);
    });
  });
});
