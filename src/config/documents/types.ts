// ═══════════════════════════════════════════════════════════════
// DOCUMENT FORM UNIFICATION - TYPE DEFINITIONS
// Single source of truth for all document form types
// ═══════════════════════════════════════════════════════════════

import { ComponentType } from 'react';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT STATE MODEL (Canonical Shape - Rule 2)
// ═══════════════════════════════════════════════════════════════

export interface DocumentState {
  header: DocumentHeader;
  party: DocumentParty;
  lines: LineItem[];
  charges: ChargeItem[];
  discount: DocumentDiscount;
  totals: DocumentTotals;
  notes: DocumentNotes;
  meta: DocumentMeta;
}

export interface DocumentHeader {
  docNumber: string;
  date: string;
  dueDate: string | null;
  currency: string;
  exchangeRate: number;
  reference: string | null;
  paymentTerms: string | null;
  emirate: string | null;
  // Vendor Bill specific
  vendorInvoiceNumber?: string | null;
  vatCategory?: string | null;
  // Quotation specific
  deliveryTerms?: string | null;
}

export interface DocumentParty {
  id: number | null;
  type: 'customer' | 'vendor';
  name: string;
  company: string | null;
  trn: string | null;
  email: string | null;
  phone: string | null;
  address: PartyAddress;
}

export interface PartyAddress {
  street: string;
  city: string;
  emirate: string;
  country: string;
  postalCode: string | null;
}

export interface LineItem {
  id: string;                    // Temp ID for UI (Rule 12)
  productId: number | null;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  vatRate: number;
  vatAmount: number;
  discountPercent: number;
  discountAmount: number;
}

export interface ChargeItem {
  type: 'packing' | 'freight' | 'insurance' | 'loading' | 'other';
  label: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
}

export interface DocumentDiscount {
  type: 'amount' | 'percent';
  value: number;
}

export interface DocumentTotals {
  subtotal: number;
  discountAmount: number;
  chargesTotal: number;
  chargesVat: number;
  vatAmount: number;
  total: number;
  totalAed: number;            // For foreign currency
}

export interface DocumentNotes {
  customerNotes: string;
  internalNotes: string;
  termsAndConditions: string;
}

export interface DocumentMeta {
  id?: number;
  status: DocumentStatus;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  isLocked: boolean;
}

export type DocumentStatus = 'draft' | 'approved' | 'issued' | 'cancelled' | 'sent' | 'accepted' | 'rejected';

// ═══════════════════════════════════════════════════════════════
// CONFIG INTERFACES (Declarative Only - Rule 1)
// ═══════════════════════════════════════════════════════════════

export type DocumentType = 'invoice' | 'quotation' | 'purchaseOrder' | 'vendorBill';
export type PartyType = 'customer' | 'vendor';

export interface DocumentFormConfig {
  configVersion: number;         // For migrations (Rule 15)

  // Identity
  documentType: DocumentType;
  documentLabel: string;         // "Invoice", "Purchase Order", etc.
  documentLabelPlural: string;   // "Invoices", "Purchase Orders", etc.
  numberPrefix: string;          // "INV", "QTN", "PO", "VB"
  listRoute: string;             // "/invoices", "/purchase-orders"

  // Party Configuration
  partyType: PartyType;
  partyLabel: string;            // "Customer" or "Vendor"
  partyLabelPlural: string;

  // Feature Flags (Rule 8 - Explicit & Typed)
  features: DocumentFeatureFlags;

  // Field Configuration
  headerFields: FieldConfig[];
  lineItemColumns: ColumnConfig[];
  chargeTypes: ChargeTypeConfig[];

  // Defaults (Rule 11 - Explicit behavior for hidden fields)
  defaults: DocumentDefaults;

  // Escape Hatches (Rule 7)
  slots?: DocumentSlots;
  overrides?: DocumentOverrides;
}

export interface DocumentFeatureFlags {
  // Party
  enablePartySearch: boolean;
  enablePartyCreate: boolean;

  // Header
  enableDueDate: boolean;
  enablePaymentTerms: boolean;
  enableCurrency: boolean;
  enableExchangeRate: boolean;
  enableEmirate: boolean;
  enableReference: boolean;

  // Line Items
  enableQuickAdd: boolean;
  enableDragReorder: boolean;
  enableBulkActions: boolean;
  enableProductSearch: boolean;
  enableLineDiscount: boolean;
  enableLineVat: boolean;

  // Charges
  enableAdditionalCharges: boolean;

  // Totals
  enableInvoiceDiscount: boolean;
  enableVat: boolean;

  // Actions
  enablePreview: boolean;
  enablePdfDownload: boolean;
  enableDuplicate: boolean;

  // Special (Invoice-only by default)
  enableLocking: boolean;
  enableStockAllocation: boolean;
  enableSourceType: boolean;

