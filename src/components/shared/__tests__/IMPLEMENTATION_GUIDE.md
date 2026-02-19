# Implementation Guide: Tier 2 Overlay Tests

This guide explains how to implement real components that will pass the comprehensive test suite.

## Component Architecture

### 1. Modal Component

**Required Props**:
```javascript
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
};
```

**Expected Behavior**:
- Use Radix UI Dialog as base (`@radix-ui/react-dialog`)
- Render overlay with `z-50` class
- Content positioned fixed, centered
- Prevent scroll when open (set `document.body.style.overflow = 'hidden'`)
- Support nested modals with proper z-index
- Include backdrop at `z-40` or behind content

**Implementation Hint**:
```jsx
import * as Dialog from "@radix-ui/react-dialog";

export function Modal({ isOpen, onClose, children, className }) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content
          className={`fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50 bg-white rounded-lg p-6 ${className}`}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

### 2. ConfirmDialog Component

**Required Props**:
```javascript
ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isLoading: PropTypes.bool,
  isDangerous: PropTypes.bool,
};
```

**Expected Behavior**:
- Role should be `alertdialog`
- Show both Cancel and Confirm buttons
- Apply red styling when `isDangerous={true}`
- Disable both buttons when `isLoading={true}`
- Close on overlay click (onCancel)
- Show "Loading..." text during isLoading
- Support custom button labels

**Implementation Hint**:
```jsx
export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  isLoading = false,
  isDangerous = false,
}) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onCancel}>
      <Dialog.Portal>
        <Dialog.Overlay onClick={onCancel} />
        <Dialog.Content role="alertdialog">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{message}</Dialog.Description>

          <div className="flex justify-end gap-3">
            <button onClick={onCancel} disabled={isLoading}>
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={isDangerous ? "bg-red-600" : "bg-blue-600"}
            >
              {isLoading ? "Loading..." : confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

### 3. AlertDialog Component

**Required Props**:
```javascript
AlertDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  type: PropTypes.oneOf(['info', 'warning', 'error', 'success']),
  actionLabel: PropTypes.string,
  icon: PropTypes.node,
  autoCloseDelay: PropTypes.number,
  showCloseButton: PropTypes.bool,
};
```

**Expected Behavior**:
- Role should be `alertdialog` with `aria-live="assertive"`
- Auto-close after `autoCloseDelay` milliseconds
- Display progress bar during auto-close
- Type determines background color and icon
- Support custom icons
- Show close button unless disabled

**Implementation Hint**:
```jsx
export function AlertDialog({
  isOpen,
  onClose,
  type = "info",
  message,
  autoCloseDelay,
  ...props
}) {
  React.useEffect(() => {
    if (isOpen && autoCloseDelay) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  const typeColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content role="alertdialog" aria-live="assertive" className={typeColors[type]}>
        {/* Content */}
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

---

### 4. Drawer Component

**Required Props**:
```javascript
Drawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  title: PropTypes.string,
  children: PropTypes.node,
  width: PropTypes.string,
  height: PropTypes.string,
  showCloseButton: PropTypes.bool,
};
```

**Expected Behavior**:
- Position: left/right are side drawers, top/bottom are horizontal
- Slide animation based on position
- Full height for side drawers (h-screen)
- Full width for top/bottom (w-screen)
- Overlay at z-40, drawer at z-50
- Custom width/height support via Tailwind classes
- Scroll content with overflow-y-auto

**Implementation Hint**:
```jsx
const positionClasses = {
  right: "right-0 top-0 h-screen slide-in-from-right",
  left: "left-0 top-0 h-screen slide-in-from-left",
  top: "top-0 left-0 w-screen slide-in-from-top",
  bottom: "bottom-0 left-0 w-screen slide-in-from-bottom",
};

