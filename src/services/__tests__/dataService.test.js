import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invoiceService,
  customerService,
  productService,
  companyService,
  deliveryNoteService,
  accountStatementService,
  payablesService,
  purchaseOrderService,
  quotationService,
  transitService,
} from "../dataService.js";

describe("dataService - Export Consolidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Service Exports", () => {
    it("should export invoiceService", () => {
      expect(invoiceService).toBeDefined();
      expect(typeof invoiceService).toBe("object");
    });

    it("should export customerService", () => {
      expect(customerService).toBeDefined();
      expect(typeof customerService).toBe("object");
    });

    it("should export productService", () => {
      expect(productService).toBeDefined();
      expect(typeof productService).toBe("object");
    });

    it("should export companyService", () => {
      expect(companyService).toBeDefined();
      expect(typeof companyService).toBe("object");
    });

    it("should export deliveryNoteService", () => {
      expect(deliveryNoteService).toBeDefined();
      expect(typeof deliveryNoteService).toBe("object");
    });

    it("should export accountStatementService", () => {
      expect(accountStatementService).toBeDefined();
      expect(typeof accountStatementService).toBe("object");
    });

    it("should export payablesService", () => {
      expect(payablesService).toBeDefined();
      expect(typeof payablesService).toBe("object");
    });

    it("should export purchaseOrderService", () => {
      expect(purchaseOrderService).toBeDefined();
      expect(typeof purchaseOrderService).toBe("object");
    });

    it("should export quotationService", () => {
      expect(quotationService).toBeDefined();
      expect(typeof quotationService).toBe("object");
    });

    it("should export transitService", () => {
      expect(transitService).toBeDefined();
      expect(typeof transitService).toBe("object");
    });
  });

  describe("Service Interface Consistency", () => {
    it("invoiceService should have expected methods", () => {
      const expectedMethods = [
        "getInvoices",
        "getInvoice",
        "createInvoice",
        "updateInvoice",
      ];
      expectedMethods.forEach((method) => {
        expect(typeof invoiceService[method]).toBe("function");
      });
    });

    it("customerService should have expected methods", () => {
      const expectedMethods = [
        "getCustomers",
        "getCustomer",
        "createCustomer",
        "updateCustomer",
      ];
      expectedMethods.forEach((method) => {
        expect(typeof customerService[method]).toBe("function");
      });
    });

    it("productService should have expected methods", () => {
      const expectedMethods = [
        "getProducts",
        "getProduct",
        "createProduct",
        "updateProduct",
      ];
      expectedMethods.forEach((method) => {
        expect(typeof productService[method]).toBe("function");
      });
    });
  });

  describe("Service Consolidation Purpose", () => {
    it("should provide single import point for multiple services", () => {
      // Verify that importing from dataService is equivalent to importing from individual services
      const allServices = {
        invoiceService,
        customerService,
        productService,
        companyService,
        deliveryNoteService,
        accountStatementService,
        payablesService,
        purchaseOrderService,
        quotationService,
        transitService,
      };

      expect(Object.keys(allServices).length).toBe(10);
      Object.values(allServices).forEach((service) => {
        expect(service).toBeDefined();
        expect(typeof service).toBe("object");
      });
    });
  });
});
