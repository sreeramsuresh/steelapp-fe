/* eslint-disable no-undef */
/**
 * Mock Data for Role Management Tests
 *
 * This file contains reusable mock data and helper functions
 * for testing the role management system.
 */

/**
 * Create a mock role with default values
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock role object
 */
export const createMockRole = (overrides = {}) => ({
  id: 1,
  name: 'Test Role',
  displayName: 'Test Role',
  description: 'Test description',
  isDirector: false,
  isSystemRole: false,
  isSystem: false,
  companyId: 1,
  permissionKeys: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 1,
  updatedBy: 1,
  ...overrides,
});

/**
 * Mock system roles (12 pre-defined roles)
 */
export const mockSystemRoles = [
  createMockRole({
    id: 1,
    name: 'Managing Director',
    displayName: 'Managing Director',
    description: 'Top-level executive with full authority',
    isSystemRole: true,
    isSystem: true,
    isDirector: true,
    permissionKeys: [
      'company.manage',
      'users.manage',
      'roles.manage',
      'permissions.grant',
      'financial.view_all',
      'reports.view_all',
    ],
  }),
  createMockRole({
    id: 2,
    name: 'Operations Manager',
    displayName: 'Operations Manager',
    description: 'Oversees day-to-day operations',
    isSystemRole: true,
    isSystem: true,
    isDirector: true,
    permissionKeys: [
      'operations.manage',
      'inventory.manage',
      'orders.manage',
      'reports.view',
    ],
  }),
  createMockRole({
    id: 3,
    name: 'Finance Manager',
    displayName: 'Finance Manager',
    description: 'Manages financial operations and reporting',
    isSystemRole: true,
    isSystem: true,
    isDirector: true,
    permissionKeys: [
      'finance.manage',
      'invoices.manage',
      'payments.manage',
      'reports.financial',
    ],
  }),
  createMockRole({
    id: 4,
    name: 'Sales Manager',
    displayName: 'Sales Manager',
    description: 'Leads sales team and strategy',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'sales.manage',
      'customers.manage',
      'quotations.create',
      'invoices.view',
    ],
  }),
  createMockRole({
    id: 5,
    name: 'Purchase Manager',
    displayName: 'Purchase Manager',
    description: 'Manages procurement and vendor relations',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'purchases.manage',
      'vendors.manage',
      'purchase_orders.create',
      'inventory.view',
    ],
  }),
  createMockRole({
    id: 6,
    name: 'Warehouse Manager',
    displayName: 'Warehouse Manager',
    description: 'Oversees warehouse and inventory',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'warehouse.manage',
      'inventory.manage',
      'stock.adjust',
      'shipments.manage',
    ],
  }),
  createMockRole({
    id: 7,
    name: 'Accounts Manager',
    displayName: 'Accounts Manager',
    description: 'Manages accounting and financial records',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'accounts.manage',
      'invoices.view',
      'payments.view',
      'reports.financial',
    ],
  }),
  createMockRole({
    id: 8,
    name: 'Sales Executive',
    displayName: 'Sales Executive',
    description: 'Handles sales transactions and customer relations',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'sales.create',
      'customers.view',
      'quotations.create',
      'invoices.view',
    ],
  }),
  createMockRole({
    id: 9,
    name: 'Purchase Executive',
    displayName: 'Purchase Executive',
    description: 'Handles purchase orders and vendor communications',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'purchases.create',
      'vendors.view',
      'purchase_orders.create',
      'inventory.view',
    ],
  }),
  createMockRole({
    id: 10,
    name: 'Stock Keeper',
    displayName: 'Stock Keeper',
    description: 'Manages stock movements and inventory updates',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'stock.view',
      'stock.adjust',
      'inventory.update',
      'warehouse.view',
    ],
  }),
  createMockRole({
    id: 11,
    name: 'Accounts Executive',
    displayName: 'Accounts Executive',
    description: 'Assists with accounting tasks and record-keeping',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'accounts.view',
      'invoices.view',
      'payments.view',
      'reports.view',
    ],
  }),
  createMockRole({
    id: 12,
    name: 'Logistics Coordinator',
    displayName: 'Logistics Coordinator',
    description: 'Coordinates shipments and delivery schedules',
    isSystemRole: true,
    isSystem: true,
    isDirector: false,
    permissionKeys: [
      'logistics.manage',
      'shipments.create',
      'deliveries.schedule',
      'warehouse.view',
    ],
  }),
];

