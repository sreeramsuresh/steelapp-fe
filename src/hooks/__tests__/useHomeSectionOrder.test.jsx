import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import useHomeSectionOrder from '../useHomeSectionOrder';
import { userPreferencesService } from '../../services/userPreferencesService';

// Mock the userPreferencesService
vi.mock('../../services/userPreferencesService', () => ({
  userPreferencesService: {
    getHomeSectionOrder: vi.fn(),
    setHomeSectionOrder: vi.fn(),
    getCurrentUser: vi.fn(),
    updatePermissions: vi.fn(),
  },
}));

describe('useHomeSectionOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial state', () => {
    test('should return default order when no saved preferences', () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      const { result } = renderHook(() => useHomeSectionOrder());

      expect(result.current.sectionOrder).toEqual(['quickAccess', 'createNew', 'recentItems']);
      expect(result.current.isSaving).toBe(false);
    });

    test('should load saved order from localStorage', () => {
      const savedOrder = ['recentItems', 'quickAccess', 'createNew'];
      userPreferencesService.getHomeSectionOrder.mockReturnValue(savedOrder);

      const { result } = renderHook(() => useHomeSectionOrder());

      expect(result.current.sectionOrder).toEqual(savedOrder);
    });

    test('should validate and fix invalid sections', () => {
      const invalidOrder = ['quickAccess', 'invalid', 'createNew'];
      userPreferencesService.getHomeSectionOrder.mockReturnValue(invalidOrder);

      const { result } = renderHook(() => useHomeSectionOrder());

      expect(result.current.sectionOrder).toEqual(['quickAccess', 'createNew', 'recentItems']);
    });

    test('should add missing sections to the end', () => {
      const partialOrder = ['createNew'];
      userPreferencesService.getHomeSectionOrder.mockReturnValue(partialOrder);

      const { result } = renderHook(() => useHomeSectionOrder());

      expect(result.current.sectionOrder).toEqual(['createNew', 'quickAccess', 'recentItems']);
    });
  });

  describe('Reordering', () => {
    test('should update section order', () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      const { result } = renderHook(() => useHomeSectionOrder());

      const newOrder = ['recentItems', 'quickAccess', 'createNew'];

      act(() => {
        result.current.reorderSections(newOrder);
      });

      expect(result.current.sectionOrder).toEqual(newOrder);
    });

    test('should save to localStorage immediately', () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      const { result } = renderHook(() => useHomeSectionOrder());

      const newOrder = ['createNew', 'recentItems', 'quickAccess'];

      act(() => {
        result.current.reorderSections(newOrder);
      });

      expect(userPreferencesService.setHomeSectionOrder).toHaveBeenCalledWith(newOrder);
    });

    test('should validate order before saving', () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      const { result } = renderHook(() => useHomeSectionOrder());

      const invalidOrder = ['quickAccess', 'invalid', 'createNew'];

      act(() => {
        result.current.reorderSections(invalidOrder);
      });

      expect(result.current.sectionOrder).toEqual(['quickAccess', 'createNew', 'recentItems']);
      expect(userPreferencesService.setHomeSectionOrder).toHaveBeenCalledWith(
        ['quickAccess', 'createNew', 'recentItems'],
      );
    });

    test('should debounce backend save to 300ms', async () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      userPreferencesService.getCurrentUser.mockReturnValue({ id: 1, permissions: {} });
      userPreferencesService.updatePermissions.mockResolvedValue({ permissions: {} });

      const { result } = renderHook(() => useHomeSectionOrder());

      const newOrder = ['createNew', 'quickAccess', 'recentItems'];

      act(() => {
        result.current.reorderSections(newOrder);
      });

      // updatePermissions should not be called immediately
      expect(userPreferencesService.updatePermissions).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(() => {
        expect(userPreferencesService.updatePermissions).toHaveBeenCalled();
      });
    });

    test('should call updatePermissions with correct structure', async () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      userPreferencesService.getCurrentUser.mockReturnValue({
        id: 1,
        permissions: { role: 'admin' },
      });
      userPreferencesService.updatePermissions.mockResolvedValue({ permissions: {} });

      const { result } = renderHook(() => useHomeSectionOrder());

      const newOrder = ['recentItems', 'createNew', 'quickAccess'];

      act(() => {
        result.current.reorderSections(newOrder);
      });

      await waitFor(() => {
        expect(userPreferencesService.updatePermissions).toHaveBeenCalledWith(1, {
          role: 'admin',
          ui: {
            homeSectionOrder: newOrder,
          },
        });
      });
    });

    test('should handle backend sync failure gracefully', async () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      userPreferencesService.getCurrentUser.mockReturnValue({ id: 1, permissions: {} });
      userPreferencesService.updatePermissions.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useHomeSectionOrder());

      const newOrder = ['createNew', 'recentItems', 'quickAccess'];

      act(() => {
        result.current.reorderSections(newOrder);
      });

      // Should not throw, and state should still be updated
      expect(result.current.sectionOrder).toEqual(newOrder);

      await waitFor(() => {
        expect(userPreferencesService.updatePermissions).toHaveBeenCalled();
      });
    });

    test('should not sync to backend if user is not logged in', async () => {
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      userPreferencesService.getCurrentUser.mockReturnValue(null);

      const { result } = renderHook(() => useHomeSectionOrder());

      const newOrder = ['recentItems', 'quickAccess', 'createNew'];

      act(() => {
        result.current.reorderSections(newOrder);
      });

      await waitFor(() => {
        expect(userPreferencesService.updatePermissions).not.toHaveBeenCalled();
      });

      // But localStorage should still work
      expect(userPreferencesService.setHomeSectionOrder).toHaveBeenCalledWith(newOrder);
    });
  });

  describe('Cleanup', () => {
    test('should clear debounce timer on unmount', () => {
      vi.useFakeTimers();
      userPreferencesService.getHomeSectionOrder.mockReturnValue(null);
      userPreferencesService.getCurrentUser.mockReturnValue({ id: 1, permissions: {} });

      const { unmount, result } = renderHook(() => useHomeSectionOrder());

      act(() => {
        result.current.reorderSections(['createNew', 'quickAccess', 'recentItems']);
      });

      unmount();

      // Debounce timer should be cleared
      vi.runAllTimers();
      // Should not throw or call updatePermissions after unmount
      expect(userPreferencesService.updatePermissions).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
