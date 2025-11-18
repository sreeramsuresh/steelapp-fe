/**
 * Data Service Abstraction Layer
 * Automatically switches between mock data and real API based on configuration
 * 
 * Usage in components:
 *   import { invoiceService } from '../services/dataService';
 *   const invoices = await invoiceService.getInvoices({ page: 1, limit: 20 });
 */

import { USE_MOCK_DATA } from '../mock/config/mockConfig';

// Import real services
import * as realInvoiceService from './invoiceService';
// Import more real services as needed...
// import * as realCustomerService from './customerService';
// import * as realProductService from './productService';

// Import mock services
import * as mockInvoiceService from '../mock/services/mockInvoiceService';
// Import more mock services as needed...
// import * as mockCustomerService from '../mock/services/mockCustomerService';
// import * as mockProductService from '../mock/services/mockProductService';

/**
 * Invoice Service
 * Automatically uses mock or real based on USE_MOCK_DATA flag
 */
export const invoiceService = USE_MOCK_DATA 
  ? mockInvoiceService 
  : realInvoiceService;

/**
 * Customer Service (add when mock service is created)
 */
// export const customerService = USE_MOCK_DATA
//   ? mockCustomerService
//   : realCustomerService;

/**
 * Product Service (add when mock service is created)
 */
// export const productService = USE_MOCK_DATA
//   ? mockProductService
//   : realProductService;

/**
 * Export all services as default
 */
export default {
  invoiceService,
  // customerService,
  // productService,
};
