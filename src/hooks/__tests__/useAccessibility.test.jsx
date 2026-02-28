import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useAccessibility, {
  useReducedMotion,
  useAnnounce,
  useFocusTrap,
  useArrowNavigation,
  animations,
  a11yClasses,
  generateId,
} from "../useAccessibility";

describe("useReducedMotion", () => {
  let matchMediaMock;

  beforeEach(() => {
    matchMediaMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn().mockReturnValue(matchMediaMock);
  });

  it("returns false by default", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion matches", () => {
    matchMediaMock.matches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("listens for changes", () => {
    renderHook(() => useReducedMotion());
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("cleans up listener on unmount", () => {
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});

describe("useAnnounce", () => {
  afterEach(() => {
    // Clean up any announcer elements
    document.querySelectorAll('[aria-live]').forEach(el => {
      if (el.parentNode === document.body) {
        document.body.removeChild(el);
      }
    });
  });

  it("returns an announce function", () => {
    const { result } = renderHook(() => useAnnounce());
    expect(typeof result.current).toBe("function");
  });

  it("creates an announcer element in the DOM", () => {
    renderHook(() => useAnnounce());
    const announcer = document.querySelector('[aria-live="polite"]');
    expect(announcer).toBeTruthy();
    expect(announcer.getAttribute("role")).toBe("status");
  });

  it("removes announcer on unmount", () => {
    const { unmount } = renderHook(() => useAnnounce());
    const before = document.querySelectorAll('[role="status"]').length;
    unmount();
    const after = document.querySelectorAll('[role="status"]').length;
    expect(after).toBeLessThan(before);
  });
});

describe("useArrowNavigation", () => {
  it("handles ArrowDown to increment index", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 0, onIndexChange })
    );

    const event = { key: "ArrowDown", preventDefault: vi.fn() };
    result.current.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("handles ArrowUp to decrement index", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 2, onIndexChange })
    );

    const event = { key: "ArrowUp", preventDefault: vi.fn() };
    result.current.onKeyDown(event);

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("loops to end on ArrowUp from index 0", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 0, onIndexChange, loop: true })
    );

    const event = { key: "ArrowUp", preventDefault: vi.fn() };
    result.current.onKeyDown(event);

    expect(onIndexChange).toHaveBeenCalledWith(4);
  });

  it("loops to start on ArrowDown from last index", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 4, onIndexChange, loop: true })
    );

    const event = { key: "ArrowDown", preventDefault: vi.fn() };
    result.current.onKeyDown(event);

    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("does not loop when loop is false", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 0, onIndexChange, loop: false })
    );

    const event = { key: "ArrowUp", preventDefault: vi.fn() };
    result.current.onKeyDown(event);

    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("handles Home key", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 3, onIndexChange })
    );

    const event = { key: "Home", preventDefault: vi.fn() };
    result.current.onKeyDown(event);

    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("handles End key", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 1, onIndexChange })
    );

    const event = { key: "End", preventDefault: vi.fn() };
    result.current.onKeyDown(event);

    expect(onIndexChange).toHaveBeenCalledWith(4);
  });

  it("uses horizontal orientation with ArrowLeft/ArrowRight", () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useArrowNavigation({ itemCount: 5, currentIndex: 2, onIndexChange, orientation: "horizontal" })
    );

    result.current.onKeyDown({ key: "ArrowRight", preventDefault: vi.fn() });
    expect(onIndexChange).toHaveBeenCalledWith(3);

    result.current.onKeyDown({ key: "ArrowLeft", preventDefault: vi.fn() });
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });
});

describe("useAccessibility (main hook)", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    document.querySelectorAll('[aria-live]').forEach(el => {
      if (el.parentNode === document.body) {
        document.body.removeChild(el);
      }
    });
  });

  it("returns all accessibility utilities", () => {
    const { result } = renderHook(() => useAccessibility());

    expect(typeof result.current.prefersReducedMotion).toBe("boolean");
    expect(typeof result.current.announce).toBe("function");
    expect(typeof result.current.getButtonProps).toBe("function");
    expect(typeof result.current.getInputProps).toBe("function");
    expect(typeof result.current.getListProps).toBe("function");
    expect(typeof result.current.getListItemProps).toBe("function");
    expect(typeof result.current.getDialogProps).toBe("function");
    expect(typeof result.current.getAlertProps).toBe("function");
    expect(result.current.SkipLink).toBeTruthy();
  });

  it("getButtonProps returns ARIA attributes", () => {
    const { result } = renderHook(() => useAccessibility());

    const props = result.current.getButtonProps({
      label: "Close",
      pressed: true,
      expanded: false,
      controls: "panel-1",
    });

    expect(props["aria-label"]).toBe("Close");
    expect(props["aria-pressed"]).toBe(true);
    expect(props["aria-expanded"]).toBe(false);
    expect(props["aria-controls"]).toBe("panel-1");
  });

  it("getInputProps returns ARIA attributes", () => {
    const { result } = renderHook(() => useAccessibility());

    const props = result.current.getInputProps({
      label: "Email",
      required: true,
      invalid: true,
      errorId: "email-error",
    });

    expect(props["aria-label"]).toBe("Email");
    expect(props["aria-required"]).toBe(true);
    expect(props["aria-invalid"]).toBe(true);
    expect(props["aria-errormessage"]).toBe("email-error");
  });

  it("getDialogProps returns dialog ARIA", () => {
    const { result } = renderHook(() => useAccessibility());

    const props = result.current.getDialogProps({ label: "Confirm" });
    expect(props.role).toBe("dialog");
    expect(props["aria-modal"]).toBe(true);
    expect(props["aria-label"]).toBe("Confirm");
  });

  it("getAlertProps returns role based on type", () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.getAlertProps({ type: "error" }).role).toBe("alert");
    expect(result.current.getAlertProps({ type: "info" }).role).toBe("status");
  });
});

describe("animations", () => {
  it("fadeIn returns instant animation when reduced motion preferred", () => {
    const result = animations.fadeIn(true);
    expect(result.transition.duration).toBe(0);
    expect(result.initial.opacity).toBe(1);
  });

  it("fadeIn returns normal animation when no reduced motion", () => {
    const result = animations.fadeIn(false);
    expect(result.transition.duration).toBe(0.2);
    expect(result.initial.opacity).toBe(0);
  });

  it("getTransition returns 'none' with reduced motion", () => {
    expect(animations.getTransition(true)).toBe("none");
  });

  it("getTransition returns CSS transition string normally", () => {
    expect(animations.getTransition(false)).toContain("all");
    expect(animations.getTransition(false)).toContain("200ms");
  });
});

describe("a11yClasses", () => {
  it("exports expected class keys", () => {
    expect(a11yClasses.srOnly).toBe("sr-only");
    expect(a11yClasses.focusVisible).toContain("focus:");
    expect(a11yClasses.interactive).toContain("cursor-pointer");
    expect(a11yClasses.disabled).toContain("opacity-50");
  });
});

describe("generateId", () => {
  it("generates unique IDs with prefix", () => {
    const id1 = generateId("test");
    const id2 = generateId("test");
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^test-\d+$/);
  });

  it("uses default prefix", () => {
    const id = generateId();
    expect(id).toMatch(/^a11y-\d+$/);
  });
});
