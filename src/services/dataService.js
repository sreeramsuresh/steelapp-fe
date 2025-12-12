/**
 * Data Service Abstraction Layer
 * Exports real API services for production use
 *
 * Usage in components:
 *   import { invoiceService, customerService, productService } from '../services/dataService';
 */

// Import real services
import { invoiceService as realInvoiceService } from './invoiceService';
import { customerService as realCustomerService } from './customerService';
import { productService as realProductService } from './productService';
import { companyService as realCompanyService } from './companyService';
import { payablesService as realPayablesService, PAYMENT_MODES as realPaymentModes } from './payablesService';
import { quotationsAPI } from './api';

/**
 * Invoice Service
 */
export const invoiceService = realInvoiceService;

/**
 * Customer Service
 */
export const customerService = realCustomerService;

/**
 * Product Service
 */
export const productService = realProductService;

/**
 * Company Service
 */
export const companyService = realCompanyService.companyService;

/**
 * Quotation Service
 */
export const quotationService = quotationsAPI;

/**
 * Payables Service
 */
export const payablesService = realPayablesService;

/**
 * Payment Modes constant
 */
export const PAYMENT_MODES = realPaymentModes;

/**
 * Payment Service helpers
 */
export { createPaymentPayload, validatePayment as validatePaymentPayload, normalizePayment, PAYMENT_METHOD_OPTIONS } from './paymentService';

/**
 * Export all services as default
 */
export default {
  invoiceService,
  customerService,
  productService,
  companyService,
  quotationService,
  payablesService,
  PAYMENT_MODES,
};
