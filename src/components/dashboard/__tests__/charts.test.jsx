/**
 * Chart Wrappers Tests
 * Tests RechartsWrapper and EChartsWrapper components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeContext } from '../../../contexts/ThemeContext';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  RadarChart: ({ children }) => <div data-testid="radar-chart">{children}</div>,
  Bar: () => null,
  Line: () => null,
  Area: () => null,
  Pie: () => null,
  Radar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
}));

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  default: ({ option }) => <div data-testid="echarts" data-option={JSON.stringify(option)} />,
}));

import {
  BarChartWrapper,
  LineChartWrapper,
  AreaChartWrapper,
  PieChartWrapper,
} from '../charts/RechartsWrapper';

import {
  GaugeChartWrapper,
  TreemapChartWrapper,
  FunnelChartWrapper,
} from '../charts/EChartsWrapper';

const renderWithTheme = (component, isDarkMode = false) => {
  return render(
    <ThemeContext.Provider value={{ isDarkMode }}>
      {component}
    </ThemeContext.Provider>,
  );
};

const mockBarData = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 200 },
  { name: 'Mar', value: 150 },
];

const mockPieData = [
  { name: 'A', value: 30 },
  { name: 'B', value: 50 },
  { name: 'C', value: 20 },
];

describe('RechartsWrapper', () => {
  describe('BarChartWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(<BarChartWrapper data={mockBarData} dataKey="value" />);
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });

    it('handles empty data', () => {
      renderWithTheme(<BarChartWrapper data={[]} dataKey="value" />);
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });

    it('renders in dark mode', () => {
      renderWithTheme(<BarChartWrapper data={mockBarData} dataKey="value" />, true);
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });
  });

  describe('LineChartWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(<LineChartWrapper data={mockBarData} dataKey="value" />);
      expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
    });

    it('handles undefined data', () => {
      renderWithTheme(<LineChartWrapper data={undefined} dataKey="value" />);
      expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
    });
  });

  describe('AreaChartWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(<AreaChartWrapper data={mockBarData} dataKey="value" />);
      expect(screen.getAllByTestId('area-chart').length).toBeGreaterThan(0);
    });
  });

  describe('PieChartWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(<PieChartWrapper data={mockPieData} dataKey="value" />);
      expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    });

    it('handles empty data', () => {
      renderWithTheme(<PieChartWrapper data={[]} dataKey="value" />);
      expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    });
  });
});

describe('EChartsWrapper', () => {
  describe('GaugeChartWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(<GaugeChartWrapper value={75} />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });

    it('handles zero value', () => {
      renderWithTheme(<GaugeChartWrapper value={0} />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });

    it('renders in dark mode', () => {
      renderWithTheme(<GaugeChartWrapper value={50} />, true);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });
  });

  describe('TreemapChartWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(<TreemapChartWrapper data={mockPieData} />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });

    it('handles empty data', () => {
      renderWithTheme(<TreemapChartWrapper data={[]} />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });
  });

  describe('FunnelChartWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(<FunnelChartWrapper data={mockPieData} />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });
  });
});
