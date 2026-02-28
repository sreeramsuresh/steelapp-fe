import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import FinancialKPICards from '../FinancialKPICards';

describe('FinancialKPICards', () => {
  it('renders without crashing', () => {
    render(<FinancialKPICards />);
  });

  it('displays the header title', () => {
    render(<FinancialKPICards />);
    expect(screen.getByText('Financial KPIs')).toBeInTheDocument();
  });

  it('displays all six KPI cards', () => {
    render(<FinancialKPICards />);
    expect(screen.getByText('Gross Margin')).toBeInTheDocument();
    expect(screen.getByText('Net Margin')).toBeInTheDocument();
    expect(screen.getByText('DSO')).toBeInTheDocument();
    expect(screen.getByText('DPO')).toBeInTheDocument();
    expect(screen.getByText('Current Ratio')).toBeInTheDocument();
    expect(screen.getByText('Quick Ratio')).toBeInTheDocument();
  });

  it('shows target legend in footer', () => {
    render(<FinancialKPICards />);
    expect(screen.getByText('On Target')).toBeInTheDocument();
    expect(screen.getByText('Near Target')).toBeInTheDocument();
    expect(screen.getByText('Below Target')).toBeInTheDocument();
  });

  it('renders with custom data', () => {
    const customData = {
      grossMargin: { value: 35, target: 30, trend: 5, unit: '%' },
      netMargin: { value: 22, target: 20, trend: 2, unit: '%' },
      dso: { value: 25, target: 30, trend: -3, unit: ' days' },
      dpo: { value: 50, target: 45, trend: 5, unit: ' days' },
      currentRatio: { value: 2.5, target: 2.0, trend: 0.5, unit: '' },
      quickRatio: { value: 1.8, target: 1.5, trend: 0.3, unit: '' },
    };
    render(<FinancialKPICards data={customData} />);
    expect(screen.getByText('Financial KPIs')).toBeInTheDocument();
  });
});
