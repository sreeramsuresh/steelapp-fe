// ═══════════════════════════════════════════════════════════════
// CONFIG VALIDATOR - Runtime validation for development (Rule 13)
// Validates DocumentFormConfig structure and rules
// ═══════════════════════════════════════════════════════════════

import {
  DocumentFormConfig,
  DocumentState,
  FieldConfig,
  ColumnConfig,
} from './types';

interface ValidationIssue {
  severity: 'error' | 'warning';
  rule: string;
  message: string;
  path?: string;
}

const VALID_HEADER_KEYS = [
  'docNumber',
  'date',
  'dueDate',
  'currency',
  'exchangeRate',
  'reference',
  'paymentTerms',
  'emirate',
  'vendorInvoiceNumber',
  'vatCategory',
  'deliveryTerms',
];

const VALID_LINE_KEYS = [
  'productName',
  'description',
  'quantity',
  'unit',
  'rate',
  'amount',
  'vatRate',
  'vatAmount',
  'discountPercent',
  'discountAmount',
];

/**
 * Validates a DocumentFormConfig for correctness
 * Only runs in development mode for performance
 */
export function validateConfig(config: DocumentFormConfig): ValidationIssue[] {
  // Skip validation in production
  if (process.env.NODE_ENV === 'production') {
    return [];
  }

  const issues: ValidationIssue[] = [];

  // Rule 1: Check config version exists
  if (!config.configVersion || config.configVersion < 1) {
    issues.push({
      severity: 'error',
      rule: 'CONFIG_VERSION',
      message: 'configVersion is required and must be >= 1',
    });
  }

  // Rule 2: Check identity fields
  if (!config.documentType || !config.documentLabel || !config.numberPrefix) {
    issues.push({
      severity: 'error',
      rule: 'IDENTITY_REQUIRED',
      message: 'documentType, documentLabel, and numberPrefix are required',
    });
  }

  // Rule 3: Check party configuration
  if (!config.partyType || !config.partyLabel) {
    issues.push({
      severity: 'error',
      rule: 'PARTY_REQUIRED',
      message: 'partyType and partyLabel are required',
    });
  }

  // Rule 4: Check features object exists
  if (!config.features) {
    issues.push({
      severity: 'error',
      rule: 'FEATURES_REQUIRED',
      message: 'features object is required',
    });
  }

  // Rule 5: Check defaults object exists
  if (!config.defaults) {
    issues.push({
      severity: 'error',
      rule: 'DEFAULTS_REQUIRED',
      message: 'defaults object is required',
    });
  }

  // Rule 6: Validate header fields
  if (config.headerFields) {
    config.headerFields.forEach((field, idx) => {
      validateFieldConfig(field, `headerFields[${idx}]`, VALID_HEADER_KEYS, issues);

      // Rule 11: Hidden required fields must have defaultValue
      if (!field.visible && field.required && field.defaultValue === undefined) {
        issues.push({
          severity: 'error',
          rule: 'HIDDEN_REQUIRED_DEFAULT',
          message: `Field "${field.key}" is hidden and required but has no defaultValue`,
          path: `headerFields[${idx}]`,
        });
      }
    });
  }

  // Rule 7: Validate line item columns
  if (config.lineItemColumns) {
    config.lineItemColumns.forEach((col, idx) => {
      validateColumnConfig(col, `lineItemColumns[${idx}]`, VALID_LINE_KEYS, issues);
    });
  }

  // Rule 8: Check for incompatible flags
  if (config.features) {
    // enableDueDate requires enablePaymentTerms (business logic dependency)
    if (config.features.enableDueDate && !config.features.enablePaymentTerms) {
      issues.push({
        severity: 'warning',
        rule: 'INCOMPATIBLE_FLAGS',
        message: 'enableDueDate=true usually requires enablePaymentTerms=true',
        path: 'features',
      });
    }

    // enableExchangeRate requires enableCurrency
    if (config.features.enableExchangeRate && !config.features.enableCurrency) {
      issues.push({
        severity: 'error',
        rule: 'INCOMPATIBLE_FLAGS',
        message: 'enableExchangeRate=true requires enableCurrency=true',
        path: 'features',
      });
    }

    // enableLineVat should match enableVat
    if (config.features.enableLineVat !== config.features.enableVat) {
      issues.push({
        severity: 'warning',
        rule: 'INCONSISTENT_FLAGS',
        message: 'enableLineVat and enableVat should typically match',
        path: 'features',
      });
    }
  }

  // Rule 9: Check charge types
  if (config.features?.enableAdditionalCharges && (!config.chargeTypes || config.chargeTypes.length === 0)) {
    issues.push({
      severity: 'error',
      rule: 'CHARGES_MISSING',
      message: 'enableAdditionalCharges=true but chargeTypes is empty',
    });
  }

  return issues;
}

