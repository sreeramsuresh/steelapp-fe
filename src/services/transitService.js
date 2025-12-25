import { apiClient } from "./api";

export const transitService = {
  // Get all items in transit
  getAll: (params = {}) => {
    // This combines data from invoices and purchase orders that are in transit
    return apiClient.get("/transit", params);
  },

  // Get transit tracking for specific item
  getTracking: (type, id) => {
    return apiClient.get(`/transit/${type}/${id}`);
  },

  // Update transit status
  updateStatus: (type, id, status) => {
    return apiClient.patch(`/transit/${type}/${id}/status`, { status });
  },
};
