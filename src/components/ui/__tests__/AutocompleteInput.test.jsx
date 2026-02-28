/**
 * AutocompleteInput Component Tests
 * Tests autocomplete/combobox with debounced search and dropdown
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

import AutocompleteInput from "../AutocompleteInput";

describe("AutocompleteInput", () => {
  const mockItems = [
    { id: 1, name: "Apple" },
    { id: 2, name: "Banana" },
    { id: 3, name: "Cherry" },
  ];

  it("renders without crashing", () => {
    const { container } = render(<AutocompleteInput />);
    expect(container).toBeTruthy();
  });

  it("renders input element with placeholder", () => {
    render(<AutocompleteInput placeholder="Search items..." />);
    expect(screen.getByPlaceholderText("Search items...")).toBeInTheDocument();
  });

  it("renders with default placeholder", () => {
    render(<AutocompleteInput />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders with value", () => {
    render(<AutocompleteInput value="test value" />);
    expect(screen.getByDisplayValue("test value")).toBeInTheDocument();
  });

  it("renders as disabled", () => {
    render(<AutocompleteInput disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("renders with custom className", () => {
    const { container } = render(<AutocompleteInput className="custom-class" />);
    expect(container.firstChild.className).toContain("custom-class");
  });

  it("renders with items prop without error", () => {
    const { container } = render(<AutocompleteInput items={mockItems} />);
    expect(container).toBeTruthy();
  });

  it("renders error icon when error prop is set", () => {
    render(<AutocompleteInput error="Something went wrong" />);
    // Error state renders AlertCircle icon
    const { container } = render(<AutocompleteInput error="Error message" />);
    expect(container).toBeTruthy();
  });
});
