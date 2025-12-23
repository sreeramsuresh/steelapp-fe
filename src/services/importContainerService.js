import { apiClient } from "./api";

/**
 * Import Container Service
 *
 * API service for managing import containers.
 * Handles CRUD operations and status updates for container shipments.
 */

export const importContainerService = {
  /**
   * List containers with pagination and filters
   * Company ID is automatically added by backend from authenticated user context
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.status - Filter by status
   * @param {number} params.supplierId - Filter by supplier
   * @param {string} params.etaFrom - Filter by ETA start date
   * @param {string} params.etaTo - Filter by ETA end date
   * @param {string} params.search - Search by container number
   */
  async getContainers(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
    };

    if (params.status) queryParams.status = params.status;
    if (params.supplierId) queryParams.supplierId = params.supplierId;
    if (params.etaFrom) queryParams.etaFrom = params.etaFrom;
    if (params.etaTo) queryParams.etaTo = params.etaTo;
    if (params.search) queryParams.search = params.search;

    return apiClient.get("/import-containers", queryParams);
  },

  /**
   * Get container by ID
   */
  async getContainer(id) {
    return apiClient.get(`/import-containers/${id}`);
  },

  /**
   * Create a new container
   */
  async createContainer(data) {
    return apiClient.post("/import-containers", data);
  },

  /**
   * Update an existing container
   */
  async updateContainer(id, data) {
    return apiClient.put(`/import-containers/${id}`, data);
  },

  /**
   * Delete a container
   */
  async deleteContainer(id) {
    return apiClient.delete(`/import-containers/${id}`);
  },

  /**
   * Update container status
   */
  async updateStatus(id, status) {
    return apiClient.put(`/import-containers/${id}/status`, { status });
  },

  /**
   * Mark container as arrived
   */
  async markArrived(id, ata) {
    return apiClient.put(`/import-containers/${id}/arrived`, { ata });
  },

  /**
   * Mark container as customs cleared
   */
  async markCleared(id, customsClearedDate) {
    return apiClient.put(`/import-containers/${id}/cleared`, {
      customsClearedDate,
    });
  },

  /**
   * Get containers by supplier
   */
  async getBySupplier(supplierId, params = {}) {
    return apiClient.get(`/import-containers/supplier/${supplierId}`, params);
  },

  /**
   * Get containers by status
   */
  async getByStatus(status, params = {}) {
    return apiClient.get(`/import-containers/status/${status}`, params);
  },

  /**
   * Get containers currently in transit
   */
  async getInTransit(params = {}) {
    return apiClient.get("/import-containers/in-transit", params);
  },
};

export default importContainerService;
