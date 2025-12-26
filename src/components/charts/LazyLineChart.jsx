/**
 * LazyLineChart.jsx
 * Lazy-loadable wrapper for recharts LineChart
 * Import this component with React.lazy() to defer recharts loading
 */
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../contexts/ThemeContext";

const LazyLineChart = ({
  data,
  lines,
  xAxisKey = "date",
  height = 300,
  showGrid = true,
  showLegend = true,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkMode ? "#374151" : "#E5E7EB"}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
          style={{ fontSize: "12px" }}
        />
        <YAxis
          stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
          style={{ fontSize: "12px" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
            border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
            borderRadius: "8px",
          }}
          labelStyle={{ color: isDarkMode ? "#F3F4F6" : "#111827" }}
        />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey || index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            dot={line.dot !== false ? { fill: line.color, r: 4 } : false}
            name={line.name || line.dataKey}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

LazyLineChart.propTypes = {
  data: PropTypes.array.isRequired,
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      name: PropTypes.string,
      strokeWidth: PropTypes.number,
      dot: PropTypes.bool,
    })
  ).isRequired,
  xAxisKey: PropTypes.string,
  height: PropTypes.number,
  showGrid: PropTypes.bool,
  showLegend: PropTypes.bool,
};

export default LazyLineChart;
