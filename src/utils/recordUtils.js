/**
 * Record Utilities
 * Shared utilities for document records (Invoice, Credit Note, Quotation, PO, etc.)
 * Part of the unified Preview/Download system.
 */

/**
 * Check if a record is "new" based on creation timestamp.
 * @param {string|Date|Object} createdAt - The creation timestamp
 * @param {number} hoursThreshold - Hours to consider "new" (default: 2)
 * @returns {boolean}
 */
export const isNewRecord = (createdAt, hoursThreshold = 2) => {
  if (!createdAt) return false;

  let timeMs;

  if (typeof createdAt === "object" && createdAt.seconds) {
    timeMs = createdAt.seconds * 1000;
  } else if (createdAt instanceof Date) {
    timeMs = createdAt.getTime();
  } else {
    timeMs = new Date(createdAt).getTime();
  }

  if (isNaN(timeMs)) return false;

  const now = Date.now();
  const thresholdMs = hoursThreshold * 60 * 60 * 1000;

  return now - timeMs < thresholdMs;
};

/**
 * Validate a Credit Note for PDF download.
 * @param {Object} creditNote - The credit note object
 * @returns {{ isValid: boolean, missing: Object, warnings: string[] }}
 */
export const validateCreditNoteForDownload = (creditNote) => {
  const warnings = [];
  const missing = {
    invoice: false,
    items: false,
    reason: false,
    date: false,
  };

  // Check linked invoice
  const hasInvoice =
    creditNote.invoice_id ||
    creditNote.invoiceId ||
    (creditNote.invoice && (creditNote.invoice.id || creditNote.invoice.invoice_number));
  if (!hasInvoice) {
    missing.invoice = true;
    warnings.push("Linked Invoice");
  }

  // Check for items with actual returned quantities
  const hasValidItems =
    creditNote.items && creditNote.items.some((item) => (item.quantityReturned || item.quantity_returned || 0) > 0);
  const hasManualAmount = (creditNote.manual_credit_amount || creditNote.manualCreditAmount || 0) > 0;
  const hasTotalCredit = (creditNote.totalCredit || creditNote.total_credit || 0) > 0;

  if (!hasValidItems && !hasManualAmount && !hasTotalCredit) {
    missing.items = true;
    warnings.push("Items or Manual Credit Amount");
  }

  // Check reason
  const hasReason = creditNote.reason_for_return?.trim() || creditNote.reasonForReturn?.trim();
  if (!hasReason) {
    missing.reason = true;
    warnings.push("Reason for Return");
  }

  // Check date
  const hasDate = creditNote.credit_note_date || creditNote.creditNoteDate || creditNote.date;
  if (!hasDate) {
    missing.date = true;
    warnings.push("Credit Note Date");
  }

  return {
    isValid: warnings.length === 0,
    missing,
    warnings,
  };
};

/**
 * Validate a Quotation for PDF download.
 * @param {Object} quotation - The quotation object
 * @returns {{ isValid: boolean, missing: Object, warnings: string[] }}
 */
export const validateQuotationForDownload = (quotation) => {
  const warnings = [];
  const missing = {
    customer: false,
    items: false,
    date: false,
    validUntil: false,
  };

  // Check customer
  const hasCustomer =
    quotation.customer?.name?.trim() || quotation.customer_name?.trim() || quotation.customerName?.trim();
  if (!hasCustomer) {
    missing.customer = true;
    warnings.push("Customer");
  }

  // Check items - only validate if items exist
  const hasItems = quotation.items && quotation.items.length > 0;
  const hasValidItems =
    hasItems &&
    quotation.items.every(
      (item) =>
        (item.name?.trim() || item.product_name?.trim()) && item.quantity > 0 && (item.rate > 0 || item.unit_price > 0)
    );
  // Only show error if items exist but are malformed (not if items are missing)
  if (hasItems && !hasValidItems) {
    missing.items = true;
    warnings.push("Items (with name, quantity, and rate)");
  }

  // Check date
  const hasDate = quotation.quotation_date || quotation.quotationDate || quotation.date;
  if (!hasDate) {
    missing.date = true;
    warnings.push("Quotation Date");
  }

  // Check valid until
  const hasValidUntil = quotation.valid_until || quotation.validUntil;
  if (!hasValidUntil) {
    missing.validUntil = true;
    warnings.push("Valid Until Date");
  }

  return {
    isValid: warnings.length === 0,
    missing,
    warnings,
  };
};

/**
 * Validate a Purchase Order for PDF download.
 * @param {Object} purchaseOrder - The purchase order object
 * @returns {{ isValid: boolean, missing: Object, warnings: string[] }}
 */
export const validatePurchaseOrderForDownload = (purchaseOrder) => {
  const warnings = [];
  const missing = {
    supplier: false,
    items: false,
    date: false,
    expectedDelivery: false,
  };

  // Check supplier
  const hasSupplier =
    purchaseOrder.supplier?.name?.trim() || purchaseOrder.supplier_name?.trim() || purchaseOrder.supplierName?.trim();
  if (!hasSupplier) {
    missing.supplier = true;
    warnings.push("Supplier");
  }

  // Check items
  const hasItems = purchaseOrder.items && purchaseOrder.items.length > 0;
  const hasValidItems =
    hasItems &&
    purchaseOrder.items.every(
      (item) =>
        (item.name?.trim() || item.product_name?.trim()) && item.quantity > 0 && (item.rate > 0 || item.unit_price > 0)
    );
  if (!hasItems || !hasValidItems) {
    missing.items = true;
    warnings.push("Items (with name, quantity, and rate)");
  }

  // Check PO date
  const hasDate = purchaseOrder.po_date || purchaseOrder.poDate || purchaseOrder.date;
  if (!hasDate) {
    missing.date = true;
    warnings.push("PO Date");
  }

  // Check expected delivery
  const hasExpectedDelivery =
    purchaseOrder.expected_delivery_date || purchaseOrder.expectedDeliveryDate || purchaseOrder.expected_delivery;
  if (!hasExpectedDelivery) {
    missing.expectedDelivery = true;
    warnings.push("Expected Delivery Date");
  }

  return {
    isValid: warnings.length === 0,
    missing,
    warnings,
  };
};

