// ═══════════════════════════════════════════════════════════════
// DOCUMENT VALIDATION HOOK (Rule 10)
// Layered validation: field → cross-field → business logic
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import {
  DocumentState,
  DocumentFormConfig,
  ValidationError,
  ValidationResult,
  ValidatorFn,
} from '../../config/documents/types';

/**
 * Field-level validators
 */
const fieldValidators = {
  required: (value: unknown, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') {
      return {
        level: 'field',
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED',
      };
    }
    return null;
  },

  positiveNumber: (value: number, fieldName: string): ValidationError | null => {
    if (isNaN(value) || value <= 0) {
      return {
        level: 'field',
        field: fieldName,
        message: `${fieldName} must be a positive number`,
        code: 'POSITIVE_NUMBER',
      };
    }
    return null;
  },

  nonNegativeNumber: (value: number, fieldName: string): ValidationError | null => {
    if (isNaN(value) || value < 0) {
      return {
        level: 'field',
        field: fieldName,
        message: `${fieldName} cannot be negative`,
        code: 'NON_NEGATIVE',
      };
    }
    return null;
  },

  validDate: (value: string, fieldName: string): ValidationError | null => {
    if (!value || isNaN(Date.parse(value))) {
      return {
        level: 'field',
        field: fieldName,
        message: `${fieldName} must be a valid date`,
        code: 'INVALID_DATE',
      };
    }
    return null;
  },

  validEmail: (value: string, fieldName: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return {
        level: 'field',
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        code: 'INVALID_EMAIL',
      };
    }
    return null;
  },

  maxLength: (value: string, fieldName: string, max: number): ValidationError | null => {
    if (value && value.length > max) {
      return {
        level: 'field',
        field: fieldName,
        message: `${fieldName} cannot exceed ${max} characters`,
        code: 'MAX_LENGTH',
      };
    }
    return null;
  },

  percentRange: (value: number, fieldName: string): ValidationError | null => {
    if (value < 0 || value > 100) {
      return {
        level: 'field',
        field: fieldName,
        message: `${fieldName} must be between 0 and 100`,
        code: 'PERCENT_RANGE',
      };
    }
    return null;
  },
};

/**
 * Validate header fields based on config
 */
function validateHeader(doc: DocumentState, config: DocumentFormConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields from config
  config.headerFields?.forEach((fieldConfig) => {
    if (!fieldConfig.required || !fieldConfig.visible) return;

    const value = doc.header[fieldConfig.key as keyof typeof doc.header];

    if (fieldConfig.type === 'date') {
      const err = fieldValidators.required(value, fieldConfig.label);
      if (err) errors.push(err);
      else if (value) {
        const dateErr = fieldValidators.validDate(String(value), fieldConfig.label);
        if (dateErr) errors.push(dateErr);
      }
    } else if (fieldConfig.type === 'number') {
      const err = fieldValidators.required(value, fieldConfig.label);
      if (err) errors.push(err);
      else if (value !== null && value !== undefined) {
        const numErr = fieldValidators.positiveNumber(Number(value), fieldConfig.label);
        if (numErr) errors.push(numErr);
      }
    } else {
      const err = fieldValidators.required(value, fieldConfig.label);
      if (err) errors.push(err);
    }
  });

  // Exchange rate validation
  if (config.features.enableExchangeRate) {
    const rate = doc.header.exchangeRate;
    if (rate <= 0) {
      errors.push({
        level: 'field',
        field: 'exchangeRate',
        message: 'Exchange rate must be greater than 0',
        code: 'INVALID_EXCHANGE_RATE',
      });
    }
  }

  return errors;
}

/**
 * Validate party fields
 */
function validateParty(doc: DocumentState, config: DocumentFormConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const party = doc.party;

  // Party must be selected
  if (!party.id) {
    errors.push({
      level: 'field',
      field: 'party',
      message: `${config.partyLabel} must be selected`,
      code: 'PARTY_REQUIRED',
    });
  }

  // Email validation (if provided)
  if (party.email) {
    const err = fieldValidators.validEmail(party.email, 'Email');
    if (err) errors.push(err);
  }

  return errors;
}

