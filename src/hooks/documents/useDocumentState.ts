// ═══════════════════════════════════════════════════════════════
// DOCUMENT STATE HOOK (Rule 2 - Canonical State Management)
// Single source of truth for document state with all setters
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DocumentState,
  DocumentHeader,
  DocumentParty,
  LineItem,
  DocumentDiscount,
  DocumentNotes,
  DocumentFormConfig,
  UseDocumentStateReturn,
  DEFAULT_VAT_RATE,
  DEFAULT_CURRENCY,
  DEFAULT_EXCHANGE_RATE,
} from '../../config/documents/types';

/**
 * Generate a temporary ID for line items (Rule 12)
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create initial empty document state
 */
function createInitialDocument(config: DocumentFormConfig): DocumentState {
  return {
    header: {
      docNumber: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: null,
      currency: config.defaults.currency || DEFAULT_CURRENCY,
      exchangeRate: config.defaults.exchangeRate || DEFAULT_EXCHANGE_RATE,
      reference: null,
      paymentTerms: config.defaults.paymentTerms || null,
      emirate: config.defaults.emirate || null,
    },
    party: {
      id: null,
      type: config.partyType,
      name: '',
      company: null,
      trn: null,
      email: null,
      phone: null,
      address: {
        street: '',
        city: '',
        emirate: '',
        country: 'UAE',
        postalCode: null,
      },
    },
    lines: [],
    charges: [],
    discount: {
      type: 'amount',
      value: 0,
    },
    totals: {
      subtotal: 0,
      discountAmount: 0,
      chargesTotal: 0,
      chargesVat: 0,
      vatAmount: 0,
      total: 0,
      totalAed: 0,
    },
    notes: {
      customerNotes: '',
      internalNotes: '',
      termsAndConditions: '',
    },
    meta: {
      status: config.defaults.status || 'draft',
      createdAt: null,
      updatedAt: null,
      createdBy: null,
      isLocked: false,
    },
  };
}

/**
 * Create empty line item with defaults
 */
function createEmptyLine(config: DocumentFormConfig, partial?: Partial<LineItem>): LineItem {
  return {
    id: generateTempId(),
    productId: null,
    productName: '',
    description: '',
    quantity: 1,
    unit: 'PCS',
    rate: 0,
    amount: 0,
    vatRate: config.defaults.vatRate || DEFAULT_VAT_RATE,
    vatAmount: 0,
    discountPercent: 0,
    discountAmount: 0,
    ...partial,
  };
}

/**
 * Main document state management hook
 */
