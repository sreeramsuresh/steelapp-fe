import { apiClient } from './api';
import { apiService } from './axiosApi';

// Payment method options specific to recording payments (not invoice creation modes)
export const PAYMENT_METHODS = ['Cash','Cheque','Bank Transfer','UPI','NEFT','RTGS','Other'];

// Helpers
const computeInvoiceDerived = (inv) => {
  const payments = (inv.payments || []).filter(p => !p.voided);
  const received = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const total = Number(inv.invoice_amount ?? inv.total ?? 0);
  const outstanding = Math.max(0, +(total - received).toFixed(2));
  const today = new Date().toISOString().slice(0,10);
  const dueDate = inv.due_date || inv.dueDate || today;
  let status = 'unpaid';
  if (outstanding === 0 && total > 0) status = 'paid';
  else if (outstanding < total && outstanding > 0) status = 'partially_paid';
  else status = 'unpaid';
  const overdue = (dueDate < today) && outstanding > 0;
  if (overdue) status = 'overdue';
  return { received, outstanding, status };
};

const computePODerived = (po) => {
  const payments = (po.payments || []).filter(p => !p.voided);
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const total = Number(po.po_value ?? po.total ?? 0);
  const balance = Math.max(0, +(total - paid).toFixed(2));
  const today = new Date().toISOString().slice(0,10);
  const dueDate = po.due_date || po.dueDate || today;
  let status = 'unpaid';
  if (balance === 0 && total > 0) status = 'paid';
  else if (balance < total && balance > 0) status = 'partially_paid';
  else status = 'unpaid';
  const overdue = (dueDate < today) && balance > 0;
  if (overdue) status = 'overdue';
  return { paid, balance, status };
};

export const payablesService = {
  // Invoices (Customer Receivables)
  async getInvoices(params = {}) {
    try {
      // Prefer backend if available
      const response = await apiClient.get('/payables/invoices', params);
      const list = response.items || response.invoices || response;
      const aggregates = response.aggregates || {};
      const items = (Array.isArray(list) ? list : []).map((inv) => {
        const derived = computeInvoiceDerived(inv);
        return { ...inv, ...derived };
      });
      return { items, aggregates };
    } catch (e) {
      // Fallback: derive from /invoices and assume no payments
      try {
        const res = await apiClient.get('/invoices', params);
        const invoices = res.invoices || res;
        const items = (Array.isArray(invoices) ? invoices : []).map((serverData) => {
          const inv = {
            id: serverData.id,
            invoice_no: serverData.invoice_number || serverData.invoiceNo || serverData.invoiceNumber,
            customer: serverData.customer_details || serverData.customer,
            invoice_date: serverData.invoice_date || serverData.date,
            due_date: serverData.due_date || serverData.dueDate,
            currency: serverData.currency || 'AED',
            invoice_amount: serverData.total,
            payments: [],
          };
          const derived = computeInvoiceDerived(inv);
          return { ...inv, ...derived };
        });
        return { items, aggregates: {} };
      } catch (e2) {
        return { items: [], aggregates: {} };
      }
    }
  },

  async getInvoice(id) {
    const data = await apiClient.get(`/payables/invoices/${id}`);
    return { ...data, ...computeInvoiceDerived(data) };
  },

  async addInvoicePayment(id, payload) {
    // payload: { payment_date, amount, method, reference_no, notes, attachment_url }
    const saved = await apiClient.post(`/payables/invoices/${id}/payments`, payload);
    return { ...saved, ...computeInvoiceDerived(saved) };
  },

  async voidInvoicePayment(id, paymentId, reason) {
    const saved = await apiClient.post(`/payables/invoices/${id}/payments/${paymentId}/void`, { reason });
    return { ...saved, ...computeInvoiceDerived(saved) };
  },

  // POs (Vendor Payables)
  async getPOs(params = {}) {
    try {
      const response = await apiClient.get('/payables/pos', params);
      const list = response.items || response.pos || response;
      const aggregates = response.aggregates || {};
      const items = (Array.isArray(list) ? list : []).map((po) => ({ ...po, ...computePODerived(po) }));
      return { items, aggregates };
    } catch (e) {
      try {
        const res = await apiClient.get('/purchase-orders', params);
        const pos = res.purchase_orders || res.items || res;
        const items = (Array.isArray(pos) ? pos : []).map((serverData) => {
          const po = {
            id: serverData.id,
            po_no: serverData.po_number || serverData.po_no,
            vendor: serverData.vendor || serverData.seller,
            po_date: serverData.po_date || serverData.date,
            due_date: serverData.due_date || serverData.dueDate,
            currency: serverData.currency || 'AED',
            po_value: serverData.total || serverData.po_value,
            payments: [],
          };
          return { ...po, ...computePODerived(po) };
        });
        return { items, aggregates: {} };
      } catch (e2) {
        return { items: [], aggregates: {} };
      }
    }
  },

  async getPO(id) {
    const data = await apiClient.get(`/payables/pos/${id}`);
    return { ...data, ...computePODerived(data) };
  },

  async addPOPayment(id, payload) {
    const saved = await apiClient.post(`/payables/pos/${id}/payments`, payload);
    return { ...saved, ...computePODerived(saved) };
  },

  async voidPOPayment(id, paymentId, reason) {
    const saved = await apiClient.post(`/payables/pos/${id}/payments/${paymentId}/void`, { reason });
    return { ...saved, ...computePODerived(saved) };
  },

  // Export CSV/XLSX back-end if available
  async export(scope = 'invoices', params = {}) {
    return apiClient.get('/payables/exports', { scope, ...params });
  },

  // Export and download as blob (csv or xlsx)
  async exportDownload(scope = 'invoices', params = {}, format = 'csv') {
    const query = apiService.cleanParams({ scope, format, ...params });
    const qs = new URLSearchParams(query).toString();
    const blob = await apiService.request({ method: 'GET', url: `/payables/exports?${qs}`, responseType: 'blob' });
    return blob; // Caller handles filename
  },

  // Receipts/Vouchers: download/email
  async downloadInvoiceReceipt(invoiceId, paymentId) {
    const url = `/payables/invoices/${invoiceId}/payments/${paymentId}/receipt`;
    return apiService.request({ method: 'GET', url, responseType: 'blob' });
  },
  async emailInvoiceReceipt(invoiceId, paymentId) {
    const url = `/payables/invoices/${invoiceId}/payments/${paymentId}/email`;
    return apiClient.post(url, {});
  },
  async downloadPOVoucher(poId, paymentId) {
    const url = `/payables/pos/${poId}/payments/${paymentId}/voucher`;
    return apiService.request({ method: 'GET', url, responseType: 'blob' });
  },
  async emailPOVoucher(poId, paymentId) {
    const url = `/payables/pos/${poId}/payments/${paymentId}/email`;
    return apiClient.post(url, {});
  },
};
