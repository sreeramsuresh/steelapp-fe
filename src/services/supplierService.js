import { apiClient } from "./api";

const LS_KEY = "steel-app-suppliers";

const ls = {
  all() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  },
  save(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch {
      /* ignore storage errors */
    }
  },
  upsert(s) {
    const list = ls.all();
    const idx = list.findIndex((x) => x.id === s.id);
    if (idx >= 0) list[idx] = s;
    else list.push(s);
    ls.save(list);
    return s;
  },
  remove(id) {
    const list = ls.all().filter((x) => x.id !== id);
    ls.save(list);
  },
};

export const supplierService = {
  async getSuppliers(params = {}) {
    // Safeguard: some backends don't expose /suppliers. Avoid noisy 404 logs.
    const enabled =
      (import.meta.env.VITE_ENABLE_SUPPLIERS || "").toString().toLowerCase() ===
      "true";
    if (!enabled) {
      // Use local storage cache only
      return { suppliers: ls.all() };
    }
    try {
      const res = await apiClient.get("/suppliers", params);
      const suppliers = res.suppliers || res.items || res || [];
      return { suppliers };
    } catch (e) {
      return { suppliers: ls.all() };
    }
  },

  async getSupplier(id) {
    try {
      return await apiClient.get(`/suppliers/${id}`);
    } catch {
      return ls.all().find((s) => s.id === id);
    }
  },

  async createSupplier(data) {
    try {
      return await apiClient.post("/suppliers", data);
    } catch {
      const local = { ...data, id: data.id || `sup_${Date.now()}` };
      return ls.upsert(local);
    }
  },

  async updateSupplier(id, data) {
    try {
      return await apiClient.put(`/suppliers/${id}`, data);
    } catch {
      const updated = { ...data, id };
      return ls.upsert(updated);
    }
  },

  async deleteSupplier(id) {
    try {
      return await apiClient.delete(`/suppliers/${id}`);
    } catch {
      ls.remove(id);
      return { success: true };
    }
  },
};

export default supplierService;
