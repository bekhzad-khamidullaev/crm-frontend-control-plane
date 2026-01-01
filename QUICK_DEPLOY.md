# Quick Deployment Guide

## 🚀 Fast Track to Production

This is a condensed guide for experienced users. For detailed information, see `PRODUCTION_DEPLOYMENT_GUIDE.md`.

## Configuration

- **Frontend Domain:** `crm.windevs.uz`
- **Backend API:** `api.crm.windevs.uz:8443`
- **Ports:** 80 (HTTP), 443 (HTTPS)

## Prerequisites Check

```bash
# Verify installations
docker --version        # >= 20.10
docker-compose --version # >= 2.0

# Check ports
sudo netstat -tulpn | grep ':80\|:443'
```

## SSL Certificates

Place your SSL certificates:
```bash
ssl-certs/
├── fullchain.pem   # Public certificate + CA chain
└── privkey.pem     # Private key
```

### Quick Let's Encrypt Setup

```bash
sudo certbot certonly --standalone -d crm.windevs.uz
sudo cp /etc/letsencrypt/live/crm.windevs.uz/fullchain.pem ssl-certs/
sudo cp /etc/letsencrypt/live/crm.windevs.uz/privkey.pem ssl-certs/
sudo chmod 644 ssl-certs/fullchain.pem
sudo chmod 600 ssl-certs/privkey.pem
```

## One-Command Deploy

```bash
sudo ./deploy-production.sh
```

That's it! The script handles everything automatically.

## Manual Deploy (3 Commands)

```bash
# 1. Ensure SSL certs are in place
ls -la ssl-certs/

# 2. Build and start
docker-compose build --no-cache frontend
docker-compose up -d frontend

# 3. Verify
docker logs crm-frontend-production
curl -k https://localhost/health
```

## Verify Deployment

```bash
# Container status
docker ps | grep crm-frontend

# Health check
curl https://crm.windevs.uz/health

# Test API proxy
curl https://crm.windevs.uz/api/health
```

## Essential Commands

```bash
# View logs
docker logs -f crm-frontend-production

# Restart
docker-compose restart frontend

# Stop
docker-compose down

# Update & redeploy
git pull && docker-compose up -d --build frontend
```

## Troubleshooting

```bash
# Check logs
docker logs --tail 100 crm-frontend-production

# Test nginx config
docker exec crm-frontend-production nginx -t

# Test backend connectivity
curl -k https://api.crm.windevs.uz:8443/api/health

# Check certificate
openssl x509 -in ssl-certs/fullchain.pem -noout -enddate
```

## Important Notes

1. **DNS:** Ensure `crm.windevs.uz` points to your server IP
2. **Firewall:** Open ports 80 and 443
3. **Backend:** Ensure `api.crm.windevs.uz:8443` is accessible
4. **Certificates:** Use valid SSL certificates (not self-signed) in production

## Next Steps

After deployment:
- [ ] Verify all API endpoints work
- [ ] Test WebSocket connections (calls, chat)
- [ ] Configure monitoring and alerts
- [ ] Set up log rotation
- [ ] Create backup strategy

## Support

Full documentation: `PRODUCTION_DEPLOYMENT_GUIDE.md`
