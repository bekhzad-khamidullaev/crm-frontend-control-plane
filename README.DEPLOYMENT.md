# 🚀 Production Deployment Information

This file contains critical information about production deployment configuration.

## ✅ Status: READY FOR PRODUCTION

The CRM Frontend is fully configured for production deployment with:
- **Frontend Domain:** https://windevs.uz
- **API Backend:** https://crm.windevs.uz
- **PBX Server:** wss://pbx.windevs.uz:5061

---

## 📋 Start Here

If you're ready to deploy to production, follow these documents in order:

1. **⚠️ [TODO_BEFORE_DEPLOY.txt](TODO_BEFORE_DEPLOY.txt)** - Critical checklist (READ FIRST!)
2. **🎯 [NEXT_STEPS.md](NEXT_STEPS.md)** - Detailed step-by-step guide
3. **⚡ [QUICK_START.md](QUICK_START.md)** - 15-minute quick deployment
4. **📚 [DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment documentation
5. **✅ [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre/post-deployment checklist
6. **📊 [PRODUCTION_READY_SUMMARY.md](PRODUCTION_READY_SUMMARY.md)** - What was prepared

---

## 🎯 Quick Deploy Commands

### Local Testing
```bash
# Install dependencies (required first time)
npm install --save-dev rollup-plugin-visualizer vite-plugin-compression @vitest/coverage-v8

# Test production build
npm run build:production
npm run preview:production
```

### Server Deployment
```bash
# On production server (after initial setup)
./deploy.sh production

# Check health
./scripts/health-check.sh

# View logs
docker-compose logs -f frontend
```

### With Make
```bash
make deploy-prod     # Deploy to production
make health          # Health check
make docker-logs     # View logs
make backup          # Create backup
```

---

## 🏗️ What Was Configured

### Environment Files
- ✅ `.env.production` - Production environment variables
- ✅ `.env.staging` - Staging environment variables

### Docker & Nginx
- ✅ `Dockerfile` - Optimized multi-stage build
- ✅ `docker-compose.yml` - Container orchestration
- ✅ `nginx.conf` - Reverse proxy, SSL, security headers
- ✅ `.dockerignore` - Build optimization

### Deployment Scripts
- ✅ `deploy.sh` - Automated deployment (production/staging/local)
- ✅ `scripts/setup-server.sh` - First-time server setup
- ✅ `scripts/health-check.sh` - Service health monitoring
- ✅ `scripts/backup.sh` - Automated backups
- ✅ `Makefile` - Convenient command shortcuts

### CI/CD
- ✅ `.github/workflows/ci.yml` - GitHub Actions pipeline with auto-deploy

### Build Optimizations
- ✅ Code splitting (React, Ant Design, Charts, etc.)
- ✅ Minification and tree shaking
- ✅ Gzip compression
- ✅ Cache-Control headers
- ✅ Asset fingerprinting
- ✅ Console.log removal in production
- ✅ Bundle analyzer integration

### Security
- ✅ HTTPS enforcement
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Firewall configuration
- ✅ SSL/TLS certificates
- ✅ Rate limiting
- ✅ No secrets in repository

---

## 🌐 Production Architecture

```
                    Internet
                       ↓
              [DNS: windevs.uz]
                       ↓
         [Nginx + SSL (Port 443)]
                       ↓
    [Docker Container - React SPA]
           ↓           ↓           ↓
    [Static]    [API Proxy]  [WebSocket]
                       ↓           ↓
              crm.windevs.uz   wss://crm.windevs.uz
              [Django API]     [Django Channels]
              
                       ↓
              pbx.windevs.uz:5061
              [PBX/VoIP Server]
```

---

## ⚠️ Before You Deploy

Complete these actions on your local machine:

1. **Install missing npm packages:**
   ```bash
   npm install --save-dev rollup-plugin-visualizer vite-plugin-compression @vitest/coverage-v8
   ```

2. **Update SIP credentials in `.env.production`:**
   ```env
   VITE_SIP_USERNAME=<your-actual-username>
   VITE_SIP_PASSWORD=<your-actual-password>
   ```

3. **Test the build:**
   ```bash
   npm run build:production
   npm run preview:production
   # Open http://localhost:4173
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "Production deployment configuration"
   git push origin main
   ```

---

## 🖥️ Server Requirements

- **OS:** Ubuntu 20.04 LTS or newer
- **RAM:** 2GB minimum (4GB recommended)
- **CPU:** 2+ cores
- **Disk:** 20GB free space
- **Ports:** 80, 443, 5060, 5061 open

### Software Required
- Docker 20.10+
- Docker Compose 2.0+
- Nginx 1.18+
- Certbot (for SSL)
- Git

---

## 📊 Deployment Methods

### Method 1: Automated Script (Recommended)
```bash
# On server
cd /opt/crm-frontend
./deploy.sh production
```
**Automatically handles:**
- Git pull
- Docker build
- Container restart
- Health checks
- Cleanup

### Method 2: Docker Compose
```bash
docker-compose build frontend
docker-compose up -d frontend
```

### Method 3: CI/CD (Automatic)
```bash
# Just push to main
git push origin main
# GitHub Actions deploys automatically
```

---

## 🔍 Post-Deployment Verification

### Automated Health Check
```bash
./scripts/health-check.sh
```

### Manual Checks
```bash
# Frontend
curl https://windevs.uz
curl https://windevs.uz/health

# Backend API
curl https://crm.windevs.uz/api/

# Browser
# 1. Open https://windevs.uz
# 2. Check browser console (no errors)
# 3. Check Network tab (API calls working)
# 4. Test login functionality
```

### View Logs
```bash
# Application logs
docker-compose logs -f frontend

# Nginx access logs
tail -f logs/nginx/windevs.uz.access.log

# Nginx error logs
tail -f logs/nginx/windevs.uz.error.log
```

---

## 🔧 Common Issues & Solutions

### Container won't start
```bash
docker-compose logs frontend          # Check logs
docker-compose build --no-cache      # Rebuild
docker-compose up -d --force-recreate # Restart
```

### 502 Bad Gateway
- Check if backend is running: `curl https://crm.windevs.uz/api/`
- Verify nginx config: `docker-compose exec frontend nginx -t`
- Check CORS settings on Django backend

### SSL Issues
```bash
sudo certbot certificates             # Check status
sudo certbot renew                    # Renew certs
sudo systemctl restart nginx          # Restart nginx
```

---

## 📚 Documentation Index

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `TODO_BEFORE_DEPLOY.txt` | Critical checklist | ⚠️ **START HERE** |
| `NEXT_STEPS.md` | Step-by-step guide | After reading TODO |
| `QUICK_START.md` | 15-min deployment | For quick deploy |
| `DEPLOYMENT.md` | Complete guide | For detailed info |
| `DEPLOYMENT_CHECKLIST.md` | Full checklist | Pre/post deployment |
| `PRODUCTION_READY_SUMMARY.md` | What was done | Overview |
| `README.DEPLOYMENT.md` | This file | Quick reference |

---

## 🎉 You're Ready!

All configuration is complete. Follow the documents above to deploy.

**Next Step:** Read [TODO_BEFORE_DEPLOY.txt](TODO_BEFORE_DEPLOY.txt)

---

**Production URL after deployment:** https://windevs.uz 🚀
