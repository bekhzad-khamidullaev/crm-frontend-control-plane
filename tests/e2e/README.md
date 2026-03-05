# E2E Tests for CRM Application

This directory contains comprehensive end-to-end tests for the CRM application using Playwright.

## Test Structure

```
tests/e2e/
├── helpers/
│   ├── test-data.js       # Test data generators
│   └── api-helpers.js     # API helper functions
├── login.spec.js          # Login and authentication tests
├── leads.spec.js          # Leads module CRUD tests
├── contacts.spec.js       # Contacts module CRUD tests
├── integration.spec.js    # Cross-module integration tests
└── README.md              # This file
```

## Test Coverage

### 1. Login Flow (`login.spec.js`)
- ✅ Display login page correctly
- ✅ Login with valid credentials (admin / t3sl@admin)
- ✅ Show error with invalid credentials
- ✅ Validate required fields
- ✅ Maintain session after reload
- ✅ Logout functionality

### 2. Leads Module (`leads.spec.js`)
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Search functionality
- ✅ Filtering by status/fields
- ✅ Pagination navigation
- ✅ Switch between table and kanban views
- ✅ Bulk delete operations
- ✅ Bulk status change operations
- ✅ Data export functionality
- ✅ Form validation
- ✅ Page navigation

### 3. Contacts Module (`contacts.spec.js`)
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Search functionality
- ✅ Filtering by type/fields
- ✅ Pagination navigation
- ✅ Bulk delete operations
- ✅ Bulk type/status change operations
- ✅ Data export functionality
- ✅ Form validation
- ✅ Inline editing (if available)
- ✅ View activity/call history
- ✅ Page navigation

### 4. Integration Tests (`integration.spec.js`)
- ✅ Cross-module navigation
- ✅ Lead to contact conversion workflow
- ✅ Dashboard data display
- ✅ Error handling
- ✅ Responsive behavior

## Running Tests

### Prerequisites
1. Backend API must be running at `https://api.crm.windevs.uz`
2. Frontend dev server on `http://localhost:3000` (automatically started)

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test Suite
```bash
npx playwright test login.spec.js
npx playwright test leads.spec.js
npx playwright test contacts.spec.js
npx playwright test integration.spec.js
```

### Run in Headed Mode (with browser UI)
```bash
npx playwright test --headed
```

### Run with UI Mode (interactive)
```bash
npx playwright test --ui
```

### Debug Specific Test
```bash
npx playwright test --debug leads.spec.js
```

### View Test Report
```bash
npx playwright show-report
```

## Configuration

The tests are configured in `playwright.config.cjs`:

- **Headless Mode**: Enabled by default
- **Workers**: 1 (sequential execution to avoid conflicts)
- **Retries**: 2 in CI, 0 locally
- **Timeout**: 60 seconds per test
- **Base URL**: http://localhost:3000
- **API Proxy**: Configured via VITE_PROXY_TARGET=https://api.crm.windevs.uz

## Credentials

Default test credentials:
- **Username**: `admin`
- **Password**: `t3sl@admin`

These credentials are used across all test suites.

## Test Data Management

Tests automatically:
1. Create test data with unique identifiers (timestamp-based)
2. Clean up created data after each test
3. Use prefixes like `E2E_Lead_` and `E2E_Contact_` for easy identification

## API Integration

Tests interact with real API endpoints:
- `/api/leads/` - Leads CRUD operations
- `/api/contacts/` - Contacts CRUD operations
- `/api/token/` - Authentication (JWT)

The proxy configuration in `vite.config.js` routes `/api` requests to `https://api.crm.windevs.uz`.

## Troubleshooting

### Tests Failing to Login
- Verify credentials are correct
- Check if API is accessible
- Ensure proxy configuration is correct

### Timeouts
- Increase timeout in `playwright.config.cjs`
- Check network connectivity
- Verify API response times

### Element Not Found
- UI might have changed
- Update selectors in test files
- Check if feature is available in current environment

### Cleanup Issues
- Test data might remain if test crashes
- Manually delete test records with prefix `E2E_`
- Check database for orphaned records

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npx playwright test
  env:
    CI: true

- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Keep tests independent** - Each test should be able to run standalone
2. **Clean up test data** - Always remove created records
3. **Use unique identifiers** - Timestamp-based names prevent conflicts
4. **Handle async operations** - Use proper waits and promises
5. **Descriptive test names** - Clearly describe what is being tested
6. **Add console logs** - Help with debugging and reporting

## Contributing

When adding new tests:
1. Follow existing test structure
2. Use helper functions from `helpers/`
3. Add cleanup in `afterEach` hooks
4. Update this README with new test coverage
5. Ensure tests pass in headless mode

## License

Part of the Contora CRM project.
