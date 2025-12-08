# Django WebSocket Deployment Guide

Руководство по развертыванию Django приложения с WebSocket поддержкой.

## 📋 Содержание

1. [Development Setup](#development-setup)
2. [Redis Setup](#redis-setup)
3. [Production Deployment](#production-deployment)
4. [Nginx Configuration](#nginx-configuration)
5. [Supervisor/Systemd](#supervisorsystemd)
6. [Docker Deployment](#docker-deployment)

---

## 1. Development Setup

### Шаг 1: Установка зависимостей

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### Шаг 2: Миграции базы данных

```bash
# Create migrations
python manage.py makemigrations chat calls

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Шаг 3: Запуск Redis

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
redis-server

# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Шаг 4: Запуск Development Server

```bash
# Run with Daphne (ASGI server)
daphne -b 0.0.0.0 -p 8000 your_project.asgi:application

# Or use Django's development server (for HTTP only)
python manage.py runserver
```

### Шаг 5: Тестирование WebSocket

```bash
# Install wscat for testing
npm install -g wscat

# Test chat WebSocket
wscat -c "ws://localhost:8000/ws/chat/?token=YOUR_JWT_TOKEN"

# Test calls WebSocket
wscat -c "ws://localhost:8000/ws/calls/?token=YOUR_JWT_TOKEN"
```

---

## 2. Redis Setup

### Local Development

```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                 # macOS
# Windows: Download from https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server

# Configure Redis (optional)
sudo nano /etc/redis/redis.conf
```

### Redis with Docker

```bash
# Run Redis in Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Check logs
docker logs redis

# Connect to Redis CLI
docker exec -it redis redis-cli
```

### Redis Configuration in Django

```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
            # With password:
            # "hosts": [('redis://:password@localhost:6379/0')],
        },
    },
}
```

---

## 3. Production Deployment

### Using Gunicorn + Daphne

```bash
# Install production dependencies
pip install gunicorn daphne

# Run HTTP workers with Gunicorn
gunicorn your_project.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120

# Run WebSocket workers with Daphne
daphne -b 0.0.0.0 -p 8001 \
    your_project.asgi:application
```

### Environment Variables

```bash
# Create .env file
cat > .env << EOF
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=https://your-frontend.com
EOF
```

### Static Files

```bash
# Collect static files
python manage.py collectstatic --noinput

# Configure static files serving (settings.py)
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

---

## 4. Nginx Configuration

### HTTP + WebSocket Proxy

```nginx
# /etc/nginx/sites-available/your-project

upstream django_http {
    server 127.0.0.1:8000;
}

upstream django_websocket {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Static files
    location /static/ {
        alias /path/to/your/project/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /path/to/your/project/media/;
        expires 7d;
    }
    
    # WebSocket endpoints
    location /ws/ {
        proxy_pass http://django_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # HTTP API endpoints
    location /api/ {
        proxy_pass http://django_http;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin
    location /admin/ {
        proxy_pass http://django_http;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend (optional - if serving React from Nginx)
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

### Enable site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/your-project /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 5. Supervisor/Systemd

### Systemd Service Files

#### Django HTTP Service

```ini
# /etc/systemd/system/django-http.service

[Unit]
Description=Django HTTP Service
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/path/to/your/project
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn \
    --workers 4 \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    your_project.wsgi:application

[Install]
WantedBy=multi-user.target
```

#### Django WebSocket Service

```ini
# /etc/systemd/system/django-websocket.service

[Unit]
Description=Django WebSocket Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/path/to/your/project
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/daphne \
    -b 0.0.0.0 \
    -p 8001 \
    your_project.asgi:application

[Install]
WantedBy=multi-user.target
```

#### Enable and start services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable django-http django-websocket

# Start services
sudo systemctl start django-http django-websocket

# Check status
sudo systemctl status django-http
sudo systemctl status django-websocket

# View logs
sudo journalctl -u django-http -f
sudo journalctl -u django-websocket -f
```

---

## 6. Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations
RUN python manage.py migrate

EXPOSE 8000

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "your_project.asgi:application"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: crm_db
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: crm_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build: .
    command: daphne -b 0.0.0.0 -p 8000 your_project.asgi:application
    volumes:
      - .:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://crm_user:crm_password@db:5432/crm_db
      - REDIS_URL=redis://redis:6379/0

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:
```

### Deploy with Docker

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Stop services
docker-compose down
```

---

## 🔍 Troubleshooting

### WebSocket не подключается

1. Проверьте, что Daphne запущен:
   ```bash
   ps aux | grep daphne
   ```

2. Проверьте Redis:
   ```bash
   redis-cli ping
   ```

3. Проверьте логи:
   ```bash
   tail -f debug.log
   ```

### CORS ошибки

Убедитесь, что frontend URL добавлен в `CORS_ALLOWED_ORIGINS`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend.com",
]
```

### JWT токен не работает

Проверьте настройки JWT:

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

---

## 📚 Полезные команды

```bash
# Check Django configuration
python manage.py check

# Test WebSocket locally
python manage.py shell
>>> from channels.layers import get_channel_layer
>>> channel_layer = get_channel_layer()
>>> from asgiref.sync import async_to_sync
>>> async_to_sync(channel_layer.send)('test_channel', {'type': 'test.message'})

# Monitor Redis
redis-cli monitor

# Clear Redis cache
redis-cli FLUSHALL
```

---

## 🎉 Готово!

Ваш Django backend с WebSocket теперь настроен и готов к работе!
