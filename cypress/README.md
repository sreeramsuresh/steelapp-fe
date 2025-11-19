# Cypress E2E Testing Guide

## 📦 Installation

Cypress is already included in `package.json` devDependencies.

```bash
npm install
```

## 🚀 Running Tests

### Interactive Mode (Recommended for Development)

```bash
npm run test:e2e:open
# or
npm run cypress
```

Opens Cypress Test Runner UI where you can:
- See tests in real-time
- Time-travel through test steps
- Debug failures easily
- Watch tests re-run on file changes

### Headless Mode (CI/CD)

```bash
npm run test:e2e
# or
npm run cypress:headless
```

Runs all tests in the background without GUI:
- Faster execution
- Generates screenshots on failures
- Suitable for CI pipelines

## 📁 Project Structure

```
cypress/
├── e2e/
│   └── smoke.cy.js          # Smoke tests for critical paths
├── support/
│   ├── commands.js          # Custom Cypress commands
│   └── e2e.js               # Global configuration
├── screenshots/             # Auto-generated on test failures
└── videos/                  # Test recordings (disabled by default)
```

## ✅ Smoke Tests Included

Current smoke tests validate:

1. **Login Flow** - User can login and access dashboard
2. **Invoice List** - Invoices page loads and displays table
3. **Create Invoice** - User can create a new invoice
4. **Add Payment** - User can record payment and see balance update
5. **Logout** - User can logout successfully

Error scenarios:
- Invalid login credentials
- 404 handling for non-existent invoices

## 🔧 Configuration

### Environment Variables

Edit `cypress.config.js` to change:

```javascript
env: {
  apiUrl: 'http://localhost:3000',        // API Gateway URL
  testUserEmail: 'test@steelapp.com',     // Test user email
  testUserPassword: 'testpassword123'     // Test user password
}
```

### Test User Setup

Ensure a test user exists in the database:

```sql
INSERT INTO users (email, password, company_id, role)
VALUES ('test@steelapp.com', '<hashed_password>', 1, 'admin');
```

## 📝 Writing Tests

### Use Custom Commands

```javascript
// Login
cy.login();
cy.login('custom@email.com', 'custompassword');

// Navigate
cy.navigateTo('invoices');
cy.navigateTo('dashboard');

// Logout
cy.logout();

// Custom assertions
cy.get('.element').shouldContainText('invoice');
```

### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```html
   <button data-testid="create-invoice-btn">Create</button>
   ```
   ```javascript
   cy.get('[data-testid="create-invoice-btn"]').click();
   ```

2. **Avoid CSS class selectors** (they change frequently):
   ```javascript
   // ❌ Bad
   cy.get('.btn-primary-large').click();
   
   // ✅ Good
   cy.get('[data-testid="submit-btn"]').click();
   cy.contains('button', 'Submit').click();
   ```

3. **Wait for elements properly**:
   ```javascript
   cy.get('[data-testid="invoice-table"]', { timeout: 10000 })
     .should('be.visible');
   ```

4. **Use intercepts for API calls**:
   ```javascript
   cy.intercept('GET', '/api/invoices').as('getInvoices');
   cy.visit('/invoices');
   cy.wait('@getInvoices');
   ```

## 🐛 Debugging

### Screenshots

Automatically captured on test failures:
```
cypress/screenshots/<test-name>/<failure-step>.png
```

### Videos

Enable in `cypress.config.js`:
```javascript
video: true,  // Change from false to true
```

### Browser DevTools

In interactive mode:
- Click on a command in the test runner
- Open browser DevTools to inspect
- Use time-travel debugging

### Logs

```javascript
cy.log('Custom debug message');
console.log('Will appear in browser console');
```

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start services
        run: |
          npm run dev &
          # Wait for services to be ready
          npx wait-on http://localhost:5173
      
      - name: Run Cypress tests
        run: npm run test:e2e
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

## 📊 Test Reports

### Mochawesome (Optional)

Install reporter:
```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

Update `cypress.config.js`:
```javascript
reporter: 'mochawesome',
reporterOptions: {
  reportDir: 'cypress/results',
  overwrite: false,
  html: true,
  json: true
}
```

## 🔒 Security Notes

- **Never commit real credentials** to `cypress.config.js`
- Use environment variables for sensitive data
- Create dedicated test users with limited permissions
- Use test database, not production

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API](https://docs.cypress.io/api/table-of-contents)
