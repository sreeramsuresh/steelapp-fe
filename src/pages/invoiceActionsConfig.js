/**
 * Invoice Actions Configuration - Shared Module
 *
 * Pure function that computes action button states for invoice list view.
 * This is the single source of truth for action icon enable/disable logic.
 *
 * IMPORTANT: This is a PURE FUNCTION - no React hooks, no side effects, no logging.
 * Dev-only debugging is handled by the caller (InvoiceList.jsx).
 *
 * @param {Object} invoice - Invoice object with status, payment, and metadata
 * @param {Object} permissions - Permission flags from authService
 * @param {Object} deliveryNoteStatus - Delivery note status lookup by invoice ID
 * @param {Function} getInvoiceReminderInfo - Utility function to get reminder info
 * @param {Function} validateInvoiceForDownload - Utility function to validate invoice
 * @returns {Object} Action configuration for all 11 icons
 */
export function getInvoiceActionButtonConfig(
  invoice,
  permissions,
  deliveryNoteStatus,
  getInvoiceReminderInfo,
  validateInvoiceForDownload
) {
  const isDeleted = invoice.deletedAt !== null;
  const {
    canUpdate,
    canDelete,
    canRead,
    canCreateCreditNote,
    canReadCustomers,
    canReadDeliveryNotes,
    canCreateDeliveryNotes,
  } = permissions;

  return {
    edit: {
      enabled: canUpdate && !isDeleted && invoice.status !== 'issued',
      tooltip: !canUpdate
        ? 'No permission to edit'
        : isDeleted
          ? 'Cannot edit deleted invoice'
          : invoice.status === 'issued'
            ? 'Cannot edit issued invoice'
            : 'Edit Invoice',
      link: `/edit/${invoice.id}`
    },
    creditNote: {
      enabled: canCreateCreditNote && !isDeleted && invoice.status === 'issued',
      tooltip: !canCreateCreditNote
        ? 'No permission to create credit notes'
        : isDeleted
          ? 'Cannot create credit note for deleted invoice'
          : invoice.status !== 'issued'
            ? 'Only available for issued invoices'
            : 'Create Credit Note',
      link: `/credit-notes/new?invoiceId=${invoice.id}`
    },
    view: {
      enabled: true,
      tooltip: 'View Invoice'
    },
    download: {
      enabled: canRead,
      tooltip: !canRead
        ? 'No permission to download'
        : !validateInvoiceForDownload(invoice).isValid
          ? `Incomplete ${invoice.status === 'draft' ? 'draft' : invoice.status === 'proforma' ? 'proforma' : 'invoice'} - Click to see missing fields`
          : 'Download PDF',
      isValid: validateInvoiceForDownload(invoice).isValid
    },
    recordPayment: {
      enabled: !isDeleted,
      tooltip: isDeleted
        ? 'Cannot view payments for deleted invoice'
        : invoice.paymentStatus === 'paid'
          ? 'View Payment History'
          : 'Record Payment',
      isPaid: invoice.paymentStatus === 'paid',
      canAddPayment: canUpdate && invoice.paymentStatus !== 'paid' && (invoice.balanceDue === undefined || invoice.balanceDue > 0)
    },
    commission: {
      enabled: invoice.paymentStatus === 'paid' && invoice.salesAgentId && !isDeleted,
      tooltip: invoice.paymentStatus !== 'paid'
        ? 'Only available for paid invoices'
        : !invoice.salesAgentId
          ? 'No sales agent assigned'
          : isDeleted
            ? 'Cannot calculate for deleted invoice'
            : 'Calculate Commission'
    },
    reminder: {
      enabled: getInvoiceReminderInfo(invoice)?.shouldShowReminder || false,
      tooltip: getInvoiceReminderInfo(invoice)?.shouldShowReminder
        ? `Send payment reminder (${getInvoiceReminderInfo(invoice)?.config?.label || ''})`
        : 'No reminder needed'
    },
    phone: {
      enabled: !isDeleted,
      tooltip: isDeleted
        ? 'Cannot add notes to deleted invoice'
        : 'Payment Reminder - Phone Call Notes'
    },
    statement: {
      enabled: canReadCustomers,
      tooltip: canReadCustomers
        ? 'Generate Statement of Accounts'
        : 'No permission to generate statements'
    },
    deliveryNote: {
      enabled: invoice.status === 'issued' && (deliveryNoteStatus[invoice.id]?.hasNotes ? canReadDeliveryNotes : canCreateDeliveryNotes),
      tooltip: invoice.status !== 'issued'
        ? 'Only available for issued invoices'
        : deliveryNoteStatus[invoice.id]?.hasNotes
          ? `View Delivery Notes (${deliveryNoteStatus[invoice.id]?.count})`
          : !canCreateDeliveryNotes
            ? 'No permission to create delivery notes'
            : 'Create delivery note',
      hasNotes: deliveryNoteStatus[invoice.id]?.hasNotes
    },
    delete: {
      enabled: canDelete && !isDeleted,
      tooltip: !canDelete
        ? 'No permission to delete'
        : isDeleted
          ? 'Invoice already deleted'
          : 'Delete Invoice'
    },
    restore: {
      enabled: isDeleted && canUpdate,
      tooltip: !isDeleted
        ? 'Invoice not deleted'
        : !canUpdate
          ? 'No permission to restore'
          : 'Restore Invoice'
    }
  };
}
