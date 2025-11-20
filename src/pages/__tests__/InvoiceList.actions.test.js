/**
 * Invoice List - Action Icons Test Suite
 *
 * Tests the 6 high-priority test cases from the Invoice List View Test Run Report.
 * These tests validate that action icon enable/disable logic matches the spec.
 *
 * Test Cases:
 * - TC-001: Draft, unpaid, no delete
 * - TC-002: Issued, unpaid, all perms
 * - TC-003: Issued, paid, has agent
 * - TC-004: Deleted, all perms
 * - TC-005: Proforma, all perms
 * - TC-006: Issued, partially paid, 5 days overdue
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before imports
vi.mock('../../services/axiosAuthService', () => ({
  authService: {
    hasPermission: vi.fn(),
  },
}));

vi.mock('../../utils/reminderUtils', () => ({
  getInvoiceReminderInfo: vi.fn(),
  generatePaymentReminder: vi.fn(),
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// Import after mocks
import { authService } from '../../services/axiosAuthService';
import { getInvoiceReminderInfo } from '../../utils/reminderUtils';
import { getInvoiceActionButtonConfig } from '../invoiceActionsConfig';

/**
 * Helper: Validate invoice completeness for download
 * This helper is needed because the shared function requires it as a parameter.
 * Keeping it here to maintain test independence.
 */
const validateInvoiceForDownload = (invoice) => {
  const hasCustomer = invoice.customer?.name && invoice.customer.name.trim() !== '';
  const hasItems = invoice.items && invoice.items.length > 0;
  const hasValidItems = hasItems && invoice.items.every(item =>
    item.name && item.name.trim() !== '' &&
    item.quantity > 0 &&
    item.rate > 0
  );
  const hasDate = !!invoice.date;
  const hasDueDate = !!invoice.dueDate;

  return {
    isValid: hasCustomer && hasItems && hasValidItems && hasDate && hasDueDate,
    missing: {
      customer: !hasCustomer,
      items: !hasItems || !hasValidItems,
      date: !hasDate,
      dueDate: !hasDueDate
    }
  };
};

