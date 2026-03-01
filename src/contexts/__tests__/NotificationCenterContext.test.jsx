import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCenterProvider, useNotificationCenter, useNotifications } from "../NotificationCenterContext";

// Mock dependencies
vi.mock("../../services/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { notifications: [] } }),
    patch: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn().mockReturnValue(false),
  },
}));

vi.mock("../../utils/uuid", () => ({
  uuid: vi.fn().mockReturnValue("test-uuid-001"),
}));

import { api } from "../../services/api";
import { authService } from "../../services/axiosAuthService";

function TestConsumer() {
  const ctx = useNotifications();
  return (
    <div>
      <span data-testid="notifications">{JSON.stringify(ctx.notifications)}</span>
      <span data-testid="unreadCount">{ctx.unreadCount}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="error">{ctx.error}</span>
      <button
        type="button"
        data-testid="addNotification"
        onClick={() =>
          ctx.addNotification({
            id: "notif-1",
            title: "Test",
            message: "Hello",
          })
        }
      >
        Add
      </button>
      <button type="button" data-testid="removeNotification" onClick={() => ctx.removeNotification("notif-1")}>
        Remove
      </button>
      <button type="button" data-testid="markAsRead" onClick={() => ctx.markAsRead("notif-1")}>
        Read
      </button>
      <button type="button" data-testid="markAllAsRead" onClick={ctx.markAllAsRead}>
        Read All
      </button>
    </div>
  );
}

describe("NotificationCenterContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default: no permission so auto-fetch is skipped
    authService.hasPermission.mockReturnValue(false);
  });

  it("provides default empty state", () => {
    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    expect(screen.getByTestId("notifications")).toHaveTextContent("[]");
    expect(screen.getByTestId("unreadCount")).toHaveTextContent("0");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("loads initial notifications from localStorage", () => {
    const stored = [{ id: "a", title: "Stored", message: "From storage", unread: true }];
    localStorage.setItem("steelapp.notifications", JSON.stringify(stored));

    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    const parsed = JSON.parse(screen.getByTestId("notifications").textContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("a");
  });

  it("handles invalid localStorage data gracefully", () => {
    localStorage.setItem("steelapp.notifications", "not-json{{{");

    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    expect(screen.getByTestId("notifications")).toHaveTextContent("[]");
  });

  it("handles non-array localStorage data gracefully", () => {
    localStorage.setItem("steelapp.notifications", JSON.stringify({ not: "array" }));

    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    expect(screen.getByTestId("notifications")).toHaveTextContent("[]");
  });

  it("adds a notification and persists to localStorage", () => {
    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    act(() => {
      screen.getByTestId("addNotification").click();
    });

    const parsed = JSON.parse(screen.getByTestId("notifications").textContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("Test");
    expect(parsed[0].message).toBe("Hello");

    // Verify persistence
    const stored = JSON.parse(localStorage.getItem("steelapp.notifications"));
    expect(stored).toHaveLength(1);
  });

  it("removes a notification", () => {
    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    // Add first
    act(() => {
      screen.getByTestId("addNotification").click();
    });

    expect(JSON.parse(screen.getByTestId("notifications").textContent)).toHaveLength(1);

    // Remove
    act(() => {
      screen.getByTestId("removeNotification").click();
    });

    expect(screen.getByTestId("notifications")).toHaveTextContent("[]");
  });

  it("marks a notification as read", () => {
    // Pre-seed with an unread notification
    const stored = [
      {
        id: "notif-1",
        title: "Test",
        message: "Hi",
        unread: true,
        time: "2025-01-01",
        type: "info",
      },
    ];
    localStorage.setItem("steelapp.notifications", JSON.stringify(stored));

    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    expect(screen.getByTestId("unreadCount")).toHaveTextContent("1");

    act(() => {
      screen.getByTestId("markAsRead").click();
    });

    expect(screen.getByTestId("unreadCount")).toHaveTextContent("0");
  });

  it("marks all notifications as read", () => {
    const stored = [
      {
        id: "a",
        title: "A",
        message: "",
        unread: true,
        time: "2025-01-01",
        type: "info",
      },
      {
        id: "b",
        title: "B",
        message: "",
        unread: true,
        time: "2025-01-01",
        type: "info",
      },
    ];
    localStorage.setItem("steelapp.notifications", JSON.stringify(stored));

    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    expect(screen.getByTestId("unreadCount")).toHaveTextContent("2");

    act(() => {
      screen.getByTestId("markAllAsRead").click();
    });

    expect(screen.getByTestId("unreadCount")).toHaveTextContent("0");
  });

  it("computes unreadCount correctly", () => {
    const stored = [
      {
        id: "a",
        title: "A",
        message: "",
        unread: true,
        time: "2025-01-01",
        type: "info",
      },
      {
        id: "b",
        title: "B",
        message: "",
        unread: false,
        time: "2025-01-01",
        type: "info",
      },
      {
        id: "c",
        title: "C",
        message: "",
        unread: true,
        time: "2025-01-01",
        type: "info",
      },
    ];
    localStorage.setItem("steelapp.notifications", JSON.stringify(stored));

    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    expect(screen.getByTestId("unreadCount")).toHaveTextContent("2");
  });

  it("fetches from API when permission granted", async () => {
    authService.hasPermission.mockReturnValue(true);
    api.get.mockResolvedValue({
      data: {
        notifications: [{ id: "remote-1", title: "Remote", message: "From API" }],
      },
    });

    render(
      <NotificationCenterProvider>
        <TestConsumer />
      </NotificationCenterProvider>
    );

    await waitFor(() => {
      const parsed = JSON.parse(screen.getByTestId("notifications").textContent);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Remote");
    });

    expect(api.get).toHaveBeenCalledWith("/notifications", expect.any(Object));
  });

  it("useNotificationCenter is an alias for useNotifications", () => {
    expect(useNotificationCenter).toBe(useNotifications);
  });

  it("throws error when useNotifications is used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow("useNotifications must be used within NotificationCenterProvider");

    spy.mockRestore();
  });
});
