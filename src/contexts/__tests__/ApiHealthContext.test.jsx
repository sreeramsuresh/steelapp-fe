import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiHealthProvider, reportApiUnhealthy, useApiHealthContext } from "../ApiHealthContext";

function TestConsumer() {
  const health = useApiHealthContext();
  return (
    <div>
      <span data-testid="isHealthy">{String(health.isHealthy)}</span>
      <span data-testid="isChecking">{String(health.isChecking)}</span>
      <span data-testid="error">{String(health.error ?? "")}</span>
      <span data-testid="isDismissed">{String(health.isDismissed)}</span>
      <span data-testid="lastChecked">{health.lastChecked ? "checked" : "never"}</span>
      <button type="button" data-testid="checkNow" onClick={health.checkNow}>
        Check
      </button>
      <button type="button" data-testid="dismiss" onClick={health.dismiss}>
        Dismiss
      </button>
    </div>
  );
}

describe("ApiHealthContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock fetch to return healthy by default
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("provides default healthy state", () => {
    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    expect(screen.getByTestId("isHealthy")).toHaveTextContent("true");
    expect(screen.getByTestId("isDismissed")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("performs initial health check after 1 second delay", async () => {
    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    expect(global.fetch).not.toHaveBeenCalled();

    // Advance past the initial 1s delay
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(global.fetch).toHaveBeenCalledWith("/health", expect.objectContaining({ method: "GET" }));
  });

  it("sets healthy state on successful health check", async () => {
    global.fetch.mockResolvedValue({ ok: true });

    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    // Advance past 1s initial delay and flush async
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(screen.getByTestId("isHealthy")).toHaveTextContent("true");
    expect(screen.getByTestId("lastChecked")).toHaveTextContent("checked");
  });

  it("sets unhealthy state on failed health check", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 503 });

    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(screen.getByTestId("isHealthy")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("Server returned status 503");
  });

  it("sets unhealthy state on network error", async () => {
    global.fetch.mockRejectedValue(new Error("Failed to fetch"));

    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(screen.getByTestId("isHealthy")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("Cannot connect to server");
  });

  it("handles abort timeout error", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    global.fetch.mockRejectedValue(abortError);

    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(screen.getByTestId("error")).toHaveTextContent("Server is not responding (timeout)");
  });

  it("dismiss sets isDismissed to true", async () => {
    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    act(() => {
      screen.getByTestId("dismiss").click();
    });

    expect(screen.getByTestId("isDismissed")).toHaveTextContent("true");
  });

  it("reportApiUnhealthy sets unhealthy state immediately", async () => {
    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    act(() => {
      reportApiUnhealthy("Gateway down");
    });

    expect(screen.getByTestId("isHealthy")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("Gateway down");
    // isDismissed should be reset to false
    expect(screen.getByTestId("isDismissed")).toHaveTextContent("false");
  });

  it("reportApiUnhealthy resets dismissed state", async () => {
    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    // First dismiss
    act(() => {
      screen.getByTestId("dismiss").click();
    });
    expect(screen.getByTestId("isDismissed")).toHaveTextContent("true");

    // Then report unhealthy - should un-dismiss
    act(() => {
      reportApiUnhealthy("Server crashed");
    });
    expect(screen.getByTestId("isDismissed")).toHaveTextContent("false");
  });

  it("checkNow triggers an immediate health check", async () => {
    render(
      <ApiHealthProvider>
        <TestConsumer />
      </ApiHealthProvider>
    );

    // Clear initial call tracking
    global.fetch.mockClear();

    await act(async () => {
      screen.getByTestId("checkNow").click();
    });

    expect(global.fetch).toHaveBeenCalledWith("/health", expect.any(Object));
  });

  it("throws error when useApiHealthContext is used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow("useApiHealthContext must be used within ApiHealthProvider");

    spy.mockRestore();
  });
});
