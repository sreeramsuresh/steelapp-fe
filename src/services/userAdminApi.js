import { apiService } from './axiosApi';

export const userAdminAPI = {
  async list(params = {}) {
    const res = await apiService.get('/users', { params });
    return Array.isArray(res?.users)
      ? res.users
      : Array.isArray(res)
        ? res
        : res || [];
  },
  async create({ name, email, password, role, permissions }) {
    const body = { name, email, password, role };
    if (permissions) body.permissions = permissions;
    const res = await apiService.post('/users', body);
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
};
