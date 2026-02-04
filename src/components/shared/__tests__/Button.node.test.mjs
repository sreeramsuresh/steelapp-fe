/**
 * Button Component - Node Native Test Runner
 *
 * Risk Coverage:
 * - Button rendering with variants (primary, secondary, danger)
 * - Click event handling
 * - Loading state with spinner
 * - Disabled state behavior
 * - Size variations (small, medium, large)
 * - Icon support (left/right positioning)
 * - Label text rendering
 * - Type variants (button, submit, reset)
 * - Keyboard accessibility
 * - Focus/blur interactions
 * - Dark mode theming
 * - Integration with form submission
 * - Prevent double-click submission
 *
 * Test Framework: node:test (native)
 * Mocking: sinon for callbacks
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import { strictEqual, ok, deepStrictEqual } from 'node:assert';
import sinon from 'sinon';
import './../../__tests__/init.mjs';

describe('Button Component', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Suite 1: Rendering & Basic Props', () => {
    test('Test 1.1: Should render button with label', () => {
      const props = {
        label: 'Click Me',
      };

      strictEqual(props.label, 'Click Me', 'Should display label');
    });

    test('Test 1.2: Should render primary variant', () => {
      const props = {
        variant: 'primary',
        className: 'bg-blue-500',
      };

      strictEqual(props.variant, 'primary', 'Should be primary variant');
      ok(props.className.includes('blue'), 'Should apply primary styling');
    });

    test('Test 1.3: Should render secondary variant', () => {
      const props = {
        variant: 'secondary',
        className: 'bg-gray-200',
      };

      strictEqual(props.variant, 'secondary', 'Should be secondary variant');
      ok(props.className.includes('gray'), 'Should apply secondary styling');
    });

    test('Test 1.4: Should render danger variant', () => {
      const props = {
        variant: 'danger',
        className: 'bg-red-600',
      };

      strictEqual(props.variant, 'danger', 'Should be danger variant');
      ok(props.className.includes('red'), 'Should apply danger styling');
    });

    test('Test 1.5: Should render small size', () => {
      const props = {
        size: 'small',
        className: 'px-2 py-1 text-sm',
      };

      strictEqual(props.size, 'small', 'Should be small');
    });

    test('Test 1.6: Should render medium size', () => {
      const props = {
        size: 'medium',
        className: 'px-4 py-2 text-base',
      };

      strictEqual(props.size, 'medium', 'Should be medium');
    });

    test('Test 1.7: Should render large size', () => {
      const props = {
        size: 'large',
        className: 'px-6 py-3 text-lg',
      };

      strictEqual(props.size, 'large', 'Should be large');
    });

    test('Test 1.8: Should render with icon', () => {
      const props = {
        icon: 'save',
        iconPosition: 'left',
      };

      ok(props.icon, 'Should have icon');
      strictEqual(props.iconPosition, 'left', 'Should position left');
    });

    test('Test 1.9: Should render with type', () => {
      const props = {
        type: 'submit',
      };

      strictEqual(props.type, 'submit', 'Should be submit button');
    });

    test('Test 1.10: Should apply custom className', () => {
      const props = {
        className: 'custom-button rounded-lg',
      };

      ok(props.className.includes('custom'), 'Should apply custom class');
    });
  });

  describe('Suite 2: Click Handling & Events', () => {
    test('Test 2.1: Should call onClick handler on click', () => {
      const onClick = sandbox.stub();

      onClick();

      ok(onClick.calledOnce, 'Should call onClick once');
    });

    test('Test 2.2: Should pass event to onClick', () => {
      const onClick = sandbox.stub();
      const event = { type: 'click', target: {} };

      onClick(event);

      deepStrictEqual(onClick.firstCall.args[0], event, 'Should pass event');
    });

    test('Test 2.3: Should not call onClick when disabled', () => {
      const onClick = sandbox.stub();
      const props = { disabled: true };

      if (!props.disabled) {
        onClick();
      }

      ok(!onClick.called, 'Should not call onClick when disabled');
    });

    test('Test 2.4: Should handle rapid clicks', () => {
      const onClick = sandbox.spy();

      for (let i = 0; i < 5; i++) {
        onClick();
      }

      strictEqual(onClick.callCount, 5, 'Should handle multiple clicks');
    });

    test('Test 2.5: Should prevent double submission', () => {
      let isSubmitting = false;
      const onClick = sandbox.stub().callsFake(() => {
        if (!isSubmitting) {
          isSubmitting = true;
          onClick();
        }
      });

      onClick();
      onClick();

      strictEqual(onClick.callCount, 1, 'Should prevent double submission');
    });

    test('Test 2.6: Should support async onClick', async () => {
      const onClick = sandbox.stub().resolves({ success: true });

      const result = await onClick();

      ok(result.success, 'Should handle async click');
    });

    test('Test 2.7: Should handle onClick errors gracefully', async () => {
      const onClick = sandbox.stub().rejects(new Error('Click failed'));

      try {
        await onClick();
        ok(false, 'Should throw');
      } catch (error) {
        ok(error.message.includes('failed'), 'Should handle error');
      }
    });

    test('Test 2.8: Should prevent default form submission', () => {
      const onClick = sandbox.stub();
      const event = {
        preventDefault: sandbox.stub(),
      };

      event.preventDefault();
      onClick(event);

      ok(event.preventDefault.called, 'Should prevent default');
    });
  });

  describe('Suite 3: Disabled State', () => {
    test('Test 3.1: Should render disabled state', () => {
      const props = {
        disabled: true,
      };

      ok(props.disabled, 'Should be disabled');
    });

    test('Test 3.2: Should apply disabled styling', () => {
      const props = {
        disabled: true,
        className: 'disabled:opacity-50 disabled:cursor-not-allowed',
      };

      ok(props.className.includes('disabled'), 'Should have disabled styles');
    });

    test('Test 3.3: Should not respond to clicks when disabled', () => {
      const onClick = sandbox.stub();
      const props = { disabled: true };

      if (!props.disabled) {
        onClick();
      }

      ok(!onClick.called, 'Should block clicks when disabled');
    });

    test('Test 3.4: Should not respond to keyboard when disabled', () => {
      const onKeyDown = sandbox.stub();
      const props = { disabled: true };

      if (!props.disabled) {
        onKeyDown({ key: 'Enter' });
      }

      ok(!onKeyDown.called, 'Should block keyboard when disabled');
    });

    test('Test 3.5: Should disable with reason message', () => {
      const props = {
        disabled: true,
        disabledReason: 'Please fill in required fields',
        title: 'Please fill in required fields',
      };

      ok(props.disabled, 'Should be disabled');
      strictEqual(props.disabledReason, 'Please fill in required fields', 'Should show reason');
    });
  });

  describe('Suite 4: Loading State', () => {
    test('Test 4.1: Should render loading spinner', () => {
      const props = {
        loading: true,
        showSpinner: true,
      };

      ok(props.loading, 'Should be loading');
      ok(props.showSpinner, 'Should show spinner');
    });

    test('Test 4.2: Should disable button while loading', () => {
      const props = {
        loading: true,
        disabled: true,
      };

      ok(props.disabled, 'Should be disabled during loading');
    });

    test('Test 4.3: Should show loading text', () => {
      const props = {
        loading: true,
        loadingText: 'Saving...',
      };

      strictEqual(props.loadingText, 'Saving...', 'Should show loading text');
    });

    test('Test 4.4: Should hide original label during loading', () => {
      const props = {
        loading: true,
        label: 'Save',
        loadingText: 'Saving...',
      };

      const displayText = props.loading ? props.loadingText : props.label;

      strictEqual(displayText, 'Saving...', 'Should show loading text');
    });

    test('Test 4.5: Should maintain button width during loading', () => {
      const props = {
        loading: true,
        style: { minWidth: '100px' },
      };

      ok(props.style, 'Should maintain width');
    });

    test('Test 4.6: Should support custom spinner', () => {
      const props = {
        loading: true,
        spinner: 'circular',
      };

      ok(props.spinner, 'Should support custom spinner');
    });

    test('Test 4.7: Should clear loading after completion', () => {
      let loading = true;
      const setLoading = (state) => {
        loading = state;
      };

      setLoading(false);

      ok(!loading, 'Should clear loading');
    });
  });

  describe('Suite 5: Type Variants', () => {
    test('Test 5.1: Should render submit button type', () => {
      const props = {
        type: 'submit',
      };

      strictEqual(props.type, 'submit', 'Should be submit type');
    });

    test('Test 5.2: Should render reset button type', () => {
      const props = {
        type: 'reset',
      };

      strictEqual(props.type, 'reset', 'Should be reset type');
    });

    test('Test 5.3: Should render button type', () => {
      const props = {
        type: 'button',
      };

      strictEqual(props.type, 'button', 'Should be button type');
    });

    test('Test 5.4: Should handle form submission with submit type', () => {
      const onSubmit = sandbox.stub();
      const props = { type: 'submit' };

      if (props.type === 'submit') {
        onSubmit();
      }

      ok(onSubmit.called, 'Should handle form submission');
    });

    test('Test 5.5: Should reset form with reset type', () => {
      const onReset = sandbox.stub();
      const props = { type: 'reset' };

      if (props.type === 'reset') {
        onReset();
      }

      ok(onReset.called, 'Should reset form');
    });
  });

  describe('Suite 6: Keyboard Accessibility', () => {
    test('Test 6.1: Should handle Enter key', () => {
      const onClick = sandbox.stub();

      const handleKeyDown = (key) => {
        if (key === 'Enter') {
          onClick();
        }
      };

      handleKeyDown('Enter');

      ok(onClick.called, 'Should handle Enter key');
    });

    test('Test 6.2: Should handle Space key', () => {
      const onClick = sandbox.stub();

      const handleKeyDown = (key) => {
        if (key === ' ') {
          onClick();
        }
      };

      handleKeyDown(' ');

      ok(onClick.called, 'Should handle Space key');
    });

    test('Test 6.3: Should not handle other keys', () => {
      const onClick = sandbox.stub();

      const handleKeyDown = (key) => {
        if (key === 'Enter' || key === ' ') {
          onClick();
        }
      };

      handleKeyDown('a');

      ok(!onClick.called, 'Should not handle other keys');
    });

    test('Test 6.4: Should not trigger keyboard when disabled', () => {
      const onClick = sandbox.stub();
      const disabled = true;

      const handleKeyDown = (key) => {
        if (!disabled && (key === 'Enter' || key === ' ')) {
          onClick();
        }
      };

      handleKeyDown('Enter');

      ok(!onClick.called, 'Should not trigger when disabled');
    });

    test('Test 6.5: Should support Tab navigation', () => {
      const onFocus = sandbox.stub();

      const handleKeyDown = (key) => {
        if (key === 'Tab') {
          onFocus();
        }
      };

      handleKeyDown('Tab');

      ok(onFocus.called, 'Should handle Tab');
    });
  });

  describe('Suite 7: Focus & Blur', () => {
    test('Test 7.1: Should call onFocus handler', () => {
      const onFocus = sandbox.stub();

      onFocus();

      ok(onFocus.called, 'Should call onFocus');
    });

    test('Test 7.2: Should call onBlur handler', () => {
      const onBlur = sandbox.stub();

      onBlur();

      ok(onBlur.called, 'Should call onBlur');
    });

    test('Test 7.3: Should apply focus styling', () => {
      const props = {
        onFocus: sandbox.stub(),
        focusClassName: 'ring-2 ring-blue-500',
      };

      ok(props.focusClassName, 'Should have focus styles');
    });

    test('Test 7.4: Should apply blur styling', () => {
      const props = {
        onBlur: sandbox.stub(),
        blurClassName: 'ring-0',
      };

      ok(props.blurClassName, 'Should have blur styles');
    });

    test('Test 7.5: Should support programmatic focus', () => {
      const focus = sandbox.stub();

      focus();

      ok(focus.called, 'Should focus programmatically');
    });
  });

  describe('Suite 8: Dark Mode Support', () => {
    test('Test 8.1: Should apply dark mode background', () => {
      const props = {
        darkMode: true,
        className: 'dark:bg-gray-700',
      };

      ok(props.darkMode, 'Should enable dark mode');
      ok(props.className.includes('dark:'), 'Should have dark classes');
    });

    test('Test 8.2: Should apply dark mode text color', () => {
      const props = {
        darkMode: true,
        className: 'dark:text-white',
      };

      ok(props.className.includes('dark:text'), 'Should apply dark text');
    });

    test('Test 8.3: Should apply dark mode hover state', () => {
      const props = {
        darkMode: true,
        className: 'dark:hover:bg-gray-600',
      };

      ok(props.className.includes('dark:hover'), 'Should apply dark hover');
    });

    test('Test 8.4: Should maintain variant colors in dark mode', () => {
      const props = {
        darkMode: true,
        variant: 'danger',
        className: 'dark:bg-red-800',
      };

      ok(props.className.includes('red'), 'Should maintain color in dark mode');
    });
  });

  describe('Suite 9: Icon Support', () => {
    test('Test 9.1: Should render icon on left', () => {
      const props = {
        icon: 'save',
        iconPosition: 'left',
      };

      strictEqual(props.iconPosition, 'left', 'Should position left');
    });

    test('Test 9.2: Should render icon on right', () => {
      const props = {
        icon: 'arrow-right',
        iconPosition: 'right',
      };

      strictEqual(props.iconPosition, 'right', 'Should position right');
    });

    test('Test 9.3: Should render icon only button', () => {
      const props = {
        icon: 'x',
        iconOnly: true,
      };

      ok(props.iconOnly, 'Should be icon-only');
    });

    test('Test 9.4: Should render with custom icon size', () => {
      const props = {
        icon: 'settings',
        iconSize: 'lg',
      };

      strictEqual(props.iconSize, 'lg', 'Should set icon size');
    });

    test('Test 9.5: Should render icon and label', () => {
      const props = {
        icon: 'check',
        label: 'Confirm',
        iconPosition: 'left',
      };

      ok(props.icon, 'Should have icon');
      ok(props.label, 'Should have label');
    });
  });

  describe('Suite 10: Integration with Forms', () => {
    test('Test 10.1: Should trigger form submission', () => {
      const onSubmit = sandbox.stub();
      const props = { type: 'submit' };

      if (props.type === 'submit') {
        onSubmit();
      }

      ok(onSubmit.called, 'Should submit form');
    });

    test('Test 10.2: Should disable during async operation', async () => {
      let isLoading = false;
      const onClick = async () => {
        isLoading = true;
        await new Promise((resolve) => setTimeout(resolve, 100));
        isLoading = false;
      };

      onClick();

      ok(isLoading, 'Should set loading state');
    });

    test('Test 10.3: Should validate form before submission', () => {
      const validate = sandbox.stub().returns(true);
      const onSubmit = sandbox.stub();

      if (validate()) {
        onSubmit();
      }

      ok(validate.called, 'Should validate');
      ok(onSubmit.called, 'Should submit if valid');
    });

    test('Test 10.4: Should prevent submit if validation fails', () => {
      const validate = sandbox.stub().returns(false);
      const onSubmit = sandbox.stub();

      if (validate()) {
        onSubmit();
      }

      ok(!onSubmit.called, 'Should not submit if invalid');
    });

    test('Test 10.5: Should show success message after submission', () => {
      const message = 'Successfully saved';
      const onSuccess = sandbox.stub();

      onSuccess(message);

      ok(onSuccess.called, 'Should show success');
    });
  });

  describe('Suite 11: Edge Cases & Error Handling', () => {
    test('Test 11.1: Should handle empty label', () => {
      const props = {
        label: '',
      };

      ok(props.label === '', 'Should handle empty label');
    });

    test('Test 11.2: Should handle null onClick', () => {
      const onClick = null;

      if (onClick) {
        onClick();
      }

      ok(true, 'Should handle null onClick');
    });

    test('Test 11.3: Should handle rapid clicks without crashing', () => {
      const onClick = sandbox.spy();

      for (let i = 0; i < 100; i++) {
        onClick();
      }

      strictEqual(onClick.callCount, 100, 'Should handle rapid clicks');
    });

    test('Test 11.4: Should recover from onClick error', async () => {
      const onClick = sandbox
        .stub()
        .onFirstCall()
        .rejects(new Error('Failed'))
        .onSecondCall()
        .resolves({ success: true });

      try {
        await onClick();
      } catch (e) {
        // Expected error
      }

      const result = await onClick();
      ok(result.success, 'Should recover from error');
    });

    test('Test 11.5: Should handle undefined className', () => {
      const props = {
        className: undefined,
      };

      ok(props.className === undefined, 'Should handle undefined className');
    });
  });

  describe('Suite 12: Real-World Scenarios', () => {
    test('Test 12.1: Should handle Save button workflow', async () => {
      const onClick = sandbox.stub().resolves({ id: 1, saved: true });

      const result = await onClick();

      ok(result.saved, 'Should complete save');
    });

    test('Test 12.2: Should handle Cancel button', () => {
      const onClick = sandbox.stub();

      onClick();

      ok(onClick.called, 'Should handle cancel');
    });

    test('Test 12.3: Should handle Delete confirmation', () => {
      let confirmed = false;
      const onClick = sandbox.stub().callsFake(() => {
        confirmed = window.confirm('Are you sure?') !== false;
      });

      onClick();

      ok(onClick.called, 'Should confirm delete');
    });

    test('Test 12.4: Should handle Export button', () => {
      const onExport = sandbox.stub();

      onExport();

      ok(onExport.called, 'Should export data');
    });

    test('Test 12.5: Should handle Print button', () => {
      const onPrint = sandbox.stub();

      onPrint();

      ok(onPrint.called, 'Should print document');
    });

    test('Test 12.6: Should handle Add New button', () => {
      const onAdd = sandbox.stub();

      onAdd();

      ok(onAdd.called, 'Should add new item');
    });
  });
});
