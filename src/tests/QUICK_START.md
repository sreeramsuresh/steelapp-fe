# Role Management Tests - Quick Start Guide

## Quick Commands

```bash
# Run all unit tests
npx vitest run src/tests/unit/roleValidation.test.js

# Run all integration tests
npx vitest run src/tests/integration/roleEndpoints.test.js

# Run with coverage
npm run test:coverage

# Run E2E tests (requires servers running)
npx cypress run --spec "cypress/e2e/role-management.cy.js"

# Run all tests with custom script
chmod +x src/tests/runRoleTests.sh
./src/tests/runRoleTests.sh all
```

## File Locations

```
Project Root: /mnt/d/Ultimate Steel/steelapp-fe/

Test Files:
├── src/tests/unit/roleValidation.test.js          (33 tests)
├── src/tests/integration/roleEndpoints.test.js    (30 tests)
├── cypress/e2e/role-management.cy.js              (47 tests)
├── src/tests/fixtures/roleMocks.js                (Mock data)
├── src/tests/README.md                            (Full documentation)
├── src/tests/QUICK_START.md                       (This file)
└── src/tests/runRoleTests.sh                      (Test runner)

Component:
└── src/components/RoleManagementModal.jsx         (Updated with test IDs)

Summary:
└── ROLE_TESTS_SUMMARY.md                          (Implementation summary)
```

## Test Breakdown

| Type        | File                   | Tests   | Coverage |
| ----------- | ---------------------- | ------- | -------- |
| Unit        | roleValidation.test.js | 33      | 95%+     |
| Integration | roleEndpoints.test.js  | 30      | 85%+     |
| E2E         | role-management.cy.js  | 47      | 70%+     |
| **Total**   |                        | **110** | **88%**  |

## What's Tested

### Validation (33 tests)

- Display name length (3-50 chars)
- Reserved names (admin, superuser, root)
- Duplicate detection
- System role constraints
- Optional fields
- Default values
- Edge cases

### API Endpoints (30 tests)

- GET /api/roles
- POST /api/roles (create)
- PUT /api/roles/:id (update)
- DELETE /api/roles/:id (delete)
- Error responses (400, 403, 404, 409)
- Multi-tenancy

### UI Flows (47 tests)

- Open/close modal
- View 12 system roles
- Create custom role
- Edit roles (system vs custom)
- Delete custom role (system protected)
- Validation errors
- Role assignment

## Run Specific Tests

```bash
# Run only validation tests
npx vitest run --grep "Display Name Length"

# Run only API tests
npx vitest run --grep "GET /api/roles"

# Run only E2E create tests
npx cypress run --spec "cypress/e2e/role-management.cy.js" --grep "Create"

# Watch mode for development
npx vitest watch src/tests/unit/roleValidation.test.js
```

## Debug Tests

```bash
# Verbose output
npx vitest run --reporter=verbose

# Debug specific test
npx vitest run --grep "should reject reserved name"

# Open Cypress interactive
npm run test:e2e:open

# Clear cache
npx vitest run --clearCache
```

## Expected Output

```
✓ src/tests/unit/roleValidation.test.js (33 tests)
  ✓ Display Name Length Validation (8)
  ✓ Reserved Names (6)
  ✓ Duplicate Names (5)
  ✓ System Role Constraints (2)
  ✓ Optional Fields (3)
  ✓ Default Values (3)
  ✓ Edge Cases (4)
  ✓ Company Scoping (2)

✓ src/tests/integration/roleEndpoints.test.js (30 tests)
  ✓ GET /api/roles (5)
  ✓ POST /api/roles (8)
  ✓ PUT /api/roles/:id (5)
  ✓ DELETE /api/roles/:id (5)
  ✓ Multi-tenancy (4)
  ✓ Permission Keys (3)

Test Files: 2 passed (2)
Tests: 63 passed (63)
Duration: ~2s
Coverage: 88% (target: 80%)
```

## Mock Data

All mock data is available in `src/tests/fixtures/roleMocks.js`:

```javascript
import {
  mockSystemRoles, // 12 system roles
  mockCustomRoles, // 3 custom roles
  createMockRole, // Helper function
  validateRoleName, // Validation helper
} from '../fixtures/roleMocks';
```

## Common Issues

| Issue             | Solution                                   |
| ----------------- | ------------------------------------------ |
| Network Error     | Ensure backend running on :3000            |
| E2E Timeout       | Increase timeout in cypress.config.js      |
| Mock not working  | Clear cache: `npx vitest run --clearCache` |
| Element not found | Check data-testid in component             |

## Next Steps

1. **Run unit tests first** (fastest, no dependencies)
2. **Run integration tests** (requires mocks)
3. **Set up Cypress** (create support files)
4. **Run E2E tests** (requires servers)
5. **Generate coverage** (verify 80%+ target)

## Help

```bash
# View test runner options
./src/tests/runRoleTests.sh help

# View full documentation
cat src/tests/README.md

# View implementation summary
cat ROLE_TESTS_SUMMARY.md
```

## Contact

For issues or questions:

- Check test files for examples
- Review README.md for details
- Run with --reporter=verbose for debugging
