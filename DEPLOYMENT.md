# 🚀 Production Deployment Guide - CRM Frontend

Полное руководство по деплою CRM-фронтенда на production и staging серверы.

## 📋 Оглавление

- [Требования](#требования)
- [Первоначальная настройка сервера](#первоначальная-настройка-сервера)
- [Конфигурация окружений](#конфигурация-окружений)
- [Методы деплоя](#методы-деплоя)
- [CI/CD Pipeline](#cicd-pipeline)
- [Мониторинг и логи](#мониторинг-и-логи)
- [Troubleshooting](#troubleshooting)
- [Backup и Recovery](#backup-и-recovery)

---

## 🎯 Требования

### Серверные требования

- **OS:** Ubuntu 20.04 LTS или новее
- **RAM:** Минимум 2GB (рекомендуется 4GB)
- **CPU:** 2+ cores
- **Disk:** Минимум 20GB свободного места
- **Network:** Открытые порты 80, 443, 5060, 5061

### Программное обеспечение

- Docker 20.10+
- Docker Compose 2.0+
- Nginx 1.18+ (для reverse proxy)
- Git
- SSL сертификаты (Let's Encrypt)

### Домены и DNS

- **Production:** `windevs.uz`, `www.windevs.uz`
- **Staging:** `staging.windevs.uz`
- **API Backend:** `crm.windevs.uz`
- **PBX Server:** `pbx.windevs.uz`

---

## 🔧 Первоначальная настройка сервера

### 1. Автоматическая настройка

Запустите скрипт автоматической настройки:

```bash
# Скачайте проект
git clone <your-repo-url> /opt/crm-frontend
cd /opt/crm-frontend

# Запустите setup скрипт
sudo ./scripts/setup-server.sh
```

Скрипт автоматически установит:
- Docker и Docker Compose
- Nginx
- Certbot для SSL
- Firewall (UFW)
- Fail2ban для безопасности

### 2. Ручная настройка (если нужно)

#### Установка Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### Установка Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Установка Nginx

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 3. Получение SSL сертификатов

```bash
# Production
sudo certbot --nginx -d windevs.uz -d www.windevs.uz

# Staging
sudo certbot --nginx -d staging.windevs.uz
```

Certbot автоматически настроит автообновление сертификатов.

---

## ⚙️ Конфигурация окружений

### Environment Variables

#### Production (`.env.production`)

```bash
# API Configuration
VITE_API_BASE_URL=https://crm.windevs.uz
VITE_API_PREFIX=/api
VITE_API_TIMEOUT=30000
VITE_AUTH_MODE=jwt

# SIP/WebRTC Configuration
VITE_SIP_REALM=pbx.windevs.uz
VITE_SIP_USERNAME=<your-sip-username>
VITE_SIP_PASSWORD=<your-sip-password>
VITE_SIP_SERVER=wss://pbx.windevs.uz:5061
VITE_SIP_DISPLAY_NAME=CRM User
VITE_STUN_SERVER=stun:stun.l.google.com:19302

# WebSocket Configuration
VITE_WS_URL=wss://crm.windevs.uz/ws/calls/
VITE_CHAT_WS_URL=wss://crm.windevs.uz/ws/chat/

NODE_ENV=production
```

#### Staging (`.env.staging`)

```bash
# API Configuration
VITE_API_BASE_URL=https://staging.crm.windevs.uz
VITE_API_PREFIX=/api
VITE_API_TIMEOUT=30000
VITE_AUTH_MODE=jwt

# WebSocket Configuration
VITE_WS_URL=wss://staging.crm.windevs.uz/ws/calls/
VITE_CHAT_WS_URL=wss://staging.crm.windevs.uz/ws/chat/

NODE_ENV=staging
```

### Nginx Configuration

Конфигурация уже готова в `nginx.conf`. Обновите пути к SSL сертификатам:

```nginx
ssl_certificate /etc/letsencrypt/live/windevs.uz/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/windevs.uz/privkey.pem;
```

---

## 🚀 Методы деплоя

### Метод 1: Автоматический деплой через скрипт (Рекомендуется)

```bash
# Production
./deploy.sh production

# Staging
./deploy.sh staging

# Local development
./deploy.sh local
```

Скрипт автоматически:
1. Подтягивает последние изменения из Git
2. Собирает Docker образ
3. Останавливает старые контейнеры
4. Запускает новые контейнеры
5. Проверяет health status
6. Очищает старые образы

### Метод 2: Docker Compose (Ручной)

```bash
# Production
docker-compose build frontend
docker-compose up -d frontend

# Staging
docker-compose --profile staging build frontend-staging
docker-compose --profile staging up -d frontend-staging
```

### Метод 3: CI/CD (Автоматический)

При push в `main`/`master` ветку автоматически запускается деплой через GitHub Actions.

Требуется настроить GitHub Secrets:
- `PRODUCTION_HOST` - IP адрес production сервера
- `PRODUCTION_USER` - SSH пользователь
- `PRODUCTION_SSH_KEY` - SSH приватный ключ

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Pipeline включает следующие этапы:

1. **Lint & Test** - проверка кода и запуск тестов
2. **Build** - сборка для staging и production
3. **Docker** - создание и публикация Docker образов
4. **Deploy** - автоматический деплой на серверы

### Настройка GitHub Secrets

Перейдите в Settings → Secrets → Actions и добавьте:

```
PRODUCTION_HOST=<your-server-ip>
PRODUCTION_USER=<your-ssh-user>
PRODUCTION_SSH_KEY=<your-private-key>

STAGING_HOST=<staging-server-ip>
STAGING_USER=<staging-ssh-user>
STAGING_SSH_KEY=<staging-private-key>
```

### Триггеры деплоя

- **Push to `main`/`master`** → Production deployment
- **Push to `develop`** → Staging deployment
- **Tag `v*`** → Production deployment с версией

---

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Production logs
docker-compose logs -f frontend

# Staging logs
docker-compose --profile staging logs -f frontend-staging

# Nginx access logs
tail -f ./logs/nginx/windevs.uz.access.log

# Nginx error logs
tail -f ./logs/nginx/windevs.uz.error.log
```

### Health Check

```bash
# Автоматическая проверка всех сервисов
./scripts/health-check.sh

# Ручная проверка
curl https://windevs.uz/health
curl https://crm.windevs.uz/api/health/
curl https://pbx.windevs.uz
```

### Мониторинг контейнеров

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# События Docker
docker events
```

---

## 🔍 Troubleshooting

### Проблема: Контейнер не стартует

```bash
# Проверить логи
docker-compose logs frontend

# Проверить конфигурацию
docker-compose config

# Пересобрать образ
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Проблема: SSL сертификаты не работают

```bash
# Проверить сертификаты
sudo certbot certificates

# Обновить сертификаты
sudo certbot renew

# Перезапустить nginx
sudo systemctl restart nginx
```

### Проблема: API запросы не проходят

Проверьте:
1. CORS настройки на Django backend
2. Nginx proxy настройки в `nginx.conf`
3. Firewall правила: `sudo ufw status`
4. DNS настройки доменов

```bash
# Проверить соединение с backend
curl -I https://crm.windevs.uz/api/

# Проверить WebSocket
wscat -c wss://crm.windevs.uz/ws/calls/
```

### Проблема: High memory usage

```bash
# Проверить использование памяти
docker stats

# Ограничить память контейнера
# В docker-compose.yml добавить:
services:
  frontend:
    mem_limit: 512m
    memswap_limit: 512m
```

### Проблема: 502 Bad Gateway

Причины:
1. Backend сервер недоступен
2. Неверная proxy конфигурация
3. Timeout настройки

```bash
# Проверить backend
curl https://crm.windevs.uz/api/health/

# Проверить nginx конфигурацию
sudo nginx -t

# Увеличить timeout в nginx.conf
proxy_read_timeout 300s;
```

---

## 💾 Backup и Recovery

### Создание backup

```bash
# Автоматический backup
./scripts/backup.sh

# Backup сохраняется в ./backups/
```

Backup включает:
- Environment файлы
- Docker compose конфигурацию
- Nginx конфигурацию
- Логи

### Восстановление из backup

```bash
# Остановить контейнеры
docker-compose down

# Распаковать backup
tar -xzf backups/crm-frontend-backup-YYYYMMDD_HHMMSS.tar.gz

# Восстановить конфигурацию
cp crm-frontend-backup-*/docker-compose.yml .
cp crm-frontend-backup-*/nginx.conf .
cp crm-frontend-backup-*/.env.production .

# Запустить контейнеры
docker-compose up -d
```

### Автоматический backup (Cron)

Добавьте в crontab:

```bash
# Открыть crontab
crontab -e

# Добавить задачу (ежедневный backup в 3:00)
0 3 * * * cd /opt/crm-frontend && ./scripts/backup.sh >> /var/log/crm-backup.log 2>&1
```

---

## 📝 Чеклист перед деплоем

- [ ] SSL сертификаты получены и настроены
- [ ] Environment variables настроены для production
- [ ] DNS записи указывают на сервер
- [ ] Firewall настроен (порты 80, 443, 5060, 5061)
- [ ] Docker и Docker Compose установлены
- [ ] Backend API доступен (crm.windevs.uz)
- [ ] PBX сервер доступен (pbx.windevs.uz)
- [ ] GitHub secrets настроены для CI/CD
- [ ] Backup скрипт настроен в cron
- [ ] Health check проходит успешно

---

## 🔒 Безопасность

### Рекомендации:

1. **Firewall:** Используйте UFW для ограничения доступа
2. **Fail2ban:** Защита от brute-force атак
3. **SSL:** Всегда используйте HTTPS
4. **Secrets:** Не храните секреты в репозитории
5. **Updates:** Регулярно обновляйте Docker образы
6. **Logs:** Мониторьте логи на подозрительную активность

### Security Headers

Все необходимые security headers уже настроены в `nginx.conf`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f`
2. Запустите health check: `./scripts/health-check.sh`
3. Проверьте документацию в `/docs`
4. Создайте issue в репозитории

---

## 📚 Полезные команды

```bash
# Быстрый перезапуск
docker-compose restart frontend

# Обновление образа
docker-compose pull frontend
docker-compose up -d frontend

# Очистка неиспользуемых ресурсов
docker system prune -a

# Просмотр метрик
docker stats frontend

# Shell в контейнер
docker-compose exec frontend sh

# Проверка конфигурации nginx
docker-compose exec frontend nginx -t
```

---

**Версия документа:** 1.0  
**Последнее обновление:** 2024  
**Поддерживается:** Docker, Docker Compose, Nginx, Ubuntu 20.04+
