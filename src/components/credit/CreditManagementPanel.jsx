import { AlertTriangle, Edit3, RefreshCw, TrendingDown } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { DarkModeContext } from "../../context/DarkModeContext";
import ConfirmDialog from "../ConfirmDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

/**
 * CreditManagementPanel Component
 * Admin/Finance module for managing customer credit limits and monitoring credit risk
 * Features:
 * - List customers with credit issues (over-limit, at-risk)
 * - Bulk credit limit updates
 * - Manual credit recalculation trigger
 * - Risk analysis and recommendations
 */
const CreditManagementPanel = ({
  onUpdateCreditLimits = () => {},
  onTriggerRecalculation = () => {},
  readOnly = false,
}) => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [overLimitCustomers, setOverLimitCustomers] = useState([]);
  const [atRiskCustomers, setAtRiskCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [newCreditLimit, setNewCreditLimit] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [recalculateConfirm, setRecalculateConfirm] = useState({
    open: false,
  });

  const loadCreditIssues = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Call backend service
      // const overLimit = await creditService.getOverLimitCustomers();
      // const atRisk = await creditService.getHighRiskCustomers();

      // Mock data for now
      setOverLimitCustomers([
        {
          id: 1,
          name: "ABC Trading",
          creditLimit: 50000,
          creditUsed: 65000,
          overage: 15000,
          grade: "D",
          dso: 95,
        },
        {
          id: 2,
          name: "XYZ Imports",
          creditLimit: 100000,
          creditUsed: 125000,
          overage: 25000,
          grade: "E",
          dso: 120,
        },
      ]);

      setAtRiskCustomers([
        {
          id: 3,
          name: "Global Steel",
          creditLimit: 75000,
          creditUsed: 55000,
          utilizationPct: 73,
          grade: "D",
          dso: 85,
          lastPayment: "2025-11-15",
        },
        {
          id: 4,
          name: "Premium Metals",
          creditLimit: 150000,
          creditUsed: 140000,
          utilizationPct: 93,
          grade: "C",
          dso: 68,
          lastPayment: "2025-11-20",
        },
      ]);
    } catch (error) {
      console.error("Failed to load credit issues:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load credit issues on mount
  useEffect(() => {
    loadCreditIssues();
  }, [loadCreditIssues]);

  const getGradeColor = (grade) => {
    const colorMap = {
      A: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      D: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      E: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colorMap[grade] || "bg-gray-100 text-gray-800";
  };

  const toggleCustomerSelection = (customerId) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (!newCreditLimit || selectedCustomers.size === 0) {
      alert("Please select customers and enter a new credit limit");
      return;
    }

    try {
      setLoading(true);
      // TODO: Call backend service
      // await creditService.batchUpdateCreditLimits(
      //   Array.from(selectedCustomers),
      //   parseFloat(newCreditLimit),
      //   updateReason
      // );

      onUpdateCreditLimits({
        customerIds: Array.from(selectedCustomers),
        newLimit: parseFloat(newCreditLimit),
        reason: updateReason,
      });

      setIsUpdateModalOpen(false);
      setSelectedCustomers(new Set());
      setNewCreditLimit("");
      setUpdateReason("");
      loadCreditIssues();
    } catch (error) {
      alert(`Failed to update credit limits: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAll = async () => {
    setRecalculateConfirm({ open: true });
  };

  const confirmRecalculate = async () => {
    try {
      setLoading(true);
      // TODO: Call backend service
      // await creditService.batchUpdateAllCustomerCredit();

      onTriggerRecalculation();
      loadCreditIssues();
    } catch (error) {
      alert(`Failed to recalculate: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Credit Management</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Monitor and manage customer credit limits and risk
          </p>
        </div>
        <Button onClick={handleRecalculateAll} disabled={loading || readOnly} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Recalculate All
        </Button>
      </div>

      {/* Over-Limit Customers */}
      <Card className={isDarkMode ? "bg-[#1E2328] border-[#37474F]" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Over-Limit Customers ({overLimitCustomers.length})
          </CardTitle>
          <CardDescription>Customers who have exceeded their credit limit</CardDescription>
        </CardHeader>
        <CardContent>
          {overLimitCustomers.length === 0 ? (
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              No customers over their credit limit
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={overLimitCustomers.every((c) => selectedCustomers.has(c.id))}
                        onChange={(e) => {
                          const newSelected = new Set(selectedCustomers);
                          if (e.target.checked) {
                            overLimitCustomers.forEach((c) => {
                              newSelected.add(c.id);
                            });
                          } else {
                            overLimitCustomers.forEach((c) => {
                              newSelected.delete(c.id);
                            });
                          }
                          setSelectedCustomers(newSelected);
                        }}
                      />
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Customer
                    </th>
                    <th
                      className={`text-right py-3 px-4 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Credit Limit
                    </th>
                    <th
                      className={`text-right py-3 px-4 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Used
                    </th>
                    <th
                      className={`text-right py-3 px-4 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Overage
                    </th>
                    <th
                      className={`text-center py-3 px-4 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Grade
                    </th>
                    <th
                      className={`text-right py-3 px-4 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      DSO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overLimitCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className={`border-b ${isDarkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                        />
                      </td>
                      <td className={`py-3 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        {customer.name}
                      </td>
                      <td className={`text-right py-3 px-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        AED {customer.creditLimit.toLocaleString()}
                      </td>
                      <td className={`text-right py-3 px-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        AED {customer.creditUsed.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-red-600 font-semibold">+AED {customer.overage.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getGradeColor(customer.grade)}>{customer.grade}</Badge>
                      </td>
                      <td
                        className={`text-right py-3 px-4 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}
                      >
                        {customer.dso}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* At-Risk Customers */}
      <Card className={isDarkMode ? "bg-[#1E2328] border-[#37474F]" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            At-Risk Customers (Grade D/E) ({atRiskCustomers.length})
          </CardTitle>
          <CardDescription>Customers with poor payment history - orders blocked</CardDescription>
        </CardHeader>
        <CardContent>
          {atRiskCustomers.length === 0 ? (
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No at-risk customers</p>
          ) : (
            <div className="grid gap-4">
              {atRiskCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {customer.name}
                      </h3>
                      <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        DSO: {customer.dso}d | Usage: {customer.utilizationPct}% | Last Payment: {customer.lastPayment}
                      </p>
                    </div>
                    <Badge className={getGradeColor(customer.grade)}>{customer.grade}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Update Modal */}
      {selectedCustomers.size > 0 && (
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"
          }`}
        >
          <p className={`text-sm mb-4 ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
            {selectedCustomers.size} customer(s) selected
          </p>
          <Button onClick={() => setIsUpdateModalOpen(true)} disabled={readOnly} className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Update Credit Limits
          </Button>
        </div>
      )}

      {/* Update Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className={isDarkMode ? "bg-[#1E2328] border-gray-700" : ""}>
          <DialogHeader>
            <DialogTitle>Update Credit Limits</DialogTitle>
            <DialogDescription>Update credit limit for {selectedCustomers.size} selected customer(s)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="credit-limit"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                New Credit Limit (AED)
              </label>
              <input
                id="credit-limit"
                type="number"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
                placeholder="0"
              />
            </div>
            <div>
              <label
                htmlFor="credit-reason"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Reason for Update
              </label>
              <textarea
                id="credit-reason"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
                rows={3}
                placeholder="e.g., Approved by finance after improvement plan"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={() => setIsUpdateModalOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleBulkUpdate} disabled={!newCreditLimit || loading}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recalculate All Confirmation Dialog */}
      {recalculateConfirm.open && (
        <ConfirmDialog
          title="Recalculate Credit?"
          message="Recalculate credit for all customers? This may take a few moments."
          variant="warning"
          onConfirm={() => {
            confirmRecalculate();
            setRecalculateConfirm({ open: false });
          }}
          onCancel={() => setRecalculateConfirm({ open: false })}
        />
      )}
    </div>
  );
};

export default CreditManagementPanel;
export { CreditManagementPanel };
