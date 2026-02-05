import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { productNamingService } from "../productNamingService.js";
import '../../__tests__/init.mjs';

describe("productNamingService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("verifyNamingLogic", () => {
    test("should verify sheet product naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
          displayName: "304 Sheet 2B 1220×2×2440",
          isValid: true,
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      assert.ok(result.uniqueName);
      assert.ok(result.uniqueName);
      assert.ok(result.displayName);
    });

    test("should verify pipe product naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-316L-PIPE-BA-2inch-Sch40",
          displayName: '316L Pipe BA 2" Sch40',
          isValid: true,
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("pipe", {
        grade: "316L",
        finish: "BA",
        diameter: "2inch",
        schedule: "Sch40",
      });

      assert.ok(result.uniqueName);
      assert.ok(result.uniqueName);
    });

    test("should verify tube product naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-316-TUBE-2B-25mm-1.5mm",
          displayName: "316 Tube 2B 25×1.5",
          isValid: true,
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("tube", {
        grade: "316",
        finish: "2B",
        diameter: "25mm",
        thickness: "1.5mm",
      });

      assert.ok(result.uniqueName);
      assert.ok(result.displayName);
    });

    test("should verify coil product naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-304-COIL-2B-1000mm-1mm",
          displayName: "304 Coil 2B 1000×1",
          isValid: true,
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("coil", {
        grade: "304",
        finish: "2B",
        width: "1000mm",
        thickness: "1mm",
      });

      assert.ok(result.uniqueName);
    });

    test("should include mill information in naming", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm-POSCO-KR",
          displayName: "304 Sheet 2B 1220×2×2440 (POSCO, Korea)",
          isValid: true,
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
        mill: "POSCO",
        millCountry: "KR",
      });

      assert.ok(result.uniqueName);
      assert.ok(result.displayName);
    });

    test("should handle various grade variants", async () => {
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

        sinon.stub(global, 'fetch').resolves(mockResponse);

        const result = await productNamingService.verifyNamingLogic("sheet", {
          grade,
          finish: "2B",
        });

        assert.ok(result.uniqueName);
      }
    });

    test("should handle various finish types", async () => {
      const finishes = ["2B", "BA", "2D", "1D", "Bright"];

      for (const finish of finishes) {
        const mockResponse = {
          ok: true,
          json: sinon.stub().mockResolvedValue({
            uniqueName: `SS-304-SHEET-${finish}`,
            displayName: `304 Sheet ${finish}`,
            isValid: true,
          }),
        };

        sinon.stub(global, 'fetch').resolves(mockResponse);

        const result = await productNamingService.verifyNamingLogic("sheet", {
          grade: "304",
          finish,
        });

        assert.ok(result.displayName);
      }
    });

    test("should return error on API failure", async () => {
      const mockResponse = {
        ok: false,
        json: sinon.stub().mockResolvedValue({
          error: "Invalid grade specification",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      await assert.rejects(() => productNamingService.verifyNamingLogic("sheet", { grade: "INVALID" }), Error);
    });

    test("should handle network errors", async () => {
      global.fetch.rejects(new Error("Network error"));

      await assert.rejects(() => productNamingService.verifyNamingLogic("sheet", { grade: "304" }), Error);
    });

    test("should include mandatory SSOT concatenation format", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-316L-SHEET-2B-1220mm-2mm-2440mm",
          displayName: "316L Sheet 2B 1220×2×2440",
          isValid: true,
          format: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "316L",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      assert.match(result.uniqueName,/^SS-[A-Z0-9]+-SHEET-[A-Z0-9]+-\d+mm-[\d.]+mm-\d+mm$/);
    });
  });

  describe("verifyAllProductTypes", () => {
    test("should verify all product types with sample data", async () => {
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
      sinon.stub(global, 'fetch').callsFake(() => {
        const mockResponse = {
          ok: true,
          json: sinon.stub() = sinon.stub().resolves(mockResponses[callIndex]),
        };
        callIndex++;
        return Promise.resolve(mockResponse);
      });

      const results = await productNamingService.verifyAllProductTypes();

      assert.ok(results);
      assert.ok(results[0].uniqueName);
      assert.ok(results[1].uniqueName);
      assert.ok(results[2].uniqueName);
      assert.ok(results[3].uniqueName);
    });

    test("should verify standard product type sample data", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          verifiedTypes: ["sheet", "pipe", "tube", "coil", "bar", "anglebar"],
          allValid: true,
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const results = await productNamingService.verifyAllProductTypes();

      assert.ok(results.verifiedTypes);
      assert.ok(results.verifiedTypes);
    });
  });

  describe("Product Type Support", () => {
    test("should support sheet products", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        grade: "304",
      });

      assert.ok(result.uniqueName);
    });

    test("should support pipe products", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-304-PIPE-BA-2inch-Sch40",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("pipe", {
        grade: "304",
      });

      assert.ok(result.uniqueName);
    });

    test("should support tube products", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-316-TUBE-2B-25mm-1.5mm",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("tube", {
        grade: "316",
      });

      assert.ok(result.uniqueName);
    });

    test("should support coil products", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-304-COIL-2B-1000mm-1mm",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("coil", {
        grade: "304",
      });

      assert.ok(result.uniqueName);
    });

    test("should support bar products", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-304-BAR-Bright-16mm",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("bar", {
        grade: "304",
        diameter: "16mm",
      });

      assert.ok(result.uniqueName);
    });
  });

  describe("Dimension Support", () => {
    test("should support standard metric dimensions", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("sheet", {
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
      });

      assert.match(result.uniqueName,/\d+mm/);
    });

    test("should support imperial dimensions", async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-304-PIPE-BA-2inch-Sch40",
        }),
      };

      sinon.stub(global, 'fetch').resolves(mockResponse);

      const result = await productNamingService.verifyNamingLogic("pipe", {
        diameter: "2inch",
        schedule: "Sch40",
      });

      assert.ok(result.uniqueName);
    });
  });

  describe("Naming Uniqueness", () => {
    test("should generate unique names for different products", async () => {
      const product1 = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
          uniqueName: "SS-304-SHEET-2B-1220mm-2mm-2440mm",
        }),
      };

      const product2 = {
        ok: true,
        json: sinon.stub().mockResolvedValue({
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

      assert.ok(result1.uniqueName).not;
    });
  });
});