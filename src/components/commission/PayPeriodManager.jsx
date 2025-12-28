import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Users,
  FileText,
  Play,
  XCircle,
} from 'lucide-react';
import { commissionService } from '../../services/commissionService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';

/**
 * PayPeriodManager Component
 * Manages commission pay periods - list, close, and process payments
 */
const PayPeriodManager = () => {
  const { isDarkMode } = useTheme();
  const [payPeriods, setPayPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadPayPeriods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commissionService.listPayPeriods();
      const periods = response?.payPeriods || response?.pay_periods || [];
      setPayPeriods(periods);
    } catch (err) {
      console.error('Error loading pay periods:', err);
      setError(err.message || 'Failed to load pay periods');
      notificationService.error('Failed to load pay periods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayPeriods();
  }, [loadPayPeriods]);

  const handleClosePeriod = async (periodId) => {
    try {
      setProcessing(true);
      await commissionService.closePayPeriod(periodId);
      notificationService.success('Pay period closed successfully');
      loadPayPeriods();
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Error closing pay period:', err);
      notificationService.error(err.message || 'Failed to close pay period');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPayments = async (periodId) => {
    try {
      setProcessing(true);
      await commissionService.processPayPeriodPayments(periodId);
      notificationService.success('Payments processed successfully');
      loadPayPeriods();
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Error processing payments:', err);
      notificationService.error(err.message || 'Failed to process payments');
    } finally {
      setProcessing(false);
    }
  };

  const openConfirmModal = (action, period) => {
    setConfirmAction({ type: action, period });
    setShowConfirmModal(true);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'close') {
      handleClosePeriod(confirmAction.period.id);
    } else if (confirmAction.type === 'process') {
      handleProcessPayments(confirmAction.period.id);
    }
  };

  const getStatusBadge = (status) => {
    const statusUpper = (status || '').toUpperCase();
    const config = {
      OPEN: {
        bg: 'bg-green-100 text-green-800',
        darkBg: 'bg-green-900/30 text-green-400',
        icon: Unlock,
      },
      CLOSED: {
        bg: 'bg-yellow-100 text-yellow-800',
        darkBg: 'bg-yellow-900/30 text-yellow-400',
        icon: Lock,
      },
      PROCESSING: {
        bg: 'bg-blue-100 text-blue-800',
        darkBg: 'bg-blue-900/30 text-blue-400',
        icon: Clock,
      },
      PAID: {
        bg: 'bg-purple-100 text-purple-800',
        darkBg: 'bg-purple-900/30 text-purple-400',
        icon: CheckCircle,
      },
    };
    const statusConfig = config[statusUpper] || config.OPEN;
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${
          isDarkMode ? statusConfig.darkBg : statusConfig.bg
        }`}
      >
        <Icon className="w-3 h-3" />
        <span>{status || 'Open'}</span>
      </span>
    );
  };

  const formatPeriodName = (period) => {
    const startDate = period.startDate || period.start_date;
    const endDate = period.endDate || period.end_date;
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return period.name || `Period #${period.id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Pay Period Management
          </h2>
          <p
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Manage commission pay periods and process payments
          </p>
        </div>
        <button
          onClick={loadPayPeriods}
          disabled={loading}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } disabled:opacity-50`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span
            className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Loading pay periods...
          </span>
        </div>
      ) : error ? (
        <div
          className={`p-6 rounded-lg border text-center ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p className={isDarkMode ? 'text-red-400' : 'text-red-600'}>
            {error}
          </p>
          <button
            onClick={loadPayPeriods}
            className="mt-3 text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      ) : payPeriods.length === 0 ? (
        <div
          className={`p-12 rounded-lg border text-center ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3
            className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            No Pay Periods
          </h3>
          <p
            className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Pay periods will be created automatically when commissions are
            generated
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payPeriods.map((period) => {
            const status = (period.status || 'OPEN').toUpperCase();
            const totalAmount = parseFloat(
              period.totalAmount || period.total_amount || 0,
            );
            const agentCount = period.agentCount || period.agent_count || 0;
            const commissionCount =
              period.commissionCount || period.commission_count || 0;
            const isOpen = status === 'OPEN';
            const isClosed = status === 'CLOSED';
            const isPaid = status === 'PAID';

            return (
              <div
                key={period.id}
                className={`rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } overflow-hidden`}
              >
                {/* Period Header */}
                <div
                  className={`p-4 flex items-center justify-between cursor-pointer ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setSelectedPeriod(
                      selectedPeriod === period.id ? null : period.id,
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPeriod(
                        selectedPeriod === period.id ? null : period.id,
                      );
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <Calendar
                        className={`w-6 h-6 ${
                          isPaid
                            ? 'text-purple-500'
                            : isClosed
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {formatPeriodName(period)}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        {getStatusBadge(status)}
                        <span
                          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {commissionCount} commissions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {formatCurrency(totalAmount)}
                      </p>
                      <p
                        className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {agentCount} agents
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        selectedPeriod === period.id ? 'rotate-90' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedPeriod === period.id && (
                  <div
                    className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div
                        className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                      >
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span
                            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            Agents
                          </span>
                        </div>
                        <p
                          className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {agentCount}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <span
                            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            Commissions
                          </span>
                        </div>
                        <p
                          className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {commissionCount}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                      >
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-purple-500" />
                          <span
                            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            Total Amount
                          </span>
                        </div>
                        <p
                          className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {formatCurrency(totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      {isOpen && (
                        <button
                          onClick={() => openConfirmModal('close', period)}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Close Period</span>
                        </button>
                      )}

                      {isClosed && (
                        <button
                          onClick={() => openConfirmModal('process', period)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          <span>Process Payments</span>
                        </button>
                      )}

                      {isPaid && (
                        <div className="flex items-center space-x-2 text-green-500">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">
                            All payments processed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg max-w-md w-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div
              className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                <h3
                  className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {confirmAction.type === 'close'
                    ? 'Close Pay Period?'
                    : 'Process Payments?'}
                </h3>
              </div>
            </div>

            <div className="p-6">
              {confirmAction.type === 'close' ? (
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Closing this pay period will prevent any new commissions from
                  being added. All approved commissions will be locked and ready
                  for payment processing.
                </p>
              ) : (
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  This will mark all commissions in this period as paid. Make
                  sure all actual payments have been processed before
                  confirming.
                </p>
              )}

              <div
                className={`mt-4 p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Period: {formatPeriodName(confirmAction.period)}
                </p>
                <p
                  className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Total:{' '}
                  {formatCurrency(
                    parseFloat(
                      confirmAction.period.totalAmount ||
                        confirmAction.period.total_amount ||
                        0,
                    ),
                  )}
                </p>
              </div>
            </div>

            <div
              className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={processing}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={processing}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 text-white ${
                  confirmAction.type === 'close'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {confirmAction.type === 'close' ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>
                      {confirmAction.type === 'close'
                        ? 'Close Period'
                        : 'Process Payments'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayPeriodManager;
