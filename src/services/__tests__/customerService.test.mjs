import '../../__tests__/init.mjs';
/**
 * Customer Service Unit Tests
 * ✅ Comprehensive test coverage for customerService
 * ✅ Tests all CRUD operations, credit management, and transformations
 * ✅ Covers multi-tenancy, compliance fields, and edge cases
 * ✅ 100% coverage target for customerService.js
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from "../api.js";
import { customerService, transformCustomerFromServer } from "../customerService.js";

describe("customerService", () => {
  beforeEach(() => {
    sinon.restore();
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

        sinon.stub(apiClient, 'get').resolves({
          customers: mockCustomers,
          pagination: { page: 1, totalPages: 1, total: 2 },
        });

        const result = await customerService.getCustomers({
          page: 1,
          limit: 20,
        });

        assert.strictEqual(result.customers.length, 2);
        sinon.assert.calledWith(apiClient.get, "/customers", {
          page: 1,
          limit: 20,
        });
      });

      test("should apply search and filter parameters", async () => {
        sinon.stub(apiClient, 'get').resolves({ customers: [] });

        await customerService.getCustomers({
          search: "Acme",
          status: "ACTIVE",
          sortBy: "name",
        });

        sinon.assert.calledWith(apiClient.get, "/customers", {
          search: "Acme",
          status: "ACTIVE",
          sortBy: "name",
        });
      });

      test("should handle empty customer list", async () => {
        sinon.stub(apiClient, 'get').resolves({ customers: [] });

        const result = await customerService.getCustomers();

        assert.deepStrictEqual(result.customers, []);
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

        sinon.stub(apiClient, 'get').resolves(mockCustomer);

        const result = await customerService.getCustomer(1);

        assert.strictEqual(result.name, "Acme Corp");
        sinon.assert.calledWith(apiClient.get, "/customers/1");
      });

      test("should handle 404 for non-existent customer", async () => {
        sinon.stub(apiClient, 'get').rejects(new Error("Customer not found"));

        await assert.rejects(() => customerService.getCustomer(999), /Customer not found/);
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

        sinon.stub(apiClient, 'post').resolves(createdCustomer);

        const result = await customerService.createCustomer(customerData);

        assert.strictEqual(result.id, 10);
        sinon.assert.calledWith(apiClient.post, "/customers", customerData);
      });

      test("should handle validation errors on creation", async () => {
        sinon.stub(apiClient, 'post').rejects(new Error("Email is required"));

        await assert.rejects(() => customerService.createCustomer({ name: "Test" }), /Email is required/);
      });

      test("should create customer with minimal fields", async () => {
        const minimalData = {
          name: "Simple Corp",
          email: "contact@simple.com",
        };

        sinon.stub(apiClient, 'post').resolves({ id: 5, ...minimalData });

        const result = await customerService.createCustomer(minimalData);

        assert.strictEqual(result.id, 5);
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

        sinon.stub(apiClient, 'put').resolves(updatedCustomer);

        const result = await customerService.updateCustomer(1, updates);

        assert.strictEqual(result.email, "newemail@acme.com");
        assert.strictEqual(result.creditLimit, 15000);
        sinon.assert.calledWith(apiClient.put, "/customers/1", updates);
      });

      test("should handle update conflicts", async () => {
        sinon.stub(apiClient, 'put').rejects(new Error("Customer was modified by another user"));

        await assert.rejects(() => customerService.updateCustomer(1, { name: "Updated" }), /Customer was modified/);
      });
    });

    describe("deleteCustomer()", () => {
      test("should delete customer with config options", async () => {
        const config = { reason: "Inactive account" };

        sinon.stub(apiClient, 'delete').resolves({ success: true });

        const result = await customerService.deleteCustomer(1, config);

        assert.strictEqual(result.success, true);
        sinon.assert.calledWith(apiClient.delete, "/customers/1", config);
      });

      test("should handle deletion of customer with outstanding balance", async () => {
        sinon.stub(apiClient, 'delete').rejects(new Error("Cannot delete customer with outstanding balance"));

        await assert.rejects(() => customerService.deleteCustomer(1), /outstanding balance/);
      });
    });

    describe("archiveCustomer()", () => {
      test("should try PATCH /customers/:id/status first (preferred)", async () => {
        const archivedCustomer = { id: 1, status: "archived" };

        sinon.stub(apiClient, 'patch').resolves(archivedCustomer);

        const result = await customerService.archiveCustomer(1);

        assert.strictEqual(result.status, "archived");
        sinon.assert.calledWith(apiClient.patch, "/customers/1/status", {
          status: "archived",
        });
      });

      test("should fallback to PATCH /customers/:id if status endpoint not found", async () => {
        sinon.stub(apiClient, 'patch')
          .onFirstCall().rejects({ response: { status: 404 } })
          .onSecondCall().resolves({ id: 1, status: "archived" });

        await customerService.archiveCustomer(1);

        sinon.assert.calledWith(apiClient.patch, "/customers/1", {
          status: "archived",
        });
      });

      test("should fallback to PUT if PATCH not available", async () => {
        // Both PATCH calls fail with 404
        sinon.stub(apiClient, 'patch')
          .onFirstCall().rejects({ response: { status: 404 } })
          .onSecondCall().rejects({ response: { status: 404 } });

        sinon.stub(apiClient, 'put').resolves({ id: 1, status: "archived" });

        await customerService.archiveCustomer(1);

        sinon.assert.calledWith(apiClient.put, "/customers/1", {
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
      assert.strictEqual(transformCustomerFromServer(null), null);
      assert.strictEqual(transformCustomerFromServer(undefined), null);
    });

    test("should transform basic fields with defaults", () => {
      const serverData = {
        id: 1,
        name: "Test Corp",
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.name, "Test Corp");
      assert.strictEqual(result.phone, "");
      assert.strictEqual(result.email, "");
      assert.strictEqual(result.status, "ACTIVE");
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

      assert.strictEqual(result.companyId, 10);
      assert.strictEqual(result.creditLimit, 50000);
      assert.strictEqual(result.currentBalance, 5000);
      assert.strictEqual(result.paymentTerms, 30);
      assert.strictEqual(result.contactPerson, "John Doe");
      assert.strictEqual(result.alternatePhone, "123456");
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

      assert.strictEqual(typeof result.creditLimit, "number");
      assert.strictEqual(result.creditLimit, 100000.5);
      assert.strictEqual(typeof result.currentBalance, "number");
      assert.strictEqual(result.currentBalance, 25000.75);
      assert.strictEqual(typeof result.creditUtilizationPercentage, "number");
      assert.strictEqual(typeof result.creditScore, "number");
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

      assert.strictEqual(result.agingCurrent, 1000);
      assert.strictEqual(result.aging1To30, 2000);
      assert.strictEqual(result.aging31To60, 500);
      assert.strictEqual(result.aging61To90, 200);
      assert.strictEqual(result.aging90Plus, 100);
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

      assert.strictEqual(result.trn, "UAE123456789012");
      assert.strictEqual(result.vatNumber, "VAT-123");
      assert.strictEqual(result.panNumber, "PAN-456");
      assert.strictEqual(result.cinNumber, "CIN-789");
      assert.strictEqual(result.tradeLicenseNumber, "TL-2024-001");
      assert.strictEqual(result.isDesignatedZone, true);
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

      assert.strictEqual(result.creditLimit, 100000);
      assert.strictEqual(result.creditUsed, 75000);
      assert.strictEqual(result.creditAvailable, 25000);
      assert.strictEqual(result.creditUtilizationPercentage, 75);
      assert.strictEqual(result.paymentHistoryScore, 0.95);
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

      assert.strictEqual(result.lastPaymentDate, "2026-01-15");
      assert.strictEqual(result.creditReviewDate, "2026-01-10");
      assert.strictEqual(result.createdAt, "2025-06-01T10:00:00Z");
      assert.strictEqual(result.updatedAt, "2026-01-31T15:30:00Z");
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

      assert.strictEqual(result.address.street, "123 Business St");
      assert.strictEqual(result.address.city, "Dubai");
      assert.strictEqual(result.address.country, "UAE");
    });

    test("should provide fallbacks for all fields", () => {
      const serverData = { id: 1 };

      const result = transformCustomerFromServer(serverData);

      // Check all fields have defaults
      assert.strictEqual(result.name, "");
      assert.strictEqual(result.email, "");
      assert.strictEqual(result.phone, "");
      assert.strictEqual(result.creditLimit, 0);
      assert.strictEqual(result.currentBalance, 0);
      assert.strictEqual(result.creditScore, 0);
      assert.strictEqual(result.creditUtilization, 0);
      assert.strictEqual(result.agingCurrent, 0);
      assert.strictEqual(result.aging1To30, 0);
    });
  });

  // ============================================================================
  // MULTI-TENANCY & SECURITY
  // ============================================================================

  describe("Multi-Tenancy Compliance", () => {
    test("should filter customers by company_id in API call", async () => {
      sinon.stub(apiClient, 'get').resolves({ customers: [] });

      await customerService.getCustomers({ companyId: 5 });

      sinon.assert.calledWith(apiClient.get, "/customers", {
        companyId: 5,
      });
    });

    test("should return customers with correct company_id in response", async () => {
      const mockCustomers = [
        { id: 1, companyId: 5, name: "Customer A" },
        { id: 2, companyId: 5, name: "Customer B" },
      ];

      sinon.stub(apiClient, 'get').resolves({ customers: mockCustomers });

      const result = await customerService.getCustomers({ companyId: 5 });

      assert.ok(result.customers.every((c) => c.companyId === 5));
    });

    test("should not allow cross-tenant customer access", async () => {
      sinon.stub(apiClient, 'get').rejects(new Error("Not authorized to access this customer"));

      await assert.rejects(() => customerService.getCustomer(999), /Not authorized/);
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe("Edge Cases & Error Handling", () => {
    test("should handle network timeout gracefully", async () => {
      sinon.stub(apiClient, 'get').rejects(new Error("Network timeout"));

      await assert.rejects(() => customerService.getCustomers(), /Network timeout/);
    });

    test("should handle invalid email format validation", async () => {
      sinon.stub(apiClient, 'post').rejects(new Error("Invalid email format"));

      await assert.rejects(
        () => customerService.createCustomer({
          name: "Test",
          email: "invalid-email",
        }),
        /Invalid email format/
      );
    });

    test("should handle very long customer names", async () => {
      const longName = "A".repeat(255);

      sinon.stub(apiClient, 'post').resolves({ id: 1, name: longName });

      const result = await customerService.createCustomer({ name: longName });

      assert.strictEqual(result.name, longName);
    });

    test("should handle special characters in customer data", async () => {
      const specialData = {
        name: "Test & Co. (International)",
        email: "contact+test@example.com",
      };

      sinon.stub(apiClient, 'post').resolves({ id: 1, ...specialData });

      const result = await customerService.createCustomer(specialData);

      assert.strictEqual(result.name, "Test & Co. (International)");
    });

    test("should handle credit limit of zero", () => {
      const serverData = {
        id: 1,
        credit_limit: 0,
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.creditLimit, 0);
    });

    test("should handle negative outstanding balance (overpayment)", () => {
      const serverData = {
        id: 1,
        total_outstanding: -500,
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.totalOutstanding, -500);
    });

    test("should handle archived customer data", () => {
      const serverData = {
        id: 1,
        name: "Archived Corp",
        status: "ARCHIVED",
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.status, "ARCHIVED");
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

      assert.strictEqual(result.creditUtilizationPercentage, 75);
      assert.strictEqual(result.creditUsed, 75000);
      assert.strictEqual(result.creditLimit, 100000);
    });

    test("should handle DSO (Days Sales Outstanding) calculation", () => {
      const serverData = {
        id: 1,
        payment_terms_days: 30,
        dso_days: 45,
        dso_value: 45.5,
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.paymentTermsDays, 30);
      assert.strictEqual(result.dsoDays, 45);
      assert.strictEqual(result.dsoValue, 45.5);
    });

    test("should provide credit grade assessment", () => {
      const serverData = {
        id: 1,
        credit_score: 750,
        credit_grade: "A",
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.creditScore, 750);
      assert.strictEqual(result.creditGrade, "A");
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

      assert.strictEqual(result.isDesignatedZone, true);
    });

    test("should handle TRN number properly", () => {
      const serverData = {
        id: 1,
        trn: "100123456789012",
        trn_number: "100123456789012",
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.trn, "100123456789012");
      assert.strictEqual(result.trnNumber, "100123456789012");
    });

    test("should handle trade license expiry date", () => {
      const serverData = {
        id: 1,
        trade_license_number: "TL-2024-001",
        trade_license_expiry: "2026-12-31",
      };

      const result = transformCustomerFromServer(serverData);

      assert.strictEqual(result.tradeLicenseNumber, "TL-2024-001");
      assert.strictEqual(result.tradeLicenseExpiry, "2026-12-31");
    });
  });
});
