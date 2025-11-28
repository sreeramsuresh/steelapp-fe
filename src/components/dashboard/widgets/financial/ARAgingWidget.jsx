import React from 'react';
import { Clock } from 'lucide-react';
import BaseWidget from '../BaseWidget';
import { useTheme } from '../../../../contexts/ThemeContext';

/**
 * ARAgingWidget - Accounts Receivable Aging Buckets
 *
 * @param {Object} props
 * @param {Object} props.data - AR aging data
 * @param {Array} props.data.buckets - Array of { label, amount, percentage }
 * @param {number} props.data.total_ar - Total AR amount
 * @param {number} props.data.overdue_ar - Overdue AR amount
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 * @param {function} props.formatCurrency - Currency formatter
 */
export const ARAgingWidget = ({
  data,
  loading = false,
  onRefresh,
  formatCurrency = (val) => `AED ${val?.toLocaleString() || 0}`,
}) => {
  const { isDarkMode } = useTheme();

  const bucketColors = [
    { bg: 'bg-green-500', text: 'text-green-600' },
    { bg: 'bg-yellow-500', text: 'text-yellow-600' },
    { bg: 'bg-orange-500', text: 'text-orange-600' },
    { bg: 'bg-red-500', text: 'text-red-600' },
  ];

  const hasData = data && data.buckets && data.buckets.length > 0;

  return (
    <BaseWidget
      title="AR Aging"
      tooltip="Receivables grouped by days overdue"
      icon={Clock}
      iconColor="from-blue-500 to-blue-600"
      loading={loading}
      onRefresh={onRefresh}
      size="md"
    >
      {hasData ? (
        <>
          <div className="space-y-3">
            {data.buckets.map((bucket, index) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <div className="w-24 sm:w-32">
                  <span
                    className={`text-xs sm:text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {bucket.label}
                  </span>
                </div>
                <div className="flex-1">
                  <div
                    className={`h-4 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`h-full ${bucketColors[index]?.bg || 'bg-gray-500'} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(parseFloat(bucket.percentage) || 0, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 sm:w-28 text-right">
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(bucket.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`mt-4 pt-4 border-t flex justify-between ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div>
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Total AR
              </span>
              <p
                className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {formatCurrency(data.total_ar)}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Overdue
              </span>
              <p className="text-lg font-bold text-red-500">
                {formatCurrency(data.overdue_ar)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock
            size={32}
            className={`mb-3 opacity-50 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <p
            className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            No receivables data available
          </p>
        </div>
      )}
    </BaseWidget>
  );
};

export default ARAgingWidget;
