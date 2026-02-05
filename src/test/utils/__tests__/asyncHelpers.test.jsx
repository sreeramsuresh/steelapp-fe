/**
 * Tests for asyncHelpers.js
 * Verifies async operation and timing utilities
 */

/* eslint-disable local-rules/no-dead-button */
// Test fixtures intentionally render buttons without handlers to test utility functions

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
import sinon from 'sinon';
clickAndWaitForApi,
  createTimer,
  performAsyncButtonClick,
  pollForCondition,
  retryUntil,
  waitForApiCall,
  waitForAttributeChange,
  waitForCallback,
  waitForDebounce,
  waitForLoadingEnd,
  waitForLoadingStart,
} from "../asyncHelpers"

describe("asyncHelpers", () =>
{
  describe("waitForApiCall", () => {
    it("waits for mock function to be called", async () => {
      const mockApi = sinon.stub().mockResolvedValue({ success: true });

      setTimeout(() => {
        mockApi();
      }, 100);

      await waitForApiCall(mockApi);
      expect(mockApi).toHaveBeenCalled();
    });

    it("times out if API call never happens", async () => {
      const mockApi = sinon.stub();

      await expect(waitForApiCall(mockApi, { timeout: 100 })).rejects.toThrow();
    });

    it("checks call arguments", async () => {
      const mockApi = sinon.stub().mockResolvedValue({});

      setTimeout(() => {
        mockApi({ id: 123 });
      }, 50);

      await waitForApiCall(mockApi, { expectedArgs: { id: 123 } });
      expect(mockApi).toHaveBeenCalledWith({ id: 123 });
    });
  });

  describe("waitForDebounce", () => {
    it("waits for debounce delay", async () => {
      const callback = sinon.stub();
      const delayMs = 200;
      const timer = createTimer();

      setTimeout(() => callback(), delayMs);

      await waitForDebounce(delayMs);
      expect(callback).toHaveBeenCalled();
      expect(timer.elapsed()).toBeGreaterThanOrEqual(delayMs);
    });

    it("accounts for debounce delay variability", async () => {
      const timer = createTimer();
      await waitForDebounce(100, { variability: 50 });
      expect(timer.elapsed()).toBeGreaterThanOrEqual(100);
    });
  });

  describe("performAsyncButtonClick", () => {
    it("clicks button and checks state change", async () => {
      const stateChecker = sinon.stub().mockResolvedValue(true);

      const AsyncComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false);

        const handleClick = async () => {
          setIsLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 100));
          setIsLoading(false);
        };

        return (
          <button type="button" onClick={handleClick} disabled={isLoading}>
            Async Action
          </button>
        );
      };

      render(<AsyncComponent />);
      const button = screen.getByRole("button");

      await performAsyncButtonClick(button, stateChecker);

      expect(stateChecker).toHaveBeenCalled();
      expect(button.disabled).toBe(false); // Should be enabled again
    });

    it("times out if state never changes", async () => {
      const stateChecker = sinon.stub().mockResolvedValue(false);

      render(<button type="button">Action</button>);
      const button = screen.getByRole("button");

      await expect(performAsyncButtonClick(button, stateChecker, { timeout: 100 })).rejects.toThrow();
    });
  });

  describe("waitForLoadingStart", () => {
    it("waits for loading element to appear", async () => {
      const LoadingComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false);
        return (
          <>
            <button type="button" onClick={() => setIsLoading(true)}>
              Start Loading
            </button>
            {isLoading && <div className="spinner">Loading...</div>}
          </>
        );
      };

      render(<LoadingComponent />);
      const button = screen.getByRole("button");

      await userEvent.click(button);
      await waitForLoadingStart('[class*="spinner"]');

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("times out if loading never starts", async () => {
      render(<button type="button">No Loading</button>);

      await expect(waitForLoadingStart('[class*="spinner"]', 100)).rejects.toThrow();
    });
  });

  describe("waitForLoadingEnd", () => {
    it("waits for loading element to disappear", async () => {
      const LoadingComponent = () => {
        const [isLoading, setIsLoading] = React.useState(true);
        React.useEffect(() => {
          setTimeout(() => setIsLoading(false), 100);
        }, []);

        return (
          <>
            {isLoading && <div className="spinner">Loading...</div>}
            {!isLoading && <div>Complete</div>}
          </>
        );
      };

      render(<LoadingComponent />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await waitForLoadingEnd('[class*="spinner"]');
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("retryUntil", () => {
    it("retries condition until it passes", async () => {
      let attempts = 0;
      const condition = vi.fn(async () => {
        attempts++;
        return attempts >= 3;
      });

      const result = await retryUntil(condition, { maxRetries: 5 });

      expect(result).toBe(true);
      expect(attempts).toBe(3);
    });

    it("fails if max retries exceeded", async () => {
      const condition = sinon.stub().mockResolvedValue(false);

      await expect(retryUntil(condition, { maxRetries: 2, delayMs: 10 })).rejects.toThrow();

      expect(condition).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("stops early on success", async () => {
      const condition = sinon.stub().mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await retryUntil(condition, {
        maxRetries: 5,
        delayMs: 10,
      });

      expect(result).toBe(true);
      expect(condition).toHaveBeenCalledTimes(2); // Only 2 calls, not 6
    });
  });

  describe("pollForCondition", () => {
    it("polls until condition is true", async () => {
      let value = 0;
      const condition = () => {
        value++;
        return value >= 3;
      };

      const result = await pollForCondition(condition, { intervalMs: 50 });
      expect(result).toBe(true);
      expect(value).toBeGreaterThanOrEqual(3);
    });

    it("times out if condition never becomes true", async () => {
      const condition = () => false;

      await expect(pollForCondition(condition, { timeoutMs: 100, intervalMs: 20 })).rejects.toThrow();
    });
  });

  describe("waitForCallback", () => {
    it("waits for callback to be called", async () => {
      const callback = sinon.stub();

      setTimeout(() => {
        callback("result");
      }, 100);

      await waitForCallback(callback, { timeout: 500 });
      expect(callback).toHaveBeenCalledWith("result");
    });

    it("times out if callback never fires", async () => {
      const callback = sinon.stub();

      await expect(waitForCallback(callback, { timeout: 100 })).rejects.toThrow();
    });
  });

  describe("waitForAttributeChange", () => {
    it("waits for element attribute to change", async () => {
      const { rerender } = render(
        <button type="button" aria-busy="false">
          Save
        </button>
      );

      const button = screen.getByRole("button");

      setTimeout(() => {
        rerender(
          <button type="button" aria-busy="true">
            Save
          </button>
        );
      }, 100);

      await waitForAttributeChange(button, "aria-busy", "true");
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("times out if attribute never changes", async () => {
      render(
        <button type="button" aria-busy="false">
          Save
        </button>
      );
      const button = screen.getByRole("button");

      await expect(waitForAttributeChange(button, "aria-busy", "true", 100)).rejects.toThrow();
    });
  });

  describe("createTimer", () => {
    it("measures elapsed time", async () => {
      const timer = createTimer();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(200); // Some margin
    });

    it("can be reset", async () => {
      const timer = createTimer();

      await new Promise((resolve) => setTimeout(resolve, 50));
      timer.reset();

      await new Promise((resolve) => setTimeout(resolve, 50));
      const elapsed = timer.elapsed();

      expect(elapsed).toBeGreaterThanOrEqual(50);
      expect(elapsed).toBeLessThan(100);
    });

    it("can mark checkpoints", async () => {
      const timer = createTimer();

      await new Promise((resolve) => setTimeout(resolve, 50));
      timer.mark("first");

      await new Promise((resolve) => setTimeout(resolve, 50));
      timer.mark("second");

      const firstMark = timer.elapsed("first");
      const secondMark = timer.elapsed("second");

      expect(firstMark).toBeGreaterThanOrEqual(50);
      expect(secondMark).toBeGreaterThanOrEqual(100);
      expect(secondMark).toBeGreaterThan(firstMark);
    });
  });

  describe("clickAndWaitForApi", () => {
    it("clicks button and waits for API call", async () => {
      const mockApi = sinon.stub().mockResolvedValue({ success: true });

      const AsyncComponent = () => {
        const handleClick = async () => {
          await mockApi();
        };
        return (
          <button type="button" onClick={handleClick}>
            Save
          </button>
        );
      };

      render(<AsyncComponent />);
      const button = screen.getByRole("button");

      // Simulate delayed API call
      setTimeout(() => mockApi(), 100);

      await clickAndWaitForApi(button, mockApi);

      expect(mockApi).toHaveBeenCalled();
    });
  });
}
)
