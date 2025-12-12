// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDER CONFIG - Vendor-focused (No Emirate, Simplified Charges)
// For ordering from vendors/suppliers
// ═══════════════════════════════════════════════════════════════

import { DocumentFormConfig } from './types';

export const purchaseOrderConfig: DocumentFormConfig = {
  configVersion: 1,

  // Identity
  documentType: 'purchaseOrder',
  documentLabel: 'Purchase Order',
  documentLabelPlural: 'Purchase Orders',
  numberPrefix: 'PO',
  listRoute: '/purchase-orders',

  // Party Configuration (Vendor instead of Customer)
  partyType: 'vendor',
  partyLabel: 'Vendor',
  partyLabelPlural: 'Vendors',

  // Feature Flags (Rule 8 - All explicit)
  features: {
    // Party
    enablePartySearch: true,
    enablePartyCreate: true,

    // Header
    enableDueDate: true, // Used as "Expected Delivery"
    enablePaymentTerms: true,
    enableCurrency: true,
    enableExchangeRate: true,
    enableEmirate: false, // Not needed for PO
    enableReference: true,

    // Line Items
    enableQuickAdd: true,
    enableDragReorder: true,
    enableBulkActions: true,
    enableProductSearch: true,
    enableLineDiscount: true,
    enableLineVat: true,

    // Charges (Simplified - just freight and other)
    enableAdditionalCharges: true,

    // Totals
    enableInvoiceDiscount: true,
    enableVat: true,

    // Actions
    enablePreview: true,
    enablePdfDownload: true,
    enableDuplicate: true,

    // Special (No locking or stock allocation for PO)
    enableLocking: false,
    enableStockAllocation: false,
    enableSourceType: false,

    // Notes
    enableCustomerNotes: true, // Vendor notes
    enableInternalNotes: true,
    enableTermsAndConditions: true,
    enableAttachments: false,
  },

  // Header Fields Configuration
  headerFields: [
    {
      key: 'docNumber',
      label: 'PO Number',
      type: 'text',
      required: true,
      visible: true,
      editable: false, // Auto-generated
    },
    {
      key: 'date',
      label: 'PO Date',
      type: 'date',
      required: true,
      visible: true,
      editable: true,
    },
    {
      key: 'dueDate',
      label: 'Expected Delivery', // Different label for PO
      type: 'date',
      required: false,
      visible: true,
      editable: true,
    },
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      required: true,
      visible: true,
      editable: true,
      options: [
        { value: 'AED', label: 'AED' },
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'GBP', label: 'GBP' },
      ],
    },
    {
      key: 'exchangeRate',
      label: 'Exchange Rate',
      type: 'number',
      required: true,
      visible: true,
      editable: true,
    },
    {
      key: 'paymentTerms',
      label: 'Payment Terms',
      type: 'select',
      required: false,
      visible: true,
      editable: true,
      options: [
        { value: 'immediate', label: 'Immediate' },
        { value: 'net_7', label: 'Net 7' },
        { value: 'net_15', label: 'Net 15' },
        { value: 'net_30', label: 'Net 30' },
        { value: 'net_60', label: 'Net 60' },
        { value: 'net_90', label: 'Net 90' },
      ],
    },
    {
      key: 'reference',
      label: 'Reference',
      type: 'text',
      required: false,
      visible: true,
      editable: true,
      placeholder: 'Vendor Quote Number, Project Code, etc.',
    },
  ],

  // Line Item Columns Configuration
  lineItemColumns: [
    {
      key: 'productName',
      label: 'Product',
      width: '25%',
      visible: true,
      editable: true,
      align: 'left',
    },
    {
      key: 'description',
      label: 'Description',
      width: '25%',
      visible: true,
      editable: true,
      align: 'left',
    },
    {
      key: 'quantity',
      label: 'Qty',
      width: '10%',
      visible: true,
      editable: true,
      align: 'right',
      format: 'number',
    },
    {
      key: 'unit',
      label: 'Unit',
      width: '8%',
      visible: true,
      editable: true,
      align: 'center',
    },
    {
      key: 'rate',
      label: 'Rate',
      width: '12%',
      visible: true,
      editable: true,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'discountPercent',
      label: 'Disc %',
      width: '8%',
      visible: true,
      editable: true,
      align: 'right',
      format: 'percent',
    },
    {
      key: 'amount',
      label: 'Amount',
      width: '12%',
      visible: true,
      editable: false,
      align: 'right',
      format: 'currency',
    },
  ],

  // Charge Types Configuration (Simplified for PO)
  chargeTypes: [
    {
      key: 'freight',
      label: 'Freight Charges',
      enabled: true,
      defaultVatRate: 5,
    },
    {
      key: 'other',
      label: 'Other Charges',
      enabled: true,
      defaultVatRate: 5,
    },
  ],

  // Defaults (Rule 11 - Explicit defaults)
  defaults: {
    currency: 'AED',
    exchangeRate: 1,
    vatRate: 5,
    paymentTerms: null,
    emirate: null, // Not used for PO
    status: 'draft',
  },

  // Slots (No special slots for PO)
  slots: {},

  // Overrides
  overrides: {
    customValidators: [],
  },
};
