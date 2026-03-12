import { apiClient } from "../services/api.js";
import { commissionService } from "../services/commissionService.js";
import debitNoteService from "../services/debitNoteService.js";
import { employeeAdvanceService } from "../services/employeeAdvanceService.js";
import { operatingExpenseService } from "../services/operatingExpenseService.js";
import { payrollRunService } from "../services/payrollRunService.js";
import { purchaseOrderService } from "../services/purchaseOrderService.js";
import supplierBillService from "../services/supplierBillService.js";

export const APPROVAL_ACTIONS = {
  purchase_order: {
    approve: (id, data) => purchaseOrderService.approve(id, { approved: true, comments: data?.comment }),
    reject: (id, data) => purchaseOrderService.approve(id, { approved: false, comments: data?.comment }),
  },
  supplier_bill: {
    approve: (id, data) => supplierBillService.approve(id, data?.comment),
    reject: (id, data) => supplierBillService.reject(id, data?.comment),
  },
  grn: {
    approve: (id) => apiClient.post(`/grns/${id}/approve`),
    reject: null,
  },
  debit_note: {
    approve: (id) => debitNoteService.approve(id),
    reject: null,
  },
  operating_expense: {
    approve: (id) => operatingExpenseService.approve(id),
    reject: (id, data) => operatingExpenseService.reject(id, data?.comment),
  },
  employee_advance: {
    approve: (id) => employeeAdvanceService.approve(id),
    reject: null,
  },
  payroll_run: {
    approve: (id) => payrollRunService.approve(id),
    reject: null,
  },
  commission: {
    approve: (id, data) => commissionService.approveCommission(id, data?.userId),
    reject: (id, data) => commissionService.rejectCommission(id, data?.userId, data?.comment),
  },
};