/**
 * Validate line items
 */
function validateLines(doc: DocumentState, config: DocumentFormConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = doc.lines || [];

  // At least one line item required
  if (lines.length === 0) {
    errors.push({
      level: 'business',
      message: 'At least one line item is required',
      code: 'NO_LINE_ITEMS',
    });
    return errors;
  }

  // Validate each line
  lines.forEach((line, index) => {
    const prefix = `Line ${index + 1}`;

    // Product name required
    if (!line.productName || line.productName.trim() === '') {
      errors.push({
        level: 'field',
        field: `lines[${index}].productName`,
        message: `${prefix}: Product name is required`,
        code: 'LINE_PRODUCT_REQUIRED',
      });
    }

    // Quantity validation
    const qtyErr = fieldValidators.positiveNumber(line.quantity, `${prefix} Quantity`);
    if (qtyErr) errors.push(qtyErr);

    // Rate validation
    const rateErr = fieldValidators.positiveNumber(line.rate, `${prefix} Rate`);
    if (rateErr) errors.push(rateErr);

    // VAT rate validation
    if (config.features.enableLineVat) {
      const vatErr = fieldValidators.nonNegativeNumber(line.vatRate, `${prefix} VAT Rate`);
      if (vatErr) errors.push(vatErr);

      const percentErr = fieldValidators.percentRange(line.vatRate, `${prefix} VAT Rate`);
      if (percentErr) errors.push(percentErr);
    }

    // Discount validation
    if (config.features.enableLineDiscount && line.discountPercent > 0) {
      const discErr = fieldValidators.percentRange(line.discountPercent, `${prefix} Discount`);
      if (discErr) errors.push(discErr);
    }
  });

  return errors;
}

/**
 * Validate charges
 */
function validateCharges(doc: DocumentState, config: DocumentFormConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.features.enableAdditionalCharges) return errors;

  const charges = doc.charges || [];

  charges.forEach((charge, index) => {
    const prefix = `Charge ${index + 1}`;

    // Amount validation
    const amtErr = fieldValidators.nonNegativeNumber(charge.amount, `${prefix} Amount`);
    if (amtErr) errors.push(amtErr);

    // VAT rate validation
    if (config.features.enableVat) {
      const vatErr = fieldValidators.nonNegativeNumber(charge.vatRate, `${prefix} VAT Rate`);
      if (vatErr) errors.push(vatErr);

      const percentErr = fieldValidators.percentRange(charge.vatRate, `${prefix} VAT Rate`);
      if (percentErr) errors.push(percentErr);
    }
  });

  return errors;
}

/**
 * Cross-field validators
 */
function validateCrossFields(doc: DocumentState, config: DocumentFormConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Due date must be after invoice date
  if (config.features.enableDueDate && doc.header.dueDate) {
    const invoiceDate = new Date(doc.header.date);
    const dueDate = new Date(doc.header.dueDate);

    if (dueDate < invoiceDate) {
      errors.push({
        level: 'cross-field',
        field: 'dueDate',
        message: 'Due date cannot be before document date',
        code: 'DUE_DATE_BEFORE_DATE',
      });
    }
  }

  // Discount validation
  if (config.features.enableInvoiceDiscount && doc.discount.value > 0) {
    if (doc.discount.type === 'percent' && doc.discount.value > 100) {
      errors.push({
        level: 'cross-field',
        field: 'discount',
        message: 'Discount percentage cannot exceed 100%',
        code: 'INVALID_DISCOUNT_PERCENT',
      });
    }

    if (doc.discount.type === 'amount' && doc.discount.value > doc.totals.subtotal) {
      errors.push({
        level: 'cross-field',
        field: 'discount',
        message: 'Discount amount cannot exceed subtotal',
        code: 'DISCOUNT_EXCEEDS_SUBTOTAL',
      });
    }
  }

  return errors;
}

