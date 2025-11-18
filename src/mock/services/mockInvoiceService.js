/**
 * Mock Invoice Service
 * Simulates API calls for invoices without backend/database
 * Supports filtering, pagination, search, sorting, CRUD operations
 */

import invoicesData from '../data/invoices.json';
import customersData from '../data/customers.json';
import productsData from '../data/products.json';

// In-memory copy of invoices (allows create/update/delete without affecting JSON file)
let invoices = [...invoicesData];

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get list of invoices with filtering, pagination, search, sorting
 */
export const getInvoices = async (params = {}) => {
  await delay();
  
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    customerId,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    startDate,
    endDate
  } = params;
  
  let filtered = [...invoices];
  
  // Apply filters
  if (status && status !== 'all' && status !== '') {
    filtered = filtered.filter(inv => inv.status === status);
  }
  
  if (paymentStatus && paymentStatus !== 'all' && paymentStatus !== '') {
    filtered = filtered.filter(inv => inv.paymentStatus === paymentStatus);
  }
  
  if (customerId && customerId !== '0' && customerId !== 0) {
    filtered = filtered.filter(inv => inv.customerId === parseInt(customerId));
  }
  
  // Apply date range filter
  if (startDate) {
    filtered = filtered.filter(inv => new Date(inv.invoiceDate) >= new Date(startDate));
  }
  
  if (endDate) {
    filtered = filtered.filter(inv => new Date(inv.invoiceDate) <= new Date(endDate));
  }
  
  // Apply search
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(searchLower) ||
      inv.customerDetails.name.toLowerCase().includes(searchLower) ||
      inv.notes?.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'createdAt' || sortBy === 'invoiceDate' || sortBy === 'dueDate') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  // Calculate pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedData = filtered.slice(start, start + limit);
  
  return {
    invoices: paginatedData,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages
    }
  };
};

/**
 * Get single invoice by ID
 */
export const getInvoice = async (id) => {
  await delay();
  
  const invoice = invoices.find(inv => inv.id === parseInt(id));
  if (!invoice) {
    throw {
      response: {
        status: 404,
        data: { error: 'Invoice not found' }
      }
    };
  }
  
  return invoice;
};

/**
 * Create new invoice
 */
export const createInvoice = async (data) => {
  await delay();
  
  const newInvoice = {
    id: Math.max(...invoices.map(i => i.id), 0) + 1,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pdfGenerated: false,
    pdfGeneratedAt: null
  };
  
  invoices.push(newInvoice);
  return newInvoice;
};

/**
 * Update existing invoice
 */
export const updateInvoice = async (id, data) => {
  await delay();
  
  const index = invoices.findIndex(inv => inv.id === parseInt(id));
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: { error: 'Invoice not found' }
      }
    };
  }
  
  invoices[index] = {
    ...invoices[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return invoices[index];
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (id) => {
  await delay();
  
  const index = invoices.findIndex(inv => inv.id === parseInt(id));
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: { error: 'Invoice not found' }
      }
    };
  }
  
  invoices.splice(index, 1);
  return { message: 'Invoice deleted successfully' };
};

/**
 * Add payment to invoice
 */
export const addPayment = async (invoiceId, paymentData) => {
  await delay();
  
  const index = invoices.findIndex(inv => inv.id === parseInt(invoiceId));
  if (index === -1) {
    throw {
      response: {
        status: 404,
        data: { error: 'Invoice not found' }
      }
    };
  }
  
  const payment = {
    id: (invoices[index].payments?.length || 0) + 1,
    ...paymentData,
    paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0]
  };
  
  if (!invoices[index].payments) {
    invoices[index].payments = [];
  }
  
  invoices[index].payments.push(payment);
  
  // Update payment status and amounts
  const totalPaid = invoices[index].payments.reduce((sum, p) => sum + p.amount, 0);
  invoices[index].amountPaid = totalPaid;
  invoices[index].balanceDue = invoices[index].totalAmount - totalPaid;
  
  if (totalPaid >= invoices[index].totalAmount) {
    invoices[index].paymentStatus = 'fully_paid';
  } else if (totalPaid > 0) {
    invoices[index].paymentStatus = 'partially_paid';
  } else {
    invoices[index].paymentStatus = 'unpaid';
  }
  
  invoices[index].updatedAt = new Date().toISOString();
  
  return invoices[index];
};

/**
 * Get invoice statistics for dashboard
 */
export const getInvoiceStats = async () => {
  await delay(300);
  
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const stats = {
    outstanding: invoices
      .filter(inv => inv.paymentStatus !== 'fully_paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.balanceDue, 0),
    
    overdue: {
      amount: invoices
        .filter(inv => new Date(inv.dueDate) < now && inv.balanceDue > 0)
        .reduce((sum, inv) => sum + inv.balanceDue, 0),
      count: invoices.filter(inv => new Date(inv.dueDate) < now && inv.balanceDue > 0).length
    },
    
    dueIn7Days: {
      amount: invoices
        .filter(inv => {
          const dueDate = new Date(inv.dueDate);
          return dueDate >= now && dueDate <= sevenDaysFromNow && inv.balanceDue > 0;
        })
        .reduce((sum, inv) => sum + inv.balanceDue, 0),
      count: invoices.filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return dueDate >= now && dueDate <= sevenDaysFromNow && inv.balanceDue > 0;
      }).length
    },
    
    paid: invoices
      .filter(inv => inv.paymentStatus === 'fully_paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0),
    
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  };
  
  return stats;
};

/**
 * Reset mock data to original state (useful for testing)
 */
export const resetMockData = () => {
  invoices = [...invoicesData];
};

// Default export
export default {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  addPayment,
  getInvoiceStats,
  resetMockData
};
