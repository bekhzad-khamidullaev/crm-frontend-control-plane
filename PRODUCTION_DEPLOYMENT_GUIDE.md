# Production Deployment Guide

## Overview

This guide covers the production deployment of the CRM Frontend application.

**Domain Configuration:**
- Frontend: `https://crm.windevs.uz`
- Backend API: `https://api.crm.windevs.uz:8443`
- PBX Server: `wss://pbx.windevs.uz:5061`

## Architecture

```
┌─────────────────┐
│     Client      │
│   (Browser)     │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│   Nginx (crm.windevs.uz:443)   │
│  - Serves React SPA             │
│  - SSL Termination              │
│  - Proxies API requests         │
└────────┬────────────────────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│ Django Backend                  │
│ (api.crm.windevs.uz:8443)      │
│  - REST API                     │
│  - WebSocket (calls, chat)      │
│  - Media files                  │
└─────────────────────────────────┘
```

## Prerequisites

### 1. System Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB RAM
- At least 10GB free disk space

### 2. Network Requirements

- Ports 80 and 443 open for incoming traffic
- Outbound HTTPS access to backend API (api.crm.windevs.uz:8443)
- DNS records configured:
  - `crm.windevs.uz` → Your server IP

### 3. SSL Certificates

You need valid SSL certificates for `crm.windevs.uz`. Place them in:
```
ssl-certs/
├── fullchain.pem
└── privkey.pem
```

**Option 1: Let's Encrypt (Recommended)**
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d crm.windevs.uz

# Copy certificates
sudo cp /etc/letsencrypt/live/crm.windevs.uz/fullchain.pem ssl-certs/
sudo cp /etc/letsencrypt/live/crm.windevs.uz/privkey.pem ssl-certs/
sudo chmod 644 ssl-certs/fullchain.pem
sudo chmod 600 ssl-certs/privkey.pem
```

**Option 2: Self-signed (Development/Testing Only)**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl-certs/privkey.pem \
  -out ssl-certs/fullchain.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=WinDevs/CN=crm.windevs.uz"
```

## Deployment Steps

### Quick Deployment

Use the automated deployment script:

```bash
sudo ./deploy-production.sh
```

The script will:
1. ✅ Check prerequisites (Docker, Docker Compose)
2. ✅ Verify SSL certificates
3. ✅ Test backend connectivity
4. ✅ Build Docker image
5. ✅ Start containers
6. ✅ Run health checks
7. ✅ Display status and logs

### Manual Deployment

If you prefer to deploy manually:

#### Step 1: Clone Repository

```bash
git clone <repository-url>
cd crm-frontend
```

#### Step 2: Configure Environment

Review and update `.env.production`:

```bash
# Production API Configuration
VITE_API_BASE_URL=https://crm.windevs.uz
VITE_API_PREFIX=/api
VITE_API_TIMEOUT=30000

# WebSocket Configuration
VITE_WS_URL=wss://crm.windevs.uz/ws/calls/
VITE_CHAT_WS_URL=wss://crm.windevs.uz/ws/chat/

# SIP Configuration
VITE_SIP_SERVER=wss://pbx.windevs.uz:5061
```

#### Step 3: Prepare SSL Certificates

```bash
# Create directory
mkdir -p ssl-certs

# Copy your certificates
cp /path/to/fullchain.pem ssl-certs/
cp /path/to/privkey.pem ssl-certs/

# Set permissions
chmod 644 ssl-certs/fullchain.pem
chmod 600 ssl-certs/privkey.pem
```

#### Step 4: Create Logs Directory

```bash
mkdir -p logs/nginx
chmod 755 logs/nginx
```

#### Step 5: Build and Start

```bash
# Build the image
docker-compose build --no-cache frontend

# Start the container
docker-compose up -d frontend

# Check status
docker-compose ps
```

#### Step 6: Verify Deployment

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' crm-frontend-production

# View logs
docker logs crm-frontend-production

