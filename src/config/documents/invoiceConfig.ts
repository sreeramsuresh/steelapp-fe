// ═══════════════════════════════════════════════════════════════
// INVOICE CONFIG - Full Feature Set
// All features enabled: charges, discounts, VAT, locking, stock allocation
// ═══════════════════════════════════════════════════════════════

import { DocumentFormConfig } from './types';

export const invoiceConfig: DocumentFormConfig = {
  configVersion: 1,

  // Identity
  documentType: 'invoice',
  documentLabel: 'Invoice',
  documentLabelPlural: 'Invoices',
  numberPrefix: 'INV',
  listRoute: '/invoices',

  // Party Configuration
  partyType: 'customer',
  partyLabel: 'Customer',
  partyLabelPlural: 'Customers',

  // Feature Flags (Rule 8 - All explicit)
  features: {
    // Party
    enablePartySearch: true,
    enablePartyCreate: true,

    // Header
    enableDueDate: true,
    enablePaymentTerms: true,
    enableCurrency: true,
    enableExchangeRate: true,
    enableEmirate: true,
    enableReference: true,

    // Line Items
    enableQuickAdd: true,
    enableDragReorder: true,
    enableBulkActions: true,
    enableProductSearch: true,
    enableLineDiscount: true,
    enableLineVat: true,

    // Charges
    enableAdditionalCharges: true,

    // Totals
    enableInvoiceDiscount: true,
    enableVat: true,

    // Actions
    enablePreview: true,
    enablePdfDownload: true,
    enableDuplicate: true,

    // Special (Invoice-only)
    enableLocking: true,
    enableStockAllocation: true,
    enableSourceType: false,

    // Notes
    enableCustomerNotes: true,
    enableInternalNotes: true,
    enableTermsAndConditions: true,
    enableAttachments: false,
  },

  // Header Fields Configuration
  headerFields: [
    {
      key: 'docNumber',
      label: 'Invoice Number',
      type: 'text',
      required: true,
      visible: true,
      editable: false, // Auto-generated
    },
    {
      key: 'date',
      label: 'Invoice Date',
      type: 'date',
      required: true,
      visible: true,
      editable: true,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
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
      key: 'emirate',
      label: 'Place of Supply (Emirate)',
      type: 'select',
      required: true,
      visible: true,
      editable: true,
      options: [
        { value: 'Abu Dhabi', label: 'Abu Dhabi' },
        { value: 'Dubai', label: 'Dubai' },
        { value: 'Sharjah', label: 'Sharjah' },
        { value: 'Ajman', label: 'Ajman' },
        { value: 'Umm Al Quwain', label: 'Umm Al Quwain' },
        { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
        { value: 'Fujairah', label: 'Fujairah' },
      ],
    },
    {
      key: 'reference',
      label: 'Reference',
      type: 'text',
      required: false,
      visible: true,
      editable: true,
      placeholder: 'PO Number, Project Code, etc.',
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
      width: '20%',
      visible: true,
      editable: true,
      align: 'left',
    },
    {
      key: 'quantity',
      label: 'Qty',
      width: '8%',
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
      width: '10%',
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
      width: '10%',
      visible: true,
      editable: false,
      align: 'right',
      format: 'currency',
    },
    {
      key: 'vatRate',
      label: 'VAT %',
      width: '8%',
      visible: true,
      editable: true,
      align: 'right',
      format: 'percent',
    },
    {
      key: 'vatAmount',
      label: 'VAT',
      width: '8%',
      visible: true,
      editable: false,
      align: 'right',
      format: 'currency',
    },
  ],

  // Charge Types Configuration
  chargeTypes: [
    {
      key: 'packing',
      label: 'Packing Charges',
      enabled: true,
      defaultVatRate: 5,
    },
    {
      key: 'freight',
      label: 'Freight Charges',
      enabled: true,
      defaultVatRate: 5,
    },
    {
      key: 'insurance',
      label: 'Insurance',
      enabled: true,
      defaultVatRate: 5,
    },
    {
      key: 'loading',
      label: 'Loading Charges',
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
    emirate: 'Dubai',
    status: 'draft',
  },

  // Slots (Rule 7 - Placeholder for StockAllocationPanel)
  slots: {
    afterLineItems: undefined, // TODO: StockAllocationPanel component
  },

  // Overrides
  overrides: {
    customValidators: [],
  },
};
