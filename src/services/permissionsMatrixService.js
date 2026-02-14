import { apiClient } from "./api.js";

export const permissionsMatrixService = {
  getMatrix: () => apiClient.get("/roles/permissions/matrix"),

  setCustomPermission: (userId, permissionKey, action, reason) =>
    apiClient.put(`/roles/users/${userId}/custom-permissions`, {
      permission_key: permissionKey,
      action,
      reason: reason || undefined,
    }),

  removeCustomPermission: (userId, permissionKey) =>
    apiClient.delete(`/roles/users/${userId}/custom-permissions/${permissionKey}`),
};
