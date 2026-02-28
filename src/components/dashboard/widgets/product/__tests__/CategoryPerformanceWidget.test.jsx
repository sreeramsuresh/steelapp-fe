import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CategoryPerformanceWidget from '../CategoryPerformanceWidget';

describe('CategoryPerformanceWidget', () => {
  const sampleData = {
    categories: [
      { id: 1, name: 'Sheets', revenue: 5000000, growth: 12.5, color: '#14B8A6' },
      { id: 2, name: 'Coils', revenue: 3500000, growth: -5.2, color: '#3B82F6' },
      { id: 3, name: 'Pipes', revenue: 2000000, growth: 8.1, color: '#F59E0B' },
    ],
  };

  it('renders without crashing', () => {
    render(<CategoryPerformanceWidget data={sampleData} />);
  });

  it('displays category names', () => {
    render(<CategoryPerformanceWidget data={sampleData} />);
    expect(screen.getByText('Sheets')).toBeInTheDocument();
    expect(screen.getByText('Coils')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<CategoryPerformanceWidget data={null} />);
    // Should show no data state with title
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
  });

  it('renders empty state when empty categories', () => {
    render(<CategoryPerformanceWidget data={{ categories: [] }} />);
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
  });
});
