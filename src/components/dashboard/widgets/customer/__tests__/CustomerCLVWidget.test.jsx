import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import CustomerCLVWidget from '../CustomerCLVWidget';

describe('CustomerCLVWidget', () => {
  it('renders without crashing', () => {
    render(<CustomerCLVWidget />);
  });

  it('displays the widget title', () => {
    render(<CustomerCLVWidget />);
    expect(screen.getAllByText('Customer CLV').length).toBeGreaterThan(0);
  });

  it('displays average CLV summary', () => {
    render(<CustomerCLVWidget />);
    expect(screen.getByText('Average Customer CLV')).toBeInTheDocument();
  });

  it('shows top customers by default', () => {
    render(<CustomerCLVWidget />);
    expect(screen.getByText('Al Rashid Steel Works')).toBeInTheDocument();
    expect(screen.getByText('Emirates Fabrication LLC')).toBeInTheDocument();
  });

  it('toggles between top customers and segments view', () => {
    render(<CustomerCLVWidget />);
    fireEvent.click(screen.getByText('Segments'));
    expect(screen.getByText('High Value')).toBeInTheDocument();
    expect(screen.getByText('Medium Value')).toBeInTheDocument();
    expect(screen.getByText('Low Value')).toBeInTheDocument();
  });

  it('shows view details button when onViewDetails is provided', () => {
    const onViewDetails = vi.fn();
    render(<CustomerCLVWidget onViewDetails={onViewDetails} />);
    expect(screen.getByText('View Full CLV Report')).toBeInTheDocument();
  });
});
