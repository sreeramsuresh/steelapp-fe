
import { Clock } from 'lucide-react';
import BaseWidget, { MetricValue } from '../BaseWidget';

// Mock data for Phase 1 - used when no API data available
const MOCK_DSO = 42;

/**
 * DSOWidget - Days Sales Outstanding
 *
 * @param {Object} props
 * @param {number} props.dso - DSO in days
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 */
export const DSOWidget = ({
  dso,
  loading = false,
  onRefresh,
}) => {
  // Use mock data as fallback when real data is 0 or undefined
  const displayDso = (dso && dso > 0) ? dso : MOCK_DSO;
  // Determine status color based on DSO value
  const getStatusColor = () => {
    if (displayDso <= 30) return 'from-green-500 to-green-600';
    if (displayDso <= 45) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <BaseWidget
      title="DSO"
      tooltip="Days Sales Outstanding - average days to collect payment"
      icon={Clock}
      iconColor={getStatusColor()}
      loading={loading}
      onRefresh={onRefresh}
      size="sm"
    >
      <MetricValue
        value={`${displayDso.toFixed(0)} days`}
        label="Average time to collect payment"
        size="md"
      />
    </BaseWidget>
  );
};

export default DSOWidget;
