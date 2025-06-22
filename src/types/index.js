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