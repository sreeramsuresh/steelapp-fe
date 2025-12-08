import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const getThemeColors = (isDarkMode) => ({
  // Background colors
  background: isDarkMode ? '#1E2328' : '#FFFFFF',
  cardBackground: isDarkMode ? '#2E3B4E' : '#F5F5F5',

  // Text colors
  textPrimary: isDarkMode ? '#FFFFFF' : '#212121',
  textSecondary: isDarkMode ? '#B0BEC5' : '#757575',
  textMuted: isDarkMode ? '#78909C' : '#BDBDBD',

  // Grid and axis colors
  grid: isDarkMode ? '#37474F' : '#E0E0E0',
  axis: isDarkMode ? '#78909C' : '#9E9E9E',

  // Chart colors - consistent across themes
  primary: '#14B8A6', // Teal-500
  secondary: '#3B82F6', // Blue-500
  success: '#22C55E', // Green-500
  warning: '#F59E0B', // Amber-500
  error: '#EF4444', // Red-500
  purple: '#8B5CF6', // Purple-500
  pink: '#EC4899', // Pink-500
  indigo: '#6366F1', // Indigo-500

  // Chart color palette for multi-series
  palette: [
    '#14B8A6', // Teal
    '#3B82F6', // Blue
    '#22C55E', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ],
});

// ============================================================================
// CUSTOM TOOLTIP COMPONENT
// ============================================================================

const CustomTooltip = ({ active, payload, label, isDarkMode, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  const colors = getThemeColors(isDarkMode);

  return (
    <div
      className="rounded-lg shadow-lg border px-3 py-2"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.grid,
      }}
    >
      <p
        className="text-sm font-medium mb-1"
        style={{ color: colors.textPrimary }}
      >
        {label}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.color || colors.textSecondary }}
        >
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

// ============================================================================
// BAR CHART WRAPPER
// ============================================================================

export const BarChartWrapper = ({
  data,
  dataKey,
  xAxisKey = 'name',
  isDarkMode = false,
  height = 300,
  formatter,
  showGrid = true,
  showLegend = false,
  colors,
  layout = 'horizontal',
  stacked = false,
  barSize = 20,
  multiSeries = null, // Array of { dataKey, name, color }
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const chartColors = colors || themeColors.palette;

  return (
    <div data-testid="bar-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={themeColors.grid}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={layout === 'horizontal' ? xAxisKey : undefined}
          type={layout === 'horizontal' ? 'category' : 'number'}
          tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
          axisLine={{ stroke: themeColors.grid }}
          tickLine={{ stroke: themeColors.grid }}
        />
        <YAxis
          dataKey={layout === 'vertical' ? xAxisKey : undefined}
          type={layout === 'vertical' ? 'category' : 'number'}
          tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
          axisLine={{ stroke: themeColors.grid }}
          tickLine={{ stroke: themeColors.grid }}
          tickFormatter={formatter}
        />
        <Tooltip
          content={<CustomTooltip isDarkMode={isDarkMode} formatter={formatter} />}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: themeColors.textPrimary }}
          />
        )}
        {multiSeries ? (
          multiSeries.map((series, index) => (
            <Bar
              key={series.dataKey}
              dataKey={series.dataKey}
              name={series.name}
              fill={series.color || chartColors[index % chartColors.length]}
              stackId={stacked ? 'stack' : undefined}
              barSize={barSize}
              radius={[4, 4, 0, 0]}
            />
          ))
        ) : (
          <Bar
            dataKey={dataKey}
            fill={chartColors[0]}
            barSize={barSize}
            radius={[4, 4, 0, 0]}
          >
            {data?.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || chartColors[index % chartColors.length]}
              />
            ))}
          </Bar>
        )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// LINE CHART WRAPPER
// ============================================================================

