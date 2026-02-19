/**
 * Data Service Abstraction Layer
 * Exports real API services for production use
 *
 * Usage in components:
 *   import { invoiceService, customerService, productService } from '../services/dataService';
 */

import { accountStatementService as realAccountStatementService } from "./accountStatementService";
import { companyService as realCompanyService } from "./companyService";
import { customerService as realCustomerService } from "./customerService";
import { deliveryNoteService as realDeliveryNoteService } from "./deliveryNoteService";
// Import real services
import { invoiceService as realInvoiceService } from "./invoiceService";
import { payablesService as realPayablesService, PAYMENT_MODES as realPaymentModes } from "./payablesService";
import { productService as realProductService } from "./productService";
import { purchaseOrderService as realPurchaseOrderService } from "./purchaseOrderService";
import { quotationService as realQuotationService } from "./quotationService";
import { transitService as realTransitService } from "./transitService";

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
export const companyService = realCompanyService;

/**
 * Quotation Service
 */
export const quotationService = realQuotationService;

/**
 * Delivery Note Service
 */
export const deliveryNoteService = realDeliveryNoteService;

/**
 * Purchase Order Service
 */
export const purchaseOrderService = realPurchaseOrderService;

/**
 * Account Statement Service
 */
export const accountStatementService = realAccountStatementService;

/**
 * Transit Service
 */
export const transitService = realTransitService;

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
export {
  createPaymentPayload,
  normalizePayment,
  PAYMENT_METHOD_OPTIONS,
  validatePayment as validatePaymentPayload,
} from "./paymentService";

/**
 * Export all services as default
 */
export default {
  invoiceService,
  customerService,
  productService,
  companyService,
  quotationService,
  deliveryNoteService,
  purchaseOrderService,
  accountStatementService,
  transitService,
  payablesService,
  PAYMENT_MODES,
};
