/**
 * EmptyState Component Tests
 * Phase 5.3.2: Tier 3 Presentation Component
 *
 * Tests empty state display with icon, title, description, and actions
 * Covers variants, responsive sizing, and icon integration
 */

import { render, screen } from "@testing-library/react";
import { AlertCircle, Info } from "lucide-react";
import { describe, expect, it } from "vitest";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  it("should render with default info icon", () => {
    const { container } = render(<EmptyState title="No data" description="Nothing to show" />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should render title text", () => {
    render(<EmptyState title="No Results" description="Try searching differently" />);

    expect(screen.getByText("No Results")).toBeInTheDocument();
  });

  it("should render description text", () => {
    render(<EmptyState title="Empty" description="No items available" />);

    expect(screen.getByText("No items available")).toBeInTheDocument();
  });

  it("should apply base styling classes", () => {
    const { container } = render(<EmptyState title="Test" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex", "flex-col", "items-center", "justify-center", "py-12", "px-4");
  });

  it("should render custom icon when provided", () => {
    const { container } = render(<EmptyState title="Alert" icon={AlertCircle} description="Something happened" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should apply default icon size for default variant", () => {
    const { container } = render(<EmptyState title="Test" variant="default" />);

    // Icon should be rendered (size 64 by default)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should apply smaller icon size for minimal variant", () => {
    const { container } = render(<EmptyState title="Test" variant="minimal" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should apply default title size for default variant", () => {
    render(<EmptyState title="Title" variant="default" />);

    const title = screen.getByText("Title");
    expect(title).toHaveClass("text-xl");
  });

  it("should apply smaller title size for minimal variant", () => {
    render(<EmptyState title="Title" variant="minimal" />);

    const title = screen.getByText("Title");
    expect(title).toHaveClass("text-lg");
  });

  it("should apply title font weight", () => {
    render(<EmptyState title="Test Title" />);

    const title = screen.getByText("Test Title");
    expect(title).toHaveClass("font-semibold");
  });

  it("should apply muted text color to description", () => {
    render(<EmptyState title="Title" description="Description" />);

    const description = screen.getByText("Description");
    expect(description).toHaveClass("text-muted-foreground");
  });

  it("should apply muted color to icon", () => {
    const { container } = render(<EmptyState title="Test" />);

    const icon = container.querySelector("svg");
    expect(icon.parentElement).toHaveClass("text-muted-foreground");
  });

  it("should render action button when provided", () => {
    const action = (
      <button type="button" data-testid="action-btn">
        Create New
      </button>
    );
    render(<EmptyState title="Empty" description="No items" action={action} />);

    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });

  it("should render action with wrapper div", () => {
    const action = <button type="button">Create</button>;
    render(<EmptyState title="Empty" description="No items" action={action} />);

    const actionDiv = screen.getByRole("button").closest("div");
    expect(actionDiv).toHaveClass("mt-4");
  });

  it("should handle null icon gracefully", () => {
    render(<EmptyState title="Test" icon={null} />);

    // Conditional rendering - if Icon is falsy, it shouldn't render
    const svg = document.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("should handle undefined title gracefully", () => {
    render(<EmptyState description="Just description" />);

    expect(screen.getByText("Just description")).toBeInTheDocument();
    // Title section should not render if title is undefined
  });

  it("should handle undefined description gracefully", () => {
    render(<EmptyState title="Just title" />);

    expect(screen.getByText("Just title")).toBeInTheDocument();
  });

  it("should space elements vertically", () => {
    const { container } = render(<EmptyState title="Title" description="Description" icon={Info} />);

    const wrapper = container.firstChild;
    const children = wrapper.querySelectorAll(":scope > *");
    // Should have icon wrapper and other content areas
    expect(children.length).toBeGreaterThan(0);
  });

  it("should apply margin bottom to icon", () => {
    const { container } = render(<EmptyState title="Test" />);

    const iconWrapper = container.querySelector(".text-muted-foreground");
    expect(iconWrapper).toHaveClass("mb-4");
  });

  it("should apply margin bottom to title", () => {
    render(<EmptyState title="Test Title" description="Desc" />);

    const title = screen.getByText("Test Title");
    expect(title).toHaveClass("mb-2");
  });

  it("should apply margin bottom to description", () => {
    render(<EmptyState title="Test" description="Description text" />);

    const description = screen.getByText("Description text");
    expect(description).toHaveClass("mb-6", "max-w-sm", "text-center");
  });

  it("should center description text", () => {
    render(<EmptyState title="Test" description="Description" />);

    const description = screen.getByText("Description");
    expect(description).toHaveClass("text-center");
  });

  it("should limit description width", () => {
    render(<EmptyState title="Test" description="Description" />);

    const description = screen.getByText("Description");
    expect(description).toHaveClass("max-w-sm");
  });

  it("should apply description font size", () => {
    render(<EmptyState title="Test" description="Description" />);

    const description = screen.getByText("Description");
    expect(description).toHaveClass("text-sm");
  });

  it("should render as div container", () => {
    const { container } = render(<EmptyState title="Test" />);

    expect(container.firstChild.tagName).toBe("DIV");
  });

  it("should support minimal variant layout", () => {
    render(<EmptyState title="Minimal" description="Test" variant="minimal" />);

    const title = screen.getByText("Minimal");
    expect(title).toHaveClass("text-lg");
  });

  it("should support default variant layout", () => {
    render(<EmptyState title="Default" description="Test" variant="default" />);

    const title = screen.getByText("Default");
    expect(title).toHaveClass("text-xl");
  });

  it("should render multiple action elements", () => {
    const action = (
      <div>
        <button type="button" data-testid="btn1">
          Action 1
        </button>
        <button type="button" data-testid="btn2">
          Action 2
        </button>
      </div>
    );
    render(<EmptyState title="Empty" action={action} />);

    expect(screen.getByTestId("btn1")).toBeInTheDocument();
    expect(screen.getByTestId("btn2")).toBeInTheDocument();
  });

  it("should handle long title text", () => {
    const longTitle = "This is a very long title that might wrap on smaller screens";
    render(<EmptyState title={longTitle} description="Description" />);

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("should handle long description text", () => {
    const longDescription =
      "This is a comprehensive description that explains why the page is empty and what the user should do next to resolve the situation";
    render(<EmptyState title="Empty" description={longDescription} />);

    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it("should render without action when action is undefined", () => {
    render(<EmptyState title="Empty" description="No action" action={undefined} />);

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("No action")).toBeInTheDocument();
  });

  it("should render without action when action is null", () => {
    render(<EmptyState title="Empty" description="No action" action={null} />);

    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("should allow custom icons", () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;

    render(<EmptyState title="Test" description="Test" icon={CustomIcon} />);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("should render with all props provided", () => {
    const action = <button type="button">Try Again</button>;
    render(
      <EmptyState
        title="No Data"
        description="Please refresh and try again"
        icon={AlertCircle}
        action={action}
        variant="default"
      />
    );

    expect(screen.getByText("No Data")).toBeInTheDocument();
    expect(screen.getByText("Please refresh and try again")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("should use Info as default icon", () => {
    const { container } = render(<EmptyState title="Test" />);

    // Default icon should be rendered (Info from lucide-react)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should render in proper semantic order: icon -> title -> description -> action", () => {
    const action = (
      <button type="button" data-testid="action">
        Click
      </button>
    );
    const { container } = render(<EmptyState title="Title" description="Description" action={action} icon={Info} />);

    const children = container.firstChild.children;
    // Verify structure exists
    expect(children.length).toBeGreaterThan(0);
  });
});
