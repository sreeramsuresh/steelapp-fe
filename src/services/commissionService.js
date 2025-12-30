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
      const response = await api.put(
        `/commissions/invoice/${invoiceId}/adjust`,
        {
          newCommissionAmount: newAmount,
          reason,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error adjusting commission:', error);
      throw error;
    }
  },

  // Approve commission (manager action)
  approveCommission: async (invoiceId, approvedByUserId) => {
    try {
      const response = await api.post(
        `/commissions/invoice/${invoiceId}/approve`,
        {
          approvedByUserId,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error approving commission:', error);
      throw error;
    }
  },

  // Mark commission as paid (finance action)
  markCommissionAsPaid: async (invoiceId, paymentReference) => {
    try {
      const response = await api.post(`/commissions/invoice/${invoiceId}/pay`, {
        paymentReference,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      throw error;
    }
  },

  // Get commissions for a sales person
  getSalesPersonCommissions: async (
    salesPersonId,
    status = 'PENDING',
    daysBack = 90,
  ) => {
    try {
      const response = await api.get(
        `/commissions/sales-person/${salesPersonId}`,
        {
          params: { status, daysBack },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sales person commissions:', error);
      throw error;
    }
  },

  // Get commission statistics for a sales person
  getSalesPersonCommissionStats: async (salesPersonId, daysBack = 90) => {
    try {
      const response = await api.get(
        `/commissions/sales-person/${salesPersonId}/stats`,
        {
          params: { daysBack },
        },
      );
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
      console.error(
        '[commissionService] Error fetching pending approvals:',
        error,
      );
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
      // Support both userId and agent_id for backwards compatibility
      const { status, userId, agent_id, dateFrom, dateTo } = filters;
      const effectiveUserId = userId || agent_id;
      const response = await api.get('/commissions/transactions', {
        params: {
          ...(status && { status }),
          ...(effectiveUserId && { user_id: effectiveUserId }),
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

  // Reverse a commission (e.g., invoice cancelled, credit note issued)
  reverseCommission: async (commissionId, reversalReason, notes = '') => {
    try {
      const response = await api.post(`/commissions/${commissionId}/reverse`, {
        reversalReason,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Error reversing commission:', error);
      throw error;
    }
  },

  // Check if an invoice is eligible for commission
  getCommissionEligibility: async (invoiceId) => {
    try {
      const response = await api.get(`/commissions/eligibility/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking commission eligibility:', error);
      throw error;
    }
  },

  // Adjust commission when a credit note is issued
  adjustCommissionForCreditNote: async (
    creditNoteId,
    invoiceId,
    notes = '',
  ) => {
    try {
      const response = await api.post('/commissions/credit-note-adjustment', {
        creditNoteId,
        invoiceId,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Error adjusting commission for credit note:', error);
      throw error;
    }
  },

  // Get commission tracker data for a sales agent
  getCommissionTrackerData: async (salesPersonId, daysBack = 90) => {
    try {
      // Fetch stats and commissions in parallel
      const [statsResponse, commissionsResponse, plansResponse] =
        await Promise.all([
          api.get(`/commissions/sales-person/${salesPersonId}/stats`, {
            params: { daysBack },
          }),
          api.get(`/commissions/sales-person/${salesPersonId}`, {
            params: { status: 'ALL', daysBack },
          }),
          api.get('/commissions/plans'),
        ]);

      const stats = statsResponse.data;
      const commissions = commissionsResponse.data?.commissions || [];
      const plans = plansResponse.data?.plans || [];

      // Calculate summary
      const totalEarned = parseFloat(
        stats.total_commission_earned || stats.totalCommissionEarned || 0,
      );
      const _approvedAmount = parseFloat(
        stats.total_commission_approved || stats.totalCommissionApproved || 0,
      );
      const paidAmount = parseFloat(
        stats.total_commission_paid || stats.totalCommissionPaid || 0,
      );
      const pendingAmount = totalEarned - paidAmount;

      // Build tiers from plan data (simplified - actual tiered calculation done on backend)
      const activePlan =
        plans.find((p) => p.isActive || p.is_active) || plans[0];
      const baseRate = parseFloat(
        activePlan?.baseRate || activePlan?.base_rate || 10,
      );

      return {
        agentId: salesPersonId,
        period: new Date().toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        summary: {
          baseCommission: totalEarned,
          tier1Bonus: 0,
          tier2Bonus: 0,
          specialBonus: 0,
          totalEarned,
          projectedTotal: totalEarned,
          paidAmount,
          pendingAmount,
        },
        tiers: [
          {
            name: 'Base Commission',
            description: `${baseRate}% of total sales`,
            current: totalEarned / (baseRate / 100),
            target: null,
            earned: totalEarned,
            percent: 100,
            achieved: true,
          },
        ],
        specialBonuses: [],
        commissions,
      };
    } catch (error) {
      console.error('Error fetching commission tracker data:', error);
      throw error;
    }
  },

  // List pay periods
  listPayPeriods: async () => {
    try {
      const response = await api.get('/commissions/pay-periods');
      return response.data;
    } catch (error) {
      console.error('Error listing pay periods:', error);
      throw error;
    }
  },

  // Close a pay period
  closePayPeriod: async (periodId) => {
    try {
      const response = await api.post(
        `/commissions/pay-periods/${periodId}/close`,
      );
      return response.data;
    } catch (error) {
      console.error('Error closing pay period:', error);
      throw error;
    }
  },

  // Process pay period payments
  processPayPeriodPayments: async (periodId) => {
    try {
      const response = await api.post(
        `/commissions/pay-periods/${periodId}/process`,
      );
      return response.data;
    } catch (error) {
      console.error('Error processing pay period payments:', error);
      throw error;
    }
  },

  // Assign a plan to a user
  assignPlanToUser: async (planId, userId, effectiveDate) => {
    try {
      const response = await api.post('/commissions/plans/assign', {
        planId,
        userId,
        effectiveDate,
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning plan to user:', error);
      throw error;
    }
  },

  // Bulk approve commissions
  bulkApprove: async (commissionIds) => {
    try {
      const response = await api.post('/commissions/bulk-approve', {
        commissionIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk approving commissions:', error);
      throw error;
    }
  },

  // Bulk mark commissions as paid
  bulkMarkPaid: async (commissionIds) => {
    try {
      const response = await api.post('/commissions/bulk-mark-paid', {
        commissionIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk marking commissions as paid:', error);
      throw error;
    }
  },

  // Create a new commission plan
  createPlan: async (planData) => {
    try {
      const response = await api.post('/commissions/plans', planData);
      return response.data;
    } catch (error) {
      console.error('Error creating commission plan:', error);
      throw error;
    }
  },

  // Update an existing commission plan
  updatePlan: async (planId, planData) => {
    try {
      const response = await api.put(`/commissions/plans/${planId}`, planData);
      return response.data;
    } catch (error) {
      console.error('Error updating commission plan:', error);
      throw error;
    }
  },

  // Delete a commission plan
  deletePlan: async (planId) => {
    try {
      const response = await api.delete(`/commissions/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting commission plan:', error);
      throw error;
    }
  },

  // Get agent summary for AgentCommissionDashboard
  getAgentSummary: async (agentId, daysBack = 90) => {
    try {
      const response = await api.get(
        `/commissions/sales-person/${agentId}/stats`,
        {
          params: { daysBack },
        },
      );

      const stats = response.data || {};

      // Transform backend response to dashboard-expected format
      return {
        data: {
          totalSales: parseFloat(stats.total_sales || stats.totalSales || 0),
          pendingAmount: parseFloat(stats.pending_amount || stats.pendingAmount || 0),
          approvedAmount: parseFloat(stats.approved_amount || stats.approvedAmount || 0),
          paidAmount: parseFloat(stats.paid_amount || stats.paidAmount || stats.total_commission_paid || stats.totalCommissionPaid || 0),
          totalTransactions: parseInt(stats.total_transactions || stats.totalTransactions || stats.transaction_count || stats.transactionCount || 0, 10),
          totalCommission: parseFloat(stats.total_commission || stats.totalCommission || stats.total_commission_earned || stats.totalCommissionEarned || 0),
          averageRate: parseFloat(stats.average_rate || stats.averageRate || stats.avg_commission_rate || stats.avgCommissionRate || 0),
        },
      };
    } catch (error) {
      console.error('Error fetching agent summary:', error);
      throw error;
    }
  },

  // Get commission history for a user (with filters)
  getCommissionHistory: async (userId, filters = {}) => {
    try {
      const { status, dateFrom, dateTo, page = 1, limit = 50 } = filters;
      const response = await api.get(`/commissions/history/${userId}`, {
        params: {
          ...(status && { status }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching commission history:', error);
      throw error;
    }
  },

  // Get commission forecast data for analytics dashboard
  getCommissionForecast: async (monthsBack = 12) => {
    try {
      // Fetch all commissions for historical analysis
      const _daysBack = monthsBack * 31;

      // Parallel fetch: all commissions (via transactions) + pending approvals
      const [commissionsResponse, pendingResponse, agentsResponse] = await Promise.all([
        api.get('/commissions/transactions', { params: { status: 'ALL' } }),
        api.get('/commissions/pending-approvals', { params: { page: 1, limit: 100 } }),
        api.get('/commissions/agents', { params: { page: 1, limit: 50, onlyActive: true } }),
      ]);

      const commissions = commissionsResponse.data?.transactions || [];
      const pendingApprovals = pendingResponse.data?.items || pendingResponse.data?.pendingApprovals || [];
      const agents = agentsResponse.data?.agents || [];

      // Calculate monthly history
      const monthlyData = {};
      const now = new Date();

      // Initialize last N months
      for (let i = 0; i < monthsBack; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = { month: key, earned: 0, paid: 0, count: 0 };
      }

      // Aggregate commission data by month
      commissions.forEach((comm) => {
        const date = new Date(comm.created_at || comm.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].earned += parseFloat(comm.commission_amount || comm.commissionAmount || 0);
          if (comm.status === 'PAID') {
            monthlyData[key].paid += parseFloat(comm.paid_amount || comm.paidAmount || comm.commission_amount || comm.commissionAmount || 0);
          }
          monthlyData[key].count += 1;
        }
      });

      // Convert to sorted array (oldest to newest)
      const history = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

      // Calculate pipeline from pending approvals
      const pipelineTotal = pendingApprovals.reduce((sum, item) => {
        return sum + parseFloat(item.commissionAmount || item.commission_amount || 0);
      }, 0);

      // Calculate average monthly commission (last 6 months for trend)
      const recentMonths = history.slice(-6);
      const avgMonthlyEarned = recentMonths.reduce((sum, m) => sum + m.earned, 0) / Math.max(recentMonths.length, 1);

      // Calculate growth rate (compare last 3 months vs prior 3 months)
      const lastThree = history.slice(-3);
      const priorThree = history.slice(-6, -3);
      const lastThreeAvg = lastThree.reduce((sum, m) => sum + m.earned, 0) / Math.max(lastThree.length, 1);
      const priorThreeAvg = priorThree.reduce((sum, m) => sum + m.earned, 0) / Math.max(priorThree.length, 1);
      const growthRate = priorThreeAvg > 0 ? ((lastThreeAvg - priorThreeAvg) / priorThreeAvg) * 100 : 0;

      // Forecast next 3 months based on trend
      const forecast = [];
      for (let i = 1; i <= 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const projectedAmount = avgMonthlyEarned * (1 + (growthRate / 100) * (i * 0.3));
        forecast.push({ month: key, projected: Math.max(projectedAmount, 0) });
      }

      // Current month totals
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentMonth = monthlyData[currentMonthKey] || { earned: 0, paid: 0, count: 0 };

      return {
        history,
        forecast,
        pipeline: {
          total: pipelineTotal,
          count: pendingApprovals.length,
          items: pendingApprovals.slice(0, 5), // Top 5 pending
        },
        summary: {
          avgMonthlyEarned,
          growthRate,
          currentMonthEarned: currentMonth.earned,
          currentMonthCount: currentMonth.count,
          totalAgents: agents.length,
        },
      };
    } catch (error) {
      console.error('Error fetching commission forecast:', error);
      throw error;
    }
  },
};

export { commissionService };
