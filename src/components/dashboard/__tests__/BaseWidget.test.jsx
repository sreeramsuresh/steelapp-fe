/**
 * BaseWidget Tests
 * Tests the BaseWidget foundation component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeContext } from '../../../contexts/ThemeContext';
import BaseWidget, { WidgetEmptyState, MetricValue, WidgetListItem } from '../widgets/BaseWidget';

const renderWithTheme = (component, isDarkMode = false) => {
  return render(
    <ThemeContext.Provider value={{ isDarkMode, themeMode: isDarkMode ? 'dark' : 'light', toggleTheme: vi.fn() }}>
      {component}
    </ThemeContext.Provider>,
  );
};

describe('BaseWidget', () => {
  describe('Loading State', () => {
    it('renders skeleton when loading', () => {
      renderWithTheme(<BaseWidget title="Test" loading={true}><div>Content</div></BaseWidget>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does not render children when loading', () => {
      renderWithTheme(<BaseWidget title="Test" loading={true}><div>Content</div></BaseWidget>);
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when error prop provided', () => {
      renderWithTheme(<BaseWidget title="Test" error="Something went wrong"><div>Content</div></BaseWidget>);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows retry button in error state', () => {
      const onRefresh = vi.fn();
      renderWithTheme(<BaseWidget title="Test" error="Error" onRefresh={onRefresh}><div>Content</div></BaseWidget>);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls onRefresh when retry clicked', () => {
      const onRefresh = vi.fn();
      renderWithTheme(<BaseWidget title="Test" error="Error" onRefresh={onRefresh}><div>Content</div></BaseWidget>);
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe('Success State', () => {
    it('renders children when not loading and no error', () => {
      renderWithTheme(<BaseWidget title="Test"><div>Content</div></BaseWidget>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders title', () => {
      renderWithTheme(<BaseWidget title="Test Widget"><div>Content</div></BaseWidget>);
      expect(screen.getByText('Test Widget')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      renderWithTheme(<BaseWidget title="Test" description="Widget description"><div>Content</div></BaseWidget>);
      expect(screen.getByText('Widget description')).toBeInTheDocument();
    });

    it('shows refresh button when onRefresh provided', () => {
      renderWithTheme(<BaseWidget title="Test" onRefresh={() => {}}><div>Content</div></BaseWidget>);
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles', () => {
      renderWithTheme(<BaseWidget title="Test"><div>Content</div></BaseWidget>, true);
      const widget = screen.getByText('Test').closest('div');
      expect(widget).toBeInTheDocument();
    });
  });
});

describe('WidgetEmptyState', () => {
  it('renders empty message', () => {
    renderWithTheme(<WidgetEmptyState message="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    renderWithTheme(<WidgetEmptyState message="No data" actionLabel="Add Data" onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /add data/i })).toBeInTheDocument();
  });
});

describe('MetricValue', () => {
  it('renders value', () => {
    renderWithTheme(<MetricValue value="1,234" />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders positive change indicator', () => {
    renderWithTheme(<MetricValue value="100" change={5.5} changeType="positive" />);
    expect(screen.getByText(/5.5/)).toBeInTheDocument();
  });

  it('renders negative change indicator', () => {
    renderWithTheme(<MetricValue value="100" change={-3.2} changeType="negative" />);
    expect(screen.getByText(/3.2/)).toBeInTheDocument();
  });
});

describe('WidgetListItem', () => {
  it('renders item content', () => {
    renderWithTheme(<WidgetListItem title="Item 1" subtitle="Description" />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('handles click', () => {
    const onClick = vi.fn();
    renderWithTheme(<WidgetListItem title="Item" onClick={onClick} />);
    fireEvent.click(screen.getByText('Item'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders rank when provided', () => {
    renderWithTheme(<WidgetListItem title="Item" rank={1} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });
});
