import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('../../../../../services/commissionService', () => ({
  commissionService: {
    getCommissionBreakdown: vi.fn().mockResolvedValue(null),
  },
}));

import CommissionTrackerWidget from '../CommissionTrackerWidget';

describe('CommissionTrackerWidget', () => {
  it('renders without crashing', () => {
    render(<CommissionTrackerWidget />);
  });

  it('displays the component', () => {
    const { container } = render(<CommissionTrackerWidget />);
    expect(container).toBeTruthy();
  });

  it('renders with agentId prop', () => {
    const { container } = render(<CommissionTrackerWidget agentId={1} />);
    expect(container).toBeTruthy();
  });

  it('renders with onViewDetails callback', () => {
    const onViewDetails = vi.fn();
    const { container } = render(<CommissionTrackerWidget onViewDetails={onViewDetails} />);
    expect(container).toBeTruthy();
  });
});
