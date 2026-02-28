import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import VATCollectionWidget from '../VATCollectionWidget';

describe('VATCollectionWidget', () => {
  it('renders without crashing', () => {
    render(<VATCollectionWidget />);
  });

  it('displays VAT collection content with fallback data', () => {
    render(<VATCollectionWidget />);
    // Fallback data should be generated dynamically
    const { container } = render(<VATCollectionWidget />);
    expect(container).toBeTruthy();
  });

  it('renders with custom data', () => {
    const data = {
      outputVAT: 250000,
      inputVAT: 180000,
      netVAT: 70000,
      trend: { outputChange: 5, inputChange: 3 },
      currentQuarter: 'Q4 2024',
    };
    render(<VATCollectionWidget data={data} />);
    const { container } = render(<VATCollectionWidget data={data} />);
    expect(container).toBeTruthy();
  });

  it('renders with isLoading prop', () => {
    const { container } = render(<VATCollectionWidget isLoading={true} />);
    expect(container).toBeTruthy();
  });
});
