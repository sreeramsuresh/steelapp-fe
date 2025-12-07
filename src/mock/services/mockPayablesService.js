/**
 * Mock Payables/Receivables Service
 */

import invoicesData from '../data/invoices.json';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const payablesService = {
  async getInvoices(params = {}) {
    await delay();
    const { page = 1, limit = 20, dateType: _dateType } = params;
    
    // Use invoice data
    const filtered = [...invoicesData];
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);
    
    return {
      invoices: paginatedData,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages },
    };
  },

  async recordPayment(_invoiceId, _paymentData) {
    await delay();
    return { message: 'Payment recorded successfully' };
  },

  async getPaymentHistory(_invoiceId) {
    await delay();
    return { payments: [] };
  },
};

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
];

export default payablesService;
