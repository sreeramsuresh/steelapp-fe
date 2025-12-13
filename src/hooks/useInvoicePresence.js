/**
 * useInvoicePresence - Hook for tracking invoice edit sessions
 *
 * Provides soft presence tracking: shows who else is viewing/editing an invoice.
 * Advisory only - does not block any actions.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../services/api";
import { tokenUtils } from "../services/axiosApi";

const HEARTBEAT_INTERVAL = 45000; // 45 seconds
const FETCH_INTERVAL = 30000; // 30 seconds

export function useInvoicePresence(invoiceId, mode = "view") {
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const heartbeatRef = useRef(null);
  const fetchRef = useRef(null);
  const currentUser = tokenUtils.getUser();

  // Start session
  const startSession = useCallback(async () => {
    if (!invoiceId) return;
    try {
      await apiClient.post(`/invoices/${invoiceId}/edit-sessions/start`, {
        mode,
        session_id: sessionId,
      });
    } catch (err) {
      console.warn("[Presence] Failed to start session:", err.message);
    }
  }, [invoiceId, mode, sessionId]);

  // Heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!invoiceId) return;
    try {
      await apiClient.post(`/invoices/${invoiceId}/edit-sessions/heartbeat`, {
        session_id: sessionId,
      });
    } catch (err) {
      console.warn("[Presence] Heartbeat failed:", err.message);
    }
  }, [invoiceId, sessionId]);

  // End session
  const endSession = useCallback(async () => {
    if (!invoiceId) return;
    try {
      await apiClient.post(`/invoices/${invoiceId}/edit-sessions/end`, {
        session_id: sessionId,
      });
    } catch (err) {
      console.warn("[Presence] Failed to end session:", err.message);
    }
  }, [invoiceId, sessionId]);

  // Fetch active sessions
  const fetchSessions = useCallback(async () => {
    if (!invoiceId) return;
    try {
      const response = await apiClient.get(
        `/invoices/${invoiceId}/edit-sessions`,
      );
      setActiveSessions(response || []);
    } catch (err) {
      console.warn("[Presence] Failed to fetch sessions:", err.message);
    }
  }, [invoiceId]);

  // Filter out current user's sessions
  const otherSessions = activeSessions.filter(
    (s) => String(s.userId) !== String(currentUser?.id),
  );

  // Lifecycle: start session, heartbeat, fetch sessions
  useEffect(() => {
    if (!invoiceId) return;

    // Start session immediately
    startSession();
    fetchSessions();

    // Set up heartbeat interval
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Set up fetch interval
    fetchRef.current = setInterval(fetchSessions, FETCH_INTERVAL);

    // Cleanup on unmount or invoice change
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (fetchRef.current) clearInterval(fetchRef.current);
      endSession();
    };
  }, [invoiceId, startSession, sendHeartbeat, endSession, fetchSessions]);

  // Update mode if it changes
  const updateMode = useCallback(
    async (newMode) => {
      if (!invoiceId) return;
      try {
        await apiClient.post(`/invoices/${invoiceId}/edit-sessions/start`, {
          mode: newMode,
          session_id: sessionId,
        });
      } catch (err) {
        console.warn("[Presence] Failed to update mode:", err.message);
      }
    },
    [invoiceId, sessionId],
  );

  return {
    activeSessions,
    otherSessions,
    sessionId,
    updateMode,
    refetchSessions: fetchSessions,
  };
}

export default useInvoicePresence;
