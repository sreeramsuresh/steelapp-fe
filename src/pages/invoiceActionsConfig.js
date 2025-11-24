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
  
  // 24-hour edit window calculation for issued invoices
  const isIssuedStatus = ['issued', 'sent'].includes(invoice.status);
  const issuedAt = invoice.issuedAt ? new Date(invoice.issuedAt) : null;
  const now = new Date();
  const hoursSinceIssued = issuedAt ? (now - issuedAt) / (1000 * 60 * 60) : Infinity;
  const withinEditWindow = hoursSinceIssued < 24;

  return {
    // Edit/Lock action for the first actions column
    // Draft/Proforma: Always editable
    // Issued (within 24h): Editable (creates revision)
    // Issued (after 24h): Locked
    editOrLock: (() => {
      // Draft/proforma are always editable
      if (!isIssuedStatus && !isDeleted && canUpdate) {
        return {
          type: 'edit',
          enabled: true,
          tooltip: 'Edit Invoice',
          link: `/edit/${invoice.id}`,
        };
      }
      // Issued/sent invoices: check 24-hour window
      if (isIssuedStatus && !isDeleted && canUpdate && withinEditWindow) {
        const hoursRemaining = Math.ceil(24 - hoursSinceIssued);
        return {
          type: 'edit',
          enabled: true,
          tooltip: `Edit Invoice (${hoursRemaining}h remaining)`,
          link: `/edit/${invoice.id}`,
        };
      }
      // Locked: after 24h, deleted, cancelled, or no permission
      return {
        type: 'lock',
        enabled: false,
        tooltip: isDeleted
          ? 'Deleted invoice'
          : !canUpdate
            ? 'No permission to edit'
            : isIssuedStatus && !withinEditWindow
              ? 'Edit window expired (24h)'
              : invoice.status === 'cancelled'
                ? 'Cancelled invoice'
                : 'Invoice locked',
        link: null,
      };
    })(),
    edit: {
      enabled: canUpdate && !isDeleted && (!nonEditableStatuses.includes(invoice.status) || (isIssuedStatus && withinEditWindow)),
      tooltip: !canUpdate
        ? 'No permission to edit'
        : isDeleted
          ? 'Cannot edit deleted invoice'
          : isIssuedStatus && !withinEditWindow
            ? 'Edit window expired (24h)'
            : nonEditableStatuses.includes(invoice.status) && !withinEditWindow
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
        // Fully paid or issued invoices are considered complete - skip validation warning
        : (invoice.paymentStatus === 'paid' || ['issued', 'sent'].includes(invoice.status))
          ? 'Download PDF'
          : !validateInvoiceForDownload(invoice).isValid
            ? `Incomplete ${invoice.status === 'draft' ? 'draft' : invoice.status === 'proforma' ? 'proforma' : 'invoice'} - Click to see missing fields`
            : 'Download PDF',
      // Paid/issued invoices are always valid, otherwise check validation
      isValid: invoice.paymentStatus === 'paid' || ['issued', 'sent'].includes(invoice.status) || validateInvoiceForDownload(invoice).isValid,
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
      // Disable for deleted invoices
      // For fully paid invoices: only enable if reminders exist (view-only mode)
      enabled: !isDeleted && !(invoice.paymentStatus === 'paid' && (invoice.reminderCount === 0 || invoice.reminderCount === undefined)),
      tooltip: isDeleted
        ? 'Cannot add notes to deleted invoice'
        : invoice.paymentStatus === 'paid' && (invoice.reminderCount === 0 || invoice.reminderCount === undefined)
          ? 'No payment reminders for this paid invoice'
          : invoice.paymentStatus === 'paid'
            ? 'View Payment Reminder Notes (Read-only)'
            : 'Payment Reminder - Phone Call Notes',
      isViewOnly: invoice.paymentStatus === 'paid',
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

    // DEPRECATED: Use editOrLock and creditNote separately
    // Kept for backward compatibility
    primaryAction: (() => {
      // Draft/proforma or issued within 24h: Edit
      if (canUpdate && !isDeleted && (!nonEditableStatuses.includes(invoice.status) || (isIssuedStatus && withinEditWindow))) {
        return {
          type: 'edit',
          enabled: true,
          tooltip: 'Edit Invoice',
          link: `/edit/${invoice.id}`,
        };
      }
      // Locked
      return {
        type: 'lock',
        enabled: false,
        tooltip: 'Invoice locked',
        link: null,
      };
    })(),
  };
}
