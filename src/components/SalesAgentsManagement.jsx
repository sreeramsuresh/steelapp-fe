import { CheckCircle, Edit2, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { commissionService } from "../services/commissionService";
import { notificationService } from "../services/notificationService";
import { formatCurrency } from "../utils/invoiceUtils";

const SalesAgentsManagement = () => {
  const { isDarkMode } = useTheme();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    default_commission_rate: "",
    employee_code: "",
    hire_date: "",
    department: "",
  });
  const [saving, setSaving] = useState(false);

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await commissionService.getAgents();
      setAgents(response?.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
      notificationService.error("Failed to load sales agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleEditClick = (agent) => {
    setSelectedAgent(agent);
    setEditForm({
      default_commission_rate: agent.baseRate ?? agent.defaultCommissionRate ?? "",
      employee_code: agent.employeeCode || "",
      hire_date: agent.hireDate || "",
      department: agent.department || "",
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedAgent) return;

    try {
      setSaving(true);
      await commissionService.updateAgent(selectedAgent.id, {
        ...editForm,
        default_commission_rate: parseFloat(editForm.defaultCommissionRate ?? editForm.baseRate) || null,
      });
      notificationService.success("Agent updated successfully");
      setShowEditModal(false);
      loadAgents();
    } catch (error) {
      console.error("Error updating agent:", error);
      notificationService.error("Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading sales agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Sales Agents</h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage sales agents and their commission settings
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        />
        <input
          type="text"
          placeholder="Search sales agents by name, username, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <div
          className={`text-center py-12 rounded-lg border ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <Users className={`h-16 w-16 mx-auto ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
          <h3 className={`mt-4 text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {searchTerm ? "No agents found" : "No sales agents yet"}
          </h3>
          <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {searchTerm ? "Try adjusting your search" : "Sales agents will appear here once they are set up"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className={`rounded-lg p-6 border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              } hover:shadow-lg transition-shadow`}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      agent.isCommissionEligible ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {agent.isCommissionEligible ? <CheckCircle className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {agent.fullName || agent.username}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{agent.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleEditClick(agent)}
                  className={`p-2 rounded-lg ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {/* Agent Details */}
              <div className="space-y-3">
                {/* Commission Rate */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Commission Rate</span>
                  <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {(agent.baseRate ?? agent.defaultCommissionRate)
                      ? `${agent.baseRate ?? agent.defaultCommissionRate}%`
                      : "Not set"}
                  </span>
                </div>

                {/* Employee Code */}
                {agent.employeeCode && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Employee Code</span>
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {agent.employeeCode}
                    </span>
                  </div>
                )}

                {/* Department */}
                {agent.department && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Department</span>
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {agent.department}
                    </span>
                  </div>
                )}

                {/* Performance Stats */}
                <div className={`pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Total Sales</p>
                      <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {agent.totalSales ? formatCurrency(parseFloat(agent.totalSales)) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Total Commission</p>
                      <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {agent.totalCommission ? formatCurrency(parseFloat(agent.totalCommission)) : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {agent.isActive && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                  )}
                  {agent.isCommissionEligible && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Commission Eligible
                    </span>
                  )}
                  {agent.totalTransactions > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {agent.totalTransactions} transactions
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg max-w-md w-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Edit Sales Agent
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {selectedAgent.fullName || selectedAgent.username}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Commission Rate */}
              <div>
                <label
                  htmlFor="commission-rate-input"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Commission Rate (%)
                </label>
                <input
                  id="commission-rate-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editForm.defaultCommissionRate}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      default_commission_rate: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="1.00"
                />
              </div>

              {/* Employee Code */}
              <div>
                <label
                  htmlFor="employee-code-input"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Employee Code
                </label>
                <input
                  id="employee-code-input"
                  type="text"
                  value={editForm.employeeCode}
                  onChange={(e) => setEditForm({ ...editForm, employee_code: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="SA001"
                />
              </div>

              {/* Hire Date */}
              <div>
                <label
                  htmlFor="hire-date-input"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Hire Date
                </label>
                <input
                  id="hire-date-input"
                  type="date"
                  value={editForm.hireDate}
                  onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Department */}
              <div>
                <label
                  htmlFor="department-input"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Department
                </label>
                <input
                  id="department-input"
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Sales"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-end space-x-3`}
            >
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAgentsManagement;
