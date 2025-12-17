# ⚡ Quick Start Guide - Production Deployment

Быстрое руководство по развертыванию CRM фронтенда на production сервере.

## 🎯 Для нового сервера (0 → Production за 15 минут)

### 1. Подготовка сервера (5 минут)

```bash
# 1.1. Подключитесь к серверу
ssh root@your-server-ip

# 1.2. Клонируйте репозиторий
git clone <your-repo-url> /opt/crm-frontend
cd /opt/crm-frontend

# 1.3. Запустите автоматическую настройку
sudo ./scripts/setup-server.sh

# Скрипт установит: Docker, Docker Compose, Nginx, Certbot, UFW
```

### 2. Получение SSL сертификатов (3 минуты)

```bash
# Убедитесь, что DNS настроен правильно:
# windevs.uz → IP сервера
# www.windevs.uz → IP сервера

# Получить сертификаты
sudo certbot --nginx -d windevs.uz -d www.windevs.uz

# Certbot автоматически настроит nginx и автообновление
```

### 3. Настройка конфигурации (2 минуты)

```bash
# 3.1. Создайте .env.production файл
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://crm.windevs.uz
VITE_API_PREFIX=/api
VITE_API_TIMEOUT=30000
VITE_AUTH_MODE=jwt
VITE_SIP_REALM=pbx.windevs.uz
VITE_SIP_SERVER=wss://pbx.windevs.uz:5061
VITE_SIP_DISPLAY_NAME=CRM User
VITE_STUN_SERVER=stun:stun.l.google.com:19302
VITE_WS_URL=wss://crm.windevs.uz/ws/calls/
VITE_CHAT_WS_URL=wss://crm.windevs.uz/ws/chat/
NODE_ENV=production
EOF

# 3.2. Обновите пути к SSL в nginx.conf (если отличаются)
# По умолчанию certbot создает сертификаты в:
# /etc/letsencrypt/live/windevs.uz/fullchain.pem
# /etc/letsencrypt/live/windevs.uz/privkey.pem
```

### 4. Деплой (5 минут)

```bash
# Запустите деплой скрипт
./deploy.sh production

# Скрипт автоматически:
# - Соберет Docker образ
# - Запустит контейнер
# - Проверит health status
```

### 5. Проверка (1 минута)

```bash
# Проверить здоровье всех сервисов
./scripts/health-check.sh

# Открыть в браузере
# https://windevs.uz
```

---

## 🔄 Для обновления существующего деплоя (2 минуты)

```bash
# Подключитесь к серверу
ssh user@your-server-ip
cd /opt/crm-frontend

# Запустите деплой
./deploy.sh production

# Готово! Новая версия развернута
```

---

## 🚨 Быстрые команды troubleshooting

```bash
# Проверить логи
docker-compose logs -f frontend

# Перезапустить
docker-compose restart frontend

# Проверить статус
docker-compose ps

# Health check
curl https://windevs.uz/health

# Полная переустановка
docker-compose down
docker-compose up -d --force-recreate
```

---

## 📋 Checklist

Перед деплоем убедитесь:

- [x] DNS настроен (windevs.uz → IP сервера)
- [x] Порты открыты (80, 443, 5060, 5061)
- [x] Backend доступен (https://crm.windevs.uz/api/)
- [x] PBX доступен (wss://pbx.windevs.uz:5061)
- [x] SSL сертификаты получены
- [x] Environment variables настроены
- [x] Docker установлен

---

## 🎯 Production URLs

После деплоя будут доступны:

- **Frontend:** https://windevs.uz
- **Health Check:** https://windevs.uz/health
- **Backend API:** https://crm.windevs.uz/api/
- **PBX/VOIP:** wss://pbx.windevs.uz:5061
- **WebSocket Calls:** wss://crm.windevs.uz/ws/calls/
- **WebSocket Chat:** wss://crm.windevs.uz/ws/chat/

---

## 💡 Useful Tips

### Автоматический деплой через Git

```bash
# Настройте Git hook для автоматического деплоя
cd /opt/crm-frontend
cat > .git/hooks/post-receive << 'EOF'
#!/bin/bash
cd /opt/crm-frontend
./deploy.sh production
EOF
chmod +x .git/hooks/post-receive
```

### Мониторинг в реальном времени

```bash
# Терминал 1: Логи приложения
docker-compose logs -f frontend

# Терминал 2: Логи nginx
tail -f logs/nginx/windevs.uz.access.log

# Терминал 3: Системные метрики
docker stats
```

### Автоматический backup

```bash
# Добавить в crontab (backup каждый день в 3:00)
(crontab -l 2>/dev/null; echo "0 3 * * * cd /opt/crm-frontend && ./scripts/backup.sh") | crontab -
```

---

## 🆘 SOS: Если что-то пошло не так

```bash
# 1. Остановить всё
docker-compose down

# 2. Очистить всё
docker system prune -a --volumes

# 3. Пересобрать с нуля
docker-compose build --no-cache frontend

# 4. Запустить заново
docker-compose up -d frontend

# 5. Проверить логи
docker-compose logs -f frontend
```

---

## 📞 Нужна помощь?

1. Проверьте полную документацию: `DEPLOYMENT.md`
2. Запустите health check: `./scripts/health-check.sh`
3. Проверьте логи: `docker-compose logs -f`
4. Создайте issue в репозитории

---

**🎉 Поздравляем! Ваш CRM фронтенд в production!**
