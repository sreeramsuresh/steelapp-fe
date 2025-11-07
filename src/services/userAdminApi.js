import { apiService } from "./axiosApi";

export const userAdminAPI = {
  async list() {
    const res = await apiService.get("/admin/users");
    return Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : []);
  },
  async create({ name, email, password, role, permissions }) {
    const body = { name, email, password, role };
    if (permissions) body.permissions = permissions;
    const res = await apiService.post("/admin/users", body);
    return res?.user || res;
  },
  async update(id, payload) {
    const res = await apiService.patch(`/admin/users/${id}`, payload);
    return res?.user || res;
  },
  async remove(id) {
    return apiService.delete(`/admin/users/${id}`);
  },
};

