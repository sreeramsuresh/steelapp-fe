/**
 * useAccessibility Hook
 *
 * Provides accessibility utilities including:
 * - Focus management
 * - Keyboard navigation
 * - Screen reader announcements
 * - ARIA attribute helpers
 * - Reduced motion detection
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook to detect user's reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for screen reader announcements
 */
export const useAnnounce = () => {
  const announceRef = useRef(null);

  useEffect(() => {
    // Create announcer element if it doesn&apos;t exist
    if (!announceRef.current) {
      const announcer = document.createElement("div");
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      announcer.setAttribute("role", "status");
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
      announceRef.current = announcer;
    }

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message, priority = "polite") => {
    if (announceRef.current) {
      announceRef.current.setAttribute("aria-live", priority);
      // Clear and set to trigger announcement
      announceRef.current.textContent = "";
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      }, 50);
    }
  }, []);

  return announce;
};

/**
 * Hook for focus trap (modals, dialogs)
 */
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement;

    // Get focusable elements
    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      return containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key
    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Hook for arrow key navigation in lists
 */
export const useArrowNavigation = ({
  itemCount,
  currentIndex = 0,
  onIndexChange,
  orientation = "vertical",
  loop = true,
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      const isVertical = orientation === "vertical";
      const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";
      const nextKey = isVertical ? "ArrowDown" : "ArrowRight";

      if (e.key === prevKey) {
        e.preventDefault();
        let newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? itemCount - 1 : 0;
        }
        onIndexChange(newIndex);
      } else if (e.key === nextKey) {
        e.preventDefault();
        let newIndex = currentIndex + 1;
        if (newIndex >= itemCount) {
          newIndex = loop ? 0 : itemCount - 1;
        }
        onIndexChange(newIndex);
      } else if (e.key === "Home") {
        e.preventDefault();
        onIndexChange(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onIndexChange(itemCount - 1);
      }
    },
    [currentIndex, itemCount, onIndexChange, orientation, loop]
  );

  return { onKeyDown: handleKeyDown };
};

/**
 * Main accessibility hook combining all features
 */
const useAccessibility = () => {
  const prefersReducedMotion = useReducedMotion();
  const announce = useAnnounce();

  // Get ARIA props for common patterns
  const getButtonProps = useCallback(({ label, pressed, expanded, controls, describedBy }) => {
    const props = {};
    if (label) props["aria-label"] = label;
    if (typeof pressed === "boolean") props["aria-pressed"] = pressed;
    if (typeof expanded === "boolean") props["aria-expanded"] = expanded;
    if (controls) props["aria-controls"] = controls;
    if (describedBy) props["aria-describedby"] = describedBy;
    return props;
  }, []);

  const getInputProps = useCallback(({ label, required, invalid, describedBy, errorId }) => {
    const props = {};
    if (label) props["aria-label"] = label;
    if (required) props["aria-required"] = true;
    if (invalid) props["aria-invalid"] = true;
    if (describedBy) props["aria-describedby"] = describedBy;
    if (invalid && errorId) props["aria-errormessage"] = errorId;
    return props;
  }, []);

  const getListProps = useCallback(({ label, multiselectable }) => {
    const props = { role: "listbox" };
    if (label) props["aria-label"] = label;
    if (multiselectable) props["aria-multiselectable"] = true;
    return props;
  }, []);

  const getListItemProps = useCallback(({ selected, position, setSize }) => {
    const props = { role: "option" };
    if (typeof selected === "boolean") props["aria-selected"] = selected;
    if (position) props["aria-posinset"] = position;
    if (setSize) props["aria-setsize"] = setSize;
    return props;
  }, []);

  const getDialogProps = useCallback(({ label, describedBy }) => {
    const props = { role: "dialog", "aria-modal": true };
    if (label) props["aria-label"] = label;
    if (describedBy) props["aria-describedby"] = describedBy;
    return props;
  }, []);

  const getAlertProps = useCallback(({ type = "info" }) => {
    return {
      role: type === "error" ? "alert" : "status",
      "aria-live": type === "error" ? "assertive" : "polite",
    };
  }, []);

  // Skip link for keyboard users
  const SkipLink = useCallback(
    ({ targetId, children = "Skip to main content" }) => (
      <a
        href={`#${targetId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded"
      >
        {children}
      </a>
    ),
    []
  );

  return {
    // State
    prefersReducedMotion,

    // Methods
    announce,

    // ARIA prop getters
    getButtonProps,
    getInputProps,
    getListProps,
    getListItemProps,
    getDialogProps,
    getAlertProps,

    // Components
    SkipLink,

    // Hooks (re-exported for convenience)
    useFocusTrap,
    useArrowNavigation,
  };
};

export default useAccessibility;

/**
 * Animation utilities with reduced motion support
 */
export const animations = {
  // Fade in animation
  fadeIn: (prefersReducedMotion) => ({
    initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0 },
    animate: { opacity: 1 },
    transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.2 },
  }),

  // Slide in from bottom
  slideUp: (prefersReducedMotion) => ({
    initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.2 },
  }),

  // Scale in
  scaleIn: (prefersReducedMotion) => ({
    initial: prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.15 },
  }),

  // Get CSS transition string
  getTransition: (prefersReducedMotion, properties = "all", duration = "200ms") => {
    if (prefersReducedMotion) return "none";
    return `${properties} ${duration} ease-in-out`;
  },
};

/**
 * CSS classes for common accessibility patterns
 */
export const a11yClasses = {
  // Screen reader only
  srOnly: "sr-only",

  // Focus visible styles
  focusVisible: "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",

  // Interactive element base
  interactive: "cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",

  // Disabled state
  disabled: "opacity-50 cursor-not-allowed pointer-events-none",

  // High contrast border for inputs
  inputFocus: "focus:border-teal-500 focus:ring-1 focus:ring-teal-500",
};

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export const generateId = (prefix = "a11y") => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};
