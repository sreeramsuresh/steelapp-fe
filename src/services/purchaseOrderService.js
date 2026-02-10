import { apiClient } from "./api.js";
import { apiService } from "./axiosApi.js";

export const purchaseOrderService = {
  // Get all purchase orders with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get("/purchase-orders", params);
  },

  // Get purchase order by ID
  getById: (id) => {
    return apiClient.get(`/purchase-orders/${id}`);
  },

  // Create purchase order
  create: (poData) => {
    return apiClient.post("/purchase-orders", poData);
  },

  // Update purchase order
  update: (id, poData) => {
    return apiClient.put(`/purchase-orders/${id}`, poData);
  },

  // Update only transit status (if backend supports it)
  updateTransitStatus: (id, transit_status) => {
    return apiClient.patch(`/purchase-orders/${id}/transit-status`, {
      transit_status,
    });
  },

  // Update purchase order status
  updateStatus: (id, status) => {
    return apiClient.patch(`/purchase-orders/${id}/status`, { status });
  },

  // Update purchase order stock status
  updateStockStatus: (id, stock_status) => {
    return apiClient.patch(`/purchase-orders/${id}/stock-status`, {
      stock_status,
    });
  },

  // Delete purchase order
  delete: (id) => {
    return apiClient.delete(`/purchase-orders/${id}`);
  },

  // Get next PO number
  getNextNumber: () => {
    return apiClient.get("/purchase-orders/number/next");
  },

  // Get warehouses
  getWarehouses: () => {
    return apiClient.get("/warehouses");
  },

  // Seed warehouses
  seedWarehouses: () => {
    return apiClient.post("/warehouses/seed");
  },

  // Create dropship PO from invoice items
  createDropshipPO: ({ invoiceId, itemIds, supplierId, supplierDetails }) => {
    return apiClient.post("/purchase-orders/from-invoice", {
      invoiceId,
      itemIds,
      supplierId,
      supplierDetails,
    });
  },

  // Receive dropship goods to warehouse after customer rejection
  receiveToWarehouse: (id, data) => {
    return apiClient.post(`/purchase-orders/${id}/receive-to-warehouse`, data);
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const blob = await apiService.request({
      method: "GET",
      url: `/purchase-orders/${id}/pdf`,
      responseType: "blob",
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = `PurchaseOrder-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  },
};
