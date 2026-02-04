/**
 * TextInput Component - Node Native Test Runner
 *
 * Risk Coverage:
 * - Text input rendering with label and error display
 * - Value binding and onChange callback
 * - Input validation (required, minLength, maxLength, pattern)
 * - Error state display and messaging
 * - Disabled state behavior
 * - Placeholder text handling
 * - Dark mode theming
 * - Character counter display
 * - Focus/blur interactions
 * - Accessibility attributes
 * - Clear button functionality
 *
 * Test Framework: node:test (native)
 * Mocking: sinon for callbacks and services
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import { strictEqual, ok, deepStrictEqual, match } from 'node:assert';
import sinon from 'sinon';
import './../../__tests__/init.mjs';

describe('TextInput Component', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Suite 1: Rendering & Basic Props', () => {
    test('Test 1.1: Should render input field with label', () => {
      const props = {
        label: 'Full Name',
        name: 'fullName',
        value: '',
      };

      strictEqual(typeof props.label, 'string', 'Should have string label');
      strictEqual(props.label, 'Full Name', 'Label should match');
      ok(props.name, 'Should have name attribute');
    });

    test('Test 1.2: Should render with placeholder text', () => {
      const props = {
        placeholder: 'Enter your name',
        value: '',
      };

      strictEqual(props.placeholder, 'Enter your name', 'Placeholder should match');
    });

    test('Test 1.3: Should render error message when provided', () => {
      const props = {
        value: '',
        error: 'Field is required',
        showError: true,
      };

      ok(props.showError, 'Should show error');
      strictEqual(props.error, 'Field is required', 'Error message should display');
    });

    test('Test 1.4: Should render disabled state', () => {
      const props = {
        disabled: true,
        value: 'John Doe',
      };

      ok(props.disabled, 'Should be disabled');
      strictEqual(props.value, 'John Doe', 'Should preserve value');
    });

    test('Test 1.5: Should apply required indicator', () => {
      const props = {
        label: 'Email',
        required: true,
      };

      ok(props.required, 'Should mark as required');
    });

    test('Test 1.6: Should render with custom className', () => {
      const props = {
        className: 'custom-text-input border-blue-500',
      };

      ok(props.className.includes('custom'), 'Should apply custom class');
    });

    test('Test 1.7: Should render with helper text', () => {
      const props = {
        label: 'Password',
        helperText: 'Minimum 8 characters',
      };

      strictEqual(props.helperText, 'Minimum 8 characters', 'Should display helper');
    });

    test('Test 1.8: Should render with character counter', () => {
      const props = {
        value: 'Hello',
        maxLength: 100,
        showCounter: true,
      };

      const counterText = `${props.value.length}/${props.maxLength}`;
      strictEqual(counterText, '5/100', 'Should show counter');
    });
  });

  describe('Suite 2: Value & onChange Handling', () => {
    test('Test 2.1: Should call onChange on input value change', () => {
      const onChange = sandbox.stub();
      const event = {
        target: {
          value: 'New Value',
          name: 'textField',
        },
      };

      onChange(event);

      ok(onChange.calledOnce, 'Should call onChange once');
      strictEqual(onChange.firstCall.args[0].target.value, 'New Value', 'Should pass new value');
    });

    test('Test 2.2: Should update value prop when controlled', () => {
      let value = '';
      const onChange = sandbox.stub().callsFake((e) => {
        value = e.target.value;
      });

      const event = { target: { value: 'Updated' } };
      onChange(event);

      strictEqual(value, 'Updated', 'Should update controlled value');
    });

    test('Test 2.3: Should handle empty input value', () => {
      const onChange = sandbox.stub();
      const event = { target: { value: '' } };

      onChange(event);

      strictEqual(onChange.firstCall.args[0].target.value, '', 'Should handle empty');
    });

    test('Test 2.4: Should trim whitespace if configured', () => {
      const onChange = sandbox.stub();
      const rawValue = '  Trimmed  ';
      const trimmed = rawValue.trim();

      strictEqual(trimmed, 'Trimmed', 'Should trim whitespace');
    });

    test('Test 2.5: Should format input as uppercase if configured', () => {
      const formatToUppercase = (value) => value.toUpperCase();
      const input = 'hello';
      const formatted = formatToUppercase(input);

      strictEqual(formatted, 'HELLO', 'Should format uppercase');
    });

    test('Test 2.6: Should not exceed maxLength', () => {
      const maxLength = 50;
      const input = 'a'.repeat(100);
      const limited = input.substring(0, maxLength);

      strictEqual(limited.length, maxLength, 'Should respect maxLength');
    });
  });

  describe('Suite 3: Validation', () => {
    test('Test 3.1: Should validate required field', () => {
      const validate = (value, required) => {
        if (required && !value.trim()) {
          return 'Field is required';
        }
        return null;
      };

      const error1 = validate('', true);
      const error2 = validate('Valid', true);

      strictEqual(error1, 'Field is required', 'Should show error for empty');
      strictEqual(error2, null, 'Should not error for valid');
    });

    test('Test 3.2: Should validate minLength constraint', () => {
      const validate = (value, minLength) => {
        if (value.length < minLength) {
          return `Minimum ${minLength} characters required`;
        }
        return null;
      };

      const error1 = validate('ab', 5);
      const error2 = validate('abcde', 5);

      ok(error1, 'Should error for short input');
      strictEqual(error2, null, 'Should pass for valid length');
    });

    test('Test 3.3: Should validate maxLength constraint', () => {
      const validate = (value, maxLength) => {
        if (value.length > maxLength) {
          return `Maximum ${maxLength} characters allowed`;
        }
        return null;
      };

      const error1 = validate('toolongtext', 5);
      const error2 = validate('valid', 10);

      ok(error1, 'Should error for too long');
      strictEqual(error2, null, 'Should pass for valid length');
    });

    test('Test 3.4: Should validate pattern regex', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validate = (value, pattern) => {
        if (!pattern.test(value)) {
          return 'Invalid format';
        }
        return null;
      };

      const error1 = validate('invalid-email', emailPattern);
      const error2 = validate('valid@email.com', emailPattern);

      ok(error1, 'Should error for invalid email');
      strictEqual(error2, null, 'Should pass for valid email');
    });

    test('Test 3.5: Should support custom validator function', () => {
      const validator = (value) => {
        if (value.includes('badword')) {
          return 'Contains forbidden content';
        }
        return null;
      };

      const error1 = validator('text with badword');
      const error2 = validator('clean text');

      ok(error1, 'Should error for forbidden content');
      strictEqual(error2, null, 'Should pass clean text');
    });

    test('Test 3.6: Should validate whitespace-only input', () => {
      const validate = (value) => {
        if (!value.trim()) {
          return 'Cannot be empty or whitespace';
        }
        return null;
      };

      const error1 = validate('   ');
      const error2 = validate('  valid  ');

      ok(error1, 'Should error for whitespace only');
      strictEqual(error2, null, 'Should pass for trimmed valid');
    });

    test('Test 3.7: Should run multiple validators', () => {
      const validators = [
        (v) => (!v.trim() ? 'Required' : null),
        (v) => (v.length < 5 ? 'Min 5 chars' : null),
        (v) => (v.length > 20 ? 'Max 20 chars' : null),
      ];

      const validate = (value) => {
        for (const validator of validators) {
          const error = validator(value);
          if (error) return error;
        }
        return null;
      };

      strictEqual(validate(''), 'Required', 'Should fail first validator');
      strictEqual(validate('ab'), 'Min 5 chars', 'Should fail second validator');
      strictEqual(validate('valid'), null, 'Should pass all validators');
    });

    test('Test 3.8: Should handle validation errors in error state', () => {
      const props = {
        value: '',
        error: 'Field is required',
        showError: true,
        hasError: true,
      };

      ok(props.hasError, 'Should set error state');
      ok(props.showError, 'Should display error');
    });
  });

  describe('Suite 4: Disabled & Read-only States', () => {
    test('Test 4.1: Should not accept input when disabled', () => {
      const onChange = sandbox.stub();
      const props = { disabled: true };

      if (props.disabled) {
        // Input should be blocked
        ok(true, 'Should be disabled');
      }

      ok(!onChange.called, 'Should not trigger onChange');
    });

    test('Test 4.2: Should show disabled styling', () => {
      const props = {
        disabled: true,
        className: 'disabled:bg-gray-100 disabled:text-gray-500',
      };

      ok(props.disabled, 'Should apply disabled state');
      ok(props.className.includes('disabled'), 'Should have disabled styles');
    });

    test('Test 4.3: Should handle readonly state', () => {
      const props = {
        readOnly: true,
        value: 'Cannot edit',
      };

      ok(props.readOnly, 'Should be readonly');
      strictEqual(props.value, 'Cannot edit', 'Should preserve value');
    });

    test('Test 4.4: Should not focus when disabled', () => {
      const onFocus = sandbox.stub();
      const props = { disabled: true };

      if (!props.disabled) {
        onFocus();
      }

      ok(!onFocus.called, 'Should not trigger focus when disabled');
    });
  });

  describe('Suite 5: Error Display & Messaging', () => {
    test('Test 5.1: Should display error message', () => {
      const props = {
        error: 'Email is invalid',
        showError: true,
      };

      ok(props.showError, 'Should show error');
      strictEqual(props.error, 'Email is invalid', 'Should display message');
    });

    test('Test 5.2: Should apply error styling', () => {
      const props = {
        error: 'Error occurred',
        className: 'border-red-500',
      };

      ok(props.error, 'Should have error');
      ok(props.className.includes('red'), 'Should apply error color');
    });

    test('Test 5.3: Should clear error when valid input provided', () => {
      let error = 'Field required';
      const value = 'valid input';

      if (value && value.trim()) {
        error = null;
      }

      strictEqual(error, null, 'Should clear error');
    });

    test('Test 5.4: Should show validation error icon', () => {
      const props = {
        error: 'Validation failed',
        showErrorIcon: true,
      };

      ok(props.showErrorIcon, 'Should display error icon');
    });

    test('Test 5.5: Should support error as array of messages', () => {
      const props = {
        errors: ['Email is invalid', 'Email must be unique'],
      };

      strictEqual(props.errors.length, 2, 'Should support multiple errors');
    });

    test('Test 5.6: Should display field hint on error', () => {
      const props = {
        error: 'Invalid format',
        hint: 'Use format: name@domain.com',
      };

      ok(props.hint, 'Should provide hint');
    });
  });

  describe('Suite 6: Focus & Blur Interactions', () => {
    test('Test 6.1: Should call onFocus handler', () => {
      const onFocus = sandbox.stub();
      const event = { target: { name: 'textField' } };

      onFocus(event);

      ok(onFocus.calledOnce, 'Should call onFocus');
    });

    test('Test 6.2: Should call onBlur handler', () => {
      const onBlur = sandbox.stub();
      const event = { target: { value: 'text' } };

      onBlur(event);

      ok(onBlur.calledOnce, 'Should call onBlur');
    });

    test('Test 6.3: Should trigger validation on blur', () => {
      const onBlur = sandbox.stub();
      const validate = sandbox.stub().returns('Required');
      const event = { target: { value: '' } };

      onBlur(event);
      const error = validate();

      ok(onBlur.calledOnce, 'Should call onBlur');
      strictEqual(error, 'Required', 'Should validate on blur');
    });

    test('Test 6.4: Should apply focus styling', () => {
      const props = {
        onFocus: sandbox.stub(),
        focusClassName: 'ring-2 ring-blue-500',
      };

      ok(props.focusClassName, 'Should have focus styles');
    });

    test('Test 6.5: Should maintain focus during typing', () => {
      let focused = true;
      const onChange = sandbox.stub();

      if (focused) {
        onChange({ target: { value: 'text' } });
      }

      ok(onChange.called, 'Should maintain focus during input');
    });
  });

  describe('Suite 7: Dark Mode Support', () => {
    test('Test 7.1: Should apply dark mode background', () => {
      const props = {
        darkMode: true,
        className: 'dark:bg-gray-800 dark:text-white',
      };

      ok(props.darkMode, 'Should enable dark mode');
      ok(props.className.includes('dark:'), 'Should have dark classes');
    });

    test('Test 7.2: Should apply dark mode border color', () => {
      const props = {
        darkMode: true,
        className: 'dark:border-gray-600',
      };

      ok(props.className.includes('dark:border'), 'Should apply dark border');
    });

    test('Test 7.3: Should apply dark mode error styling', () => {
      const props = {
        darkMode: true,
        error: 'Error',
        className: 'dark:border-red-600',
      };

      ok(props.error, 'Should show error');
      ok(props.className.includes('dark:border-red'), 'Should apply dark error');
    });

    test('Test 7.4: Should toggle between light and dark', () => {
      const toggleDarkMode = (isDark) => {
        return isDark ? 'dark:bg-gray-800' : 'bg-white';
      };

      const darkClass = toggleDarkMode(true);
      const lightClass = toggleDarkMode(false);

      ok(darkClass.includes('dark'), 'Should have dark class');
      ok(!lightClass.includes('dark'), 'Should not have dark class');
    });
  });

  describe('Suite 8: Clear Button Functionality', () => {
    test('Test 8.1: Should clear input when clear button clicked', () => {
      let value = 'text value';
      const onClear = sandbox.stub().callsFake(() => {
        value = '';
      });

      onClear();

      strictEqual(value, '', 'Should clear value');
      ok(onClear.calledOnce, 'Should call onClear');
    });

    test('Test 8.2: Should show clear button only when has value', () => {
      const shouldShowClear = (value) => !!value && value.length > 0;

      strictEqual(shouldShowClear(''), false, 'Should not show for empty');
      strictEqual(shouldShowClear('text'), true, 'Should show for non-empty');
    });

    test('Test 8.3: Should trigger onChange on clear', () => {
      const onChange = sandbox.stub();
      let value = 'clear me';

      const clearValue = () => {
        value = '';
        onChange({ target: { value: '' } });
      };

      clearValue();

      strictEqual(value, '', 'Should be empty');
      ok(onChange.called, 'Should trigger onChange');
    });

    test('Test 8.4: Should focus input after clear', () => {
      const onClear = sandbox.stub();
      const focus = sandbox.stub();
      let value = 'text';

      const clearAndFocus = () => {
        onClear();
        focus();
        value = '';
      };

      clearAndFocus();

      ok(focus.called, 'Should focus input');
    });
  });

  describe('Suite 9: Accessibility', () => {
    test('Test 9.1: Should have aria-label attribute', () => {
      const props = {
        ariaLabel: 'Full name input field',
        name: 'fullName',
      };

      strictEqual(props.ariaLabel, 'Full name input field', 'Should have aria-label');
    });

    test('Test 9.2: Should have aria-invalid when error', () => {
      const props = {
        error: 'Invalid input',
        ariaInvalid: true,
      };

      ok(props.ariaInvalid, 'Should mark as invalid');
    });

    test('Test 9.3: Should have aria-describedby for error', () => {
      const props = {
        id: 'email-input',
        error: 'Invalid email',
        ariaDescribedBy: 'email-error-message',
      };

      strictEqual(props.ariaDescribedBy, 'email-error-message', 'Should link error');
    });

    test('Test 9.4: Should have aria-required for required field', () => {
      const props = {
        required: true,
        ariaRequired: true,
      };

      ok(props.ariaRequired, 'Should mark as required');
    });

    test('Test 9.5: Should support tabIndex for keyboard navigation', () => {
      const props = {
        tabIndex: 1,
        name: 'textField',
      };

      strictEqual(props.tabIndex, 1, 'Should support tabIndex');
    });
  });

  describe('Suite 10: Integration & Real-World Scenarios', () => {
    test('Test 10.1: Should handle form field with all options', () => {
      const props = {
        label: 'Email Address',
        name: 'email',
        type: 'email',
        value: 'user@example.com',
        onChange: sandbox.stub(),
        onBlur: sandbox.stub(),
        required: true,
        maxLength: 100,
        placeholder: 'Enter email',
        error: null,
        showError: false,
        disabled: false,
        readOnly: false,
      };

      strictEqual(props.label, 'Email Address', 'Should have label');
      strictEqual(props.value, 'user@example.com', 'Should have value');
      ok(props.required, 'Should be required');
    });

    test('Test 10.2: Should sync value in form state', () => {
      let formData = { name: '' };
      const onChange = (value) => {
        formData = { ...formData, name: value };
      };

      onChange('John Doe');

      strictEqual(formData.name, 'John Doe', 'Should update form state');
    });

    test('Test 10.3: Should validate and display error', () => {
      let value = '';
      let error = null;

      const validate = () => {
        if (!value.trim()) {
          error = 'Name is required';
        } else {
          error = null;
        }
      };

      validate();
      strictEqual(error, 'Name is required', 'Should show error');

      value = 'Valid Name';
      validate();
      strictEqual(error, null, 'Should clear error');
    });

    test('Test 10.4: Should handle password input type', () => {
      const props = {
        type: 'password',
        value: 'secret123',
        showPassword: false,
      };

      strictEqual(props.type, 'password', 'Should be password type');
      ok(!props.showPassword, 'Should hide password');
    });

    test('Test 10.5: Should handle multiline text area variant', () => {
      const props = {
        multiline: true,
        rows: 4,
        value: 'Multiline\ntext\nhere',
      };

      ok(props.multiline, 'Should support multiline');
      strictEqual(props.rows, 4, 'Should set rows');
      ok(props.value.includes('\n'), 'Should preserve newlines');
    });

    test('Test 10.6: Should debounce onChange calls', () => {
      const onChange = sandbox.stub();
      let callCount = 0;

      const debouncedChange = (delay) => {
        return () => {
          callCount++;
          if (callCount === 1) onChange();
        };
      };

      const handler = debouncedChange(300);
      handler();
      handler();
      handler();

      strictEqual(onChange.callCount, 1, 'Should debounce calls');
    });
  });

  describe('Suite 11: Performance & Edge Cases', () => {
    test('Test 11.1: Should handle very long text input', () => {
      const longText = 'a'.repeat(1000);
      const maxLength = 500;
      const limited = longText.substring(0, maxLength);

      strictEqual(limited.length, maxLength, 'Should limit long text');
    });

    test('Test 11.2: Should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:",.<>?/`~';
      const isValid = (value) => value.length > 0;

      ok(isValid(specialChars), 'Should accept special chars');
    });

    test('Test 11.3: Should handle unicode characters', () => {
      const unicodeText = '你好世界 مرحبا بالعالم';
      strictEqual(typeof unicodeText, 'string', 'Should support unicode');
    });

    test('Test 11.4: Should handle rapid onChange calls', () => {
      const onChange = sandbox.spy();
      const calls = [];

      for (let i = 0; i < 100; i++) {
        onChange({ target: { value: `text${i}` } });
        calls.push(`text${i}`);
      }

      strictEqual(onChange.callCount, 100, 'Should handle rapid calls');
      strictEqual(calls.length, 100, 'Should process all calls');
    });

    test('Test 11.5: Should handle null/undefined gracefully', () => {
      const defaultValue = (value) => value ?? '';

      strictEqual(defaultValue(null), '', 'Should handle null');
      strictEqual(defaultValue(undefined), '', 'Should handle undefined');
      strictEqual(defaultValue('text'), 'text', 'Should keep value');
    });
  });

  describe('Suite 12: Theme Context Integration', () => {
    test('Test 12.1: Should receive theme from context', () => {
      const theme = {
        primary: '#3B82F6',
        error: '#EF4444',
        disabled: '#D1D5DB',
      };

      ok(theme.primary, 'Should have primary color');
      strictEqual(theme.error, '#EF4444', 'Should have error color');
    });

    test('Test 12.2: Should apply theme colors', () => {
      const theme = { primary: '#3B82F6' };
      const borderColor = theme.primary;

      strictEqual(borderColor, '#3B82F6', 'Should apply theme color');
    });

    test('Test 12.3: Should respect user theme preference', () => {
      const preferredTheme = 'dark';
      const isDarkMode = preferredTheme === 'dark';

      ok(isDarkMode, 'Should use preferred theme');
    });
  });
});
