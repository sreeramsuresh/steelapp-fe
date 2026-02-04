/**
 * HelpSection Component Tests
 * Phase 5.3.2: Tier 3 Information Component
 *
 * Tests help/guidance section with icons, variants, and list rendering
 * Covers dark mode, variant styling, and accessibility
 */

import { render, screen } from "@testing-library/react";
import { AlertTriangle } from "lucide-react";
import { describe, expect, it } from "vitest";
import HelpSection from "../HelpSection";

describe("HelpSection", () => {
  it("should render title when provided", () => {
    render(<HelpSection title="How to use" items={["Step 1", "Step 2"]} />);

    expect(screen.getByText("How to use")).toBeInTheDocument();
  });

  it("should render items as list", () => {
    const items = ["Item 1", "Item 2", "Item 3"];
    render(<HelpSection title="List" items={items} />);

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it("should render items as string paragraph", () => {
    const itemText = "This is help text";
    render(<HelpSection title="Help" items={itemText} />);

    expect(screen.getByText(itemText)).toBeInTheDocument();
  });

  it("should render ul element for array items", () => {
    const { container } = render(<HelpSection title="List" items={["Item 1", "Item 2"]} />);

    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("should render li elements for each array item", () => {
    const items = ["Item A", "Item B", "Item C"];
    const { container } = render(<HelpSection title="List" items={items} />);

    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(3);
  });

  it("should render paragraph for string items", () => {
    const { container } = render(<HelpSection title="Info" items="Help text here" />);

    const paragraph = container.querySelector("p");
    expect(paragraph).toBeInTheDocument();
    expect(paragraph.textContent).toBe("Help text here");
  });

  it("should apply info variant styling by default", () => {
    const { container } = render(<HelpSection title="Info" items="Content" variant="info" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("bg-blue-50", "dark:bg-blue-900");
  });

  it("should apply tip variant styling", () => {
    const { container } = render(<HelpSection title="Tip" items="Content" variant="tip" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("bg-amber-50", "dark:bg-amber-900");
  });

  it("should apply warning variant styling", () => {
    const { container } = render(<HelpSection title="Warning" items="Content" variant="warning" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("bg-orange-50", "dark:bg-orange-900");
  });

  it("should apply success variant styling", () => {
    const { container } = render(<HelpSection title="Success" items="Content" variant="success" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("bg-green-50", "dark:bg-green-900");
  });

  it("should apply info border color", () => {
    const { container } = render(<HelpSection title="Info" items="Content" variant="info" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("border-blue-200", "dark:border-blue-700");
  });

  it("should apply tip border color", () => {
    const { container } = render(<HelpSection title="Tip" items="Content" variant="tip" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("border-amber-200", "dark:border-amber-700");
  });

  it("should apply warning border color", () => {
    const { container } = render(<HelpSection title="Warning" items="Content" variant="warning" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("border-orange-200", "dark:border-orange-700");
  });

  it("should apply success border color", () => {
    const { container } = render(<HelpSection title="Success" items="Content" variant="success" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("border-green-200", "dark:border-green-700");
  });

  it("should apply info text color", () => {
    const { container } = render(<HelpSection title="Info" items="Content" variant="info" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("text-blue-900", "dark:text-blue-100");
  });

  it("should apply tip text color", () => {
    const { container } = render(<HelpSection title="Tip" items="Content" variant="tip" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("text-amber-900", "dark:text-amber-100");
  });

  it("should apply warning text color", () => {
    const { container } = render(<HelpSection title="Warning" items="Content" variant="warning" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("text-orange-900", "dark:text-orange-100");
  });

  it("should apply success text color", () => {
    const { container } = render(<HelpSection title="Success" items="Content" variant="success" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("text-green-900", "dark:text-green-100");
  });

  it("should render default Info icon", () => {
    const { container } = render(<HelpSection title="Info" items="Content" />);

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should render custom icon when provided", () => {
    const { container } = render(<HelpSection title="Warning" items="Content" icon={AlertTriangle} />);

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should not render icon when showIcon is false", () => {
    const { container } = render(<HelpSection title="Info" items="Content" showIcon={false} />);

    // Should have no icon element
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("should apply icon sizing", () => {
    const { container } = render(<HelpSection title="Info" items="Content" />);

    const icon = container.querySelector("svg");
    // Size 20 should be applied
    expect(icon).toBeInTheDocument();
  });

  it("should apply info icon color", () => {
    const { container } = render(<HelpSection title="Info" items="Content" variant="info" />);

    const iconWrapper = container.querySelector('[class*="text-blue"]');
    expect(iconWrapper).toHaveClass("text-blue-600", "dark:text-blue-400");
  });

  it("should apply tip icon color", () => {
    const { container } = render(<HelpSection title="Tip" items="Content" variant="tip" />);

    const iconWrapper = container.querySelector('[class*="text-amber"]');
    expect(iconWrapper).toHaveClass("text-amber-600", "dark:text-amber-400");
  });

  it("should apply warning icon color", () => {
    const { container } = render(<HelpSection title="Warning" items="Content" variant="warning" />);

    const iconWrapper = container.querySelector('[class*="text-orange"]');
    expect(iconWrapper).toHaveClass("text-orange-600", "dark:text-orange-400");
  });

  it("should apply success icon color", () => {
    const { container } = render(<HelpSection title="Success" items="Content" variant="success" />);

    const iconWrapper = container.querySelector('[class*="text-green"]');
    expect(iconWrapper).toHaveClass("text-green-600", "dark:text-green-400");
  });

  it("should apply header styling", () => {
    render(<HelpSection title="Title" items="Content" />);

    const title = screen.getByText("Title");
    expect(title).toHaveClass("font-semibold", "text-sm");
  });

  it("should apply header text color to title", () => {
    render(<HelpSection title="Info Title" items="Content" variant="info" />);

    const title = screen.getByText("Info Title");
    expect(title).toHaveClass("text-blue-900", "dark:text-blue-100");
  });

  it("should apply wrapper padding and border", () => {
    const { container } = render(<HelpSection title="Info" items="Content" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("p-4", "rounded-lg", "border");
  });

  it("should apply list styling", () => {
    const { container } = render(<HelpSection title="List" items={["Item 1", "Item 2"]} />);

    const list = container.querySelector("ul");
    expect(list).toHaveClass("space-y-1", "text-sm", "list-disc", "list-inside");
  });

  it("should handle empty array items", () => {
    const { container } = render(<HelpSection title="Empty" items={[]} />);

    const list = container.querySelector("ul");
    expect(list).toBeInTheDocument();
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(0);
  });

  it("should handle title without items", () => {
    render(<HelpSection title="Just Title" />);

    expect(screen.getByText("Just Title")).toBeInTheDocument();
  });

  it("should handle items without title", () => {
    render(<HelpSection items="Just Content" />);

    expect(screen.getByText("Just Content")).toBeInTheDocument();
  });

  it("should render with all custom properties", () => {
    render(
      <HelpSection
        title="Custom"
        items={["Custom 1", "Custom 2"]}
        variant="warning"
        icon={AlertTriangle}
        showIcon={true}
      />
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Custom 1")).toBeInTheDocument();
  });

  it("should render icon and title flex container", () => {
    const { container } = render(<HelpSection title="Title" items="Content" />);

    const header = container.querySelector('[class*="flex"]');
    expect(header).toHaveClass("flex", "items-start", "gap-3", "mb-3");
  });

  it("should apply paragraph styling for string items", () => {
    render(<HelpSection title="Info" items="Content text" />);

    const paragraph = screen.getByText("Content text").closest("p");
    expect(paragraph).toHaveClass("text-sm");
  });

  it("should render multiple list items with proper spacing", () => {
    const items = ["First", "Second", "Third", "Fourth", "Fifth"];
    const { container } = render(<HelpSection title="List" items={items} />);

    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(5);

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it("should handle long list item text", () => {
    const longText =
      "This is a very long list item that explains something in great detail and should wrap properly on smaller screens";
    const items = [longText];

    render(<HelpSection title="Long" items={items} />);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("should handle special characters in items", () => {
    const specialItems = ["Item & Demo", "Special < > Characters", "Price: $100"];

    render(<HelpSection title="Special" items={specialItems} />);

    specialItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it("should render with all variant options", () => {
    const variants = ["info", "tip", "warning", "success"];

    variants.forEach((variant) => {
      const { container } = render(<HelpSection title="Test" items="Content" variant={variant} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it("should maintain contrast in dark mode", () => {
    const { container } = render(<HelpSection title="Info" items="Content" variant="info" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("dark:bg-blue-900", "dark:text-blue-100");
  });
});
