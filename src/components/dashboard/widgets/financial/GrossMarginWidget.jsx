import React from 'react';
import { Percent } from 'lucide-react';
import BaseWidget, { MetricValue } from '../BaseWidget';
import { GaugeChartWrapper } from '../../charts';

/**
 * GrossMarginWidget - Displays gross margin percentage
 *
 * @param {Object} props
 * @param {number} props.grossMargin - Gross margin percentage
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 * @param {boolean} props.showGauge - Show gauge chart instead of simple metric
 */
export const GrossMarginWidget = ({
  grossMargin = 0,
  loading = false,
  onRefresh,
  showGauge = false,
  isDarkMode = false,
}) => {
  return (
    <BaseWidget
      title="Gross Margin"
      tooltip="Percentage of revenue remaining after deducting cost of goods sold"
      icon={Percent}
      iconColor="from-blue-500 to-blue-600"
      loading={loading}
      onRefresh={onRefresh}
      size={showGauge ? 'md' : 'sm'}
    >
      {showGauge ? (
        <GaugeChartWrapper
          value={grossMargin}
          min={0}
          max={100}
          isDarkMode={isDarkMode}
          height={180}
          thresholds={{ warning: 20, danger: 10 }}
          formatValue={(val) => `${val.toFixed(1)}%`}
        />
      ) : (
        <>
          <MetricValue
            value={`${grossMargin.toFixed(1)}%`}
            label="Weighted average across all sales"
            size="md"
          />
        </>
      )}
    </BaseWidget>
  );
};

export default GrossMarginWidget;
