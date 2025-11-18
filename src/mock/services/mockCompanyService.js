/**
 * Mock Company Service
 * Simulates company profile API
 */

import companyData from '../data/company.json';

// In-memory copy
let company = { ...companyData };

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const companyService = {
  async getCompany() {
    await delay();
    return company;
  },

  async updateCompany(companyData) {
    await delay();
    company = {
      ...company,
      ...companyData,
      updatedAt: new Date().toISOString()
    };
    return company;
  },

  async updateCompanyById(id, companyData) {
    await delay();
    company = {
      ...company,
      ...companyData,
      id: parseInt(id),
      updatedAt: new Date().toISOString()
    };
    return company;
  },

  async uploadLogo(file) {
    await delay();
    // Simulate file upload - return mock URL
    const mockUrl = `/mock-assets/company-logo.svg`;
    company.logo_url = mockUrl;
    company.pdf_logo_url = mockUrl;
    return { logo_url: mockUrl, pdf_logo_url: mockUrl };
  },

  async deleteLogo(filename) {
    await delay();
    company.logo_url = null;
    company.pdf_logo_url = null;
    return { message: 'Logo deleted successfully' };
  },

  async uploadPdfLogo(file) {
    await delay();
    const mockUrl = `/mock-assets/company-logo.svg`;
    company.pdf_logo_url = mockUrl;
    return { pdf_logo_url: mockUrl };
  },

  async deletePdfLogo(filename) {
    await delay();
    company.pdf_logo_url = null;
    return { message: 'PDF logo deleted successfully' };
  },

  async uploadSeal(file) {
    await delay();
    const mockUrl = `/mock-assets/company-seal.svg`;
    company.pdf_seal_url = mockUrl;
    return { pdf_seal_url: mockUrl };
  },

  async deleteSeal(filename) {
    await delay();
    company.pdf_seal_url = null;
    return { message: 'Seal deleted successfully' };
  }
};

export default companyService;
