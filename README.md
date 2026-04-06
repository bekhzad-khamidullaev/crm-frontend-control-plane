# CRM Frontend Control Plane

Frontend for control-plane admins and commercial/licensing workflows.

## Instance Boundary

1. `crm-frontend-control-plane` serves control-plane operators.
2. `crm-frontend` serves client runtime users.

Do not merge these UIs into one runtime deployment.

## Quick Start

```bash
docker compose up -d --build
```

## Production Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Detailed steps: `DEPLOY_PROD.md`.

## Testing

```bash
npm run test
npm run test:e2e
```

E2E guide: `tests/e2e/README.md`.
