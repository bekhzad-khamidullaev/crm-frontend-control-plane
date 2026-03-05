# E2E Tests Installation Guide

## 🚀 Complete Setup Instructions

Follow these steps to set up and run the E2E test suite.

---

## Prerequisites

✅ **Node.js 18+** installed  
✅ **npm 8+** installed  
✅ **Git** installed  
✅ Backend API accessible at `https://api.crm.windevs.uz`

---

## Step 1: Install Dependencies

```bash
# Install all project dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

---

## Step 2: Verify Setup

```bash
# Run verification script
node tests/e2e/verify-setup.js
```

You should see:
```
✓ Node.js version
✓ npm
✓ Playwright
✓ Test files
✓ Playwright config
✓ npm scripts
✓ Playwright browsers
✓ Documentation

✓ Setup complete! Ready to run E2E tests.
```

---

## Step 3: Configure Environment (Optional)

The tests use default configuration, but you can customize:

```bash
# Edit .env.local (already configured)
VITE_PROXY_TARGET=https://api.crm.windevs.uz
VITE_API_PREFIX=/api
```

Test credentials are hardcoded in tests:
- Username: `admin`
- Password: `t3sl@admin`

---

## Step 4: Start Development Server

The tests automatically start the dev server, but you can start it manually:

```bash
# Terminal 1: Start dev server
npm run dev
```

Server will run at: http://localhost:3000

---

## Step 5: Run Tests

### Run All Tests (Headless)
```bash
npm run test:e2e
```

### Run Specific Test Suite
```bash
npm run test:e2e:login       # Login tests only
npm run test:e2e:leads       # Leads module tests
npm run test:e2e:contacts    # Contacts module tests
npm run test:e2e:integration # Integration tests
```

### Run with Browser UI (Headed Mode)
```bash
npm run test:e2e:headed
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

---

## Step 6: View Test Reports

After running tests:

```bash
npm run test:e2e:report
```

This opens an HTML report in your browser with:
- Test results (pass/fail)
- Screenshots on failure
- Video recordings
- Execution traces
- Timing information

---

## Test Structure Overview

```
tests/e2e/
├── helpers/
│   ├── test-data.js       # Test data generators
│   └── api-helpers.js     # API utilities
│
├── login.spec.js          # 7 authentication tests
├── leads.spec.js          # 10 leads CRUD tests
├── contacts.spec.js       # 11 contacts CRUD tests
├── integration.spec.js    # 5 integration tests
│
├── playwright.config.cjs  # Playwright configuration
├── run-tests.sh          # Bash test runner
├── verify-setup.js       # Setup verification
│
└── Documentation:
    ├── README.md          # Full documentation
    ├── QUICKSTART.md      # Quick start guide
    ├── INSTALLATION.md    # This file
    └── TEST_SUMMARY.md    # Test coverage summary
```

**Total: 31 comprehensive E2E tests**

---

## Quick Test Commands Reference

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:headed` | Run with visible browser |
| `npm run test:e2e:ui` | Interactive UI mode |
| `npm run test:e2e:debug` | Debug mode with inspector |
| `npm run test:e2e:report` | View HTML test report |
| `npm run test:e2e:login` | Run login tests only |
| `npm run test:e2e:leads` | Run leads tests only |
| `npm run test:e2e:contacts` | Run contacts tests only |
| `npm run test:e2e:integration` | Run integration tests |

---

## Alternative: Using Shell Script

```bash
# Make executable (first time only)
chmod +x tests/e2e/run-tests.sh

# Run all tests
./tests/e2e/run-tests.sh all

# Run specific module
./tests/e2e/run-tests.sh login
./tests/e2e/run-tests.sh leads
./tests/e2e/run-tests.sh contacts
./tests/e2e/run-tests.sh integration

# Run with headed mode
./tests/e2e/run-tests.sh all headed
```

---

## Troubleshooting

### Issue: Playwright not found
```bash
# Solution: Install Playwright
npm install -D @playwright/test
npx playwright install chromium
```

### Issue: Test timeout
```bash
# Solution: Check if API is accessible
curl https://api.crm.windevs.uz/api/

# Or increase timeout in playwright.config.cjs
timeout: 120 * 1000,
```

### Issue: Port 3000 already in use
```bash
# Solution: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in playwright.config.cjs
baseURL: 'http://localhost:3000',
```

### Issue: Login fails
```bash
# Verify credentials are correct
Username: admin
Password: t3sl@admin

# Check if backend API is accessible
curl -X POST https://api.crm.windevs.uz/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"t3sl@admin"}'
```

### Issue: Browser not launching
```bash
# Reinstall browsers
npx playwright install --force chromium
```

### Issue: Tests failing with network errors
```bash
# Check proxy configuration in vite.config.js
# Verify VITE_PROXY_TARGET is set correctly
echo $VITE_PROXY_TARGET
```

---

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true
    
    - name: Upload test report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
        retention-days: 7
```

---

## Running Tests in Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.57.0-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "test:e2e"]
```

```bash
# Build and run
docker build -t crm-e2e-tests .
docker run --rm crm-e2e-tests
```

---

## Test Data Cleanup

Tests automatically clean up their data, but if needed:

```bash
# Manual cleanup (if tests crash)
# Look for records with prefix "E2E_Lead_" or "E2E_Contact_"
# Delete them via the UI or database
```

---

## Performance Tips

1. **Run specific tests during development:**
   ```bash
   npx playwright test -g "should login"
   ```

2. **Use --headed for debugging:**
   ```bash
   npm run test:e2e:headed
   ```

3. **Use --debug for step-by-step:**
   ```bash
   npm run test:e2e:debug
   ```

4. **Keep dev server running:**
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   npm run test:e2e
   ```

---

## Getting Help

1. **Check documentation:**
   - [README.md](./README.md) - Full documentation
   - [QUICKSTART.md](./QUICKSTART.md) - Quick reference
   - [TEST_SUMMARY.md](./TEST_SUMMARY.md) - Test coverage

2. **Run verification:**
   ```bash
   node tests/e2e/verify-setup.js
   ```

3. **View detailed errors:**
   ```bash
   npm run test:e2e:report
   ```

4. **Enable verbose logging:**
   ```bash
   DEBUG=pw:api npm run test:e2e
   ```

---

## Next Steps

✅ **Installation complete!**

Now you can:
1. ✨ Run tests: `npm run test:e2e`
2. 📊 View reports: `npm run test:e2e:report`
3. 🔍 Debug tests: `npm run test:e2e:debug`
4. 📝 Read docs: Check README.md
5. 🚀 Write new tests: Follow existing patterns

---

**Happy Testing! 🎉**