export const LineChartWrapper = ({
  data,
  dataKey,
  xAxisKey = 'name',
  isDarkMode = false,
  height = 300,
  formatter,
  showGrid = true,
  showLegend = false,
  showDots = true,
  curved = true,
  colors,
  multiSeries = null, // Array of { dataKey, name, color }
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const chartColors = colors || themeColors.palette;

  return (
    <div data-testid="line-chart">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={themeColors.grid}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
          axisLine={{ stroke: themeColors.grid }}
          tickLine={{ stroke: themeColors.grid }}
        />
        <YAxis
          tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
          axisLine={{ stroke: themeColors.grid }}
          tickLine={{ stroke: themeColors.grid }}
          tickFormatter={formatter}
        />
        <Tooltip
          content={<CustomTooltip isDarkMode={isDarkMode} formatter={formatter} />}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: themeColors.textPrimary }}
          />
        )}
        {multiSeries ? (
          multiSeries.map((series, index) => (
            <Line
              key={series.dataKey}
              type={curved ? 'monotone' : 'linear'}
              dataKey={series.dataKey}
              name={series.name}
              stroke={series.color || chartColors[index % chartColors.length]}
              strokeWidth={2}
              dot={showDots ? { fill: series.color || chartColors[index % chartColors.length], strokeWidth: 2 } : false}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))
        ) : (
          <Line
            type={curved ? 'monotone' : 'linear'}
            dataKey={dataKey}
            stroke={chartColors[0]}
            strokeWidth={2}
            dot={showDots ? { fill: chartColors[0], strokeWidth: 2 } : false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// AREA CHART WRAPPER
// ============================================================================

export const AreaChartWrapper = ({
  data,
  dataKey,
  xAxisKey = 'name',
  isDarkMode = false,
  height = 300,
  formatter,
  showGrid = true,
  showLegend = false,
  curved = true,
  colors,
  gradient = true,
  multiSeries = null, // Array of { dataKey, name, color }
  stacked = false,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const chartColors = colors || themeColors.palette;

  return (
    <div data-testid="area-chart">
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <defs>
          {(multiSeries || [{ dataKey, color: chartColors[0] }]).map((series, index) => (
            <linearGradient
              key={`gradient-${series.dataKey}`}
              id={`gradient-${series.dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={series.color || chartColors[index % chartColors.length]}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={series.color || chartColors[index % chartColors.length]}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={themeColors.grid}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
          axisLine={{ stroke: themeColors.grid }}
          tickLine={{ stroke: themeColors.grid }}
        />
        <YAxis
          tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
          axisLine={{ stroke: themeColors.grid }}
          tickLine={{ stroke: themeColors.grid }}
          tickFormatter={formatter}
        />
        <Tooltip
          content={<CustomTooltip isDarkMode={isDarkMode} formatter={formatter} />}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: themeColors.textPrimary }}
          />
        )}
        {multiSeries ? (
          multiSeries.map((series, index) => (
            <Area
              key={series.dataKey}
              type={curved ? 'monotone' : 'linear'}
              dataKey={series.dataKey}
              name={series.name}
              stroke={series.color || chartColors[index % chartColors.length]}
              strokeWidth={2}
              fill={gradient ? `url(#gradient-${series.dataKey})` : (series.color || chartColors[index % chartColors.length])}
              fillOpacity={gradient ? 1 : 0.3}
              stackId={stacked ? 'stack' : undefined}
            />
          ))
        ) : (
          <Area
            type={curved ? 'monotone' : 'linear'}
            dataKey={dataKey}
            stroke={chartColors[0]}
            strokeWidth={2}
            fill={gradient ? `url(#gradient-${dataKey})` : chartColors[0]}
            fillOpacity={gradient ? 1 : 0.3}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// PIE CHART WRAPPER
// ============================================================================

export const PieChartWrapper = ({
  data,
  dataKey = 'value',
  nameKey = 'name',
  isDarkMode = false,
  height = 300,
  formatter,
  showLegend = true,
  colors,
  innerRadius = 0,
  outerRadius = '80%',
  showLabels = false,
  labelFormatter,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const chartColors = colors || themeColors.palette;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius: paramInnerRadius, outerRadius: paramOuterRadius, percent }) => {
    const radius = paramInnerRadius + (paramOuterRadius - paramInnerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={themeColors.textPrimary}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {labelFormatter ? labelFormatter(percent) : `${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div data-testid="pie-chart">
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          label={showLabels ? renderCustomizedLabel : false}
          labelLine={false}
        >
          {data?.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || chartColors[index % chartColors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          content={<CustomTooltip isDarkMode={isDarkMode} formatter={formatter} />}
        />
        {showLegend && (
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ color: themeColors.textPrimary }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// RADAR CHART WRAPPER
// ============================================================================

export const RadarChartWrapper = ({
  data,
  dataKey,
  angleKey = 'subject',
  isDarkMode = false,
  height = 300,
  formatter,
  showLegend = false,
  colors,
  multiSeries = null, // Array of { dataKey, name, color }
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const chartColors = colors || themeColors.palette;

  return (
    <div data-testid="radar-chart">
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
        <PolarGrid stroke={themeColors.grid} />
        <PolarAngleAxis
          dataKey={angleKey}
          tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
        />
        <PolarRadiusAxis
          tick={{ fill: themeColors.textSecondary, fontSize: 10 }}
          tickFormatter={formatter}
        />
        <Tooltip
          content={<CustomTooltip isDarkMode={isDarkMode} formatter={formatter} />}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: themeColors.textPrimary }}
          />
        )}
        {multiSeries ? (
          multiSeries.map((series, index) => (
            <Radar
              key={series.dataKey}
              name={series.name}
              dataKey={series.dataKey}
              stroke={series.color || chartColors[index % chartColors.length]}
              fill={series.color || chartColors[index % chartColors.length]}
              fillOpacity={0.3}
            />
          ))
        ) : (
          <Radar
            name={dataKey}
            dataKey={dataKey}
            stroke={chartColors[0]}
            fill={chartColors[0]}
            fillOpacity={0.3}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// DONUT CHART (Pie with inner radius)
// ============================================================================

export const DonutChartWrapper = (props) => (
  <PieChartWrapper {...props} innerRadius="60%" />
);

// ============================================================================
// EXPORT THEME UTILITIES
// ============================================================================

export { getThemeColors };
