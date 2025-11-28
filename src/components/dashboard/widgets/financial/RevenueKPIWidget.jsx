import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import BaseWidget, { MetricValue } from '../BaseWidget';

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
  totalRevenue = 0,
  revenueChange = 0,
  loading = false,
  onRefresh,
  formatCurrency = (val) => `AED ${val.toLocaleString()}`,
}) => {
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
          value={formatCurrency(totalRevenue)}
          size="md"
        />
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            revenueChange >= 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {revenueChange >= 0 ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownRight size={16} />
          )}
          <span>{Math.abs(revenueChange).toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">vs previous month</p>
    </BaseWidget>
  );
};

export default RevenueKPIWidget;
