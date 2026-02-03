import { api } from "./api";

export const tradeFinanceService = {
  // Get all trade finance records
  async getTradeFinanceRecords(params = {}) {
    try {
      // api.get() delegates to apiService.get() which already returns response.data
      const data = await api.get("/trade-finance", { params });
      return data;
    } catch (error) {
      console.error("Error fetching trade finance records:", error);
      throw error;
    }
  },

  // Get single trade finance record
  async getTradeFinanceRecord(id) {
    try {
      const data = await api.get(`/trade-finance/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching trade finance record:", error);
      throw error;
    }
  },

  // Create new trade finance record
  async createTradeFinanceRecord(data) {
    try {
      const result = await api.post("/trade-finance", data);
      return result;
    } catch (error) {
      console.error("Error creating trade finance record:", error);
      throw error;
    }
  },

  // Update trade finance record
  async updateTradeFinanceRecord(id, data) {
    try {
      const result = await api.put(`/trade-finance/${id}`, data);
      return result;
    } catch (error) {
      console.error("Error updating trade finance record:", error);
      throw error;
    }
  },

  // Delete trade finance record
  async deleteTradeFinanceRecord(id) {
    try {
      const result = await api.delete(`/trade-finance/${id}`);
      return result;
    } catch (error) {
      console.error("Error deleting trade finance record:", error);
      throw error;
    }
  },

  // Update status
  async updateStatus(id, status, notes = "") {
    try {
      const result = await api.patch(`/trade-finance/${id}/status`, {
        status,
        notes,
      });
      return result;
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },

  // Calculate commission
  async calculateCommission(id, commission_rate) {
    try {
      const result = await api.post(`/trade-finance/${id}/calculate-commission`, {
        commission_rate,
      });
      return result;
    } catch (error) {
      console.error("Error calculating commission:", error);
      throw error;
    }
  },

  // Get expiring instruments
  async getExpiringInstruments(days = 30) {
    try {
      const data = await api.get("/trade-finance/expiring", {
        params: { days },
      });
      return data;
    } catch (error) {
      console.error("Error fetching expiring instruments:", error);
      throw error;
    }
  },

  // Get instrument types
  async getInstrumentTypes() {
    try {
      const data = await api.get("/trade-finance/types/list");
      return data;
    } catch (error) {
      console.error("Error fetching instrument types:", error);
      throw error;
    }
  },

  // Get document requirements
  async getDocumentRequirements(instrument_type) {
    try {
      const data = await api.get("/trade-finance/documents/requirements", {
        params: { instrument_type },
      });
      return data;
    } catch (error) {
      console.error("Error fetching document requirements:", error);
      throw error;
    }
  },

  // Get status options
  getStatusOptions() {
    return [
      { value: "draft", label: "Draft", color: "gray" },
      { value: "issued", label: "Issued", color: "blue" },
      { value: "advised", label: "Advised", color: "yellow" },
      { value: "confirmed", label: "Confirmed", color: "purple" },
      { value: "presented", label: "Presented", color: "orange" },
      { value: "accepted", label: "Accepted", color: "green" },
      { value: "paid", label: "Paid", color: "green" },
      { value: "discrepant", label: "Discrepant", color: "red" },
      { value: "rejected", label: "Rejected", color: "red" },
      { value: "expired", label: "Expired", color: "gray" },
    ];
  },
};

export default tradeFinanceService;