# Test endpoints
curl -k https://localhost/health
curl -I http://localhost  # Should redirect to HTTPS
```

## Configuration Files

### nginx.conf

The Nginx configuration handles:
- SSL termination for `crm.windevs.uz`
- HTTP to HTTPS redirect
- API proxying to `api.crm.windevs.uz:8443`
- WebSocket proxying for real-time features
- Static asset caching
- Security headers

Key proxy locations:
- `/api/` → `https://api.crm.windevs.uz:8443/api/`
- `/ws/calls/` → `https://api.crm.windevs.uz:8443/ws/calls/`
- `/ws/chat/` → `https://api.crm.windevs.uz:8443/ws/chat/`
- `/media/` → `https://api.crm.windevs.uz:8443/media/`

### docker-compose.yml

Defines the production service:
- Exposes ports 80 and 443
- Mounts SSL certificates
- Sets environment variables
- Configures health checks
- Manages logs

### Dockerfile

Multi-stage build:
1. **Builder stage**: Installs dependencies and builds React app
2. **Runtime stage**: Serves with Nginx Alpine

## Backend Integration

### API Endpoints

All API requests from the frontend go through the Nginx proxy:

```
Frontend Call:          https://crm.windevs.uz/api/leads/
Proxied to Backend:     https://api.crm.windevs.uz:8443/api/leads/
```

### WebSocket Connections

Real-time features use WebSocket connections:

**Calls:**
```
Frontend:  wss://crm.windevs.uz/ws/calls/
Backend:   wss://api.crm.windevs.uz:8443/ws/calls/
```

**Chat:**
```
Frontend:  wss://crm.windevs.uz/ws/chat/
Backend:   wss://api.crm.windevs.uz:8443/ws/chat/
```

### CORS Configuration

Since requests are proxied through Nginx on the same domain, CORS is automatically handled. The backend should allow:
- Origin: `https://crm.windevs.uz`
- Credentials: Yes (for cookies/sessions)

## Operations

### View Logs

```bash
# Follow logs in real-time
docker logs -f crm-frontend-production

# View last 100 lines
docker logs --tail 100 crm-frontend-production

# View Nginx access logs
tail -f logs/nginx/crm.windevs.uz.access.log

# View Nginx error logs
tail -f logs/nginx/crm.windevs.uz.error.log
```

### Restart Application

```bash
# Restart container
docker-compose restart frontend

# Or stop and start
docker-compose down
docker-compose up -d frontend
```

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build frontend
```

### Rollback

```bash
# Stop current container
docker-compose down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and start
docker-compose up -d --build frontend
```

### Health Checks

The application includes built-in health checks:

```bash
# Container health status
docker inspect --format='{{.State.Health.Status}}' crm-frontend-production

# HTTP health endpoint
curl http://localhost/health

# Full application test
curl -k https://localhost/
```

## Monitoring

### Container Stats

```bash
# Real-time stats
docker stats crm-frontend-production

# Container information
docker inspect crm-frontend-production
```

### Disk Usage

```bash
# Docker disk usage
docker system df

# Application logs size
du -sh logs/
```

### Nginx Metrics

```bash
# Active connections
cat logs/nginx/crm.windevs.uz.access.log | wc -l

# Error rate
grep "error" logs/nginx/crm.windevs.uz.error.log | wc -l

# Recent 404s
grep "404" logs/nginx/crm.windevs.uz.access.log | tail -20
```

## Troubleshooting

### Container Won't Start

```bash
# Check Docker logs
docker logs crm-frontend-production

# Check Docker events
docker events --since 10m

# Verify port availability
sudo netstat -tulpn | grep ':80\|:443'
```

### SSL Certificate Issues

```bash
# Verify certificate files
ls -la ssl-certs/

# Test certificate
openssl x509 -in ssl-certs/fullchain.pem -text -noout

# Check certificate expiration
openssl x509 -in ssl-certs/fullchain.pem -noout -enddate
```

### Backend Connection Issues

```bash
# Test backend connectivity
curl -k -v https://api.crm.windevs.uz:8443/api/health

# Check DNS resolution
nslookup api.crm.windevs.uz

