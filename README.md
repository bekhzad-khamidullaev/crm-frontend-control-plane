# CRM Frontend Control Plane

Frontend application for CRM license/control-plane.

## Instance boundary
- `crm-frontend-control-plane` serves licensing, sales, edition and partner/control-plane workflows.
- `crm-frontend` serves client operational CRM workflows.
- These are separate frontend instances and should remain decoupled.

## Production
- Compose file: `docker-compose.prod.yml`
- Build/runtime env: `.env.production`
- Compose vars source: `.env`
- Deploy guide: `DEPLOY_PROD.md`

## Quick start
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