export function useDocumentState(
  config: DocumentFormConfig,
  initialDocument?: DocumentState,
): UseDocumentStateReturn {
  // Core state
  const [document, setDocumentInternal] = useState<DocumentState>(
    () => initialDocument || createInitialDocument(config),
  );

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false);
  const initialDocRef = useRef(initialDocument);

  // NOTE: Calculations are handled externally by DocumentForm using useDocumentCalculator
  // This hook only manages raw document state - no calculation syncing to avoid infinite loops

  // Track dirty state
  useEffect(() => {
    if (initialDocRef.current) {
      const isModified = JSON.stringify(document) !== JSON.stringify(initialDocRef.current);
      setIsDirty(isModified);
    } else {
      // No initial doc means new document - dirty if any data entered
      const hasData =
        document.party.id !== null ||
        document.lines.length > 0 ||
        document.header.reference !== null;
      setIsDirty(hasData);
    }
  }, [document]);

  // Setters

  const setDocument = useCallback((updates: Partial<DocumentState>) => {
    setDocumentInternal((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const setHeader = useCallback((updates: Partial<DocumentHeader>) => {
    setDocumentInternal((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        ...updates,
      },
    }));
  }, []);

  const setParty = useCallback((party: DocumentParty) => {
    setDocumentInternal((prev) => ({
      ...prev,
      party,
    }));
  }, []);

  const addLine = useCallback(
    (line?: Partial<LineItem>) => {
      const newLine = createEmptyLine(config, line);
      setDocumentInternal((prev) => ({
        ...prev,
        lines: [...prev.lines, newLine],
      }));
    },
    [config],
  );

  const updateLine = useCallback((index: number, updates: Partial<LineItem>) => {
    setDocumentInternal((prev) => {
      const newLines = [...prev.lines];
      if (index >= 0 && index < newLines.length) {
        newLines[index] = {
          ...newLines[index],
          ...updates,
        };
      }
      return {
        ...prev,
        lines: newLines,
      };
    });
  }, []);

  const removeLine = useCallback((index: number) => {
    setDocumentInternal((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  }, []);

  const reorderLines = useCallback((fromIndex: number, toIndex: number) => {
    setDocumentInternal((prev) => {
      const newLines = [...prev.lines];
      const [movedLine] = newLines.splice(fromIndex, 1);
      newLines.splice(toIndex, 0, movedLine);
      return {
        ...prev,
        lines: newLines,
      };
    });
  }, []);

  const setCharge = useCallback((type: string, amount: number) => {
    setDocumentInternal((prev) => {
      const charges = [...prev.charges];
      const existingIndex = charges.findIndex((c) => c.type === type);

      if (amount === 0 && existingIndex >= 0) {
        // Remove charge if amount is 0
        charges.splice(existingIndex, 1);
      } else if (existingIndex >= 0) {
        // Update existing charge
        charges[existingIndex] = {
          ...charges[existingIndex],
          amount,
        };
      } else if (amount > 0) {
        // Add new charge
        const chargeConfig = config.chargeTypes?.find((ct) => ct.key === type);
        charges.push({
          type: type as any,
          label: chargeConfig?.label || type,
          amount,
          vatRate: chargeConfig?.defaultVatRate || config.defaults.vatRate || DEFAULT_VAT_RATE,
          vatAmount: 0, // Will be calculated
        });
      }

      return {
        ...prev,
        charges,
      };
    });
  }, [config]);

  const setDiscount = useCallback((discount: DocumentDiscount) => {
    setDocumentInternal((prev) => ({
      ...prev,
      discount,
    }));
  }, []);

  const setNotes = useCallback((updates: Partial<DocumentNotes>) => {
    setDocumentInternal((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        ...updates,
      },
    }));
  }, []);

  const resetDocument = useCallback(() => {
    const newDoc = createInitialDocument(config);
    setDocumentInternal(newDoc);
    initialDocRef.current = undefined;
    setIsDirty(false);
  }, [config]);

  return {
    document,
    setDocument,
    setHeader,
    setParty,
    addLine,
    updateLine,
    removeLine,
    reorderLines,
    setCharge,
    setDiscount,
    setNotes,
    resetDocument,
    isDirty,
  };
}

/**
 * Bulk line operations helper
 */
export function useBulkLineOperations(
  updateLine: (index: number, updates: Partial<LineItem>) => void,
  removeLine: (index: number) => void,
) {
  const updateMultipleLines = useCallback(
    (indices: number[], updates: Partial<LineItem>) => {
      indices.forEach((index) => {
        updateLine(index, updates);
      });
    },
    [updateLine],
  );

  const removeMultipleLines = useCallback(
    (indices: number[]) => {
      // Remove in reverse order to maintain indices
      const sortedIndices = [...indices].sort((a, b) => b - a);
      sortedIndices.forEach((index) => {
        removeLine(index);
      });
    },
    [removeLine],
  );

  const applyDiscountToLines = useCallback(
    (indices: number[], discountPercent: number) => {
      updateMultipleLines(indices, { discountPercent });
    },
    [updateMultipleLines],
  );

  const applyVatRateToLines = useCallback(
    (indices: number[], vatRate: number) => {
      updateMultipleLines(indices, { vatRate });
    },
    [updateMultipleLines],
  );

  return {
    updateMultipleLines,
    removeMultipleLines,
    applyDiscountToLines,
    applyVatRateToLines,
  };
}

export default useDocumentState;
