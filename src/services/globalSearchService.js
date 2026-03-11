import apiClient from "./axiosApi";

const globalSearchService = {
  async search(query, options = {}) {
    const params = { q: query };
    if (options.limit) params.limit = options.limit;
    return apiClient.get("/search", params);
  },

  async refreshIndex() {
    return apiClient.post("/search/refresh");
  },
};

export default globalSearchService;
