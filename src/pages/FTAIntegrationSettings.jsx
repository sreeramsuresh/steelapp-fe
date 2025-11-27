/**
 * FTA Integration Settings Page
 *
 * Manage UAE Federal Tax Authority API integration for TRN verification
 *
 * Features:
 * - Configure API credentials (URL, Key)
 * - Test connection
 * - Soft-lock after successful test
 * - View audit log
 * - Comprehensive help modal
 *
 * Redesigned with:
 * - Two-column layout (60/40)
 * - Constrained width form fields
 * - Gradient header banner
 * - Status card with visual indicators
 * - Help modal instead of sidebar
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Key,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  HelpCircle,
  History,
  ExternalLink,
  Settings,
  Clock,
  Trash2,
  X,
  Info,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { integrationService } from '../services/integrationService';
import FTAHelpPanel from '../components/FTAHelpPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const INTEGRATION_TYPE = 'fta_trn';

const FTAIntegrationSettings = ({ embedded = false }) => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Integration data
  const [integration, setIntegration] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    api_url: '',
    api_key: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // UI state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Test result
  const [testResult, setTestResult] = useState(null);

  // Load integration data
  const loadIntegration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await integrationService.get(INTEGRATION_TYPE);

      if (response.integration) {
        setIntegration(response.integration);
        setIsConfigured(true);
        setFormData({
          api_url: response.integration.api_url || '',
          api_key: '', // Don't populate - show masked version
        });
        setTestResult(
          response.integration.last_test_at
            ? {
                success: response.integration.last_test_success,
                message: response.integration.last_test_message,
                tested_at: response.integration.last_test_at,
              }
            : null
        );
      } else {
        setIntegration(null);
        setIsConfigured(false);
        setFormData({ api_url: '', api_key: '' });
      }

      setHasChanges(false);
    } catch (err) {
      setError(err.message || 'Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  // Handle form changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setTestResult(null); // Clear test result on change
  };

  // Save integration
  const handleSave = async () => {
    if (!formData.api_url) {
      setError('API URL is required');
      return;
    }

    // For new integrations, require API key
    if (!isConfigured && !formData.api_key) {
      setError('API Key is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await integrationService.save(INTEGRATION_TYPE, {
        api_url: formData.api_url,
        api_key: formData.api_key || undefined, // Only send if provided
      });

      setSuccess('Settings saved successfully');
      setHasChanges(false);
      await loadIntegration();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Test connection
  const handleTest = async () => {
    try {
      setTesting(true);
      setError(null);
      setTestResult(null);

      const result = await integrationService.test(INTEGRATION_TYPE);

      setTestResult(result);

      if (result.success) {
        setSuccess('Connection successful! Settings have been locked.');
        await loadIntegration(); // Refresh to get locked state
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  // Unlock integration
  const handleUnlock = async () => {
    const confirmed = await confirm({
      title: 'Unlock Integration Settings?',
      message:
        'This will allow you to modify the API credentials. Make sure to test the connection after making changes.',
      confirmText: 'Unlock',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      setUnlocking(true);
      await integrationService.unlock(INTEGRATION_TYPE);
      await loadIntegration();
      setSuccess('Settings unlocked. You can now make changes.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to unlock settings');
    } finally {
      setUnlocking(false);
    }
  };

  // Delete integration
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Integration?',
      message:
        'This will remove all FTA integration settings including API credentials. TRN verification will fall back to manual mode.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await integrationService.delete(INTEGRATION_TYPE);
      await loadIntegration();
      setSuccess('Integration deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete integration');
    } finally {
      setLoading(false);
    }
  };

  // Load audit log
  const loadAuditLog = async () => {
    try {
      setLoadingAudit(true);
      const response = await integrationService.getAuditLog(INTEGRATION_TYPE, { limit: 50 });
      setAuditLog(response.audit_log || []);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (showAuditLog) {
      loadAuditLog();
    }
  }, [showAuditLog]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-AE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Get status info for the status card
  const getStatusInfo = () => {
    if (!isConfigured) {
      return {
        status: 'not_configured',
        icon: AlertCircle,
        color: 'gray',
        title: 'Not Configured',
        subtitle: 'Set up your FTA credentials to enable automatic TRN verification',
        bgClass: isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100',
        iconBgClass: isDarkMode ? 'bg-gray-600' : 'bg-gray-200',
        iconColorClass: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        textColorClass: isDarkMode ? 'text-gray-400' : 'text-gray-500',
      };
    }

    if (integration?.last_test_success) {
      return {
        status: 'connected',
        icon: CheckCircle,
        color: 'green',
        title: 'Connected',
        subtitle: 'FTA API is working correctly',
        bgClass: isDarkMode ? 'bg-green-900/20' : 'bg-green-50',
        iconBgClass: isDarkMode ? 'bg-green-900/50' : 'bg-green-100',
        iconColorClass: isDarkMode ? 'text-green-400' : 'text-green-600',
        textColorClass: isDarkMode ? 'text-green-400' : 'text-green-600',
      };
    }

    if (integration?.last_test_success === false) {
      return {
        status: 'failed',
        icon: XCircle,
        color: 'red',
        title: 'Connection Failed',
        subtitle: 'Check your credentials and try again',
        bgClass: isDarkMode ? 'bg-red-900/20' : 'bg-red-50',
        iconBgClass: isDarkMode ? 'bg-red-900/50' : 'bg-red-100',
        iconColorClass: isDarkMode ? 'text-red-400' : 'text-red-600',
        textColorClass: isDarkMode ? 'text-red-400' : 'text-red-600',
      };
    }

    return {
      status: 'not_tested',
      icon: Clock,
      color: 'yellow',
      title: 'Not Tested',
      subtitle: 'Save your settings and test the connection',
      bgClass: isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50',
      iconBgClass: isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100',
      iconColorClass: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
      textColorClass: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
    };
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className={embedded ? '' : `min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : `min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={embedded ? '' : 'p-6'}>
        {/* Gradient Header Banner */}
        <div className={`relative overflow-hidden rounded-xl mb-6 ${
          isDarkMode
            ? 'bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900'
            : 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500'
        }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 transform translate-x-1/3 -translate-y-1/3">
              <Shield className="w-full h-full text-white" />
            </div>
          </div>

          <div className="relative px-6 py-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-white/20'}`}>
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  FTA Integration Settings
                </h1>
                <p className="text-teal-100 mt-1">
                  UAE Federal Tax Authority API for TRN Verification
                </p>
              </div>
            </div>

            {/* UAE Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-white/10' : 'bg-white/20'
            }`}>
              <span className="text-white text-sm font-medium">UAE Compliant</span>
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Info Banner - Help Link */}
        <div className={`mb-6 px-4 py-3 rounded-lg flex items-center justify-between ${
          isDarkMode
            ? 'bg-teal-900/30 border border-teal-800'
            : 'bg-teal-50 border border-teal-200'
        }`}>
          <div className="flex items-center gap-3">
            <Info className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
            <span className={`text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
              First time setting up? View our step-by-step guide for FTA API registration
            </span>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-teal-800 hover:bg-teal-700 text-teal-200'
                : 'bg-teal-100 hover:bg-teal-200 text-teal-700'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            View Guide
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {error}
            </div>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 border border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Form (60%) */}
          <div className="lg:w-3/5">
            {/* Locked Banner */}
            {integration?.is_locked && (
              <div className={`mb-6 p-4 rounded-lg border-l-4 border-yellow-500 ${
                isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                        Settings are locked
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-yellow-400/70' : 'text-yellow-600'}`}>
                        Connection tested successfully. Unlock to make changes.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      isDarkMode
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-400 text-white'
                    } disabled:opacity-50`}
                  >
                    {unlocking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    Unlock
                  </button>
                </div>
              </div>
            )}

            {/* Configuration Form Card */}
            <div className={`rounded-xl shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              {/* Card Header */}
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <Settings className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  <h2 className="text-lg font-semibold">API Configuration</h2>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                {/* API URL */}
                <div className="max-w-md">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      API URL
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="url"
                    value={formData.api_url}
                    onChange={(e) => handleChange('api_url', e.target.value)}
                    disabled={integration?.is_locked}
                    placeholder="https://api.tax.gov.ae/v1/trn/verify"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 disabled:bg-gray-800 disabled:text-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
                    } focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                  />
                  <p className={`mt-1.5 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Enter the exact URL from your FTA API credentials
                  </p>
                </div>

                {/* API Key */}
                <div className="max-w-md">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Key
                      {!isConfigured && <span className="text-red-500">*</span>}
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.api_key}
                      onChange={(e) => handleChange('api_key', e.target.value)}
                      disabled={integration?.is_locked}
                      placeholder={
                        isConfigured
                          ? integration?.api_key_masked || 'Key configured (hidden)'
                          : 'Enter your FTA API key'
                      }
                      className={`w-full px-4 py-2.5 pr-12 rounded-lg border transition-colors ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 disabled:bg-gray-800 disabled:text-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
                      } focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
                        isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className={`mt-1.5 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {isConfigured
                      ? 'Leave empty to keep existing key, or enter new key to update'
                      : 'Paste your API key exactly as provided by FTA'}
                  </p>
                </div>

                {/* Test Result */}
                {testResult && (
                  <div
                    className={`max-w-md p-4 rounded-lg ${
                      testResult.success
                        ? isDarkMode
                          ? 'bg-green-900/30 border border-green-700'
                          : 'bg-green-50 border border-green-200'
                        : isDarkMode
                        ? 'bg-red-900/30 border border-red-700'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {testResult.success ? (
                        <CheckCircle className={`h-5 w-5 mt-0.5 ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`} />
                      ) : (
                        <XCircle className={`h-5 w-5 mt-0.5 ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`} />
                      )}
                      <div>
                        <p className={`font-medium ${
                          testResult.success
                            ? isDarkMode ? 'text-green-300' : 'text-green-800'
                            : isDarkMode ? 'text-red-300' : 'text-red-800'
                        }`}>
                          {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                        </p>
                        <p className={`text-sm mt-1 ${
                          testResult.success
                            ? isDarkMode ? 'text-green-400' : 'text-green-600'
                            : isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {testResult.message}
                        </p>
                        {testResult.tested_at && (
                          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Tested: {formatDate(testResult.tested_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {isConfigured && !integration?.is_locked && (
                      <button
                        onClick={handleDelete}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                          isDarkMode
                            ? 'text-red-400 hover:bg-red-900/30'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Test Connection */}
                    <button
                      onClick={handleTest}
                      disabled={testing || !isConfigured || integration?.is_locked || hasChanges}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-100 disabled:text-gray-400'
                      } disabled:cursor-not-allowed`}
                      title={hasChanges ? 'Save changes first' : ''}
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Test Connection
                    </button>

                    {/* Save */}
                    <button
                      onClick={handleSave}
                      disabled={saving || integration?.is_locked || !hasChanges}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white disabled:bg-teal-600/50 disabled:cursor-not-allowed`}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Info Card - Only show when configured */}
            {isConfigured && (
              <div className={`mt-6 rounded-xl shadow-sm border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                      <h2 className="text-lg font-semibold">Usage & Audit</h2>
                    </div>
                    <button
                      onClick={() => setShowAuditLog(!showAuditLog)}
                      className={`text-sm ${isDarkMode ? 'text-teal-400' : 'text-teal-600'} hover:underline`}
                    >
                      {showAuditLog ? 'Hide Log' : 'View Audit Log'}
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Last Used
                      </p>
                      <p className="font-medium mt-1">
                        {integration?.last_used_at ? formatDate(integration.last_used_at) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total Verifications
                      </p>
                      <p className="font-medium mt-1">
                        {integration?.usage_count?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Last Test
                      </p>
                      <p className="font-medium mt-1">
                        {integration?.last_test_at ? formatDate(integration.last_test_at) : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Audit Log */}
                  {showAuditLog && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium mb-4">Recent Activity</h3>
                      {loadingAudit ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                        </div>
                      ) : auditLog.length === 0 ? (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          No activity recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {auditLog.slice(0, 10).map((entry) => (
                            <div
                              key={entry.id}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                              }`}
                            >
                              <div className={`p-1.5 rounded-full ${
                                entry.action === 'tested' && entry.action_details?.success
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : entry.action === 'tested'
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                              }`}>
                                {entry.action === 'tested' ? (
                                  entry.action_details?.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />
                                ) : entry.action === 'locked' ? (
                                  <Lock className="h-4 w-4" />
                                ) : entry.action === 'unlocked' ? (
                                  <Unlock className="h-4 w-4" />
                                ) : (
                                  <Settings className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium capitalize ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {entry.action.replace('_', ' ')}
                                </p>
                                {entry.action_details?.message && (
                                  <p className={`text-xs mt-0.5 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {entry.action_details.message}
                                  </p>
                                )}
                                <p className={`text-xs mt-1 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {entry.performed_by_name || 'System'} - {formatDate(entry.performed_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Get Started Card - Only show when not configured */}
            {!isConfigured && (
              <div className={`mt-6 rounded-xl shadow-sm border overflow-hidden ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`px-6 py-4 border-b ${
                  isDarkMode ? 'border-gray-700 bg-gradient-to-r from-teal-900/30 to-emerald-900/30' : 'border-gray-200 bg-gradient-to-r from-teal-50 to-emerald-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <Zap className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                    <h2 className="text-lg font-semibold">Get Started</h2>
                  </div>
                </div>

                <div className="p-6">
                  <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Follow these steps to enable automatic TRN verification:
                  </p>

                  {/* Setup Steps */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDarkMode ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-700'
                      }`}>
                        1
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Enter API URL
                        </p>
                        <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Copy the endpoint URL from your FTA API credentials
                        </p>
                      </div>
                      <ArrowRight className={`h-5 w-5 mt-1.5 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>

                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDarkMode ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-700'
                      }`}>
                        2
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Enter API Key
                        </p>
                        <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Paste your secret API key (case-sensitive)
                        </p>
                      </div>
                      <ArrowRight className={`h-5 w-5 mt-1.5 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>

                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDarkMode ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-700'
                      }`}>
                        3
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Test Connection
                        </p>
                        <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Verify your credentials work correctly
                        </p>
                      </div>
                      <CheckCircle className={`h-5 w-5 mt-1.5 ${isDarkMode ? 'text-green-500' : 'text-green-500'}`} />
                    </div>
                  </div>

                  {/* Manual Verification Link */}
                  <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Don't have API access yet? You can still verify TRNs manually:
                    </p>
                    <a
                      href="https://tax.gov.ae/en/trn.verification.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 mt-2 text-sm font-medium ${
                        isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
                      }`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Verify TRNs on FTA Portal
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Tips (40%) */}
          <div className="lg:w-2/5 space-y-6">
            {/* Status Card */}
            <div className={`rounded-xl shadow-sm border overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="font-semibold">Connection Status</h3>
              </div>

              <div className="p-6">
                {/* Status Visual */}
                <div className={`p-6 rounded-xl text-center ${statusInfo.bgClass}`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${statusInfo.iconBgClass}`}>
                    <statusInfo.icon className={`h-8 w-8 ${statusInfo.iconColorClass}`} />
                  </div>
                  <h4 className={`text-xl font-bold ${statusInfo.textColorClass}`}>
                    {statusInfo.title}
                  </h4>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {statusInfo.subtitle}
                  </p>
                </div>

                {/* Last Test Info */}
                {integration?.last_test_at && (
                  <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Last tested:</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(integration.last_test_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className={`rounded-xl shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <Lightbulb className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <h3 className="font-semibold">Quick Tips</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-teal-900/50' : 'bg-teal-100'
                  }`}>
                    <CheckCircle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Copy your API credentials exactly as provided - they are case-sensitive
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-teal-900/50' : 'bg-teal-100'
                  }`}>
                    <CheckCircle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Settings lock automatically after a successful test to prevent accidental changes
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-teal-900/50' : 'bg-teal-100'
                  }`}>
                    <CheckCircle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    All API credentials are encrypted and never exposed to the browser
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-teal-900/50' : 'bg-teal-100'
                  }`}>
                    <CheckCircle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    New TRN registrations may take 24-48 hours to appear in FTA system
                  </p>
                </div>
              </div>
            </div>

            {/* Help & Resources Card */}
            <div className={`rounded-xl shadow-sm border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <HelpCircle className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  <h3 className="font-semibold">Help & Resources</h3>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => setShowHelpModal(true)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                    <span className="text-sm font-medium">Integration Guide</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>

                <a
                  href="https://eservices.tax.gov.ae"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                    <span className="text-sm font-medium">FTA e-Services Portal</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </a>

                <a
                  href="https://tax.gov.ae/en/trn.verification.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                    <span className="text-sm font-medium">Manual TRN Verification</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowHelpModal(false)}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Close button */}
              <button
                onClick={() => setShowHelpModal(false)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="overflow-y-auto max-h-[85vh]">
                <FTAHelpPanel onClose={() => setShowHelpModal(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default FTAIntegrationSettings;
