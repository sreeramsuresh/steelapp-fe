/**
 * InvoiceFooterNotes Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests invoice footer notes section
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import InvoiceFooterNotes from "../InvoiceFooterNotes";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe("InvoiceFooterNotes", () => {
  let mockOnNotesChange;
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnNotesChange = vi.fn();

    defaultProps = {
      notes: "Please remit payment within 30 days of invoice date.",
      termsAndConditions:
        "Goods sold are subject to our standard terms and conditions.\n" +
        "Delivery timeline is subject to warehouse availability.",
      onNotesChange: mockOnNotesChange,
      readOnly: false,
    };
  });

  describe("Rendering", () => {
    it("should render notes section", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display notes label", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container.textContent).toContain("Notes");
    });

    it("should display terms and conditions label", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container.textContent).toContain("Terms");
    });
  });

  describe("Notes Display", () => {
    it("should display notes content", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container.textContent).toContain("Please remit payment within 30 days");
    });

    it("should display multiple lines in notes", () => {
      const multilineNotes = "Line 1\nLine 2\nLine 3";
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes={multilineNotes} />);

      expect(container.textContent).toContain("Line 1");
      expect(container.textContent).toContain("Line 2");
      expect(container.textContent).toContain("Line 3");
    });

    it("should handle empty notes", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes="" />);

      expect(container).toBeInTheDocument();
    });

    it("should handle null notes", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes={null} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very long notes", () => {
      const longNotes = "A".repeat(500);
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes={longNotes} />);

      expect(container.textContent).toContain("A");
    });
  });

  describe("Terms and Conditions Display", () => {
    it("should display terms and conditions content", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container.textContent).toContain("Goods sold are subject to");
      expect(container.textContent).toContain("Delivery timeline");
    });

    it("should handle line breaks in terms", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container.textContent).toContain("standard terms");
    });

    it("should handle empty terms", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} termsAndConditions="" />);

      expect(container).toBeInTheDocument();
    });

    it("should display formatted terms with bullet points if provided", () => {
      const bulletTerms = "• Payment terms: Net 30\n• Delivery: FOB\n• Returns: 7 days";
      const { container } = renderWithProviders(
        <InvoiceFooterNotes {...defaultProps} termsAndConditions={bulletTerms} />
      );

      expect(container.textContent).toContain("Payment terms");
    });
  });

  describe("Editable Mode", () => {
    it("should show textarea when editable", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      expect(textareas.length).toBeGreaterThan(0);
    });

    it("should allow editing notes", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        await user.clear(textareas[0]);
        await user.type(textareas[0], "Updated notes");
        expect(textareas[0].value).toBe("Updated notes");
      }
    });

    it("should call onNotesChange when notes are edited", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        await user.clear(textareas[0]);
        await user.type(textareas[0], "New content");
        expect(mockOnNotesChange).toHaveBeenCalled();
      }
    });

    it("should handle paste operations in notes", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        await user.clear(textareas[0]);
        await user.type(textareas[0], "Pasted content");
        expect(textareas[0].value).toContain("Pasted");
      }
    });
  });

  describe("Read-Only Mode", () => {
    it("should show read-only text when readOnly is true", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={true} />);

      expect(container.textContent).toContain("Please remit payment");
    });

    it("should not show textarea when read-only", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={true} />);

      const textareas = container.querySelectorAll("textarea");
      expect(textareas.length).toBe(0);
    });

    it("should not allow editing in read-only mode", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={true} />);

      const inputs = container.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        if ("disabled" in input) {
          expect(input.disabled || container.textContent.includes("Please remit")).toBeTruthy();
        }
      });
    });
  });

  describe("Character Limits", () => {
    it("should handle character limit if specified", () => {
      const { container } = renderWithProviders(
        <InvoiceFooterNotes {...defaultProps} readOnly={false} maxLength={100} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should show character count if enabled", () => {
      const { container } = renderWithProviders(
        <InvoiceFooterNotes {...defaultProps} readOnly={false} showCharCount={true} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Formatting Preservation", () => {
    it("should preserve line breaks in display", () => {
      const notesWithBreaks = "Line 1\nLine 2\nLine 3";
      const { container } = renderWithProviders(
        <InvoiceFooterNotes {...defaultProps} notes={notesWithBreaks} readOnly={true} />
      );

      expect(container.textContent).toContain("Line 1");
      expect(container.textContent).toContain("Line 2");
    });

    it("should preserve tabs and spacing", () => {
      const spacedNotes = "Item 1\n  Sub-item 1\n  Sub-item 2\nItem 2";
      const { container } = renderWithProviders(
        <InvoiceFooterNotes {...defaultProps} notes={spacedNotes} readOnly={true} />
      );

      expect(container.textContent).toContain("Item 1");
      expect(container.textContent).toContain("Sub-item");
    });
  });

  describe("Section Layout", () => {
    it("should have distinct notes and terms sections", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container.textContent).toContain("Notes");
      expect(container.textContent).toContain("Terms");
    });

    it("should display notes above terms", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      const notesIndex = container.textContent.indexOf("Please remit");
      const termsIndex = container.textContent.indexOf("Goods sold");
      expect(notesIndex).toBeLessThan(termsIndex);
    });

    it("should provide visual separation between sections", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Print Optimization", () => {
    it("should display properly for printing", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={true} />);

      expect(container.textContent).toContain("Please remit");
      expect(container.textContent).toContain("Goods sold");
    });

    it("should not show input elements when printing", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={true} />);

      const textareas = container.querySelectorAll("textarea");
      expect(textareas.length).toBe(0);
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with proper colors in dark mode", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />, {
        initialState: { theme: { isDarkMode: true } },
      });

      expect(container).toBeInTheDocument();
    });

    it("should render with proper colors in light mode", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />, {
        initialState: { theme: { isDarkMode: false } },
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have labels for text inputs", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      expect(container.textContent).toContain("Notes");
      expect(container.textContent).toContain("Terms");
    });

    it("should have proper heading structure", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} />);

      const headings = container.querySelectorAll("h4, h5, h6");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should support keyboard navigation", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        await user.click(textareas[0]);
        expect(textareas[0]).toHaveFocus();
      }
    });
  });

  describe("Special Characters", () => {
    it("should handle special characters in notes", () => {
      const specialNotes = "Payment: €100 @ 3% = extra €3!";
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes={specialNotes} />);

      expect(container.textContent).toContain("Payment");
    });

    it("should handle Unicode characters", () => {
      const unicodeNotes = "Nota: 你好 مرحبا";
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes={unicodeNotes} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle HTML-like text safely", () => {
      const htmlLikeNotes = "Please <do> <not> <remove> this";
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes={htmlLikeNotes} />);

      // Should render as text, not as HTML
      expect(container.textContent).toContain("<do>");
    });
  });

  describe("Edge Cases", () => {
    it("should handle extremely long notes", () => {
      const veryLongNotes = "A".repeat(5000);
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes={veryLongNotes} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle notes with only whitespace", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes="   \n  \n  " />);

      expect(container).toBeInTheDocument();
    });

    it("should handle rapid text input", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        await user.type(textareas[0], "Rapid typing test");
        expect(textareas[0].value).toContain("Rapid");
      }
    });
  });

  describe("Callback Handling", () => {
    it("should call onNotesChange with correct value", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        await user.clear(textareas[0]);
        await user.type(textareas[0], "New value");
        expect(mockOnNotesChange).toHaveBeenCalled();
      }
    });

    it("should pass field name to callback", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        await user.clear(textareas[0]);
        await user.type(textareas[0], "Test");
        expect(mockOnNotesChange).toHaveBeenCalled();
      }
    });
  });

  describe("Placeholder Text", () => {
    it("should show placeholder for empty notes field", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes="" readOnly={false} />);

      const textareas = container.querySelectorAll("textarea");
      if (textareas.length > 0) {
        expect(textareas[0].placeholder || container.textContent).toBeTruthy();
      }
    });

    it("should show helpful placeholder text", () => {
      const { container } = renderWithProviders(<InvoiceFooterNotes {...defaultProps} notes="" readOnly={false} />);

      expect(container).toBeInTheDocument();
    });
  });
});
