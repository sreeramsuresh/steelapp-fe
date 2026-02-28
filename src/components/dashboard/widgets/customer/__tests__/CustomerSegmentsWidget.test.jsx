import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CustomerSegmentsWidget from '../CustomerSegmentsWidget';

describe('CustomerSegmentsWidget', () => {
  it('renders without crashing', () => {
    render(<CustomerSegmentsWidget />);
  });

  it('displays the widget title', () => {
    render(<CustomerSegmentsWidget />);
    expect(screen.getAllByText('Customer Segments').length).toBeGreaterThan(0);
  });

  it('displays total customer count', () => {
    render(<CustomerSegmentsWidget />);
    expect(screen.getByText('156 total customers')).toBeInTheDocument();
  });

  it('shows industry segments by default', () => {
    render(<CustomerSegmentsWidget />);
    expect(screen.getByText('Fabricators')).toBeInTheDocument();
    expect(screen.getByText('Traders')).toBeInTheDocument();
  });

  it('displays total revenue', () => {
    render(<CustomerSegmentsWidget />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('shows view details button when onViewDetails is provided', () => {
    const onViewDetails = vi.fn();
    render(<CustomerSegmentsWidget onViewDetails={onViewDetails} />);
    expect(screen.getByText('View Full Analysis')).toBeInTheDocument();
  });
});
