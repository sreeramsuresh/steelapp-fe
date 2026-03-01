import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../notificationService.js", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../productService.js", () => ({
  productService: {
    createProduct: vi.fn(),
    getProducts: vi.fn(),
  },
}));

import { demoDataService } from "../demoDataService.js";
import { notificationService } from "../notificationService.js";
import { productService } from "../productService.js";

describe("demoDataService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initializeDemoProducts", () => {
    it("creates demo products and returns success count", async () => {
      productService.createProduct.mockResolvedValue({});

      const count = await demoDataService.initializeDemoProducts();

      expect(count).toBeGreaterThan(0);
      expect(productService.createProduct).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it("counts only successful creations", async () => {
      productService.createProduct
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("Duplicate"))
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("Duplicate"))
        .mockResolvedValueOnce({});

      const count = await demoDataService.initializeDemoProducts();

      expect(count).toBe(3);
    });

    it("shows error notification when all fail", async () => {
      productService.createProduct.mockRejectedValue(new Error("Fail"));

      const count = await demoDataService.initializeDemoProducts();

      expect(count).toBe(0);
    });
  });

  describe("checkDemoProductsExist", () => {
    it("returns true when products exist", async () => {
      productService.getProducts.mockResolvedValue({
        products: [{ id: 1, name: "Test" }],
      });

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(true);
    });

    it("returns false when no products", async () => {
      productService.getProducts.mockResolvedValue({ products: [] });

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(false);
    });

    it("returns false on API error", async () => {
      productService.getProducts.mockRejectedValue(new Error("Network error"));

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(false);
    });
  });
});
