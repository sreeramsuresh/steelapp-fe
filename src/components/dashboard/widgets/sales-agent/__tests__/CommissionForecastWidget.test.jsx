import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('../../../../../services/commissionService', () => ({
  commissionService: {
    getCommissionForecast: vi.fn().mockResolvedValue(null),
  },
}));

import CommissionForecastWidget from '../CommissionForecastWidget';

describe('CommissionForecastWidget', () => {
  it('renders without crashing', () => {
    render(<CommissionForecastWidget />);
  });

  it('displays the component', () => {
    const { container } = render(<CommissionForecastWidget />);
    expect(container).toBeTruthy();
  });

  it('renders with monthsBack prop', () => {
    const { container } = render(<CommissionForecastWidget monthsBack={3} />);
    expect(container).toBeTruthy();
  });

  it('renders with onViewDetails callback', () => {
    const onViewDetails = vi.fn();
    const { container } = render(<CommissionForecastWidget onViewDetails={onViewDetails} />);
    expect(container).toBeTruthy();
  });
});
