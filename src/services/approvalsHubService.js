import { apiClient } from "./api.js";

export const approvalsHubService = {
  getSummary: () => apiClient.get("/approvals/summary"),

  getList: (params = {}) => apiClient.get("/approvals", params),

  getDetail: (type, id) => apiClient.get(`/approvals/${type}/${id}`),

  addComment: (type, id, comment) => apiClient.post(`/approvals/${type}/${id}/comment`, { comment }),
};
