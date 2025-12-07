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
