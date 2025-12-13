import api from "./api";

const commissionService = {
  // Get invoice commission
  getInvoiceCommission: async (invoiceId) => {
    try {
      const response = await api.get(`/commissions/invoice/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoice commission:", error);
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
      console.error("Error adjusting commission:", error);
      throw error;
    }
  },

  // Approve commission (manager action)
  approveCommission: async (invoiceId, approvedByUserId) => {
    try {
      const response = await api.put(
        `/commissions/invoice/${invoiceId}/approve`,
        {
          approvedByUserId,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error approving commission:", error);
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
      console.error("Error marking commission as paid:", error);
      throw error;
    }
  },

  // Get commissions for a sales person
  getSalesPersonCommissions: async (
    salesPersonId,
    status = "PENDING",
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
      console.error("Error fetching sales person commissions:", error);
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
      console.error("Error fetching commission stats:", error);
      throw error;
    }
  },

  // Get commission audit trail
  getCommissionAuditTrail: async (invoiceId) => {
    try {
      const response = await api.get(`/commissions/invoice/${invoiceId}/audit`);
      return response.data;
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      throw error;
    }
  },

  // Get pending approvals (manager dashboard)
  getPendingApprovals: async (limit = 50) => {
    try {
      const response = await api.get("/commissions/pending-approvals", {
        params: { limit },
      });

      const data = response?.data || response;

      return data;
    } catch (error) {
      console.error(
        "[commissionService] Error fetching pending approvals:",
        error,
      );
      throw error;
    }
  },

  // Get commission dashboard data
  getDashboard: async (period = "month") => {
    try {
      const response = await api.get("/commissions/dashboard", {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching commission dashboard:", error);
      throw error;
    }
  },

  // Get list of commission agents
  getAgents: async (page = 1, limit = 20, activeOnly = false) => {
    try {
      const response = await api.get("/commissions/agents", {
        params: { page, limit, active_only: activeOnly },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching commission agents:", error);
      throw error;
    }
  },

  // Get list of commission transactions
  getTransactions: async (filters = {}) => {
    try {
      const { status, userId, dateFrom, dateTo } = filters;
      const response = await api.get("/commissions/transactions", {
        params: {
          ...(status && { status }),
          ...(userId && { user_id: userId }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching commission transactions:", error);
      throw error;
    }
  },

  // Get list of commission plans
  getPlans: async () => {
    try {
      const response = await api.get("/commissions/plans");
      return response.data;
    } catch (error) {
      console.error("Error fetching commission plans:", error);
      throw error;
    }
  },

  // Batch calculate commissions for all eligible invoices
  batchCalculateCommissions: async () => {
    try {
      const response = await api.post("/commissions/batch-calculate");
      return response.data;
    } catch (error) {
      console.error("Error batch calculating commissions:", error);
      throw error;
    }
  },

  // Reverse a commission (e.g., invoice cancelled, credit note issued)
  reverseCommission: async (commissionId, reversalReason, notes = "") => {
    try {
      const response = await api.post(`/commissions/${commissionId}/reverse`, {
        reversalReason,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error("Error reversing commission:", error);
      throw error;
    }
  },

  // Check if an invoice is eligible for commission
  getCommissionEligibility: async (invoiceId) => {
    try {
      const response = await api.get(`/commissions/eligibility/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error("Error checking commission eligibility:", error);
      throw error;
    }
  },

  // Adjust commission when a credit note is issued
  adjustCommissionForCreditNote: async (
    creditNoteId,
    invoiceId,
    notes = "",
  ) => {
    try {
      const response = await api.post("/commissions/credit-note-adjustment", {
        creditNoteId,
        invoiceId,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error("Error adjusting commission for credit note:", error);
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
            params: { status: "ALL", daysBack },
          }),
          api.get("/commissions/plans"),
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
        period: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
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
            name: "Base Commission",
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
      console.error("Error fetching commission tracker data:", error);
      throw error;
    }
  },

  // List pay periods
  listPayPeriods: async () => {
    try {
      const response = await api.get("/commissions/pay-periods");
      return response.data;
    } catch (error) {
      console.error("Error listing pay periods:", error);
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
      console.error("Error closing pay period:", error);
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
      console.error("Error processing pay period payments:", error);
      throw error;
    }
  },

  // Assign a plan to a user
  assignPlanToUser: async (planId, userId, effectiveDate) => {
    try {
      const response = await api.post("/commissions/plans/assign", {
        planId,
        userId,
        effectiveDate,
      });
      return response.data;
    } catch (error) {
      console.error("Error assigning plan to user:", error);
      throw error;
    }
  },

  // Bulk approve commissions
  bulkApprove: async (commissionIds) => {
    try {
      const response = await api.post("/commissions/bulk-approve", {
        commissionIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk approving commissions:", error);
      throw error;
    }
  },

  // Bulk mark commissions as paid
  bulkMarkPaid: async (commissionIds) => {
    try {
      const response = await api.post("/commissions/bulk-mark-paid", {
        commissionIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk marking commissions as paid:", error);
      throw error;
    }
  },

  // Create a new commission plan
  createPlan: async (planData) => {
    try {
      const response = await api.post("/commissions/plans", planData);
      return response.data;
    } catch (error) {
      console.error("Error creating commission plan:", error);
      throw error;
    }
  },

  // Update an existing commission plan
  updatePlan: async (planId, planData) => {
    try {
      const response = await api.put(`/commissions/plans/${planId}`, planData);
      return response.data;
    } catch (error) {
      console.error("Error updating commission plan:", error);
      throw error;
    }
  },

  // Delete a commission plan
  deletePlan: async (planId) => {
    try {
      const response = await api.delete(`/commissions/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting commission plan:", error);
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
      console.error("Error fetching commission history:", error);
      throw error;
    }
  },
};

export { commissionService };
