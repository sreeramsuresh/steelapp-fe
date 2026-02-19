import { apiService } from "./axiosApi.js";

export const userAdminAPI = {
  async list(params = {}) {
    const res = await apiService.get("/users", { params });
    return Array.isArray(res?.users) ? res.users : Array.isArray(res) ? res : res || [];
  },
  async create({ name, email, password, role, permissions }) {
    const body = { name, email, password, role };
    if (permissions) body.permissions = permissions;
    const res = await apiService.post("/users", body);
    return res?.user || res;
  },
  async update(id, payload) {
    const res = await apiService.patch(`/users/${id}`, payload);
    return res?.user || res;
  },
  async remove(id) {
    return apiService.delete(`/users/${id}`);
  },
  async changePassword(id, payload) {
    const res = await apiService.put(`/users/${id}/password`, payload);
    return res;
  },
  async invite({ name, email, role }) {
    const res = await apiService.post("/users/invite", { name, email, role });
    return res;
  },
  async resendInvite(email) {
    const res = await apiService.post("/users/invite/resend", { email });
    return res;
  },
  async revokeInvite(invitationId) {
    const res = await apiService.post("/users/invite/revoke", { invitationId });
    return res;
  },
  async listInvitations() {
    const res = await apiService.get("/users/invitations");
    return res?.invitations || [];
  },
};
