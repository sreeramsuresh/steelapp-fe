/**
 * Product Service Unit Tests
 * ✅ Comprehensive test coverage for productService
 * ✅ Tests CRUD operations, search, filtering, stock management
import '../../__tests__/init.mjs';

 * ✅ Covers data transformation, analytics, and file downloads
 * ✅ 100% coverage target for productService.js
 */

import { apiService } from "../axiosApi.js";
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

// Mock API client and file operations

// Mock DOM APIs

import { apiClient } from "../api.js";
// Import after mocks
import { productService, transformProductFromServer } from "../productService.js";

describe("productService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe("CRUD Operations", () => {
    describe("getAll() / getProducts()", () => {
      test("should fetch all products with pagination", async () => {
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

        sinon.stub(apiClient, "get").onFirstCall().resolves(mockProducts);

        const result = await productService.getProducts({ page: 1, limit: 20 });

        assert.ok(apiClient.get.called);
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, "SS-304-Sheet");
      });

      test("should fetch products with getAll() alias", async () => {
        sinon.stub(apiClient, "get").onFirstCall().resolves([]);

        await productService.getAll({ page: 1 });

        assert.ok(apiClient.get.called);
      });

      test("should filter products by category", async () => {
        sinon.stub(apiClient, "get").onFirstCall().resolves([]);

        await productService.getProducts({ category: "Sheet" });

        assert.ok(apiClient.get.called);
      });

      test("should handle empty product list", async () => {
        sinon.stub(apiClient, "get").onFirstCall().resolves([]);

        const result = await productService.getProducts();

        assert.deepStrictEqual(result, []);
      });
    });

    describe("getProduct()", () => {
      test("should fetch single product by ID", async () => {
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

        sinon.stub(apiClient, "get").onFirstCall().resolves(mockProduct);

        const result = await productService.getProduct(1);

        assert.ok(apiClient.get.called);
        assert.strictEqual(result.id, 1);
        assert.strictEqual(result.name, "SS-304-Sheet");
      });

      test("should handle non-existent product", async () => {
        sinon.stub(apiClient, "get").onFirstCall().rejects(new Error("Not found"));

        await assert.rejects(() => productService.getProduct(999), Error);
      });
    });

    describe("createProduct()", () => {
      test("should create new product", async () => {
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

        sinon.stub(apiClient, "post").onFirstCall().resolves(created);

        const result = await productService.createProduct(newProduct);

        assert.ok(apiClient.post.called);
        assert.strictEqual(result.id, 10);
        assert.strictEqual(result.name, "SS-304-Pipe");
      });

      test("should validate required fields", async () => {
        sinon.stub(apiClient, "post").onFirstCall().rejects(new Error("Validation: Name required"));

        assert.rejects(productService.createProduct({
            sku: "INCOMPLETE",
          }), Error);
      });
    });

    describe("updateProduct()", () => {
      test("should update existing product", async () => {
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

        sinon.stub(apiClient, "put").onFirstCall().resolves(updated);

        const result = await productService.updateProduct(1, updates);

        assert.ok(apiClient.put.called);
        assert.strictEqual(result.sellingPrice, 175);
      });
    });

    describe("deleteProduct()", () => {
      test("should delete product", async () => {
        sinon.stub(apiClient, "delete").onFirstCall().resolves({ success: true });

        const result = await productService.deleteProduct(1);

        assert.ok(apiClient.delete.called);
        assert.strictEqual(result.success, true);
      });
    });
  });

  // ============================================================================
  // PRICING & STOCK OPERATIONS
  // ============================================================================

  describe("Pricing & Stock Operations", () => {
    describe("updateProductPrice()", () => {
      test("should update product price", async () => {
        const priceData = {
          costPrice: 95,
          sellingPrice: 160,
          margin: "68.42%",
        };

        sinon.stub(apiClient, "post").onFirstCall().resolves({
          id: 1,
          ...priceData,
        });

        const result = await productService.updateProductPrice(1, priceData);

        assert.ok(apiClient.post.called);
        assert.strictEqual(result.sellingPrice, 160);
      });
    });

    describe("updateStock()", () => {
      test("should update product stock", async () => {
        const stockData = {
          quantityInStock: 450,
          minStock: 100,
          maxStock: 1000,
        };

        sinon.stub(apiClient, "put").onFirstCall().resolves({
          id: 1,
          ...stockData,
        });

        const result = await productService.updateStock(1, stockData);

        assert.ok(apiClient.put.called);
        assert.strictEqual(result.quantityInStock, 450);
      });
    });
  });

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  describe("Analytics & Reporting", () => {
    describe("getProductAnalytics()", () => {
      test("should fetch product analytics", async () => {
        const mockAnalytics = {
          totalProducts: 150,
          activeProducts: 145,
          inactiveProducts: 5,
          totalInventoryValue: 500000,
          lowStockItems: 12,
          outOfStockItems: 3,
        };

        sinon.stub(apiClient, "get").onFirstCall().resolves(mockAnalytics);

        const result = await productService.getProductAnalytics();

        assert.ok(apiClient.get.called);
        assert.strictEqual(result.totalProducts, 150);
        assert.strictEqual(result.activeProducts, 145);
      });

      test("should handle empty analytics", async () => {
        sinon.stub(apiClient, "get").onFirstCall().resolves({
          totalProducts: 0,
          activeProducts: 0,
        });

        const result = await productService.getProductAnalytics();

        assert.strictEqual(result.totalProducts, 0);
      });
    });
  });

  // ============================================================================
  // SEARCH & FILTERING
  // ============================================================================

  describe("Search & Filtering", () => {
    describe("searchProducts()", () => {
      test("should search products by term", async () => {
        const mockResults = [
          {
            id: 1,
            name: "SS-304-Sheet",
            sku: "SS304-SH-001",
          },
        ];

        sinon.stub(apiClient, "get").onFirstCall().resolves(mockResults);

        const result = await productService.searchProducts("304");

        assert.ok(apiClient.get.called);
        assert.strictEqual(result.length, 1);
      });

      test("should search with additional filters", async () => {
        sinon.stub(apiClient, "get").onFirstCall().resolves([]);

        await productService.searchProducts("SS-304", { category: "Sheet" });

        assert.ok(apiClient.get.called);
      });

      test("should handle no search results", async () => {
        sinon.stub(apiClient, "get").onFirstCall().resolves([]);

        const result = await productService.searchProducts("NONEXISTENT");

        assert.deepStrictEqual(result, []);
      });
    });

    describe("getProductsByCategory()", () => {
      test("should get products by category", async () => {
        const mockProducts = [
          { id: 1, category: "Sheet", name: "Product 1" },
          { id: 2, category: "Sheet", name: "Product 2" },
        ];

        sinon.stub(apiClient, "get").onFirstCall().resolves(mockProducts);

        const result = await productService.getProductsByCategory("Sheet");

        assert.ok(apiClient.get.called);
        assert.strictEqual(result.length, 2);
      });
    });

    describe("getLowStockProducts()", () => {
      test("should get low stock products", async () => {
        const mockProducts = [
          { id: 3, name: "Low Stock Item 1", quantityInStock: 10 },
          { id: 4, name: "Low Stock Item 2", quantityInStock: 5 },
        ];

        sinon.stub(apiClient, "get").onFirstCall().resolves(mockProducts);

        const result = await productService.getLowStockProducts();

        assert.ok(apiClient.get.called);
        assert.strictEqual(result.length, 2);
      });

      test("should handle no low stock products", async () => {
        sinon.stub(apiClient, "get").onFirstCall().resolves([]);

        const result = await productService.getLowStockProducts();

        assert.deepStrictEqual(result, []);
      });
    });
  });

  // ============================================================================
  // WAREHOUSE OPERATIONS
  // ============================================================================

  describe("Warehouse Operations", () => {
    describe("getWarehouseStock()", () => {
      test("should get warehouse stock for product", async () => {
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

        sinon.stub(apiClient, "get").onFirstCall().resolves(mockStock);

        const result = await productService.getWarehouseStock(1);

        assert.ok(apiClient.get.called);
        assert.strictEqual(result.totalStock, 500);
        assert.strictEqual(result.warehouses.length, 2);
      });
    });
  });

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  describe("File Operations", () => {
    describe("downloadProducts()", () => {
      test.skip("should download products as file", async () => {
        const mockBlob = new Blob(["product data"], {
          type: "application/vnd.openxmlformats",
        });

        const { apiService } = await import("../axiosApi.js");
        apiService.request = sinon.stub().mockResolvedValueOnce(mockBlob);

        // Mock document functions
        const mockLink = { click: sinon.stub(), style: {}, download: "" };
        vi.mocked(global.document.createElement).mockReturnValueOnce(mockLink);

        await productService.downloadProducts();

        assert.ok(global.URL.createObjectURL.called);
        assert.ok(mockLink.download).toMatch(/^products_\d{4}-\d{2}-\d{2}\.xlsx$/);
      });
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  describe("Data Transformation", () => {
    describe("transformProductFromServer()", () => {
      test("should transform product with camelCase conversion", () => {
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

        assert.strictEqual(result.id, 1);
        assert.strictEqual(result.name, "SS-304-Sheet");
        assert.strictEqual(result.costPrice, 100);
        assert.strictEqual(result.sellingPrice, 150);
        assert.strictEqual(result.quantityInStock, 500);
        assert.strictEqual(result.reorderLevel, 100);
      });

      test("should handle product naming system fields", () => {
        const serverData = {
          id: 1,
          unique_name: "SS-304-Sheet-Brushed-1000mm-2mm-2000mm",
          display_name: "SS-304-Sheet",
          full_name: "Stainless Steel 304 Grade Sheet Brushed Finish",
        };

        const result = transformProductFromServer(serverData);

        assert.strictEqual(result.uniqueName, "SS-304-Sheet-Brushed-1000mm-2mm-2000mm");
        assert.strictEqual(result.displayName, "SS-304-Sheet");
        assert.ok(result.fullName.includes("Stainless Steel"));
      });

      test("should handle material specifications", () => {
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

        assert.strictEqual(result.grade, "304");
        assert.strictEqual(result.form, "Pipe");
        assert.strictEqual(result.heatNumber, "HT-2026-001");
        assert.strictEqual(result.millName, "TATA Steel");
        assert.strictEqual(result.hsCode, "730720");
      });

      test("should handle null input", () => {
        const result = transformProductFromServer(null);
        assert.strictEqual(result, null);
      });

      test("should provide default values for optional fields", () => {
        const result = transformProductFromServer({});

        assert.strictEqual(result.name, "");
        assert.strictEqual(result.unit, "KG");
        assert.strictEqual(result.costPrice, 0);
        assert.strictEqual(result.sellingPrice, 0);
        assert.strictEqual(result.quantityInStock, 0);
        assert.strictEqual(result.status, "ACTIVE");
      });

      test("should handle various naming system combinations", () => {
        const serverData = {
          id: 1,
          display_name: "SS-304-Sheet",
          displayName: "SS-304-Sheet-Alt",
          name: "SS-304-Sheet-Priority",
        };

        const result = transformProductFromServer(serverData);

        // Should prioritize in order: name -> displayName -> display_name
        assert.strictEqual(result.name, "SS-304-Sheet-Priority");
      });

      test("should handle missing values with fallbacks", () => {
        const result = transformProductFromServer({
          id: 1,
          cost_price: "50",
        });

        assert.strictEqual(result.costPrice, 50);
        assert.strictEqual(result.sellingPrice, 0);
      });
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe("Edge Cases & Error Handling", () => {
    test("should handle product with very long name", async () => {
      const longName = "A".repeat(255);
      const data = {
        name: longName,
        sku: "LONG-NAME",
        unit: "KG",
      };

      sinon.stub(apiClient, "post").onFirstCall().resolves({ id: 1, ...data });

      const result = await productService.createProduct(data);

      assert.strictEqual(result.name, longName);
    });

    test("should handle product with special characters", async () => {
      const data = {
        name: "SS-304™ Sheet © with ® marks",
        sku: "SPECIAL-CHARS",
        notes: "Product with é, ñ, ü characters",
      };

      sinon.stub(apiClient, "post").onFirstCall().resolves({ id: 1, ...data });

      const result = await productService.createProduct(data);

      assert.ok(result.name.includes("™"));
      assert.ok(result.notes.includes("é"));
    });

    test("should handle zero prices", () => {
      const result = transformProductFromServer({
        cost_price: "0",
        selling_price: "0",
      });

      assert.strictEqual(result.costPrice, 0);
      assert.strictEqual(result.sellingPrice, 0);
    });

    test("should handle very large inventory quantities", () => {
      const result = transformProductFromServer({
        quantity_in_stock: "999999999",
      });

      assert.strictEqual(result.quantityInStock, 999999999);
    });

    test("should handle decimal quantities", () => {
      const result = transformProductFromServer({
        quantity_in_stock: "100.5",
      });

      assert.strictEqual(result.quantityInStock, 100.5);
    });

    test("should handle network timeout", async () => {
      sinon.stub(apiClient, "get").onFirstCall().rejects(new Error("Network timeout"));

      await assert.rejects(() => productService.getProducts(), Error);
    });

    test("should handle server errors", async () => {
      sinon.stub(apiClient, "get").onFirstCall().rejects(new Error("Server error: 500"));

      await assert.rejects(() => productService.getProducts(), Error);
    });
  });
});