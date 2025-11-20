import axiosApi from './axiosApi';

const API_BASE = '/commissions';

export const commissionService = {
  // Commission Plans
  async getPlans(isActive = null) {
    const params = isActive !== null ? { isActive } : {};
    const response = await axiosApi.get(`${API_BASE}/plans`, { params });
    return response.data;
  },

  async getPlan(id) {
    const response = await axiosApi.get(`${API_BASE}/plans/${id}`);
    return response.data;
  },

  async createPlan(planData) {
    const response = await axiosApi.post(`${API_BASE}/plans`, planData);
    return response.data;
  },

  async updatePlan(id, planData) {
    const response = await axiosApi.put(`${API_BASE}/plans/${id}`, planData);
    return response.data;
  },

  async deletePlan(id) {
    const response = await axiosApi.delete(`${API_BASE}/plans/${id}`);
    return response.data;
  },

  // Sales Agents
  async getAgents() {
    const response = await axiosApi.get(`${API_BASE}/agents`);
    return response.data;
  },

  async updateAgent(userId, agentData) {
    const response = await axiosApi.put(`${API_BASE}/agents/${userId}`, agentData);
    return response.data;
  },

  async assignPlanToAgent(userId, planData) {
    const response = await axiosApi.post(`${API_BASE}/agents/${userId}/plans`, planData);
    return response.data;
  },

  // Transactions
  async getTransactions(filters = {}) {
    const response = await axiosApi.get(`${API_BASE}/transactions`, { params: filters });
    return response.data;
  },

  async getAgentSummary(userId, filters = {}) {
    const response = await axiosApi.get(`${API_BASE}/transactions/summary/${userId}`, { params: filters });
    return response.data;
  },

  async approveTransactions(transactionIds) {
    const response = await axiosApi.post(`${API_BASE}/transactions/approve`, {
      transaction_ids: transactionIds
    });
    return response.data;
  },

  async markTransactionsPaid(transactionIds, paymentData) {
    const response = await axiosApi.post(`${API_BASE}/transactions/mark-paid`, {
      transaction_ids: transactionIds,
      ...paymentData
    });
    return response.data;
  },

  // Bulk action aliases for better readability
  async bulkApprove(transactionIds) {
    return this.approveTransactions(transactionIds);
  },

  async bulkMarkPaid(transactionIds, paymentData = {}) {
    return this.markTransactionsPaid(transactionIds, paymentData);
  },

  // Calculation
  async calculateCommission(invoiceId) {
    const response = await axiosApi.post(`${API_BASE}/calculate/${invoiceId}`);
    return response.data;
  },

  async batchCalculateCommissions(filters = {}) {
    const response = await axiosApi.post(`${API_BASE}/calculate-batch`, filters);
    return response.data;
  },

  // Reporting
  async getDashboard(filters = {}) {
    const response = await axiosApi.get(`${API_BASE}/dashboard`, { params: filters });
    return response.data;
  }
};

export default commissionService;
