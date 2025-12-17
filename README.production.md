# Production Configuration Overview

## Environment Variables

All production environment variables are configured in `.env.production`:

- **API Backend**: https://crm.windevs.uz
- **PBX Server**: wss://pbx.windevs.uz:5061
- **Frontend Domain**: https://windevs.uz

## Architecture

```
Internet
    ↓
Nginx (Port 443) - SSL Termination
    ↓
Docker Container (Frontend)
    ↓
Proxies to:
    - crm.windevs.uz (Django API)
    - pbx.windevs.uz (VoIP/SIP)
```

## Quick Commands

```bash
# Deploy
./deploy.sh production

# Health check
./scripts/health-check.sh

# Logs
docker-compose logs -f frontend

# Restart
docker-compose restart frontend
```

See `DEPLOYMENT.md` for full documentation.
