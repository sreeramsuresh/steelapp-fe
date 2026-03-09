import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useZodForm } from "../../hooks/useZodForm";
import { CustomerFormSchema, InvoiceFormSchema, PaymentFormSchema } from "../invoiceSchema";

// ---------------------------------------------------------------------------
// Helpers — valid data factories
// ---------------------------------------------------------------------------

function validInvoiceData(overrides = {}) {
  return {
    customer: { id: 1, name: "Test Customer" },
    date: "2026-03-09",
    dueDate: "2026-04-09",
    items: [
      {
        productId: 10,
        name: "Steel Sheet 2mm",
        quantity: 5,
        rate: 120,
      },
    ],
    ...overrides,
  };
}

function validPaymentData(overrides = {}) {
  return {
    amount: 500,
    method: "bank_transfer",
    date: "2026-03-09",
    ...overrides,
  };
}

function validCustomerData(overrides = {}) {
  return {
    name: "Al Futtaim Steel",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// InvoiceFormSchema
// ---------------------------------------------------------------------------

describe("InvoiceFormSchema", () => {
  it("valid invoice data passes validation", () => {
    const result = InvoiceFormSchema.safeParse(validInvoiceData());
    expect(result.success).toBe(true);
  });

  it("valid minimal invoice (only required fields) passes", () => {
    const result = InvoiceFormSchema.safeParse({
      customer: { id: "C-001", name: "Minimal Customer" },
      date: "2026-01-01",
      dueDate: "2026-02-01",
      items: [{ productId: 1, name: "Item", quantity: 1, rate: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("missing customer fails", () => {
    const result = InvoiceFormSchema.safeParse(validInvoiceData({ customer: undefined }));
    expect(result.success).toBe(false);
    const paths = result.error.issues.map((i) => i.path[0]);
    expect(paths).toContain("customer");
  });

  it("customer with empty id fails", () => {
    const result = InvoiceFormSchema.safeParse(validInvoiceData({ customer: { id: "", name: "X" } }));
    expect(result.success).toBe(false);
  });

  it("empty items array fails", () => {
    const result = InvoiceFormSchema.safeParse(validInvoiceData({ items: [] }));
    expect(result.success).toBe(false);
    const msg = result.error.issues.find((i) => i.path[0] === "items")?.message;
    expect(msg).toMatch(/at least one item/i);
  });

  it("negative quantity in item fails", () => {
    const result = InvoiceFormSchema.safeParse(
      validInvoiceData({
        items: [{ productId: 1, name: "Sheet", quantity: -3, rate: 100 }],
      })
    );
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path.includes("quantity"));
    expect(issue).toBeDefined();
    expect(issue.message).toMatch(/greater than 0/i);
  });

  it("negative rate in item fails", () => {
    const result = InvoiceFormSchema.safeParse(
      validInvoiceData({
        items: [{ productId: 1, name: "Sheet", quantity: 2, rate: -50 }],
      })
    );
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path.includes("rate"));
    expect(issue).toBeDefined();
    expect(issue.message).toMatch(/0 or greater/i);
  });

  it("zero rate is allowed", () => {
    const result = InvoiceFormSchema.safeParse(
      validInvoiceData({
        items: [{ productId: 1, name: "Free Item", quantity: 1, rate: 0 }],
      })
    );
    expect(result.success).toBe(true);
  });

  it("item with null productId fails", () => {
    const result = InvoiceFormSchema.safeParse(
      validInvoiceData({
        items: [{ productId: null, name: "No Product", quantity: 1, rate: 10 }],
      })
    );
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path.includes("productId"));
    expect(issue).toBeDefined();
  });

  it("invalid date format fails", () => {
    const result = InvoiceFormSchema.safeParse(validInvoiceData({ date: "03/09/2026" }));
    expect(result.success).toBe(false);
  });

  it("notes exceeding 500 characters fails", () => {
    const result = InvoiceFormSchema.safeParse(validInvoiceData({ notes: "x".repeat(501) }));
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PaymentFormSchema
// ---------------------------------------------------------------------------

describe("PaymentFormSchema", () => {
  it("valid payment data passes", () => {
    const result = PaymentFormSchema.safeParse(validPaymentData());
    expect(result.success).toBe(true);
  });

  it("valid minimal payment passes", () => {
    const result = PaymentFormSchema.safeParse({
      amount: 0.01,
      method: "cash",
      date: "2026-03-09",
    });
    expect(result.success).toBe(true);
  });

  it("zero amount fails (must be positive)", () => {
    const result = PaymentFormSchema.safeParse(validPaymentData({ amount: 0 }));
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "amount");
    expect(issue).toBeDefined();
    expect(issue.message).toMatch(/greater than 0/i);
  });

  it("negative amount fails", () => {
    const result = PaymentFormSchema.safeParse(validPaymentData({ amount: -100 }));
    expect(result.success).toBe(false);
  });

  it("invalid payment method fails", () => {
    const result = PaymentFormSchema.safeParse(validPaymentData({ method: "bitcoin" }));
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "method");
    expect(issue).toBeDefined();
    expect(issue.message).toBeTruthy();
  });

  it("missing date fails", () => {
    const result = PaymentFormSchema.safeParse(validPaymentData({ date: undefined }));
    expect(result.success).toBe(false);
  });

  it("invalid date format fails", () => {
    const result = PaymentFormSchema.safeParse(validPaymentData({ date: "2026/03/09" }));
    expect(result.success).toBe(false);
  });

  it("all valid payment methods are accepted", () => {
    const methods = [
      "cash",
      "cheque",
      "pdc",
      "bank_transfer",
      "credit_card",
      "debit_card",
      "online",
      "wire_transfer",
      "mobile_wallet",
      "other",
    ];
    for (const method of methods) {
      const result = PaymentFormSchema.safeParse(validPaymentData({ method }));
      expect(result.success, `method "${method}" should be valid`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// CustomerFormSchema
// ---------------------------------------------------------------------------

describe("CustomerFormSchema", () => {
  it("valid customer data passes", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData());
    expect(result.success).toBe(true);
  });

  it("customer with all optional fields passes", () => {
    const result = CustomerFormSchema.safeParse(
      validCustomerData({
        company: "Ultimate Steel",
        email: "info@ultimate.ae",
        phone: "+971501234567",
        alternatePhone: "+971509876543",
        customerCode: "UST-001",
        street: "Industrial Area 3",
        city: "Sharjah",
        state: "Sharjah",
        postalCode: "12345",
        country: "AE",
        vatNumber: "100123456700003",
        trn: "100123456700003",
        creditLimit: 50000,
        paymentTermsDays: 30,
        defaultPaymentMethod: "bank_transfer",
      })
    );
    expect(result.success).toBe(true);
  });

  it("missing name fails", () => {
    const result = CustomerFormSchema.safeParse({});
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "name");
    expect(issue).toBeDefined();
  });

  it("name too short (1 char) fails", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData({ name: "A" }));
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "name");
    expect(issue).toBeDefined();
    expect(issue.message).toMatch(/at least 2 characters/i);
  });

  it("invalid email format fails", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData({ email: "not-an-email" }));
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "email");
    expect(issue).toBeDefined();
    expect(issue.message).toMatch(/invalid email/i);
  });

  it("empty email is allowed (optional field)", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData({ email: "" }));
    expect(result.success).toBe(true);
  });

  it("invalid phone format fails (not E.164)", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData({ phone: "0501234567" }));
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "phone");
    expect(issue).toBeDefined();
    expect(issue.message).toMatch(/E\.164/i);
  });

  it("valid E.164 phone passes (+971501234567)", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData({ phone: "+971501234567" }));
    expect(result.success).toBe(true);
  });

  it("empty phone is allowed (optional field)", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData({ phone: "" }));
    expect(result.success).toBe(true);
  });

  it("invalid country code length fails", () => {
    const result = CustomerFormSchema.safeParse(validCustomerData({ country: "UAE" }));
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useZodForm hook
// ---------------------------------------------------------------------------

describe("useZodForm", () => {
  it("validate() returns { success: true } for valid data", () => {
    const { result } = renderHook(() => useZodForm(CustomerFormSchema));

    let validation;
    act(() => {
      validation = result.current.validate({ name: "Valid Customer" });
    });

    expect(validation.success).toBe(true);
    expect(validation.fieldErrors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  it("validate() returns field-level errors for invalid data", () => {
    const { result } = renderHook(() => useZodForm(CustomerFormSchema));

    let validation;
    act(() => {
      validation = result.current.validate({
        name: "X",
        email: "bad-email",
      });
    });

    expect(validation.success).toBe(false);
    expect(validation.fieldErrors).toHaveProperty("name");
    expect(validation.fieldErrors).toHaveProperty("email");
    expect(result.current.isValid).toBe(false);
    expect(result.current.errors).toHaveProperty("name");
    expect(result.current.errors).toHaveProperty("email");
  });

  it("validateField() validates a single field", () => {
    const { result } = renderHook(() => useZodForm(CustomerFormSchema));

    let fieldResult;
    act(() => {
      fieldResult = result.current.validateField("name", "A");
    });
    expect(fieldResult.success).toBe(false);
    expect(fieldResult.message).toMatch(/at least 2/i);
    expect(result.current.errors).toHaveProperty("name");

    // Valid value clears the error
    act(() => {
      fieldResult = result.current.validateField("name", "Good Name");
    });
    expect(fieldResult.success).toBe(true);
    expect(result.current.errors).not.toHaveProperty("name");
  });

  it("clearErrors() resets errors", () => {
    const { result } = renderHook(() => useZodForm(CustomerFormSchema));

    // First produce errors
    act(() => {
      result.current.validate({ name: "X" });
    });
    expect(result.current.isValid).toBe(false);

    // Clear them
    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  it("isValid reflects error state", () => {
    const { result } = renderHook(() => useZodForm(PaymentFormSchema));

    // Initially no errors
    expect(result.current.isValid).toBe(true);

    // Invalid data sets errors
    act(() => {
      result.current.validate({ amount: -1 });
    });
    expect(result.current.isValid).toBe(false);

    // Valid data clears errors
    act(() => {
      result.current.validate({
        amount: 100,
        method: "cash",
        date: "2026-03-09",
      });
    });
    expect(result.current.isValid).toBe(true);
  });

  it("validate() flattens nested paths with dot notation", () => {
    const { result } = renderHook(() => useZodForm(InvoiceFormSchema));

    let validation;
    act(() => {
      validation = result.current.validate({
        customer: { id: "", name: "" },
        date: "2026-03-09",
        dueDate: "2026-04-09",
        items: [{ productId: null, name: "", quantity: -1, rate: -5 }],
      });
    });

    expect(validation.success).toBe(false);
    // Nested errors should use dot-path keys
    const keys = Object.keys(validation.fieldErrors);
    expect(keys.some((k) => k.startsWith("customer."))).toBe(true);
    expect(keys.some((k) => k.startsWith("items."))).toBe(true);
  });
});
