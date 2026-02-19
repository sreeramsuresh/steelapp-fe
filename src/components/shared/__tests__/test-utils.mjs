/**
 * Test utilities for component testing
 * Provides fixtures, mocks, and helper functions for React Testing Library
 */

// Re-export RTL utilities
export { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Mock data fixtures for testing
 */
export const mockInvoices = [
  {
    id: 'INV-001',
    invoiceNumber: 'INV-2024-001',
    customerId: 'CUST-001',
    customerName: 'Acme Corp',
    amount: 15000.00,
    status: 'PAID',
    dueDate: '2024-02-15',
    issuedDate: '2024-01-15',
    companyId: 'COMP-001'
  },
  {
    id: 'INV-002',
    invoiceNumber: 'INV-2024-002',
    customerId: 'CUST-002',
    customerName: 'Tech Industries',
    amount: 25000.00,
    status: 'PENDING',
    dueDate: '2024-02-20',
    issuedDate: '2024-01-20',
    companyId: 'COMP-001'
  },
  {
    id: 'INV-003',
    invoiceNumber: 'INV-2024-003',
    customerId: 'CUST-001',
    customerName: 'Acme Corp',
    amount: 8500.00,
    status: 'OVERDUE',
    dueDate: '2023-12-15',
    issuedDate: '2023-11-15',
    companyId: 'COMP-001'
  }
];

export const mockPayments = [
  {
    id: 'PAY-001',
    invoiceId: 'INV-001',
    amount: 15000.00,
    paymentDate: '2024-02-10',
    method: 'BANK_TRANSFER',
    status: 'SUCCESS',
    companyId: 'COMP-001'
  },
  {
    id: 'PAY-002',
    invoiceId: 'INV-002',
    amount: 5000.00,
    paymentDate: '2024-02-05',
    method: 'CHECK',
    status: 'SUCCESS',
    companyId: 'COMP-001'
  }
];

export const mockInventoryItems = [
  {
    id: 'ITEM-001',
    sku: 'STEEL-001',
    name: 'Structural Steel Beams',
    quantity: 150,
    unit: 'TONS',
    unitPrice: 500.00,
    category: 'Raw Material',
    companyId: 'COMP-001'
  },
  {
    id: 'ITEM-002',
    sku: 'STEEL-002',
    name: 'Stainless Steel Plates',
    quantity: 75,
    unit: 'TONS',
    unitPrice: 750.00,
    category: 'Raw Material',
    companyId: 'COMP-001'
  },
  {
    id: 'ITEM-003',
    sku: 'FINISHED-001',
    name: 'Custom Brackets',
    quantity: 2000,
    unit: 'UNITS',
    unitPrice: 45.00,
    category: 'Finished Goods',
    companyId: 'COMP-001'
  }
];

export const mockUsers = [
  {
    id: 'USER-001',
    name: 'John Smith',
    email: 'john.smith@steelapp.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    companyId: 'COMP-001'
  },
  {
    id: 'USER-002',
    name: 'Jane Doe',
    email: 'jane.doe@steelapp.com',
    role: 'SALES_REP',
    status: 'ACTIVE',
    companyId: 'COMP-001'
  }
];

export const mockTimelineEvents = [
  {
    id: 'EVENT-001',
    type: 'INVOICE_CREATED',
    title: 'Invoice Created',
    description: 'INV-2024-001 created',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: 'EVENT-002',
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    description: 'Payment of $15,000 received',
    timestamp: '2024-02-10T14:15:00Z',
    status: 'completed'
  },
  {
    id: 'EVENT-003',
    type: 'INVOICE_SENT',
    title: 'Invoice Sent',
    description: 'INV-2024-001 sent to customer',
    timestamp: '2024-01-16T09:00:00Z',
    status: 'completed'
  }
];

/**
 * Mock service responses
 */
export const createMockDataService = () => {
  return {
    fetchInvoices: async () => mockInvoices,
    fetchInvoiceById: async (id) => mockInvoices.find(inv => inv.id === id),
    fetchPayments: async () => mockPayments,
    fetchInventory: async () => mockInventoryItems,
    fetchUsers: async () => mockUsers,
    createInvoice: async (data) => ({ id: 'INV-NEW', ...data }),
    updateInvoice: async (id, data) => ({ id, ...data }),
    deleteInvoice: async (id) => ({ success: true }),
    sortInvoices: async (field, order) => {
      const sorted = [...mockInvoices];
      sorted.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (typeof aVal === 'string') {
          return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      });
      return sorted;
    },
    filterInvoices: async (criteria) => {
      return mockInvoices.filter(inv => {
        if (criteria.status && inv.status !== criteria.status) return false;
        if (criteria.customerId && inv.customerId !== criteria.customerId) return false;
        if (criteria.minAmount && inv.amount < criteria.minAmount) return false;
        return true;
      });
    }
  };
};

/**
 * Sinon stub utilities for mocking
 */
export const createStub = (obj, method, returnValue) => {
  // For Node's native test runner, we'll use simple function wrapping
  // In a real scenario with Sinon, this would be: sinon.stub(obj, method).returns(returnValue)
  const original = obj[method];
  obj[method] = async () => returnValue;
  return {
    restore: () => {
      obj[method] = original;
    }
  };
};

/**
 * Test data helpers
 */
export const createMockInvoice = (overrides = {}) => ({
  ...mockInvoices[0],
  ...overrides
});

export const createMockPayment = (overrides = {}) => ({
  ...mockPayments[0],
  ...overrides
});

export const createMockInventoryItem = (overrides = {}) => ({
  ...mockInventoryItems[0],
  ...overrides
});

/**
 * Common assertions and matchers
 */
export const assertTableStructure = (table) => {
  if (!table) throw new Error('Table not found');
  const rows = table.querySelectorAll('tbody tr');
  if (rows.length === 0) throw new Error('No table rows found');
};

export const assertSortingState = (element, order) => {
  const aria = element.getAttribute('aria-sort');
  if (order === 'asc' && aria !== 'ascending') throw new Error('Not sorted ascending');
  if (order === 'desc' && aria !== 'descending') throw new Error('Not sorted descending');
};

export const assertLoadingState = (container) => {
  const loader = container.querySelector('[role="status"]');
  if (!loader) throw new Error('Loading state not found');
};

export const assertEmptyState = (container) => {
  const empty = container.querySelector('[data-testid="empty-state"]');
  if (!empty) throw new Error('Empty state not found');
};

export const assertErrorState = (container) => {
  const error = container.querySelector('[role="alert"]');
  if (!error) throw new Error('Error state not found');
};

/**
 * Keyboard event helpers
 */
export const triggerKeydown = (element, key) => {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key.toUpperCase(),
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
  return event;
};

export const triggerArrowKey = (element, direction) => {
  const keyMap = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight'
  };
  return triggerKeydown(element, keyMap[direction]);
};

/**
 * Dark mode test utilities
 */
export const setupDarkMode = (element) => {
  element.classList.add('dark');
};

export const removeDarkMode = (element) => {
  element.classList.remove('dark');
};

export const assertDarkModeClass = (element) => {
  if (!element.classList.contains('dark')) {
    throw new Error('Dark mode class not applied');
  }
};

/**
 * Responsive test utilities
 */
export const setViewportSize = (width, height) => {
  global.innerWidth = width;
  global.innerHeight = height;
  global.dispatchEvent(new Event('resize'));
};

export const VIEWPORT_SIZES = {
  MOBILE: { width: 320, height: 568 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1920, height: 1080 }
};
