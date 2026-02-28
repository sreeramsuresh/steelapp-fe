import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
  RadarChart: ({ children }) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
}));

import {
  BarChartWrapper,
  LineChartWrapper,
  AreaChartWrapper,
  PieChartWrapper,
  RadarChartWrapper,
  DonutChartWrapper,
  getThemeColors,
} from '../RechartsWrapper';

const sampleData = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 200 },
  { name: 'Mar', value: 150 },
];

describe('BarChartWrapper', () => {
  it('renders without crashing', () => {
    render(<BarChartWrapper data={sampleData} dataKey="value" />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders with multi-series data', () => {
    const multiSeries = [{ dataKey: 'value', name: 'Revenue', color: '#14B8A6' }];
    render(<BarChartWrapper data={sampleData} multiSeries={multiSeries} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});

describe('LineChartWrapper', () => {
  it('renders without crashing', () => {
    render(<LineChartWrapper data={sampleData} dataKey="value" />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with dark mode', () => {
    render(<LineChartWrapper data={sampleData} dataKey="value" isDarkMode={true} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});

describe('AreaChartWrapper', () => {
  it('renders without crashing', () => {
    render(<AreaChartWrapper data={sampleData} dataKey="value" />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});

describe('PieChartWrapper', () => {
  it('renders without crashing', () => {
    render(<PieChartWrapper data={sampleData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});

describe('RadarChartWrapper', () => {
  it('renders without crashing', () => {
    const radarData = [{ subject: 'A', value: 80 }, { subject: 'B', value: 60 }];
    render(<RadarChartWrapper data={radarData} dataKey="value" />);
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });
});

describe('DonutChartWrapper', () => {
  it('renders as a PieChart with inner radius', () => {
    render(<DonutChartWrapper data={sampleData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});

describe('getThemeColors', () => {
  it('returns theme colors for light mode', () => {
    const colors = getThemeColors(false);
    expect(colors.background).toBe('#FFFFFF');
    expect(colors.palette).toHaveLength(10);
  });

  it('returns theme colors for dark mode', () => {
    const colors = getThemeColors(true);
    expect(colors.background).toBe('#1E2328');
  });
});
