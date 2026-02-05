/**
 * Tests for buttonTestUtils.js
 * Verifies button finding and interaction helpers
 */

/* eslint-disable local-rules/no-dead-button */
// Test fixtures intentionally render buttons without handlers to test utility functions

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
import sinon from 'sinon';
  assertButtonDisabled,
  assertButtonEnabled,
  clickButton,
  findAllButtons,
  findButtonByRole,
  getButtonVariant,
  isButtonLoading,
  waitForButtonEnabled,
} from "../buttonTestUtils";

describe("buttonTestUtils", () => {
  describe("findButtonByRole", () => {
    it("finds button by role name", () => {
      render(<button type="button">Save</button>);
      const button = findButtonByRole("Save");
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe("Save");
    });

    it("returns null when button not found", () => {
      render(<button type="button">Save</button>);
      const button = findButtonByRole("Delete", { throwError: false });
      expect(button).toBeNull();
    });

    it("throws error when button not found and throwError is true", () => {
      render(<button type="button">Save</button>);
      expect(() => {
        findButtonByRole("Delete", { throwError: true });
      }).toThrow();
    });

    it("supports case-insensitive search", () => {
      render(<button type="button">SAVE DRAFT</button>);
      const button = findButtonByRole("save draft");
      expect(button).toBeInTheDocument();
    });

    it("supports partial name matching", () => {
      render(<button type="button">Save Invoice</button>);
      const button = findButtonByRole("Save");
      expect(button).toBeInTheDocument();
    });
  });

  describe("clickButton", () => {
    it("clicks button successfully", async () => {
      const mockHandler = sinon.stub();
      render(
        <button type="button" onClick={mockHandler}>
          Click me
        </button>
      );

      const button = findButtonByRole("Click me");
      await clickButton(button);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("handles async button click", async () => {
      const mockHandler = sinon.stub().mockResolvedValue({});
      render(
        <button type="button" onClick={mockHandler}>
          Async
        </button>
      );

      const button = findButtonByRole("Async");
      await clickButton(button);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe("assertButtonEnabled", () => {
    it("passes when button is enabled", () => {
      render(<button type="button">Save</button>);
      const button = findButtonByRole("Save");
      expect(() => {
        assertButtonEnabled(button);
      }).not.toThrow();
    });

    it("fails when button is disabled", () => {
      render(
        <button type="button" disabled>
          Save
        </button>
      );
      const button = findButtonByRole("Save");
      expect(() => {
        assertButtonEnabled(button);
      }).toThrow();
    });

    it("provides custom error message", () => {
      render(
        <button type="button" disabled>
          Save
        </button>
      );
      const button = findButtonByRole("Save");
      expect(() => {
        assertButtonEnabled(button, "Button should be enabled for submission");
      }).toThrow("Button should be enabled for submission");
    });
  });

  describe("assertButtonDisabled", () => {
    it("passes when button is disabled", () => {
      render(
        <button type="button" disabled>
          Save
        </button>
      );
      const button = findButtonByRole("Save");
      expect(() => {
        assertButtonDisabled(button);
      }).not.toThrow();
    });

    it("fails when button is enabled", () => {
      render(<button type="button">Save</button>);
      const button = findButtonByRole("Save");
      expect(() => {
        assertButtonDisabled(button);
      }).toThrow();
    });
  });

  describe("isButtonLoading", () => {
    it("detects loading state from disabled attribute", () => {
      const { rerender } = render(<button type="button">Save</button>);
      let button = findButtonByRole("Save");
      expect(isButtonLoading(button)).toBe(false);

      rerender(
        <button type="button" disabled>
          Saving...
        </button>
      );
      button = findButtonByRole("Saving");
      expect(isButtonLoading(button)).toBe(true);
    });

    it("detects loading state from aria-busy", () => {
      render(
        <button type="button" aria-busy="true">
          Loading
        </button>
      );
      const button = findButtonByRole("Loading");
      expect(isButtonLoading(button)).toBe(true);
    });

    it("detects loading spinner child element", () => {
      render(
        <button type="button">
          <span className="spinner" />
          Loading
        </button>
      );
      const button = findButtonByRole("Loading");
      expect(isButtonLoading(button)).toBe(true);
    });
  });

  describe("findAllButtons", () => {
    it("finds all buttons on page", () => {
      render(
        <>
          <button type="button">Save</button>
          <button type="button">Delete</button>
          <button type="button">Cancel</button>
        </>
      );

      const buttons = findAllButtons();
      expect(buttons).toHaveLength(3);
    });

    it("filters buttons by role name", () => {
      render(
        <>
          <button type="button">Save</button>
          <button type="button">Delete</button>
          <button type="button">Save Draft</button>
        </>
      );

      const saveButtons = findAllButtons({ name: /save/i });
      expect(saveButtons).toHaveLength(2);
    });
  });

  describe("getButtonVariant", () => {
    it("detects button variant from className", () => {
      render(
        <button type="button" className="btn btn-primary">
          Save
        </button>
      );
      const button = findButtonByRole("Save");
      const variant = getButtonVariant(button);
      expect(variant).toMatch(/primary/);
    });

    it("detects Button component variant from data-variant", () => {
      render(
        <button type="button" data-variant="outline">
          Cancel
        </button>
      );
      const button = findButtonByRole("Cancel");
      const variant = getButtonVariant(button);
      expect(variant).toBe("outline");
    });

    it("returns default variant when not found", () => {
      render(<button type="button">Click</button>);
      const button = findButtonByRole("Click");
      const variant = getButtonVariant(button);
      expect(variant).toMatch(/default|primary|button/);
    });
  });

  describe("waitForButtonEnabled", () => {
    it("waits for button to become enabled", async () => {
      let isDisabled = true;
      const { rerender } = render(
        <button type="button" disabled={isDisabled}>
          Save
        </button>
      );

      const button = findButtonByRole("Save");

      // Simulate async operation enabling the button
      setTimeout(() => {
        isDisabled = false;
        rerender(
          <button type="button" disabled={isDisabled}>
            Save
          </button>
        );
      }, 100);

      await waitForButtonEnabled(button, 1000);
      expect(button).toBeEnabled();
    });

    it("times out if button never enables", async () => {
      render(
        <button type="button" disabled>
          Save
        </button>
      );
      const button = findButtonByRole("Save");

      await expect(waitForButtonEnabled(button, 100)).rejects.toThrow();
    });
  });
});
