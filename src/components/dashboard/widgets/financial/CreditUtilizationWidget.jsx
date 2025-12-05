import { CreditCard } from 'lucide-react';
import BaseWidget, { MetricValue } from '../BaseWidget';
import { useTheme } from '../../../../contexts/ThemeContext';

// Mock data for Phase 1 - used when no API data available
const MOCK_CREDIT_UTILIZATION = 65.5;

/**
 * CreditUtilizationWidget - Credit utilization percentage
 *
 * @param {Object} props
 * @param {number} props.creditUtilization - Credit utilization percentage
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 */
export const CreditUtilizationWidget = ({
  creditUtilization,
  loading = false,
  onRefresh,
}) => {
  const { isDarkMode } = useTheme();

  // Use mock data as fallback when real data is 0 or undefined
  const displayUtilization = (creditUtilization && creditUtilization > 0) ? creditUtilization : MOCK_CREDIT_UTILIZATION;

  // Determine status based on utilization
  const getStatusColor = () => {
    if (displayUtilization <= 60) return 'from-green-500 to-green-600';
    if (displayUtilization <= 80) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getBarColor = () => {
    if (displayUtilization <= 60) return 'bg-green-500';
    if (displayUtilization <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <BaseWidget
      title="Credit Utilization"
      tooltip="Percentage of customer credit limits currently being used"
      icon={CreditCard}
      iconColor={getStatusColor()}
      loading={loading}
      onRefresh={onRefresh}
      size="sm"
    >
      <MetricValue
        value={`${displayUtilization.toFixed(1)}%`}
        label="Outstanding vs credit limits"
        size="md"
      />
      {/* Progress bar */}
      <div className="mt-3">
        <div
          className={`h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <div
            className={`h-full ${getBarColor()} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(displayUtilization, 100)}%` }}
          />
        </div>
      </div>
    </BaseWidget>
  );
};

export default CreditUtilizationWidget;
