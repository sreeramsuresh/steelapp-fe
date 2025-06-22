// Default data structures for the invoice application

export const createCustomer = () => ({
  id: '',
  name: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  },
  gstNumber: ''
});

export const createSteelItem = () => ({
  id: crypto.randomUUID(),
  name: '',
  specification: '',
  unit: 'kg',
  quantity: 1,
  rate: 0,
  amount: 0,
  hsnCode: '',
  gstRate: 18
});

export const createInvoice = () => ({
  id: crypto.randomUUID(),
  invoiceNumber: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customer: createCustomer(),
  items: [createSteelItem()],
  subtotal: 0,
  gstAmount: 0,
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