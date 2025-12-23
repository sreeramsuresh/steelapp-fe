/**
 * preloadWidgets - Intelligent preloading utilities for dashboard widgets
 */

import { LAZY_WIDGET_CATEGORIES } from './LazyWidgets';

/**
 * Preload all widgets in a specific category
 */
export const preloadCategory = async (category) => {
  const loaders = LAZY_WIDGET_CATEGORIES[category];
  if (!loaders) {
    console.warn(`[preloadWidgets] Unknown category: ${category}`);
    return;
  }

  try {
    await Promise.all(loaders.map((loader) => loader()));
  } catch (error) {
    console.error(`[preloadWidgets] Failed to preload ${category}:`, error);
  }
};

/**
 * Preload widgets based on user role
 */
const ROLE_CATEGORIES = {
  admin: ['financial', 'inventory', 'product', 'customer', 'sales', 'vat'],
  ceo: ['financial', 'inventory', 'product', 'customer', 'sales', 'vat'],
  cfo: ['financial', 'vat', 'customer'],
  accountant: ['financial', 'vat', 'customer'],
  sales_manager: ['sales', 'customer', 'product'],
  sales_agent: ['sales', 'customer'],
  operations_manager: ['inventory', 'product'],
  warehouse_manager: ['inventory', 'product'],
};

export const preloadByRole = async (role) => {
  const normalizedRole = String(role || '')
    .toLowerCase()
    .replace(/[-\s]/g, '_');
  const categories =
    ROLE_CATEGORIES[normalizedRole] || ROLE_CATEGORIES.sales_agent;

  for (const category of categories) {
    await preloadCategory(category);
  }
};

/**
 * Network-aware preloading
 */
export const smartPreload = async (category) => {
  if (navigator.connection) {
    const { effectiveType, saveData } = navigator.connection;
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return;
    }
  }
  await preloadCategory(category);
};

/**
 * Preload during idle time
 */
export const preloadOnIdle = (categories) => {
  const preload = async () => {
    for (const category of categories) {
      await preloadCategory(category);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload, { timeout: 5000 });
  } else {
    setTimeout(preload, 200);
  }
};

/**
 * Create hover/focus preload handler
 */
export const createHoverPreload = (category) => {
  let preloaded = false;

  const handlePreload = () => {
    if (!preloaded) {
      preloaded = true;
      smartPreload(category);
    }
  };

  return {
    onMouseEnter: handlePreload,
    onFocus: handlePreload,
  };
};

/**
 * Viewport-based preloading using IntersectionObserver
 */
export const createViewportPreload = (category) => {
  let preloaded = false;

  return (element) => {
    if (!element || preloaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !preloaded) {
          preloaded = true;
          smartPreload(category);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  };
};

export default {
  preloadCategory,
  preloadByRole,
  smartPreload,
  preloadOnIdle,
  createHoverPreload,
  createViewportPreload,
};
