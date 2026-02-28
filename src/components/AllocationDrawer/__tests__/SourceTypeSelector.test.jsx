/**
 * SourceTypeSelector Component Tests
 *
 * Tests radio button group for selecting stock source type
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  Package: (props) => <span data-testid="icon-package" {...props} />,
  Ship: (props) => <span data-testid="icon-ship" {...props} />,
  Truck: (props) => <span data-testid="icon-truck" {...props} />,
}));

import SourceTypeSelector from "../SourceTypeSelector";

describe("SourceTypeSelector", () => {
  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = {
      value: "WAREHOUSE",
      onChange: vi.fn(),
      disabled: false,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render source type selector", () => {
      render(<SourceTypeSelector {...defaultProps} />);
      expect(screen.getByTestId("source-type-selector")).toBeInTheDocument();
    });

    it("should render all three source type options", () => {
      render(<SourceTypeSelector {...defaultProps} />);
      expect(screen.getByText("Warehouse")).toBeInTheDocument();
      expect(screen.getByText("Local Drop-Ship")).toBeInTheDocument();
      expect(screen.getByText("Import Drop-Ship")).toBeInTheDocument();
    });

    it("should render descriptions for each option", () => {
      render(<SourceTypeSelector {...defaultProps} />);
      expect(screen.getByText("From existing stock")).toBeInTheDocument();
      expect(screen.getByText("Direct from local supplier")).toBeInTheDocument();
      expect(screen.getByText("Direct from import")).toBeInTheDocument();
    });

    it("should render Source Type label with required indicator", () => {
      render(<SourceTypeSelector {...defaultProps} />);
      expect(screen.getByText("Source Type")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render three radio buttons", () => {
      render(<SourceTypeSelector {...defaultProps} />);
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(3);
    });
  });

  describe("Selection", () => {
    it("should have WAREHOUSE selected by default", () => {
      render(<SourceTypeSelector {...defaultProps} />);
      const warehouseRadio = screen.getByTestId("source-type-radio-warehouse");
      expect(warehouseRadio).toBeChecked();
    });

    it("should call onChange when a different source type is selected", async () => {
      const user = userEvent.setup();
      render(<SourceTypeSelector {...defaultProps} />);

      const localRadio = screen.getByTestId("source-type-radio-local_drop_ship");
      await user.click(localRadio);

      expect(defaultProps.onChange).toHaveBeenCalledWith("LOCAL_DROP_SHIP");
    });

    it("should call onChange with IMPORT_DROP_SHIP when import option selected", async () => {
      const user = userEvent.setup();
      render(<SourceTypeSelector {...defaultProps} />);

      const importRadio = screen.getByTestId("source-type-radio-import_drop_ship");
      await user.click(importRadio);

      expect(defaultProps.onChange).toHaveBeenCalledWith("IMPORT_DROP_SHIP");
    });

    it("should reflect the selected value prop", () => {
      const props = { ...defaultProps, value: "LOCAL_DROP_SHIP" };
      render(<SourceTypeSelector {...props} />);
      const localRadio = screen.getByTestId("source-type-radio-local_drop_ship");
      expect(localRadio).toBeChecked();
    });
  });

  describe("Disabled State", () => {
    it("should disable all radio buttons when disabled prop is true", () => {
      const props = { ...defaultProps, disabled: true };
      render(<SourceTypeSelector {...props} />);
      const radios = screen.getAllByRole("radio");
      for (const radio of radios) {
        expect(radio).toBeDisabled();
      }
    });

    it("should not call onChange when disabled and option is clicked", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, disabled: true };
      render(<SourceTypeSelector {...props} />);

      const localRadio = screen.getByTestId("source-type-radio-local_drop_ship");
      await user.click(localRadio);

      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });
  });
});
