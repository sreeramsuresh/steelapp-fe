import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import RevenueAnalyticsWidget from '../RevenueAnalyticsWidget';

describe('RevenueAnalyticsWidget', () => {
  const sampleData = {
    byCategory: [
      { name: 'Sheets', value: 500000, percentage: 50, color: '#14B8A6' },
      { name: 'Coils', value: 300000, percentage: 30, color: '#3B82F6' },
      { name: 'Pipes', value: 200000, percentage: 20, color: '#F59E0B' },
    ],
    bySegment: [
      { name: 'Enterprise', value: 600000, percentage: 60 },
      { name: 'SMB', value: 400000, percentage: 40 },
    ],
    byPeriod: [],
    total: 1000000,
  };

  it('renders without crashing', () => {
    render(<RevenueAnalyticsWidget />);
  });

  it('displays the widget title', () => {
    render(<RevenueAnalyticsWidget />);
    expect(screen.getByText('Revenue Analytics')).toBeInTheDocument();
  });

  it('shows no data message when no data provided', () => {
    render(<RevenueAnalyticsWidget />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('displays category data when provided', () => {
    render(<RevenueAnalyticsWidget data={sampleData} />);
    expect(screen.getByText('Sheets')).toBeInTheDocument();
    expect(screen.getByText('Coils')).toBeInTheDocument();
  });

  it('shows view type selector buttons', () => {
    render(<RevenueAnalyticsWidget data={sampleData} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Segment')).toBeInTheDocument();
    expect(screen.getByText('Period')).toBeInTheDocument();
  });

  it('shows total revenue in footer', () => {
    render(<RevenueAnalyticsWidget data={sampleData} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
});
