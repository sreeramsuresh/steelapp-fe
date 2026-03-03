/**
 * Company Financial Settings Service
 * GET / PUT for per-company GL account defaults and base currency.
 */

import { apiClient } from "./api.js";

const companyFinancialSettingsService = {
  async get() {
    const response = await apiClient.get("/company-financial-settings");
    return response?.data || response || {};
  },

  async update(settings) {
    const response = await apiClient.put("/company-financial-settings", settings);
    return response?.data || response || {};
  },
};

export default companyFinancialSettingsService;
