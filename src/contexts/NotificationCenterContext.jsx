import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  const persist = (next) => {
    // Validate and clean notifications before persisting
    const validNotifications = Array.isArray(next) ? next.filter((n) => n && typeof n === "object" && n.id) : [];
    setNotifications(validNotifications);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validNotifications));
    } catch {
      /* ignore storage errors */
    }
  };

  const normalize = (list = []) =>
    list.map((n) => ({
      id: n.id ?? uuid(),
      title: n.title ?? "Notification",
      message: n.message ?? "",
      time: n.time ?? new Date().toISOString(),
      unread: n.unread ?? true,
      link: n.link ?? null,
      type: n.type ?? "info",
    }));

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Temporarily disabled backend call until notifications endpoint is implemented
      // const res = await apiClient.get('/notifications');
      // const list = Array.isArray(res?.notifications) ? res.notifications : (Array.isArray(res) ? res : []);
      // persist(normalize(list));

      // Validate current notifications and sync with storage
      const currentNotifications = Array.isArray(notifications) ? notifications.filter((n) => n?.id) : [];

      // Fallback: seed with a couple of sample items if empty
      if (currentNotifications.length === 0) {
        const now = new Date();
        const oneMinAgo = new Date(now.getTime() - 60000);
        const seed = normalize([
          {
            title: "Welcome",
            message: "You are all set!",
            time: now.toISOString(),
            unread: true,
          },
          {
            title: "Tip",
            message: "Use the global search to find anything.",
            time: oneMinAgo.toISOString(),
            unread: false,
          },
        ]);
        persist(seed);
      }
    } catch (err) {
      console.warn("Notification fetch error (expected during development):", err);
      // Fallback: seed with a couple of sample items if empty
      const currentNotifications = Array.isArray(notifications) ? notifications.filter((n) => n?.id) : [];
      if (currentNotifications.length === 0) {
        const now = new Date();
        const oneMinAgo = new Date(now.getTime() - 60000);
        const seed = normalize([
          {
            title: "Welcome",
            message: "You are all set!",
            time: now.toISOString(),
            unread: true,
          },
          {
            title: "Tip",
            message: "Use the global search to find anything.",
            time: oneMinAgo.toISOString(),
            unread: false,
          },
        ]);
        persist(seed);
      }
    } finally {
      setLoading(false);
    }
  }, [notifications, normalize, persist]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    // Temporarily disabled until notifications endpoint is implemented
    // try { await apiClient.patch(`/notifications/${id}/read`, {}); } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    // Temporarily disabled until notifications endpoint is implemented
    // try { await apiClient.patch('/notifications/read-all', {}); } catch {}
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

  // Sync notifications with storage to fix any corruption
  const syncWithStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        persist([]);
        return;
      }
      const parsed = JSON.parse(raw);
      const validNotifications = Array.isArray(parsed) ? parsed.filter((n) => n && typeof n === "object" && n.id) : [];
      persist(validNotifications);
    } catch {
      // If storage is corrupted, clear it and reset
      persist([]);
    }
  }, [
    // If storage is corrupted, clear it and reset
    persist,
  ]);

  useEffect(() => {
    fetchNotifications();
    // Sync on mount to catch any storage corruption
    syncWithStorage();
  }, [
    fetchNotifications, // Sync on mount to catch any storage corruption
    syncWithStorage,
  ]);

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
