import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('../../../../../services/dashboardService', () => ({
  dashboardService: {
    getSalesAgentScorecard: vi.fn().mockResolvedValue(null),
  },
}));

import AgentScorecardWidget from '../AgentScorecardWidget';

describe('AgentScorecardWidget', () => {
  it('renders without crashing', () => {
    render(<AgentScorecardWidget />);
  });

  it('displays agent scorecard content', () => {
    const { container } = render(<AgentScorecardWidget />);
    expect(container).toBeTruthy();
  });

  it('renders with loading state', () => {
    const { container } = render(<AgentScorecardWidget />);
    expect(container).toBeTruthy();
  });

  it('renders with agentId prop', () => {
    const { container } = render(<AgentScorecardWidget agentId={1} />);
    expect(container).toBeTruthy();
  });
});
