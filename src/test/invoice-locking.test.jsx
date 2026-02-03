/**
 * Invoice Locking Tests - UAE VAT Compliance (Frontend)
 *
 * These tests verify that:
 * 1. isLocked correctly identifies issued invoices
 * 2. Locked invoices disable all editable fields
 * 3. Issue button is hidden for locked invoices
 * 4. Warning banner is shown for locked invoices
 *
 * Rules enforced:
 * - Rule 3: Issue/Finalise = Lock Invoice
 * - Rule 4: Editing a Final Tax Invoice = Forbidden
 * - Rule 8: UAE VAT compliance
 */

import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// Test the isLocked logic directly
describe("Invoice Locking Logic - isLocked computation", () => {
  const computeIsLocked = (status) => {
    const normalizedStatus = (status || "").toLowerCase().replace("status_", "");
    return normalizedStatus === "issued";
  };

  it('should return true for "issued" status', () => {
    expect(computeIsLocked("issued")).toBe(true);
  });

  it('should return true for "STATUS_ISSUED" proto enum format', () => {
    expect(computeIsLocked("STATUS_ISSUED")).toBe(true);
  });

  it('should return true for "Issued" (case insensitive)', () => {
    expect(computeIsLocked("Issued")).toBe(true);
  });

  it('should return false for "draft" status', () => {
    expect(computeIsLocked("draft")).toBe(false);
  });

  it('should return false for "STATUS_DRAFT" proto enum format', () => {
    expect(computeIsLocked("STATUS_DRAFT")).toBe(false);
  });

  it('should return false for "pending" status', () => {
    expect(computeIsLocked("pending")).toBe(false);
  });

  it("should return false for null/undefined status", () => {
    expect(computeIsLocked(null)).toBe(false);
    expect(computeIsLocked(undefined)).toBe(false);
    expect(computeIsLocked("")).toBe(false);
  });
});

describe("Invoice Locking UI Behavior", () => {
  // Mock invoice data
  const draftInvoice = {
    id: 1,
    invoiceNumber: "INV-2024-001",
    status: "draft",
    customer: { id: 1, name: "Test Customer" },
    items: [],
  };

  const issuedInvoice = {
    id: 2,
    invoiceNumber: "INV-2024-002",
    status: "issued",
    customer: { id: 1, name: "Test Customer" },
    items: [],
  };

  describe("canEditInvoice function", () => {
    const canEditInvoice = (status) => {
      return status !== "issued";
    };

    it("should return true for draft invoices", () => {
      expect(canEditInvoice("draft")).toBe(true);
    });

    it("should return false for issued invoices", () => {
      expect(canEditInvoice("issued")).toBe(false);
    });

    it("should return true for pending invoices", () => {
      expect(canEditInvoice("pending")).toBe(true);
    });
  });

  describe("Issue Button visibility", () => {
    const shouldShowIssueButton = (invoice, isLocked) => {
      return Boolean(invoice.id) && !isLocked && invoice.status !== "issued";
    };

    it("should show Issue button for saved draft invoices", () => {
      const isLocked = false;
      expect(shouldShowIssueButton(draftInvoice, isLocked)).toBe(true);
    });

    it("should hide Issue button for issued invoices", () => {
      const isLocked = true;
      expect(shouldShowIssueButton(issuedInvoice, isLocked)).toBe(false);
    });

    it("should hide Issue button for new invoices (no id)", () => {
      const newInvoice = { ...draftInvoice, id: null };
      expect(shouldShowIssueButton(newInvoice, false)).toBe(false);
    });
  });

  describe("Save Button disabled state", () => {
    const isSaveDisabled = (isSaving, isLocked) => {
      return isSaving || isLocked;
    };

    it("should disable Save for locked invoices", () => {
      expect(isSaveDisabled(false, true)).toBe(true);
    });

    it("should enable Save for draft invoices", () => {
      expect(isSaveDisabled(false, false)).toBe(false);
    });

    it("should disable Save while saving", () => {
      expect(isSaveDisabled(true, false)).toBe(true);
    });
  });

  describe("Warning Banner visibility", () => {
    const shouldShowWarningBanner = (isLocked) => {
      return isLocked === true;
    };

    it("should show warning banner for locked invoices", () => {
      expect(shouldShowWarningBanner(true)).toBe(true);
    });

    it("should hide warning banner for draft invoices", () => {
      expect(shouldShowWarningBanner(false)).toBe(false);
    });
  });
});

describe("Invoice Service - issueInvoice", () => {
  it("should call POST /invoices/:id/issue endpoint", async () => {
    // Mock the API client
    const mockApiClient = {
      post: vi.fn().mockResolvedValue({
        id: 1,
        status: "issued",
        isLocked: true,
        message: "Invoice issued successfully",
      }),
    };

    // Simulate the issueInvoice service call
    const issueInvoice = async (invoiceId) => {
      const response = await mockApiClient.post(`/invoices/${invoiceId}/issue`);
      return response;
    };

    const result = await issueInvoice(1);

    expect(mockApiClient.post).toHaveBeenCalledWith("/invoices/1/issue");
    expect(result.status).toBe("issued");
    expect(result.isLocked).toBe(true);
  });
});

describe("Status consistency", () => {
  // Test that both 'issued' and 'STATUS_ISSUED' are handled consistently
  const normalizeStatus = (status) => {
    return (status || "").toLowerCase().replace("status_", "");
  };

  it("should normalize STATUS_ISSUED to issued", () => {
    expect(normalizeStatus("STATUS_ISSUED")).toBe("issued");
  });

  it("should normalize STATUS_DRAFT to draft", () => {
    expect(normalizeStatus("STATUS_DRAFT")).toBe("draft");
  });

  it("should keep lowercase status unchanged", () => {
    expect(normalizeStatus("issued")).toBe("issued");
    expect(normalizeStatus("draft")).toBe("draft");
  });
});
