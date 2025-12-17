# ✅ Production Deployment Checklist

## Pre-Deployment Verification

### 📦 Files & Configuration

- [x] `.env.production` - Production environment variables configured
- [x] `.env.staging` - Staging environment variables configured
- [x] `nginx.conf` - Nginx configuration for SPA routing and API proxy
- [x] `Dockerfile` - Multi-stage Docker build configuration
- [x] `docker-compose.yml` - Container orchestration setup
- [x] `.dockerignore` - Docker build optimization
- [x] `deploy.sh` - Automated deployment script
- [x] `Makefile` - Convenient command shortcuts
- [x] `.github/workflows/ci.yml` - CI/CD pipeline configuration

### 🛠️ Scripts

- [x] `scripts/setup-server.sh` - First-time server setup
- [x] `scripts/health-check.sh` - Health monitoring script
- [x] `scripts/backup.sh` - Backup automation script

### 📚 Documentation

- [x] `DEPLOYMENT.md` - Full deployment documentation
- [x] `QUICK_START.md` - Quick start guide
- [x] `README.production.md` - Production overview

### ⚙️ Build Configuration

- [x] `vite.config.js` - Optimized for production builds
  - [x] Code splitting configured
  - [x] Minification enabled
  - [x] Source maps disabled for production
  - [x] Bundle analyzer integrated
  - [x] Console.log removal in production
- [x] `package.json` - Scripts updated for production

---

## Server Requirements Checklist

### 🖥️ Infrastructure

- [ ] **Server provisioned** (Ubuntu 20.04+ recommended)
- [ ] **Minimum 2GB RAM, 2 CPU cores, 20GB disk**
- [ ] **Static IP assigned**
- [ ] **SSH access configured**

### 🌐 DNS Configuration

- [ ] **A Record:** `windevs.uz` → Server IP
- [ ] **A Record:** `www.windevs.uz` → Server IP
- [ ] **A Record:** `staging.windevs.uz` → Server IP (if staging needed)
- [ ] **DNS propagation completed** (check with `dig windevs.uz`)

### 🔒 SSL Certificates

- [ ] **Certbot installed** on server
- [ ] **SSL certificate obtained** for `windevs.uz`
- [ ] **SSL certificate obtained** for `www.windevs.uz`
- [ ] **SSL certificate obtained** for `staging.windevs.uz` (if staging)
- [ ] **Auto-renewal configured** (certbot renew cronjob)

### 🐳 Docker Setup

- [ ] **Docker installed** (`docker --version`)
- [ ] **Docker Compose installed** (`docker-compose --version`)
- [ ] **Docker service enabled** (`systemctl status docker`)
- [ ] **User added to docker group**

### 🔥 Firewall Configuration

- [ ] **Port 22 open** (SSH)
- [ ] **Port 80 open** (HTTP)
- [ ] **Port 443 open** (HTTPS)
- [ ] **Port 5060 open** (SIP - if needed)
- [ ] **Port 5061 open** (SIP TLS - if needed)
- [ ] **Port 10000-20000 open** (RTP media - if needed)
- [ ] **UFW enabled and configured**

---

## Backend Integration Checklist

### 🔌 API Backend (crm.windevs.uz)

- [ ] **Backend server running**
- [ ] **API accessible:** `https://crm.windevs.uz/api/`
- [ ] **Health endpoint works:** `https://crm.windevs.uz/api/health/`
- [ ] **CORS configured** to allow `windevs.uz` origin
- [ ] **WebSocket endpoint available:** `wss://crm.windevs.uz/ws/calls/`
- [ ] **Chat WebSocket available:** `wss://crm.windevs.uz/ws/chat/`
- [ ] **Authentication endpoints working**

### ☎️ PBX Server (pbx.windevs.uz)

- [ ] **PBX server running**
- [ ] **SIP server accessible:** `wss://pbx.windevs.uz:5061`
- [ ] **STUN server configured**
- [ ] **SIP credentials available**
- [ ] **WebRTC support enabled**
- [ ] **Test call successful**

---

## Environment Variables Verification

### Production (.env.production)

- [x] `VITE_API_BASE_URL=https://crm.windevs.uz`
- [x] `VITE_API_PREFIX=/api`
- [x] `VITE_SIP_SERVER=wss://pbx.windevs.uz:5061`
- [x] `VITE_SIP_REALM=pbx.windevs.uz`
- [ ] `VITE_SIP_USERNAME=<set-actual-value>`
- [ ] `VITE_SIP_PASSWORD=<set-actual-value>`
- [x] `VITE_WS_URL=wss://crm.windevs.uz/ws/calls/`
- [x] `VITE_CHAT_WS_URL=wss://crm.windevs.uz/ws/chat/`

