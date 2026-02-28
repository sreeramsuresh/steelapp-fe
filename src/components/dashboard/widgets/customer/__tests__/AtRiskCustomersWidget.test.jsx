import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import AtRiskCustomersWidget from '../AtRiskCustomersWidget';

describe('AtRiskCustomersWidget', () => {
  it('renders without crashing', () => {
    render(<AtRiskCustomersWidget />);
  });

  it('displays the widget title', () => {
    render(<AtRiskCustomersWidget />);
    expect(screen.getAllByText('At-Risk Customers').length).toBeGreaterThan(0);
  });

  it('displays summary with total at-risk count', () => {
    render(<AtRiskCustomersWidget />);
    expect(screen.getByText(/12 Customers at Risk/)).toBeInTheDocument();
  });

  it('displays risk factor badges', () => {
    render(<AtRiskCustomersWidget />);
    expect(screen.getByText('Declining Orders')).toBeInTheDocument();
    expect(screen.getByText('Payment Delays')).toBeInTheDocument();
  });

  it('shows customer list from mock data', () => {
    render(<AtRiskCustomersWidget />);
    expect(screen.getByText('Sharjah Metal Works')).toBeInTheDocument();
    expect(screen.getByText('Al Ain Steel Traders')).toBeInTheDocument();
  });

  it('expands customer details on click', () => {
    render(<AtRiskCustomersWidget />);
    fireEvent.click(screen.getByText('Sharjah Metal Works'));
    expect(screen.getByText('Recommended Action:')).toBeInTheDocument();
    expect(screen.getByText('Schedule urgent call')).toBeInTheDocument();
  });

  it('shows view all button when onViewDetails is provided', () => {
    const onViewDetails = vi.fn();
    render(<AtRiskCustomersWidget onViewDetails={onViewDetails} />);
    expect(screen.getByText('View All At-Risk Customers')).toBeInTheDocument();
  });
});
