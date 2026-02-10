# 🚀 START HERE - E2E Test Suite

Welcome! This guide will get you started with the E2E test suite in under 5 minutes.

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Install Playwright browsers
npx playwright install chromium

# 2. Run all tests
npm run test:e2e

# 3. View the report
npm run test:e2e:report
```

That's it! Your tests are running. 🎉

---

## 📚 What's Available?

**31 Comprehensive Tests** covering:
- ✅ Login (7 tests)
- ✅ Leads CRUD (10 tests)
- ✅ Contacts CRUD (11 tests)
- ✅ Integration (5 tests)

**Test Credentials:**
- Username: `admin`
- Password: `t3sl@admin`

---

## 🎯 Common Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

---

## 📖 Need More Info?

Choose based on what you need:

| I Want To... | Read This |
|--------------|-----------|
| 🆕 **Set up from scratch** | [INSTALLATION.md](./INSTALLATION.md) |
| ⚡ **Quick commands** | [QUICKSTART.md](./QUICKSTART.md) |
| 📋 **See what's tested** | [TEST_SUMMARY.md](./TEST_SUMMARY.md) |
| 📚 **Full documentation** | [README.md](./README.md) |
| 🗂️ **Browse all files** | [INDEX.md](./INDEX.md) |
| ✅ **Verify setup** | Run: `node tests/e2e/verify-setup.js` |

---

## 🎬 Your First Test Run

```bash
# Start here - run login tests only
npm run test:e2e:login
```

Watch the tests run in ~20 seconds. You'll see:
- ✓ 7 tests passing
- Test results in your terminal
- HTML report generated

Then explore:
```bash
# Try other modules
npm run test:e2e:leads
npm run test:e2e:contacts
npm run test:e2e:integration

# Or run everything
npm run test:e2e
```

---

## 💡 Pro Tips

**See what's happening:**
```bash
npm run test:e2e:headed
```

**Debug a specific test:**
```bash
npx playwright test -g "should login" --debug
```

**Interactive mode (recommended for learning):**
```bash
npm run test:e2e:ui
```

---

## 🐛 Problems?

1. **Verify your setup:**
   ```bash
   node tests/e2e/verify-setup.js
   ```

2. **Check troubleshooting:**
   See [INSTALLATION.md](./INSTALLATION.md#troubleshooting)

3. **Still stuck?**
   Read [README.md](./README.md) for detailed help

---

## ✅ Quick Checklist

Before running tests, ensure:
- [ ] Node.js 18+ installed
- [ ] `npm install` completed
- [ ] `npx playwright install chromium` run
- [ ] Backend API accessible (https://api.crm.windevs.uz)
- [ ] Port 3000 available for dev server

---

## 🎉 Ready to Go!

You have everything you need. Start testing:

```bash
npm run test:e2e
```

Then view the beautiful HTML report:

```bash
npm run test:e2e:report
```

---

**Happy Testing! 🚀**

*Next: Read [QUICKSTART.md](./QUICKSTART.md) for more commands*