const dimensionClasses = {
  right: "w-96",
  left: "w-96",
  top: "h-64",
  bottom: "h-64",
};
```

---

### 5. Popover Component

**Required Props**:
```javascript
Popover.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  trigger: PropTypes.node.isRequired,
  children: PropTypes.node,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  showArrow: PropTypes.bool,
  contentClassName: PropTypes.string,
  triggerClassName: PropTypes.string,
};
```

**Expected Behavior**:
- Trigger has `aria-haspopup="dialog"` and `aria-expanded`
- Content positioned fixed, not in document flow
- Show arrow pointing to trigger
- Close on backdrop click
- Prevent event propagation from content click
- Support custom styling

**Implementation Hint**:
- Use `@floating-ui/react` for positioning
- Or use absolute positioning with calculatePosition
- Arrow should be rotated 45° square element

---

### 6. Dropdown Component

**Required Props**:
```javascript
Dropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  trigger: PropTypes.node,
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    icon: PropTypes.node,
    badge: PropTypes.string,
    disabled: PropTypes.bool,
  })),
  onItemSelect: PropTypes.func,
  disabled: PropTypes.bool,
};
```

**Expected Behavior**:
- Menu role with vertical orientation
- Menu items have menuitem role
- Disabled items cannot be selected
- Icons render on left, badges on right
- Click item closes menu and calls callback
- Support disabled dropdown trigger

**Implementation Hint**:
```jsx
<div role="menu" aria-orientation="vertical">
  {items.map((item, index) => (
    <button
      key={index}
      role="menuitem"
      disabled={item.disabled}
      onClick={() => {
        onItemSelect?.(item);
        onClose();
      }}
    >
      {item.icon && <span>{item.icon}</span>}
      <span>{item.label}</span>
      {item.badge && <span className="ml-auto">{item.badge}</span>}
    </button>
  ))}
</div>
```

---

### 7. Toast Component

**Required Props**:
```javascript
Toast.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  showCloseButton: PropTypes.bool,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  title: PropTypes.string,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
};
```

**Expected Behavior**:
- Role is `status` with `aria-live="polite"`
- Auto-dismiss after duration
- Progress bar animates during dismiss
- Type-specific colors and icons
- Position classes
- Action button support

**Implementation Hint**:
```jsx
React.useEffect(() => {
  if (duration > 0) {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }
}, [duration, onClose]);

// Progress bar
<div
  style={{ animation: `shrink ${duration}ms linear forwards` }}
  className="absolute bottom-0 left-0 h-1 bg-white/30"
/>
```

---

### 8. Tooltip Component

**Required Props**:
```javascript
Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  delay: PropTypes.number,
  showArrow: PropTypes.bool,
  maxWidth: PropTypes.string,
};
```

**Expected Behavior**:
- Role is `tooltip`
- Show on mouse enter after delay
- Hide on mouse leave
- Positioned fixed or absolute
- Arrow points to trigger
- Timeout cleanup on unmount
- Max width for text wrapping

**Implementation Hint**:
```jsx
const [isVisible, setIsVisible] = React.useState(false);
const timeoutRef = React.useRef(null);

const handleMouseEnter = () => {
  timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
};

const handleMouseLeave = () => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  setIsVisible(false);
};

React.useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

---

### 9. ContextMenu Component

**Required Props**:
```javascript
ContextMenu.propTypes = {
  children: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
  })),
  onItemSelect: PropTypes.func,
  onShow: PropTypes.func,
  onHide: PropTypes.func,
};
```

**Expected Behavior**:
- Right-click shows menu at cursor
- preventDefault on contextmenu event
- Menu role with vertical orientation
- Position uses fixed with cursor coordinates
- Click outside closes menu
- Disabled items cannot be selected
- Call onShow on open, onHide on close

**Implementation Hint**:
```jsx
const handleContextMenu = (e) => {
  e.preventDefault();
  setPosition({ x: e.clientX, y: e.clientY });
  setIsOpen(true);
  onShow?.();
};

// Position menu
style={{ top: `${position.y}px`, left: `${position.x}px` }}
```

