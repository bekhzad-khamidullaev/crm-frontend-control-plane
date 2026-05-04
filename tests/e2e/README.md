# E2E Test Guide

This directory contains Playwright end-to-end tests for the control-plane frontend.

## Preconditions

1. Control-plane backend API is reachable by frontend proxy configuration.
2. Frontend dependencies are installed.
3. Playwright browsers are installed.

```bash
npm install
npx playwright install chromium
```

## Run Tests

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:e2e:report
```

## Targeted Suites

```bash
npm run test:e2e:login
npm run test:e2e:leads
npm run test:e2e:contacts
npm run test:e2e:integration
```

## Troubleshooting

1. Login fails.
Check test credentials and API accessibility.
2. Timeouts.
Check API latency and frontend proxy target.
3. Port conflicts.
Stop conflicting local process and rerun tests.
