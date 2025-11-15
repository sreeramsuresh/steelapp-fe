import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Percent,
  Users,
  TrendingUp,
  Info
} from 'lucide-react';
import { commissionService } from '../services/commissionService';
import { notificationService } from '../services/notificationService';

const CommissionPlans = () => {
  const { isDarkMode } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    tiers: [{ min_amount: 0, max_amount: null, rate: 0 }]
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await commissionService.getPlans();
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      notificationService.error('Failed to load commission plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
      tiers: [{ min_amount: 0, max_amount: null, rate: 0 }]
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      is_active: plan.is_active,
      tiers: plan.tiers || [{ min_amount: 0, max_amount: null, rate: 0 }]
    });
    setShowModal(true);
  };

  const handleDelete = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      await commissionService.deletePlan(planId);
      notificationService.success('Plan deleted successfully');
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      notificationService.error('Failed to delete plan');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      notificationService.error('Please enter a plan name');
      return;
    }

    try {
      setSaving(true);
      if (editingPlan) {
        await commissionService.updatePlan(editingPlan.id, formData);
        notificationService.success('Plan updated successfully');
      } else {
        await commissionService.createPlan(formData);
        notificationService.success('Plan created successfully');
      }
      setShowModal(false);
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      notificationService.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newMinAmount = lastTier.max_amount || 0;
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        { min_amount: newMinAmount, max_amount: null, rate: 0 }
      ]
    });
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const removeTier = (index) => {
    if (formData.tiers.length === 1) {
      notificationService.warning('Plan must have at least one tier');
      return;
    }
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    setFormData({ ...formData, tiers: newTiers });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading commission plans...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Commission Plans
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage commission rate structures and tiered plans
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className={`text-center py-12 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <Settings className={`h-16 w-16 mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`mt-4 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No commission plans yet
          </h3>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your first commission plan to get started
          </p>
          <button
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
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              } hover:shadow-lg transition-shadow`}
            >
              {/* Plan Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    {plan.is_active && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(plan)}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? 'hover:bg-red-900/20 text-gray-400 hover:text-red-400'
                        : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tiers */}
              <div className="space-y-2">
                <p className={`text-xs font-medium uppercase tracking-wide ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Commission Tiers
                </p>
                {(plan.tiers || []).map((tier, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {tier.min_amount !== null && tier.min_amount !== undefined ? (
                            <>
                              ₹{tier.min_amount.toLocaleString()}
                              {tier.max_amount !== null && tier.max_amount !== undefined
                                ? ` - ₹${tier.max_amount.toLocaleString()}`
                                : '+'}
                            </>
                          ) : (
                            'All amounts'
                          )}
                        </p>
                      </div>
                      <div className={`flex items-center space-x-1 font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <span>{tier.rate}%</span>
                        <Percent className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              {plan.agent_count > 0 && (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-2">
                    <Users className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {plan.agent_count} agent(s) assigned
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
          <div className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingPlan ? 'Edit Commission Plan' : 'Create Commission Plan'}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Standard Sales Plan"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Optional description for this plan"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Active (can be assigned to agents)
                  </label>
                </div>
              </div>

              {/* Tiers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Commission Tiers
                  </label>
                  <button
                    onClick={addTier}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className={`p-3 rounded-lg mb-3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                }`}>
                  <div className="flex items-start space-x-2">
                    <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-300' : 'text-blue-900'
                    }`}>
                      Define tiered commission rates based on sale amounts. Leave max amount empty for unlimited.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.tiers.map((tier, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Tier {index + 1}
                        </span>
                        {formData.tiers.length > 1 && (
                          <button
                            onClick={() => removeTier(index)}
                            className={`p-1 rounded ${
                              isDarkMode
                                ? 'hover:bg-red-900/20 text-gray-400 hover:text-red-400'
                                : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                            }`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={`block text-xs mb-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Min Amount (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.min_amount || ''}
                            onChange={(e) => updateTier(index, 'min_amount', parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Max Amount (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.max_amount || ''}
                            onChange={(e) => updateTier(index, 'max_amount', e.target.value ? parseFloat(e.target.value) : null)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Unlimited"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Rate (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={tier.rate || ''}
                            onChange={(e) => updateTier(index, 'rate', parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
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
            <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3 sticky bottom-0 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionPlans;
