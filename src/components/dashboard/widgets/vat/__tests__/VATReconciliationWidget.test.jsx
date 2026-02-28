import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import VATReconciliationWidget from '../VATReconciliationWidget';

describe('VATReconciliationWidget', () => {
  it('renders without crashing', () => {
    render(<VATReconciliationWidget />);
  });

  it('renders with no data', () => {
    const { container } = render(<VATReconciliationWidget data={null} />);
    expect(container).toBeTruthy();
  });

  it('renders with custom data', () => {
    const data = {
      summary: {
        salesRegisterTotal: 5000000,
        outputVATTotal: 250000,
        purchaseRegisterTotal: 3500000,
        inputVATTotal: 175000,
        discrepancies: 2,
        status: 'needs_review',
      },
      discrepancyDetails: [
        { id: 1, type: 'sales', amount: 5000, description: 'Rounding difference' },
      ],
    };
    render(<VATReconciliationWidget data={data} />);
    const { container } = render(<VATReconciliationWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it('renders with onRefresh callback', () => {
    const onRefresh = vi.fn();
    const { container } = render(<VATReconciliationWidget onRefresh={onRefresh} />);
    expect(container).toBeTruthy();
  });
});
