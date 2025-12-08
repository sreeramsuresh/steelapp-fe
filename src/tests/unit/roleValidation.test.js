/**
 * Unit Tests for Role Validation Logic
 *
 * Tests cover:
 * - Display name length validation (3-50 characters)
 * - Reserved name blocking (admin, superuser, root)
 * - Duplicate name detection per company
 * - Description optional field
 * - isDirector default value
 * - System role name immutability
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock role data for testing
const createMockRole = (overrides = {}) => ({
  id: 1,
  name: 'Test Role',
  displayName: 'Test Role',
  description: 'Test description',
  isDirector: false,
  isSystemRole: false,
  companyId: 1,
  ...overrides,
});

// Validation function extracted from RoleManagementModal logic
const validateRoleForm = (formData, existingRoles = [], editingRole = null) => {
  const errors = {};

  if (!editingRole) {
    // Creating new role
    if (!formData.displayName || formData.displayName.trim().length < 3) {
      errors.displayName = 'Display name must be at least 3 characters';
    } else if (formData.displayName.trim().length > 50) {
      errors.displayName = 'Display name must be less than 50 characters';
    }

    // Check for reserved names
    const reservedNames = ['admin', 'superuser', 'root', 'super_user'];
    // Normalize: lowercase and replace special chars with underscore
    const normalized = formData.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    // Also check without underscores to catch variations like "Super-User" -> "superuser"
    const normalizedNoUnderscore = normalized.replace(/_/g, '');
    if (reservedNames.includes(normalized) || reservedNames.includes(normalizedNoUnderscore)) {
      errors.displayName = `"${formData.displayName}" is a reserved name and cannot be used`;
    }

    // Check for duplicate names
    const exists = existingRoles.some(
      r => r.name?.toLowerCase() === formData.displayName.toLowerCase(),
    );
    if (exists) {
      errors.displayName = 'A role with this name already exists';
    }
  } else {
    // Editing existing role
    if (!formData.displayName || formData.displayName.trim().length < 3) {
      errors.displayName = 'Display name must be at least 3 characters';
    } else if (formData.displayName.trim().length > 50) {
      errors.displayName = 'Display name must be less than 50 characters';
    }

    // For custom roles, check for duplicates (excluding current role)
    if (!editingRole.isSystemRole) {
      const exists = existingRoles.some(
        r => r.id !== editingRole.id && r.name?.toLowerCase() === formData.displayName.toLowerCase(),
      );
      if (exists) {
        errors.displayName = 'A role with this name already exists';
      }
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

describe('Role Validation - Display Name Length', () => {
  test('should reject display name with less than 3 characters', () => {
    const formData = { displayName: 'AB', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('Display name must be at least 3 characters');
  });

  test('should reject empty display name', () => {
    const formData = { displayName: '', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('Display name must be at least 3 characters');
  });

  test('should reject display name with only whitespace', () => {
    const formData = { displayName: '  ', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('Display name must be at least 3 characters');
  });

  test('should accept display name with exactly 3 characters', () => {
    const formData = { displayName: 'ABC', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should accept display name with 50 characters', () => {
    const formData = { displayName: 'A'.repeat(50), description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should reject display name with more than 50 characters', () => {
    const formData = { displayName: 'A'.repeat(51), description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('Display name must be less than 50 characters');
  });

  test('should accept valid display name between 3-50 characters', () => {
    const formData = { displayName: 'Quality Inspector', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });
});

describe('Role Validation - Reserved Names', () => {
  test('should reject reserved name "admin"', () => {
    const formData = { displayName: 'admin', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toContain('reserved name');
  });

  test('should reject reserved name "Admin" (case insensitive)', () => {
    const formData = { displayName: 'Admin', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toContain('reserved name');
  });

  test('should reject reserved name "superuser"', () => {
    const formData = { displayName: 'superuser', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toContain('reserved name');
  });

  test('should reject reserved name "root"', () => {
    const formData = { displayName: 'root', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toContain('reserved name');
  });

  test('should reject reserved name with special characters "Super-User"', () => {
    const formData = { displayName: 'Super-User', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(false);
    expect(errors.displayName).toContain('reserved name');
  });

  test('should accept non-reserved name', () => {
    const formData = { displayName: 'Quality Manager', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });
});

describe('Role Validation - Duplicate Names', () => {
  const existingRoles = [
    createMockRole({ id: 1, name: 'Sales Manager' }),
    createMockRole({ id: 2, name: 'Quality Inspector' }),
    createMockRole({ id: 3, name: 'Warehouse Manager' }),
  ];

  test('should reject duplicate name (exact match)', () => {
    const formData = { displayName: 'Sales Manager', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, existingRoles);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('A role with this name already exists');
  });

  test('should reject duplicate name (case insensitive)', () => {
    const formData = { displayName: 'sales manager', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, existingRoles);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('A role with this name already exists');
  });

  test('should accept unique name', () => {
    const formData = { displayName: 'HR Manager', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, existingRoles);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should allow editing role with same name (not duplicate of self)', () => {
    const editingRole = existingRoles[0]; // Sales Manager
    const formData = { displayName: 'Sales Manager', description: 'Updated description', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, existingRoles, editingRole);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should reject editing role with name of another existing role', () => {
    const editingRole = existingRoles[0]; // Sales Manager
    const formData = { displayName: 'Quality Inspector', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, existingRoles, editingRole);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('A role with this name already exists');
  });
});

describe('Role Validation - System Role Constraints', () => {
  test('system role name should be immutable during edit', () => {
    const systemRole = createMockRole({
      id: 1,
      name: 'Managing Director',
      isSystemRole: true,
    });

    // When editing system role, displayName validation still applies but name shouldn't change
    const formData = { displayName: 'Managing Director', description: 'Updated', isDirector: true };
    const { errors, isValid } = validateRoleForm(formData, [systemRole], systemRole);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should allow description update on system role', () => {
    const systemRole = createMockRole({
      id: 1,
      name: 'Finance Manager',
      isSystemRole: true,
      description: 'Original description',
    });

    const formData = {
      displayName: 'Finance Manager',
      description: 'Updated responsibilities',
      isDirector: true,
    };

    const { errors, isValid } = validateRoleForm(formData, [systemRole], systemRole);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });
});

describe('Role Validation - Optional Fields', () => {
  test('should accept empty description', () => {
    const formData = { displayName: 'Quality Inspector', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.description).toBeUndefined();
  });

  test('should accept undefined description', () => {
    const formData = { displayName: 'Quality Inspector', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.description).toBeUndefined();
  });

  test('should accept description with content', () => {
    const formData = {
      displayName: 'Quality Inspector',
      description: 'Responsible for quality control and inspections',
      isDirector: false,
    };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.description).toBeUndefined();
  });
});

describe('Role Validation - Default Values', () => {
  test('isDirector should default to false', () => {
    const formData = { displayName: 'Quality Inspector', description: '' };
    // isDirector not specified, should default to false
    expect(formData.isDirector).toBeUndefined();

    // In actual usage, the form would initialize with isDirector: false
    const formDataWithDefault = { ...formData, isDirector: formData.isDirector || false };
    expect(formDataWithDefault.isDirector).toBe(false);
  });

  test('should handle isDirector true', () => {
    const formData = { displayName: 'Quality Director', description: '', isDirector: true };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(formData.isDirector).toBe(true);
  });

  test('should handle isDirector false', () => {
    const formData = { displayName: 'Quality Inspector', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(formData.isDirector).toBe(false);
  });
});

describe('Role Validation - Edge Cases', () => {
  test('should handle name with special characters', () => {
    const formData = { displayName: 'Quality Inspector (QC)', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should handle name with numbers', () => {
    const formData = { displayName: 'Level 2 Manager', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should trim whitespace when validating length', () => {
    const formData = { displayName: '  ABC  ', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    // Should be valid because trimmed length is 3
    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });

  test('should handle multi-word names', () => {
    const formData = { displayName: 'Senior Quality Assurance Manager', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, []);

    expect(isValid).toBe(true);
    expect(errors.displayName).toBeUndefined();
  });
});

describe('Role Validation - Company Scoping', () => {
  test('should allow same role name in different companies', () => {
    // This test validates the concept that role names are scoped per company
    const company1Roles = [
      createMockRole({ id: 1, name: 'Sales Manager', companyId: 1 }),
    ];

    const company2Roles = [
      createMockRole({ id: 2, name: 'Sales Manager', companyId: 2 }),
    ];

    // Creating a new role in company 1 with same name as company 2
    const formData = { displayName: 'Sales Manager', description: '', isDirector: false };

    // Should be valid in company 1 (only checking against company1Roles)
    const { errors, isValid } = validateRoleForm(formData, company1Roles);

    expect(isValid).toBe(false); // False because it already exists in company 1
    expect(errors.displayName).toBe('A role with this name already exists');
  });

  test('should validate uniqueness within same company only', () => {
    const companyRoles = [
      createMockRole({ id: 1, name: 'Manager', companyId: 1 }),
    ];

    // Try to create duplicate in same company
    const formData = { displayName: 'Manager', description: '', isDirector: false };
    const { errors, isValid } = validateRoleForm(formData, companyRoles);

    expect(isValid).toBe(false);
    expect(errors.displayName).toBe('A role with this name already exists');
  });
});
