/**
 * Field Tooltips Utility
 * Provides helpful explanations for common form fields across the application
 * Supports bug #21: Missing labels/tooltips
 */

export const fieldTooltips = {
  // Customer fields
  customerName: "The primary name for the customer in your business records",
  customerEmail: "Customer email address for invoicing and communication",
  customerPhone: "Primary contact phone number",
  vatNumber: "VAT registration number (TRN) for UAE tax compliance",
  creditLimit: "Maximum credit amount the customer can have outstanding at any time",
  paymentTerms: "Number of days the customer has to pay (e.g., 30 days)",

  // Invoice fields
  invoiceDate: "The date the invoice was issued",
  dueDate: "The date payment is due for this invoice",
  invoiceStatus: "Draft (unsent), Proforma (quote), or Issued (final invoice)",
  supplyType: "Standard (5% VAT), Zero-rated, or Exempt for UAE tax",

  // Product fields
  productName: "Unique name or code for the product",
  unitPrice: "Price per unit of measurement (kg, mt, piece, etc.)",
  quantity: "Number of units being sold",

  // Purchase Order fields
  poDate: "Date the purchase order was created",
  supplierName: "Name of the supplier providing the goods",
  expectedDelivery: "Expected delivery date from supplier",

  // Container fields
  containerNumber: "Unique container identification number (e.g., TCLU1234567)",
  billOfLading: "Shipping reference number for the container",
  customsClearanceStatus: "Current status of customs clearance process",

  // Financial fields
  currency: "Currency used for all monetary values in this transaction",
  totalAmount: "Sum of all line items including charges and taxes",
  discountPercentage: "Percentage discount applied to the total",
};

/**
 * Get tooltip for a field
 * @param {string} fieldName - The field name to get tooltip for
 * @returns {string} - The tooltip text, or empty string if not found
 */
export const getFieldTooltip = (fieldName) => {
  return fieldTooltips[fieldName] || "";
};

/**
 * Get all available field names that have tooltips
 * @returns {string[]} - Array of field names with tooltips
 */
export const getAvailableTooltipFields = () => {
  return Object.keys(fieldTooltips);
};
