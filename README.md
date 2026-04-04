# CRM Frontend

Frontend application for client CRM.

## Instance boundary
- `crm-frontend` is the client-facing CRM instance.
- `crm-frontend-control-plane` is a separate instance for license/commercial/control-plane workflows.
- These two frontends are developed in parallel as separate products and must not be merged into a single runtime app.

## Production
- Compose file: `docker-compose.prod.yml`
- Build/runtime env: `.env.production`
- Compose vars source: `.env`
- Deploy guide: `DEPLOY_PROD.md`

## Quick start
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