/**
 * Mock custom roles (examples)
 */
export const mockCustomRoles = [
  createMockRole({
    id: 13,
    name: 'Quality Inspector',
    displayName: 'Quality Inspector',
    description: 'Inspects product quality and ensures standards',
    isSystemRole: false,
    isSystem: false,
    isDirector: false,
    permissionKeys: [
      'quality.view',
      'quality.create',
      'quality.edit',
      'inventory.view',
    ],
  }),
  createMockRole({
    id: 14,
    name: 'HR Manager',
    displayName: 'HR Manager',
    description: 'Manages human resources and employee relations',
    isSystemRole: false,
    isSystem: false,
    isDirector: true,
    permissionKeys: [
      'hr.manage',
      'users.view',
      'employees.manage',
      'reports.hr',
    ],
  }),
  createMockRole({
    id: 15,
    name: 'IT Support',
    displayName: 'IT Support',
    description: 'Provides technical support and system maintenance',
    isSystemRole: false,
    isSystem: false,
    isDirector: false,
    permissionKeys: [
      'system.view',
      'users.view',
      'support.manage',
    ],
  }),
];

/**
 * All roles (system + custom)
 */
export const mockAllRoles = [...mockSystemRoles, ...mockCustomRoles];

/**
 * Reserved role names that cannot be used
 */
export const reservedRoleNames = ['admin', 'superuser', 'root'];

/**
 * Validation rules for role creation/editing
 */
export const roleValidationRules = {
  displayName: {
    minLength: 3,
    maxLength: 50,
    required: true,
    reservedNames: reservedRoleNames,
  },
  description: {
    minLength: 0,
    maxLength: 500,
    required: false,
  },
  isDirector: {
    type: 'boolean',
    default: false,
  },
  permissionKeys: {
    type: 'array',
    default: [],
  },
};

/**
 * Mock API responses
 */
