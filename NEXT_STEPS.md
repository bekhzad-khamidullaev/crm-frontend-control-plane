# 🎯 Next Steps - Ready to Deploy

## ✅ Что уже готово

Все файлы конфигурации для production деплоя созданы и настроены:

### Конфигурационные файлы
- ✅ `.env.production` - Production environment variables
- ✅ `.env.staging` - Staging environment variables
- ✅ `vite.config.js` - Оптимизированная конфигурация сборки
- ✅ `nginx.conf` - Nginx конфигурация для SPA и API proxy
- ✅ `Dockerfile` - Multi-stage Docker build
- ✅ `docker-compose.yml` - Orchestration для production и staging
- ✅ `.dockerignore` - Оптимизация Docker build

### Deployment скрипты
- ✅ `deploy.sh` - Автоматический деплой (production/staging/local)
- ✅ `scripts/setup-server.sh` - Первоначальная настройка сервера
- ✅ `scripts/health-check.sh` - Мониторинг здоровья сервисов
- ✅ `scripts/backup.sh` - Автоматический backup

### CI/CD
- ✅ `.github/workflows/ci.yml` - GitHub Actions pipeline
- ✅ Автоматический деплой при push в main/master

### Документация
- ✅ `DEPLOYMENT.md` - Полное руководство по деплою
- ✅ `QUICK_START.md` - Быстрый старт (15 минут)
- ✅ `DEPLOYMENT_CHECKLIST.md` - Чеклист для деплоя
- ✅ `README.production.md` - Production overview
- ✅ `Makefile` - Удобные команды

---

## 🚀 Шаги для деплоя (выполните локально)

### 1. Установите недостающие зависимости

```bash
npm install --save-dev rollup-plugin-visualizer vite-plugin-compression @vitest/coverage-v8
```

### 2. Обновите SIP credentials в `.env.production`

Откройте `.env.production` и установите реальные значения:

```bash
VITE_SIP_USERNAME=<ваш-sip-username>
VITE_SIP_PASSWORD=<ваш-sip-password>
```

### 3. Протестируйте production build локально

```bash
# Запустите production build
npm run build:production

# Проверьте результат
npm run preview:production

# Откройте http://localhost:4173 в браузере
```

### 4. Протестируйте Docker build локально (опционально)

```bash
# Соберите Docker образ
docker-compose build frontend

# Запустите контейнер
docker-compose up -d frontend

# Проверьте health
curl http://localhost/health

# Проверьте в браузере
# http://localhost

# Остановите
docker-compose down
```

---

## 🖥️ Подготовка сервера

### Вариант A: Автоматическая настройка (рекомендуется)

```bash
# 1. Подключитесь к серверу
ssh root@your-server-ip

# 2. Клонируйте репозиторий
git clone <your-repo-url> /opt/crm-frontend
cd /opt/crm-frontend

# 3. Запустите setup скрипт
sudo ./scripts/setup-server.sh

# Скрипт установит:
# - Docker и Docker Compose
# - Nginx
# - Certbot для SSL
# - UFW (firewall)
# - Fail2ban
```

### Вариант B: Ручная настройка

См. подробные инструкции в `DEPLOYMENT.md`

---

## 🔐 Получение SSL сертификатов

### Требования перед получением SSL

1. **DNS должен быть настроен:**
   ```bash
   # Проверьте DNS
   dig windevs.uz
   dig www.windevs.uz
   ```

2. **Порты 80 и 443 должны быть открыты:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

### Получение сертификатов

```bash
# На сервере
sudo certbot --nginx -d windevs.uz -d www.windevs.uz

# Для staging (опционально)
sudo certbot --nginx -d staging.windevs.uz
```

Certbot автоматически:
- Получит сертификаты от Let's Encrypt
- Настроит nginx
- Настроит автообновление (через cron)

---

## 🎯 Деплой на production

### Метод 1: Deployment Script (рекомендуется)

```bash
# На сервере
cd /opt/crm-frontend

# Первый деплой
./deploy.sh production

# Скрипт автоматически:
# 1. Pull последних изменений из Git
# 2. Соберёт Docker образ
# 3. Остановит старые контейнеры
# 4. Запустит новые контейнеры
# 5. Проверит health status
```

