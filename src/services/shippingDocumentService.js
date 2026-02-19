import { api } from "./api.js";

export const shippingDocumentService = {
  // Get all shipping documents
  async getShippingDocuments(params = {}) {
    try {
      // api.get() delegates to apiService.get() which already returns response.data
      const data = await api.get("/shipping-documents", { params });
      return data;
    } catch (error) {
      console.error("Error fetching shipping documents:", error);
      throw error;
    }
  },

  // Get single shipping document
  async getShippingDocument(id) {
    try {
      const data = await api.get(`/shipping-documents/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching shipping document:", error);
      throw error;
    }
  },

  // Create new shipping document
  async createShippingDocument(data) {
    try {
      const result = await api.post("/shipping-documents", data);
      return result;
    } catch (error) {
      console.error("Error creating shipping document:", error);
      throw error;
    }
  },

  // Update shipping document
  async updateShippingDocument(id, data) {
    try {
      const result = await api.put(`/shipping-documents/${id}`, data);
      return result;
    } catch (error) {
      console.error("Error updating shipping document:", error);
      throw error;
    }
  },

  // Delete shipping document
  async deleteShippingDocument(id) {
    try {
      const result = await api.delete(`/shipping-documents/${id}`);
      return result;
    } catch (error) {
      console.error("Error deleting shipping document:", error);
      throw error;
    }
  },

  // Update shipping status
  async updateStatus(id, status, notes = "") {
    try {
      const result = await api.patch(`/shipping-documents/${id}/status`, {
        status,
        notes,
      });
      return result;
    } catch (error) {
      console.error("Error updating shipping status:", error);
      throw error;
    }
  },

  // Track shipment
  async trackShipment(id) {
    try {
      const data = await api.get(`/shipping-documents/${id}/track`);
      return data;
    } catch (error) {
      console.error("Error tracking shipment:", error);
      throw error;
    }
  },

  // Get document types
  async getDocumentTypes() {
    try {
      const data = await api.get("/shipping-documents/types/list");
      return data;
    } catch (error) {
      console.error("Error fetching document types:", error);
      throw error;
    }
  },

  // Get shipping status options
  getStatusOptions() {
    return [
      { value: "draft", label: "Draft", color: "gray" },
      { value: "confirmed", label: "Confirmed", color: "blue" },
      { value: "in_transit", label: "In Transit", color: "yellow" },
      { value: "arrived", label: "Arrived", color: "orange" },
      { value: "delivered", label: "Delivered", color: "green" },
      { value: "cancelled", label: "Cancelled", color: "red" },
    ];
  },
};

export default shippingDocumentService;
