import { beforeEach, describe, expect, it, vi } from "vitest";
import DemoDataService from "../demoDataService.js";

vi.mock("../productService.js", () => ({
  productService: {
    createProduct: vi.fn(),
    getProducts: vi.fn(),
  },
}));

vi.mock("../notificationService.js", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { productService } from "../productService.js";
import { notificationService } from "../notificationService.js";

describe("DemoDataService", () => {
  let demoService;

  beforeEach(() => {
    vi.clearAllMocks();
    demoService = new DemoDataService();
  });

  describe("initialization", () => {
    it("should create DemoDataService instance", () => {
      expect(demoService).toBeDefined();
      expect(typeof demoService).toBe("object");
    });
  });

  describe("initializeDemoProducts", () => {
    it("should initialize demo products with sheet category", async () => {
      productService.createProduct.mockResolvedValue({
        id: 1,
        name: "Stainless Steel Sheet",
        category: "sheet",
      });

      await demoService.initializeDemoProducts();

      expect(productService.createProduct).toHaveBeenCalled();
      const calls = productService.createProduct.mock.calls;
      const sheetCall = calls.find((call) =>
        call[0].name?.includes("Sheet")
      );
      expect(sheetCall).toBeDefined();
    });

    it("should initialize demo products with pipe category", async () => {
      productService.createProduct.mockResolvedValue({
        id: 2,
        name: "Stainless Steel Pipe",
        category: "pipe",
      });

      await demoService.initializeDemoProducts();

      expect(productService.createProduct).toHaveBeenCalled();
      const calls = productService.createProduct.mock.calls;
      const pipeCall = calls.find((call) => call[0].name?.includes("Pipe"));
      expect(pipeCall).toBeDefined();
    });

    it("should include specifications in demo products", async () => {
      productService.createProduct.mockResolvedValue({
        id: 1,
        name: "Stainless Steel Sheet",
        specifications: {
          length: "2440",
          width: "1220",
          thickness: "1.2",
        },
      });

      await demoService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      const firstCall = calls[0][0];
      expect(firstCall.specifications).toBeDefined();
      expect(firstCall.specifications.length).toBeDefined();
    });

    it("should handle product creation errors gracefully", async () => {
      productService.createProduct.mockRejectedValue(
        new Error("Failed to create product")
      );

      await expect(demoService.initializeDemoProducts()).rejects.toThrow();
    });
  });

  describe("Demo Data Integrity", () => {
    it("should initialize products with required fields", async () => {
      productService.createProduct.mockResolvedValue({ id: 1 });

      await demoService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      calls.forEach((call) => {
        const product = call[0];
        expect(product.name).toBeDefined();
        expect(product.category).toBeDefined();
        expect(product.specifications).toBeDefined();
      });
    });

    it("should include pricing information in demo products", async () => {
      productService.createProduct.mockResolvedValue({ id: 1 });

      await demoService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      calls.forEach((call) => {
        const product = call[0];
        expect(product.cost_price).toBeDefined();
        expect(product.selling_price).toBeDefined();
      });
    });

    it("should include inventory information in demo products", async () => {
      productService.createProduct.mockResolvedValue({ id: 1 });

      await demoService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      calls.forEach((call) => {
        const product = call[0];
        expect(product.current_stock).toBeDefined();
        expect(product.min_stock).toBeDefined();
        expect(product.max_stock).toBeDefined();
      });
    });
  });
});
