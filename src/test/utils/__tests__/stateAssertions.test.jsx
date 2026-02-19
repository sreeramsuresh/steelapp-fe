/**
 * Tests for stateAssertions.js
 * Verifies observable state change assertions
 */

/* eslint-disable local-rules/no-dead-button */
// Test fixtures render buttons without handlers to test assertion failure paths

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import {
  assertErrorToast,
  assertFormErrorAppears,
  assertFormErrorDisappears,
  assertListItemAdded,
  assertListItemRemoved,
  assertModalCloses,
  assertModalOpens,
  assertStateChange,
  assertSuccessToast,
  assertTableContainsRow,
  assertTableRowCountChanges,
  assertToastAppears,
  waitForLoadingComplete,
} from "../stateAssertions";

describe("stateAssertions", () => {
  describe("assertModalOpens", () => {
    it("detects when modal opens with title", async () => {
      const ModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <>
            <button type="button" onClick={() => setIsOpen(true)}>
              Open Modal
            </button>
            {isOpen && (
              <div role="dialog">
                <h2>Create Invoice</h2>
              </div>
            )}
          </>
        );
      };

      render(<ModalComponent />);
      const button = screen.getByRole("button", { name: "Open Modal" });
      await userEvent.click(button);

      await assertModalOpens(/create invoice/i);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("times out if modal does not open", async () => {
      render(<button type="button">No Modal</button>);

      await expect(assertModalOpens(/create invoice/i, 100)).rejects.toThrow();
    });
  });

  describe("assertModalCloses", () => {
    it("detects when modal closes", async () => {
      const ModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        return (
          <>
            {isOpen && (
              <div role="dialog">
                <button type="button" onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </div>
            )}
          </>
        );
      };

      render(<ModalComponent />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      const closeButton = screen.getByRole("button", { name: "Close" });
      await userEvent.click(closeButton);

      await assertModalCloses(500);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("assertToastAppears", () => {
    it("detects success toast notification", async () => {
      const ToastComponent = () => {
        const [show, setShow] = React.useState(false);
        return (
          <>
            <button type="button" onClick={() => setShow(true)}>
              Trigger Toast
            </button>
            {show && <output className="toast toast-success">Success: Operation completed</output>}
          </>
        );
      };

      render(<ToastComponent />);
      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertToastAppears(/operation completed/i, "success");
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("times out if toast does not appear", async () => {
      render(<button type="button">No Toast</button>);

      await expect(assertToastAppears(/success/i, "success", 100)).rejects.toThrow();
    });
  });

  describe("assertSuccessToast", () => {
    it("detects success message without type specification", async () => {
      const SuccessComponent = () => {
        const [show, setShow] = React.useState(false);
        return (
          <>
            <button type="button" onClick={() => setShow(true)}>
              Save
            </button>
            {show && <div className="alert-success">Saved successfully</div>}
          </>
        );
      };

      render(<SuccessComponent />);
      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertSuccessToast(/saved/i);
    });
  });

  describe("assertErrorToast", () => {
    it("detects error message", async () => {
      const ErrorComponent = () => {
        const [show, setShow] = React.useState(false);
        return (
          <>
            <button type="button" onClick={() => setShow(true)}>
              Fail
            </button>
            {show && <div className="alert-error">Error: Network failed</div>}
          </>
        );
      };

      render(<ErrorComponent />);
      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertErrorToast(/network failed/i);
    });
  });

  describe("assertFormErrorAppears", () => {
    it("detects form validation error", async () => {
      const FormComponent = () => {
        const [errors, setErrors] = React.useState({});
        return (
          <>
            <input placeholder="Email" />
            <button type="button" onClick={() => setErrors({ email: "Invalid email format" })}>
              Validate
            </button>
            {errors.email && <span id="email-error">{errors.email}</span>}
          </>
        );
      };

      render(<FormComponent />);
      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertFormErrorAppears("email", "Invalid email format");
    });
  });

  describe("assertFormErrorDisappears", () => {
    it("detects when form error is cleared", async () => {
      const FormComponent = () => {
        const [errors, setErrors] = React.useState({ email: "Invalid" });
        return (
          <>
            <input placeholder="Email" />
            {errors.email && <span id="email-error">{errors.email}</span>}
            <button type="button" onClick={() => setErrors({})}>
              Clear Error
            </button>
          </>
        );
      };

      render(<FormComponent />);
      expect(screen.getByText("Invalid")).toBeInTheDocument();

      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertFormErrorDisappears("email");
    });
  });

  describe("assertListItemAdded", () => {
    it("detects new item in list", async () => {
      const ListComponent = () => {
        const [items, setItems] = React.useState(["Item 1"]);
        return (
          <>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button" onClick={() => setItems([...items, "Item 2"])}>
              Add Item
            </button>
          </>
        );
      };

      render(<ListComponent />);
      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertListItemAdded(/Item 2/);
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });

  describe("assertListItemRemoved", () => {
    it("detects when item is removed from list", async () => {
      const ListComponent = () => {
        const [items, setItems] = React.useState(["Item 1", "Item 2"]);
        return (
          <>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button" onClick={() => setItems(items.filter((i) => i !== "Item 1"))}>
              Remove
            </button>
          </>
        );
      };

      render(<ListComponent />);
      expect(screen.getByText("Item 1")).toBeInTheDocument();

      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertListItemRemoved(/Item 1/);
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    });
  });

  describe("assertTableRowCountChanges", () => {
    it("detects when table row count changes", async () => {
      const TableComponent = () => {
        const [rows, setRows] = React.useState([{ id: 1, name: "Row 1" }]);
        return (
          <>
            <table>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={() => setRows([...rows, { id: 2, name: "Row 2" }])}>
              Add Row
            </button>
          </>
        );
      };

      render(<TableComponent />);
      const button = screen.getByRole("button");
      await userEvent.click(button);

      await assertTableRowCountChanges(2, "=", "table");
    });
  });

  describe("assertTableContainsRow", () => {
    it("detects row in table", async () => {
      render(
        <table>
          <tbody>
            <tr>
              <td>Product A</td>
              <td>100</td>
            </tr>
            <tr>
              <td>Product B</td>
              <td>200</td>
            </tr>
          </tbody>
        </table>
      );

      await assertTableContainsRow(/Product A/);
      expect(screen.getByText("Product A")).toBeInTheDocument();
    });
  });

  describe("waitForLoadingComplete", () => {
    it("waits for loading spinner to disappear", async () => {
      const LoadingComponent = () => {
        const [isLoading, setIsLoading] = React.useState(true);
        React.useEffect(() => {
          setTimeout(() => setIsLoading(false), 100);
        }, []);

        return (
          <>
            {isLoading && <div className="spinner">Loading...</div>}
            {!isLoading && <div>Loaded</div>}
          </>
        );
      };

      render(<LoadingComponent />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await waitForLoadingComplete();
      expect(screen.getByText("Loaded")).toBeInTheDocument();
    });
  });

  describe("assertStateChange", () => {
    it("asserts custom state change", async () => {
      const StateComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <>
            <div data-testid="count">{count}</div>
            <button type="button" onClick={() => setCount(count + 1)}>
              Increment
            </button>
          </>
        );
      };

      render(<StateComponent />);
      const button = screen.getByRole("button");

      // Click first, then assert state change
      await userEvent.click(button);

      await assertStateChange(() => parseInt(screen.getByTestId("count").textContent, 10), 1);

      // State should have changed
      expect(parseInt(screen.getByTestId("count").textContent, 10)).toBe(1);
    });
  });
});
