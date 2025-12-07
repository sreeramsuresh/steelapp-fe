/**
 * Mock Customer Service
 */

import customersData from '../data/customers.json';

const customers = [...customersData];
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const customerService = {
  async getCustomers(params = {}) {
    await delay();
    const { page = 1, limit = 20, search, status } = params;
    
    let filtered = [...customers];
    
    if (status && status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.phone?.includes(s),
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);
    
    return {
      customers: paginatedData,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages },
    };
  },

  async getCustomer(id) {
    await delay();
    const customer = customers.find(c => c.id === parseInt(id));
    if (!customer) {
      throw { response: { status: 404, data: { error: 'Customer not found' } } };
    }
    return customer;
  },

  async createCustomer(customerData) {
    await delay();
    const newCustomer = {
      id: Math.max(...customers.map(c => c.id), 0) + 1,
      ...customerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.push(newCustomer);
    return newCustomer;
  },

  async updateCustomer(id, customerData) {
    await delay();
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Customer not found' } } };
    }
    customers[index] = {
      ...customers[index],
      ...customerData,
      updatedAt: new Date().toISOString(),
    };
    return customers[index];
  },

  async deleteCustomer(id, _config = {}) {
    await delay();
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Customer not found' } } };
    }
    customers.splice(index, 1);
    return { message: 'Customer deleted successfully' };
  },

  async archiveCustomer(id) {
    await delay();
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Customer not found' } } };
    }
    customers[index].status = 'archived';
    customers[index].updatedAt = new Date().toISOString();
    return customers[index];
  },

  async restoreCustomer(id) {
    await delay();
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Customer not found' } } };
    }
    customers[index].status = 'active';
    customers[index].updatedAt = new Date().toISOString();
    return customers[index];
  },
};

export default customerService;
