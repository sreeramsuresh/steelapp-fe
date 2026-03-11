/**
 * SearchResults Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/search" }),
  useSearchParams: () => [new URLSearchParams("q=test"), vi.fn()],
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/globalSearchService", () => ({
  default: {
    search: vi.fn().mockResolvedValue({ grouped: {}, results: [], total: 0 }),
    refreshIndex: vi.fn().mockResolvedValue({ refreshed: true }),
  },
}));

import SearchResults from "../SearchResults";

describe("SearchResults", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<SearchResults />);
    expect(container).toBeTruthy();
  });
});
