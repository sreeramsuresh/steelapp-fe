import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('../../../../../utils/fieldAccessors', () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || 'Unknown',
}));

import StockTurnoverWidget from '../StockTurnoverWidget';

describe('StockTurnoverWidget', () => {
  it('renders without crashing', () => {
    render(<StockTurnoverWidget />);
  });

  it('renders with fallback mock data', () => {
    render(<StockTurnoverWidget data={null} />);
    // Should render without crashing using fallback data
  });

  it('renders with custom data', () => {
    const data = {
      products: [
        { id: 1, name: 'SS 304 Sheet', data: [4.2, 3.8, 4.5, 5.2, 4.8, 5.5] },
      ],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      overallEfficiency: 72,
      avgTurnover: 2.4,
      bestPerformer: 'SS 304 Sheet',
      worstPerformer: 'SS 410 Coil',
    };
    render(<StockTurnoverWidget data={data} />);
    expect(screen.getByText('SS 304 Sheet')).toBeInTheDocument();
  });
});
