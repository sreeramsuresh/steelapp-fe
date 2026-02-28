import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('../../../../../utils/fieldAccessors', () => ({
  getProductDisplayName: (p) => p?.name || p?.productName || 'Unknown',
}));

import SlowMovingWidget from '../SlowMovingWidget';

describe('SlowMovingWidget', () => {
  const sampleData = {
    products: [
      {
        id: 1,
        name: 'SS 410 Coil',
        daysSinceLastSale: 90,
        stockValue: 150000,
        quantity: 50,
      },
      {
        id: 2,
        name: 'SS 202 Plate',
        daysSinceLastSale: 75,
        stockValue: 80000,
        quantity: 30,
      },
    ],
    summary: { totalSlowMoving: 2, totalValue: 230000 },
  };

  it('renders without crashing', () => {
    render(<SlowMovingWidget data={sampleData} />);
  });

  it('displays slow-moving products', () => {
    render(<SlowMovingWidget data={sampleData} />);
    expect(screen.getByText('SS 410 Coil')).toBeInTheDocument();
    expect(screen.getByText('SS 202 Plate')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<SlowMovingWidget data={null} />);
    // Should show empty state
  });

  it('renders with empty products array', () => {
    render(<SlowMovingWidget data={{ products: [], summary: null }} />);
    // Should render without crashing
  });
});
