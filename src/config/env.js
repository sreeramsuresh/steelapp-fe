/**
 * Environment variables wrapper
 * Works in both test and production environments
 */

// In test environments, this will be set by init.mjs
const envConfig = globalThis.__VITE_ENV__ || (typeof import !== 'undefined' && import.meta?.env) || {};

const env = {
  DEV: envConfig.DEV ?? false,
  PROD: envConfig.PROD ?? false,
  SSR: envConfig.SSR ?? false,
  MODE: envConfig.MODE ?? 'production',
  VITE_API_BASE_URL: envConfig.VITE_API_BASE_URL ?? 'http://localhost:3001/api',
  VITE_DISABLE_CONTRACT_VALIDATION: envConfig.VITE_DISABLE_CONTRACT_VALIDATION ?? 'false',
  VITE_ENABLE_SUPPLIERS: envConfig.VITE_ENABLE_SUPPLIERS ?? 'false',
  VITE_ENABLE_TEMPLATES: envConfig.VITE_ENABLE_TEMPLATES ?? 'false',
  VITE_ENABLE_QUOTATIONS: envConfig.VITE_ENABLE_QUOTATIONS ?? 'false',
  VITE_ENABLE_PURCHASE_ORDERS: envConfig.VITE_ENABLE_PURCHASE_ORDERS ?? 'false',
  VITE_ENABLE_VENDOR_BILLS: envConfig.VITE_ENABLE_VENDOR_BILLS ?? 'false',
  VITE_ENABLE_INVENTORY: envConfig.VITE_ENABLE_INVENTORY ?? 'false',
  VITE_ENABLE_BANKING: envConfig.VITE_ENABLE_BANKING ?? 'false',
  VITE_ENABLE_VAT: envConfig.VITE_ENABLE_VAT ?? 'false',
  VITE_ENABLE_REPORTS: envConfig.VITE_ENABLE_REPORTS ?? 'false',
};

export default env;
