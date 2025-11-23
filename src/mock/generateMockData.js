/**
 * Mock Data Generator for Ultimate Steel ERP
 * Generates realistic mock data for all entities
 * Run: node src/mock/generateMockData.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// HELPER FUNCTIONS
// ============================================

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

// UAE-specific data
const uaeCities = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'];
const streets = [
  'Sheikh Zayed Road', 'Al Maktoum Road', 'Khalifa Street', 'Airport Road',
  'Emirates Road', 'Al Wahda Street', 'Corniche Road', 'Industrial Area',
];
const companyTypes = ['LLC', 'FZE', 'FZCO', 'PLC', 'Est'];
const arabicNames = [
  'Ahmed', 'Mohammed', 'Ali', 'Omar', 'Hassan', 'Khalid', 'Rashid', 'Salem',
  'Abdullah', 'Hamad', 'Saeed', 'Sultan', 'Majid', 'Tariq', 'Youssef',
];
const businessNames = [
  'Emirates', 'Gulf', 'Al Noor', 'United', 'International', 'National',
  'Modern', 'Advanced', 'Premier', 'Royal', 'Elite', 'Global',
];
const industries = [
  'Trading', 'Steel', 'Construction', 'Manufacturing', 'Industrial',
  'Engineering', 'Metals', 'Building Materials', 'Fabrication',
];

// ============================================
// PHASE 1: CUSTOMERS (50 records)
// ============================================

function generateCustomers(count = 50) {
  const customers = [];
  const statuses = ['active', 'inactive', 'suspended'];
  const statusWeights = [35, 10, 5]; // active, inactive, suspended
  const categories = ['wholesaler', 'retailer', 'contractor', 'manufacturer'];
  const categoryWeights = [20, 15, 10, 5];
  const paymentTerms = ['NET_7', 'NET_15', 'NET_30', 'NET_60'];
  const paymentWeights = [15, 20, 10, 5];

  for (let i = 1; i <= count; i++) {
    const companyName = `${randomChoice(businessNames)} ${randomChoice(industries)} ${randomChoice(companyTypes)}`;
    const city = randomChoice(uaeCities);
    const status = weightedChoice(statuses, statusWeights);
    const category = weightedChoice(categories, categoryWeights);
    const paymentTerm = weightedChoice(paymentTerms, paymentWeights);
    const creditLimit = randomFloat(100000, 1000000, 2);
    const currentCredit = randomFloat(0, creditLimit * 0.5, 2);
    const outstandingBalance = randomFloat(0, currentCredit, 2);
    const totalOrders = randomInt(5, 100);
    const createdAt = randomDate(730, 365); // 1-2 years ago
    const updatedAt = randomDate(30, 0); // last 30 days
    const lastOrderDate = status === 'active' ? randomDate(60, 0) : randomDate(180, 60);

    customers.push({
      id: i,
      name: companyName,
      email: `contact@${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.ae`,
      phone: `+971-${randomInt(2, 7)}-${randomInt(1000000, 9999999)}`,
      trn: `100${randomInt(100000000000, 999999999999)}`,
      address: {
        street: `${randomChoice(streets)}, Building ${randomInt(1, 50)}`,
        city,
        state: city,
        postalCode: `${randomInt(10000, 99999)}`,
        country: 'UAE',
      },
      creditLimit,
      currentCredit,
      paymentTerms: paymentTerm,
      status,
      contactPerson: `${randomChoice(arabicNames)} Al ${randomChoice(['Maktoum', 'Nahyan', 'Sharqi', 'Qasimi', 'Nuaimi'])}`,
      category,
      createdAt: formatDateTime(createdAt),
      updatedAt: formatDateTime(updatedAt),
      companyId: 1,
      lastOrderDate: formatDateTime(lastOrderDate),
      totalOrders,
      outstandingBalance,
      notes: status === 'active' && creditLimit > 500000 ? 'VIP customer - monthly credit review required' : '',
    });
  }

  return customers;
}

function weightedChoice(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) return items[i];
    random -= weights[i];
  }
  return items[items.length - 1];
}

// Save customers to file
const customers = generateCustomers(50);
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
fs.writeFileSync(
  path.join(dataDir, 'customers.json'),
  JSON.stringify(customers, null, 2),
);

console.log('✅ Generated 50 customers');
console.log(`   - Active: ${customers.filter(c => c.status === 'active').length}`);
console.log(`   - Inactive: ${customers.filter(c => c.status === 'inactive').length}`);
console.log(`   - Suspended: ${customers.filter(c => c.status === 'suspended').length}`);


// ============================================
// PHASE 1: PRODUCTS (100 records)
// ============================================

function generateProducts(count = 100) {
  const products = [];
  const categories = ['sheet', 'pipe', 'tube', 'bar', 'coil'];
  const categoryWeights = [40, 25, 20, 10, 5];
  const grades = ['304', '316', '201', '430', '410'];
  const gradeWeights = [35, 30, 15, 10, 10];
  const gradeVariants = ['', 'L', 'H', 'N'];
  const finishes = ['HL', 'BA', '2B', 'No.4', 'Mirror'];
  const finishWeights = [40, 25, 20, 10, 5];
  const statuses = ['active', 'inactive'];

  for (let i = 1; i <= count; i++) {
    const category = weightedChoice(categories, categoryWeights);
    const grade = weightedChoice(grades, gradeWeights);
    const gradeVariant = randomChoice(gradeVariants);
    const finish = weightedChoice(finishes, finishWeights);
    
    let dimensions, fullName, sku, weight;
    
    // Category-specific attributes
    if (category === 'sheet') {
      const width = randomChoice([1000, 1219, 1500, 2000]);
      const length = randomChoice([2000, 2438, 3000, 4000]);
      const thickness = randomChoice([0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0]);
      dimensions = `${width}x${length}x${thickness}mm`;
      fullName = `SS ${grade}${gradeVariant} Sheet ${finish} ${width}x${length} ${thickness}mm`;
      sku = `SS${grade}${gradeVariant}-SHT-${finish}-${width}X${length}-${thickness.toString().replace('.', '')}`;
      weight = (width / 1000) * (length / 1000) * thickness * 7.93; // kg, density of SS
    } else if (category === 'pipe') {
      const nbSize = randomChoice(['1/2"', '3/4"', '1"', '1.5"', '2"', '3"', '4"']);
      const schedule = randomChoice(['SCH40', 'SCH80', 'STD', 'XS']);
      const lengthM = randomChoice([3, 6]);
      dimensions = `${nbSize} ${schedule} ${lengthM}m`;
      fullName = `SS ${grade}${gradeVariant} Pipe ${nbSize} ${schedule}`;
      sku = `SS${grade}${gradeVariant}-PIPE-${nbSize.replace(/[/"]/g, '')}-${schedule}`;
      weight = randomFloat(5, 50, 2);
    } else if (category === 'tube') {
      const od = randomChoice([12.7, 19.05, 25.4, 31.75, 38.1, 50.8]);
      const thickness = randomChoice([1.0, 1.2, 1.5, 2.0]);
      dimensions = `${od}mm OD x ${thickness}mm WT`;
      fullName = `SS ${grade}${gradeVariant} Tube ${od}mm x ${thickness}mm`;
      sku = `SS${grade}${gradeVariant}-TUBE-${od}X${thickness}`;
      weight = randomFloat(2, 20, 2);
    } else if (category === 'bar') {
      const diameter = randomChoice([6, 8, 10, 12, 16, 20, 25]);
      dimensions = `${diameter}mm diameter`;
      fullName = `SS ${grade}${gradeVariant} Bar ${diameter}mm`;
      sku = `SS${grade}${gradeVariant}-BAR-${diameter}`;
      weight = randomFloat(1, 10, 2);
    } else { // coil
      const width = randomChoice([1000, 1219, 1500]);
      const thickness = randomChoice([0.3, 0.5, 0.8, 1.0, 1.2]);
      dimensions = `${width}mm x ${thickness}mm`;
      fullName = `SS ${grade}${gradeVariant} Coil ${finish} ${width}x${thickness}mm`;
      sku = `SS${grade}${gradeVariant}-COIL-${finish}-${width}X${thickness.toString().replace('.', '')}`;
      weight = randomFloat(500, 2000, 2);
    }

    const unitPrice = randomFloat(50, 500, 2);
    const quantityInStock = randomInt(0, 300);
    const reorderLevel = randomInt(20, 100);
    const status = quantityInStock > 0 ? 'active' : randomChoice(['active', 'inactive']);

    products.push({
      id: i,
      name: fullName,
      category,
      commodity: 'stainless_steel',
      grade,
      gradeVariant: gradeVariant || null,
      finish,
      formType: category === 'sheet' ? 'cold_rolled' : category === 'pipe' ? 'seamless' : null,
      shape: category === 'bar' ? 'round' : null,
      standard: 'ASTM_A240',
      condition: 'annealed',
      width: category === 'sheet' || category === 'coil' ? parseInt(dimensions.split('x')[0]) : null,
      length: category === 'sheet' ? parseInt(dimensions.split('x')[1]) : null,
      thickness: null,
      od: category === 'pipe' || category === 'tube' ? null : null,
      nbSize: category === 'pipe' ? dimensions.split(' ')[0] : null,
      schedule: category === 'pipe' ? dimensions.split(' ')[1] : null,
      diameter: category === 'bar' ? parseInt(dimensions.split('mm')[0]) : null,
      size: dimensions,
      weight,
      unit: category === 'coil' ? 'coil' : category === 'sheet' ? 'sheet' : category === 'bar' ? 'kg' : 'length',
      fullName,
      sku,
      quantityInStock,
      reorderLevel,
      unitPrice,
      status,
      companyId: 1,
      createdAt: formatDateTime(randomDate(730, 365)),
      updatedAt: formatDateTime(randomDate(30, 0)),
    });
  }

  return products;
}

const products = generateProducts(100);
fs.writeFileSync(
  path.join(dataDir, 'products.json'),
  JSON.stringify(products, null, 2),
);

console.log('✅ Generated 100 products');
console.log(`   - Sheets: ${products.filter(p => p.category === 'sheet').length}`);
console.log(`   - Pipes: ${products.filter(p => p.category === 'pipe').length}`);
console.log(`   - Tubes: ${products.filter(p => p.category === 'tube').length}`);
console.log(`   - Bars: ${products.filter(p => p.category === 'bar').length}`);
console.log(`   - Coils: ${products.filter(p => p.category === 'coil').length}`);
console.log(`   - In stock: ${products.filter(p => p.quantityInStock > p.reorderLevel).length}`);
console.log(`   - Low stock: ${products.filter(p => p.quantityInStock > 0 && p.quantityInStock <= p.reorderLevel).length}`);
console.log(`   - Out of stock: ${products.filter(p => p.quantityInStock === 0).length}`);


// ============================================
// PHASE 1: INVOICES (200 records)
// ============================================

function generateInvoices(count = 200, customerList, productList) {
  const invoices = [];
  const statuses = ['draft', 'proforma', 'sent', 'issued', 'overdue', 'cancelled'];
  const statusWeights = [40, 30, 40, 50, 30, 10];
  const paymentStatuses = ['unpaid', 'partially_paid', 'fully_paid'];
  const paymentWeights = [80, 70, 50];

  for (let i = 1; i <= count; i++) {
    const customer = randomChoice(customerList.filter(c => c.status === 'active'));
    const invoiceDate = randomDate(365, 0);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + (customer.paymentTerms === 'NET_7' ? 7 : 
      customer.paymentTerms === 'NET_15' ? 15 :
        customer.paymentTerms === 'NET_30' ? 30 : 60));
    
    const status = weightedChoice(statuses, statusWeights);
    const paymentStatus = weightedChoice(paymentStatuses, paymentWeights);
    
    // Generate invoice items (1-15 products)
    const itemCount = randomInt(1, Math.min(15, productList.length));
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const product = randomChoice(productList.filter(p => p.status === 'active'));
      const quantity = randomInt(1, 100);
      const unitPrice = product.unitPrice;
      const discount = randomFloat(0, unitPrice * quantity * 0.1, 2);
      const taxRate = 5.0;
      const amount = (quantity * unitPrice) - discount;
      
      items.push({
        id: j + 1,
        productId: product.id,
        productName: product.fullName,
        description: `${product.commodity.replace('_', ' ')} - ${product.grade}${product.gradeVariant || ''} ${product.finish || ''}`,
        quantity,
        unitPrice,
        discount,
        taxRate,
        amount,
      });
      
      subtotal += amount;
    }
    
    const taxAmount = subtotal * 0.05;
    const globalDiscount = randomFloat(0, subtotal * 0.05, 2);
    const totalAmount = subtotal + taxAmount - globalDiscount;
    
    // Payment amounts based on status
    let amountPaid = 0;
    if (paymentStatus === 'fully_paid') {
      amountPaid = totalAmount;
    } else if (paymentStatus === 'partially_paid') {
      amountPaid = randomFloat(totalAmount * 0.2, totalAmount * 0.8, 2);
    }
    
    const balanceDue = totalAmount - amountPaid;
    
    // Generate payments if amount paid
    const payments = [];
    if (amountPaid > 0) {
      const paymentMethods = ['bank_transfer', 'cheque', 'cash', 'credit_card'];
      const paymentCount = paymentStatus === 'fully_paid' ? randomInt(1, 2) : 1;
      let remainingAmount = amountPaid;
      
      for (let k = 0; k < paymentCount && remainingAmount > 0; k++) {
        const paymentAmount = k === paymentCount - 1 ? remainingAmount : 
          randomFloat(remainingAmount * 0.3, remainingAmount * 0.7, 2);
        remainingAmount -= paymentAmount;
        
        payments.push({
          id: k + 1,
          paymentDate: formatDate(randomDate(Math.floor((Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)), 0)),
          amount: paymentAmount,
          method: randomChoice(paymentMethods),
          reference: `TXN-UAE-2024-${randomInt(100000, 999999)}`,
          notes: k === 0 ? 'Payment received' : 'Additional payment',
        });
      }
    }

    invoices.push({
      id: i,
      invoiceNumber: `INV-${invoiceDate.getFullYear()}-${String(i).padStart(4, '0')}`,
      customerId: customer.id,
      customerDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        trn: customer.trn,
        address: customer.address,
      },
      invoiceDate: formatDate(invoiceDate),
      dueDate: formatDate(dueDate),
      status,
      paymentStatus,
      currency: 'AED',
      subtotal,
      taxRate: 5.0,
      taxAmount,
      discount: globalDiscount,
      totalAmount,
      amountPaid,
      balanceDue,
      paymentTerms: customer.paymentTerms,
      items,
      payments,
      notes: randomChoice(['', '', 'Please make payment within terms', 'Priority delivery requested']),
      internalNotes: randomChoice(['', '', 'VIP customer', 'Rush order']),
      purchaseOrderNumber: `PO-${customer.name.substring(0, 3).toUpperCase()}-2024-${randomInt(100, 999)}`,
      purchaseOrderDate: formatDate(new Date(invoiceDate.getTime() - 7 * 24 * 60 * 60 * 1000)),
      deliveryDate: formatDate(new Date(invoiceDate.getTime() + randomInt(3, 14) * 24 * 60 * 60 * 1000)),
      deliveryAddress: 'Same as billing',
      salesPerson: randomChoice(arabicNames),
      commissionRate: 2.5,
      commissionAmount: totalAmount * 0.025,
      commissionNotes: 'Standard 2.5% commission',
      pricelistId: 1,
      pricelistName: 'Standard Retail Pricing',
      companyId: 1,
      createdBy: 1,
      updatedBy: 1,
      createdAt: formatDateTime(invoiceDate),
      updatedAt: formatDateTime(randomDate(Math.max(0, Math.floor((Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)) - 7), 0)),
      pdfGenerated: status !== 'draft',
      pdfGeneratedAt: status !== 'draft' ? formatDateTime(invoiceDate) : null,
    });
  }

  return invoices;
}

const invoices = generateInvoices(200, customers, products);
fs.writeFileSync(
  path.join(dataDir, 'invoices.json'),
  JSON.stringify(invoices, null, 2),
);

console.log('✅ Generated 200 invoices');
console.log(`   - Draft: ${invoices.filter(i => i.status === 'draft').length}`);
console.log(`   - Proforma: ${invoices.filter(i => i.status === 'proforma').length}`);
console.log(`   - Sent: ${invoices.filter(i => i.status === 'sent').length}`);
console.log(`   - Issued: ${invoices.filter(i => i.status === 'issued').length}`);
console.log(`   - Overdue: ${invoices.filter(i => i.status === 'overdue').length}`);
console.log(`   - Cancelled: ${invoices.filter(i => i.status === 'cancelled').length}`);
console.log(`   - Unpaid: ${invoices.filter(i => i.paymentStatus === 'unpaid').length}`);
console.log(`   - Partially Paid: ${invoices.filter(i => i.paymentStatus === 'partially_paid').length}`);
console.log(`   - Fully Paid: ${invoices.filter(i => i.paymentStatus === 'fully_paid').length}`);

console.log('\n🎉 Phase 1 Complete: Customers (50) + Products (100) + Invoices (200) = 350 records');