# Test from container
docker exec crm-frontend-production curl -k https://api.crm.windevs.uz:8443/api/health
```

### Nginx Configuration Issues

```bash
# Test nginx configuration
docker exec crm-frontend-production nginx -t

# Reload nginx
docker exec crm-frontend-production nginx -s reload

# View nginx error log
docker exec crm-frontend-production cat /var/log/nginx/crm.windevs.uz.error.log
```

### Performance Issues

```bash
# Check resource usage
docker stats crm-frontend-production

# Check disk space
df -h

# Clear old Docker images
docker image prune -a
```

## Security Considerations

### SSL/TLS

- Uses TLS 1.2 and 1.3 only
- Strong cipher suites configured
- SSL session caching enabled
- OCSP stapling enabled

### Security Headers

The following headers are set:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`
- `Content-Security-Policy` with strict policies

### File Permissions

```bash
# SSL certificates
chmod 644 ssl-certs/fullchain.pem
chmod 600 ssl-certs/privkey.pem

# Logs directory
chmod 755 logs/nginx
```

### Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Backup and Recovery

### Backup SSL Certificates

```bash
# Create backup
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz ssl-certs/

# Restore from backup
tar -xzf ssl-backup-YYYYMMDD.tar.gz
```

### Backup Configuration

```bash
# Backup all config files
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  nginx.conf \
  docker-compose.yml \
  Dockerfile \
  .env.production
```

### Backup Logs

```bash
# Archive old logs
tar -czf logs-$(date +%Y%m%d).tar.gz logs/

# Optional: upload to remote storage
# aws s3 cp logs-$(date +%Y%m%d).tar.gz s3://your-bucket/backups/
```

## Maintenance

### Update SSL Certificates

```bash
# Renew Let's Encrypt certificates
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/crm.windevs.uz/fullchain.pem ssl-certs/
sudo cp /etc/letsencrypt/live/crm.windevs.uz/privkey.pem ssl-certs/

# Reload Nginx
docker exec crm-frontend-production nginx -s reload
```

### Log Rotation

Create `/etc/logrotate.d/crm-frontend`:

```
/path/to/crm-frontend/logs/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        docker exec crm-frontend-production nginx -s reopen
    endscript
}
```

### Update Dependencies

```bash
# Update base images
docker pull node:20-alpine
docker pull nginx:1.25-alpine

# Rebuild with new images
docker-compose build --no-cache --pull frontend
docker-compose up -d frontend
```

## Support and Contact

For issues or questions:
- Check logs: `docker logs crm-frontend-production`
- Review this guide
- Contact: support@windevs.uz

## Appendix

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Frontend domain (for API calls) | `https://crm.windevs.uz` |
| `VITE_API_PREFIX` | API prefix | `/api` |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `30000` |
| `VITE_WS_URL` | WebSocket URL for calls | `wss://crm.windevs.uz/ws/calls/` |
| `VITE_CHAT_WS_URL` | WebSocket URL for chat | `wss://crm.windevs.uz/ws/chat/` |
| `VITE_SIP_SERVER` | SIP server for VoIP | `wss://pbx.windevs.uz:5061` |

### Useful Commands Cheatsheet

```bash
# Deployment
sudo ./deploy-production.sh                    # Full deployment
docker-compose up -d --build frontend          # Quick rebuild

# Monitoring
docker logs -f crm-frontend-production         # Follow logs
docker stats crm-frontend-production           # Resource usage
docker inspect crm-frontend-production         # Container details

# Maintenance
docker-compose restart frontend                # Restart
docker-compose down                            # Stop
docker exec crm-frontend-production nginx -t   # Test config
docker exec crm-frontend-production nginx -s reload  # Reload nginx

# Cleanup
docker image prune -a                          # Remove unused images
docker system prune -a                         # Full cleanup
```

### Port Reference

| Port | Service | Description |
|------|---------|-------------|
| 80 | HTTP | Redirects to HTTPS |
| 443 | HTTPS | Main application |
| 8443 | Backend API | Django API server |
| 5061 | PBX | WebRTC/SIP server |

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-01  
**Maintained by:** WinDevs Team
