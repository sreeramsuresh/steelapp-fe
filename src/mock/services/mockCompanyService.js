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

  async updateCompany(updateData) {
    await delay();
    company = {
      ...company,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    return company;
  },

  async updateCompanyById(id, updateData) {
    await delay();
    company = {
      ...company,
      ...updateData,
      id: parseInt(id),
      updatedAt: new Date().toISOString(),
    };
    return company;
  },

  async uploadLogo(_file) {
    await delay();
    // Simulate file upload - return mock URL
    const mockUrl = `/mock-assets/company-logo.svg`;
    company.logoUrl = mockUrl;
    company.pdfLogoUrl = mockUrl;
    return { logo_url: mockUrl, pdf_logo_url: mockUrl };
  },

  async deleteLogo(_filename) {
    await delay();
    company.logoUrl = null;
    company.pdfLogoUrl = null;
    return { message: 'Logo deleted successfully' };
  },

  async uploadPdfLogo(_file) {
    await delay();
    const mockUrl = `/mock-assets/company-logo.svg`;
    company.pdfLogoUrl = mockUrl;
    return { pdf_logo_url: mockUrl };
  },

  async deletePdfLogo(_filename) {
    await delay();
    company.pdfLogoUrl = null;
    return { message: 'PDF logo deleted successfully' };
  },

  async uploadSeal(_file) {
    await delay();
    const mockUrl = `/mock-assets/company-seal.svg`;
    company.pdfSealUrl = mockUrl;
    return { pdf_seal_url: mockUrl };
  },

  async deleteSeal(_filename) {
    await delay();
    company.pdfSealUrl = null;
    return { message: 'Seal deleted successfully' };
  },
};

export default companyService;