function validateFieldConfig(
  field: FieldConfig,
  path: string,
  validKeys: string[],
  issues: ValidationIssue[],
): void {
  // Check key is valid
  if (!validKeys.includes(field.key)) {
    issues.push({
      severity: 'error',
      rule: 'INVALID_FIELD_KEY',
      message: `Invalid field key "${field.key}". Must be one of: ${validKeys.join(', ')}`,
      path,
    });
  }

  // Check required properties
  if (!field.label || field.label.trim() === '') {
    issues.push({
      severity: 'error',
      rule: 'FIELD_LABEL_REQUIRED',
      message: `Field "${field.key}" has no label`,
      path,
    });
  }

  if (!field.type) {
    issues.push({
      severity: 'error',
      rule: 'FIELD_TYPE_REQUIRED',
      message: `Field "${field.key}" has no type`,
      path,
    });
  }

  // Check select fields have options
  if (field.type === 'select' && (!field.options || field.options.length === 0)) {
    issues.push({
      severity: 'error',
      rule: 'SELECT_NO_OPTIONS',
      message: `Select field "${field.key}" has no options`,
      path,
    });
  }

  // Check boolean flags are actually booleans
  if (typeof field.required !== 'boolean') {
    issues.push({
      severity: 'error',
      rule: 'FIELD_FLAG_TYPE',
      message: `Field "${field.key}" required must be boolean`,
      path,
    });
  }

  if (typeof field.visible !== 'boolean') {
    issues.push({
      severity: 'error',
      rule: 'FIELD_FLAG_TYPE',
      message: `Field "${field.key}" visible must be boolean`,
      path,
    });
  }

  if (typeof field.editable !== 'boolean') {
    issues.push({
      severity: 'error',
      rule: 'FIELD_FLAG_TYPE',
      message: `Field "${field.key}" editable must be boolean`,
      path,
    });
  }
}

function validateColumnConfig(
  col: ColumnConfig,
  path: string,
  validKeys: string[],
  issues: ValidationIssue[],
): void {
  // Check key is valid
  if (!validKeys.includes(col.key)) {
    issues.push({
      severity: 'error',
      rule: 'INVALID_COLUMN_KEY',
      message: `Invalid column key "${col.key}". Must be one of: ${validKeys.join(', ')}`,
      path,
    });
  }

  // Check required properties
  if (!col.label || col.label.trim() === '') {
    issues.push({
      severity: 'error',
      rule: 'COLUMN_LABEL_REQUIRED',
      message: `Column "${col.key}" has no label`,
      path,
    });
  }

  if (!col.width) {
    issues.push({
      severity: 'warning',
      rule: 'COLUMN_WIDTH_MISSING',
      message: `Column "${col.key}" has no width specified`,
      path,
    });
  }

  // Check boolean flags
  if (typeof col.visible !== 'boolean') {
    issues.push({
      severity: 'error',
      rule: 'COLUMN_FLAG_TYPE',
      message: `Column "${col.key}" visible must be boolean`,
      path,
    });
  }

  if (typeof col.editable !== 'boolean') {
    issues.push({
      severity: 'error',
      rule: 'COLUMN_FLAG_TYPE',
      message: `Column "${col.key}" editable must be boolean`,
      path,
    });
  }

  // Check align is valid
  if (!['left', 'center', 'right'].includes(col.align)) {
    issues.push({
      severity: 'error',
      rule: 'COLUMN_ALIGN_INVALID',
      message: `Column "${col.key}" align must be "left", "center", or "right"`,
      path,
    });
  }

  // Check format is valid if specified
  if (col.format && !['currency', 'number', 'percent'].includes(col.format)) {
    issues.push({
      severity: 'error',
      rule: 'COLUMN_FORMAT_INVALID',
      message: `Column "${col.key}" format must be "currency", "number", or "percent"`,
      path,
    });
  }
}

/**
 * Logs validation issues to console with formatted output
 */
export function logValidationIssues(
  configName: string,
  issues: ValidationIssue[],
): void {
  if (issues.length === 0) return;

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  console.group(`⚠️  Config Validation Issues: ${configName}`);

  if (errors.length > 0) {
    console.group(`❌ Errors (${errors.length})`);
    errors.forEach((err) => {
      console.error(
        `[${err.rule}] ${err.message}${err.path ? ` (${err.path})` : ''}`,
      );
    });
    console.groupEnd();
  }

  if (warnings.length > 0) {
    console.group(`⚠️  Warnings (${warnings.length})`);
    warnings.forEach((warn) => {
      console.warn(
        `[${warn.rule}] ${warn.message}${warn.path ? ` (${warn.path})` : ''}`,
      );
    });
    console.groupEnd();
  }

  console.groupEnd();

  // Throw error in dev if there are critical errors
  if (errors.length > 0 && process.env.NODE_ENV === 'development') {
    throw new Error(
      `Config validation failed for ${configName} with ${errors.length} error(s). Check console for details.`,
    );
  }
}

/**
 * Helper to validate and log config in one call
 */
export function validateAndLogConfig(
  configName: string,
  config: DocumentFormConfig,
): void {
  const issues = validateConfig(config);
  logValidationIssues(configName, issues);
}
