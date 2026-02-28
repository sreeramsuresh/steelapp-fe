import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import LeaderboardWidget from '../LeaderboardWidget';

describe('LeaderboardWidget', () => {
  it('renders without crashing', () => {
    render(<LeaderboardWidget />);
  });

  it('displays leaderboard with mock data', () => {
    render(<LeaderboardWidget />);
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
  });

  it('displays leaderboard title', () => {
    render(<LeaderboardWidget />);
    expect(screen.getByText(/Leaderboard/i)).toBeInTheDocument();
  });

  it('renders with custom data', () => {
    const data = [
      {
        id: 1,
        name: 'Test Agent',
        avatar: 'TA',
        target: 1000000,
        achieved: 800000,
        rank: 1,
        deals: 20,
      },
    ];
    render(<LeaderboardWidget data={data} />);
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });
});
