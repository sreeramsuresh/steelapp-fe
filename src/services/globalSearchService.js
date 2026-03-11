import { apiService } from "./axiosApi";

const globalSearchService = {
  async search(query, options = {}) {
    const params = { q: query };
    if (options.limit) params.limit = options.limit;
    return apiService.get("/search", params);
  },

  async refreshIndex() {
    return apiService.post("/search/refresh");
  },
};

export default globalSearchService;
