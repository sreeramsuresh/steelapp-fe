// ═══════════════════════════════════════════════════════════════
// VENDOR BILL CONFIG - VAT Input Document
// For recording vendor invoices (input tax credit)
// NO line discount, NO charges section, simplified
// ═══════════════════════════════════════════════════════════════

import { DocumentFormConfig } from './types';

export const vendorBillConfig: DocumentFormConfig = {
  configVersion: 1,

  // Identity
  documentType: 'vendorBill',
  documentLabel: 'Vendor Bill',
  documentLabelPlural: 'Vendor Bills',
  numberPrefix: 'VB',
  listRoute: '/vendor-bills',

  // Party Configuration (Vendor)
  partyType: 'vendor',
  partyLabel: 'Vendor',
  partyLabelPlural: 'Vendors',

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
    enableEmirate: true, // For place of supply (input VAT determination)
    enableReference: true,

    // Line Items
    enableQuickAdd: true,
    enableDragReorder: true,
    enableBulkActions: true,
    enableProductSearch: true,
    enableLineDiscount: false, // Vendor bills don't typically have line discounts
    enableLineVat: true,

    // Charges (Disabled for vendor bills - charges included in line items)
    enableAdditionalCharges: false,

    // Totals
    enableInvoiceDiscount: false, // No invoice-level discount
    enableVat: true,

    // Actions
    enablePreview: true,
    enablePdfDownload: true,
    enableDuplicate: true,

    // Special
    enableLocking: false,
    enableStockAllocation: false,
    enableSourceType: false,

    // Notes
    enableCustomerNotes: false, // Not relevant for vendor bills
    enableInternalNotes: true,
    enableTermsAndConditions: false,
    enableAttachments: false,
  },

  // Header Fields Configuration
  headerFields: [
    {
      key: 'docNumber',
      label: 'Bill Number (Internal)',
      type: 'text',
      required: true,
      visible: true,
      editable: false, // Auto-generated
    },
    {
      key: 'vendorInvoiceNumber',
      label: 'Vendor Invoice Number',
      type: 'text',
      required: true,
      visible: true,
      editable: true,
      placeholder: 'Invoice number from vendor',
      helpText: 'Enter the invoice number from the vendor document',
    },
    {
      key: 'date',
      label: 'Bill Date',
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
      key: 'vatCategory',
      label: 'VAT Category',
      type: 'select',
      required: true,
      visible: true,
      editable: true,
      options: [
        { value: 'standard', label: 'Standard (5%)' },
        { value: 'zero', label: 'Zero Rated (0%)' },
        { value: 'exempt', label: 'Exempt' },
        { value: 'out_of_scope', label: 'Out of Scope' },
      ],
      helpText: 'VAT category for input tax credit',
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
      helpText: 'Emirate where goods/services were supplied',
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
      placeholder: 'PO Number, Project Code, etc.',
    },
  ],

  // Line Item Columns Configuration (No discount column)
  lineItemColumns: [
    {
      key: 'productName',
      label: 'Product/Service',
      width: '30%',
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
      key: 'amount',
      label: 'Amount',
      width: '12%',
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
      width: '10%',
      visible: true,
      editable: false,
      align: 'right',
      format: 'currency',
    },
  ],

  // Charge Types Configuration (Empty - charges not used)
  chargeTypes: [],

  // Defaults (Rule 11 - Explicit defaults)
  defaults: {
    currency: 'AED',
    exchangeRate: 1,
    vatRate: 5,
    paymentTerms: null,
    emirate: 'Dubai',
    status: 'draft',
  },

  // Slots (afterHeader for LinkedPurchaseOrderPanel placeholder)
  slots: {
    afterHeader: undefined, // TODO: LinkedPurchaseOrderPanel component
  },

  // Overrides
  overrides: {
    customValidators: [],
  },
};