**⚠️ ACTION REQUIRED:** Update SIP credentials in `.env.production`

---

## CI/CD Setup (GitHub Actions)

### GitHub Secrets Configuration

Required secrets in GitHub repository settings:

- [ ] `PRODUCTION_HOST` - Production server IP
- [ ] `PRODUCTION_USER` - SSH username for production
- [ ] `PRODUCTION_SSH_KEY` - SSH private key for production
- [ ] `STAGING_HOST` - Staging server IP (optional)
- [ ] `STAGING_USER` - SSH username for staging (optional)
- [ ] `STAGING_SSH_KEY` - SSH private key for staging (optional)

### GitHub Packages

- [ ] **GitHub Container Registry access** enabled
- [ ] **GITHUB_TOKEN permissions** set (read:packages, write:packages)

---

## Pre-Deployment Tests

### 🧪 Local Testing

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Run tests
npm run test

# Build for production
npm run build:production

# Preview production build
npm run preview:production
```

- [ ] **All tests passing**
- [ ] **No lint errors**
- [ ] **Production build successful**
- [ ] **Preview works locally**

### 🐳 Docker Testing

```bash
# Build Docker image
docker-compose build frontend

# Start container
docker-compose up -d frontend

# Check health
curl http://localhost/health

# Check logs
docker-compose logs frontend
```

- [ ] **Docker build successful**
- [ ] **Container starts without errors**
- [ ] **Health check passes**
- [ ] **Application accessible on localhost**

---

## Deployment Steps

### Option 1: Automated Deployment Script

```bash
# On server
cd /opt/crm-frontend
./deploy.sh production
```

### Option 2: Manual Deployment

```bash
# On server
cd /opt/crm-frontend
git pull origin main
docker-compose build frontend
docker-compose up -d frontend
./scripts/health-check.sh
```

### Option 3: CI/CD Pipeline

```bash
# Push to main branch
git push origin main

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build Docker image
# 3. Push to registry
# 4. Deploy to production server
```

---

## Post-Deployment Verification

### ✅ Smoke Tests

- [ ] **Frontend loads:** `https://windevs.uz`
- [ ] **Health check passes:** `https://windevs.uz/health`
- [ ] **Login page accessible**
- [ ] **API requests working** (check browser network tab)
- [ ] **WebSocket connections established**
- [ ] **No console errors** in browser
- [ ] **SSL certificate valid** (no browser warnings)
- [ ] **Assets loading correctly** (CSS, JS, images)
- [ ] **Mobile responsive** (test on mobile device)

### 📊 Monitoring Setup

- [ ] **Health check script scheduled** (cron job)
- [ ] **Backup script scheduled** (cron job)
- [ ] **Log rotation configured**
- [ ] **Disk space monitoring** set up
- [ ] **Uptime monitoring** configured (optional)
- [ ] **Error tracking** integrated (optional: Sentry)

### 🔐 Security Verification

- [ ] **HTTPS enforced** (HTTP redirects to HTTPS)
- [ ] **Security headers present** (check with securityheaders.com)
- [ ] **No sensitive data in client code**
- [ ] **No exposed secrets** in environment variables
- [ ] **Fail2ban configured** for SSH protection
- [ ] **Regular security updates scheduled**

---

## Maintenance Schedule

### Daily
- [ ] Monitor health checks
- [ ] Review error logs

### Weekly
- [ ] Check disk space
- [ ] Review access logs
- [ ] Verify backups

### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Review security patches
- [ ] Test backup restoration
- [ ] SSL certificate check

---

## Rollback Plan

If deployment fails:

```bash
# Stop current deployment
docker-compose down

# Restore from backup
tar -xzf backups/crm-frontend-backup-LATEST.tar.gz

# Rollback to previous version
git checkout <previous-commit>
docker-compose up -d --force-recreate

# Verify
./scripts/health-check.sh
```

---

## Support & Documentation

- **Full Deployment Guide:** `DEPLOYMENT.md`
- **Quick Start:** `QUICK_START.md`
- **Troubleshooting:** `DEPLOYMENT.md#troubleshooting`
- **Health Monitoring:** `./scripts/health-check.sh`
- **Backup/Restore:** `./scripts/backup.sh`

---

## Final Sign-Off

**Deployment Lead:** _____________________ Date: _________

**Infrastructure:** _____________________ Date: _________

**Backend Team:** _____________________ Date: _________

**QA Approval:** _____________________ Date: _________

---

## 🚀 Ready for Production!

Once all checkboxes are marked, you're ready to deploy:

```bash
./deploy.sh production
```

**Good luck! 🎉**
