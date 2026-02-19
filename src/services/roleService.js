import { apiClient } from "./api.js";

/**
 * Role and Permission Service
 * Handles all role and permission-related API calls
 */

export const roleService = {
  /**
   * Get all roles
   */
  async getRoles() {
    const response = await apiClient.get("/roles");
    return response;
  },

  /**
   * Get available roles (for dropdowns)
   */
  async getAvailableRoles() {
    const response = await apiClient.get("/roles/list/available");
    return response;
  },

  /**
   * Get role details by ID
   */
  async getRole(roleId) {
    const response = await apiClient.get(`/roles/${roleId}`);
    return response;
  },

  /**
   * Create new role (Director only)
   */
  async createRole(roleData) {
    const response = await apiClient.post("/roles", roleData);
    return response;
  },

  /**
   * Update role (Director only)
   */
  async updateRole(roleId, roleData) {
    const response = await apiClient.put(`/roles/${roleId}`, roleData);
    return response;
  },

  /**
   * Delete role (Director only)
   */
  async deleteRole(roleId) {
    const response = await apiClient.delete(`/roles/${roleId}`);
    return response;
  },

  /**
   * Get all permissions grouped by module
   */
  async getAllPermissions() {
    const response = await apiClient.get("/roles/permissions/all");
    return response;
  },

  /**
   * Get user permissions
   */
  async getUserPermissions(userId) {
    const response = await apiClient.get(`/roles/users/${userId}/permissions`);
    return response;
  },

  /**
   * Assign roles to user (Director only)
   */
  async assignRoles(userId, roleIds) {
    const response = await apiClient.post(`/roles/users/${userId}/roles`, {
      role_ids: roleIds,
    });
    return response;
  },

  /**
   * Replace all user roles (Director only)
   */
  async replaceUserRoles(userId, roleIds) {
    const response = await apiClient.put(`/roles/users/${userId}/roles`, {
      role_ids: roleIds,
    });
    return response;
  },

  /**
   * Remove role from user (Director only)
   */
  async removeRole(userId, roleId) {
    const response = await apiClient.delete(`/roles/users/${userId}/roles/${roleId}`);
    return response;
  },

  /**
   * Grant custom permission to user (Director only)
   */
  async grantCustomPermission(userId, permissionKey, reason, expiresAt = null) {
    const response = await apiClient.post(`/roles/users/${userId}/permissions/grant`, {
      permission_key: permissionKey,
      reason,
      expires_at: expiresAt,
    });
    return response;
  },

  /**
   * Revoke custom permission from user (Director only)
   */
  async revokeCustomPermission(userId, permissionKey, reason = null) {
    const response = await apiClient.delete(`/roles/users/${userId}/permissions/${permissionKey}`, {
      data: { reason },
    });
    return response;
  },

  /**
   * Get permission audit log for user (Director only)
   */
  async getAuditLog(userId, limit = 100) {
    const response = await apiClient.get(`/roles/users/${userId}/audit-log`, {
      params: { limit },
    });
    return response;
  },
};
