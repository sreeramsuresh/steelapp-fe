/**
 * Mock Quotation Service
 */

import quotationsData from '../data/quotations.json';

const quotations = [...quotationsData];
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
        q.customerName?.toLowerCase().includes(s),
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);
    
    return {
      quotations: paginatedData,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages },
    };
  },

  async getQuotation(id) {
    await delay();
    const quotation = quotations.find(q => q.id === parseInt(id));
    if (!quotation) {
      throw { response: { status: 404, data: { error: 'Quotation not found' } } };
    }
    return quotation;
  },

  async createQuotation(data) {
    await delay();
    const newQuotation = {
      id: Math.max(...quotations.map(q => q.id), 0) + 1,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    quotations.push(newQuotation);
    return newQuotation;
  },

  async updateQuotation(id, data) {
    await delay();
    const index = quotations.findIndex(q => q.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Quotation not found' } } };
    }
    quotations[index] = {
      ...quotations[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return quotations[index];
  },

  async deleteQuotation(id) {
    await delay();
    const index = quotations.findIndex(q => q.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Quotation not found' } } };
    }
    quotations.splice(index, 1);
    return { message: 'Quotation deleted successfully' };
  },
};

export default quotationService;
export { quotationService };
