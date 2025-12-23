/**
 * Test Utilities Barrel Export
 * All button testing and state assertion utilities in one place
 *
 * Usage:
 * ```javascript
 * import {
 *   findButtonByRole,
 *   clickAndWait,
 *   assertSuccessToast,
 *   waitForLoadingComplete
 * } from '@/test/utils';
 * ```
 */

// Button Testing Utilities
export {
  findButtonByRole,
  findAllButtons,
  clickButton,
  clickAndWait,
  isButtonEnabled,
  assertButtonEnabled,
  assertButtonDisabled,
  isButtonLoading,
  getButtonLoadingState,
  findButtonInGroup,
  waitForButtonEnabled,
  waitForButtonDisabled,
  doubleClickButton,
  getButtonVariant,
} from './buttonTestUtils';

// State Assertion Utilities
export {
  assertModalOpens,
  assertModalCloses,
  assertToastAppears,
  assertSuccessToast,
  assertErrorToast,
  assertFormErrorAppears,
  assertFormErrorDisappears,
  assertFormFieldValue,
  assertListItemAdded,
  assertListItemRemoved,
  assertTableRowCountChanges,
  assertTableContainsRow,
  assertLoadingStateChanges,
  waitForLoadingComplete,
  assertNavigationOccurred,
  assertStateChange,
} from './stateAssertions';

// Async Operation Utilities
export {
  clickAndWaitForApi,
  waitForApiCall,
  waitForDebounce,
  performAsyncButtonClick,
  waitForLoadingStart,
  waitForLoadingEnd,
  retryUntil,
  pollForCondition,
  waitForCallback,
  waitForAttributeChange,
  createTimer,
} from './asyncHelpers';
