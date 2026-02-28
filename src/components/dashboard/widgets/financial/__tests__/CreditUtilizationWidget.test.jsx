import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CreditUtilizationWidget from '../CreditUtilizationWidget';

describe('CreditUtilizationWidget', () => {
  it('renders without crashing', () => {
    render(<CreditUtilizationWidget />);
  });

  it('displays the widget title', () => {
    render(<CreditUtilizationWidget />);
    expect(screen.getByText('Credit Utilization')).toBeInTheDocument();
  });

  it('shows fallback utilization when no data provided', () => {
    render(<CreditUtilizationWidget />);
    expect(screen.getByText('65.5%')).toBeInTheDocument();
  });

  it('shows custom utilization value', () => {
    render(<CreditUtilizationWidget creditUtilization={42.3} />);
    expect(screen.getByText('42.3%')).toBeInTheDocument();
  });

  it('displays description label', () => {
    render(<CreditUtilizationWidget />);
    expect(screen.getByText('Outstanding vs credit limits')).toBeInTheDocument();
  });
});