---

## Testing Checklist

Before considering a component complete:

- [ ] All tests pass: `npm test ComponentName.test.js`
- [ ] Accessibility checks:
  - [ ] Correct roles (dialog, alertdialog, menu, tooltip, status)
  - [ ] ARIA attributes (aria-expanded, aria-modal, aria-haspopup, aria-live)
  - [ ] Keyboard navigation works
- [ ] Event handling:
  - [ ] Click callbacks fire correctly
  - [ ] Event propagation controlled
  - [ ] Timers cleaned up
- [ ] Styling:
  - [ ] Dark mode classes applied
  - [ ] Z-index stacking correct
  - [ ] Animations work
- [ ] Edge cases:
  - [ ] Rapid open/close
  - [ ] Long content
  - [ ] Special characters
  - [ ] Multiple instances

---

## Integration with Real App

### 1. Replace Mock with Real Component
```javascript
// Before (in test)
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return <div role="dialog">{children}</div>;
};

// After (in app)
import { Modal } from "@/components/ui/dialog";
```

### 2. Update Test Imports (Optional)
If using actual components in tests:
```javascript
import { Modal } from "@/components/ui/dialog";
```

### 3. Test Real Component
The test suite will work with the real implementation as long as:
- Props match expected interface
- Behavior matches expectations
- HTML structure is similar

### 4. Adjust Selectors if Needed
If real components use different selectors:
```javascript
// Update getByTestId calls
const { getByTestId } = renderWithProviders(<Modal {...props} />);
// Change to getByRole if using Radix
const { getByRole } = renderWithProviders(<Modal {...props} />);
```

---

## Common Implementation Patterns

### Focus Management
```javascript
const contentRef = React.useRef(null);

React.useEffect(() => {
  if (isOpen && contentRef.current) {
    // Focus first interactive element
    const firstButton = contentRef.current.querySelector("button");
    firstButton?.focus();
  }
}, [isOpen]);
```

### Scroll Lock
```javascript
React.useEffect(() => {
  if (isOpen) {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }
}, [isOpen]);
```

### Backdrop Handling
```javascript
const handleBackdropClick = (e) => {
  // Only close if clicking directly on backdrop
  if (e.target === e.currentTarget) {
    onClose();
  }
};
```

### Click Outside
```javascript
React.useEffect(() => {
  if (!isOpen) return;

  const handleClickOutside = (event) => {
    if (contentRef.current && !contentRef.current.contains(event.target)) {
      onClose();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [isOpen, onClose]);
```

---

## Performance Considerations

1. **Memoization**
   ```javascript
   const Modal = React.memo(function Modal({ isOpen, onClose, children }) {
     // Component body
   });
   ```

2. **Lazy Loading**
   - Load overlay content only when visible

3. **Timer Cleanup**
   - Always clear timeouts in useEffect cleanup

4. **Event Listener Cleanup**
   - Remove global listeners on unmount

---

## Debugging Tips

1. **Test Fails on Assertion**
   - Check if selector matches actual DOM
   - Use `screen.debug()` to see rendered HTML

2. **Async Operations**
   - Use `waitFor()` for state updates
   - Use `vi.advanceTimersByTime()` for timers

3. **Click Not Working**
   - Check if element is disabled
   - Check if event.stopPropagation() is preventing clicks

4. **Accessibility Issues**
   - Check console for accessibility warnings
   - Use WAVE browser extension

---

## Resources

- **Radix UI Dialog**: https://www.radix-ui.com/docs/primitives/components/dialog
- **Testing Library Docs**: https://testing-library.com/docs/react-testing-library/intro/
- **Vitest**: https://vitest.dev/
- **WAI-ARIA**: https://www.w3.org/WAI/ARIA/

---

**Last Updated**: 2026-02-04
**Test Suite**: Tier 2 Modal, Drawer & Overlays
**Framework**: React + Vitest + React Testing Library
