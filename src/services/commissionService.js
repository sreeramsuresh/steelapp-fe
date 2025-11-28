/**
 * Commission Service - Frontend API Client for Sales Commission Management
 * Connects to backend Commission gRPC service via API Gateway
 *
 * API Gateway Routes (Port 3000):
 * - GET  /api/commissions/agents        - List commission agents with plans
 * - GET  /api/commissions/plans         - List commission plans
 * - GET  /api/commissions/transactions  - List commission transactions
 * - POST /api/commissions/calculate/:id - Calculate commission for invoice
 * - GET  /api/commissions/dashboard     - Get commission dashboard metrics
 * - GET  /api/commissions/user/:id/summary - Get user commission summary
 * - POST /api/commissions/pay           - Pay commissions
 * - GET  /api/commissions/pay-periods   - List pay periods
 */

import { apiClient } from './api';

const API_BASE = '/commissions';

export const commissionService = {
  // ============================================
  // Commission Plans
  // ============================================

  /**
   * List all commission plans
   * @param {boolean} activeOnly - Filter to active plans only
   */
  async getPlans(activeOnly = null) {
    const params = activeOnly !== null ? { active_only: activeOnly } : {};
    return apiClient.get(`${API_BASE}/plans`, params);
  },

  /**
   * Get single commission plan by ID
   * @param {number} id - Plan ID
   */
  async getPlan(id) {
    return apiClient.get(`${API_BASE}/plans/${id}`);
  },

  /**
   * Create new commission plan
   * @param {Object} planData - Plan data
   */
  async createPlan(planData) {
    return apiClient.post(`${API_BASE}/plans`, planData);
  },

  /**
   * Update commission plan
   * @param {number} id - Plan ID
   * @param {Object} planData - Updated plan data
   */
  async updatePlan(id, planData) {
    return apiClient.put(`${API_BASE}/plans/${id}`, planData);
  },

  /**
   * Delete commission plan
   * @param {number} id - Plan ID
   */
  async deletePlan(id) {
    return apiClient.delete(`${API_BASE}/plans/${id}`);
  },

  // ============================================
  // Sales Agents
  // ============================================

  /**
   * List all commission agents with their assigned plans
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {boolean} params.active_only - Filter to active agents only
   */
  async getAgents(params = {}) {
    return apiClient.get(`${API_BASE}/agents`, params);
  },

  /**
   * Get agent commission summary
   * @param {number} userId - User ID
   * @param {Object} params - Query parameters (period, etc.)
   */
  async getAgentSummary(userId, params = {}) {
    return apiClient.get(`${API_BASE}/user/${userId}/summary`, params);
  },

  /**
   * Update agent details
   * @param {number} userId - User ID
   * @param {Object} agentData - Updated agent data
   */
  async updateAgent(userId, agentData) {
    return apiClient.put(`${API_BASE}/agents/${userId}`, agentData);
  },

  /**
   * Assign commission plan to agent
   * @param {number} userId - User ID
   * @param {Object} planData - Plan assignment data
   */
  async assignPlanToAgent(userId, planData) {
    return apiClient.post(`${API_BASE}/agents/${userId}/plans`, planData);
  },

  // ============================================
  // Transactions
  // ============================================

  /**
   * List commission transactions
   * @param {Object} filters - Filter parameters
   * @param {number} filters.user_id - Filter by user ID
   * @param {string} filters.status - Filter by status (pending, paid, voided)
   * @param {string} filters.date_from - Start date filter
   * @param {string} filters.date_to - End date filter
   */
  async getTransactions(filters = {}) {
    return apiClient.get(`${API_BASE}/transactions`, filters);
  },

  /**
   * Pay commissions (mark as paid)
   * @param {Object} paymentData - Payment data
   * @param {number[]} paymentData.transaction_ids - Transaction IDs to pay
   * @param {string} paymentData.pay_period - Pay period reference
   * @param {string} paymentData.payment_date - Payment date
   * @param {string} paymentData.payment_reference - Payment reference number
   * @param {string} paymentData.notes - Optional notes
   */
  async payCommissions(paymentData) {
    return apiClient.post(`${API_BASE}/pay`, paymentData);
  },

  /**
   * Approve commission transactions (legacy - use payCommissions)
   * @param {number[]} transactionIds - Transaction IDs to approve
   */
  async approveTransactions(transactionIds) {
    return apiClient.post(`${API_BASE}/transactions/approve`, {
      transaction_ids: transactionIds,
    });
  },

  /**
   * Mark transactions as paid (alias for payCommissions)
   * @param {number[]} transactionIds - Transaction IDs
   * @param {Object} paymentData - Payment details
   */
  async markTransactionsPaid(transactionIds, paymentData = {}) {
    return this.payCommissions({
      transaction_ids: transactionIds,
      ...paymentData,
    });
  },

  // Bulk action aliases for better readability
  async bulkApprove(transactionIds) {
    return this.approveTransactions(transactionIds);
  },

  async bulkMarkPaid(transactionIds, paymentData = {}) {
    return this.markTransactionsPaid(transactionIds, paymentData);
  },

  // ============================================
  // Pay Periods
  // ============================================

  /**
   * List pay periods
   * @param {number} limit - Number of periods to fetch (default 12)
   */
  async getPayPeriods(limit = 12) {
    return apiClient.get(`${API_BASE}/pay-periods`, { limit });
  },

  // ============================================
  // Calculation
  // ============================================

  /**
   * Calculate commission for a specific invoice
   * @param {number} invoiceId - Invoice ID
   * @param {boolean} recalculate - Force recalculation if already exists
   */
  async calculateCommission(invoiceId, recalculate = false) {
    return apiClient.post(`${API_BASE}/calculate/${invoiceId}`, { recalculate });
  },

  /**
   * Batch calculate commissions for multiple invoices
   * @param {Object} filters - Filter parameters
   */
  async batchCalculateCommissions(filters = {}) {
    return apiClient.post(`${API_BASE}/calculate-batch`, filters);
  },

  // ============================================
  // Dashboard & Reporting
  // ============================================

  /**
   * Get commission dashboard metrics
   * @param {Object} params - Query parameters
   * @param {string} params.period - Period filter (month, quarter, year)
   */
  async getDashboard(params = {}) {
    return apiClient.get(`${API_BASE}/dashboard`, params);
  },

  /**
   * Get user's commission summary
   * @param {number} userId - User ID
   * @param {Object} params - Query parameters
   */
  async getUserSummary(userId, params = {}) {
    return apiClient.get(`${API_BASE}/user/${userId}/summary`, params);
  },
};

export default commissionService;
