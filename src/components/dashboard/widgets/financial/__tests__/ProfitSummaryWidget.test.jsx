import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import ProfitSummaryWidget from '../ProfitSummaryWidget';

describe('ProfitSummaryWidget', () => {
  it('renders without crashing', () => {
    render(<ProfitSummaryWidget />);
  });

  it('displays the widget title', () => {
    render(<ProfitSummaryWidget />);
    expect(screen.getByText('Profit Summary')).toBeInTheDocument();
  });

  it('shows no data message when no data provided', () => {
    render(<ProfitSummaryWidget />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('displays waterfall items when data is provided', () => {
    const data = {
      revenue: 1000000,
      cogs: 700000,
      grossProfit: 300000,
      operatingExpenses: 100000,
      netProfit: 200000,
      grossMarginPercent: 30,
      netMarginPercent: 20,
      previousPeriod: { revenue: 900000, netProfit: 180000 },
    };
    render(<ProfitSummaryWidget data={data} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('COGS')).toBeInTheDocument();
    expect(screen.getByText('Gross Profit')).toBeInTheDocument();
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
  });

  it('shows margin percentages', () => {
    const data = {
      revenue: 1000000,
      cogs: 700000,
      grossProfit: 300000,
      operatingExpenses: 100000,
      netProfit: 200000,
      grossMarginPercent: 30,
      netMarginPercent: 20,
    };
    render(<ProfitSummaryWidget data={data} />);
    expect(screen.getByText('Gross Margin')).toBeInTheDocument();
    expect(screen.getByText('Net Margin')).toBeInTheDocument();
  });
});
