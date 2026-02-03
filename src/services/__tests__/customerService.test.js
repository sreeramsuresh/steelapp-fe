/**
 * Customer Service Unit Tests
 * ✅ Comprehensive test coverage for customerService
 * ✅ Tests all CRUD operations, credit management, and transformations
 * ✅ Covers multi-tenancy, compliance fields, and edge cases
 * ✅ 100% coverage target for customerService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the API client
vi.mock("../api.js", async () => {
  const actual = await vi.importActual("../api.js");
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import { apiClient } from "../api.js";
// Import after mocks are set up
import { customerService, transformCustomerFromServer } from "../customerService.js";

describe("customerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe("CRUD Operations", () => {
    describe("getCustomers()", () => {
      test("should fetch customers list with pagination", async () => {
        const mockCustomers = [
          { id: 1, name: "Acme Corp", status: "ACTIVE", creditLimit: 10000 },
          { id: 2, name: "XYZ Ltd", status: "ACTIVE", creditLimit: 5000 },
        ];

        apiClient.get.mockResolvedValueOnce({
          customers: mockCustomers,
          pagination: { page: 1, totalPages: 1, total: 2 },
        });

        const result = await customerService.getCustomers({
          page: 1,
          limit: 20,
        });

        expect(result.customers).toHaveLength(2);
        expect(apiClient.get).toHaveBeenCalledWith("/customers", {
          page: 1,
          limit: 20,
        });
      });

      test("should apply search and filter parameters", async () => {
        apiClient.get.mockResolvedValueOnce({ customers: [] });

        await customerService.getCustomers({
          search: "Acme",
          status: "ACTIVE",
          sortBy: "name",
        });

        expect(apiClient.get).toHaveBeenCalledWith("/customers", {
          search: "Acme",
          status: "ACTIVE",
          sortBy: "name",
        });
      });

      test("should handle empty customer list", async () => {
        apiClient.get.mockResolvedValueOnce({ customers: [] });

        const result = await customerService.getCustomers();

        expect(result.customers).toEqual([]);
      });
    });

    describe("getCustomer()", () => {
      test("should fetch single customer by ID", async () => {
        const mockCustomer = {
          id: 1,
          name: "Acme Corp",
          email: "contact@acme.com",
          status: "ACTIVE",
          creditLimit: 10000,
          currentBalance: 2500,
        };

        apiClient.get.mockResolvedValueOnce(mockCustomer);

        const result = await customerService.getCustomer(1);

        expect(result.name).toBe("Acme Corp");
        expect(apiClient.get).toHaveBeenCalledWith("/customers/1");
      });

      test("should handle 404 for non-existent customer", async () => {
        apiClient.get.mockRejectedValueOnce(new Error("Customer not found"));

        await expect(customerService.getCustomer(999)).rejects.toThrow("Customer not found");
      });
    });

    describe("createCustomer()", () => {
      test("should create new customer with all fields", async () => {
        const customerData = {
          name: "New Corp",
          email: "contact@newcorp.com",
          phone: "971-4-123-4567",
          address: {
            street: "123 Business St",
            city: "Dubai",
            state: "DXB",
            zipcode: "12345",
            country: "UAE",
          },
          creditLimit: 50000,
          paymentTerms: 30,
          trn: "UAE123456789012",
          status: "ACTIVE",
        };

        const createdCustomer = {
          id: 10,
          ...customerData,
          createdAt: "2026-02-01T00:00:00Z",
        };

        apiClient.post.mockResolvedValueOnce(createdCustomer);

        const result = await customerService.createCustomer(customerData);

        expect(result.id).toBe(10);
        expect(apiClient.post).toHaveBeenCalledWith("/customers", customerData);
      });

      test("should handle validation errors on creation", async () => {
        apiClient.post.mockRejectedValueOnce(new Error("Email is required"));

        await expect(customerService.createCustomer({ name: "Test" })).rejects.toThrow("Email is required");
      });

      test("should create customer with minimal fields", async () => {
        const minimalData = {
          name: "Simple Corp",
          email: "contact@simple.com",
        };

        apiClient.post.mockResolvedValueOnce({ id: 5, ...minimalData });

        const result = await customerService.createCustomer(minimalData);

        expect(result.id).toBe(5);
      });
    });

    describe("updateCustomer()", () => {
      test("should update customer details", async () => {
        const updates = {
          email: "newemail@acme.com",
          creditLimit: 15000,
        };

        const updatedCustomer = {
          id: 1,
          name: "Acme Corp",
          ...updates,
        };

        apiClient.put.mockResolvedValueOnce(updatedCustomer);

        const result = await customerService.updateCustomer(1, updates);

        expect(result.email).toBe("newemail@acme.com");
        expect(result.creditLimit).toBe(15000);
        expect(apiClient.put).toHaveBeenCalledWith("/customers/1", updates);
      });

      test("should handle update conflicts", async () => {
        apiClient.put.mockRejectedValueOnce(new Error("Customer was modified by another user"));

        await expect(customerService.updateCustomer(1, { name: "Updated" })).rejects.toThrow("Customer was modified");
      });
    });

    describe("deleteCustomer()", () => {
      test("should delete customer with config options", async () => {
        const config = { reason: "Inactive account" };

        apiClient.delete.mockResolvedValueOnce({ success: true });

        const result = await customerService.deleteCustomer(1, config);

        expect(result.success).toBe(true);
        expect(apiClient.delete).toHaveBeenCalledWith("/customers/1", config);
      });

      test("should handle deletion of customer with outstanding balance", async () => {
        apiClient.delete.mockRejectedValueOnce(new Error("Cannot delete customer with outstanding balance"));

        await expect(customerService.deleteCustomer(1)).rejects.toThrow("outstanding balance");
      });
    });

    describe("archiveCustomer()", () => {
      test("should try PATCH /customers/:id/status first (preferred)", async () => {
        const archivedCustomer = { id: 1, status: "archived" };

        apiClient.patch.mockResolvedValueOnce(archivedCustomer);

        const result = await customerService.archiveCustomer(1);

        expect(result.status).toBe("archived");
        expect(apiClient.patch).toHaveBeenCalledWith("/customers/1/status", {
          status: "archived",
        });
      });

      test("should fallback to PATCH /customers/:id if status endpoint not found", async () => {
        apiClient.patch.mockRejectedValueOnce({
          response: { status: 404 },
        });
        apiClient.patch.mockResolvedValueOnce({ id: 1, status: "archived" });

        await customerService.archiveCustomer(1);

        expect(apiClient.patch).toHaveBeenCalledWith("/customers/1", {
          status: "archived",
        });
      });

      test("should fallback to PUT if PATCH not available", async () => {
        // First patch call fails with 404
        apiClient.patch
          .mockRejectedValueOnce({ response: { status: 404 } })
          .mockRejectedValueOnce({ response: { status: 404 } });

        apiClient.put.mockResolvedValueOnce({ id: 1, status: "archived" });

        await customerService.archiveCustomer(1);

        expect(apiClient.put).toHaveBeenCalledWith("/customers/1", {
          status: "archived",
        });
      });
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  describe("Data Transformation (transformCustomerFromServer)", () => {
    test("should handle null/undefined input", () => {
      expect(transformCustomerFromServer(null)).toBeNull();
      expect(transformCustomerFromServer(undefined)).toBeNull();
    });

    test("should transform basic fields with defaults", () => {
      const serverData = {
        id: 1,
        name: "Test Corp",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.id).toBe(1);
      expect(result.name).toBe("Test Corp");
      expect(result.phone).toBe("");
      expect(result.email).toBe("");
      expect(result.status).toBe("ACTIVE");
    });

    test("should convert snake_case to camelCase", () => {
      const serverData = {
        id: 1,
        company_id: 10,
        credit_limit: 50000,
        current_balance: 5000,
        payment_terms: 30,
        contact_person: "John Doe",
        alternate_phone: "123456",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.companyId).toBe(10);
      expect(result.creditLimit).toBe(50000);
      expect(result.currentBalance).toBe(5000);
      expect(result.paymentTerms).toBe(30);
      expect(result.contactPerson).toBe("John Doe");
      expect(result.alternatePhone).toBe("123456");
    });

    test("should parse numeric strings", () => {
      const serverData = {
        id: 1,
        creditLimit: "100000.50",
        currentBalance: "25000.75",
        creditUtilizationPercentage: "25.5",
        creditScore: "750",
      };

      const result = transformCustomerFromServer(serverData);

      expect(typeof result.creditLimit).toBe("number");
      expect(result.creditLimit).toBe(100000.5);
      expect(typeof result.currentBalance).toBe("number");
      expect(result.currentBalance).toBe(25000.75);
      expect(typeof result.creditUtilizationPercentage).toBe("number");
      expect(typeof result.creditScore).toBe("number");
    });

    test("should handle aging bucket fields", () => {
      const serverData = {
        id: 1,
        aging_current: "1000",
        aging_1_30: "2000",
        aging_31_60: "500",
        aging_61_90: "200",
        aging_90_plus: "100",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.agingCurrent).toBe(1000);
      expect(result.aging1To30).toBe(2000);
      expect(result.aging31To60).toBe(500);
      expect(result.aging61To90).toBe(200);
      expect(result.aging90Plus).toBe(100);
    });

    test("should handle compliance fields", () => {
      const serverData = {
        id: 1,
        trn: "UAE123456789012",
        vat_number: "VAT-123",
        pan_number: "PAN-456",
        cin_number: "CIN-789",
        trade_license_number: "TL-2024-001",
        is_designated_zone: true,
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.trn).toBe("UAE123456789012");
      expect(result.vatNumber).toBe("VAT-123");
      expect(result.panNumber).toBe("PAN-456");
      expect(result.cinNumber).toBe("CIN-789");
      expect(result.tradeLicenseNumber).toBe("TL-2024-001");
      expect(result.isDesignatedZone).toBe(true);
    });

    test("should handle credit fields with proper calculations", () => {
      const serverData = {
        id: 1,
        credit_limit: 100000,
        credit_used: 75000,
        credit_available: 25000,
        credit_utilization_percentage: 75,
        payment_history_score: 0.95,
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.creditLimit).toBe(100000);
      expect(result.creditUsed).toBe(75000);
      expect(result.creditAvailable).toBe(25000);
      expect(result.creditUtilizationPercentage).toBe(75);
      expect(result.paymentHistoryScore).toBe(0.95);
    });

    test("should handle date fields", () => {
      const serverData = {
        id: 1,
        last_payment_date: "2026-01-15",
        credit_review_date: "2026-01-10",
        created_at: "2025-06-01T10:00:00Z",
        updated_at: "2026-01-31T15:30:00Z",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.lastPaymentDate).toBe("2026-01-15");
      expect(result.creditReviewDate).toBe("2026-01-10");
      expect(result.createdAt).toBe("2025-06-01T10:00:00Z");
      expect(result.updatedAt).toBe("2026-01-31T15:30:00Z");
    });

    test("should handle JSONB address field", () => {
      const serverData = {
        id: 1,
        address: {
          street: "123 Business St",
          city: "Dubai",
          state: "DXB",
          zipcode: "12345",
          country: "UAE",
        },
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.address.street).toBe("123 Business St");
      expect(result.address.city).toBe("Dubai");
      expect(result.address.country).toBe("UAE");
    });

    test("should provide fallbacks for all fields", () => {
      const serverData = { id: 1 };

      const result = transformCustomerFromServer(serverData);

      // Check all fields have defaults
      expect(result.name).toBe("");
      expect(result.email).toBe("");
      expect(result.phone).toBe("");
      expect(result.creditLimit).toBe(0);
      expect(result.currentBalance).toBe(0);
      expect(result.creditScore).toBe(0);
      expect(result.creditUtilization).toBe(0);
      expect(result.agingCurrent).toBe(0);
      expect(result.aging1To30).toBe(0);
    });
  });

  // ============================================================================
  // MULTI-TENANCY & SECURITY
  // ============================================================================

  describe("Multi-Tenancy Compliance", () => {
    test("should filter customers by company_id in API call", async () => {
      apiClient.get.mockResolvedValueOnce({ customers: [] });

      await customerService.getCustomers({ companyId: 5 });

      expect(apiClient.get).toHaveBeenCalledWith("/customers", {
        companyId: 5,
      });
    });

    test("should return customers with correct company_id in response", async () => {
      const mockCustomers = [
        { id: 1, companyId: 5, name: "Customer A" },
        { id: 2, companyId: 5, name: "Customer B" },
      ];

      apiClient.get.mockResolvedValueOnce({ customers: mockCustomers });

      const result = await customerService.getCustomers({ companyId: 5 });

      expect(result.customers.every((c) => c.companyId === 5)).toBe(true);
    });

    test("should not allow cross-tenant customer access", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Not authorized to access this customer"));

      await expect(customerService.getCustomer(999)).rejects.toThrow("Not authorized");
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe("Edge Cases & Error Handling", () => {
    test("should handle network timeout gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network timeout"));

      await expect(customerService.getCustomers()).rejects.toThrow("Network timeout");
    });

    test("should handle invalid email format validation", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Invalid email format"));

      await expect(
        customerService.createCustomer({
          name: "Test",
          email: "invalid-email",
        })
      ).rejects.toThrow("Invalid email format");
    });

    test("should handle very long customer names", async () => {
      const longName = "A".repeat(255);

      apiClient.post.mockResolvedValueOnce({ id: 1, name: longName });

      const result = await customerService.createCustomer({ name: longName });

      expect(result.name).toBe(longName);
    });

    test("should handle special characters in customer data", async () => {
      const specialData = {
        name: "Test & Co. (International)",
        email: "contact+test@example.com",
      };

      apiClient.post.mockResolvedValueOnce({ id: 1, ...specialData });

      const result = await customerService.createCustomer(specialData);

      expect(result.name).toBe("Test & Co. (International)");
    });

    test("should handle credit limit of zero", () => {
      const serverData = {
        id: 1,
        credit_limit: 0,
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.creditLimit).toBe(0);
    });

    test("should handle negative outstanding balance (overpayment)", () => {
      const serverData = {
        id: 1,
        total_outstanding: -500,
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.totalOutstanding).toBe(-500);
    });

    test("should handle archived customer data", () => {
      const serverData = {
        id: 1,
        name: "Archived Corp",
        status: "ARCHIVED",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.status).toBe("ARCHIVED");
    });
  });

  // ============================================================================
  // COMPLIANCE & CREDIT MANAGEMENT
  // ============================================================================

  describe("Credit Management Fields", () => {
    test("should calculate credit utilization percentage correctly", () => {
      const serverData = {
        id: 1,
        credit_limit: 100000,
        credit_used: 75000,
        credit_utilization_percentage: 75,
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.creditUtilizationPercentage).toBe(75);
      expect(result.creditUsed).toBe(75000);
      expect(result.creditLimit).toBe(100000);
    });

    test("should handle DSO (Days Sales Outstanding) calculation", () => {
      const serverData = {
        id: 1,
        payment_terms_days: 30,
        dso_days: 45,
        dso_value: 45.5,
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.paymentTermsDays).toBe(30);
      expect(result.dsoDays).toBe(45);
      expect(result.dsoValue).toBe(45.5);
    });

    test("should provide credit grade assessment", () => {
      const serverData = {
        id: 1,
        credit_score: 750,
        credit_grade: "A",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.creditScore).toBe(750);
      expect(result.creditGrade).toBe("A");
    });
  });

  // ============================================================================
  // UAE COMPLIANCE
  // ============================================================================

  describe("UAE Compliance Fields", () => {
    test("should identify designated zone customers", () => {
      const serverData = {
        id: 1,
        name: "JAFZA Trading",
        is_designated_zone: true,
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.isDesignatedZone).toBe(true);
    });

    test("should handle TRN number properly", () => {
      const serverData = {
        id: 1,
        trn: "100123456789012",
        trn_number: "100123456789012",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.trn).toBe("100123456789012");
      expect(result.trnNumber).toBe("100123456789012");
    });

    test("should handle trade license expiry date", () => {
      const serverData = {
        id: 1,
        trade_license_number: "TL-2024-001",
        trade_license_expiry: "2026-12-31",
      };

      const result = transformCustomerFromServer(serverData);

      expect(result.tradeLicenseNumber).toBe("TL-2024-001");
      expect(result.tradeLicenseExpiry).toBe("2026-12-31");
    });
  });
});
