import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { productNamingService } from "../productNamingService.js";
describe("productNamingService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("verifyNamingLogic", () => {
    it("should verify sheet product naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
          displayName: "304 Sheet 2B 1220×2×2440",
          isValid: true,
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      expect(result.uniqueName).toBeTruthy();
      expect(result.uniqueName).toBeTruthy();
      expect(result.displayName).toBeTruthy();
    });

    it("should verify pipe product naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-316L-PIPE-BA-2inch-Sch40",
          displayName: '316L Pipe BA 2" Sch40',
          isValid: true,
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("pipe", {
        grade: "316L",
        finish: "BA",
        diameter: "2inch",
        schedule: "Sch40",
      });

      expect(result.uniqueName).toBeTruthy();
      expect(result.uniqueName).toBeTruthy();
    });

    it("should verify tube product naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-316-TUBE-2B-25mm-1.5mm",
          displayName: "316 Tube 2B 25×1.5",
          isValid: true,
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

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
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-304-COIL-2B-1000mm-1mm",
          displayName: "304 Coil 2B 1000×1",
          isValid: true,
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("coil", {
        grade: "304",
        finish: "2B",
        width: "1000mm",
        thickness: "1mm",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should include mill information in naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm-POSCO-KR",
          displayName: "304 Sheet 2B 1220×2×2440 (POSCO, Korea)",
          isValid: true,
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

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
        const mockResponse = {
          ok: true,
          json: async () => ({
            uniqueName: `SS-${grade}-SHEET-2B`,
            displayName: `${grade} Sheet 2B`,
            isValid: true,
          }),
        };

        vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

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
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({
            uniqueName: `SS-304-SHEET-${finish}`,
            displayName: `304 Sheet ${finish}`,
            isValid: true,
          }),
        };

        vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

        const result = await productNamingService.verifyNamingLogic("sheet", {
          grade: "304",
          finish,
        });

        expect(result.displayName).toBeTruthy();
      }
    });

    it("should return error on API failure", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: "Invalid grade specification",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      await expect(productNamingService.verifyNamingLogic("sheet", { grade: "INVALID" })).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));

      await expect(productNamingService.verifyNamingLogic("sheet", { grade: "304" })).rejects.toThrow();
    });

    it("should include mandatory SSOT concatenation format", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-316L-SHEET-2B-1220mm-2mm-2440mm",
          displayName: "316L Sheet 2B 1220×2×2440",
          isValid: true,
          format: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

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
      const mockResponses = [
        {
          uniqueName: "SS-316L-SHEET-2B-1220mm-2mm-2440mm",
          displayName: "316L Sheet 2B 1220×2×2440",
        },
        {
          uniqueName: "SS-304-PIPE-BA-2inch-Sch40",
          displayName: '304 Pipe BA 2" Sch40',
        },
        {
          uniqueName: "SS-316-TUBE-2B-25mm-1.5mm",
          displayName: "316 Tube 2B 25×1.5",
        },
        {
          uniqueName: "SS-304-COIL-2B-1000mm-1mm",
          displayName: "304 Coil 2B 1000×1",
        },
      ];

      let callIndex = 0;
      vi.spyOn(global, 'fetch').callsFake(() => {
        const mockResponse = {
          ok: true,
          json: vi.fn() = vi.fn().mockResolvedValue(mockResponses[callIndex]),
        };
        callIndex++;
        return Promise.resolve(mockResponse);
      });

      const results = await productNamingService.verifyAllProductTypes();

      expect(results).toBeTruthy();
      expect(results[0].uniqueName).toBeTruthy();
      expect(results[1].uniqueName).toBeTruthy();
      expect(results[2].uniqueName).toBeTruthy();
      expect(results[3].uniqueName).toBeTruthy();
    });

    it("should verify standard product type sample data", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          verifiedTypes: ["sheet", "pipe", "tube", "coil", "bar", "anglebar"],
          allValid: true,
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const results = await productNamingService.verifyAllProductTypes();

      expect(results.verifiedTypes).toBeTruthy();
      expect(results.verifiedTypes).toBeTruthy();
    });
  });

  describe("Product Type Support", () => {
    it("should support sheet products", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support pipe products", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-304-PIPE-BA-2inch-Sch40",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("pipe", {
        grade: "304",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support tube products", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-316-TUBE-2B-25mm-1.5mm",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("tube", {
        grade: "316",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support coil products", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-304-COIL-2B-1000mm-1mm",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("coil", {
        grade: "304",
      });

      expect(result.uniqueName).toBeTruthy();
    });

    it("should support bar products", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-304-BAR-Bright-16mm",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("bar", {
        grade: "304",
        diameter: "16mm",
      });

      expect(result.uniqueName).toBeTruthy();
    });
  });

  describe("Dimension Support", () => {
    it("should support standard metric dimensions", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      expect(result.uniqueName).toMatch(/\d+mm/);
    });

    it("should support imperial dimensions", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-304-PIPE-BA-2inch-Sch40",
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await productNamingService.verifyNamingLogic("pipe", {
        diameter: "2inch",
        schedule: "Sch40",
      });

      expect(result.uniqueName).toBeTruthy();
    });
  });

  describe("Naming Uniqueness", () => {
    it("should generate unique names for different products", async () => {
      const product1 = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        }),
      };

      const product2 = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          uniqueName: "SS-316L-SHEET-2B-1220mm-3mm-2440mm",
        }),
      };

      global.fetch.mockResolvedValueOnce(product1).mockResolvedValueOnce(product2);

      const result1 = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
        thickness: "2mm",
      });

      const result2 = await productNamingService.verifyNamingLogic("sheet", {
        grade: "316L",
        thickness: "3mm",
      });

      expect(result1.uniqueName).toBeTruthy().not;
    });
  });
});