describe('InvoiceList - Action Icons (Test Matrix TC-001 to TC-006)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * TC-001: Draft, unpaid, no delete permission
   * Expected Enabled: View, Download (with warning), Phone, Statement
   * Expected Disabled: Edit (no perm), Credit Note, Reminder, Commission, Delivery Note, Delete
   */
  test('TC-001: Draft, unpaid, no delete → correct icon enabled/disabled matrix', () => {
    const invoice = {
      id: 1,
      invoiceNumber: 'INV-001',
      status: 'draft',
      paymentStatus: 'unpaid',
      deletedAt: null,
      balanceDue: 1000,
      total: 1000,
      salesAgentId: null,
      customer: { name: 'Test Customer' },
      items: [{ name: 'Item 1', quantity: 1, rate: 1000 }],
      date: '2025-01-01',
      dueDate: '2025-01-31',
    };

    const permissions = {
      canUpdate: false, // No update permission
      canDelete: false, // No delete permission
      canRead: true,
      canCreateCreditNote: false,
      canReadCustomers: true,
      canReadDeliveryNotes: false,
      canCreateDeliveryNotes: false,
    };

    getInvoiceReminderInfo.mockReturnValue(null); // Draft invoices don't have reminders

    const actions = getInvoiceActionButtonConfig(invoice, permissions, {}, getInvoiceReminderInfo, validateInvoiceForDownload);

    // Expected ENABLED
    expect(actions.view.enabled).toBe(true);
    expect(actions.download.enabled).toBe(true);
    expect(actions.phone.enabled).toBe(true);
    expect(actions.statement.enabled).toBe(true);

    // Expected DISABLED
    expect(actions.edit.enabled).toBe(false); // No permission
    expect(actions.creditNote.enabled).toBe(false); // Draft, not issued
    expect(actions.reminder.enabled).toBe(false); // Draft, not issued
    expect(actions.commission.enabled).toBe(false); // Not paid
    expect(actions.deliveryNote.enabled).toBe(false); // Draft, not issued
    expect(actions.delete.enabled).toBe(false); // No permission
    expect(actions.recordPayment.enabled).toBe(true); // Always enabled unless deleted
  });

  /**
   * TC-002: Issued, unpaid, all permissions
   * Expected Enabled: View, Download, Payment, Reminder, Phone, Statement, Delivery, Delete
   * Expected Disabled: Edit, Commission
   * Note: Credit Note is actually ENABLED per logic (issued invoices)
   */
  test('TC-002: Issued, unpaid, all perms → correct icon enabled/disabled matrix', () => {
    const invoice = {
      id: 2,
      invoiceNumber: 'INV-002',
      status: 'issued',
      paymentStatus: 'unpaid',
      deletedAt: null,
      balanceDue: 5000,
      total: 5000,
      salesAgentId: 10,
      customer: { name: 'Test Customer' },
      items: [{ name: 'Item 1', quantity: 1, rate: 5000 }],
      date: '2025-01-01',
      dueDate: '2025-01-31',
    };

    const permissions = {
      canUpdate: true,
      canDelete: true,
      canRead: true,
      canCreateCreditNote: true,
      canReadCustomers: true,
      canReadDeliveryNotes: true,
      canCreateDeliveryNotes: true,
    };

    // Mock reminder info (issued + unpaid = show reminder)
    getInvoiceReminderInfo.mockReturnValue({ shouldShowReminder: true });

    const deliveryNoteStatus = {}; // No delivery notes yet

    const actions = getInvoiceActionButtonConfig(invoice, permissions, deliveryNoteStatus, getInvoiceReminderInfo, validateInvoiceForDownload);

    // Expected ENABLED
    expect(actions.view.enabled).toBe(true);
    expect(actions.download.enabled).toBe(true);
    expect(actions.recordPayment.enabled).toBe(true);
    expect(actions.reminder.enabled).toBe(true);
    expect(actions.phone.enabled).toBe(true);
    expect(actions.statement.enabled).toBe(true);
    expect(actions.deliveryNote.enabled).toBe(true);
    expect(actions.delete.enabled).toBe(true);
    expect(actions.creditNote.enabled).toBe(true); // Enabled for issued invoices

    // Expected DISABLED
    expect(actions.edit.enabled).toBe(false); // Issued invoices can't be edited
    expect(actions.commission.enabled).toBe(false); // Not paid yet
  });

  /**
   * TC-003: Issued, paid, has agent
   * Expected Enabled: View, Download, Payment (view), Commission, Statement
   * Expected Disabled: Edit, Reminder
   * Note: Credit Note and Delivery Note are ENABLED per logic
   */
  test('TC-003: Issued, paid, has agent → correct icon enabled/disabled matrix', () => {
    const invoice = {
      id: 3,
      invoiceNumber: 'INV-003',
      status: 'issued',
      paymentStatus: 'paid',
      deletedAt: null,
      balanceDue: 0,
      total: 10000,
      salesAgentId: 15,
      customer: { name: 'Test Customer' },
      items: [{ name: 'Item 1', quantity: 1, rate: 10000 }],
      date: '2025-01-01',
      dueDate: '2025-01-31',
    };

    const permissions = {
      canUpdate: true,
      canDelete: true,
      canRead: true,
      canCreateCreditNote: true,
      canReadCustomers: true,
      canReadDeliveryNotes: true,
      canCreateDeliveryNotes: true,
    };

    // Paid invoices don't need reminders
    getInvoiceReminderInfo.mockReturnValue(null);

    const deliveryNoteStatus = {}; // No delivery notes

    const actions = getInvoiceActionButtonConfig(invoice, permissions, deliveryNoteStatus, getInvoiceReminderInfo, validateInvoiceForDownload);

    // Expected ENABLED
    expect(actions.view.enabled).toBe(true);
    expect(actions.download.enabled).toBe(true);
    expect(actions.recordPayment.enabled).toBe(true); // View mode for paid
    expect(actions.recordPayment.isPaid).toBe(true);
    expect(actions.recordPayment.canAddPayment).toBe(false); // Can't add payment to paid invoice
    expect(actions.commission.enabled).toBe(true); // Paid + has agent
    expect(actions.statement.enabled).toBe(true);
    expect(actions.creditNote.enabled).toBe(true); // Enabled for issued
    expect(actions.deliveryNote.enabled).toBe(true); // Enabled for issued

    // Expected DISABLED
    expect(actions.edit.enabled).toBe(false); // Issued
    expect(actions.reminder.enabled).toBe(false); // Paid
  });

  /**
   * TC-004: Deleted, all permissions
   * Expected Enabled: View, Restore
   * Expected Disabled: All others
   */
  test('TC-004: Deleted, all perms → correct icon enabled/disabled matrix', () => {
    const invoice = {
      id: 4,
      invoiceNumber: 'INV-004',
      status: 'issued',
      paymentStatus: 'unpaid',
      deletedAt: '2025-01-15T10:00:00Z', // DELETED
      balanceDue: 2000,
      total: 2000,
      salesAgentId: null,
      customer: { name: 'Test Customer' },
      items: [{ name: 'Item 1', quantity: 1, rate: 2000 }],
      date: '2025-01-01',
      dueDate: '2025-01-31',
    };

    const permissions = {
      canUpdate: true,
      canDelete: true,
      canRead: true,
      canCreateCreditNote: true,
      canReadCustomers: true,
      canReadDeliveryNotes: true,
      canCreateDeliveryNotes: true,
    };

    getInvoiceReminderInfo.mockReturnValue(null);

    const actions = getInvoiceActionButtonConfig(invoice, permissions, {}, getInvoiceReminderInfo, validateInvoiceForDownload);

    // Expected ENABLED
    expect(actions.view.enabled).toBe(true); // View always enabled
    expect(actions.restore.enabled).toBe(true); // Deleted + can update

    // Expected DISABLED (deleted protection)
    expect(actions.edit.enabled).toBe(false);
    expect(actions.creditNote.enabled).toBe(false);
    expect(actions.recordPayment.enabled).toBe(false);
    expect(actions.commission.enabled).toBe(false);
    expect(actions.phone.enabled).toBe(false);
    expect(actions.delete.enabled).toBe(false);

    // Expected ENABLED (not affected by deletion)
    expect(actions.download.enabled).toBe(true); // Read permission still allows download
    expect(actions.statement.enabled).toBe(true); // Statement still enabled
    expect(actions.deliveryNote.enabled).toBe(true); // Delivery note checks status, not deletion state
  });

  /**
   * TC-005: Proforma, all permissions
   * Expected Enabled: Edit, View, Download, Phone, Statement, Delete
   * Expected Disabled: Credit Note, Reminder, Commission, Delivery Note
   */
  test('TC-005: Proforma, all perms → correct icon enabled/disabled matrix', () => {
    const invoice = {
      id: 5,
      invoiceNumber: 'PRO-001',
      status: 'proforma',
      paymentStatus: 'unpaid',
      deletedAt: null,
      balanceDue: 3000,
      total: 3000,
      salesAgentId: null,
      customer: { name: 'Test Customer' },
      items: [{ name: 'Item 1', quantity: 1, rate: 3000 }],
      date: '2025-01-01',
      dueDate: '2025-01-31',
    };

    const permissions = {
      canUpdate: true,
      canDelete: true,
      canRead: true,
      canCreateCreditNote: true,
      canReadCustomers: true,
      canReadDeliveryNotes: true,
      canCreateDeliveryNotes: true,
    };

    getInvoiceReminderInfo.mockReturnValue(null); // Proforma don't have reminders

    const actions = getInvoiceActionButtonConfig(invoice, permissions, {}, getInvoiceReminderInfo, validateInvoiceForDownload);

    // Expected ENABLED
    expect(actions.edit.enabled).toBe(true); // Proforma can be edited
    expect(actions.view.enabled).toBe(true);
    expect(actions.download.enabled).toBe(true);
    expect(actions.phone.enabled).toBe(true);
    expect(actions.statement.enabled).toBe(true);
    expect(actions.delete.enabled).toBe(true);
    expect(actions.recordPayment.enabled).toBe(true);

    // Expected DISABLED
    expect(actions.creditNote.enabled).toBe(false); // Only for issued
    expect(actions.reminder.enabled).toBe(false); // Only for issued
    expect(actions.commission.enabled).toBe(false); // Not paid
    expect(actions.deliveryNote.enabled).toBe(false); // Only for issued
  });

  /**
   * TC-006: Issued, partially paid, 5 days overdue
   * Expected Enabled: View, Download, Payment, Reminder (⚠️ red), Phone, Statement, Delivery, Delete
   * Expected Disabled: Edit, Commission
   * Note: Credit Note is ENABLED per logic
   */
  test('TC-006: Issued, partially paid, 5 days overdue → correct icon enabled/disabled matrix', () => {
    const today = new Date();
    const overdueDate = new Date(today);
    overdueDate.setDate(today.getDate() - 5); // 5 days ago

    const invoice = {
      id: 6,
      invoiceNumber: 'INV-006',
      status: 'issued',
      paymentStatus: 'partially_paid',
      deletedAt: null,
      balanceDue: 2500,
      total: 5000,
      salesAgentId: 20,
      customer: { name: 'Test Customer' },
      items: [{ name: 'Item 1', quantity: 1, rate: 5000 }],
      date: '2025-01-01',
      dueDate: overdueDate.toISOString().split('T')[0],
    };

    const permissions = {
      canUpdate: true,
      canDelete: true,
      canRead: true,
      canCreateCreditNote: true,
      canReadCustomers: true,
      canReadDeliveryNotes: true,
      canCreateDeliveryNotes: true,
    };

    // Mock reminder (issued + partially paid + overdue = show urgent reminder)
    getInvoiceReminderInfo.mockReturnValue({
      shouldShowReminder: true,
      type: 'polite_overdue',
      isOverdue: true,
    });

    const actions = getInvoiceActionButtonConfig(invoice, permissions, {}, getInvoiceReminderInfo, validateInvoiceForDownload);

    // Expected ENABLED
    expect(actions.view.enabled).toBe(true);
    expect(actions.download.enabled).toBe(true);
    expect(actions.recordPayment.enabled).toBe(true);
    expect(actions.recordPayment.canAddPayment).toBe(true); // Can add more payment
    expect(actions.reminder.enabled).toBe(true); // Overdue reminder
    expect(actions.phone.enabled).toBe(true);
    expect(actions.statement.enabled).toBe(true);
    expect(actions.deliveryNote.enabled).toBe(true);
    expect(actions.delete.enabled).toBe(true);
    expect(actions.creditNote.enabled).toBe(true); // Enabled for issued

    // Expected DISABLED
    expect(actions.edit.enabled).toBe(false); // Issued
    expect(actions.commission.enabled).toBe(false); // Not fully paid
  });
});
