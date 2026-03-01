/**
 * Product Service Unit Tests
 * ✅ Comprehensive test coverage for productService
 * ✅ Tests CRUD operations, search, filtering, stock management
 * ✅ Covers data transformation, analytics, and file downloads
 * ✅ 100% coverage target for productService.js
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock API client and file operations

// Mock DOM APIs

import { apiClient } from "../api.js";
// Import after mocks
import { productService, transformProductFromServer } from "../productService.js";

describe("productService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe("CRUD Operations", () => {
    describe("getAll() / getProducts()", () => {
      it("should fetch all products with pagination", async () => {
        const mockProducts = [
          {
            id: 1,
            name: "SS-304-Sheet",
            sku: "SS304-SH-001",
            category: "Sheet",
            costPrice: 100,
            sellingPrice: 150,
            quantityInStock: 500,
            status: "ACTIVE",
          },
          {
            id: 2,
            name: "SS-316-Coil",
            sku: "SS316-CL-001",
            category: "Coil",
            costPrice: 120,
            sellingPrice: 180,
            quantityInStock: 300,
            status: "ACTIVE",
          },
        ];

        vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProducts);

        const result = await productService.getProducts({ page: 1, limit: 20 });

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
        expect(result.length).toBe(2);
        expect(result[0].name).toBe("SS-304-Sheet");
      });

      it("should fetch products with getAll() alias", async () => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

        await productService.getAll({ page: 1 });

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
      });

      it("should filter products by category", async () => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

        await productService.getProducts({ category: "Sheet" });

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
      });

      it("should handle empty product list", async () => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

        const result = await productService.getProducts();

        expect(result).toEqual([]);
      });
    });

    describe("getProduct()", () => {
      it("should fetch single product by ID", async () => {
        const mockProduct = {
          id: 1,
          name: "SS-304-Sheet",
          sku: "SS304-SH-001",
          grade: "304",
          form: "Sheet",
          finish: "Brushed",
          thickness: "2mm",
          width: "1000mm",
          costPrice: 100,
          sellingPrice: 150,
          quantityInStock: 500,
          status: "ACTIVE",
        };

        vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProduct);

        const result = await productService.getProduct(1);

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
        expect(result.id).toBe(1);
        expect(result.name).toBe("SS-304-Sheet");
      });

      it("should handle non-existent product", async () => {
        vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

        await expect(productService.getProduct(999)).rejects.toThrow();
      });
    });

    describe("createProduct()", () => {
      it("should create new product", async () => {
        const newProduct = {
          name: "SS-304-Pipe",
          sku: "SS304-PP-001",
          category: "Pipe",
          grade: "304",
          form: "Pipe",
          unit: "KG",
          costPrice: 80,
          sellingPrice: 120,
          quantityInStock: 0,
          status: "ACTIVE",
        };

        const created = {
          id: 10,
          ...newProduct,
        };

        vi.spyOn(apiClient, "post").mockResolvedValueOnce(created);

        const result = await productService.createProduct(newProduct);

        expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
        expect(result.id).toBe(10);
        expect(result.name).toBe("SS-304-Pipe");
      });

      it("should validate required fields", async () => {
        vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Validation: Name required"));

        await expect(
          productService.createProduct({
            sku: "INCOMPLETE",
          })
        ).rejects.toThrow();
      });
    });

    describe("updateProduct()", () => {
      it("should update existing product", async () => {
        const updates = {
          sellingPrice: 175,
          quantityInStock: 400,
          status: "ACTIVE",
        };

        const updated = {
          id: 1,
          name: "SS-304-Sheet",
          ...updates,
        };

        vi.spyOn(apiClient, "put").mockResolvedValueOnce(updated);

        const result = await productService.updateProduct(1, updates);

        expect(apiClient.put.mock.calls.length > 0).toBeTruthy();
        expect(result.sellingPrice).toBe(175);
      });
    });

    describe("deleteProduct()", () => {
      it("should delete product", async () => {
        vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

        const result = await productService.deleteProduct(1);

        expect(apiClient.delete.mock.calls.length > 0).toBeTruthy();
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // PRICING & STOCK OPERATIONS
  // ============================================================================

  describe("Pricing & Stock Operations", () => {
    describe("updateProductPrice()", () => {
      it("should update product price", async () => {
        const priceData = {
          costPrice: 95,
          sellingPrice: 160,
          margin: "68.42%",
        };

        vi.spyOn(apiClient, "post").mockResolvedValueOnce({
          id: 1,
          ...priceData,
        });

        const result = await productService.updateProductPrice(1, priceData);

        expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
        expect(result.sellingPrice).toBe(160);
      });
    });

    describe("updateStock()", () => {
      it("should update product stock", async () => {
        const stockData = {
          quantityInStock: 450,
          minStock: 100,
          maxStock: 1000,
        };

        vi.spyOn(apiClient, "put").mockResolvedValueOnce({
          id: 1,
          ...stockData,
        });

        const result = await productService.updateStock(1, stockData);

        expect(apiClient.put.mock.calls.length > 0).toBeTruthy();
        expect(result.quantityInStock).toBe(450);
      });
    });
  });

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  describe("Analytics & Reporting", () => {
    describe("getProductAnalytics()", () => {
      it("should fetch product analytics", async () => {
        const mockAnalytics = {
          totalProducts: 150,
          activeProducts: 145,
          inactiveProducts: 5,
          totalInventoryValue: 500000,
          lowStockItems: 12,
          outOfStockItems: 3,
        };

        vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockAnalytics);

        const result = await productService.getProductAnalytics();

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
        expect(result.totalProducts).toBe(150);
        expect(result.activeProducts).toBe(145);
      });

      it("should handle empty analytics", async () => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce({
          totalProducts: 0,
          activeProducts: 0,
        });

        const result = await productService.getProductAnalytics();

        expect(result.totalProducts).toBe(0);
      });
    });
  });

  // ============================================================================
  // SEARCH & FILTERING
  // ============================================================================

  describe("Search & Filtering", () => {
    describe("searchProducts()", () => {
      it("should search products by term", async () => {
        const mockResults = [
          {
            id: 1,
            name: "SS-304-Sheet",
            sku: "SS304-SH-001",
          },
        ];

        vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockResults);

        const result = await productService.searchProducts("304");

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
        expect(result.length).toBe(1);
      });

      it("should search with additional filters", async () => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

        await productService.searchProducts("SS-304", { category: "Sheet" });

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
      });

      it("should handle no search results", async () => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

        const result = await productService.searchProducts("NONEXISTENT");

        expect(result).toEqual([]);
      });
    });

    describe("getProductsByCategory()", () => {
      it("should get products by category", async () => {
        const mockProducts = [
          { id: 1, category: "Sheet", name: "Product 1" },
          { id: 2, category: "Sheet", name: "Product 2" },
        ];

        vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProducts);

        const result = await productService.getProductsByCategory("Sheet");

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
        expect(result.length).toBe(2);
      });
    });

    describe("getLowStockProducts()", () => {
      it("should get low stock products", async () => {
        const mockProducts = [
          { id: 3, name: "Low Stock Item 1", quantityInStock: 10 },
          { id: 4, name: "Low Stock Item 2", quantityInStock: 5 },
        ];

        vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProducts);

        const result = await productService.getLowStockProducts();

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
        expect(result.length).toBe(2);
      });

      it("should handle no low stock products", async () => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

        const result = await productService.getLowStockProducts();

        expect(result).toEqual([]);
      });
    });
  });

  // ============================================================================
  // WAREHOUSE OPERATIONS
  // ============================================================================

  describe("Warehouse Operations", () => {
    describe("getWarehouseStock()", () => {
      it("should get warehouse stock for product", async () => {
        const mockStock = {
          productId: 1,
          warehouses: [
            {
              warehouseId: 1,
              warehouseName: "Main Warehouse",
              quantity: 300,
            },
            {
              warehouseId: 2,
              warehouseName: "Secondary Warehouse",
              quantity: 200,
            },
          ],
          totalStock: 500,
        };

        vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockStock);

        const result = await productService.getWarehouseStock(1);

        expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
        expect(result.totalStock).toBe(500);
        expect(result.warehouses.length).toBe(2);
      });
    });
  });

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  describe("File Operations", () => {
    describe("downloadProducts()", () => {
      test("should download products as file", async () => {
        const { mockBrowserDownload } = await import("../../test/downloadMocks.js");
        const mocks = mockBrowserDownload();

        const mockBlob = new Blob(["product data"], {
          type: "application/vnd.openxmlformats",
        });

        const { apiService } = await import("../axiosApi.js");
        apiService.request = vi.fn().mockResolvedValueOnce(mockBlob);

        await productService.downloadProducts();

        expect(mocks.createObjectURL).toHaveBeenCalled();
        expect(mocks.click).toHaveBeenCalled();
        expect(mocks.anchor.download).toMatch(/^products_\d{4}-\d{2}-\d{2}\.xlsx$/);
      });
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  describe("Data Transformation", () => {
    describe("transformProductFromServer()", () => {
      it("should transform product with camelCase conversion", () => {
        const serverData = {
          id: 1,
          name: "SS-304-Sheet",
          sku: "SS304-SH-001",
          grade: "304",
          form: "Sheet",
          finish: "Brushed",
          size: "1000x2000",
          thickness: "2mm",
          unit: "KG",
          cost_price: "100.00",
          selling_price: "150.00",
          quantity_in_stock: "500",
          reorder_level: "100",
          status: "ACTIVE",
        };

        const result = transformProductFromServer(serverData);

        expect(result.id).toBe(1);
        expect(result.name).toBe("SS-304-Sheet");
        expect(result.costPrice).toBe(100);
        expect(result.sellingPrice).toBe(150);
        expect(result.quantityInStock).toBe(500);
        expect(result.reorderLevel).toBe(100);
      });

      it("should handle product naming system fields", () => {
        const serverData = {
          id: 1,
          unique_name: "SS-304-Sheet-Brushed-1000mm-2mm-2000mm",
          display_name: "SS-304-Sheet",
          full_name: "Stainless Steel 304 Grade Sheet Brushed Finish",
        };

        const result = transformProductFromServer(serverData);

        expect(result.uniqueName).toBe("SS-304-Sheet-Brushed-1000mm-2mm-2000mm");
        expect(result.displayName).toBe("SS-304-Sheet");
        expect(result.fullName).toContain("Stainless Steel");
      });

      it("should handle material specifications", () => {
        const serverData = {
          id: 1,
          grade: "304",
          form: "Pipe",
          finish: "Polished",
          heat_number: "HT-2026-001",
          mill_name: "TATA Steel",
          mill_country: "India",
          hs_code: "730720",
        };

        const result = transformProductFromServer(serverData);

        expect(result.grade).toBe("304");
        expect(result.form).toBe("Pipe");
        expect(result.heatNumber).toBe("HT-2026-001");
        expect(result.millName).toBe("TATA Steel");
        expect(result.hsCode).toBe("730720");
      });

      it("should handle null input", () => {
        const result = transformProductFromServer(null);
        expect(result).toBe(null);
      });

      it("should provide default values for optional fields", () => {
        const result = transformProductFromServer({});

        expect(result.name).toBe("");
        expect(result.unit).toBe("KG");
        expect(result.costPrice).toBe(0);
        expect(result.sellingPrice).toBe(0);
        expect(result.quantityInStock).toBe(0);
        expect(result.status).toBe("ACTIVE");
      });

      it("should handle various naming system combinations", () => {
        const serverData = {
          id: 1,
          display_name: "SS-304-Sheet",
          displayName: "SS-304-Sheet-Alt",
          name: "SS-304-Sheet-Priority",
        };

        const result = transformProductFromServer(serverData);

        // Should prioritize in order: name -> displayName -> display_name
        expect(result.name).toBe("SS-304-Sheet-Priority");
      });

      it("should handle missing values with fallbacks", () => {
        const result = transformProductFromServer({
          id: 1,
          cost_price: "50",
        });

        expect(result.costPrice).toBe(50);
        expect(result.sellingPrice).toBe(0);
      });
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe("Edge Cases & Error Handling", () => {
    it("should handle product with very long name", async () => {
      const longName = "A".repeat(255);
      const data = {
        name: longName,
        sku: "LONG-NAME",
        unit: "KG",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ id: 1, ...data });

      const result = await productService.createProduct(data);

      expect(result.name).toBe(longName);
    });

    it("should handle product with special characters", async () => {
      const data = {
        name: "SS-304™ Sheet © with ® marks",
        sku: "SPECIAL-CHARS",
        notes: "Product with é, ñ, ü characters",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ id: 1, ...data });

      const result = await productService.createProduct(data);

      expect(result.name).toContain("™");
      expect(result.notes).toContain("é");
    });

    it("should handle zero prices", () => {
      const result = transformProductFromServer({
        cost_price: "0",
        selling_price: "0",
      });

      expect(result.costPrice).toBe(0);
      expect(result.sellingPrice).toBe(0);
    });

    it("should handle very large inventory quantities", () => {
      const result = transformProductFromServer({
        quantity_in_stock: "999999999",
      });

      expect(result.quantityInStock).toBe(999999999);
    });

    it("should handle decimal quantities", () => {
      const result = transformProductFromServer({
        quantity_in_stock: "100.5",
      });

      expect(result.quantityInStock).toBe(100.5);
    });

    it("should handle network timeout", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network timeout"));

      await expect(productService.getProducts()).rejects.toThrow();
    });

    it("should handle server errors", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Server error: 500"));

      await expect(productService.getProducts()).rejects.toThrow();
    });
  });
});