### Метод 2: Docker Compose

```bash
# На сервере
cd /opt/crm-frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Метод 3: CI/CD (автоматический)

1. Настройте GitHub Secrets:
   - `PRODUCTION_HOST`
   - `PRODUCTION_USER`
   - `PRODUCTION_SSH_KEY`

2. Push в main ветку:
   ```bash
   git push origin main
   ```

3. GitHub Actions автоматически задеплоит на production

---

## ✅ Проверка после деплоя

### Автоматическая проверка

```bash
# На сервере
./scripts/health-check.sh
```

### Ручная проверка

1. **Frontend доступен:**
   ```bash
   curl -I https://windevs.uz
   # Должен вернуть 200 OK
   ```

2. **Health endpoint работает:**
   ```bash
   curl https://windevs.uz/health
   # Должен вернуть "healthy"
   ```

3. **API backend доступен:**
   ```bash
   curl https://crm.windevs.uz/api/
   ```

4. **Откройте в браузере:**
   - https://windevs.uz
   - Проверьте консоль на ошибки
   - Проверьте Network tab (API запросы)
   - Попробуйте залогиниться

### Просмотр логов

```bash
# Application logs
docker-compose logs -f frontend

# Nginx logs
tail -f logs/nginx/windevs.uz.access.log
tail -f logs/nginx/windevs.uz.error.log
```

---

## 🔧 Настройка мониторинга и backup

### Автоматический health check

```bash
# Добавьте в crontab
crontab -e

# Добавьте строку (проверка каждые 5 минут)
*/5 * * * * cd /opt/crm-frontend && ./scripts/health-check.sh >> /var/log/crm-health.log 2>&1
```

### Автоматический backup

```bash
# Добавьте в crontab
crontab -e

# Добавьте строку (backup каждый день в 3:00)
0 3 * * * cd /opt/crm-frontend && ./scripts/backup.sh >> /var/log/crm-backup.log 2>&1
```

---

## 🐛 Troubleshooting

### Контейнер не стартует

```bash
# Посмотрите логи
docker-compose logs frontend

# Пересоберите образ
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### 502 Bad Gateway

Причины:
1. Backend (crm.windevs.uz) недоступен
2. Неправильная nginx конфигурация
3. CORS не настроен на backend

```bash
# Проверьте backend
curl https://crm.windevs.uz/api/

# Проверьте nginx конфигурацию
docker-compose exec frontend nginx -t
```

### SSL проблемы

```bash
# Проверьте сертификаты
sudo certbot certificates

# Обновите сертификаты
sudo certbot renew

# Перезапустите nginx
sudo systemctl restart nginx
```

---

## 📋 Финальный чеклист

Перед переходом в production убедитесь:

- [ ] Все npm зависимости установлены
- [ ] Production build успешен (npm run build:production)
- [ ] SIP credentials установлены в .env.production
- [ ] DNS настроен (windevs.uz → IP сервера)
- [ ] Сервер настроен (Docker, nginx установлены)
- [ ] SSL сертификаты получены
- [ ] Backend API доступен (crm.windevs.uz)
- [ ] PBX сервер доступен (pbx.windevs.uz)
- [ ] Firewall настроен (порты 80, 443, 5060, 5061)
- [ ] GitHub Secrets настроены (для CI/CD)

---

## 📞 Нужна помощь?

1. **Полная документация:** `DEPLOYMENT.md`
2. **Быстрый старт:** `QUICK_START.md`
3. **Чеклист:** `DEPLOYMENT_CHECKLIST.md`
4. **Troubleshooting:** `DEPLOYMENT.md#troubleshooting`

---

## 🎉 Всё готово!

Ваш CRM frontend полностью настроен для production деплоя.

**Следующий шаг:**
1. Выполните шаги из раздела "Шаги для деплоя"
2. Настройте сервер
3. Запустите `./deploy.sh production`
4. Наслаждайтесь! 🚀

**Production URL:** https://windevs.uz
