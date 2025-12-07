import api from './api';

const commissionService = {
  // Get invoice commission
  getInvoiceCommission: async (invoiceId) => {
    try {
      const response = await api.get(`/commissions/invoice/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice commission:', error);
      throw error;
    }
  },

  // Adjust commission amount (during 15-day grace period)
  adjustCommissionAmount: async (invoiceId, newAmount, reason) => {
    try {
      const response = await api.put(`/commissions/invoice/${invoiceId}/adjust`, {
        newCommissionAmount: newAmount,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Error adjusting commission:', error);
      throw error;
    }
  },

  // Approve commission (manager action)
  approveCommission: async (invoiceId, approvedByUserId) => {
    try {
      const response = await api.put(`/commissions/invoice/${invoiceId}/approve`, {
        approvedByUserId,
      });
      return response.data;
    } catch (error) {
      console.error('Error approving commission:', error);
      throw error;
    }
  },

  // Mark commission as paid (finance action)
  markCommissionAsPaid: async (invoiceId, paymentReference) => {
    try {
      const response = await api.put(`/commissions/invoice/${invoiceId}/pay`, {
        paymentReference,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      throw error;
    }
  },

  // Get commissions for a sales person
  getSalesPersonCommissions: async (salesPersonId, status = 'PENDING', daysBack = 90) => {
    try {
      const response = await api.get(`/commissions/sales-person/${salesPersonId}`, {
        params: { status, daysBack },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales person commissions:', error);
      throw error;
    }
  },

  // Get commission statistics for a sales person
  getSalesPersonCommissionStats: async (salesPersonId, daysBack = 90) => {
    try {
      const response = await api.get(`/commissions/sales-person/${salesPersonId}/stats`, {
        params: { daysBack },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching commission stats:', error);
      throw error;
    }
  },

  // Get commission audit trail
  getCommissionAuditTrail: async (invoiceId) => {
    try {
      const response = await api.get(`/commissions/invoice/${invoiceId}/audit`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
  },

  // Get pending approvals (manager dashboard)
  getPendingApprovals: async (limit = 50) => {
    try {
      const response = await api.get('/commissions/pending-approvals', {
        params: { limit },
      });


      const data = response?.data || response;

      return data;
    } catch (error) {
      console.error('[commissionService] Error fetching pending approvals:', error);
      throw error;
    }
  },

  // Get commission dashboard data
  getDashboard: async (period = 'month') => {
    try {
      const response = await api.get('/commissions/dashboard', {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching commission dashboard:', error);
      throw error;
    }
  },

  // Get list of commission agents
  getAgents: async (page = 1, limit = 20, activeOnly = false) => {
    try {
      const response = await api.get('/commissions/agents', {
        params: { page, limit, active_only: activeOnly },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching commission agents:', error);
      throw error;
    }
  },

  // Get list of commission transactions
  getTransactions: async (filters = {}) => {
    try {
      const { status, userId, dateFrom, dateTo } = filters;
      const response = await api.get('/commissions/transactions', {
        params: {
          ...(status && { status }),
          ...(userId && { user_id: userId }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching commission transactions:', error);
      throw error;
    }
  },

  // Get list of commission plans
  getPlans: async () => {
    try {
      const response = await api.get('/commissions/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching commission plans:', error);
      throw error;
    }
  },

  // Batch calculate commissions for all eligible invoices
  batchCalculateCommissions: async () => {
    try {
      const response = await api.post('/commissions/batch-calculate');
      return response.data;
    } catch (error) {
      console.error('Error batch calculating commissions:', error);
      throw error;
    }
  },
};

export { commissionService };
