import api from './api';

/**
 * Customer Credit Management Service (Phase 5)
 * Wraps backend Phase 5 customer credit management APIs
 * Handles real-time credit monitoring, DSO calculation, aging analysis, and credit limit adjustments
 */

const customerCreditService = {
  /**
   * Get high-risk customers (credit grades D or E)
   * @param {number} limit - Maximum number of customers to return
   * @returns {Promise} High-risk customers list
   */
  getHighRiskCustomers: async (limit = 50) => {
    try {
      const response = await api.get('/customers/credit-risk/high', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching high-risk customers:', error);
      throw error;
    }
  },

  /**
   * Get customers over credit limit
   * @returns {Promise} Over-limit customers list
   */
  getOverLimitCustomers: async () => {
    try {
      const response = await api.get('/customers/credit-risk/over-limit');
      return response.data;
    } catch (error) {
      console.error('Error fetching over-limit customers:', error);
      throw error;
    }
  },

  /**
   * Get detailed credit summary for a specific customer
   * Includes credit limit, utilization, grade, DSO
   * @param {number} customerId - Customer ID
   * @returns {Promise} Customer credit summary
   */
  getCustomerCreditSummary: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/credit-summary`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching credit summary for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get customer's aging analysis (overdue buckets)
   * Breaks down invoices by age: Current, 1-30, 31-60, 61-90, 90+ days
   * @param {number} customerId - Customer ID
   * @returns {Promise} Aging breakdown data
   */
  getCustomerAging: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/aging`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching aging analysis for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Update customer credit limit
   * Records manual adjustment with reason for audit trail
   * @param {number} customerId - Customer ID
   * @param {number} newCreditLimit - New credit limit amount
   * @param {string} adjustmentReason - Reason for adjustment
   * @returns {Promise} Updated customer credit record
   */
  updateCreditLimit: async (customerId, newCreditLimit, adjustmentReason) => {
    try {
      const response = await api.put(`/customers/${customerId}/credit-limit`, {
        newCreditLimit,
        adjustmentReason,
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating credit limit for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get payment history for a customer
   * Lists all payments with dates and amounts
   * @param {number} customerId - Customer ID
   * @param {number} monthsBack - How many months to look back (default 12)
   * @returns {Promise} Payment history records
   */
  getCustomerPaymentHistory: async (customerId, monthsBack = 12) => {
    try {
      const response = await api.get(`/customers/${customerId}/payment-history`, {
        params: { monthsBack },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment history for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get DSO (Days Sales Outstanding) trend for a customer
   * Shows DSO over time to identify payment deterioration
   * @param {number} customerId - Customer ID
   * @param {number} monthsBack - Number of months to analyze (default 6)
   * @returns {Promise} DSO trend data points
   */
  getCustomerDSOTrend: async (customerId, monthsBack = 6) => {
    try {
      const response = await api.get(`/customers/${customerId}/dso-trend`, {
        params: { monthsBack },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching DSO trend for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get credit utilization trend for a customer
   * Shows how credit usage changes over time
   * @param {number} customerId - Customer ID
   * @param {number} monthsBack - Number of months to analyze (default 6)
   * @returns {Promise} Credit utilization trend data
   */
  getCustomerCreditUtilizationTrend: async (customerId, monthsBack = 6) => {
    try {
      const response = await api.get(`/customers/${customerId}/credit-utilization-trend`, {
        params: { monthsBack },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching credit utilization trend for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get credit risk assessment for a customer
   * Includes risk score, risk factors, and recommended actions
   * @param {number} customerId - Customer ID
   * @returns {Promise} Credit risk assessment
   */
  getCustomerRiskAssessment: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/risk-assessment`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching risk assessment for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get all customers with credit metrics
   * List all customers with their current credit status, DSO, grades
   * @param {number} page - Page number (default 1)
   * @param {number} pageSize - Records per page (default 50)
   * @param {object} filters - Filter options (creditGrade, riskLevel, etc.)
   * @returns {Promise} Paginated customer list with credit metrics
   */
  getCustomersWithCreditMetrics: async (page = 1, pageSize = 50, filters = {}) => {
    try {
      const response = await api.get('/customers/with-credit-metrics', {
        params: {
          page,
          pageSize,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers with credit metrics:', error);
      throw error;
    }
  },

  /**
   * Get credit hold status for a customer
   * Determines if orders can be placed based on credit availability
   * @param {number} customerId - Customer ID
   * @returns {Promise} Credit hold status and details
   */
  getCustomerCreditHoldStatus: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/credit-hold-status`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching credit hold status for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Place customer on credit hold
   * Prevents new orders if customer exceeds credit limit or high risk
   * @param {number} customerId - Customer ID
   * @param {string} reason - Reason for placing on hold
   * @returns {Promise} Updated customer status
   */
  placeCreditHold: async (customerId, reason) => {
    try {
      const response = await api.put(`/customers/${customerId}/credit-hold`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error placing credit hold for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Remove credit hold from customer
   * @param {number} customerId - Customer ID
   * @param {string} reason - Reason for removing hold
   * @returns {Promise} Updated customer status
   */
  removeCreditHold: async (customerId, reason) => {
    try {
      const response = await api.put(`/customers/${customerId}/credit-hold/remove`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error removing credit hold for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get credit metrics dashboard
   * Summary of all customers' credit health
   * @returns {Promise} Dashboard metrics (total customers, avg DSO, at-risk count, etc.)
   */
  getCreditMetricsDashboard: async () => {
    try {
      const response = await api.get('/customers/credit-metrics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching credit metrics dashboard:', error);
      throw error;
    }
  },

  /**
   * Get credit quality distribution
   * Breakdown of customers by credit grade (A, B, C, D, E)
   * @returns {Promise} Distribution data
   */
  getCreditQualityDistribution: async () => {
    try {
      const response = await api.get('/customers/credit-metrics/distribution');
      return response.data;
    } catch (error) {
      console.error('Error fetching credit quality distribution:', error);
      throw error;
    }
  },

  /**
   * Get DSO benchmark report
   * Compare customer DSO against industry/company averages
   * @returns {Promise} Benchmark data with averages
   */
  getDSOBenchmarkReport: async () => {
    try {
      const response = await api.get('/customers/credit-metrics/dso-benchmark');
      return response.data;
    } catch (error) {
      console.error('Error fetching DSO benchmark report:', error);
      throw error;
    }
  },

  /**
   * Get recommendations for credit management
   * Suggests customers for credit limit increase/decrease, review actions
   * @returns {Promise} List of recommendations
   */
  getCreditRecommendations: async () => {
    try {
      const response = await api.get('/customers/credit-metrics/recommendations');
      return response.data;
    } catch (error) {
      console.error('Error fetching credit recommendations:', error);
      throw error;
    }
  },

  /**
   * Review/adjust customer credit based on payment performance
   * Updates credit grade and limit based on recent history
   * @param {number} customerId - Customer ID
   * @param {string} reason - Reason for review
   * @returns {Promise} Updated customer credit record
   */
  performCreditReview: async (customerId, reason) => {
    try {
      const response = await api.post(`/customers/${customerId}/credit-review`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error performing credit review for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Get aging summary report
   * Total amounts overdue by bucket across all customers
   * @returns {Promise} Aging summary data
   */
  getAgingSummaryReport: async () => {
    try {
      const response = await api.get('/customers/credit-metrics/aging-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching aging summary report:', error);
      throw error;
    }
  },

  /**
   * Export customer credit data to CSV
   * Downloads credit metrics for all customers
   * @param {object} filters - Filter criteria (optional)
   * @returns {Promise} Download initiated
   */
  exportCustomerCreditData: async (filters = {}) => {
    try {
      const response = await api.get('/customers/credit-metrics/export', {
        params: filters,
        responseType: 'blob',
      });
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer-credit-metrics-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      return true;
    } catch (error) {
      console.error('Error exporting customer credit data:', error);
      throw error;
    }
  },
};

export { customerCreditService };
