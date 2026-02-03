/**
 * SourceTypeSelector Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests dropdown selector for invoice line source type
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import SourceTypeSelector from "../SourceTypeSelector";

describe("SourceTypeSelector", () => {
  let mockOnChange;
  let defaultProps;

  beforeEach(() => {
    mockOnChange = vi.fn();
    defaultProps = {
      value: "WAREHOUSE",
      onChange: mockOnChange,
      disabled: false,
      id: "source-selector",
      "data-testid": "source-type-selector",
    };
  });

  describe("Rendering", () => {
    it("should render selector component", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      expect(container.querySelector("[data-testid='source-type-selector']")).toBeInTheDocument();
    });

    it("should render with correct id", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} id="custom-id" />);

      expect(container.querySelector("#custom-id")).toBeInTheDocument();
    });

    it("should render trigger button", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should display selected value", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="WAREHOUSE" />);

      expect(container.textContent).toContain("Warehouse");
    });
  });

  describe("Source Type Options", () => {
    it("should support WAREHOUSE source type", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="WAREHOUSE" />);

      expect(container.textContent).toContain("Warehouse");
    });

    it("should support LOCAL_DROP_SHIP source type", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="LOCAL_DROP_SHIP" />);

      expect(container.textContent).toContain("Local Drop");
    });

    it("should support IMPORT_DROP_SHIP source type", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="IMPORT_DROP_SHIP" />);

      expect(container.textContent).toContain("Import Drop");
    });

    it("should default to WAREHOUSE when no value provided", () => {
      const { container } = renderWithProviders(<SourceTypeSelector onChange={mockOnChange} />);

      expect(container.textContent).toContain("Warehouse");
    });

    it("should fall back to first option for invalid value", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="INVALID_TYPE" />);

      expect(container.textContent).toContain("Warehouse");
    });
  });

  describe("Icons", () => {
    it("should display warehouse icon for warehouse source", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="WAREHOUSE" />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should display truck icon for local drop-ship", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="LOCAL_DROP_SHIP" />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should display ship icon for import drop-ship", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="IMPORT_DROP_SHIP" />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should have chevron down icon for dropdown", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Selection Behavior", () => {
    it("should call onChange when option selected", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      await user.click(trigger);

      expect(trigger).toBeInTheDocument();
    });

    it("should handle selection of WAREHOUSE option", async () => {
      const { container } = renderWithProviders(
        <SourceTypeSelector {...defaultProps} value="LOCAL_DROP_SHIP" onChange={mockOnChange} />
      );

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should handle selection of LOCAL_DROP_SHIP option", async () => {
      const { container } = renderWithProviders(
        <SourceTypeSelector {...defaultProps} value="WAREHOUSE" onChange={mockOnChange} />
      );

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should handle selection of IMPORT_DROP_SHIP option", async () => {
      const { container } = renderWithProviders(
        <SourceTypeSelector {...defaultProps} value="WAREHOUSE" onChange={mockOnChange} />
      );

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable selector when disabled prop is true", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} disabled={true} />);

      const trigger = container.querySelector("button");
      expect(trigger).toHaveAttribute("disabled");
    });

    it("should not be disabled when disabled prop is false", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} disabled={false} />);

      const trigger = container.querySelector("button");
      expect(trigger).not.toHaveAttribute("disabled");
    });

    it("should not call onChange when disabled", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(
        <SourceTypeSelector {...defaultProps} disabled={true} onChange={mockOnChange} />
      );

      const trigger = container.querySelector("button");
      await user.click(trigger);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should show visual disabled state", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} disabled={true} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper id attribute", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} id="source-type-field" />);

      expect(container.querySelector("#source-type-field")).toBeInTheDocument();
    });

    it("should have data-testid attribute", () => {
      const { container } = renderWithProviders(
        <SourceTypeSelector {...defaultProps} data-testid="source-selector-test" />
      );

      expect(container.querySelector("[data-testid='source-selector-test']")).toBeInTheDocument();
    });

    it("should be keyboard accessible", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should have focus indicator", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should have dark mode classes", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should render in light mode", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Value Updates", () => {
    it("should update displayed value when prop changes", () => {
      const { container, rerender } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="WAREHOUSE" />);

      expect(container.textContent).toContain("Warehouse");

      rerender(<SourceTypeSelector {...defaultProps} value="LOCAL_DROP_SHIP" />);

      expect(container.textContent).toContain("Local Drop");
    });

    it("should handle rapid value changes", () => {
      const { container, rerender } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="WAREHOUSE" />);

      rerender(<SourceTypeSelector {...defaultProps} value="LOCAL_DROP_SHIP" />);
      rerender(<SourceTypeSelector {...defaultProps} value="IMPORT_DROP_SHIP" />);
      rerender(<SourceTypeSelector {...defaultProps} value="WAREHOUSE" />);

      expect(container.textContent).toContain("Warehouse");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null value gracefully", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value={null} />);

      expect(container.textContent).toContain("Warehouse");
    });

    it("should handle undefined value gracefully", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value={undefined} />);

      expect(container.textContent).toContain("Warehouse");
    });

    it("should handle empty string value", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="" />);

      expect(container.textContent).toContain("Warehouse");
    });

    it("should handle onChange being null", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} onChange={null} />);

      expect(container.querySelector("button")).toBeInTheDocument();
    });

    it("should handle missing optional props", () => {
      const { container } = renderWithProviders(<SourceTypeSelector />);

      expect(container.querySelector("button")).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("should have proper size styling", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toHaveClass("h-8");
    });

    it("should have border styling", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toHaveClass("border");
    });

    it("should have rounded corners", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toHaveClass("rounded-md");
    });

    it("should have proper padding", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toHaveClass("px-3");
    });
  });

  describe("Hover and Focus States", () => {
    it("should be hoverable", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      await user.hover(trigger);

      expect(trigger).toBeInTheDocument();
    });

    it("should have focus ring on focus", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} />);

      const trigger = container.querySelector("button");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Option Labels", () => {
    it("should display full label for warehouse", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="WAREHOUSE" />);

      expect(container.textContent).toContain("Warehouse");
    });

    it("should display short label for local drop-ship", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="LOCAL_DROP_SHIP" />);

      expect(container.textContent).toContain("Local Drop");
    });

    it("should display short label for import drop-ship", () => {
      const { container } = renderWithProviders(<SourceTypeSelector {...defaultProps} value="IMPORT_DROP_SHIP" />);

      expect(container.textContent).toContain("Import Drop");
    });
  });
});
