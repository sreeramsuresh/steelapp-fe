import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { authService } from "../services/axiosAuthService";
import { uuid } from "../utils/uuid";

const NotificationCenterContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationCenterProvider");
  return ctx;
};

const STORAGE_KEY = "steelapp.notifications";

export const NotificationCenterProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Validate that parsed data is an array
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unreadCount = useMemo(() => {
    // Ensure notifications is always an array before filtering
    const validNotifications = Array.isArray(notifications) ? notifications : [];
    return validNotifications.filter((n) => n?.unread).length;
  }, [notifications]);

  const persist = useCallback((next) => {
    // Validate and clean notifications before persisting
    const validNotifications = Array.isArray(next) ? next.filter((n) => n && typeof n === "object" && n.id) : [];
    setNotifications(validNotifications);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validNotifications));
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const normalize = useCallback(
    (list = []) =>
      list.map((n) => ({
        id: n.id ?? uuid(),
        title: n.title ?? "Notification",
        message: n.message ?? "",
        time: n.time ?? new Date().toISOString(),
        unread: n.unread ?? true,
        link: n.link ?? null,
        type: n.type ?? "info",
      })),
    []
  );

  const fetchNotifications = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/notifications", { signal });
        const data = res.data || res;
        const list = Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : [];
        persist(normalize(list));
      } catch (err) {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        // Fallback: seed with sample items if empty
        setNotifications((currentNotifications) => {
          const validCurrent = Array.isArray(currentNotifications) ? currentNotifications.filter((n) => n?.id) : [];
          if (validCurrent.length === 0) {
            const now = new Date();
            const oneMinAgo = new Date(now.getTime() - 60000);
            const seed = normalize([
              { title: "Welcome", message: "You are all set!", time: now.toISOString(), unread: true },
              {
                title: "Tip",
                message: "Use the global search to find anything.",
                time: oneMinAgo.toISOString(),
                unread: false,
              },
            ]);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
            } catch {
              /* ignore */
            }
            return seed;
          }
          return validCurrent;
        });
      } finally {
        setLoading(false);
      }
    },
    [normalize, persist]
  );

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch {
      /* best-effort */
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await api.patch("/notifications/read-all", {});
    } catch {
      /* best-effort */
    }
  }, []);

  const addNotification = useCallback(
    (notif) => {
      const next = [{ ...normalize([notif])[0] }, ...notifications];
      persist(next);
    },
    [notifications, normalize, persist]
  );

  const removeNotification = useCallback(
    (id) => {
      persist(notifications.filter((n) => n.id !== id));
    },
    [notifications, persist]
  );

  const fetchRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    if (!authService.hasPermission("notifications", "read")) return;
    const controller = new AbortController();
    fetchRef.current(controller.signal);
    return () => controller.abort();
  }, []); // mount-only — prevents re-firing on dependency changes

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
  };

  return <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>;
};

// Backward-compatible alias for older code paths
export const useNotificationCenter = useNotifications;