/**
 * Validate a Delivery Note for PDF download.
 * @param {Object} deliveryNote - The delivery note object
 * @returns {{ isValid: boolean, missing: Object, warnings: string[] }}
 */
export const validateDeliveryNoteForDownload = (deliveryNote) => {
  const warnings = [];
  const missing = {
    invoice: false,
    items: false,
    date: false,
    vehicle: false,
  };

  // Check linked invoice
  const hasInvoice =
    deliveryNote.invoice_id || deliveryNote.invoiceId || deliveryNote.invoiceNumber || deliveryNote.invoice_number;
  if (!hasInvoice) {
    missing.invoice = true;
    warnings.push("Linked Invoice");
  }

  // Check items
  const hasItems = deliveryNote.items && deliveryNote.items.length > 0;
  if (!hasItems) {
    missing.items = true;
    warnings.push("Delivery Items");
  }

  // Check delivery date
  const hasDate = deliveryNote.delivery_date || deliveryNote.deliveryDate || deliveryNote.date;
  if (!hasDate) {
    missing.date = true;
    warnings.push("Delivery Date");
  }

  // Check vehicle (optional but recommended)
  const hasVehicle = deliveryNote.vehicle_number || deliveryNote.vehicleNumber;
  if (!hasVehicle) {
    missing.vehicle = true;
    warnings.push("Vehicle Number (recommended)");
  }

  return {
    isValid: warnings.length === 0 || (warnings.length === 1 && missing.vehicle), // Vehicle is optional
    missing,
    warnings,
  };
};

/**
 * Validate an Account Statement for PDF download.
 * @param {Object} statement - The account statement object
 * @returns {{ isValid: boolean, missing: Object, warnings: string[] }}
 */
export const validateAccountStatementForDownload = (statement) => {
  const warnings = [];
  const missing = {
    customer: false,
    dateRange: false,
    statementNumber: false,
  };

  // Check customer
  const hasCustomer =
    statement.customer_id || statement.customerId || statement.customerName || statement.customer_name;
  if (!hasCustomer) {
    missing.customer = true;
    warnings.push("Customer Information");
  }

  // Check date range
  const hasFromDate = statement.from_date || statement.fromDate;
  const hasToDate = statement.to_date || statement.toDate;
  if (!hasFromDate || !hasToDate) {
    missing.dateRange = true;
    warnings.push("Statement Period");
  }

  // Check statement number
  const hasStatementNumber = statement.statement_number || statement.statementNumber;
  if (!hasStatementNumber) {
    missing.statementNumber = true;
    warnings.push("Statement Number");
  }

  return {
    isValid: warnings.length === 0,
    missing,
    warnings,
  };
};

/**
 * Validate an Invoice for PDF download (matches existing InvoiceList pattern).
 * @param {Object} invoice - The invoice object
 * @returns {{ isValid: boolean, missing: Object, warnings: string[] }}
 */
export const validateInvoiceForDownload = (invoice) => {
  const warnings = [];
  const missing = {
    customer: false,
    items: false,
    date: false,
    dueDate: false,
  };

  // Check customer
  const hasCustomer = invoice.customer?.name?.trim();
  if (!hasCustomer) {
    missing.customer = true;
    warnings.push("Customer");
  }

  // Check items
  const hasItems = invoice.items && invoice.items.length > 0;
  const hasValidItems =
    hasItems && invoice.items.every((item) => item.name?.trim() && item.quantity > 0 && item.rate > 0);
  if (!hasItems || !hasValidItems) {
    missing.items = true;
    warnings.push("Items (with name, quantity, and rate)");
  }

  // Check date
  if (!invoice.date) {
    missing.date = true;
    warnings.push("Invoice Date");
  }

  // Check due date
  if (!invoice.dueDate && !invoice.due_date) {
    missing.dueDate = true;
    warnings.push("Due Date");
  }

  return {
    isValid: warnings.length === 0,
    missing,
    warnings,
  };
};

/**
 * Generic download handler for PDFs.
 * @param {Object} options
 * @param {string} options.url - API endpoint URL
 * @param {string} options.filename - Download filename
 * @param {Function} options.onStart - Called when download starts
 * @param {Function} options.onSuccess - Called on success
 * @param {Function} options.onError - Called on error
 * @param {Function} options.onFinally - Called after completion
 */
export const downloadPDF = async ({ url, filename, onStart, onSuccess, onError, onFinally }) => {
  try {
    if (onStart) onStart();

    const { apiClient } = await import("../services/api");
    const response = await apiClient.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response], { type: "application/pdf" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    if (onSuccess) onSuccess();
    return true;
  } catch (error) {
    console.error("PDF download error:", error);
    if (onError) onError(error);
    return false;
  } finally {
    if (onFinally) onFinally();
  }
};
