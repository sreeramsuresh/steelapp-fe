import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REMINDER_TYPES,
  REMINDER_CONFIG,
  calculateDaysUntilDue,
  getReminderType,
  getInvoiceReminderInfo,
  formatDaysMessage,
  getPromiseIndicatorInfo,
  formatPromiseMessage,
  getReminderLetterContent,
} from "../reminderUtils.js";

test("REMINDER_TYPES", async (t) => {
  await t.test("should have all reminder type constants", () => {
    assert.equal(REMINDER_TYPES.ADVANCE, "advance");
    assert.equal(REMINDER_TYPES.DUE_SOON, "due_soon");
    assert.equal(REMINDER_TYPES.DUE_TODAY, "due_today");
    assert.equal(REMINDER_TYPES.POLITE_OVERDUE, "polite_overdue");
    assert.equal(REMINDER_TYPES.URGENT_OVERDUE, "urgent_overdue");
    assert.equal(REMINDER_TYPES.FINAL_OVERDUE, "final_overdue");
  });
});

test("REMINDER_CONFIG", async (t) => {
  await t.test("should have configuration for all reminder types", () => {
    Object.values(REMINDER_TYPES).forEach((type) => {
      assert.ok(REMINDER_CONFIG[type], `Config missing for ${type}`);
    });
  });

  await t.test("should have label and styling properties", () => {
    Object.values(REMINDER_TYPES).forEach((type) => {
      const config = REMINDER_CONFIG[type];
      assert.ok(config.label);
      assert.ok(config.icon);
      assert.ok(config.tone);
      assert.ok(config.bgLight);
      assert.ok(config.bgDark);
      assert.ok(config.textLight);
      assert.ok(config.textDark);
    });
  });
});

test("calculateDaysUntilDue", async (t) => {
  await t.test("should calculate days until future due date", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const days = calculateDaysUntilDue(futureDate.toISOString());
    assert.ok(days > 0 && days <= 5, `Expected 1-5 days, got ${days}`);
  });

  await t.test("should calculate days for today due date", () => {
    const today = new Date();
    const days = calculateDaysUntilDue(today.toISOString());
    assert.ok(days === 0 || days === 1, `Expected 0 or 1 for today, got ${days}`);
  });

  await t.test("should calculate negative days for past due date", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const days = calculateDaysUntilDue(pastDate.toISOString());
    assert.ok(days < 0, `Expected negative days for past date, got ${days}`);
  });

  await t.test("should return 0 for null/undefined date", () => {
    assert.equal(calculateDaysUntilDue(null), 0);
    assert.equal(calculateDaysUntilDue(undefined), 0);
  });

  await t.test("should handle invalid date gracefully", () => {
    const result = calculateDaysUntilDue("invalid-date");
    assert.ok(typeof result === "number");
  });
});

test("getReminderType", async (t) => {
  await t.test("should return ADVANCE for days >= 7", () => {
    assert.equal(getReminderType(7), REMINDER_TYPES.ADVANCE);
    assert.equal(getReminderType(14), REMINDER_TYPES.ADVANCE);
    assert.equal(getReminderType(100), REMINDER_TYPES.ADVANCE);
  });

  await t.test("should return DUE_SOON for 1-6 days", () => {
    assert.equal(getReminderType(1), REMINDER_TYPES.DUE_SOON);
    assert.equal(getReminderType(3), REMINDER_TYPES.DUE_SOON);
    assert.equal(getReminderType(6), REMINDER_TYPES.DUE_SOON);
  });

  await t.test("should return DUE_TODAY for 0 days", () => {
    assert.equal(getReminderType(0), REMINDER_TYPES.DUE_TODAY);
  });

  await t.test("should return POLITE_OVERDUE for -1 to -7 days", () => {
    assert.equal(getReminderType(-1), REMINDER_TYPES.POLITE_OVERDUE);
    assert.equal(getReminderType(-5), REMINDER_TYPES.POLITE_OVERDUE);
    assert.equal(getReminderType(-7), REMINDER_TYPES.POLITE_OVERDUE);
  });

  await t.test("should return URGENT_OVERDUE for -8 to -30 days", () => {
    assert.equal(getReminderType(-8), REMINDER_TYPES.URGENT_OVERDUE);
    assert.equal(getReminderType(-15), REMINDER_TYPES.URGENT_OVERDUE);
    assert.equal(getReminderType(-30), REMINDER_TYPES.URGENT_OVERDUE);
  });

  await t.test("should return FINAL_OVERDUE for days < -30", () => {
    assert.equal(getReminderType(-31), REMINDER_TYPES.FINAL_OVERDUE);
    assert.equal(getReminderType(-100), REMINDER_TYPES.FINAL_OVERDUE);
  });
});

test("getInvoiceReminderInfo", async (t) => {
  await t.test("should return null for draft invoice", () => {
    const invoice = {
      status: "draft",
      total: 1000,
      payments: [],
      dueDate: new Date().toISOString(),
    };
    const info = getInvoiceReminderInfo(invoice);
    assert.equal(info, null);
  });

  await t.test("should return null for fully paid issued invoice", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const invoice = {
      status: "issued",
      paymentStatus: "paid",
      total: 1000,
      payments: [{ amount: 1000 }],
      dueDate: futureDate.toISOString(),
    };
    const info = getInvoiceReminderInfo(invoice);
    assert.equal(info, null);
  });

  await t.test("should return reminder info for issued unpaid invoice", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const invoice = {
      status: "issued",
      paymentStatus: "unpaid",
      total: 1000,
      payments: [],
      dueDate: futureDate.toISOString(),
    };
    const info = getInvoiceReminderInfo(invoice);
    assert.ok(info);
    assert.ok(info.type);
    assert.ok(info.config);
    assert.ok(info.shouldShowReminder);
  });

  await t.test("should normalize status field", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const invoice = {
      status: "STATUS_ISSUED", // Backend format
      paymentStatus: "unpaid",
      total: 1000,
      payments: [],
      dueDate: futureDate.toISOString(),
    };
    const info = getInvoiceReminderInfo(invoice);
    assert.ok(info);
  });

  await t.test("should use outstanding from backend if available", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const invoice = {
      status: "issued",
      paymentStatus: "unpaid",
      total: 1000,
      payments: [],
      outstanding: 850,
      dueDate: futureDate.toISOString(),
    };
    const info = getInvoiceReminderInfo(invoice);
    assert.equal(info.balanceDue, 850);
  });
});

