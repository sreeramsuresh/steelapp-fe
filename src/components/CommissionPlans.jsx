import { Calendar, Check, Edit2, Info, Percent, Plus, Save, Settings, Trash2, UserPlus, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { commissionService } from "../services/commissionService";
import { notificationService } from "../services/notificationService";
import ConfirmDialog from "./ConfirmDialog";

const CommissionPlans = () => {
  const { isDarkMode } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    tiers: [{ min_amount: 0, max_amount: null, rate: 0 }],
  });

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningPlan, setAssigningPlan] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [effectiveDate, setEffectiveDate] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await commissionService.getPlans();
      setPlans(response?.plans || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      notificationService.error("Failed to load commission plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      is_active: true,
      tiers: [{ min_amount: 0, max_amount: null, rate: 0 }],
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      is_active: plan.isActive,
      tiers: plan.tiers || [{ min_amount: 0, max_amount: null, rate: 0 }],
    });
    setShowModal(true);
  };

  const handleDeleteClick = (planId) => {
    setPlanToDelete(planId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;

    try {
      await commissionService.deletePlan(planToDelete);
      notificationService.success("Plan deleted successfully");
      setShowDeleteConfirm(false);
      setPlanToDelete(null);
      loadPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      notificationService.error("Failed to delete plan");
      setShowDeleteConfirm(false);
      setPlanToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      notificationService.error("Please enter a plan name");
      return;
    }

    try {
      setSaving(true);
      if (editingPlan) {
        await commissionService.updatePlan(editingPlan.id, formData);
        notificationService.success("Plan updated successfully");
      } else {
        await commissionService.createPlan(formData);
        notificationService.success("Plan created successfully");
      }
      setShowModal(false);
      loadPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      notificationService.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newMinAmount = lastTier.maxAmount || 0;
    setFormData({
      ...formData,
      tiers: [...formData.tiers, { min_amount: newMinAmount, max_amount: null, rate: 0 }],
    });
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const removeTier = (index) => {
    if (formData.tiers.length === 1) {
      notificationService.warning("Plan must have at least one tier");
      return;
    }
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    setFormData({ ...formData, tiers: newTiers });
  };

  const openAssignModal = async (plan) => {
    setAssigningPlan(plan);
    setSelectedUsers(new Set());
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setShowAssignModal(true);

    try {
      setLoadingUsers(true);
      const response = await commissionService.getAgents(1, 100, false);
      setAvailableUsers(response?.agents || []);
    } catch (error) {
      console.error("Error loading users:", error);
      notificationService.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAssignPlan = async () => {
    if (selectedUsers.size === 0) {
      notificationService.warning("Please select at least one user");
      return;
    }
    if (!effectiveDate) {
      notificationService.warning("Please select an effective date");
      return;
    }

    try {
      setAssigning(true);
      const userIds = Array.from(selectedUsers);

      // Assign plan to each selected user
      for (const userId of userIds) {
        await commissionService.assignPlanToUser(assigningPlan.id, userId, effectiveDate);
      }

      notificationService.success(`Plan assigned to ${userIds.length} user(s)`);
      setShowAssignModal(false);
      setAssigningPlan(null);
      loadPlans(); // Refresh to update agent counts
    } catch (error) {
      console.error("Error assigning plan:", error);
      notificationService.error(error.message || "Failed to assign plan");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading commission plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Commission Plans</h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage commission rate structures and tiered plans
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div
          className={`text-center py-12 rounded-lg border ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <Settings className={`h-16 w-16 mx-auto ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
          <h3 className={`mt-4 text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            No commission plans yet
          </h3>
          <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Create your first commission plan to get started
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg p-6 border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              } hover:shadow-lg transition-shadow`}
            >
              {/* Plan Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {plan.name}
                    </h3>
                    {plan.isActive && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => openAssignModal(plan)}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? "hover:bg-blue-900/20 text-gray-400 hover:text-blue-400"
                        : "hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                    }`}
                    title="Assign to Users"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(plan)}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(plan.id)}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? "hover:bg-red-900/20 text-gray-400 hover:text-red-400"
                        : "hover:bg-red-50 text-gray-600 hover:text-red-600"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tiers */}
              <div className="space-y-2">
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Commission Tiers
                </p>
                {(plan.tiers || []).map((tier, index) => (
                  <div
                    key={tier.id || tier.name || `tier-${index}`}
                    className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {tier.minAmount !== null && tier.minAmount !== undefined ? (
                            <>
                              ₹{tier.minAmount.toLocaleString()}
                              {tier.maxAmount !== null && tier.maxAmount !== undefined
                                ? ` - ₹${tier.maxAmount.toLocaleString()}`
                                : "+"}
                            </>
                          ) : (
                            "All amounts"
                          )}
                        </p>
                      </div>
                      <div
                        className={`flex items-center space-x-1 font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <span>{tier.rate}%</span>
                        <Percent className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              {plan.agentCount > 0 && (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="flex items-center space-x-2">
                    <Users className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {plan.agentCount} agent(s) assigned
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} sticky top-0 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {editingPlan ? "Edit Commission Plan" : "Create Commission Plan"}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="plan-name"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="plan-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Standard Sales Plan"
                  />
                </div>

                <div>
                  <label
                    htmlFor="plan-description"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Description
                  </label>
                  <textarea
                    id="plan-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Optional description for this plan"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Active (can be assigned to agents)
                  </label>
                </div>
              </div>

              {/* Tiers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Commission Tiers
                  </span>
                  <button
                    type="button"
                    onClick={addTier}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className={`p-3 rounded-lg mb-3 ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <div className="flex items-start space-x-2">
                    <Info
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                    />
                    <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-blue-900"}`}>
                      Define tiered commission rates based on sale amounts. Leave max amount empty for unlimited.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.tiers.map((tier, index) => (
                    <div
                      key={tier}
                      className={`p-4 rounded-lg border ${
                        isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Tier {index + 1}
                        </span>
                        {formData.tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTier(index)}
                            className={`p-1 rounded ${
                              isDarkMode
                                ? "hover:bg-red-900/20 text-gray-400 hover:text-red-400"
                                : "hover:bg-red-50 text-gray-600 hover:text-red-600"
                            }`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label
                            htmlFor={`tier-${index}-min`}
                            className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Min Amount (₹)
                          </label>
                          <input
                            id={`tier-${index}-min`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.minAmount || ""}
                            onChange={(e) => updateTier(index, "min_amount", parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? "bg-gray-600 border-gray-500 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`tier-${index}-max`}
                            className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Max Amount (₹)
                          </label>
                          <input
                            id={`tier-${index}-max`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.maxAmount || ""}
                            onChange={(e) =>
                              updateTier(index, "max_amount", e.target.value ? parseFloat(e.target.value) : null)
                            }
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? "bg-gray-600 border-gray-500 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Unlimited"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`tier-${index}-rate`}
                            className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Rate (%)
                          </label>
                          <input
                            id={`tier-${index}-rate`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={tier.rate || ""}
                            onChange={(e) => updateTier(index, "rate", parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? "bg-gray-600 border-gray-500 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-end space-x-3 sticky bottom-0 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Plan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && assigningPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center space-x-2">
                <UserPlus className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Assign Plan: {assigningPlan.name}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
              {/* Effective Date */}
              <div>
                <label
                  htmlFor="effective-date"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Effective Date
                </label>
                <input
                  id="effective-date"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* User Selection */}
              <div>
                <label htmlFor="user-selection-list" className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Select Users ({selectedUsers.size} selected)
                </label>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className={`ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading users...</span>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No sales agents available</p>
                  </div>
                ) : (
                  <div id="user-selection-list" className="space-y-2 max-h-60 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleUserSelection(user.id)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedUsers.has(user.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUsers.has(user.id)
                            ? isDarkMode
                              ? "bg-blue-900/30 border-blue-700"
                              : "bg-blue-50 border-blue-300"
                            : isDarkMode
                              ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isDarkMode ? "bg-gray-600" : "bg-gray-200"
                              }`}
                            >
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {user.fullName || user.username}
                              </p>
                              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {user.email || `ID: ${user.id}`}
                              </p>
                            </div>
                          </div>
                          {selectedUsers.has(user.id) && <Check className="w-5 h-5 text-blue-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-end space-x-3`}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningPlan(null);
                }}
                disabled={assigning}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignPlan}
                disabled={assigning || selectedUsers.size === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2"
              >
                {assigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Assign to {selectedUsers.size} User(s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Commission Plan?"
        message="Are you sure you want to delete this commission plan? This action cannot be undone. Any users assigned to this plan will no longer earn commissions from it."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPlanToDelete(null);
        }}
      />
    </div>
  );
};

export default CommissionPlans;
