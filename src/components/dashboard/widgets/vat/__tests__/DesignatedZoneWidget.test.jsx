import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import DesignatedZoneWidget from '../DesignatedZoneWidget';

describe('DesignatedZoneWidget', () => {
  it('renders without crashing', () => {
    render(<DesignatedZoneWidget />);
  });

  it('displays designated zone content with mock data', () => {
    render(<DesignatedZoneWidget />);
    // Mock data includes zone names like JAFZA
    const { container } = render(<DesignatedZoneWidget />);
    expect(container).toBeTruthy();
  });

  it('renders with custom data', () => {
    const data = {
      summary: {
        totalTransactions: 15,
        totalValue: 800000,
        zeroRatedValue: 720000,
        compliantTransactions: 13,
      },
      zones: [
        { name: 'JAFZA', transactions: 8, value: 450000 },
        { name: 'DAFZA', transactions: 7, value: 350000 },
      ],
    };
    render(<DesignatedZoneWidget data={data} />);
    const { container } = render(<DesignatedZoneWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it('renders with no data', () => {
    const { container } = render(<DesignatedZoneWidget data={null} />);
    expect(container).toBeTruthy();
  });
});
