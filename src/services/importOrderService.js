import { api } from "./api";

export const importOrderService = {
  // Get all import orders with pagination and filters
  async getImportOrders(params = {}) {
    try {
      // api.get() delegates to apiService.get() which already returns response.data
      const data = await api.get("/import-orders", { params });
      return data;
    } catch (error) {
      console.error("Error fetching import orders:", error);
      throw error;
    }
  },

  // Get single import order by ID
  async getImportOrder(id) {
    try {
      const data = await api.get(`/import-orders/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching import order:", error);
      throw error;
    }
  },

  // Create new import order
  async createImportOrder(data) {
    try {
      const result = await api.post("/import-orders", data);
      return result;
    } catch (error) {
      console.error("Error creating import order:", error);
      throw error;
    }
  },

  // Update import order
  async updateImportOrder(id, data) {
    try {
      const result = await api.put(`/import-orders/${id}`, data);
      return result;
    } catch (error) {
      console.error("Error updating import order:", error);
      throw error;
    }
  },

  // Delete import order
  async deleteImportOrder(id) {
    try {
      const result = await api.delete(`/import-orders/${id}`);
      return result;
    } catch (error) {
      console.error("Error deleting import order:", error);
      throw error;
    }
  },

  // Update import order status
  async updateStatus(id, status, notes = "") {
    try {
      const result = await api.patch(`/import-orders/${id}/status`, {
        status,
        notes,
      });
      return result;
    } catch (error) {
      console.error("Error updating import order status:", error);
      throw error;
    }
  },

  // Get import order items
  async getImportOrderItems(id) {
    try {
      const data = await api.get(`/import-orders/${id}/items`);
      return data;
    } catch (error) {
      console.error("Error fetching import order items:", error);
      throw error;
    }
  },

  // Get import order analytics
  async getImportOrderAnalytics(id) {
    try {
      const data = await api.get(`/import-orders/${id}/analytics`);
      return data;
    } catch (error) {
      console.error("Error fetching import order analytics:", error);
      throw error;
    }
  },

  // Search import orders
  async searchImportOrders(query) {
    try {
      const data = await api.get("/import-orders/search", {
        params: { query },
      });
      return data;
    } catch (error) {
      console.error("Error searching import orders:", error);
      throw error;
    }
  },

  // Get import order status options
  getStatusOptions() {
    return [
      { value: "draft", label: "Draft", color: "gray" },
      { value: "confirmed", label: "Confirmed", color: "blue" },
      { value: "shipped", label: "Shipped", color: "yellow" },
      { value: "in_transit", label: "In Transit", color: "orange" },
      { value: "arrived", label: "Arrived", color: "purple" },
      {
        value: "customs_clearance",
        label: "Customs Clearance",
        color: "indigo",
      },
      { value: "completed", label: "Completed", color: "green" },
      { value: "cancelled", label: "Cancelled", color: "red" },
    ];
  },

  // Get incoterms options
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

export default importOrderService;
