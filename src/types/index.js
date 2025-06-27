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
    state: '',
    zipCode: '',
    country: 'India'
  },
  gstNumber: '',
  panNumber: '',
  cinNumber: '',
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
  gstRate: 18,
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
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India'
  },
  phone: '+91 9876543210',
  email: 'info@steeltrading.com',
  gstNumber: '27AAAAA0000A1Z5'
});

export const STEEL_UNITS = ['kg', 'ton', 'piece', 'meter', 'feet'];
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'];
export const PAYMENT_MODES = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Card', 'Bank Transfer'];
export const DELIVERY_TERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP'];
export const DISCOUNT_TYPES = ['amount', 'percentage'];

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

export const PRODUCT_TYPES = ['Sheet', 'Round Bar', 'Rect. Tube', 'Pipe', 'Angle', 'Channel', 'Flat Bar'];
export const STEEL_GRADES = ['201', '304', '316', '316L', '310', '321', '347'];
export const FINISHES = ['Brush', 'HL', 'Mirror', 'Gold Mirror', 'BA', 'Matt'];
export const MOVEMENT_TYPES = ['IN', 'OUT'];