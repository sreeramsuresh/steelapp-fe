/**
 * Frontend Invoice Data Normalizer
 * FAIL-SAFE: Validates and normalizes invoice data from API
 * Logs errors to console (and optionally to Sentry) when data format is wrong
 * 
 * @typedef {import('../types/invoice').Invoice} Invoice
 */

/**
 * Normalize invoice data from API response
 * @param {Object} invoice - Raw invoice data from API
 * @param {string} source - Source of the data (e.g., 'list', 'detail', 'create')
 * @returns {Invoice|null} Normalized invoice with validated types
 */
export function normalizeInvoice(invoice, source = 'unknown') {
  if (!invoice || typeof invoice !== 'object') {
    console.error(`❌ [Invoice Normalizer] Invalid invoice data from ${source}:`, invoice);
    return null;
  }

  const normalized = { ...invoice };
  const errors = [];

  // Validate invoice number
  if (typeof invoice.invoiceNumber !== 'string') {
    errors.push(`invoiceNumber should be string, got ${typeof invoice.invoiceNumber}`);
    normalized.invoiceNumber = String(invoice.invoiceNumber || '');
  }

  // Validate invoice date
  if (invoice.invoiceDate !== null && invoice.invoiceDate !== undefined) {
    if (typeof invoice.invoiceDate !== 'string') {
      errors.push(`invoiceDate should be ISO string or null, got ${typeof invoice.invoiceDate}: ${JSON.stringify(invoice.invoiceDate)}`);
      // Attempt recovery if it's a Timestamp object
      if (invoice.invoiceDate?.seconds) {
        normalized.invoiceDate = new Date(parseInt(invoice.invoiceDate.seconds) * 1000).toISOString();
        console.warn(`⚠️ [Invoice Normalizer] Recovered Timestamp for invoiceDate`);
      } else {
        normalized.invoiceDate = null;
      }
    } else {
      // Validate it's a valid date string
      if (isNaN(Date.parse(invoice.invoiceDate))) {
        errors.push(`invoiceDate is not a valid date string: ${invoice.invoiceDate}`);
        normalized.invoiceDate = null;
      }
    }
  }

  // Validate due date
  if (invoice.dueDate !== null && invoice.dueDate !== undefined) {
    if (typeof invoice.dueDate !== 'string') {
      errors.push(`dueDate should be ISO string or null, got ${typeof invoice.dueDate}: ${JSON.stringify(invoice.dueDate)}`);
      // Attempt recovery if it's a Timestamp object
      if (invoice.dueDate?.seconds) {
        normalized.dueDate = new Date(parseInt(invoice.dueDate.seconds) * 1000).toISOString();
        console.warn(`⚠️ [Invoice Normalizer] Recovered Timestamp for dueDate`);
      } else {
        normalized.dueDate = null;
      }
    } else {
      // Validate it's a valid date string
      if (isNaN(Date.parse(invoice.dueDate))) {
        errors.push(`dueDate is not a valid date string: ${invoice.dueDate}`);
        normalized.dueDate = null;
      }
    }
  }

  // Validate customer details
  if (invoice.customerDetails !== null && invoice.customerDetails !== undefined) {
    if (typeof invoice.customerDetails !== 'object') {
      errors.push(`customerDetails should be object or null, got ${typeof invoice.customerDetails}`);
      normalized.customerDetails = null;
    } else if (invoice.customerDetails.name && typeof invoice.customerDetails.name !== 'string') {
      errors.push(`customerDetails.name should be string, got ${typeof invoice.customerDetails.name}`);
    }
  }

  // Validate numeric fields
  const numericFields = ['total', 'subtotal', 'vatAmount', 'received', 'outstanding'];
  numericFields.forEach(field => {
    if (invoice[field] !== null && invoice[field] !== undefined) {
      if (typeof invoice[field] !== 'number') {
        errors.push(`${field} should be number, got ${typeof invoice[field]}`);
        normalized[field] = parseFloat(invoice[field]) || 0;
      }
    }
  });

  // Log errors if any
  if (errors.length > 0) {
    console.error(`❌ [Invoice Normalizer] Data validation errors from ${source}:`);
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('   Raw data:', invoice);
    
    // TODO: Send to Sentry/error tracking
    // if (window.Sentry) {
    //   window.Sentry.captureMessage('Invoice data validation failed', {
    //     level: 'error',
    //     extra: { source, errors, invoice }
    //   });
    // }
  }

  return normalized;
}

/**
 * Normalize array of invoices
 * @param {Object[]} invoices - Raw invoice array from API
 * @param {string} source - Source of the data
 * @returns {Invoice[]} Array of normalized invoices
 */
export function normalizeInvoices(invoices, source = 'list') {
  if (!Array.isArray(invoices)) {
    console.error(`❌ [Invoice Normalizer] Expected array, got ${typeof invoices}`);
    return [];
  }

  return invoices
    .map((invoice, index) => normalizeInvoice(invoice, `${source}[${index}]`))
    .filter(invoice => invoice !== null);
}
