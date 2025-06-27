// Default data structures for the invoice application

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
  vatNumber: '',
  panNumber: '',
  cinNumber: '',
  tradeLicenseNumber: '',
  tradeLicenseExpiry: '',
  contactPerson: '',
  website: '',
  paymentTerms: 30
});

export const createSteelItem = () => ({
  id: crypto.randomUUID(),
  productId: null,
  name: '',
  specification: '',
  description: '',
  unit: 'kg',
  quantity: 1,
  rate: 0,
  discount: 0,
  discountType: 'amount',
  taxableAmount: 0,
  amount: 0,
  hsnCode: '',
  gstRate: 5,
  cgst: 0,
  sgst: 0,
  igst: 0,
  cess: 0,
  netAmount: 0,
  serialNumber: ''
});

export const createInvoice = () => ({
  id: crypto.randomUUID(),
  invoiceNumber: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  purchaseOrderNumber: '',
  purchaseOrderDate: '',
  deliveryNote: '',
  modeOfPayment: '',
  otherReference: '',
  despatchedThrough: '',
  destination: '',
  termsOfDelivery: '',
  customer: createCustomer(),
  items: [createSteelItem()],
  subtotal: 0,
  gstAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  cessAmount: 0,
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
  notes: '',
  terms: 'Payment due within 30 days'
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
  vatNumber: '100000000000003'
});

export const STEEL_UNITS = ['kg', 'ton', 'piece', 'meter', 'feet'];
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'];
export const PAYMENT_MODES = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Card', 'Bank Transfer'];
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
  id: crypto.randomUUID(),
  date: new Date().toISOString().split('T')[0],
  movement: 'IN', // 'IN' or 'OUT'
  productType: '',
  grade: '',
  thickness: '',
  size: '',
  finish: '',
  invoiceNo: '',
  quantity: 0,
  currentStock: 0,
  seller: ''
});

export const createInventoryItem = () => ({
  id: crypto.randomUUID(),
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