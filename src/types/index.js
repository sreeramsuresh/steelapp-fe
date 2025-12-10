// Default data structures for the invoice application
import { uuid } from '../utils/uuid';
import { toUAEDateForInput } from '../utils/timezone';

export const createCustomer = () => ({
  id: '',
  name: '',
  company: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: {
    street: '',
    city: '',
    emirate: '',
    poBox: '',
    country: 'UAE',
  },
  vatNumber: '', // TRN Number
  panNumber: '',
  cinNumber: '',
  tradeLicenseNumber: '',
  tradeLicenseExpiry: '',
  contactPerson: '',
  website: '',
  paymentTerms: 30,
});

export const createSteelItem = () => ({
  id: uuid(),
  productId: null,
  name: '',
  grade: '',
  finish: '',
  size: '',
  thickness: '',
  description: '',
  unit: 'kg',
  quantity: 1,
  rate: 0,
  discount: 0,
  discountType: 'amount',
  taxableAmount: 0,
  amount: 0,
  vatRate: 5, // TRN Rate
  netAmount: 0,
  serialNumber: '',
  sourceType: 'WAREHOUSE', // Default to warehouse stock
});

export const createInvoice = () => ({
  id: uuid(),
  invoiceNumber: '',
  // Use UAE timezone (UTC+4) for default dates
  date: toUAEDateForInput(new Date()),
  dueDate: toUAEDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  deliveryNote: '',
  modeOfPayment: '',
  // Warehouse selection (for preview/PDF only; not persisted yet)
  warehouseId: '',
  warehouseName: '',
  warehouseCode: '',
  warehouseCity: '',
  otherReference: '',
  despatchedThrough: '',
  destination: '',
  termsOfDelivery: '',
  customerPurchaseOrderNumber: '',
  customerPurchaseOrderDate: '',
  customer: createCustomer(),
  items: [],
  subtotal: 0,
  vatAmount: 0, // VAT Amount
  totalQuantity: 0,
  totalWeight: 0,
  packingCharges: 0,
  freightCharges: 0,
  insuranceCharges: 0,
  loadingCharges: 0,
  otherCharges: 0,
  roundOff: 0,
  totalInWords: '',
  total: 0,
  status: '', // Empty by default - user must select
  currency: 'AED', // Default currency
  exchangeRate: 1, // Default exchange rate for AED
  notes: '',
  terms: 'Kindly check the product before unloading. If any complaint arises, contact us immediately.\nNo items will be returned without prior authorisation',
  // Payment tracking fields
  payments: [], // Array of payment objects
  payment_status: 'unpaid', // unpaid, partially_paid, fully_paid
  total_paid: 0, // Calculated from payments array
  balance_due: 0, // total - total_paid
  last_payment_date: null, // Date of most recent payment
  // Commission tracking
  sales_agent_id: null, // ID of sales agent assigned to this invoice
  salesPersonId: null, // Phase 5: Sales person who created invoice (for commission tracking)
  commissionPercentage: 10.00, // Phase 5: Commission rate as percentage (default 10%)
  commissionStatus: 'PENDING', // Phase 5: PENDING|APPROVED|PAID|VOIDED
  commissionGracePeriodEndDate: null, // Phase 5: Until when commission can be corrected
  commissionApprovedDate: null, // Phase 5: When commission was approved
  commissionPayoutDate: null, // Phase 5: When commission was paid
  commission_eligible: true, // Whether this invoice is eligible for commission
  commission_calculated: false, // Whether commission has been calculated
  commission_paid: false, // Whether commission has been paid
  // UAE VAT Compliance Fields (FTA Form 201)
  placeOfSupply: 'Sharjah', // Emirate where supply is made (Boxes 1-7 of VAT return)
  supplyDate: toUAEDateForInput(new Date()), // Date of supply/tax point (defaults to today)
  isReverseCharge: false, // Reverse charge mechanism applies (Article 48)
  reverseChargeAmount: 0, // Amount subject to reverse charge
  exchangeRateDate: '', // Date when exchange rate was determined

  // Phase 1: Charge VAT Fields (Migration 100) - UAE VAT on individual charges
  // VAT: 5% for domestic sales, 0% for exports
  packingChargesVat: 0,
  freightChargesVat: 0,
  insuranceChargesVat: 0,
  loadingChargesVat: 0,
  otherChargesVat: 0,
  isExport: false, // True = export (0% VAT), False = domestic (5% VAT)

  // Phase 1: Advance Payment Integration (Migration 102) - UAE FTA Article 26
  advancePaymentId: null, // Reference to advance_payments table
  advanceTaxInvoiceNumber: '', // Tax invoice number issued for advance payment
});

