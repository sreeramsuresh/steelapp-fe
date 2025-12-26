/**
 * LazyBarChart.jsx
 * Lazy-loadable wrapper for recharts BarChart
 * Import this component with React.lazy() to defer recharts loading
 */
import PropTypes from "prop-types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../contexts/ThemeContext";

const LazyBarChart = ({
  data,
  bars,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = "horizontal",
}) => {
  const { isDarkMode } = useTheme();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkMode ? "#374151" : "#E5E7EB"}
          />
        )}
        <XAxis
          dataKey={layout === "horizontal" ? xAxisKey : undefined}
          type={layout === "horizontal" ? "category" : "number"}
          stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
          style={{ fontSize: "12px" }}
        />
        <YAxis
          dataKey={layout === "vertical" ? xAxisKey : undefined}
          type={layout === "vertical" ? "category" : "number"}
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
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey || index}
            dataKey={bar.dataKey}
            fill={bar.color}
            name={bar.name || bar.dataKey}
            radius={bar.radius || [4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

LazyBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  bars: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      name: PropTypes.string,
      radius: PropTypes.array,
    })
  ).isRequired,
  xAxisKey: PropTypes.string,
  height: PropTypes.number,
  showGrid: PropTypes.bool,
  showLegend: PropTypes.bool,
  layout: PropTypes.oneOf(["horizontal", "vertical"]),
};

export default LazyBarChart;
