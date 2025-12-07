import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  History,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  User,
} from 'lucide-react';
import { commissionService } from '../../services/commissionService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';

/**
 * CommissionHistory Component
 * Shows historical commissions for a sales person with filtering
 */
const CommissionHistory = ({ salesPersonId, salesPersonName }) => {
  const { isDarkMode } = useTheme();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
