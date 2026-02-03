import { PAYMENT_MODES } from "../utils/paymentUtils";
import { uuid } from "../utils/uuid";
import { apiClient } from "./api.js";
import { apiService } from "./axiosApi.js";

// Re-export PAYMENT_MODES for convenience
export { PAYMENT_MODES };

// Helpers
const LS_KEYS = { inv: "payables:inv:payments", po: "payables:po:payments" };
const ls = {
  getAll(scope) {
    try {
      return JSON.parse(localStorage.getItem(LS_KEYS[scope]) || "{}");
    } catch {
      return {};
    }
  },
  saveAll(scope, data) {
    try {
      localStorage.setItem(LS_KEYS[scope], JSON.stringify(data));
    } catch {
      /* ignore storage errors */
    }
  },
  get(scope, id) {
    const all = ls.getAll(scope);
    return all[id] || [];
  },
  set(scope, id, payments) {
    const all = ls.getAll(scope);
    all[id] = payments;
    ls.saveAll(scope, all);
  },
  add(scope, id, payment) {
    const arr = ls.get(scope, id);
    const next = [...arr, payment];
    ls.set(scope, id, next);
    return next;
  },
  void(scope, id, paymentId) {
    const arr = ls.get(scope, id);
    const next = arr.map((p) => (p.id === paymentId ? { ...p, voided: true, voided_at: new Date().toISOString() } : p));
    ls.set(scope, id, next);
    return next;
  },
};

const computeInvoiceDerived = (inv) => {
  const payments = (inv.payments || []).filter((p) => !p.voided);
  const received = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  // Handle multiple field name variations (camelCase from API Gateway, various backend formats)
  const total = Number(inv.invoiceAmount || inv.totalAmount || inv.total || inv.invoice_amount || 0);
  const outstanding = Math.max(0, +(total - received).toFixed(2));
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = inv.dueDate || inv.due_date || today;
  let status = "unpaid";
  if (outstanding === 0 && total > 0) status = "paid";
  else if (outstanding < total && outstanding > 0) status = "partially_paid";
  else status = "unpaid";
  const overdue = dueDate < today && outstanding > 0;
  if (overdue) status = "overdue";
  return { received, outstanding, status, invoiceAmount: total };
};

const computePODerived = (po) => {
  const payments = (po.payments || []).filter((p) => !p.voided);
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  // Handle multiple field name variations (camelCase from API Gateway, various backend formats)
  const total = Number(po.poValue || po.total || po.po_value || 0);
  const balance = Math.max(0, +(total - paid).toFixed(2));
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = po.dueDate || po.due_date || today;
  let status = "unpaid";
  if (balance === 0 && total > 0) status = "paid";
  else if (balance < total && balance > 0) status = "partially_paid";
  else status = "unpaid";
  const overdue = dueDate < today && balance > 0;
  if (overdue) status = "overdue";
  return { paid, balance, status };
};

