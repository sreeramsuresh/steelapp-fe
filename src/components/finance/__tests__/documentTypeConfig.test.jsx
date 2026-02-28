import { describe, expect, it } from "vitest";
import DOC_TYPE_CONFIG from "../documentTypeConfig";

describe("documentTypeConfig", () => {
  it("defines invoice config", () => {
    expect(DOC_TYPE_CONFIG.invoice).toBeDefined();
    expect(DOC_TYPE_CONFIG.invoice.label).toBe("Invoice");
    expect(DOC_TYPE_CONFIG.invoice.sign).toBe(1);
  });

  it("defines credit_note config with negative sign", () => {
    expect(DOC_TYPE_CONFIG.credit_note).toBeDefined();
    expect(DOC_TYPE_CONFIG.credit_note.label).toBe("Credit Note");
    expect(DOC_TYPE_CONFIG.credit_note.sign).toBe(-1);
  });

  it("defines debit_note config", () => {
    expect(DOC_TYPE_CONFIG.debit_note.label).toBe("Debit Note");
    expect(DOC_TYPE_CONFIG.debit_note.sign).toBe(1);
  });

  it("defines supplier_bill config", () => {
    expect(DOC_TYPE_CONFIG.supplier_bill.label).toBe("Supplier Bill");
  });

  it("defines journal_entry config", () => {
    expect(DOC_TYPE_CONFIG.journal_entry.label).toBe("Journal Entry");
  });

  it("defines grn config", () => {
    expect(DOC_TYPE_CONFIG.grn.label).toBe("Goods Receipt Note");
    expect(DOC_TYPE_CONFIG.grn.sign).toBe(1);
  });

  it("defines delivery_note config with negative sign", () => {
    expect(DOC_TYPE_CONFIG.delivery_note.label).toBe("Delivery Note");
    expect(DOC_TYPE_CONFIG.delivery_note.sign).toBe(-1);
  });

  it("has navigateTo function for all types", () => {
    for (const [key, config] of Object.entries(DOC_TYPE_CONFIG)) {
      expect(typeof config.navigateTo).toBe("function");
      const path = config.navigateTo(123);
      expect(path).toContain("123");
    }
  });

  it("has icon component for all types", () => {
    for (const [key, config] of Object.entries(DOC_TYPE_CONFIG)) {
      expect(config.icon).toBeDefined();
    }
  });

  it("has color for all types", () => {
    for (const [key, config] of Object.entries(DOC_TYPE_CONFIG)) {
      expect(typeof config.color).toBe("string");
    }
  });

  it("defines payment_receipt and payment_reversal", () => {
    expect(DOC_TYPE_CONFIG.payment_receipt.label).toBe("Payment Receipt");
    expect(DOC_TYPE_CONFIG.payment_receipt.sign).toBe(1);
    expect(DOC_TYPE_CONFIG.payment_reversal.label).toBe("Payment Reversal");
    expect(DOC_TYPE_CONFIG.payment_reversal.sign).toBe(-1);
  });

  it("defines reversing_journal with negative sign", () => {
    expect(DOC_TYPE_CONFIG.reversing_journal.label).toBe("Reversing Journal");
    expect(DOC_TYPE_CONFIG.reversing_journal.sign).toBe(-1);
  });
});
