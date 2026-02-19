/**
 * UAE VAT Compliance Dashboard Widgets
 *
 * Export file for all VAT-related dashboard widgets
 * These widgets support UAE Federal Tax Authority (FTA) compliance requirements
 *
 * Standard VAT Rate: 5%
 * VAT Return Form: 201
 * TRN Format: 15 digits (100XXXXXXXXXXXX)
 */

// Widget components are lazy-loaded via LazyWidgets.jsx and DashboardV2.jsx.
// Static re-exports removed to prevent defeating dynamic import() code-splitting.
// Use: import { LazyVATCollectionWidget } from '../LazyWidgets';

// Dynamic widget factory for programmatic loading
export const VATWidgets = {
  VATCollectionWidget: () => import("./VATCollectionWidget"),
  VATReturnStatusWidget: () => import("./VATReturnStatusWidget"),
  VATComplianceAlertsWidget: () => import("./VATComplianceAlertsWidget"),
  DesignatedZoneWidget: () => import("./DesignatedZoneWidget"),
  ZeroRatedExportsWidget: () => import("./ZeroRatedExportsWidget"),
  ReverseChargeWidget: () => import("./ReverseChargeWidget"),
  VATReconciliationWidget: () => import("./VATReconciliationWidget"),
  TRNValidationWidget: () => import("./TRNValidationWidget"),
};

/**
 * Widget Configuration for Dashboard Layout
 * Use this for configurable dashboard implementations
 */
export const VAT_WIDGET_CONFIG = {
  VATCollectionWidget: {
    id: "vat-collection",
    name: "VAT Collection",
    description: "Output/Input VAT summary with net position",
    priority: "high",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-core",
  },
  VATReturnStatusWidget: {
    id: "vat-return-status",
    name: "VAT Return Status",
    description: "Form 201 submission status tracker",
    priority: "high",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-core",
  },
  VATComplianceAlertsWidget: {
    id: "vat-compliance-alerts",
    name: "Compliance Alerts",
    description: "Compliance issues and alerts",
    priority: "high",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-compliance",
  },
  DesignatedZoneWidget: {
    id: "designated-zones",
    name: "Designated Zones",
    description: "JAFZA/DAFZA zone transactions",
    priority: "medium",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-special",
  },
  ZeroRatedExportsWidget: {
    id: "zero-rated-exports",
    name: "Zero-Rated Exports",
    description: "Export tracking with documentation",
    priority: "medium",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-special",
  },
  ReverseChargeWidget: {
    id: "reverse-charge",
    name: "Reverse Charge",
    description: "Reverse charge mechanism tracking",
    priority: "medium",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-special",
  },
  VATReconciliationWidget: {
    id: "vat-reconciliation",
    name: "VAT Reconciliation",
    description: "Sales/Purchase register reconciliation",
    priority: "medium",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-compliance",
  },
  TRNValidationWidget: {
    id: "trn-validation",
    name: "TRN Validation",
    description: "TRN validation status tracker",
    priority: "medium",
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    category: "vat-compliance",
  },
};

/**
 * UAE VAT Constants
 * Reference values for VAT calculations and validations
 */
export const UAE_VAT_CONSTANTS = {
  STANDARD_RATE: 0.05, // 5%
  ZERO_RATE: 0.0,
  TRN_LENGTH: 15,
  TRN_PREFIX: "100",
  MANDATORY_REGISTRATION_THRESHOLD: 375000, // AED
  VOLUNTARY_REGISTRATION_THRESHOLD: 187500, // AED
  VAT_RETURN_DUE_DAYS: 28, // Days after quarter end
  EXPORT_DOC_TIME_LIMIT: 90, // Days to obtain export documentation
};

/**
 * Form 201 Box Mapping
 * Reference for VAT return box assignments
 */
export const FORM_201_BOXES = {
  BOX_1: { number: 1, label: "Standard rated supplies in UAE", type: "output" },
  BOX_2: { number: 2, label: "Tax refunds for tourists", type: "output" },
  BOX_3: { number: 3, label: "Zero-rated supplies", type: "output" },
  BOX_4: { number: 4, label: "Exempt supplies", type: "output" },
  BOX_5: { number: 5, label: "Goods imported into UAE", type: "output" },
  BOX_6: {
    number: 6,
    label: "Adjustments to goods imported",
    type: "adjustment",
  },
  BOX_7: { number: 7, label: "Total value of due tax", type: "calculated" },
  BOX_8: { number: 8, label: "Standard rated expenses", type: "input" },
  BOX_9: {
    number: 9,
    label: "Supplies subject to reverse charge",
    type: "input",
  },
  BOX_10: { number: 10, label: "Recoverable input tax", type: "calculated" },
  BOX_11: { number: 11, label: "Net VAT due", type: "calculated" },
};

/**
 * UAE Designated Zones List
 * FTA-recognized free zones for zero-rating eligibility
 */
export const UAE_DESIGNATED_ZONES = [
  { code: "JAFZA", name: "Jebel Ali Free Zone", emirate: "Dubai" },
  { code: "DAFZA", name: "Dubai Airport Free Zone", emirate: "Dubai" },
  {
    code: "SAIF",
    name: "Sharjah Airport International Free Zone",
    emirate: "Sharjah",
  },
  { code: "KIZAD", name: "Khalifa Industrial Zone", emirate: "Abu Dhabi" },
  { code: "RAKFTZ", name: "RAK Free Trade Zone", emirate: "Ras Al Khaimah" },
  { code: "AFZA", name: "Ajman Free Zone", emirate: "Ajman" },
  { code: "HFZA", name: "Hamriyah Free Zone", emirate: "Sharjah" },
  { code: "DMCC", name: "Dubai Multi Commodities Centre", emirate: "Dubai" },
  {
    code: "DIFC",
    name: "Dubai International Financial Centre",
    emirate: "Dubai",
  },
  { code: "ADGM", name: "Abu Dhabi Global Market", emirate: "Abu Dhabi" },
];

// Use lazy imports: import { LazyVATCollectionWidget } from '../LazyWidgets';
