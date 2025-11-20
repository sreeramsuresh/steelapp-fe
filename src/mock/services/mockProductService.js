/**
 * Mock Product Service
 */

import productsData from '../data/products.json';

const products = [...productsData];
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
  async getProducts(params = {}) {
    await delay();
    const { page = 1, limit = 20, search, category } = params;
    
    let filtered = [...products];
    
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s),
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);
    
    return {
      products: paginatedData,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages },
    };
  },

  async getProduct(id) {
    await delay();
    const product = products.find(p => p.id === parseInt(id));
    if (!product) {
      throw { response: { status: 404, data: { error: 'Product not found' } } };
    }
    return product;
  },

  async createProduct(productData) {
    await delay();
    const newProduct = {
      id: Math.max(...products.map(p => p.id), 0) + 1,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    return newProduct;
  },

  async updateProduct(id, productData) {
    await delay();
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Product not found' } } };
    }
    products[index] = {
      ...products[index],
      ...productData,
      updatedAt: new Date().toISOString(),
    };
    return products[index];
  },

  async deleteProduct(id) {
    await delay();
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
      throw { response: { status: 404, data: { error: 'Product not found' } } };
    }
    products.splice(index, 1);
    return { message: 'Product deleted successfully' };
  },
};

export default productService;