  // Notes
  enableCustomerNotes: boolean;
  enableInternalNotes: boolean;
  enableTermsAndConditions: boolean;
  enableAttachments: boolean;
}

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  visible: boolean;
  editable: boolean;
  defaultValue?: unknown;
  options?: SelectOption[];  // For select type
  placeholder?: string;
  helpText?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export type ColumnAlign = 'left' | 'center' | 'right';
export type ColumnFormat = 'currency' | 'number' | 'percent';

export interface ColumnConfig {
  key: string;
  label: string;
  width: string;
  visible: boolean;
  editable: boolean;
  align: ColumnAlign;
  format?: ColumnFormat;
}

export interface ChargeTypeConfig {
  key: string;
  label: string;
  enabled: boolean;
  defaultVatRate: number;
}

export interface DocumentDefaults {
  currency: string;
  exchangeRate: number;
  vatRate: number;
  paymentTerms: string | null;
  emirate: string | null;
  status: DocumentStatus;
}

// ═══════════════════════════════════════════════════════════════
// ESCAPE HATCHES (Rule 7)
// ═══════════════════════════════════════════════════════════════

export interface SlotProps {
  document: DocumentState;
  config: DocumentFormConfig;
  setDocument: (updates: Partial<DocumentState>) => void;
}

export interface DocumentSlots {
  afterHeader?: ComponentType<SlotProps>;
  beforeLineItems?: ComponentType<SlotProps>;
  afterLineItems?: ComponentType<SlotProps>;
  beforeTotals?: ComponentType<SlotProps>;
  afterTotals?: ComponentType<SlotProps>;
  beforeNotes?: ComponentType<SlotProps>;
}

export interface DocumentOverrides {
  lineColumns?: Partial<ColumnConfig>[];
  partyFields?: Partial<FieldConfig>[];
  customValidators?: ValidatorFn[];
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION INTERFACES (Rule 10)
// ═══════════════════════════════════════════════════════════════

export type ValidationLevel = 'field' | 'cross-field' | 'business';

export interface ValidationError {
  level: ValidationLevel;
  field?: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export type ValidatorFn = (doc: DocumentState, config: DocumentFormConfig) => ValidationError[];

// ═══════════════════════════════════════════════════════════════
// CALCULATOR INTERFACES (Rule 6)
// ═══════════════════════════════════════════════════════════════

export type RoundingMode = 'per-line' | 'invoice-level';

export interface CalculatorOptions {
  vatInclusive: boolean;
  roundingMode: RoundingMode;
  currencyPrecision: number;
  discountBeforeVat: boolean;
}

export interface LineCalculation {
  amount: number;
  vatAmount: number;
  discountAmount: number;
  netAmount: number;
}

export interface CalculatorResult {
  lineAmounts: LineCalculation[];
  subtotal: number;
  discountAmount: number;
  chargesTotal: number;
  chargesVat: number;
  vatAmount: number;
  total: number;
  totalAed: number;
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER INTERFACES (Rule 9)
// ═══════════════════════════════════════════════════════════════

export interface DocumentAdapter<TApiResponse = unknown, TApiPayload = unknown> {
  toForm(apiResponse: TApiResponse): DocumentState;
  fromForm(document: DocumentState): TApiPayload;
}

// ═══════════════════════════════════════════════════════════════
// SERVICE INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface SaveResult {
  success: boolean;
  id?: number;
  docNumber?: string;
  error?: string;
}

export interface DocumentService {
  save(documentType: DocumentType, document: DocumentState, adapter: DocumentAdapter): Promise<SaveResult>;
  load(documentType: DocumentType, id: number, adapter: DocumentAdapter): Promise<DocumentState>;
  approve(documentType: DocumentType, id: number): Promise<void>;
  cancel(documentType: DocumentType, id: number, reason: string): Promise<void>;
  duplicate(documentType: DocumentType, id: number, adapter: DocumentAdapter): Promise<DocumentState>;
}

// ═══════════════════════════════════════════════════════════════
// HOOK RETURN TYPES
// ═══════════════════════════════════════════════════════════════

export interface UseDocumentStateReturn {
  document: DocumentState;
  setDocument: (updates: Partial<DocumentState>) => void;
  setHeader: (updates: Partial<DocumentHeader>) => void;
  setParty: (party: DocumentParty) => void;
  addLine: (line?: Partial<LineItem>) => void;
  updateLine: (index: number, updates: Partial<LineItem>) => void;
  removeLine: (index: number) => void;
  reorderLines: (fromIndex: number, toIndex: number) => void;
  setCharge: (type: string, amount: number) => void;
  setDiscount: (discount: DocumentDiscount) => void;
  setNotes: (updates: Partial<DocumentNotes>) => void;
  resetDocument: () => void;
  isDirty: boolean;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const DOCUMENT_TYPES: DocumentType[] = ['invoice', 'quotation', 'purchaseOrder', 'vendorBill'];
export const PARTY_TYPES: PartyType[] = ['customer', 'vendor'];

export const DEFAULT_VAT_RATE = 5;
export const DEFAULT_CURRENCY = 'AED';
export const DEFAULT_EXCHANGE_RATE = 1;
