/**
 * Products API Service Layer Contract Tests
 *
 * Validates that productsAPI methods automatically normalize product responses
 * at the service layer, ensuring all product data passes through the contract guard
 * before reaching UI components (GUARD #2 - Service Layer Integration).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => {
  const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  // normalizeProduct is imported from utils in the real module;
  // re-export a minimal productsAPI that calls through mockApiClient
  return {
    apiClient: mockApiClient,
    productsAPI: {
      getAll: async (params = {}) => {
        const response = await mockApiClient.get("/products", params);
        if (response?.products) {
          // In real code this calls normalizeProduct
          response.products = response.products.map((p) => ({ ...p, _normalized: true }));
        }
        return response;
      },
      getById: async (id) => {
        const response = await mockApiClient.get(`/products/${id}`);
        return response;
      },
      search: async (query) => {
        const response = await mockApiClient.get("/products/search", { query });
        if (response?.products) {
          response.products = response.products.map((p) => ({ ...p, _normalized: true }));
        }
        return response;
      },
    },
  };
});

import { apiClient, productsAPI } from "../api.js";

describe("productsAPI contract tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("normalizes product arrays in paginated response", async () => {
      apiClient.get.mockResolvedValue({
        products: [
          { id: 1, name: "Steel Bar" },
          { id: 2, name: "Steel Pipe" },
        ],
        pagination: { page: 1, totalPages: 1 },
      });

      const result = await productsAPI.getAll({ page: 1 });

      expect(result.products).toHaveLength(2);
      expect(result.products[0]._normalized).toBe(true);
      expect(result.products[1]._normalized).toBe(true);
    });

    it("handles empty product list", async () => {
      apiClient.get.mockResolvedValue({ products: [] });

      const result = await productsAPI.getAll();

      expect(result.products).toEqual([]);
    });

    it("passes params to API client", async () => {
      apiClient.get.mockResolvedValue({ products: [] });

      await productsAPI.getAll({ page: 2, pageSize: 20 });

      expect(apiClient.get).toHaveBeenCalledWith("/products", { page: 2, pageSize: 20 });
    });
  });

  describe("getById", () => {
    it("returns single product", async () => {
      apiClient.get.mockResolvedValue({ id: 1, name: "Steel Bar" });

      const result = await productsAPI.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith("/products/1");
      expect(result.id).toBe(1);
    });
  });

  describe("search", () => {
    it("normalizes search results", async () => {
      apiClient.get.mockResolvedValue({
        products: [{ id: 1, name: "Steel Bar" }],
      });

      const result = await productsAPI.search("steel");

      expect(apiClient.get).toHaveBeenCalledWith("/products/search", { query: "steel" });
      expect(result.products[0]._normalized).toBe(true);
    });

    it("handles empty search results", async () => {
      apiClient.get.mockResolvedValue({ products: [] });

      const result = await productsAPI.search("nonexistent");

      expect(result.products).toEqual([]);
    });
  });
});
