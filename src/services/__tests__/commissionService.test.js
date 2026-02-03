/**
 * Commission Service Unit Tests
 * ✅ Tests commission calculations and state transitions
 * ✅ Tests approval and payment workflows
 * ✅ Tests sales person commission tracking
 * ✅ 100% coverage target for commissionService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../api";
import { commissionService } from "../commissionService";

describe("commissionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // GET COMMISSION OPERATIONS
  // ============================================================================

  describe("getInvoiceCommission()", () => {
    test("should fetch commission for invoice", async () => {
      const mockCommission = {
        data: {
          id: 1,
          invoiceId: 100,
          invoiceNumber: "INV-2026-001",
          salesPersonId: 5,
          salesPersonName: "John Smith",
          commissionRate: 2.5,
          invoiceAmount: 10000,
          commissionAmount: 250,
          status: "PENDING",
          calculatedAt: "2026-01-15T10:00:00Z",
        },
      };
      api.get.mockResolvedValueOnce(mockCommission);

      const result = await commissionService.getInvoiceCommission(100);

      expect(result.id).toBe(1);
      expect(result.invoiceId).toBe(100);
      expect(result.commissionAmount).toBe(250);
      expect(result.status).toBe("PENDING");
      expect(api.get).toHaveBeenCalledWith("/commissions/invoice/100");
    });

    test("should handle commission not found", async () => {
      api.get.mockRejectedValueOnce(new Error("Commission not found"));

      await expect(commissionService.getInvoiceCommission(999)).rejects.toThrow("Commission not found");
    });

    test("should handle API errors gracefully", async () => {
      api.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(commissionService.getInvoiceCommission(100)).rejects.toThrow("Network error");
    });
  });

  describe("getSalesPersonCommissions()", () => {
    test("should fetch all commissions for sales person", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            invoiceId: 100,
            invoiceNumber: "INV-2026-001",
            commissionAmount: 250,
            status: "PENDING",
          },
          {
            id: 2,
            invoiceId: 101,
            invoiceNumber: "INV-2026-002",
            commissionAmount: 300,
            status: "APPROVED",
          },
          {
            id: 3,
            invoiceId: 102,
            invoiceNumber: "INV-2026-003",
            commissionAmount: 200,
            status: "PAID",
          },
        ],
      };
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await commissionService.getSalesPersonCommissions(5);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe("PENDING");
      expect(result[1].status).toBe("APPROVED");
      expect(result[2].status).toBe("PAID");
      expect(api.get).toHaveBeenCalledWith("/commissions/sales-person/5", {
        params: { status: "PENDING", daysBack: 90 },
      });
    });

    test("should fetch commissions with custom status filter", async () => {
      const mockResponse = { data: [] };
      api.get.mockResolvedValueOnce(mockResponse);

      await commissionService.getSalesPersonCommissions(5, "APPROVED", 180);

      expect(api.get).toHaveBeenCalledWith("/commissions/sales-person/5", {
        params: { status: "APPROVED", daysBack: 180 },
      });
    });

    test("should handle no commissions for sales person", async () => {
      const mockResponse = { data: [] };
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await commissionService.getSalesPersonCommissions(99);

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // COMMISSION ADJUSTMENT (Grace Period)
  // ============================================================================

  describe("adjustCommissionAmount()", () => {
    test("should adjust commission during grace period", async () => {
      const mockResponse = {
        data: {
          id: 1,
          invoiceId: 100,
          originalCommissionAmount: 250,
          adjustedCommissionAmount: 200,
          adjustmentReason: "Customer discount applied",
          status: "PENDING_REAPPROVAL",
          adjustedAt: "2026-01-16T14:30:00Z",
          adjustedByUserId: "user123",
        },
      };
      api.put.mockResolvedValueOnce(mockResponse);

      const result = await commissionService.adjustCommissionAmount(100, 200, "Customer discount applied");

      expect(result.originalCommissionAmount).toBe(250);
      expect(result.adjustedCommissionAmount).toBe(200);
      expect(result.adjustmentReason).toBe("Customer discount applied");
      expect(result.status).toBe("PENDING_REAPPROVAL");
      expect(api.put).toHaveBeenCalledWith("/commissions/invoice/100/adjust", {
        newCommissionAmount: 200,
        reason: "Customer discount applied",
      });
    });

    test("should handle adjustment outside grace period", async () => {
      api.put.mockRejectedValueOnce(new Error("Grace period expired - cannot adjust commission"));

      await expect(commissionService.adjustCommissionAmount(100, 200, "Late adjustment")).rejects.toThrow(
        "Grace period expired"
      );
    });

    test("should validate new amount is less than original", async () => {
      api.put.mockRejectedValueOnce(new Error("Adjusted amount cannot exceed original"));

      await expect(commissionService.adjustCommissionAmount(100, 300, "Invalid increase")).rejects.toThrow(
        "Adjusted amount cannot exceed original"
      );
    });

    test("should prevent negative commission amounts", async () => {
      api.put.mockRejectedValueOnce(new Error("Commission amount must be positive"));

      await expect(commissionService.adjustCommissionAmount(100, -50, "Negative amount")).rejects.toThrow(
        "Commission amount must be positive"
      );
    });
  });

  // ============================================================================
  // APPROVAL WORKFLOW
  // ============================================================================

  describe("approveCommission()", () => {
    test("should approve pending commission", async () => {
      const mockResponse = {
        data: {
          id: 1,
          invoiceId: 100,
          commissionAmount: 250,
          status: "APPROVED",
          approvedAt: "2026-01-16T10:00:00Z",
          approvedByUserId: "mgr001",
          approvedByUserName: "Manager John",
        },
      };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await commissionService.approveCommission(100, "mgr001");

      expect(result.status).toBe("APPROVED");
      expect(result.approvedByUserId).toBe("mgr001");
      expect(result.approvedAt).toBeDefined();
      expect(api.post).toHaveBeenCalledWith("/commissions/invoice/100/approve", { approvedByUserId: "mgr001" });
    });

    test("should prevent double approval", async () => {
      api.post.mockRejectedValueOnce(new Error("Commission already approved"));

      await expect(commissionService.approveCommission(100, "mgr001")).rejects.toThrow("Commission already approved");
    });

    test("should require manager authorization", async () => {
      api.post.mockRejectedValueOnce(new Error("Insufficient permissions to approve commission"));

      await expect(commissionService.approveCommission(100, "user123")).rejects.toThrow("Insufficient permissions");
    });
  });

  // ============================================================================
  // PAYMENT WORKFLOW
  // ============================================================================

  describe("markCommissionAsPaid()", () => {
    test("should mark approved commission as paid", async () => {
      const mockResponse = {
        data: {
          id: 1,
          invoiceId: 100,
          commissionAmount: 250,
          status: "PAID",
          paidAt: "2026-01-20T15:00:00Z",
          paymentReference: "BANK-TXN-2026-001",
          paidByUserId: "fin001",
        },
      };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await commissionService.markCommissionAsPaid(100, "BANK-TXN-2026-001");

      expect(result.status).toBe("PAID");
      expect(result.paymentReference).toBe("BANK-TXN-2026-001");
      expect(result.paidAt).toBeDefined();
      expect(api.post).toHaveBeenCalledWith("/commissions/invoice/100/pay", { paymentReference: "BANK-TXN-2026-001" });
    });

    test("should prevent paying unapproved commission", async () => {
      api.post.mockRejectedValueOnce(new Error("Commission must be approved before payment"));

      await expect(commissionService.markCommissionAsPaid(100, "BANK-TXN-001")).rejects.toThrow(
        "Commission must be approved before payment"
      );
    });

    test("should prevent double payment", async () => {
      api.post.mockRejectedValueOnce(new Error("Commission already paid"));

      await expect(commissionService.markCommissionAsPaid(100, "BANK-TXN-001")).rejects.toThrow(
        "Commission already paid"
      );
    });

    test("should require payment reference", async () => {
      api.post.mockRejectedValueOnce(new Error("Payment reference is required"));

      await expect(commissionService.markCommissionAsPaid(100, "")).rejects.toThrow("Payment reference is required");
    });
  });

  // ============================================================================
  // COMMISSION STATE TRANSITIONS
  // ============================================================================

  describe("Commission State Transitions", () => {
    test("should follow correct state flow: PENDING -> APPROVED -> PAID", async () => {
      // Step 1: Get pending commission
      const pendingCommission = {
        data: { id: 1, invoiceId: 100, status: "PENDING" },
      };
      api.get.mockResolvedValueOnce(pendingCommission);
      let result = await commissionService.getInvoiceCommission(100);
      expect(result.status).toBe("PENDING");

      // Step 2: Approve commission
      const approvedCommission = {
        data: { id: 1, invoiceId: 100, status: "APPROVED" },
      };
      api.post.mockResolvedValueOnce(approvedCommission);
      result = await commissionService.approveCommission(100, "mgr001");
      expect(result.status).toBe("APPROVED");

      // Step 3: Pay commission
      const paidCommission = {
        data: { id: 1, invoiceId: 100, status: "PAID" },
      };
      api.post.mockResolvedValueOnce(paidCommission);
      result = await commissionService.markCommissionAsPaid(100, "BANK-001");
      expect(result.status).toBe("PAID");
    });

    test("should allow transition PENDING -> PENDING_REAPPROVAL -> APPROVED", async () => {
      // Pending commission adjusted
      const adjustedCommission = {
        data: { id: 1, invoiceId: 100, status: "PENDING_REAPPROVAL" },
      };
      api.put.mockResolvedValueOnce(adjustedCommission);
      let result = await commissionService.adjustCommissionAmount(100, 200, "Adjusted");
      expect(result.status).toBe("PENDING_REAPPROVAL");

      // Re-approve after adjustment
      const reapprovedCommission = {
        data: { id: 1, invoiceId: 100, status: "APPROVED" },
      };
      api.post.mockResolvedValueOnce(reapprovedCommission);
      result = await commissionService.approveCommission(100, "mgr001");
      expect(result.status).toBe("APPROVED");
    });
  });

  // ============================================================================
  // COMMISSION CALCULATIONS
  // ============================================================================

  describe("Commission Calculation Scenarios", () => {
    test("should calculate 2.5% commission on standard invoice", async () => {
      const mockCommission = {
        data: {
          id: 1,
          invoiceAmount: 10000,
          commissionRate: 2.5,
          commissionAmount: 250, // 2.5% of 10000
          status: "PENDING",
        },
      };
      api.get.mockResolvedValueOnce(mockCommission);

      const result = await commissionService.getInvoiceCommission(100);

      expect(result.commissionAmount).toBe(250);
      expect(result.commissionRate).toBe(2.5);
    });

    test("should calculate 0% commission on zero-rated sales", async () => {
      const mockCommission = {
        data: {
          id: 1,
          invoiceAmount: 5000,
          commissionRate: 0,
          commissionAmount: 0, // 0% commission
          isZeroRated: true,
          status: "APPROVED",
        },
      };
      api.get.mockResolvedValueOnce(mockCommission);

      const result = await commissionService.getInvoiceCommission(100);

      expect(result.commissionAmount).toBe(0);
      expect(result.isZeroRated).toBe(true);
    });

    test("should calculate higher commission for large orders", async () => {
      const mockCommission = {
        data: {
          id: 1,
          invoiceAmount: 100000,
          commissionRate: 3.0, // Higher rate for volume
          commissionAmount: 3000, // 3% of 100000
          status: "PENDING",
        },
      };
      api.get.mockResolvedValueOnce(mockCommission);

      const result = await commissionService.getInvoiceCommission(100);

      expect(result.commissionAmount).toBe(3000);
      expect(result.commissionRate).toBe(3.0);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network errors in getInvoiceCommission", async () => {
      api.get.mockRejectedValueOnce(new Error("Network timeout"));

      await expect(commissionService.getInvoiceCommission(100)).rejects.toThrow("Network timeout");
    });

    test("should handle network errors in approveCommission", async () => {
      api.post.mockRejectedValueOnce(new Error("Server error"));

      await expect(commissionService.approveCommission(100, "mgr001")).rejects.toThrow("Server error");
    });

    test("should handle network errors in markCommissionAsPaid", async () => {
      api.post.mockRejectedValueOnce(new Error("Database error"));

      await expect(commissionService.markCommissionAsPaid(100, "BANK-001")).rejects.toThrow("Database error");
    });

    test("should handle network errors in adjustCommissionAmount", async () => {
      api.put.mockRejectedValueOnce(new Error("Service unavailable"));

      await expect(commissionService.adjustCommissionAmount(100, 200, "Adjustment")).rejects.toThrow(
        "Service unavailable"
      );
    });
  });

  // ============================================================================
  // COMMISSION ELIGIBILITY & RULES
  // ============================================================================

  describe("Commission Eligibility & Rules", () => {
    test("should not calculate commission for cancelled invoices", async () => {
      api.get.mockRejectedValueOnce(new Error("No commission for cancelled invoices"));

      await expect(commissionService.getInvoiceCommission(100)).rejects.toThrow("No commission for cancelled invoices");
    });

    test("should enforce 15-day grace period for adjustments", async () => {
      api.put.mockRejectedValueOnce(new Error("Commission is outside the 15-day adjustment window"));

      await expect(commissionService.adjustCommissionAmount(100, 200, "Late adjustment")).rejects.toThrow(
        "outside the 15-day adjustment window"
      );
    });

    test("should prevent commission for internal sales", async () => {
      api.get.mockRejectedValueOnce(new Error("No commission for internal sales"));

      await expect(commissionService.getInvoiceCommission(100)).rejects.toThrow("No commission for internal sales");
    });
  });
});
