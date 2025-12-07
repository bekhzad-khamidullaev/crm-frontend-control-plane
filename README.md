# CRM Frontend (Material Design + Vite)

Frontend scaffold for corporate CRM using Material Design Web (MDC Web) components and Vite, integrating with Django-CRM API described in `Django-CRM API.yaml`.

## Quick start

- Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
- Install deps: `npm install`
- Run dev server: `npm run dev`

## Project layout

- `index.html` — Material Design shell with Top App Bar, Drawer (sidebar), content wrapper
- `src/main.js` — entrypoint, MDC Web initialization, router, mounts Dashboard/Leads/Contacts
- `src/styles/material-theme.css` — Material Design theme customization
- `src/lib/api/` — fetch-based API client and token helpers
- `src/modules/leads/` — Leads module (list, detail, create, edit, delete)
- `src/modules/contacts/` — Contacts module (list, detail, create, edit, delete)
- `src/components/` — Reusable Material Design UI components (Table, Pagination, Modal, Toast, Spinner)

## Routing

- Hash-based routes: `#/login`, `#/dashboard`, `#/leads`, `#/leads/new`, `#/leads/:id`, `#/leads/:id/edit`.
- Protected routes redirect to Login when unauthenticated; after login the app restores the intended route.

## API integration

- Source of truth: `Django-CRM API.yaml`.
- All requests go through `src/lib/api/client.js` (handles base URL, timeouts, retries for GET, JSON, normalized errors).
- Token auth: set via `src/lib/api/auth.js` using `Authorization: Token <token>` if present; cookies are included for `cookieAuth` as well.

## Features

✅ Material Design UI with MDC Web components
✅ Material Icons throughout the interface
✅ Authentication with token storage and route guards
✅ Hash-based routing with deep links
✅ Leads module: full CRUD with validation
✅ Contacts module: full CRUD with validation
✅ Reusable components: Modal dialogs, Snackbar notifications, Spinners
✅ Responsive drawer navigation
✅ Form validation with inline error display
✅ Unit tests (Vitest) - 17/17 passing
✅ Linting and formatting (ESLint + Prettier)

## Next steps
- Enterprise uplift in phases (see MIGRATION_SUMMARY.md)
- Add unit tests with Vitest and E2E with Playwright
- Add CI (lint → test → build)
- Introduce i18n (en/ru) and global store
- Harden API client and error handling

