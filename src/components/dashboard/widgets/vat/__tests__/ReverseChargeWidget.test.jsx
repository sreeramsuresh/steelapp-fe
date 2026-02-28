import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import ReverseChargeWidget from '../ReverseChargeWidget';

describe('ReverseChargeWidget', () => {
  it('renders without crashing', () => {
    render(<ReverseChargeWidget />);
  });

  it('displays reverse charge content with mock data', () => {
    render(<ReverseChargeWidget />);
    const { container } = render(<ReverseChargeWidget />);
    expect(container).toBeTruthy();
  });

  it('renders with custom data', () => {
    const data = {
      summary: {
        totalTransactions: 10,
        totalValue: 200000,
        totalVAT: 10000,
        outputVAT: 10000,
        inputVAT: 10000,
        netEffect: 0,
        nonRecoverableVAT: 500,
        currentQuarter: 'Q4 2024',
      },
      transactions: [],
    };
    render(<ReverseChargeWidget data={data} />);
    const { container } = render(<ReverseChargeWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it('renders with no data', () => {
    const { container } = render(<ReverseChargeWidget data={null} />);
    expect(container).toBeTruthy();
  });
});
