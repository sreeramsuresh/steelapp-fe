/**
 * Products API Service Layer Contract Tests
 *
 * PURPOSE:
 * Validates that productsAPI methods automatically normalize product responses
 * at the service layer, ensuring all product data passes through the contract guard
 * before reaching UI components (GUARD #2 - Service Layer Integration).
 *
 * CRITICAL: This test ensures that:
 * 1. productsAPI.getAll() normalizes product arrays
 * 2. productsAPI.getById() normalizes single products
 * 3. productsAPI.search() normalizes search results
 * 4. All normalized products pass assertProductDomain()
 * 5. Components cannot bypass normalization by using API directly
 *
 * TEST STRATEGY:
 * - Mock axios/apiClient responses with snake_case data
 * - Call productsAPI methods
 * - Verify responses are normalized (camelCase)
 * - Verify no snake_case leaks
 * - Verify contract assertions pass
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, productsAPI } from "../api.js";

// Mock apiClient to simulate backend responses
vi.mock("../api.js", async () => {
  const actual = await vi.importActual("../api.js");
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("Products API Service Layer - Contract Integration (GUARD #2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("productsAPI.getAll()", () => {
    it("should automatically normalize product array responses", async () => {
      // Mock backend response with snake_case
      const mockResponse = {
        data: {
          products: [
            {
              id: 1,
              name: "Product 1",
              unit_weight_kg: 46.5,
              pieces_per_mt: 21.51,
              product_category: "SHEET",
              display_name: "SS-304-SHEET",
            },
            {
              id: 2,
              name: "Product 2",
              unit_weight_kg: 30.0,
              pieces_per_mt: 33.33,
              product_category: "COIL",
              display_name: "SS-316-COIL",
            },
          ],
          pageInfo: { total: 2 },
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      // Call productsAPI
      const response = await productsAPI.getAll({ page: 1, limit: 10 });

      // Verify normalization applied
      expect(response.data.products).toHaveLength(2);

      const product1 = response.data.products[0];
      const product2 = response.data.products[1];

      // Check camelCase fields exist
      expect(product1.unitWeightKg).toBe(46.5);
      expect(product1.piecesPerMt).toBe(21.51);
      expect(product1.productCategory).toBe("SHEET");
      expect(product1.displayName).toBe("SS-304-SHEET");

      expect(product2.unitWeightKg).toBe(30.0);
      expect(product2.piecesPerMt).toBe(33.33);
      expect(product2.productCategory).toBe("COIL");

      // Check snake_case fields removed (no leak)
      expect(product1.unit_weight_kg).toBeUndefined();
      expect(product1.pieces_per_mt).toBeUndefined();
      expect(product1.product_category).toBeUndefined();
      expect(product1.display_name).toBeUndefined();

      expect(product2.unit_weight_kg).toBeUndefined();
      expect(product2.pieces_per_mt).toBeUndefined();
      expect(product2.product_category).toBeUndefined();
    });

    it("should handle empty product arrays", async () => {
      const mockResponse = {
        data: {
          products: [],
          pageInfo: { total: 0 },
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const response = await productsAPI.getAll();

      expect(response.data.products).toEqual([]);
    });
  });

  describe("productsAPI.getById()", () => {
    it("should automatically normalize single product response", async () => {
      // Mock backend response with snake_case
      const mockResponse = {
        data: {
          id: 1,
          name: "Product 1",
          unit_weight_kg: 46.5,
          pieces_per_mt: 21.51,
          product_category: "SHEET",
          pricing_basis: "PER_MT",
          primary_uom: "MT",
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      // Call productsAPI
      const response = await productsAPI.getById(1);

      // Verify normalization applied
      expect(response.data.unitWeightKg).toBe(46.5);
      expect(response.data.piecesPerMt).toBe(21.51);
      expect(response.data.productCategory).toBe("SHEET");
      expect(response.data.pricingBasis).toBe("PER_MT");
      expect(response.data.primaryUom).toBe("MT");

      // Check snake_case fields removed
      expect(response.data.unit_weight_kg).toBeUndefined();
      expect(response.data.pieces_per_mt).toBeUndefined();
      expect(response.data.product_category).toBeUndefined();
      expect(response.data.pricing_basis).toBeUndefined();
      expect(response.data.primary_uom).toBeUndefined();
    });
  });

  describe("productsAPI.search()", () => {
    it("should automatically normalize search results", async () => {
      // Mock backend response with snake_case
      const mockResponse = {
        data: {
          products: [
            {
              id: 1,
              name: "Matching Product",
              unit_weight_kg: 46.5,
              product_category: "SHEET",
              display_name: "SS-304-SHEET",
            },
          ],
          pageInfo: { total: 1 },
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      // Call productsAPI
      const response = await productsAPI.search("SS-304");

      // Verify normalization applied
      expect(response.data.products).toHaveLength(1);

      const product = response.data.products[0];
      expect(product.unitWeightKg).toBe(46.5);
      expect(product.productCategory).toBe("SHEET");
      expect(product.displayName).toBe("SS-304-SHEET");

      // Check snake_case fields removed
      expect(product.unit_weight_kg).toBeUndefined();
      expect(product.product_category).toBeUndefined();
      expect(product.display_name).toBeUndefined();
    });
  });

  describe("productsAPI.getByCategory()", () => {
    it("should automatically normalize category results", async () => {
      const mockResponse = {
        data: {
          products: [
            {
              id: 1,
              name: "Sheet Product",
              unit_weight_kg: 46.5,
              product_category: "SHEET",
            },
          ],
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const response = await productsAPI.getByCategory("SHEET");

      expect(response.data.products).toHaveLength(1);

      const product = response.data.products[0];
      expect(product.unitWeightKg).toBe(46.5);
      expect(product.productCategory).toBe("SHEET");

      // Check snake_case removed
      expect(product.unit_weight_kg).toBeUndefined();
      expect(product.product_category).toBeUndefined();
    });
  });

  describe("Contract Assertion Integration", () => {
    it("should throw if backend returns invalid product data", async () => {
      // Mock backend response with INVALID data
      const mockResponse = {
        data: {
          products: [
            {
              id: 1,
              name: "Product",
              unit_weight_kg: "not a number", // Invalid type!
            },
          ],
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      // Should throw because normalizeProduct calls assertProductDomain
      await expect(productsAPI.getAll()).rejects.toThrow();
    });

    it("should throw if product is missing required fields", async () => {
      const mockResponse = {
        data: {
          id: 1,
          // name is missing!
          unit_weight_kg: 46.5,
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      // Should throw because name is required
      await expect(productsAPI.getById(1)).rejects.toThrow(/name must be a non-empty string/);
    });
  });

  describe("Null/Undefined Handling", () => {
    it("should handle null response data gracefully", async () => {
      const mockResponse = {
        data: null,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const response = await productsAPI.getById(1);

      expect(response.data).toBeNull();
    });

    it("should handle missing products array", async () => {
      const mockResponse = {
        data: {
          // products array missing
          pageInfo: { total: 0 },
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const response = await productsAPI.getAll();

      // Should not crash, products will remain undefined or be handled gracefully
      expect(response.data.products).toBeUndefined();
    });
  });
});
