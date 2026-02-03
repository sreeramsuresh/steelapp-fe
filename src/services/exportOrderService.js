import { api } from "./api.js";

export const exportOrderService = {
  // Get all export orders with pagination and filters
  async getExportOrders(params = {}) {
    try {
      // api.get() delegates to apiService.get() which already returns response.data
      const data = await api.get("/export-orders", { params });
      return data;
    } catch (error) {
      console.error("Error fetching export orders:", error);
      throw error;
    }
  },

  // Get single export order by ID
  async getExportOrder(id) {
    try {
      const data = await api.get(`/export-orders/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching export order:", error);
      throw error;
    }
  },

  // Create new export order
  async createExportOrder(data) {
    try {
      const result = await api.post("/export-orders", data);
      return result;
    } catch (error) {
      console.error("Error creating export order:", error);
      throw error;
    }
  },

  // Update export order
  async updateExportOrder(id, data) {
    try {
      const result = await api.put(`/export-orders/${id}`, data);
      return result;
    } catch (error) {
      console.error("Error updating export order:", error);
      throw error;
    }
  },

  // Delete export order
  async deleteExportOrder(id) {
    try {
      const result = await api.delete(`/export-orders/${id}`);
      return result;
    } catch (error) {
      console.error("Error deleting export order:", error);
      throw error;
    }
  },

  // Update export order status
  async updateStatus(id, status, notes = "") {
    try {
      const result = await api.patch(`/export-orders/${id}/status`, {
        status,
        notes,
      });
      return result;
    } catch (error) {
      console.error("Error updating export order status:", error);
      throw error;
    }
  },

  // Get export order items
  async getExportOrderItems(id) {
    try {
      const data = await api.get(`/export-orders/${id}/items`);
      return data;
    } catch (error) {
      console.error("Error fetching export order items:", error);
      throw error;
    }
  },

  // Get export order analytics
  async getExportOrderAnalytics(id) {
    try {
      const data = await api.get(`/export-orders/${id}/analytics`);
      return data;
    } catch (error) {
      console.error("Error fetching export order analytics:", error);
      throw error;
    }
  },

  // Search export orders
  async searchExportOrders(query) {
    try {
      const data = await api.get("/export-orders/search", {
        params: { query },
      });
      return data;
    } catch (error) {
      console.error("Error searching export orders:", error);
      throw error;
    }
  },

  // Get export order status options
  getStatusOptions() {
    return [
      { value: "draft", label: "Draft", color: "gray" },
      { value: "confirmed", label: "Confirmed", color: "blue" },
      { value: "preparing", label: "Preparing Shipment", color: "yellow" },
      { value: "shipped", label: "Shipped", color: "orange" },
      { value: "in_transit", label: "In Transit", color: "purple" },
      { value: "delivered", label: "Delivered", color: "green" },
      { value: "completed", label: "Completed", color: "green" },
      { value: "cancelled", label: "Cancelled", color: "red" },
    ];
  },

  // Get incoterms options (same as import)
  getIncotermsOptions() {
    return [
      { value: "EXW", label: "EXW - Ex Works" },
      { value: "FCA", label: "FCA - Free Carrier" },
      { value: "CPT", label: "CPT - Carriage Paid To" },
      { value: "CIP", label: "CIP - Carriage & Insurance Paid" },
      { value: "DAT", label: "DAT - Delivered At Terminal" },
      { value: "DAP", label: "DAP - Delivered At Place" },
      { value: "DDP", label: "DDP - Delivered Duty Paid" },
      { value: "FAS", label: "FAS - Free Alongside Ship" },
      { value: "FOB", label: "FOB - Free On Board" },
      { value: "CFR", label: "CFR - Cost & Freight" },
      { value: "CIF", label: "CIF - Cost, Insurance & Freight" },
    ];
  },

  // Get payment methods
  getPaymentMethods() {
    return [
      { value: "advance", label: "Advance Payment" },
      { value: "letter_of_credit", label: "Letter of Credit" },
      { value: "open_account", label: "Open Account" },
      {
        value: "documents_against_payment",
        label: "Documents Against Payment",
      },
      {
        value: "documents_against_acceptance",
        label: "Documents Against Acceptance",
      },
      { value: "bank_guarantee", label: "Bank Guarantee" },
      { value: "escrow", label: "Escrow" },
    ];
  },
};

export default exportOrderService;
