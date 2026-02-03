import { api } from "./api";

export const customsDocumentService = {
  // Get all customs documents
  async getCustomsDocuments(params = {}) {
    try {
      // api.get() delegates to apiService.get() which already returns response.data
      const data = await api.get("/customs-documents", { params });
      return data;
    } catch (error) {
      console.error("Error fetching customs documents:", error);
      throw error;
    }
  },

  // Get single customs document
  async getCustomsDocument(id) {
    try {
      const data = await api.get(`/customs-documents/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching customs document:", error);
      throw error;
    }
  },

  // Create new customs document
  async createCustomsDocument(data) {
    try {
      const result = await api.post("/customs-documents", data);
      return result;
    } catch (error) {
      console.error("Error creating customs document:", error);
      throw error;
    }
  },

  // Update customs document
  async updateCustomsDocument(id, data) {
    try {
      const result = await api.put(`/customs-documents/${id}`, data);
      return result;
    } catch (error) {
      console.error("Error updating customs document:", error);
      throw error;
    }
  },

  // Delete customs document
  async deleteCustomsDocument(id) {
    try {
      const result = await api.delete(`/customs-documents/${id}`);
      return result;
    } catch (error) {
      console.error("Error deleting customs document:", error);
      throw error;
    }
  },

  // Update clearance status
  async updateClearance(id, clearance_status, notes = "", clearance_date = null) {
    try {
      const result = await api.patch(`/customs-documents/${id}/clearance`, {
        clearance_status,
        notes,
        clearance_date,
      });
      return result;
    } catch (error) {
      console.error("Error updating clearance status:", error);
      throw error;
    }
  },

  // Calculate customs duties
  async calculateDuties(id, data) {
    try {
      const result = await api.post(`/customs-documents/${id}/calculate-duties`, data);
      return result;
    } catch (error) {
      console.error("Error calculating duties:", error);
      throw error;
    }
  },

  // Get document types
  async getDocumentTypes() {
    try {
      const data = await api.get("/customs-documents/types/list");
      return data;
    } catch (error) {
      console.error("Error fetching document types:", error);
      throw error;
    }
  },

  // Get HS codes for stainless steel
  async getHsCodes() {
    try {
      const data = await api.get("/customs-documents/hs-codes/list");
      return data;
    } catch (error) {
      console.error("Error fetching HS codes:", error);
      throw error;
    }
  },

  // Get clearance status options
  getClearanceStatusOptions() {
    return [
      { value: "pending", label: "Pending", color: "gray" },
      { value: "submitted", label: "Submitted", color: "blue" },
      { value: "under_review", label: "Under Review", color: "yellow" },
      { value: "cleared", label: "Cleared", color: "green" },
      { value: "rejected", label: "Rejected", color: "red" },
      { value: "on_hold", label: "On Hold", color: "orange" },
    ];
  },
};

export default customsDocumentService;