export const payablesService = {
  // Invoices (Customer Receivables)
  async getInvoices(params = {}) {
    try {
      const response = await apiClient.get("/payables/invoices", params);
      const list = response.items || response.invoices || response;
      const aggregates = response.aggregates || {};

      // Ensure status is computed correctly based on payments data
      // Backend may return stale status - recompute from received/outstanding/payments
      const items = (Array.isArray(list) ? list : []).map((inv) => {
        // Compute derived fields to ensure status is accurate
        const computed = computeInvoiceDerived(inv);
        return { ...inv, ...computed };
      });

      return { items, aggregates };
    } catch (_e) {
      console.error("Error fetching invoices:", _e);
      return { items: [], aggregates: {} };
    }
  },

  async getInvoice(id) {
    const data = await apiClient.get(`/payables/invoices/${id}`);
    const local = ls.get("inv", id);
    const payments = Array.isArray(data.payments) && data.payments.length ? data.payments : local;
    const merged = { ...data, payments };
    return { ...merged, ...computeInvoiceDerived(merged) };
  },

  async addInvoicePayment(id, payload) {
    // payload: { payment_date, amount, method, reference_no, notes, attachment_url }
    try {
      const saved = await apiClient.post(`/payables/invoices/${id}/payments`, payload);
      return { ...saved, ...computeInvoiceDerived(saved) };
    } catch (_e) {
      // Fallback: store locally so it persists across refresh
      const localPayment = {
        id: payload.id || uuid(),
        created_at: new Date().toISOString(),
        ...payload,
      };
      const current = ls.add("inv", id, localPayment);
      const merged = { id, payments: current };
      return {
        ...merged,
        ...computeInvoiceDerived({ invoice_amount: 0, ...merged }),
      };
    }
  },

  async voidInvoicePayment(id, paymentId, reason) {
    try {
      const saved = await apiClient.post(`/payables/invoices/${id}/payments/${paymentId}/void`, { reason });
      return { ...saved, ...computeInvoiceDerived(saved) };
    } catch (_e) {
      const current = ls.void("inv", id, paymentId);
      const merged = { id, payments: current };
      return {
        ...merged,
        ...computeInvoiceDerived({ invoice_amount: 0, ...merged }),
      };
    }
  },

  // POs (Vendor Payables)
  async getPOs(params = {}) {
    try {
      const response = await apiClient.get("/payables/pos", params);
      const list = response.items || response.pos || response;
      const aggregates = response.aggregates || {};

      // Ensure status is computed correctly based on payments data
      // Backend may return stale status - recompute from paid/balance/payments
      const items = (Array.isArray(list) ? list : []).map((po) => {
        // Normalize field names from snake_case to camelCase
        const normalized = {
          ...po,
          poNo: po.poNo || po.poNumber || po.po_number || "",
          poNumber: po.poNumber || po.po_number || "",
          poDate: po.poDate || po.po_date,
          dueDate: po.dueDate || po.due_date,
          poValue: parseFloat(po.poValue || po.total_amount || po.po_value || 0),
          supplierId: po.supplierId || po.supplier_id,
          supplierName: po.supplierName || po.supplier_name || "",
        };
        // Compute derived fields to ensure status is accurate
        const computed = computePODerived(normalized);
        return { ...normalized, ...computed };
      });

      return { items, aggregates };
    } catch (_e) {
      console.error("Error fetching POs:", _e);
      return { items: [], aggregates: {} };
    }
  },

  async getPO(id) {
    const data = await apiClient.get(`/payables/pos/${id}`);
    const local = ls.get("po", id);
    const payments = Array.isArray(data.payments) && data.payments.length ? data.payments : local;
    const merged = { ...data, payments };
    return { ...merged, ...computePODerived(merged) };
  },

  async addPOPayment(id, payload) {
    try {
      const saved = await apiClient.post(`/payables/pos/${id}/payments`, payload);
      return { ...saved, ...computePODerived(saved) };
    } catch (_e) {
      const localPayment = {
        id: payload.id || uuid(),
        created_at: new Date().toISOString(),
        ...payload,
      };
      const current = ls.add("po", id, localPayment);
      const merged = { id, payments: current };
      return { ...merged, ...computePODerived({ po_value: 0, ...merged }) };
    }
  },

  async voidPOPayment(id, paymentId, reason) {
    try {
      const saved = await apiClient.post(`/payables/pos/${id}/payments/${paymentId}/void`, { reason });
      return { ...saved, ...computePODerived(saved) };
    } catch (_e) {
      const current = ls.void("po", id, paymentId);
      const merged = { id, payments: current };
      return { ...merged, ...computePODerived({ po_value: 0, ...merged }) };
    }
  },

  // Export CSV/XLSX back-end if available
  async export(scope = "invoices", params = {}) {
    return apiClient.get("/payables/exports", { scope, ...params });
  },

  // Export and download as blob (csv or xlsx)
  async exportDownload(scope = "invoices", params = {}, format = "csv") {
    const query = apiService.cleanParams({ scope, format, ...params });
    const qs = new URLSearchParams(query).toString();
    const blob = await apiService.request({
      method: "GET",
      url: `/payables/exports?${qs}`,
      responseType: "blob",
    });
    return blob; // Caller handles filename
  },

  // Receipts/Vouchers: download/email
  async downloadInvoiceReceipt(invoiceId, paymentId) {
    const url = `/payables/invoices/${invoiceId}/payments/${paymentId}/receipt`;
    return apiService.request({ method: "GET", url, responseType: "blob" });
  },
  async emailInvoiceReceipt(invoiceId, paymentId) {
    const url = `/payables/invoices/${invoiceId}/payments/${paymentId}/email`;
    return apiClient.post(url, {});
  },
  async downloadPOVoucher(poId, paymentId) {
    const url = `/payables/pos/${poId}/payments/${paymentId}/voucher`;
    return apiService.request({ method: "GET", url, responseType: "blob" });
  },
  async emailPOVoucher(poId, paymentId) {
    const url = `/payables/pos/${poId}/payments/${paymentId}/email`;
    return apiClient.post(url, {});
  },
};
