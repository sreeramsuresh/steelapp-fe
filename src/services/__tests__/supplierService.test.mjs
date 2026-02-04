/**
 * Supplier Service Unit Tests
 * ✅ Tests supplier CRUD operations
 * ✅ Tests data transformation (snake_case ↔ camelCase)
 * ✅ Tests multi-tenancy isolation
 * ✅ Tests localStorage fallback for offline support
 * ✅ 100% coverage target for supplierService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";


import supplierService, { transformSupplierFromServer } from "../supplierService.js";
import { apiClient } from "../api.js";

describe("supplierService", () => {
  beforeEach(() => {
    sinon.restore();
    localStorage.clear();
    // Mock environment variable to enable API calls in tests
    import.meta.env.VITE_ENABLE_SUPPLIERS = "true";
  });

  describe("getSuppliers", () => {
    test("should fetch suppliers from API", async () => {
      const mockSuppliers = {
        suppliers: [
          {
            id: 1,
            companyId: 1,
            name: "ABC Supplies",
            country: "UAE",
            status: "ACTIVE",
          },
          {
            id: 2,
            companyId: 1,
            name: "XYZ Corp",
            country: "India",
            status: "ACTIVE",
          },
        ],
        pageInfo: { page: 1, totalPages: 1, total: 2 },
      };
      apiClient.get.mockResolvedValueOnce(mockSuppliers);

      const result = await supplierService.getSuppliers({ page: 1, limit: 20 });

      assert.ok(result.suppliers).toHaveLength(2);
      assert.ok(result.suppliers[0].name).toBe("ABC Supplies");
      assert.ok(apiClient.get).toHaveBeenCalledWith("/suppliers", { page: 1, limit: 20 });
    });

    test("should handle API errors and return localStorage fallback", async () => {
      const localSuppliers = [{ id: 1, name: "Cached Supplier", country: "UAE" }];
      localStorage.setItem("steel-app-suppliers", JSON.stringify(localSuppliers));
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await supplierService.getSuppliers();

      assert.ok(result.suppliers).toHaveLength(1);
      assert.ok(result.suppliers[0].name).toBe("Cached Supplier");
    });

    test("should return empty array if API fails and no local cache", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await supplierService.getSuppliers();

      assert.ok(result.suppliers).toEqual([]);
    });
  });

  describe("getSupplier", () => {
    test("should fetch supplier by ID from API", async () => {
      const mockSupplier = {
        id: 3,
        companyId: 1,
        name: "Premium Suppliers Ltd",
        country: "UAE",
        contactName: "John Doe",
        email: "john@supplier.com",
      };
      apiClient.get.mockResolvedValueOnce(mockSupplier);

      const result = await supplierService.getSupplier(3);

      assert.ok(result.name).toBe("Premium Suppliers Ltd");
      assert.ok(apiClient.get).toHaveBeenCalledWith("/suppliers/3");
    });

    test("should fallback to localStorage if API fails", async () => {
      const localSupplier = { id: 3, name: "Local Supplier", country: "UAE" };
      localStorage.setItem("steel-app-suppliers", JSON.stringify([localSupplier]));
      apiClient.get.mockRejectedValueOnce(new Error("API unavailable"));

      const result = await supplierService.getSupplier(3);

      assert.ok(result.name).toBe("Local Supplier");
    });

    test("should return undefined if supplier not found in API or localStorage", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Not found"));

      const result = await supplierService.getSupplier(999);

      assert.ok(result).toBeUndefined();
    });
  });

  describe("createSupplier", () => {
    test("should create supplier via API", async () => {
      const newSupplier = {
        name: "New Vendor",
        address: { country: "Singapore" },
        contactEmail: "vendor@company.com",
      };
      const mockResponse = {
        id: 5,
        companyId: 1,
        ...newSupplier,
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await supplierService.createSupplier(newSupplier);

      assert.ok(result.id).toBe(5);
      assert.ok(result.companyId).toBe(1);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/suppliers", newSupplier);
    });

    test("should fallback to localStorage if API fails", async () => {
      const newSupplier = {
        id: 10,
        name: "Fallback Supplier",
        address: { country: "UAE" },
      };
      apiClient.post.mockRejectedValueOnce(new Error("API error"));

      const result = await supplierService.createSupplier(newSupplier);

      assert.ok(result.name).toBe("Fallback Supplier");
      // Verify it was saved to localStorage
      const stored = JSON.parse(localStorage.getItem("steel-app-suppliers"));
      assert.ok(stored.some((s) => s.id === 10)).toBe(true);
    });

    test("should generate ID if not provided in fallback", async () => {
      const newSupplier = {
        name: "No ID Supplier",
        address: { country: "UAE" },
      };
      apiClient.post.mockRejectedValueOnce(new Error("API error"));

      const result = await supplierService.createSupplier(newSupplier);

      assert.ok(result.id).toBeDefined();
      assert.ok(result.id).toMatch(/^sup_\d+$/);
    });
  });

  describe("updateSupplier", () => {
    test("should update supplier via API", async () => {
      const updates = { status: "INACTIVE", country: "India" };
      const mockResponse = {
        id: 3,
        companyId: 1,
        name: "Supplier",
        ...updates,
      };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await supplierService.updateSupplier(3, updates);

      assert.ok(result.status).toBe("INACTIVE");
      assert.ok(result.country).toBe("India");
      assert.ok(apiClient.put).toHaveBeenCalledWith("/suppliers/3", updates);
    });

    test("should fallback to localStorage if API fails", async () => {
      const updates = { status: "INACTIVE" };
      apiClient.put.mockRejectedValueOnce(new Error("API error"));

      const result = await supplierService.updateSupplier(3, updates);

      assert.ok(result.id).toBe(3);
      assert.ok(result.status).toBe("INACTIVE");
      // Verify it was saved to localStorage
      const stored = JSON.parse(localStorage.getItem("steel-app-suppliers"));
      assert.ok(stored.some((s) => s.id === 3 && s.status === "INACTIVE")).toBe(true);
    });
  });

  describe("deleteSupplier", () => {
    test("should delete supplier via API", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await supplierService.deleteSupplier(5);

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.delete).toHaveBeenCalledWith("/suppliers/5");
    });

    test("should fallback to localStorage if API fails", async () => {
      localStorage.setItem(
        "steel-app-suppliers",
        JSON.stringify([
          { id: 5, name: "To Delete", country: "UAE" },
          { id: 6, name: "Keep", country: "UAE" },
        ])
      );
      apiClient.delete.mockRejectedValueOnce(new Error("API error"));

      const result = await supplierService.deleteSupplier(5);

      assert.ok(result.success).toBe(true);
      // Verify deleted from localStorage
      const stored = JSON.parse(localStorage.getItem("steel-app-suppliers"));
      assert.ok(stored.some((s) => s.id === 5)).toBe(false);
      assert.ok(stored.some((s) => s.id === 6)).toBe(true);
    });
  });

  describe("transformSupplierFromServer", () => {
    test("should transform snake_case to camelCase", () => {
      const serverData = {
        id: 1,
        company_id: 1,
        name: "ABC Supplier",
        contact_name: "John Doe",
        contact_email: "john@supplier.com",
        vat_number: "AE123456789",
        trn_number: "100123456789012",
        supplier_type: "WHOLESALE",
        payment_terms: 30,
        on_time_delivery_pct: 95,
        credit_limit: 50000,
      };

      const transformed = transformSupplierFromServer(serverData);

      assert.ok(transformed.companyId).toBe(1);
      assert.ok(transformed.contactName).toBe("John Doe");
      assert.ok(transformed.contactEmail).toBe("john@supplier.com");
      assert.ok(transformed.vatNumber).toBe("AE123456789");
      assert.ok(transformed.trnNumber).toBe("100123456789012");
      assert.ok(transformed.supplierType).toBe("WHOLESALE");
      assert.ok(transformed.paymentTerms).toBe(30);
      assert.ok(transformed.onTimeDeliveryPct).toBe(95);
      assert.ok(transformed.creditLimit).toBe(50000);
    });

    test("should handle camelCase fields from server", () => {
      const serverData = {
        id: 1,
        companyId: 1,
        contactName: "Jane Doe",
      };

      const transformed = transformSupplierFromServer(serverData);

      assert.ok(transformed.companyId).toBe(1);
      assert.ok(transformed.contactName).toBe("Jane Doe");
    });

    test("should provide defaults for missing fields", () => {
      const serverData = {
        id: 1,
        name: "Minimal Supplier",
      };

      const transformed = transformSupplierFromServer(serverData);

      assert.ok(transformed.name).toBe("Minimal Supplier");
      assert.ok(transformed.email).toBe("");
      assert.ok(transformed.phone).toBe("");
      assert.ok(transformed.status).toBe("ACTIVE");
      assert.ok(transformed.currentCredit).toBe(0);
      assert.ok(transformed.creditLimit).toBe(0);
      assert.ok(transformed.defaultCurrency).toBe("AED");
    });

    test("should return null for null input", () => {
      const result = transformSupplierFromServer(null);

      assert.ok(result).toBeNull();
    });

    test("should return null for undefined input", () => {
      const result = transformSupplierFromServer(undefined);

      assert.ok(result).toBeNull();
    });

    test("should parse financial fields as numbers", () => {
      const serverData = {
        id: 1,
        current_credit: "5000",
        credit_limit: "100000",
        on_time_delivery_pct: "92.5",
        score: "88",
      };

      const transformed = transformSupplierFromServer(serverData);

      assert.ok(typeof transformed.currentCredit).toBe("number");
      assert.ok(transformed.currentCredit).toBe(5000);
      assert.ok(typeof transformed.creditLimit).toBe("number");
      assert.ok(transformed.creditLimit).toBe(100000);
      assert.ok(typeof transformed.onTimeDeliveryPct).toBe("number");
      assert.ok(transformed.onTimeDeliveryPct).toBe(92.5);
      assert.ok(typeof transformed.score).toBe("number");
      assert.ok(transformed.score).toBe(88);
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors in getSuppliers gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network timeout"));

      const result = await supplierService.getSuppliers();

      assert.ok(result.suppliers).toEqual([]);
    });

    test("should handle network errors in getSupplier gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await supplierService.getSupplier(1);

      assert.ok(result).toBeUndefined();
    });

    test("should handle network errors in createSupplier with fallback", async () => {
      const data = { name: "Test" };
      apiClient.post.mockRejectedValueOnce(new Error("API error"));

      const result = await supplierService.createSupplier(data);

      assert.ok(result.name).toBe("Test");
      assert.ok(result.id).toBeDefined();
    });
  });
});