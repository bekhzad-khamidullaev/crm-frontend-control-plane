# CRM Frontend Control Plane

Frontend application for CRM license/control-plane.

## Production
- Compose file: `docker-compose.prod.yml`
- Build/runtime env: `.env.production`
- Compose vars source: `.env`
- Deploy guide: `DEPLOY_PROD.md`

## Quick start
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
