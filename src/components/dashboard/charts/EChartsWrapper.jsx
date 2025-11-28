import React, { useEffect, useRef } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import {
  GaugeChart,
  TreemapChart,
  FunnelChart,
  HeatmapChart,
  BarChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register ECharts components
echarts.use([
  GaugeChart,
  TreemapChart,
  FunnelChart,
  HeatmapChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

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

  // Chart colors
  primary: '#14B8A6',
  secondary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',

  // Gradient colors for gauges
  gaugeGradient: [
    [0.3, '#22C55E'],
    [0.7, '#F59E0B'],
    [1, '#EF4444'],
  ],

  // Color palette
  palette: [
    '#14B8A6',
    '#3B82F6',
    '#22C55E',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#6366F1',
    '#06B6D4',
    '#84CC16',
  ],
});

// ============================================================================
// BASE ECHARTS WRAPPER
// ============================================================================

export const EChartsWrapper = ({
  option,
  isDarkMode = false,
  height = 300,
  showToolbox = false,
  onEvents,
  style,
}) => {
  const chartRef = useRef(null);
  const colors = getThemeColors(isDarkMode);

  // Merge theme into option
  const themedOption = {
    ...option,
    backgroundColor: 'transparent',
    textStyle: {
      color: colors.textPrimary,
      fontFamily: 'Inter, system-ui, sans-serif',
      ...option.textStyle,
    },
    ...(showToolbox && {
      toolbox: {
        show: true,
        orient: 'horizontal',
        right: 10,
        top: 10,
        feature: {
          saveAsImage: {
            title: 'Save',
            pixelRatio: 2,
          },
          dataView: {
            show: true,
            title: 'Data',
            readOnly: true,
            lang: ['Data View', 'Close', 'Refresh'],
          },
        },
        iconStyle: {
          borderColor: colors.textSecondary,
        },
        emphasis: {
          iconStyle: {
            borderColor: colors.primary,
          },
        },
        ...option.toolbox,
      },
    }),
  };

  return (
    <ReactEChartsCore
      ref={chartRef}
      echarts={echarts}
      option={themedOption}
      style={{ height, width: '100%', ...style }}
      opts={{ renderer: 'canvas' }}
      onEvents={onEvents}
      notMerge={true}
    />
  );
};

// ============================================================================
// GAUGE CHART WRAPPER
// ============================================================================

export const GaugeChartWrapper = ({
  value,
  min = 0,
  max = 100,
  title = '',
  isDarkMode = false,
  height = 250,
  showProgress = true,
  colorStops,
  formatValue,
  thresholds, // { warning: 60, danger: 80 }
}) => {
  const colors = getThemeColors(isDarkMode);

  // Determine color based on thresholds
  const getGaugeColor = () => {
    if (!thresholds) return colors.primary;
    if (value >= thresholds.danger) return colors.error;
    if (value >= thresholds.warning) return colors.warning;
    return colors.success;
  };

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min,
        max,
        splitNumber: 5,
        progress: {
          show: showProgress,
          roundCap: true,
          width: 12,
        },
        pointer: {
          show: true,
          length: '60%',
          width: 4,
          itemStyle: {
            color: colors.textSecondary,
          },
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 12,
            color: colorStops || [
              [0.3, colors.success],
              [0.7, colors.warning],
              [1, colors.error],
            ],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: true,
          length: 8,
          lineStyle: {
            width: 2,
            color: colors.textMuted,
          },
        },
        axisLabel: {
          distance: 20,
          color: colors.textSecondary,
          fontSize: 10,
          formatter: formatValue || ((val) => Math.round(val)),
        },
        title: {
          show: !!title,
          offsetCenter: [0, '70%'],
          color: colors.textSecondary,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '35%'],
          fontSize: 24,
          fontWeight: 'bold',
          formatter: formatValue || '{value}',
          color: getGaugeColor(),
        },
        data: [
          {
            value,
            name: title,
          },
        ],
      },
    ],
  };

  return <EChartsWrapper option={option} isDarkMode={isDarkMode} height={height} />;
};

// ============================================================================
// TREEMAP CHART WRAPPER
// ============================================================================

export const TreemapChartWrapper = ({
  data, // Array of { name, value, children? }
  isDarkMode = false,
  height = 400,
  showToolbox = false,
  formatter,
  showBreadcrumb = true,
}) => {
  const colors = getThemeColors(isDarkMode);

  const option = {
    tooltip: {
      formatter: formatter || ((info) => {
        const { name, value } = info;
        return `${name}: ${typeof value === 'number' ? value.toLocaleString() : value}`;
      }),
      backgroundColor: colors.background,
      borderColor: colors.grid,
      textStyle: {
        color: colors.textPrimary,
      },
    },
    series: [
      {
        type: 'treemap',
        data,
        roam: false,
        nodeClick: 'zoomToNode',
        breadcrumb: {
          show: showBreadcrumb,
          left: 'center',
          itemStyle: {
            color: colors.cardBackground,
            borderColor: colors.grid,
            textStyle: {
              color: colors.textPrimary,
            },
          },
        },
        label: {
          show: true,
          formatter: '{b}',
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowBlur: 2,
        },
        itemStyle: {
          borderColor: colors.background,
          borderWidth: 2,
          gapWidth: 2,
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 3,
              borderColor: colors.grid,
              gapWidth: 3,
            },
          },
          {
            colorSaturation: [0.3, 0.6],
            itemStyle: {
              borderWidth: 1,
              gapWidth: 1,
            },
          },
        ],
        color: colors.palette,
      },
    ],
  };

  return (
    <EChartsWrapper
      option={option}
      isDarkMode={isDarkMode}
      height={height}
      showToolbox={showToolbox}
    />
  );
};

