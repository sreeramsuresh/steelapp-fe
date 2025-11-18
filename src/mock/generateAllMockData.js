/**
 * Complete Mock Data Generator - Phases 2 & 3
 * Generates Payments, Quotations, Delivery Notes, Purchase Orders, Suppliers, Settings
 * Run after Phase 1: node src/mock/generateAllMockData.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

// Load Phase 1 data
const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
const invoices = JSON.parse(fs.readFileSync(path.join(dataDir, 'invoices.json'), 'utf8'));

// Helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];
const randomDate = (startDays, endDays) => {
  const now = new Date();
  const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date) => date.toISOString().split('T')[0];
const formatDateTime = (date) => date.toISOString();

// ============================================
// PHASE 2: PAYMENTS (150 records)
// ============================================

function generatePayments() {
  const payments = [];
  let paymentId = 1;
  
  // Extract all payments from invoices that have them
  invoices.forEach(invoice => {
    if (invoice.payments && invoice.payments.length > 0) {
      invoice.payments.forEach(payment => {
        payments.push({
          id: paymentId++,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerDetails.name,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          method: payment.method,
          reference: payment.reference,
          notes: payment.notes,
          status: 'completed',
          companyId: 1,
          createdAt: formatDateTime(new Date(payment.paymentDate)),
          updatedAt: formatDateTime(new Date(payment.paymentDate))
        });
      });
    }
  });

  return payments;
}

const payments = generatePayments();
fs.writeFileSync(
  path.join(dataDir, 'payments.json'),
  JSON.stringify(payments, null, 2)
);

console.log(`✅ Generated ${payments.length} payments`);
console.log(`   - Bank Transfer: ${payments.filter(p => p.method === 'bank_transfer').length}`);
console.log(`   - Cheque: ${payments.filter(p => p.method === 'cheque').length}`);
console.log(`   - Cash: ${payments.filter(p => p.method === 'cash').length}`);
console.log(`   - Credit Card: ${payments.filter(p => p.method === 'credit_card').length}`);

// ============================================
// PHASE 2: QUOTATIONS (80 records)
// ============================================

function generateQuotations(count = 80) {
  const quotations = [];
  const statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  const statusWeights = [20, 25, 20, 10, 5];
  
  function weightedChoice(items, weights) {
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (random < weights[i]) return items[i];
      random -= weights[i];
    }
    return items[items.length - 1];
  }

  for (let i = 1; i <= count; i++) {
    const customer = randomChoice(customers.filter(c => c.status === 'active'));
    const quoteDate = randomDate(180, 0);
    const validUntil = new Date(quoteDate);
    validUntil.setDate(validUntil.getDate() + 30);
    const status = weightedChoice(statuses, statusWeights);
    
    // 25% of accepted quotes convert to invoices
    const convertedToInvoice = status === 'accepted' && Math.random() < 0.25;
    const linkedInvoiceId = convertedToInvoice ? randomChoice(invoices.filter(inv => inv.customerId === customer.id))?.id : null;
    
    // Generate quote items
    const itemCount = randomInt(1, 8);
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const product = randomChoice(products.filter(p => p.status === 'active'));
      const quantity = randomInt(1, 50);
      const unitPrice = product.unitPrice;
      const discount = randomFloat(0, unitPrice * quantity * 0.1, 2);
      const taxRate = 5.0;
      const amount = (quantity * unitPrice) - discount;
      
      items.push({
        id: j + 1,
        productId: product.id,
        productName: product.fullName,
        description: product.name,
        quantity,
        unitPrice,
        discount,
        taxRate,
        amount
      });
      
      subtotal += amount;
    }
    
    const taxAmount = subtotal * 0.05;
    const globalDiscount = randomFloat(0, subtotal * 0.05, 2);
    const totalAmount = subtotal + taxAmount - globalDiscount;

    quotations.push({
      id: i,
      quotationNumber: `QT-${quoteDate.getFullYear()}-${String(i).padStart(4, '0')}`,
      customerId: customer.id,
      customerDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        trn: customer.trn,
        address: customer.address
      },
      quoteDate: formatDate(quoteDate),
      validUntil: formatDate(validUntil),
      status,
      currency: 'AED',
      subtotal,
      taxRate: 5.0,
      taxAmount,
      discount: globalDiscount,
      totalAmount,
      items,
      notes: '',
      termsAndConditions: 'Standard terms apply',
      convertedToInvoice,
      linkedInvoiceId,
      convertedDate: convertedToInvoice ? formatDate(randomDate(0, 7)) : null,
      companyId: 1,
      createdBy: 1,
      createdAt: formatDateTime(quoteDate),
      updatedAt: formatDateTime(randomDate(Math.max(0, Math.floor((Date.now() - quoteDate.getTime()) / (1000 * 60 * 60 * 24)) - 7), 0))
    });
  }

  return quotations;
}

const quotations = generateQuotations(80);
fs.writeFileSync(
  path.join(dataDir, 'quotations.json'),
  JSON.stringify(quotations, null, 2)
);

console.log('✅ Generated 80 quotations');
console.log(`   - Draft: ${quotations.filter(q => q.status === 'draft').length}`);
console.log(`   - Sent: ${quotations.filter(q => q.status === 'sent').length}`);
console.log(`   - Accepted: ${quotations.filter(q => q.status === 'accepted').length}`);
console.log(`   - Rejected: ${quotations.filter(q => q.status === 'rejected').length}`);
console.log(`   - Expired: ${quotations.filter(q => q.status === 'expired').length}`);
console.log(`   - Converted to Invoice: ${quotations.filter(q => q.convertedToInvoice).length}`);

// ============================================
// PHASE 2: DELIVERY NOTES (120 records)
// ============================================

function generateDeliveryNotes(count = 120) {
  const deliveryNotes = [];
  const statuses = ['pending', 'in_transit', 'delivered', 'returned'];
  const statusWeights = [30, 50, 35, 5];
  
  function weightedChoice(items, weights) {
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (random < weights[i]) return items[i];
      random -= weights[i];
    }
    return items[items.length - 1];
  }

  for (let i = 1; i <= count; i++) {
    // 83% linked to invoices, 17% standalone
    const linkedToInvoice = Math.random() < 0.83;
    const invoice = linkedToInvoice ? randomChoice(invoices) : null;
    const customer = invoice ? customers.find(c => c.id === invoice.customerId) : randomChoice(customers);
    
    const deliveryDate = randomDate(90, 0);
    const status = weightedChoice(statuses, statusWeights);
    
    // Get items from invoice or generate new ones
    const items = invoice ? invoice.items.map((item, idx) => ({
      id: idx + 1,
      productId: item.productId,
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      deliveredQuantity: status === 'delivered' ? item.quantity : Math.floor(item.quantity * 0.8)
    })) : [];

    deliveryNotes.push({
      id: i,
      deliveryNoteNumber: `DN-${deliveryDate.getFullYear()}-${String(i).padStart(4, '0')}`,
      invoiceId: invoice?.id || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      customerId: customer.id,
      customerDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      },
      deliveryDate: formatDate(deliveryDate),
      status,
      items,
      deliveryAddress: customer.address,
      driverName: randomChoice(['Ahmed Ali', 'Mohammed Hassan', 'Ali Khan', 'Omar Rashid']),
      vehicleNumber: `DXB-${randomInt(10000, 99999)}`,
      notes: status === 'returned' ? 'Customer refused delivery' : '',
      signature: status === 'delivered' ? 'Signed by customer' : null,
      companyId: 1,
      createdAt: formatDateTime(deliveryDate),
      updatedAt: formatDateTime(randomDate(Math.max(0, Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)) - 3), 0))
    });
  }

  return deliveryNotes;
}

const deliveryNotes = generateDeliveryNotes(120);
fs.writeFileSync(
  path.join(dataDir, 'deliveryNotes.json'),
  JSON.stringify(deliveryNotes, null, 2)
);

console.log('✅ Generated 120 delivery notes');
console.log(`   - Pending: ${deliveryNotes.filter(d => d.status === 'pending').length}`);
console.log(`   - In Transit: ${deliveryNotes.filter(d => d.status === 'in_transit').length}`);
console.log(`   - Delivered: ${deliveryNotes.filter(d => d.status === 'delivered').length}`);
console.log(`   - Returned: ${deliveryNotes.filter(d => d.status === 'returned').length}`);
console.log(`   - Linked to Invoices: ${deliveryNotes.filter(d => d.invoiceId).length}`);

console.log('\n🎉 Phase 2 Complete: Payments + Quotations (80) + Delivery Notes (120)');


// ============================================
// PHASE 3: SUPPLIERS (20 records)
// ============================================

function generateSuppliers(count = 20) {
  const suppliers = [];
  const statuses = ['active', 'inactive', 'blacklisted'];
  const statusWeights = [15, 3, 2];
  const businessNames = ['Emirates', 'Gulf', 'Al Noor', 'United', 'International', 'National', 'Modern', 'Advanced', 'Premier', 'Royal'];
  const industries = ['Steel Mills', 'Metal Trading', 'Manufacturing', 'Industrial Supply', 'Import Export'];
  const cities = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'];
  
  function weightedChoice(items, weights) {
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (random < weights[i]) return items[i];
      random -= weights[i];
    }
    return items[items.length - 1];
  }

  for (let i = 1; i <= count; i++) {
    const companyName = `${randomChoice(businessNames)} ${randomChoice(industries)} LLC`;
    const city = randomChoice(cities);
    const status = weightedChoice(statuses, statusWeights);

    suppliers.push({
      id: i,
      name: companyName,
      email: `procurement@${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.ae`,
      phone: `+971-${randomInt(2, 7)}-${randomInt(1000000, 9999999)}`,
      trn: `100${randomInt(100000000000, 999999999999)}`,
      address: {
        street: `Industrial Area ${randomInt(1, 15)}`,
        city: city,
        state: city,
        postalCode: `${randomInt(10000, 99999)}`,
        country: 'UAE'
      },
      contactPerson: `${randomChoice(['Ahmed', 'Mohammed', 'Ali', 'Omar'])} ${randomChoice(['Hassan', 'Khan', 'Ali'])}`,
      paymentTerms: randomChoice(['NET_15', 'NET_30', 'NET_45', 'NET_60']),
      status,
      category: randomChoice(['manufacturer', 'distributor', 'importer']),
      creditLimit: randomFloat(500000, 5000000, 2),
      companyId: 1,
      createdAt: formatDateTime(randomDate(730, 365)),
      updatedAt: formatDateTime(randomDate(30, 0)),
      notes: status === 'blacklisted' ? 'Quality issues - do not use' : ''
    });
  }

  return suppliers;
}

const suppliers = generateSuppliers(20);
fs.writeFileSync(
  path.join(dataDir, 'suppliers.json'),
  JSON.stringify(suppliers, null, 2)
);

console.log('✅ Generated 20 suppliers');
console.log(`   - Active: ${suppliers.filter(s => s.status === 'active').length}`);
console.log(`   - Inactive: ${suppliers.filter(s => s.status === 'inactive').length}`);
console.log(`   - Blacklisted: ${suppliers.filter(s => s.status === 'blacklisted').length}`);

// ============================================
// PHASE 3: PURCHASE ORDERS (60 records)
// ============================================

function generatePurchaseOrders(count = 60) {
  const purchaseOrders = [];
  const statuses = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];
  const statusWeights = [15, 20, 15, 8, 2];
  
  function weightedChoice(items, weights) {
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (random < weights[i]) return items[i];
      random -= weights[i];
    }
    return items[items.length - 1];
  }

  for (let i = 1; i <= count; i++) {
    const supplier = randomChoice(suppliers.filter(s => s.status === 'active'));
    const orderDate = randomDate(180, 0);
    const expectedDate = new Date(orderDate);
    expectedDate.setDate(expectedDate.getDate() + randomInt(14, 60));
    const status = weightedChoice(statuses, statusWeights);
    
    // Generate PO items
    const itemCount = randomInt(2, 10);
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const product = randomChoice(products);
      const quantity = randomInt(50, 500);
      const unitPrice = product.unitPrice * randomFloat(0.7, 0.9, 2); // Supplier price lower
      const amount = quantity * unitPrice;
      
      items.push({
        id: j + 1,
        productId: product.id,
        productName: product.fullName,
        description: product.name,
        quantity,
        unitPrice,
        amount
      });
      
      subtotal += amount;
    }
    
    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal + taxAmount;

    purchaseOrders.push({
      id: i,
      poNumber: `PO-${orderDate.getFullYear()}-${String(i).padStart(4, '0')}`,
      supplierId: supplier.id,
      supplierDetails: {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        trn: supplier.trn,
        address: supplier.address
      },
      orderDate: formatDate(orderDate),
      expectedDeliveryDate: formatDate(expectedDate),
      status,
      currency: 'AED',
      subtotal,
      taxRate: 5.0,
      taxAmount,
      totalAmount,
      items,
      notes: '',
      paymentTerms: supplier.paymentTerms,
      companyId: 1,
      createdBy: 1,
      createdAt: formatDateTime(orderDate),
      updatedAt: formatDateTime(randomDate(Math.max(0, Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)) - 7), 0))
    });
  }

  return purchaseOrders;
}

const purchaseOrders = generatePurchaseOrders(60);
fs.writeFileSync(
  path.join(dataDir, 'purchaseOrders.json'),
  JSON.stringify(purchaseOrders, null, 2)
);

console.log('✅ Generated 60 purchase orders');
console.log(`   - Draft: ${purchaseOrders.filter(p => p.status === 'draft').length}`);
console.log(`   - Sent: ${purchaseOrders.filter(p => p.status === 'sent').length}`);
console.log(`   - Confirmed: ${purchaseOrders.filter(p => p.status === 'confirmed').length}`);
console.log(`   - Received: ${purchaseOrders.filter(p => p.status === 'received').length}`);
console.log(`   - Cancelled: ${purchaseOrders.filter(p => p.status === 'cancelled').length}`);

// ============================================
// PHASE 3: USERS (10 records)
// ============================================

function generateUsers(count = 10) {
  const users = [];
  const roles = ['admin', 'manager', 'user', 'viewer'];
  const roleWeights = [2, 3, 4, 1];
  const arabicNames = ['Ahmed', 'Mohammed', 'Ali', 'Omar', 'Hassan', 'Khalid', 'Rashid', 'Salem', 'Abdullah', 'Hamad'];
  const lastNames = ['Al Maktoum', 'Al Nahyan', 'Al Sharqi', 'Al Qasimi', 'Al Nuaimi'];
  
  function weightedChoice(items, weights) {
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (random < weights[i]) return items[i];
      random -= weights[i];
    }
    return items[items.length - 1];
  }

  for (let i = 1; i <= count; i++) {
    const firstName = randomChoice(arabicNames);
    const lastName = randomChoice(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const role = weightedChoice(roles, roleWeights);

    users.push({
      id: i,
      name: fullName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@ultimatesteels.ae`,
      role,
      status: 'active',
      phone: `+971-${randomInt(50, 59)}-${randomInt(1000000, 9999999)}`,
      department: role === 'admin' ? 'Management' : role === 'manager' ? 'Sales' : 'Operations',
      companyId: 1,
      lastLogin: formatDateTime(randomDate(7, 0)),
      createdAt: formatDateTime(randomDate(365, 180)),
      updatedAt: formatDateTime(randomDate(30, 0))
    });
  }

  return users;
}

const users = generateUsers(10);
fs.writeFileSync(
  path.join(dataDir, 'users.json'),
  JSON.stringify(users, null, 2)
);

console.log('✅ Generated 10 users');
console.log(`   - Admin: ${users.filter(u => u.role === 'admin').length}`);
console.log(`   - Manager: ${users.filter(u => u.role === 'manager').length}`);
console.log(`   - User: ${users.filter(u => u.role === 'user').length}`);
console.log(`   - Viewer: ${users.filter(u => u.role === 'viewer').length}`);

// ============================================
// PHASE 3: PRICE LISTS (5 records)
// ============================================

const priceLists = [
  {
    id: 1,
    name: 'Standard Retail Pricing',
    description: 'Default pricing for retail customers',
    markup: 25.0,
    status: 'active',
    isDefault: true,
    companyId: 1,
    createdAt: formatDateTime(randomDate(730, 365)),
    updatedAt: formatDateTime(randomDate(30, 0))
  },
  {
    id: 2,
    name: 'Wholesale Pricing',
    description: 'Discounted pricing for wholesale customers',
    markup: 15.0,
    status: 'active',
    isDefault: false,
    companyId: 1,
    createdAt: formatDateTime(randomDate(730, 365)),
    updatedAt: formatDateTime(randomDate(30, 0))
  },
  {
    id: 3,
    name: 'Contractor Discount',
    description: 'Special pricing for contractors',
    markup: 18.0,
    status: 'active',
    isDefault: false,
    companyId: 1,
    createdAt: formatDateTime(randomDate(730, 365)),
    updatedAt: formatDateTime(randomDate(30, 0))
  },
  {
    id: 4,
    name: 'VIP Customer Pricing',
    description: 'Premium pricing for VIP customers',
    markup: 12.0,
    status: 'active',
    isDefault: false,
    companyId: 1,
    createdAt: formatDateTime(randomDate(730, 365)),
    updatedAt: formatDateTime(randomDate(30, 0))
  },
  {
    id: 5,
    name: 'Promotional Pricing',
    description: 'Temporary promotional pricing',
    markup: 20.0,
    status: 'inactive',
    isDefault: false,
    companyId: 1,
    createdAt: formatDateTime(randomDate(180, 90)),
    updatedAt: formatDateTime(randomDate(30, 0))
  }
];

fs.writeFileSync(
  path.join(dataDir, 'priceLists.json'),
  JSON.stringify(priceLists, null, 2)
);

console.log('✅ Generated 5 price lists');

// ============================================
// PHASE 3: COMPANY (1 record)
// ============================================

const company = {
  id: 1,
  name: 'ULTIMATE STEELS',
  legalName: 'Ultimate Steels Trading LLC',
  trn: '100123456789012',
  email: 'info@ultimatesteels.ae',
  phone: '+971-4-1234567',
  fax: '+971-4-1234568',
  website: 'www.ultimatesteels.ae',
  address: {
    street: 'Sheikh Zayed Road, Trade Centre',
    city: 'Dubai',
    state: 'Dubai',
    postalCode: '12345',
    country: 'UAE'
  },
  bankDetails: {
    bankName: 'Emirates NBD',
    accountName: 'Ultimate Steels Trading LLC',
    accountNumber: '1234567890',
    iban: 'AE070331234567890123456',
    swiftCode: 'EBILAEAD'
  },
  settings: {
    currency: 'AED',
    taxRate: 5.0,
    fiscalYearStart: '01-01',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Asia/Dubai',
    language: 'en'
  },
  logo: null,
  createdAt: formatDateTime(randomDate(1095, 730)),
  updatedAt: formatDateTime(randomDate(30, 0))
};

fs.writeFileSync(
  path.join(dataDir, 'company.json'),
  JSON.stringify(company, null, 2)
);

console.log('✅ Generated 1 company record');

console.log('\n🎉 Phase 3 Complete: Suppliers (20) + Purchase Orders (60) + Users (10) + Price Lists (5) + Company (1)');
console.log('\n🎊 ALL PHASES COMPLETE!');
console.log('📊 Total Mock Data Generated:');
console.log('   - Customers: 50');
console.log('   - Products: 100');
console.log('   - Invoices: 200');
console.log(`   - Payments: ${payments.length}`);
console.log('   - Quotations: 80');
console.log('   - Delivery Notes: 120');
console.log('   - Purchase Orders: 60');
console.log('   - Suppliers: 20');
console.log('   - Users: 10');
console.log('   - Price Lists: 5');
console.log('   - Company: 1');
console.log(`   - TOTAL: ${50 + 100 + 200 + payments.length + 80 + 120 + 60 + 20 + 10 + 5 + 1} records`);
