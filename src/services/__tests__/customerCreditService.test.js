/**
 * Customer Credit Service Unit Tests (Node Native Test Runner)
 * Tests credit risk assessment and monitoring
 * Tests credit limit management and DSO calculations
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import api from "../api.js";
import { customerCreditService } from "../customerCreditService.js";

describe("customerCreditService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getHighRiskCustomers", () => {
    it("should fetch high-risk customers", async () => {
      const mockHighRisk = [
        { id: 101, name: "Risky Corp", creditGrade: "D", dso: 85 },
        { id: 102, name: "Danger Ltd", creditGrade: "E", dso: 120 },
      ];
      vi.spyOn(api, "get").mockResolvedValue(mockHighRisk);

      const result = await customerCreditService.getHighRiskCustomers(50);

      expect(result.length).toBe(2);
      expect(result[0].creditGrade).toBe("D");
      expect(api.get).toHaveBeenCalledWith("/customers/credit-risk/high", {
        params: { limit: 50 },
      });
    });

    it("should use default limit of 50", async () => {
      vi.spyOn(api, "get").mockResolvedValue([]);

      await customerCreditService.getHighRiskCustomers();

      expect(api.get).toHaveBeenCalledWith("/customers/credit-risk/high", {
        params: { limit: 50 },
      });
    });
  });

  describe("getOverLimitCustomers", () => {
    it("should identify customers over credit limit", async () => {
      const mockOverLimit = [
        {
          id: 101,
          name: "Over Limit Inc",
          creditLimit: 100000,
          totalOutstanding: 125000,
        },
      ];
      vi.spyOn(api, "get").mockResolvedValue(mockOverLimit);

      const result = await customerCreditService.getOverLimitCustomers();

      expect(result.length).toBe(1);
      expect(result[0].totalOutstanding > result[0].creditLimit).toBeTruthy();
      expect(api.get).toHaveBeenCalledWith("/customers/credit-risk/over-limit");
    });
  });

  describe("getCustomerCreditSummary", () => {
    it("should fetch detailed credit summary", async () => {
      const mockSummary = {
        customerId: 101,
        customerName: "Premium Corp",
        creditLimit: 500000,
        creditUtilization: 350000,
        utilizationPercent: 70,
        creditGrade: "A",
        dso: 35,
      };
      vi.spyOn(api, "get").mockResolvedValue(mockSummary);

      const result = await customerCreditService.getCustomerCreditSummary(101);

      expect(result.creditGrade).toBe("A");
      expect(result.utilizationPercent).toBe(70);
      expect(api.get).toHaveBeenCalledWith("/customers/101/credit-summary");
    });

    it("should handle customer not found", async () => {
      vi.spyOn(api, "get").mockRejectedValue(new Error("Customer not found"));

      try {
        await customerCreditService.getCustomerCreditSummary(999);
        throw new Error("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toBe("Customer not found");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      vi.spyOn(api, "get").mockRejectedValue(new Error("Network error"));

      try {
        await customerCreditService.getHighRiskCustomers();
        throw new Error("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });

    it("should handle API errors for over-limit customers", async () => {
      vi.spyOn(api, "get").mockRejectedValue(new Error("API Error"));

      try {
        await customerCreditService.getOverLimitCustomers();
        throw new Error("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toBe("API Error");
      }
    });
  });
});