/**
 * Business logic validators
 */
function validateBusinessRules(doc: DocumentState, config: DocumentFormConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Total must be positive
  if (doc.totals.total <= 0) {
    errors.push({
      level: 'business',
      message: 'Document total must be greater than zero',
      code: 'ZERO_TOTAL',
    });
  }

  // Check if draft status allows submission
  if (doc.meta.status !== 'draft' && doc.meta.isLocked) {
    errors.push({
      level: 'business',
      message: 'Cannot modify a locked document',
      code: 'DOCUMENT_LOCKED',
    });
  }

  return errors;
}

/**
 * Main validation hook
 */
export function useDocumentValidation(
  document: DocumentState,
  config: DocumentFormConfig,
  customValidators: ValidatorFn[] = [],
): ValidationResult {
  return useMemo(() => {
    const errors: ValidationError[] = [];

    // Layer 1: Field-level validation
    errors.push(...validateHeader(document, config));
    errors.push(...validateParty(document, config));
    errors.push(...validateLines(document, config));
    errors.push(...validateCharges(document, config));

    // Layer 2: Cross-field validation
    errors.push(...validateCrossFields(document, config));

    // Layer 3: Business logic validation
    errors.push(...validateBusinessRules(document, config));

    // Layer 4: Custom validators (from config overrides)
    customValidators.forEach((validator) => {
      errors.push(...validator(document, config));
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [document, config, customValidators]);
}

/**
 * Validate a single field (for real-time feedback)
 */
export function validateField(
  value: unknown,
  fieldName: string,
  fieldType: 'text' | 'number' | 'date' | 'email' | 'required',
): ValidationError | null {
  switch (fieldType) {
    case 'required':
      return fieldValidators.required(value, fieldName);
    case 'number':
      return fieldValidators.positiveNumber(Number(value), fieldName);
    case 'date':
      return fieldValidators.validDate(String(value), fieldName);
    case 'email':
      return fieldValidators.validEmail(String(value), fieldName);
    default:
      return null;
  }
}

/**
 * Group errors by level
 */
export function groupErrorsByLevel(errors: ValidationError[]): Record<string, ValidationError[]> {
  return errors.reduce(
    (acc, error) => {
      if (!acc[error.level]) {
        acc[error.level] = [];
      }
      acc[error.level].push(error);
      return acc;
    },
    {} as Record<string, ValidationError[]>,
  );
}

/**
 * Get errors for a specific field
 */
export function getFieldErrors(errors: ValidationError[], fieldPath: string): ValidationError[] {
  return errors.filter((err) => err.field === fieldPath);
}

/**
 * Check if document can be saved as draft (relaxed validation)
 */
export function canSaveAsDraft(document: DocumentState): ValidationResult {
  const errors: ValidationError[] = [];

  // Only critical fields required for draft
  if (!document.header.date) {
    errors.push({
      level: 'field',
      field: 'date',
      message: 'Date is required',
      code: 'REQUIRED',
    });
  }

  if (!document.party.id) {
    errors.push({
      level: 'field',
      field: 'party',
      message: 'Party must be selected',
      code: 'PARTY_REQUIRED',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if document can be approved (strict validation)
 */
export function canApprove(
  document: DocumentState,
  config: DocumentFormConfig,
): ValidationResult {
  // Full validation required for approval
  const validation = useDocumentValidation(document, config);

  // Additional approval-specific checks
  const additionalErrors: ValidationError[] = [];

  if (document.meta.status !== 'draft') {
    additionalErrors.push({
      level: 'business',
      message: 'Only draft documents can be approved',
      code: 'INVALID_STATUS_FOR_APPROVAL',
    });
  }

  if (document.totals.total <= 0) {
    additionalErrors.push({
      level: 'business',
      message: 'Cannot approve document with zero total',
      code: 'ZERO_TOTAL',
    });
  }

  return {
    isValid: validation.isValid && additionalErrors.length === 0,
    errors: [...validation.errors, ...additionalErrors],
  };
}

export default useDocumentValidation;
