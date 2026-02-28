import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CreditManagementWidget from '../CreditManagementWidget';

describe('CreditManagementWidget', () => {
  it('renders without crashing', () => {
    render(<CreditManagementWidget />);
  });

  it('displays the widget title', () => {
    render(<CreditManagementWidget />);
    expect(screen.getByText('Credit Management')).toBeInTheDocument();
  });

  it('shows no data message when no data provided', () => {
    render(<CreditManagementWidget />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('displays credit summary when data is provided', () => {
    const data = {
      totalCreditLimit: 5000000,
      totalCreditUsed: 3000000,
      availableCredit: 2000000,
      utilizationPercent: 60,
      trend: 5,
      atRiskAccounts: [],
    };
    render(<CreditManagementWidget data={data} />);
    expect(screen.getByText('Total Limit')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows utilization percentage', () => {
    const data = {
      totalCreditLimit: 1000000,
      totalCreditUsed: 600000,
      availableCredit: 400000,
      utilizationPercent: 60,
      trend: -2,
      atRiskAccounts: [],
    };
    render(<CreditManagementWidget data={data} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('Utilized')).toBeInTheDocument();
  });

  it('shows at-risk accounts when present', () => {
    const data = {
      totalCreditLimit: 1000000,
      totalCreditUsed: 900000,
      availableCredit: 100000,
      utilizationPercent: 90,
      trend: 10,
      atRiskAccounts: [
        { id: 1, name: 'Test Corp', riskLevel: 'high', utilization: 95, overdue: 50000 },
      ],
    };
    render(<CreditManagementWidget data={data} />);
    expect(screen.getByText('At-Risk Accounts')).toBeInTheDocument();
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
  });
});