export const mockApiResponses = {
  // Successful responses
  getRolesSuccess: {
    status: 200,
    data: mockSystemRoles,
  },
  createRoleSuccess: (roleData) => ({
    status: 201,
    data: createMockRole({
      id: 13,
      ...roleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  }),
  updateRoleSuccess: (roleId, roleData) => ({
    status: 200,
    data: createMockRole({
      id: roleId,
      ...roleData,
      updatedAt: new Date().toISOString(),
    }),
  }),
  deleteRoleSuccess: {
    status: 200,
    data: { success: true, message: 'Role deleted successfully' },
  },

  // Error responses
  reservedNameError: (name) => ({
    status: 400,
    data: {
      error: 'Validation Error',
      message: `"${name}" is a reserved name and cannot be used`,
    },
  }),
  duplicateNameError: {
    status: 409,
    data: {
      error: 'Conflict',
      message: 'A role with this name already exists',
    },
  },
  nameTooShortError: {
    status: 400,
    data: {
      error: 'Validation Error',
      message: 'Display name must be at least 3 characters',
    },
  },
  nameTooLongError: {
    status: 400,
    data: {
      error: 'Validation Error',
      message: 'Display name must be less than 50 characters',
    },
  },
  roleNotFoundError: {
    status: 404,
    data: {
      error: 'Not Found',
      message: 'Role not found',
    },
  },
  cannotDeleteSystemRoleError: {
    status: 403,
    data: {
      error: 'Forbidden',
      message: 'System roles cannot be deleted',
    },
  },
  roleAssignedToUsersError: {
    status: 409,
    data: {
      error: 'Conflict',
      message: 'Cannot delete role that is assigned to users',
    },
  },
  unauthorizedError: {
    status: 401,
    data: {
      error: 'Unauthorized',
      message: 'Authentication required',
    },
  },
  forbiddenError: {
    status: 403,
    data: {
      error: 'Forbidden',
      message: 'You do not have permission to perform this action',
    },
  },
};

/**
 * Helper function to create a mock user with role
 */
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  roleId: 4, // Sales Manager
  roleName: 'Sales Manager',
  companyId: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Helper function to generate mock role form data
 */
export const createMockRoleFormData = (overrides = {}) => ({
  displayName: 'Test Role',
  description: 'Test description',
  isDirector: false,
  permissionKeys: [],
  ...overrides,
});

/**
 * Helper function to check if a role is a system role
 */
export const isSystemRole = (role) => {
  return role.isSystemRole === true || role.isSystem === true;
};

/**
 * Helper function to check if a role is a director role
 */
export const isDirectorRole = (role) => {
  return role.isDirector === true;
};

/**
 * Helper function to get director roles only
 */
export const getDirectorRoles = (roles) => {
  return roles.filter(isDirectorRole);
};

/**
 * Helper function to get system roles only
 */
export const getSystemRoles = (roles) => {
  return roles.filter(isSystemRole);
};

/**
 * Helper function to get custom roles only
 */
export const getCustomRoles = (roles) => {
  return roles.filter((role) => !isSystemRole(role));
};

/**
 * Helper function to validate role name
 */
export const validateRoleName = (name, existingRoles = [], editingRoleId = null) => {
  const errors = [];

  // Check length
  if (!name || name.trim().length < 3) {
    errors.push('Display name must be at least 3 characters');
  } else if (name.trim().length > 50) {
    errors.push('Display name must be less than 50 characters');
  }

  // Check reserved names
  const normalized = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (reservedRoleNames.includes(normalized)) {
    errors.push(`"${name}" is a reserved name and cannot be used`);
  }

  // Check duplicates
  const duplicate = existingRoles.find(
    (r) => r.id !== editingRoleId && r.name?.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) {
    errors.push('A role with this name already exists');
  }

  return errors;
};

/**
 * Mock notification service for testing
 */
export const mockNotificationService = {
  success: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => {},
  error: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => {},
  warning: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => {},
  info: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => {},
};

/**
 * Mock role service for testing
 */
export const mockRoleService = {
  getRoles: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve(mockSystemRoles),
  getRole: vi.fn ? vi.fn() : jest.fn ? jest.fn() : (id) => Promise.resolve(mockSystemRoles.find(r => r.id === id)),
  createRole: vi.fn ? vi.fn() : jest.fn ? jest.fn() : (data) => Promise.resolve(createMockRole({ id: 13, ...data })),
  updateRole: vi.fn ? vi.fn() : jest.fn ? jest.fn() : (id, data) => Promise.resolve(createMockRole({ id, ...data })),
  deleteRole: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve({ success: true }),
  getAvailableRoles: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve(mockSystemRoles),
  getAllPermissions: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve([]),
  getUserPermissions: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve([]),
  assignRoles: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve({ success: true }),
  replaceUserRoles: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve({ success: true }),
  removeRole: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve({ success: true }),
  grantCustomPermission: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve({ success: true }),
  revokeCustomPermission: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve({ success: true }),
  getAuditLog: vi.fn ? vi.fn() : jest.fn ? jest.fn() : () => Promise.resolve([]),
};

/**
 * Test data for edge cases
 */
export const edgeCaseTestData = {
  // Valid edge cases
  minLengthName: 'ABC', // Exactly 3 characters
  maxLengthName: 'A'.repeat(50), // Exactly 50 characters
  nameWithSpecialChars: 'Quality Inspector (QC)',
  nameWithNumbers: 'Level 2 Manager',
  nameWithSpaces: '  Valid Name  ', // Trimmed to valid length
  multiWordName: 'Senior Quality Assurance Manager',

  // Invalid edge cases
  tooShortName: 'AB', // 2 characters
  tooLongName: 'A'.repeat(51), // 51 characters
  emptyName: '',
  whitespaceName: '   ',
  reservedNameAdmin: 'admin',
  reservedNameSuperuser: 'superuser',
  reservedNameRoot: 'root',
  reservedNameWithCase: 'Admin',
  reservedNameWithSpaces: 'super user',
};

/**
 * Export all mocks as a single object
 */
export default {
  createMockRole,
  mockSystemRoles,
  mockCustomRoles,
  mockAllRoles,
  reservedRoleNames,
  roleValidationRules,
  mockApiResponses,
  createMockUser,
  createMockRoleFormData,
  isSystemRole,
  isDirectorRole,
  getDirectorRoles,
  getSystemRoles,
  getCustomRoles,
  validateRoleName,
  mockNotificationService,
  mockRoleService,
  edgeCaseTestData,
};
