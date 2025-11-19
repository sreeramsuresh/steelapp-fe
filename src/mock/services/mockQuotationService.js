/**
 * Mock Quotation Service
 */

import quotationsData from '../data/quotations.json';

let quotations = [...quotationsData];
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

const quotationService = {
  async getQuotations(params = {}) {
    await delay();
    const { page = 1, limit = 20, search, status } = params;
    
    let filtered = [...quotations];
    
    if (status && status !== 'all') {
      filtered = filtered.filter(q => q.status === status);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(q =>
        q.quotationNumber?.toLowerCase().includes(s) ||
        q.customerName?.toLowerCase().includes(s)
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);
