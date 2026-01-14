// ============================================================================
// HOOKS INDEX
// Central export file for all custom hooks
// ============================================================================

// API hooks
export { useApi, useApiData } from './useApi';

// API health monitoring hook
export { useApiHealth } from './useApiHealth';

// Dashboard permissions hook
export { useDashboardPermissions } from './useDashboardPermissions';

// Auto-save hook for forms
export { useAutoSave } from './useAutoSave';

// Confirmation dialog hook
export { useConfirm } from './useConfirm';

// Credit note drafts management
export { useCreditNoteDrafts } from './useCreditNoteDrafts';

// Invoice presence (real-time collaboration)
export { useInvoicePresence } from './useInvoicePresence';

// Keyboard shortcuts
export { useKeyboardShortcuts } from './useKeyboardShortcuts';

// Permission checking hook
export { usePermission } from './usePermission';

// Stock validation hook
export { useStockValidation } from './useStockValidation';

// Pricing policy hook (Phase 0: SSOT)
export {
  usePricingPolicy,
  PRICING_MODES,
  PRIMARY_UNITS,
} from './usePricingPolicy';
