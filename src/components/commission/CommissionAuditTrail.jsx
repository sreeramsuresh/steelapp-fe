import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  History,
  Clock,
  CheckCircle,
  DollarSign,
  Edit2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  FileText,
} from 'lucide-react';
import { commissionService } from '../../services/commissionService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';

/**
 * CommissionAuditTrail Component
 * Displays a timeline of commission changes for an invoice
 * Shows: created, adjusted, approved, paid, reversed events
 */
const CommissionAuditTrail = ({
  invoiceId,
  commissionId,
  isExpanded: initialExpanded = false,
  onClose,
  asModal = false,
}) => {
  const { isDarkMode } = useTheme();
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  useEffect(() => {
    if (invoiceId && (isExpanded || asModal)) {
      loadAuditTrail();
    }
  }, [invoiceId, isExpanded, asModal]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commissionService.getCommissionAuditTrail(invoiceId);
      const entries = response?.auditEntries || response?.audit_entries || [];
      setAuditEntries(entries);
    } catch (err) {
      console.error('Error loading audit trail:', err);
      setError(err.message || 'Failed to load audit trail');
      notificationService.error('Failed to load commission audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    const iconMap = {
      CREATED: <FileText className="w-4 h-4" />,
      ACCRUED: <Clock className="w-4 h-4" />,
      ADJUSTED: <Edit2 className="w-4 h-4" />,
      APPROVED: <CheckCircle className="w-4 h-4" />,
      PAID: <DollarSign className="w-4 h-4" />,
      REVERSED: <XCircle className="w-4 h-4" />,
      VOIDED: <XCircle className="w-4 h-4" />,
    };
    return iconMap[eventType?.toUpperCase()] || <AlertCircle className="w-4 h-4" />;
  };

  const getEventColor = (eventType) => {
    const colorMap = {
      CREATED: 'bg-blue-100 text-blue-600 border-blue-200',
      ACCRUED: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      ADJUSTED: 'bg-orange-100 text-orange-600 border-orange-200',
      APPROVED: 'bg-green-100 text-green-600 border-green-200',
      PAID: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      REVERSED: 'bg-red-100 text-red-600 border-red-200',
      VOIDED: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    const darkColorMap = {
      CREATED: 'bg-blue-900/30 text-blue-400 border-blue-800',
      ACCRUED: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      ADJUSTED: 'bg-orange-900/30 text-orange-400 border-orange-800',
      APPROVED: 'bg-green-900/30 text-green-400 border-green-800',
      PAID: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      REVERSED: 'bg-red-900/30 text-red-400 border-red-800',
      VOIDED: 'bg-gray-700 text-gray-400 border-gray-600',
    };
    const map = isDarkMode ? darkColorMap : colorMap;
    return map[eventType?.toUpperCase()] || (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600');
  };


  const formatEventType = (eventType) => {
    const labels = {
      CREATED: 'Commission Created',
      ACCRUED: 'Commission Accrued',
      ADJUSTED: 'Amount Adjusted',
      APPROVED: 'Approved for Payout',
      PAID: 'Payment Processed',
      REVERSED: 'Commission Reversed',
      VOIDED: 'Commission Voided',
    };
    return labels[eventType?.toUpperCase()] || eventType;
  };

  const renderTimelineContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading audit trail...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className={isDarkMode ? 'text-red-400' : 'text-red-700'}>{error}</span>
          </div>
          <button
            onClick={loadAuditTrail}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    if (auditEntries.length === 0) {
      return (
        <div className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No audit history available</p>
        </div>
      );
    }
