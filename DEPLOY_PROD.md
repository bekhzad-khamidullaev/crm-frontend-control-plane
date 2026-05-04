# Production Deploy (crm-frontend)

## Prerequisites
- Docker Engine + Docker Compose plugin installed
- Filled `.env.production` in this directory

## Start / Update
```bash
cd /Users/sysadmin/Documents/CRM/crm-frontend
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Check Status
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f frontend
```

## Stop
```bash
docker compose -f docker-compose.prod.yml down
```
