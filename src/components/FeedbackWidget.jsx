/**
 * FeedbackWidget.jsx
 * Floating feedback button with popover for submitting user feedback
 */
import { MessageSquare, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/axiosApi";
import { getRouteLabel } from "../utils/routeLabels";

const MAX_CHARS = 2000;
const MAX_LOG_ENTRIES = 20;

// Global buffers for console errors and failed network requests
const consoleErrors = [];
const failedRequests = [];

// Intercept console.error and console.warn
const origError = console.error;
const origWarn = console.warn;
console.error = (...args) => {
  consoleErrors.push({ level: "error", message: args.map(String).join(" "), ts: Date.now() });
  if (consoleErrors.length > MAX_LOG_ENTRIES) consoleErrors.shift();
  origError.apply(console, args);
};
console.warn = (...args) => {
  consoleErrors.push({ level: "warn", message: args.map(String).join(" "), ts: Date.now() });
  if (consoleErrors.length > MAX_LOG_ENTRIES) consoleErrors.shift();
  origWarn.apply(console, args);
};

// Intercept failed fetch/XHR responses
const origFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const res = await origFetch.apply(window, args);
    if (!res.ok) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "unknown";
      let body = "";
      try {
        body = await res.clone().text();
        if (body.length > 500) body = `${body.slice(0, 500)}...`;
      } catch {}
      failedRequests.push({ url, status: res.status, body, ts: Date.now() });
      if (failedRequests.length > MAX_LOG_ENTRIES) failedRequests.shift();
    }
    return res;
  } catch (err) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "unknown";
    failedRequests.push({ url, status: "NETWORK_ERROR", body: err.message, ts: Date.now() });
    if (failedRequests.length > MAX_LOG_ENTRIES) failedRequests.shift();
    throw err;
  }
};

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popoverRef = useRef(null);
  const textareaRef = useRef(null);
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const routeLabel = getRouteLabel(location.pathname);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post("/feedback", {
        message: message.trim(),
        route_path: location.pathname,
        route_label: routeLabel,
        browser_info: {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          consoleErrors: consoleErrors.slice(-10),
          failedRequests: failedRequests.slice(-10),
        },
      });
      toast.success("Feedback submitted — thank you!");
      setMessage("");
      setIsOpen(false);
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [message, isSubmitting, location.pathname, routeLabel]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div ref={popoverRef} className="fixed bottom-6 right-6 z-[50]">
      {/* Popover */}
      {isOpen && (
        <div
          className={`absolute bottom-14 right-0 w-80 rounded-xl shadow-2xl border p-4 ${
            isDarkMode ? "bg-[#1E2328] border-[#37474F] text-gray-200" : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Report an Issue</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-md transition-colors ${
                isDarkMode ? "hover:bg-[#37474F] text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Location indicator */}
          <div
            className={`text-xs mb-3 px-2 py-1.5 rounded-md ${
              isDarkMode ? "bg-[#2A2F35] text-gray-400" : "bg-gray-50 text-gray-500"
            }`}
          >
            <span className="font-medium">Location:</span> {routeLabel || location.pathname}
          </div>

          {/* Hint */}
          <div
            className={`text-[10px] mb-1.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            Tip: Submit immediately when you notice the error — console &amp; network logs are auto-captured.
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Describe the issue you're experiencing. Submit right away so console & network logs are captured fresh..."
            rows={4}
            className={`w-full resize-none rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
              isDarkMode
                ? "bg-[#2A2F35] border-[#37474F] text-gray-200 placeholder-gray-500"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
            }`}
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs ${message.length > MAX_CHARS * 0.9 ? "text-amber-500" : isDarkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              {message.length}/{MAX_CHARS}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-[#37474F] text-gray-400" : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className="px-3 py-1.5 text-xs rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <Send size={12} />
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "bg-teal-600 text-white opacity-100"
            : `bg-teal-600 text-white opacity-60 hover:opacity-100 hover:scale-110`
        }`}
        title="Report an issue"
      >
        <MessageSquare size={18} />
      </button>
    </div>
  );
};

export default FeedbackWidget;
