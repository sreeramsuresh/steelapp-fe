// ═══════════════════════════════════════════════════════════════
// DOCUMENT CONFIGS - Barrel Export
// Import all document configs from a single location
// ═══════════════════════════════════════════════════════════════

export { invoiceConfig } from './invoiceConfig';
export { quotationConfig } from './quotationConfig';
export { purchaseOrderConfig } from './purchaseOrderConfig';
export { vendorBillConfig } from './vendorBillConfig';

// Re-export types and utilities
export * from './types';
export * from './configValidator';
