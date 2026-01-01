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
 * - Always-visible help panel on right side
 *
 * Layout:
 * - Two-column layout (60/40) starting from the very top
 * - Left 60%: Header + Actionable items (config, status, audit)
 * - Right 40%: Help documentation (full height, always visible)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Key,
  Server,
  CheckCircle,
  XCircle,
  Circle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  History,
  Settings,
  Clock,
  Trash2,
  X,
  Info,
  ArrowRight,
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
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Test result
  const [testResult, setTestResult] = useState(null);

  // Guard against duplicate API calls (React Strict Mode double-mounting)
  const hasFetchedRef = useRef(false);

  // Load integration data
  const loadIntegration = useCallback(async () => {
    // Prevent duplicate fetches from React Strict Mode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

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
            : null,
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
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      setError(
        err.response?.data?.error || err.message || 'Failed to save settings',
      );
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
        message:
          err.response?.data?.message ||
          err.message ||
          'Connection test failed',
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
      const response = await integrationService.getAuditLog(INTEGRATION_TYPE, {
        limit: 50,
      });
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

  // Get status info for the inline status badge
  const getStatusInfo = () => {
    if (!isConfigured) {
      return {
        status: 'not_configured',
        icon: AlertCircle,
        title: 'Not Configured',
        bgClass: isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100',
        iconColorClass: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        textColorClass: isDarkMode ? 'text-gray-400' : 'text-gray-500',
      };
    }

    if (integration?.last_test_success) {
      return {
        status: 'connected',
        icon: CheckCircle,
        title: 'Connected',
        bgClass: isDarkMode ? 'bg-green-900/20' : 'bg-green-50',
        iconColorClass: isDarkMode ? 'text-green-400' : 'text-green-600',
        textColorClass: isDarkMode ? 'text-green-400' : 'text-green-600',
      };
    }

    if (integration?.last_test_success === false) {
      return {
        status: 'failed',
        icon: XCircle,
        title: 'Connection Failed',
        bgClass: isDarkMode ? 'bg-red-900/20' : 'bg-red-50',
        iconColorClass: isDarkMode ? 'text-red-400' : 'text-red-600',
        textColorClass: isDarkMode ? 'text-red-400' : 'text-red-600',
      };
    }

    return {
      status: 'not_tested',
      icon: Clock,
      title: 'Not Tested',
      bgClass: isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50',
      iconColorClass: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
      textColorClass: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
    };
  };

  const statusInfo = getStatusInfo();

  // Get current status key for legend highlighting
  const getCurrentStatus = () => {
    if (!isConfigured) return 'not_configured';
    if (integration?.last_test_success === true) return 'connected';
    if (integration?.last_test_success === false) return 'failed';
    return 'not_tested'; // configured but never tested
  };

  const currentStatus = getCurrentStatus();

  // Status legend data with iOS-style icon squares
  const statusLegend = [
    {
      key: 'connected',
      label: 'Connected',
      icon: CheckCircle,
      iconBg: 'bg-green-500',
      description: 'Working, all good',
    },
    {
      key: 'failed',
      label: 'Connection Failed',
      icon: XCircle,
      iconBg: 'bg-red-500',
      description: 'Error, needs attention',
    },
    {
      key: 'not_configured',
      label: 'Not Configured',
      icon: Circle,
      iconBg: 'bg-gray-400',
      description: 'Neutral, not set up yet',
    },
    {
      key: 'not_tested',
      label: 'Not Tested',
      icon: AlertCircle,
      iconBg: 'bg-amber-500',
      description: 'Warning, needs testing',
    },
  ];

  if (loading) {
    return (
      <div
        className={
          embedded
            ? ''
            : `min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`
        }
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? ''
          : `min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`
      }
    >
      <div className={embedded ? '' : 'p-6'}>
        {/* Two-Column Layout - Starting from the very top */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Left Column - Header + Actionable Items (60%) */}
          <div className="lg:w-3/5 space-y-4">
            {/* Compact Gradient Header - INSIDE left column only */}
            <div
              className={`relative overflow-hidden rounded-xl ${
                isDarkMode
                  ? 'bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900'
                  : 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500'
              }`}
            >
              <div className="relative px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-white/20'}`}
                  >
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-white">
                    FTA Integration Settings
                  </h1>
                </div>

                {/* UAE Badge - Inline */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md ${
                    isDarkMode ? 'bg-white/10' : 'bg-white/20'
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                  <span className="text-white text-xs font-medium">
                    UAE Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Info Banner - Compact */}
            <div
              className={`px-4 py-2.5 rounded-lg flex items-center gap-3 ${
                isDarkMode
                  ? 'bg-teal-900/30 border border-teal-800'
                  : 'bg-teal-50 border border-teal-200'
              }`}
            >
              <Info
                className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
              />
              <span
                className={`text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}
              >
                First time setting up? See the guide on the right
              </span>
              <ArrowRight
                className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
              />
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  {error}
                </div>
                <button onClick={() => setError(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="p-4 rounded-lg bg-green-100 border border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            )}

            {/* Locked Banner - Show when integration is locked */}
            {integration?.is_locked && (
              <div
                className={`p-4 rounded-lg border-l-4 border-yellow-500 ${
                  isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock
                      className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
                    />
                    <div>
                      <p
                        className={`font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}
                      >
                        Settings are locked
                      </p>
                      <p
                        className={`text-sm ${isDarkMode ? 'text-yellow-400/70' : 'text-yellow-600'}`}
                      >
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

            {/* Status Badge - Inline Compact Card */}
            <div
              className={`px-4 py-3 rounded-lg flex items-center justify-between ${statusInfo.bgClass}`}
            >
              <div className="flex items-center gap-3">
                <statusInfo.icon
                  className={`h-5 w-5 ${statusInfo.iconColorClass}`}
                />
                <span className={`font-medium ${statusInfo.textColorClass}`}>
                  {statusInfo.title}
                </span>
              </div>
              {integration?.last_test_at && (
                <span
                  className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  Last tested: {formatDate(integration.last_test_at)}
                </span>
              )}
            </div>

            {/* API Configuration + Status Legend side by side */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* API Configuration Card - takes remaining space */}
              <div className="flex-1">
                <div
                  className={`h-full rounded-xl shadow-sm border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`px-5 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Settings
                        className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
                      />
                      <h2 className="text-base font-semibold">
                        API Configuration
                      </h2>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-5">
                    {/* API URL */}
                    <div>
                      <label
                        htmlFor="fta-api-url"
                        className={`block text-sm font-medium mb-1.5 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          API URL
                          <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        id="fta-api-url"
                        type="url"
                        value={formData.api_url}
                        onChange={(e) =>
                          handleChange('api_url', e.target.value)
                        }
                        disabled={integration?.is_locked}
                        placeholder="https://api.tax.gov.ae/v1/trn/verify"
                        className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 disabled:bg-gray-800 disabled:text-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
                        } focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                      />
                      <p
                        className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        Enter the exact URL from your FTA API credentials
                      </p>
                    </div>

                    {/* API Key */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1.5 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          API Key
                          {!isConfigured && (
                            <span className="text-red-500">*</span>
                          )}
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={formData.api_key}
                          onChange={(e) =>
                            handleChange('api_key', e.target.value)
                          }
                          disabled={integration?.is_locked}
                          placeholder={
                            isConfigured
                              ? integration?.api_key_masked ||
                                'Key configured (hidden)'
                              : 'Enter your FTA API key'
                          }
                          className={`w-full px-3 py-2 pr-10 rounded-lg border transition-colors text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 disabled:bg-gray-800 disabled:text-gray-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
                          } focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded ${
                            isDarkMode
                              ? 'text-gray-400 hover:text-gray-300'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p
                        className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        {isConfigured
                          ? 'Leave empty to keep existing key, or enter new key to update'
                          : 'Paste your API key exactly as provided by FTA'}
                      </p>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                      <div
                        className={`p-3 rounded-lg ${
                          testResult.success
                            ? isDarkMode
                              ? 'bg-green-900/30 border border-green-700'
                              : 'bg-green-50 border border-green-200'
                            : isDarkMode
                              ? 'bg-red-900/30 border border-red-700'
                              : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <CheckCircle
                              className={`h-4 w-4 mt-0.5 ${
                                isDarkMode ? 'text-green-400' : 'text-green-600'
                              }`}
                            />
                          ) : (
                            <XCircle
                              className={`h-4 w-4 mt-0.5 ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                              }`}
                            />
                          )}
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                testResult.success
                                  ? isDarkMode
                                    ? 'text-green-300'
                                    : 'text-green-800'
                                  : isDarkMode
                                    ? 'text-red-300'
                                    : 'text-red-800'
                              }`}
                            >
                              {testResult.success
                                ? 'Connection Successful'
                                : 'Connection Failed'}
                            </p>
                            <p
                              className={`text-xs mt-0.5 ${
                                testResult.success
                                  ? isDarkMode
                                    ? 'text-green-400'
                                    : 'text-green-600'
                                  : isDarkMode
                                    ? 'text-red-400'
                                    : 'text-red-600'
                              }`}
                            >
                              {testResult.message}
                            </p>
                            {testResult.tested_at && (
                              <p
                                className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                              >
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
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
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

                      <div className="flex items-center gap-2">
                        {/* Test Connection */}
                        <button
                          onClick={handleTest}
                          disabled={
                            testing ||
                            !isConfigured ||
                            integration?.is_locked ||
                            hasChanges
                          }
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
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
                          disabled={
                            saving || integration?.is_locked || !hasChanges
                          }
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white disabled:bg-teal-600/50 disabled:cursor-not-allowed`}
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
              </div>

              {/* Status Legend - fixed width on right */}
              <div className="lg:w-72">
                <div
                  className={`h-full rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div
                    className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <h3
                      className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      <Info
                        className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
                      />
                      Status Legend
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {statusLegend.map((item) => {
                      const isCurrent = currentStatus === item.key;
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            isCurrent
                              ? isDarkMode
                                ? 'bg-teal-900/20'
                                : 'bg-teal-50'
                              : ''
                          } ${!isCurrent ? 'opacity-50' : ''}`}
                        >
                          {/* iOS-style rounded square icon */}
                          <div
                            className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                              isCurrent
                                ? item.iconBg
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-sm ${isCurrent ? 'font-medium' : ''} ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              {item.label}
                            </p>
                            <p
                              className={`text-xs ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Usage & Audit Card - Only show when configured */}
            {isConfigured && (
              <div
                className={`rounded-xl shadow-sm border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div
                  className={`px-5 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History
                        className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
                      />
                      <h2 className="text-base font-semibold">Usage & Audit</h2>
                    </div>
                    <button
                      onClick={() => setShowAuditLog(!showAuditLog)}
                      className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-600'} hover:underline`}
                    >
                      {showAuditLog ? 'Hide Log' : 'View Audit Log'}
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p
                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        Last Used
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {integration?.last_used_at
                          ? formatDate(integration.last_used_at)
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        Total Verifications
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {integration?.usage_count?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        Last Test
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {integration?.last_test_at
                          ? formatDate(integration.last_test_at)
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Audit Log */}
                  {showAuditLog && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium mb-3">
                        Recent Activity
                      </h3>
                      {loadingAudit ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                        </div>
                      ) : auditLog.length === 0 ? (
                        <p
                          className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                        >
                          No activity recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {auditLog.slice(0, 10).map((entry) => (
                            <div
                              key={entry.id}
                              className={`flex items-start gap-2 p-2 rounded-lg ${
                                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                              }`}
                            >
                              <div
                                className={`p-1 rounded-full ${
                                  entry.action === 'tested' &&
                                  entry.action_details?.success
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : entry.action === 'tested'
                                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {entry.action === 'tested' ? (
                                  entry.action_details?.success ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )
                                ) : entry.action === 'locked' ? (
                                  <Lock className="h-3 w-3" />
                                ) : entry.action === 'unlocked' ? (
                                  <Unlock className="h-3 w-3" />
                                ) : (
                                  <Settings className="h-3 w-3" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs font-medium capitalize ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {entry.action.replace('_', ' ')}
                                </p>
                                {entry.action_details?.message && (
                                  <p
                                    className={`text-xs mt-0.5 ${
                                      isDarkMode
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {entry.action_details.message}
                                  </p>
                                )}
                                <p
                                  className={`text-xs mt-0.5 ${
                                    isDarkMode
                                      ? 'text-gray-500'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {entry.performed_by_name || 'System'} -{' '}
                                  {formatDate(entry.performed_at)}
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
          </div>

          {/* Right Column - Help Panel (40%) - Full height from top */}
          <div className="lg:w-2/5 lg:self-stretch">
            <div
              className={`h-full rounded-xl shadow-sm border overflow-hidden ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="h-full max-h-[calc(100vh-120px)] overflow-y-auto lg:sticky lg:top-6">
                <FTAHelpPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

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
