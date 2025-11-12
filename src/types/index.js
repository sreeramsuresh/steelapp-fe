// Default data structures for the invoice application
import { uuid } from '../utils/uuid';

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
    country: 'UAE'
  },
  vatNumber: '', // TRN Number
  panNumber: '',
  cinNumber: '',
  tradeLicenseNumber: '',
  tradeLicenseExpiry: '',
  contactPerson: '',
  website: '',
  paymentTerms: 30
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
  serialNumber: ''
});

export const createInvoice = () => ({
  id: uuid(),
  invoiceNumber: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
  items: [createSteelItem()],
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
  advanceReceived: 0,
  balanceAmount: 0,
  totalInWords: '',
  total: 0,
  status: 'draft',
  currency: 'AED', // Default currency
  exchangeRate: 1, // Default exchange rate for AED
  notes: '',
  terms: 'Kindly check the product before unloading. If any complaint arises, contact us immediately.\nNo items will be returned without prior authorisation',
  // Payment tracking fields
  payments: [], // Array of payment objects
  payment_status: 'unpaid', // unpaid, partially_paid, fully_paid
  total_paid: 0, // Calculated from payments array
  balance_due: 0, // total - total_paid
  last_payment_date: null // Date of most recent payment
});

export const createCompany = () => ({
  name: 'Steel Trading Co.',
  address: {
    street: '123 Industrial Area',
    city: 'Dubai',
    emirate: 'Dubai',
    poBox: 'P.O. Box 12345',
    country: 'UAE'
  },
  phone: '+971 50 123 4567',
  email: 'info@steeltrading.com',
  vatNumber: '100000000000003' // TRN Number
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
  'Fujairah'
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
  'Fujairah', 'Dibba Al-Fujairah'
];

export const createStockMovement = () => ({
  id: uuid(),
  date: new Date().toISOString().split('T')[0],
  movement: 'IN', // 'IN' or 'OUT'
  productType: '',
  grade: '',
  thickness: '',
  size: '',
  finish: '',
  invoiceNo: '',
  quantity: '',
  currentStock: '',
  seller: ''
});

export const createInventoryItem = () => ({
  id: uuid(),
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
  location: ''
});

export const PRODUCT_TYPES = ['Sheet', 'Square Tube', 'Rectangular Tube', 'Pol Pipe', 'Round Bar', 'Flat Bar', 'Angle Bar', 'Square Bar', 'Coil'];
export const STEEL_GRADES = ['201', '304', '316', '316L', '310', '321', '347'];
export const FINISHES = ['Brush', 'Black Mirror', 'Gold Mirror', 'Gold Brush', 'HL', 'Mill', 'Mirror', '2B', 'BA'];
export const MOVEMENT_TYPES = ['IN', 'OUT'];
