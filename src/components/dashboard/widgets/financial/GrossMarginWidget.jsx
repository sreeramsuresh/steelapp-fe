import { Percent } from "lucide-react";
import { GaugeChartWrapper } from "../../charts";
import BaseWidget, { MetricValue } from "../BaseWidget";

// Mock data for Phase 1 - used when no API data available
const MOCK_GROSS_MARGIN = 18.5;

/**
 * GrossMarginWidget - Displays gross margin percentage
 *
 * @param {Object} props
 * @param {number} props.grossMargin - Gross margin percentage
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 * @param {boolean} props.showGauge - Show gauge chart instead of simple metric
 */
const GrossMarginWidget = ({ grossMargin, loading = false, onRefresh, showGauge = false, isDarkMode = false }) => {
  // Use mock data as fallback when real data is 0 or undefined
  const displayMargin = grossMargin && grossMargin > 0 ? grossMargin : MOCK_GROSS_MARGIN;

  return (
    <BaseWidget
      title="Gross Margin"
      tooltip="Percentage of revenue remaining after deducting cost of goods sold"
      icon={Percent}
      iconColor="from-blue-500 to-blue-600"
      loading={loading}
      onRefresh={onRefresh}
      size={showGauge ? "md" : "sm"}
    >
      {showGauge ? (
        <GaugeChartWrapper
          value={displayMargin}
          min={0}
          max={100}
          isDarkMode={isDarkMode}
          height={180}
          thresholds={{ warning: 20, danger: 10 }}
          formatValue={(val) => `${val.toFixed(1)}%`}
        />
      ) : (
        <>
          <MetricValue value={`${displayMargin.toFixed(1)}%`} label="Weighted average across all sales" size="md" />
        </>
      )}
    </BaseWidget>
  );
};

export default GrossMarginWidget;
