import { api } from "./api.js";

export const materialCertificateService = {
  // Get all material certificates
  async getMaterialCertificates(params = {}) {
    try {
      // api.get() delegates to apiService.get() which already returns response.data
      const data = await api.get("/material-certificates", { params });
      return data;
    } catch (error) {
      console.error("Error fetching material certificates:", error);
      throw error;
    }
  },

  // Get single material certificate
  async getMaterialCertificate(id) {
    try {
      const data = await api.get(`/material-certificates/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching material certificate:", error);
      throw error;
    }
  },

  // Create new material certificate
  async createMaterialCertificate(data) {
    try {
      const result = await api.post("/material-certificates", data);
      return result;
    } catch (error) {
      console.error("Error creating material certificate:", error);
      throw error;
    }
  },

  // Update material certificate
  async updateMaterialCertificate(id, data) {
    try {
      const result = await api.put(`/material-certificates/${id}`, data);
      return result;
    } catch (error) {
      console.error("Error updating material certificate:", error);
      throw error;
    }
  },

  // Delete material certificate
  async deleteMaterialCertificate(id) {
    try {
      const result = await api.delete(`/material-certificates/${id}`);
      return result;
    } catch (error) {
      console.error("Error deleting material certificate:", error);
      throw error;
    }
  },

  // Update verification status
  async updateVerification(id, verification_status, notes = "") {
    try {
      const result = await api.patch(`/material-certificates/${id}/verify`, {
        verification_status,
        notes,
      });
      return result;
    } catch (error) {
      console.error("Error updating verification status:", error);
      throw error;
    }
  },

  // Get certificate types
  async getCertificateTypes() {
    try {
      const data = await api.get("/material-certificates/types/list");
      return data;
    } catch (error) {
      console.error("Error fetching certificate types:", error);
      throw error;
    }
  },

  // Get material grades
  async getMaterialGrades() {
    try {
      const data = await api.get("/material-certificates/grades/list");
      return data;
    } catch (error) {
      console.error("Error fetching material grades:", error);
      throw error;
    }
  },

  // Get verification status options
  getVerificationStatusOptions() {
    return [
      { value: "pending", label: "Pending", color: "yellow" },
      { value: "verified", label: "Verified", color: "green" },
      { value: "rejected", label: "Rejected", color: "red" },
      { value: "expired", label: "Expired", color: "gray" },
    ];
  },
};

export default materialCertificateService;
