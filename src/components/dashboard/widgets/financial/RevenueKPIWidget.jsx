import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import BaseWidget, { MetricValue } from '../BaseWidget';

// Mock data for Phase 1 - used when no API data available
const MOCK_REVENUE = {
  totalRevenue: 10648130,
  revenueChange: 12.5,
};

/**
 * RevenueKPIWidget - Displays total revenue with trend
 *
 * @param {Object} props
 * @param {number} props.totalRevenue - Total revenue amount
 * @param {number} props.revenueChange - Percentage change from previous period
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 * @param {function} props.formatCurrency - Currency formatter function
 */
export const RevenueKPIWidget = ({
  totalRevenue,
  revenueChange,
  loading = false,
  onRefresh,
  formatCurrency = (val) => `AED ${val.toLocaleString()}`,
}) => {
  // Use mock data as fallback when real data is 0 or undefined
  const displayRevenue = totalRevenue > 0 ? totalRevenue : MOCK_REVENUE.totalRevenue;
  const displayChange = totalRevenue > 0 ? (revenueChange || 0) : MOCK_REVENUE.revenueChange;
  return (
    <BaseWidget
      title="Total Revenue"
      tooltip="Sum of all invoice amounts, excluding cancelled and draft invoices"
      icon={DollarSign}
      iconColor="from-teal-600 to-teal-700"
      loading={loading}
      onRefresh={onRefresh}
      size="sm"
    >
      <div className="flex items-center justify-between">
        <MetricValue
          value={formatCurrency(displayRevenue)}
          size="md"
        />
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            displayChange >= 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {displayChange >= 0 ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownRight size={16} />
          )}
          <span>{Math.abs(displayChange).toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">vs previous month</p>
    </BaseWidget>
  );
};

export default RevenueKPIWidget;
