/**
 * Unit Tests for useCreditNoteDrafts Hook
 *
 * Test Coverage:
 * - Draft save/load/delete operations
 * - Auto-save with manual credit amount only
 * - Conflict detection
 * - Draft expiry
 * - localStorage persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useCreditNoteDrafts, {
  formatRelativeTime,
  formatTimeUntilExpiry,
  getDraftStatusMessage,
  cleanupExpiredDrafts,
} from '../useCreditNoteDrafts';

describe('useCreditNoteDrafts Hook', () => {
  let localStorageMock;

  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
  });

  // ============================================
  // Basic Operations
  // ============================================

  describe('Basic Operations', () => {
    it('should initialize with empty drafts', () => {
      const { result } = renderHook(() => useCreditNoteDrafts());

      expect(result.current.drafts).toEqual({});
      expect(result.current.currentDraft).toBeNull();
      expect(result.current.hasDrafts).toBe(false);
    });

    it('should save a draft with manual credit amount', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      const draftData = {
        invoiceId: 337,
        invoiceNumber: 'INV-202512-0042',
        creditNoteDate: '2025-12-05',
        reasonForReturn: 'goodwill_credit',
        creditNoteType: 'ACCOUNTING_ONLY',
        manualCreditAmount: 500,
        items: [],
      };

      const invoiceInfo = {
        invoiceId: 337,
        invoiceNumber: 'INV-202512-0042',
        customerName: 'Emirates Fabrication',
      };

      act(() => {
        result.current.saveDraft(draftData, invoiceInfo);
      });

      // Verify draft was saved
      expect(result.current.currentDraft).toBeTruthy();
      expect(result.current.currentDraft.data.manualCreditAmount).toBe(500);
      expect(result.current.hasDraftForInvoice(337)).toBe(true);
    });

    it('should retrieve a saved draft', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      const draftData = {
        invoiceId: 337,
        manualCreditAmount: 750,
        reasonForReturn: 'overcharge',
        items: [],
      };

      act(() => {
        result.current.saveDraft(draftData, {
          invoiceId: 337,
          invoiceNumber: 'INV-202512-0042',
          customerName: 'Test Customer',
        });
      });

      const retrieved = result.current.getDraft(337);
      expect(retrieved).toBeTruthy();
      expect(retrieved.data.manualCreditAmount).toBe(750);
      expect(retrieved.invoiceId).toBe(337);
    });

    it('should delete a draft', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      // Save draft
      act(() => {
        result.current.saveDraft(
          { manualCreditAmount: 500, items: [] },
          { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test' },
        );
      });

      expect(result.current.hasDraftForInvoice(337)).toBe(true);

      // Delete draft
      act(() => {
        result.current.deleteDraft(337);
      });

      expect(result.current.hasDraftForInvoice(337)).toBe(false);
    });

    it('should clear all drafts', () => {
      const { result } = renderHook(() => useCreditNoteDrafts());

      // Save multiple drafts
      act(() => {
        result.current.saveDraft(
          { manualCreditAmount: 500, items: [] },
          { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test 1' },
        );
        result.current.saveDraft(
          { manualCreditAmount: 750, items: [] },
          { invoiceId: 338, invoiceNumber: 'INV-002', customerName: 'Test 2' },
        );
      });

      expect(result.current.allDrafts.length).toBeGreaterThan(0);

      // Clear all
      act(() => {
        result.current.clearAllDrafts();
      });

      expect(result.current.allDrafts.length).toBe(0);
      expect(result.current.hasDrafts).toBe(false);
    });
  });

  // ============================================
  // Auto-Save with Manual Credit Amount Only
  // ============================================

  describe('Auto-Save with Manual Credit Amount', () => {
    it('should save draft with manual credit amount and no items', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      const draftData = {
        invoiceId: 337,
        creditNoteType: 'ACCOUNTING_ONLY',
        manualCreditAmount: 500,
        items: [], // No items selected
        reasonForReturn: 'goodwill_credit',
      };

      act(() => {
        result.current.saveDraft(draftData, {
          invoiceId: 337,
          invoiceNumber: 'INV-202512-0042',
          customerName: 'Emirates Fabrication',
        });
      });

      const saved = result.current.getDraft(337);
      expect(saved).toBeTruthy();
      expect(saved.data.manualCreditAmount).toBe(500);
      expect(saved.data.items).toHaveLength(0);

      // Verify in localStorage
      const stored = JSON.parse(localStorageMock['credit_note_drafts'] || '{}');
      expect(stored[337]).toBeDefined();
      expect(stored[337].data.manualCreditAmount).toBe(500);
    });

    it('should update manual credit amount in existing draft', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      // Initial save
      act(() => {
        result.current.saveDraft(
          { manualCreditAmount: 500, items: [] },
          { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test' },
        );
      });

      expect(result.current.getDraft(337).data.manualCreditAmount).toBe(500);

      // Update amount
      act(() => {
        result.current.saveDraft(
          { manualCreditAmount: 750, items: [] },
          { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test' },
        );
      });

      expect(result.current.getDraft(337).data.manualCreditAmount).toBe(750);
    });

    it('should save draft with both items and manual amount', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      const draftData = {
        invoiceId: 337,
        manualCreditAmount: 250,
        items: [
          {
            id: 1,
            productName: 'Test Product',
            quantityReturned: 5,
            selected: true,
          },
        ],
      };

      act(() => {
        result.current.saveDraft(draftData, {
          invoiceId: 337,
          invoiceNumber: 'INV-001',
          customerName: 'Test',
        });
      });

      const saved = result.current.getDraft(337);
      expect(saved.data.manualCreditAmount).toBe(250);
      expect(saved.data.items).toHaveLength(1);
      expect(saved.data.items[0].quantityReturned).toBe(5);
    });
  });

  // ============================================
  // Conflict Detection
  // ============================================

  describe('Conflict Detection', () => {
    it('should detect same invoice draft conflict', () => {
      const { result } = renderHook(() => useCreditNoteDrafts());

      // Save draft for invoice 337
      act(() => {
        result.current.saveDraft(
          { manualCreditAmount: 500, items: [] },
          { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test' },
        );
      });

      // Check conflict for same invoice
      const conflict = result.current.checkConflict(337);
      expect(conflict.type).toBe('same_invoice');
      expect(conflict.existingDraft).toBeTruthy();
      expect(conflict.existingDraft.invoiceId).toBe(337);
    });

    it('should detect different invoice draft conflict', () => {
      const { result } = renderHook(() => useCreditNoteDrafts());

      // Save draft for invoice 337
      act(() => {
        result.current.saveDraft(
          { manualCreditAmount: 500, items: [] },
          { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test 1' },
        );
      });

      // Check conflict for different invoice
      const conflict = result.current.checkConflict(338);
      expect(conflict.type).toBe('different_invoice');
      expect(conflict.existingDraft).toBeTruthy();
      expect(conflict.existingDraft.invoiceId).toBe(337);
    });

    it('should return no conflict when no drafts exist', () => {
      const { result } = renderHook(() => useCreditNoteDrafts());

      const conflict = result.current.checkConflict(337);
      expect(conflict.type).toBeNull();
      expect(conflict.existingDraft).toBeNull();
    });
  });

  // ============================================
  // Draft Expiry
  // ============================================

  describe('Draft Expiry', () => {
    it('should not return expired drafts', () => {
      const { result } = renderHook(() => useCreditNoteDrafts());

      // Create expired draft manually
      const expiredDraft = {
        337: {
          data: { manualCreditAmount: 500, items: [] },
          invoiceId: 337,
          invoiceNumber: 'INV-001',
          customerName: 'Test',
          timestamp: Date.now() - 86400000, // Yesterday
          expiresAt: Date.now() - 3600000, // 1 hour ago (expired)
        },
      };

      localStorageMock['credit_note_drafts'] = JSON.stringify(expiredDraft);

      // Refresh drafts
      act(() => {
        result.current.refreshDrafts();
      });

      // Expired draft should not be accessible
      expect(result.current.hasDraftForInvoice(337)).toBe(false);
      expect(result.current.getDraft(337)).toBeNull();
    });

    it('should cleanup expired drafts', () => {
      // Setup expired and valid drafts
      const drafts = {
        337: {
          data: { manualCreditAmount: 500, items: [] },
          invoiceId: 337,
          timestamp: Date.now(),
          expiresAt: Date.now() - 3600000, // Expired
        },
        338: {
          data: { manualCreditAmount: 750, items: [] },
          invoiceId: 338,
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000, // Valid
        },
      };

      localStorageMock['credit_note_drafts'] = JSON.stringify(drafts);

      const cleaned = cleanupExpiredDrafts();

      // Only valid draft should remain
      expect(cleaned[337]).toBeUndefined();
      expect(cleaned[338]).toBeDefined();
    });
  });

  // ============================================
  // Pending Save (for unmount)
  // ============================================

  describe('Pending Save', () => {
    it('should track pending save data', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      const pendingData = {
        manualCreditAmount: 500,
        reasonForReturn: 'goodwill_credit',
        items: [],
      };

      act(() => {
        result.current.setPendingSave(pendingData, {
          invoiceId: 337,
          invoiceNumber: 'INV-001',
          customerName: 'Test',
        });
      });

      // Pending save is internal - verify it doesn't throw
      expect(() => result.current.clearPendingSave()).not.toThrow();
    });
  });

  // ============================================
  // Utility Functions
  // ============================================

  describe('Utility Functions', () => {
    it('formatRelativeTime should format timestamps correctly', () => {
      const now = Date.now();

      expect(formatRelativeTime(now)).toBe('just now');
      expect(formatRelativeTime(now - 30000)).toMatch(/30s ago/);
      expect(formatRelativeTime(now - 120000)).toMatch(/2m ago/);
      expect(formatRelativeTime(now - 7200000)).toMatch(/2h ago/);
    });

    it('formatTimeUntilExpiry should format expiry time', () => {
      const now = Date.now();

      // Allow for test execution time variance (1h 59m or 2h 0m)
      expect(formatTimeUntilExpiry(now + 7200000)).toMatch(/[12]h [0-9]{1,2}m/);
      expect(formatTimeUntilExpiry(now + 1800000)).toMatch(/[23][0-9]m/);
      expect(formatTimeUntilExpiry(now - 1000)).toBe('expired');
    });

    it('getDraftStatusMessage should format status message', () => {
      const draft = {
        timestamp: Date.now() - 3600000, // 1 hour ago
        expiresAt: new Date().setHours(23, 59, 59, 999), // Tonight
      };

      const message = getDraftStatusMessage(draft);
      expect(message).toContain('Saved');
      expect(message).toContain('Expires tonight at midnight');
    });
  });

  // ============================================
  // localStorage Persistence
  // ============================================

  describe('localStorage Persistence', () => {
    it('should persist drafts to localStorage', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      act(() => {
        result.current.saveDraft(
          { manualCreditAmount: 500, items: [] },
          { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test' },
        );
      });

      // Verify localStorage was called
      expect(localStorage.setItem).toHaveBeenCalled();

      // Verify data structure
      const stored = JSON.parse(localStorageMock['credit_note_drafts']);
      expect(stored[337]).toBeDefined();
      expect(stored[337].data.manualCreditAmount).toBe(500);
      expect(stored[337].timestamp).toBeDefined();
      expect(stored[337].expiresAt).toBeDefined();
    });

    it('should load drafts from localStorage on init', () => {
      // Pre-populate localStorage
      const existingDrafts = {
        337: {
          data: { manualCreditAmount: 500, items: [] },
          invoiceId: 337,
          invoiceNumber: 'INV-001',
          customerName: 'Test',
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000,
        },
      };

      localStorageMock['credit_note_drafts'] = JSON.stringify(existingDrafts);

      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      // Should load existing draft
      waitFor(() => {
        expect(result.current.hasDraftForInvoice(337)).toBe(true);
        expect(result.current.getDraft(337).data.manualCreditAmount).toBe(500);
      });
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set invalid JSON
      localStorageMock['credit_note_drafts'] = 'invalid json {{{';

      const { result } = renderHook(() => useCreditNoteDrafts());

      // Should not crash and return empty drafts
      expect(result.current.drafts).toEqual({});
      expect(result.current.hasDrafts).toBe(false);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================

  describe('Edge Cases', () => {
    it('should handle null invoiceId gracefully', () => {
      const { result } = renderHook(() => useCreditNoteDrafts());

      const success = result.current.saveDraft(
        { manualCreditAmount: 500 },
        { invoiceId: null },
      );

      expect(success).toBe(false);
    });

    it('should handle missing invoice info', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      act(() => {
        result.current.saveDraft(
          { invoiceId: 337, manualCreditAmount: 500, items: [] },
          {}, // Empty invoice info
        );
      });

      const saved = result.current.getDraft(337);
      expect(saved).toBeTruthy();
      expect(saved.data.manualCreditAmount).toBe(500);
    });

    it('should handle multiple rapid saves', () => {
      const { result } = renderHook(() =>
        useCreditNoteDrafts({ currentInvoiceId: 337 }),
      );

      // Rapid saves
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.saveDraft(
            { manualCreditAmount: 100 + i, items: [] },
            { invoiceId: 337, invoiceNumber: 'INV-001', customerName: 'Test' },
          );
        }
      });

      // Last save should win
      const saved = result.current.getDraft(337);
      expect(saved.data.manualCreditAmount).toBe(109);
    });
  });
});
