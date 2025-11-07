import { apiClient } from './api';
import { apiService } from './axiosApi';
import { uuid } from '../utils/uuid';

// Payment method options specific to recording payments (not invoice creation modes)
export const PAYMENT_METHODS = ['Cash','Cheque','Bank Transfer','UPI','NEFT','RTGS','Other'];

// Helpers
const LS_KEYS = { inv: 'payables:inv:payments', po: 'payables:po:payments' };
const ls = {
  getAll(scope) {
    try { return JSON.parse(localStorage.getItem(LS_KEYS[scope]) || '{}'); } catch { return {}; }
  },
  saveAll(scope, data) {
    try { localStorage.setItem(LS_KEYS[scope], JSON.stringify(data)); } catch {}
  },
  get(scope, id) {
    const all = ls.getAll(scope); return all[id] || [];
  },
  set(scope, id, payments) {
    const all = ls.getAll(scope); all[id] = payments; ls.saveAll(scope, all);
  },
  add(scope, id, payment) {
    const arr = ls.get(scope, id); const next = [...arr, payment]; ls.set(scope, id, next); return next;
  },
  void(scope, id, paymentId) {
    const arr = ls.get(scope, id);
    const next = arr.map(p => p.id === paymentId ? { ...p, voided: true, voided_at: new Date().toISOString() } : p);
    ls.set(scope, id, next); return next;
  }
};

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
        // Merge in any locally stored payments if backend doesn't include them
        const local = ls.get('inv', inv.id);
        const payments = Array.isArray(inv.payments) && inv.payments.length ? inv.payments : local;
        const merged = { ...inv, payments };
        const derived = computeInvoiceDerived(merged);
        return { ...merged, ...derived };
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
            payments: ls.get('inv', serverData.id),
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
    const local = ls.get('inv', id);
    const payments = Array.isArray(data.payments) && data.payments.length ? data.payments : local;
    const merged = { ...data, payments };
    return { ...merged, ...computeInvoiceDerived(merged) };
  },

  async addInvoicePayment(id, payload) {
    // payload: { payment_date, amount, method, reference_no, notes, attachment_url }
    try {
      const saved = await apiClient.post(`/payables/invoices/${id}/payments`, payload);
      return { ...saved, ...computeInvoiceDerived(saved) };
    } catch (e) {
      // Fallback: store locally so it persists across refresh
      const localPayment = {
        id: payload.id || uuid(),
        created_at: new Date().toISOString(),
        ...payload,
      };
      const current = ls.add('inv', id, localPayment);
      const merged = { id, payments: current };
      return { ...merged, ...computeInvoiceDerived({ invoice_amount: 0, ...merged }) };
    }
  },

  async voidInvoicePayment(id, paymentId, reason) {
    try {
      const saved = await apiClient.post(`/payables/invoices/${id}/payments/${paymentId}/void`, { reason });
      return { ...saved, ...computeInvoiceDerived(saved) };
    } catch (e) {
      const current = ls.void('inv', id, paymentId);
      const merged = { id, payments: current };
      return { ...merged, ...computeInvoiceDerived({ invoice_amount: 0, ...merged }) };
    }
  },

  // POs (Vendor Payables)
  async getPOs(params = {}) {
    try {
      const response = await apiClient.get('/payables/pos', params);
      const list = response.items || response.pos || response;
      const aggregates = response.aggregates || {};
      const items = (Array.isArray(list) ? list : []).map((po) => {
        const local = ls.get('po', po.id);
        const payments = Array.isArray(po.payments) && po.payments.length ? po.payments : local;
        const merged = { ...po, payments };
        return { ...merged, ...computePODerived(merged) };
      });
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
            payments: ls.get('po', serverData.id),
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
    const local = ls.get('po', id);
    const payments = Array.isArray(data.payments) && data.payments.length ? data.payments : local;
    const merged = { ...data, payments };
    return { ...merged, ...computePODerived(merged) };
  },

  async addPOPayment(id, payload) {
    try {
      const saved = await apiClient.post(`/payables/pos/${id}/payments`, payload);
      return { ...saved, ...computePODerived(saved) };
    } catch (e) {
      const localPayment = {
        id: payload.id || uuid(),
        created_at: new Date().toISOString(),
        ...payload,
      };
      const current = ls.add('po', id, localPayment);
      const merged = { id, payments: current };
      return { ...merged, ...computePODerived({ po_value: 0, ...merged }) };
    }
  },

  async voidPOPayment(id, paymentId, reason) {
    try {
      const saved = await apiClient.post(`/payables/pos/${id}/payments/${paymentId}/void`, { reason });
      return { ...saved, ...computePODerived(saved) };
    } catch (e) {
      const current = ls.void('po', id, paymentId);
      const merged = { id, payments: current };
      return { ...merged, ...computePODerived({ po_value: 0, ...merged }) };
    }
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