test("formatDaysMessage", async (t) => {
  await t.test("should format 0 days as Due Today", () => {
    const message = formatDaysMessage(0);
    assert.equal(message, "Due Today");
  });

  await t.test("should format 1 day as singular", () => {
    const message = formatDaysMessage(1);
    assert.equal(message, "Payment due in 1 day");
  });

  await t.test("should format multiple days", () => {
    const message = formatDaysMessage(5);
    assert.equal(message, "Payment due in 5 days");
  });

  await t.test("should format -1 as singular overdue", () => {
    const message = formatDaysMessage(-1);
    assert.equal(message, "1 day overdue");
  });

  await t.test("should format multiple overdue days", () => {
    const message = formatDaysMessage(-10);
    assert.equal(message, "10 days overdue");
  });
});

test("getPromiseIndicatorInfo", async (t) => {
  await t.test("should return null for draft invoice", () => {
    const invoice = {
      status: "draft",
      total: 1000,
      payments: [],
    };
    const reminder = { promisedDate: new Date().toISOString() };
    const info = getPromiseIndicatorInfo(invoice, reminder);
    assert.equal(info, null);
  });

  await t.test("should return null without promised date", () => {
    const invoice = {
      status: "issued",
      paymentStatus: "unpaid",
      total: 1000,
      payments: [],
    };
    const info = getPromiseIndicatorInfo(invoice, {});
    assert.equal(info, null);
  });

  await t.test("should return null for fully paid invoice", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const invoice = {
      status: "issued",
      paymentStatus: "paid",
      total: 1000,
      payments: [{ amount: 1000 }],
    };
    const reminder = { promisedDate: futureDate.toISOString() };
    const info = getPromiseIndicatorInfo(invoice, reminder);
    assert.equal(info, null);
  });

  await t.test("should return promise info for issued unpaid invoice with promise", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const invoice = {
      status: "issued",
      paymentStatus: "unpaid",
      total: 1000,
      payments: [],
    };
    const reminder = { promisedDate: futureDate.toISOString(), promisedAmount: 500 };
    const info = getPromiseIndicatorInfo(invoice, reminder);
    assert.ok(info);
    assert.ok(info.config);
    assert.ok(info.shouldShowPromise);
  });
});

test("formatPromiseMessage", async (t) => {
  await t.test("should format 0 days as Promised Today", () => {
    const message = formatPromiseMessage(0);
    assert.equal(message, "Promised Today");
  });

  await t.test("should format 1 day as singular", () => {
    const message = formatPromiseMessage(1);
    assert.equal(message, "Promised in 1 day");
  });

  await t.test("should format multiple days", () => {
    const message = formatPromiseMessage(5);
    assert.equal(message, "Promised in 5 days");
  });

  await t.test("should format -1 as singular broken", () => {
    const message = formatPromiseMessage(-1);
    assert.equal(message, "Promise 1 day late");
  });

  await t.test("should format multiple days late", () => {
    const message = formatPromiseMessage(-10);
    assert.equal(message, "Promise 10 days late");
  });
});

test("getReminderLetterContent", async (t) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);

  const mockInvoice = {
    invoiceNumber: "INV-202501-0001",
    customer: { name: "TEST CUSTOMER LLC" },
    total: 1000,
    payments: [],
    dueDate: futureDate.toISOString(),
  };

  await t.test("should return letter content with subject, greeting, body, closing", () => {
    const content = getReminderLetterContent(REMINDER_TYPES.DUE_SOON, mockInvoice, 3);
    assert.ok(content.subject);
    assert.ok(content.greeting);
    assert.ok(Array.isArray(content.body));
    assert.ok(content.body.length > 0);
    assert.ok(content.closing);
  });

  await t.test("should include invoice number in subject", () => {
    const content = getReminderLetterContent(REMINDER_TYPES.ADVANCE, mockInvoice, 7);
    assert.ok(content.subject.includes("INV-202501-0001"));
  });

  await t.test("should include customer name in greeting", () => {
    const content = getReminderLetterContent(REMINDER_TYPES.DUE_TODAY, mockInvoice, 0);
    assert.ok(content.greeting.includes("TEST"));
  });

  await t.test("should have different content for different reminder types", () => {
    const advanceContent = getReminderLetterContent(REMINDER_TYPES.ADVANCE, mockInvoice, 7);
    const urgentContent = getReminderLetterContent(REMINDER_TYPES.URGENT_OVERDUE, mockInvoice, -15);
    assert.notEqual(advanceContent.subject, urgentContent.subject);
  });

  await t.test("should include amount in body", () => {
    const content = getReminderLetterContent(REMINDER_TYPES.DUE_SOON, mockInvoice, 3);
    const bodyText = content.body.join(" ");
    assert.ok(bodyText.includes("1000") || bodyText.includes("Amount"));
  });
});
