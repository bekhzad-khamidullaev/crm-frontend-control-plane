# E2E Tests Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install chromium
```

### 3. Start Dev Server (if not already running)
```bash
npm run dev
```

## 🧪 Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Suites
```bash
# Login tests only
npm run test:e2e:login

# Leads module tests
npm run test:e2e:leads

# Contacts module tests
npm run test:e2e:contacts

# Integration tests
npm run test:e2e:integration
```

### Run with Browser Visible (Headed Mode)
```bash
npm run test:e2e:headed
```

### Run with Interactive UI
```bash
npm run test:e2e:ui
```

### Debug Tests
```bash
npm run test:e2e:debug
```

### View Test Report
```bash
npm run test:e2e:report
```

## 🎯 Test Credentials

All tests use these credentials:
- **Username:** `admin`
- **Password:** `t3sl@admin`

## 📋 Test Coverage Summary

### ✅ Login Flow (7 tests)
- Display login page
- Login with valid credentials
- Show error with invalid credentials
- Validate required fields
- Maintain session after reload
- Navigate to dashboard
- Logout functionality

### ✅ Leads Module (10 tests)
- Full CRUD operations
- Search functionality
- Pagination
- Table/Kanban view switching
- Bulk delete operations
- Bulk status change
- Data export
- Form validation
- Page navigation

### ✅ Contacts Module (11 tests)
- Full CRUD operations
- Search functionality
- Pagination
- Bulk delete operations
- Bulk status change
- Data export
- Form validation
- Inline editing
- Activity/call history
- Page navigation

### ✅ Integration Tests (5 tests)
- Cross-module navigation
- Lead to contact conversion
- Dashboard display
- Error handling
- Responsive behavior

**Total: 33 comprehensive E2E tests**

## 🔧 Configuration

### API Configuration
The tests use the API proxy configured in `vite.config.js`:
- **Proxy Target:** `https://api.crm.windevs.uz`
- **Local API Path:** `/api`

### Environment Variables
Set in `.env.local`:
```bash
VITE_PROXY_TARGET=https://api.crm.windevs.uz
VITE_API_PREFIX=/api
```

## 📊 Test Reports

After running tests, view detailed reports:
```bash
npm run test:e2e:report
```

Reports include:
- Test pass/fail status
- Screenshots on failure
- Video recordings on failure
- Execution traces
- Performance metrics

## 🐛 Troubleshooting

### Tests Timeout
```bash
# Increase timeout in playwright.config.cjs
timeout: 120 * 1000
```

### Login Fails
- Verify credentials: `admin` / `t3sl@admin`
- Check API connectivity to `https://api.crm.windevs.uz`
- Ensure proxy is configured correctly

### Port Already in Use
```bash
# Change port in playwright.config.cjs
webServer: {
  url: 'http://localhost:3001',
}
```

### Playwright Not Found
```bash
npx playwright install
```

## 📚 Additional Resources

- [Full README](./README.md) - Detailed documentation
- [Playwright Docs](https://playwright.dev) - Official Playwright documentation
- [Test Structure](./README.md#test-structure) - Detailed test organization

## 🎬 Example Test Run

```bash
$ npm run test:e2e

Running 33 tests using 1 worker

✓ [chromium] › login.spec.js:7:3 › Login Flow Tests › should display login page correctly (2s)
✓ [chromium] › login.spec.js:14:3 › Login Flow Tests › should login successfully (3s)
✓ [chromium] › leads.spec.js:25:3 › Leads Module › should complete full CRUD flow (8s)
✓ [chromium] › leads.spec.js:90:3 › Leads Module › should search and filter leads (5s)
...

33 passed (2m 45s)

✓ All Tests Passed Successfully
```

## 💡 Tips

1. **Run specific tests during development:**
   ```bash
   npx playwright test -g "should login"
   ```

2. **Debug failing tests:**
   ```bash
   npx playwright test --debug leads.spec.js
   ```

3. **Run in headed mode to see what's happening:**
   ```bash
   npm run test:e2e:headed
   ```

4. **Use UI mode for interactive testing:**
   ```bash
   npm run test:e2e:ui
   ```

## 🚦 CI/CD Integration

Tests are ready for CI/CD pipelines:

```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CI: true
```

---

**Need Help?** Check the [full README](./README.md) or open an issue.
