/**
 * Data Service Abstraction Layer
 * Automatically switches between mock data and real API based on configuration
 * 
 * Usage in components:
 *   import { invoiceService, customerService, productService } from '../services/dataService';
 */

import { USE_MOCK_DATA } from '../mock/config/mockConfig';

// Import real services (using named imports because they export objects)
import { invoiceService as realInvoiceService } from './invoiceService';
import { customerService as realCustomerService } from './customerService';
import { productService as realProductService } from './productService';
import { companyService as realCompanyService } from './companyService';
import { payablesService as realPayablesService } from './payablesService';

// Import mock services (using namespace imports because they export individual functions)
import * as mockInvoiceService from '../mock/services/mockInvoiceService';
import * as mockCustomerService from '../mock/services/mockCustomerService';
import * as mockProductService from '../mock/services/mockProductService';
import * as mockCompanyService from '../mock/services/mockCompanyService';
import * as mockQuotationService from '../mock/services/mockQuotationService';
import * as mockPayablesService from '../mock/services/mockPayablesService';

/**
 * Invoice Service
 */
export const invoiceService = USE_MOCK_DATA 
  ? mockInvoiceService 
  : realInvoiceService;

/**
 * Customer Service
 */
export const customerService = USE_MOCK_DATA
  ? mockCustomerService
  : realCustomerService;

/**
 * Product Service
 */
export const productService = USE_MOCK_DATA
  ? mockProductService
  : realProductService;

/**
 * Company Service
 */
export const companyService = USE_MOCK_DATA
  ? mockCompanyService.companyService
  : realCompanyService.companyService;

/**
 * Quotation Service
 */
export const quotationService = USE_MOCK_DATA
  ? mockQuotationService
  : null; // Add real quotation service when available

/**
 * Payables Service
 */
export const payablesService = USE_MOCK_DATA
  ? mockPayablesService
  : realPayablesService;

/**
 * Payment Modes constant
 */
export const PAYMENT_MODES = USE_MOCK_DATA
  ? mockPayablesService.PAYMENT_MODES
  : realPayablesService.PAYMENT_MODES;

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
