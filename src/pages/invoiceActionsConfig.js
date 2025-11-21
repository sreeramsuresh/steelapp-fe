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
  validateInvoiceForDownload,
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

  // Status lifecycle constants
  const nonEditableStatuses = ['issued', 'sent', 'completed', 'cancelled'];
  const creditNoteAllowedStatuses = ['issued', 'sent'];
  const deliveryNoteAllowedStatuses = ['issued', 'sent'];

  return {
    edit: {
      enabled: canUpdate && !isDeleted && !nonEditableStatuses.includes(invoice.status),
      tooltip: !canUpdate
        ? 'No permission to edit'
        : isDeleted
          ? 'Cannot edit deleted invoice'
          : nonEditableStatuses.includes(invoice.status)
            ? `Cannot edit ${invoice.status} invoice`
            : 'Edit Invoice',
      link: `/edit/${invoice.id}`,
    },
    creditNote: {
      enabled: canCreateCreditNote && !isDeleted && creditNoteAllowedStatuses.includes(invoice.status),
      tooltip: !canCreateCreditNote
        ? 'No permission to create credit notes'
        : isDeleted
          ? 'Cannot create credit note for deleted invoice'
          : !creditNoteAllowedStatuses.includes(invoice.status)
            ? 'Only available for issued/sent invoices'
            : 'Create Credit Note',
      link: `/finance?tab=credit-notes&invoiceId=${invoice.id}`,
    },
    view: {
      enabled: true,
      tooltip: 'View Invoice',
    },
    download: {
      enabled: canRead,
      tooltip: !canRead
        ? 'No permission to download'
        : !validateInvoiceForDownload(invoice).isValid
          ? `Incomplete ${invoice.status === 'draft' ? 'draft' : invoice.status === 'proforma' ? 'proforma' : 'invoice'} - Click to see missing fields`
          : 'Download PDF',
      isValid: validateInvoiceForDownload(invoice).isValid,
    },
    recordPayment: {
      enabled: !isDeleted,
      tooltip: isDeleted
        ? 'Cannot view payments for deleted invoice'
        : invoice.paymentStatus === 'paid'
          ? 'View Payment History'
          : 'Record Payment',
      isPaid: invoice.paymentStatus === 'paid',
      canAddPayment: canUpdate && invoice.paymentStatus !== 'paid' && invoice.status !== 'cancelled' && (invoice.balanceDue === undefined || invoice.balanceDue > 0),
    },
    commission: {
      enabled: !!(
        invoice.paymentStatus === 'paid' &&
        invoice.salesAgentId &&
        parseInt(invoice.salesAgentId, 10) > 0 &&
        !isDeleted
      ),
      tooltip: invoice.paymentStatus !== 'paid'
        ? 'Only available for paid invoices'
        : !invoice.salesAgentId || parseInt(invoice.salesAgentId, 10) === 0
          ? 'No sales agent assigned'
          : isDeleted
            ? 'Cannot calculate for deleted invoice'
            : 'Calculate Commission',
    },
    reminder: {
      enabled: getInvoiceReminderInfo(invoice)?.shouldShowReminder || false,
      tooltip: getInvoiceReminderInfo(invoice)?.shouldShowReminder
        ? `Send payment reminder (${getInvoiceReminderInfo(invoice)?.config?.label || ''})`
        : 'No reminder needed',
    },
    phone: {
      enabled: !isDeleted,
      tooltip: isDeleted
        ? 'Cannot add notes to deleted invoice'
        : 'Payment Reminder - Phone Call Notes',
    },
    statement: {
      enabled: canReadCustomers,
      tooltip: canReadCustomers
        ? 'Generate Statement of Accounts'
        : 'No permission to generate statements',
    },
    deliveryNote: {
      enabled: deliveryNoteAllowedStatuses.includes(invoice.status) && (deliveryNoteStatus[invoice.id]?.hasNotes ? canReadDeliveryNotes : canCreateDeliveryNotes),
      tooltip: !deliveryNoteAllowedStatuses.includes(invoice.status)
        ? 'Only available for issued/sent invoices'
        : deliveryNoteStatus[invoice.id]?.hasNotes
          ? `View Delivery Notes (${deliveryNoteStatus[invoice.id]?.count})`
          : !canCreateDeliveryNotes
            ? 'No permission to create delivery notes'
            : 'Create delivery note',
      hasNotes: deliveryNoteStatus[invoice.id]?.hasNotes,
    },
    delete: {
      enabled: canDelete && !isDeleted,
      tooltip: !canDelete
        ? 'No permission to delete'
        : isDeleted
          ? 'Invoice already deleted'
          : 'Delete Invoice',
    },
    restore: {
      enabled: isDeleted && canUpdate,
      tooltip: !isDeleted
        ? 'Invoice not deleted'
        : !canUpdate
          ? 'No permission to restore'
          : 'Restore Invoice',
    },

    // PRIMARY ACTION: Consolidated edit/credit note action
    // Shows edit for draft/proforma, credit note for issued/sent, none for cancelled/deleted
    primaryAction: (() => {
      const isEditable = canUpdate && !isDeleted && !nonEditableStatuses.includes(invoice.status);
      const canCreateCN = canCreateCreditNote && !isDeleted && creditNoteAllowedStatuses.includes(invoice.status);
      
      if (isEditable) {
        return {
          type: 'edit',
          enabled: true,
          tooltip: 'Edit Invoice',
          link: `/edit/${invoice.id}`,
        };
      } else if (canCreateCN) {
        return {
          type: 'creditNote',
          enabled: true,
          tooltip: 'Create Credit Note',
          link: `/finance?tab=credit-notes&invoiceId=${invoice.id}`,
        };
      } else {
        // Cancelled, deleted, or no permission
        return {
          type: 'none',
          enabled: false,
          tooltip: isDeleted
            ? 'Cannot modify deleted invoice'
            : invoice.status === 'cancelled'
              ? 'Cannot modify cancelled invoice'
              : !canUpdate && !canCreateCreditNote
                ? 'No permission to modify'
                : nonEditableStatuses.includes(invoice.status)
                  ? 'No permission to create credit notes'
                  : 'No modifications available',
          link: null,
        };
      }
    })(),
  };
}
