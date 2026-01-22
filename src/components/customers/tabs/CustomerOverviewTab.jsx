/**
 * Customer Overview Tab
 *
 * Provides comprehensive 360° snapshot of customer information including:
 * - Master Data: Customer name, code, contact info, payment terms, status
 * - Credit Summary: Credit limit, used amount, available credit, utilization percentage
 * - AR Summary: Total outstanding, overdue amounts, aging buckets (0-30, 31-60, 61-90, 90+)
 * - Visual Indicators: Credit utilization progress bar, status badges, warning indicators
 *
 * Data Source:
 * - Receives customer object from parent component (no API call)
 * - No caching needed (relies on parent data)
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.customer - Customer object from customerService.getCustomer()
 * @param {string} props.customer.name - Customer name
 * @param {string} props.customer.code - Customer code
 * @param {string} props.customer.email - Contact email
 * @param {string} props.customer.phone - Contact phone
 * @param {number} props.customer.creditLimit - Credit limit
 * @param {number} props.customer.totalOutstanding - Total AR outstanding
 * @returns {JSX.Element} Customer overview display
 */

import { useTheme } from '../../../contexts/ThemeContext';
import { formatCurrency } from '../../../utils/invoiceUtils';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';

export default function CustomerOverviewTab({ customer }) {
  const { isDarkMode } = useTheme();

  // Null check
  if (!customer) {
    return (
      <div
        className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
      >
        No customer data available
      </div>
    );
  }

  // Card styling
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const primaryText = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryText = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const mutedText = isDarkMode ? 'text-gray-500' : 'text-gray-400';

  // Credit calculations
  const creditLimit = parseFloat(customer.creditLimit) || 0;
  const creditUsed = parseFloat(customer.creditUsed) || 0;
  const availableCredit = creditLimit - creditUsed;
  const utilizationPercent =
    creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  // Credit utilization color coding
  const getUtilizationColor = (percent) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUtilizationBgColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAvailableCreditColor = (available, limit) => {
    const percentAvailable = limit > 0 ? (available / limit) * 100 : 0;
    if (percentAvailable > 50) return 'text-green-600';
    if (percentAvailable > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Credit grade badge color
  const getGradeColor = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'D':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // AR calculations
  const agingCurrent = parseFloat(customer.agingCurrent) || 0;
  const aging1To30 = parseFloat(customer.aging1To30) || 0;
  const aging31To60 = parseFloat(customer.aging31To60) || 0;
  const aging61To90 = parseFloat(customer.aging61To90) || 0;
  const aging90Plus = parseFloat(customer.aging90Plus) || 0;

  const totalOutstanding =
    agingCurrent + aging1To30 + aging31To60 + aging61To90 + aging90Plus;
  const totalOverdue = aging1To30 + aging31To60 + aging61To90 + aging90Plus;
  const overduePercent =
    totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0;

  // Oldest invoice age
  const getOldestInvoiceAge = () => {
    if (aging90Plus > 0) return '90+ days';
    if (aging61To90 > 0) return '61-90 days';
    if (aging31To60 > 0) return '31-60 days';
    if (aging1To30 > 0) return '1-30 days';
    if (agingCurrent > 0) return 'Current';
    return 'No outstanding invoices';
  };

  // Aging bucket colors
  const agingColors = {
    current: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    '1-30': isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
    '31-60': isDarkMode ? 'text-orange-400' : 'text-orange-600',
    '61-90': isDarkMode ? 'text-red-400' : 'text-red-600',
    '90+': isDarkMode ? 'text-red-500' : 'text-red-700',
  };

  const agingBgColors = {
    current: isDarkMode ? 'bg-blue-500' : 'bg-blue-600',
    '1-30': isDarkMode ? 'bg-yellow-500' : 'bg-yellow-600',
    '31-60': isDarkMode ? 'bg-orange-500' : 'bg-orange-600',
    '61-90': isDarkMode ? 'bg-red-500' : 'bg-red-600',
    '90+': isDarkMode ? 'bg-red-600' : 'bg-red-700',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Section 1: Customer Master Data */}
      <div
        className={`${cardBg} border ${borderColor} rounded-lg p-6 shadow-sm`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${primaryText} flex items-center gap-2`}
        >
          <CreditCard className="w-5 h-5" />
          Customer Information
        </h2>

        {/* Customer Name & Code */}
        <div className="mb-4">
          <h3 className={`text-2xl font-bold ${primaryText} mb-2`}>
            {customer.name || 'N/A'}
          </h3>
          <span
            className={`inline-block px-3 py-1 text-sm font-mono rounded ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {customer.code || customer.customerCode || 'N/A'}
          </span>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium uppercase tracking-wider rounded-full ${
              customer.status === 'active'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {customer.status === 'active' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {customer.status || 'Unknown'}
          </span>
        </div>

        {/* Payment Terms */}
        <div className="mb-4">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
          >
            Payment Terms
          </div>
          <p className={`${secondaryText} flex items-center gap-2`}>
            <Clock className="w-4 h-4" />
            {customer.paymentTermsDays ||
            customer.payment_terms_days ||
            customer.paymentTerms
              ? `Net ${customer.paymentTermsDays || customer.payment_terms_days || customer.paymentTerms} days`
              : 'N/A'}
          </p>
        </div>

        {/* Contact Information */}
        <div className="space-y-3 mb-4">
          <div className={`block text-xs uppercase tracking-wide ${mutedText}`}>
            Contact Information
          </div>

          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className={`flex items-center gap-2 ${secondaryText} hover:${isDarkMode ? 'text-teal-400' : 'text-teal-600'} transition-colors`}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{customer.email}</span>
            </a>
          )}

          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className={`flex items-center gap-2 ${secondaryText} hover:${isDarkMode ? 'text-teal-400' : 'text-teal-600'} transition-colors`}
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{customer.phone}</span>
            </a>
          )}

          {customer.address && (
            <div className={`flex items-start gap-2 ${secondaryText}`}>
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                {[
                  customer.address.street,
                  customer.address.city,
                  customer.address.state,
                  customer.address.postalCode,
                  customer.address.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* TRN Number */}
        {customer.trnNumber && (
          <div className="mb-4">
            <div
              className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
            >
              Tax Registration Number
            </div>
            <p className={`${secondaryText} font-mono text-sm`}>
              {customer.trnNumber}
            </p>
          </div>
        )}

        {/* Dates */}
        {(customer.createdAt || customer.updatedAt) && (
          <div className="space-y-2 pt-4 border-t border-gray-700">
            {customer.createdAt && (
              <div className={`flex items-center gap-2 ${mutedText} text-xs`}>
                <Calendar className="w-3 h-3" />
                <span>
                  Created: {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {customer.updatedAt && (
              <div className={`flex items-center gap-2 ${mutedText} text-xs`}>
                <Calendar className="w-3 h-3" />
                <span>
                  Updated: {new Date(customer.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Credit Summary */}
      <div
        className={`${cardBg} border ${borderColor} rounded-lg p-6 shadow-sm`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${primaryText} flex items-center gap-2`}
        >
          <TrendingUp className="w-5 h-5" />
          Credit Summary
        </h2>

        {/* Credit Limit */}
        <div className="mb-4">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
          >
            Credit Limit
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>
            {formatCurrency(creditLimit)}
          </p>
        </div>

        {/* Credit Used */}
        <div className="mb-4">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
          >
            Credit Used
          </div>
          <p className={`text-xl font-semibold ${secondaryText}`}>
            {formatCurrency(creditUsed)}
          </p>
        </div>

        {/* Available Credit */}
        <div className="mb-4">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
          >
            Available Credit
          </div>
          <p
            className={`text-xl font-semibold ${getAvailableCreditColor(availableCredit, creditLimit)}`}
          >
            {formatCurrency(availableCredit)}
          </p>
        </div>

        {/* Credit Utilization */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className={`text-xs uppercase tracking-wide ${mutedText}`}>
              Credit Utilization
            </div>
            <span
              className={`text-sm font-semibold ${getUtilizationColor(utilizationPercent)}`}
            >
              {utilizationPercent.toFixed(1)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}
          >
            <div
              className={`h-full ${getUtilizationBgColor(utilizationPercent)} transition-all duration-300`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>

          {/* Utilization Warning */}
          {utilizationPercent >= 90 && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              High credit utilization
            </p>
          )}
        </div>

        {/* Credit Grade & Score */}
        <div className="grid grid-cols-2 gap-4">
          {customer.creditGrade && (
            <div>
              <div
                className={`block text-xs uppercase tracking-wide ${mutedText} mb-2`}
              >
                Credit Grade
              </div>
              <span
                className={`inline-block px-4 py-2 text-lg font-bold border rounded-lg ${getGradeColor(customer.creditGrade)}`}
              >
                {customer.creditGrade}
              </span>
            </div>
          )}

          {customer.creditScore !== undefined &&
            customer.creditScore !== null && (
              <div>
                <div
                  className={`block text-xs uppercase tracking-wide ${mutedText} mb-2`}
                >
                  Credit Score
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${primaryText}`}>
                    {customer.creditScore}
                  </span>
                  <span className={`text-sm ${mutedText}`}>/100</span>
                </div>
                {/* Score Bar */}
                <div
                  className={`mt-2 w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}
                >
                  <div
                    className="h-full bg-teal-500 transition-all duration-300"
                    style={{ width: `${customer.creditScore}%` }}
                  />
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Section 3: AR Summary */}
      <div
        className={`${cardBg} border ${borderColor} rounded-lg p-6 shadow-sm`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${primaryText} flex items-center gap-2`}
        >
          <FileText className="w-5 h-5" />
          AR Summary
        </h2>

        {/* Total Outstanding */}
        <div className="mb-4">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
          >
            Total Outstanding
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>
            {formatCurrency(totalOutstanding)}
          </p>
        </div>

        {/* Overdue Amount */}
        <div className="mb-4">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
          >
            Overdue Amount
          </div>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-xl font-semibold ${totalOverdue > 0 ? 'text-red-500' : secondaryText}`}
            >
              {formatCurrency(totalOverdue)}
            </p>
            {totalOverdue > 0 && (
              <span className={`text-sm ${mutedText}`}>
                ({overduePercent.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {/* DSO Days */}
        {customer.dsoDays !== undefined && customer.dsoDays !== null && (
          <div className="mb-4">
            <div
              className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
            >
              Days Sales Outstanding (DSO)
            </div>
            <p className={`text-lg font-semibold ${secondaryText}`}>
              {customer.dsoDays} days
            </p>
          </div>
        )}

        {/* Oldest Invoice Age */}
        <div className="mb-6">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-1`}
          >
            Oldest Invoice Age
          </div>
          <p
            className={`text-sm font-medium ${
              aging90Plus > 0
                ? 'text-red-500'
                : aging61To90 > 0
                  ? 'text-orange-500'
                  : secondaryText
            }`}
          >
            {getOldestInvoiceAge()}
          </p>
        </div>

        {/* AR Aging Buckets */}
        <div className="space-y-3">
          <div
            className={`block text-xs uppercase tracking-wide ${mutedText} mb-2`}
          >
            Aging Breakdown
          </div>

          {/* Current */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${agingBgColors.current}`}
              />
              <span className={`text-sm ${secondaryText}`}>Current</span>
            </div>
            <span className={`text-sm font-semibold ${agingColors.current}`}>
              {formatCurrency(agingCurrent)}
            </span>
          </div>

          {/* 1-30 days */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${agingBgColors['1-30']}`}
              />
              <span className={`text-sm ${secondaryText}`}>1-30 days</span>
            </div>
            <span className={`text-sm font-semibold ${agingColors['1-30']}`}>
              {formatCurrency(aging1To30)}
            </span>
          </div>

          {/* 31-60 days */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${agingBgColors['31-60']}`}
              />
              <span className={`text-sm ${secondaryText}`}>31-60 days</span>
            </div>
            <span className={`text-sm font-semibold ${agingColors['31-60']}`}>
              {formatCurrency(aging31To60)}
            </span>
          </div>

          {/* 61-90 days */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${agingBgColors['61-90']}`}
              />
              <span className={`text-sm ${secondaryText}`}>61-90 days</span>
            </div>
            <span className={`text-sm font-semibold ${agingColors['61-90']}`}>
              {formatCurrency(aging61To90)}
            </span>
          </div>

          {/* 90+ days */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${agingBgColors['90+']}`} />
              <span className={`text-sm ${secondaryText}`}>90+ days</span>
            </div>
            <span className={`text-sm font-semibold ${agingColors['90+']}`}>
              {formatCurrency(aging90Plus)}
            </span>
          </div>

          {/* Overdue Warning */}
          {aging90Plus > 0 && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                isDarkMode
                  ? 'bg-red-900/20 border border-red-800'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className="text-xs text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Customer has invoices over 90 days old
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