export const createCompany = () => ({
  name: 'Steel Trading Co.',
  address: {
    street: '123 Industrial Area',
    city: 'Dubai',
    emirate: 'Dubai',
    poBox: 'P.O. Box 12345',
    country: 'UAE',
  },
  phone: '+971 50 123 4567',
  email: 'info@steeltrading.com',
  vatNumber: '100000000000003', // TRN Number
});

export const STEEL_UNITS = ['kg', 'ton', 'piece', 'meter', 'feet'];
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'];
export const PAYMENT_MODES = ['Cash', 'Cheque', 'CDC', 'PDC', 'Card', 'Bank Transfer'];
export const DELIVERY_TERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP'];
export const DISCOUNT_TYPES = ['amount', 'percentage'];
export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai', 
  'Sharjah',
  'Ajman',
  'Umm Al-Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

export const UAE_CITIES = [
  // Abu Dhabi Emirate
  'Abu Dhabi', 'Al Ain',
  // Dubai Emirate  
  'Dubai',
  // Sharjah Emirate
  'Sharjah', 'Kalba', 'Khorfakkan', 'Dibba Al-Hisn',
  // Ajman Emirate
  'Ajman',
  // Umm Al-Quwain Emirate
  'Umm Al-Quwain',
  // Ras Al Khaimah Emirate
  'Ras Al Khaimah',
  // Fujairah Emirate
  'Fujairah', 'Dibba Al-Fujairah',
];

export const createStockMovement = () => ({
  id: uuid(),
  // Use UAE timezone (UTC+4) for default date
  date: toUAEDateForInput(new Date()),
  movement: 'IN', // 'IN' or 'OUT'
  productType: '',
  grade: '',
  thickness: '',
  size: '',
  finish: '',
  invoiceNo: '',
  quantity: '',
  currentStock: '',
  seller: '',
});

export const createInventoryItem = () => ({
  id: uuid(),
  productId: null,
  productName: '',
  description: '',
  productType: '',
  grade: '',
  finish: '',
  size: '',
  thickness: '',
  quantity: 0,
  pricePurchased: 0,
  sellingPrice: 0,
  landedCost: 0,
  location: '',
  origin: '',
});

export const PRODUCT_TYPES = ['Sheet', 'Square Tube', 'Rectangular Tube', 'Pol Pipe', 'Round Bar', 'Flat Bar', 'Angle Bar', 'Square Bar', 'Coil'];
export const STEEL_GRADES = ['201', '304', '316', '316L', '310', '321', '347'];
// Comprehensive SS Trading Finishes
export const FINISHES = [
  // Standard Mill Finishes
  '2B', '2D', 'BA', 'Mill', 'No.1', 'No.3', 'No.4',
  // Polished Finishes
  'HL', 'Hairline', 'Scotch Brite', 'Satin',
  'Mirror', '8K Mirror', 'Super Mirror',
  'Brush', 'Duplo',
  // Color/Decorative Finishes
  'Black Mirror', 'Gold Mirror', 'Gold Brush', 'Rose Gold',
  'PVD Coating', 'Etched', 'Embossed', 'Vibration',
  'Anti-Fingerprint', 'AFP',
  // Special
  'Sandblast', 'Bead Blast', 'Checkered', 'Diamond',
];
export const MOVEMENT_TYPES = ['IN', 'OUT'];