// ============================================================================
// WATERFALL CHART WRAPPER
// ============================================================================

export const WaterfallChartWrapper = ({
  data, // Array of { name, value, isTotal? }
  isDarkMode = false,
  height = 400,
  showToolbox = false,
  formatter,
}) => {
  const colors = getThemeColors(isDarkMode);

  // Process data for waterfall effect
  const processedData = [];
  let cumulative = 0;

  data.forEach((item, index) => {
    if (item.isTotal) {
      processedData.push({
        name: item.name,
        value: cumulative,
        itemStyle: { color: colors.primary },
      });
    } else {
      const start = cumulative;
      cumulative += item.value;
      processedData.push({
        name: item.name,
        value: [start, cumulative],
        itemStyle: {
          color: item.value >= 0 ? colors.success : colors.error,
        },
      });
    }
  });

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: colors.background,
      borderColor: colors.grid,
      textStyle: {
        color: colors.textPrimary,
      },
      formatter: formatter || ((params) => {
        const param = params[0];
        const value = Array.isArray(param.value)
          ? param.value[1] - param.value[0]
          : param.value;
        return `${param.name}: ${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
      }),
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLine: { lineStyle: { color: colors.grid } },
      axisLabel: { color: colors.textSecondary, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: colors.grid } },
      axisLabel: {
        color: colors.textSecondary,
        formatter: formatter || ((val) => val.toLocaleString()),
      },
      splitLine: { lineStyle: { color: colors.grid, type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        stack: 'total',
        silent: true,
        itemStyle: {
          color: 'transparent',
        },
        data: processedData.map((d) => (Array.isArray(d.value) ? d.value[0] : 0)),
      },
      {
        type: 'bar',
        stack: 'total',
        data: processedData.map((d) => ({
          value: Array.isArray(d.value) ? d.value[1] - d.value[0] : d.value,
          itemStyle: d.itemStyle,
        })),
        label: {
          show: true,
          position: 'top',
          color: colors.textPrimary,
          fontSize: 11,
          formatter: (params) => {
            const val = params.value;
            return val >= 0 ? `+${val.toLocaleString()}` : val.toLocaleString();
          },
        },
      },
    ],
  };

  return (
    <EChartsWrapper
      option={option}
      isDarkMode={isDarkMode}
      height={height}
      showToolbox={showToolbox}
    />
  );
};

// ============================================================================
// FUNNEL CHART WRAPPER
// ============================================================================

export const FunnelChartWrapper = ({
  data, // Array of { name, value }
  isDarkMode = false,
  height = 400,
  showToolbox = false,
  formatter,
  sort = 'descending', // 'ascending', 'descending', 'none'
}) => {
  const colors = getThemeColors(isDarkMode);

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.background,
      borderColor: colors.grid,
      textStyle: {
        color: colors.textPrimary,
      },
      formatter: formatter || ((params) => {
        return `${params.name}: ${params.value.toLocaleString()} (${params.percent}%)`;
      }),
    },
    legend: {
      show: true,
      bottom: 0,
      textStyle: {
        color: colors.textSecondary,
      },
    },
    series: [
      {
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 60,
        width: '80%',
        min: 0,
        max: Math.max(...data.map((d) => d.value)),
        minSize: '0%',
        maxSize: '100%',
        sort,
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          formatter: '{b}',
        },
        labelLine: {
          show: false,
        },
        itemStyle: {
          borderColor: colors.background,
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: item.color || colors.palette[index % colors.palette.length],
          },
        })),
      },
    ],
  };

  return (
    <EChartsWrapper
      option={option}
      isDarkMode={isDarkMode}
      height={height}
      showToolbox={showToolbox}
    />
  );
};

// ============================================================================
// HEATMAP CHART WRAPPER
// ============================================================================

export const HeatmapChartWrapper = ({
  data, // Array of [xIndex, yIndex, value]
  xAxisData, // Array of x-axis labels
  yAxisData, // Array of y-axis labels
  isDarkMode = false,
  height = 400,
  showToolbox = false,
  formatter,
  min,
  max,
}) => {
  const colors = getThemeColors(isDarkMode);

  // Calculate min/max if not provided
  const values = data.map((d) => d[2]).filter((v) => v !== null && v !== undefined);
  const minValue = min !== undefined ? min : Math.min(...values);
  const maxValue = max !== undefined ? max : Math.max(...values);

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: colors.background,
      borderColor: colors.grid,
      textStyle: {
        color: colors.textPrimary,
      },
      formatter: formatter || ((params) => {
        return `${xAxisData[params.value[0]]}, ${yAxisData[params.value[1]]}: ${params.value[2]}`;
      }),
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '10%',
      bottom: '15%',
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: colors.grid } },
      axisLabel: { color: colors.textSecondary, fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: yAxisData,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: colors.grid } },
      axisLabel: { color: colors.textSecondary, fontSize: 11 },
    },
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: isDarkMode
          ? ['#1E3A5F', '#14B8A6', '#F59E0B', '#EF4444']
          : ['#E0F2FE', '#14B8A6', '#F59E0B', '#EF4444'],
      },
      textStyle: {
        color: colors.textSecondary,
      },
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: {
          show: true,
          color: colors.textPrimary,
          fontSize: 10,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return (
    <EChartsWrapper
      option={option}
      isDarkMode={isDarkMode}
      height={height}
      showToolbox={showToolbox}
    />
  );
};

// ============================================================================
// EXPORT THEME UTILITIES
// ============================================================================

export { getThemeColors };
