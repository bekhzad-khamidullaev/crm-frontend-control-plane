# 🚀 Django WebSocket Backend - Шпаргалка

Быстрый справочник по командам и настройке.

---

## 📦 Установка (5 минут)

```bash
# 1. Создать проект
django-admin startproject crm_backend && cd crm_backend
python manage.py startapp chat
python manage.py startapp calls

# 2. Установить зависимости
pip install -r backend_examples/requirements.txt

# 3. Настроить Redis
redis-server  # или docker run -d -p 6379:6379 redis:alpine

# 4. Миграции
python manage.py makemigrations chat calls
python manage.py migrate
python manage.py createsuperuser

# 5. Запуск
daphne -b 0.0.0.0 -p 8000 crm_backend.asgi:application
```

---

## 🔧 Команды разработки

```bash
# Запуск dev сервера
daphne -p 8000 crm_backend.asgi:application

# Миграции
python manage.py makemigrations
python manage.py migrate

# Создать суперпользователя
python manage.py createsuperuser

# Django shell
python manage.py shell

# Проверка конфигурации
python manage.py check

# Собрать статику
python manage.py collectstatic --noinput

# Очистить базу
python manage.py flush
```

---

## 🧪 Тестирование

```bash
# Получить JWT токен
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "pass"}'

# Создать сообщение
curl -X POST http://localhost:8000/api/chat-messages/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "content_type": "contact", "object_id": 1}'

# Список сообщений
curl http://localhost:8000/api/chat-messages/ \
  -H "Authorization: Bearer TOKEN"

# Тест WebSocket
npm install -g wscat
wscat -c "ws://localhost:8000/ws/chat/?token=TOKEN"
```

---

## 🗄️ Redis команды

```bash
# Запуск
redis-server

# Проверка
redis-cli ping  # => PONG

# Мониторинг
redis-cli monitor

# Очистка
redis-cli FLUSHALL

# Информация
redis-cli INFO

# Остановка
redis-cli SHUTDOWN
```

---

## 📊 API Endpoints

### Auth
```
POST /api/token/          # Login
POST /api/token/refresh/  # Refresh
POST /api/token/verify/   # Verify
```

### Chat
```
GET    /api/chat-messages/
POST   /api/chat-messages/
GET    /api/chat-messages/{id}/
PATCH  /api/chat-messages/{id}/
DELETE /api/chat-messages/{id}/
POST   /api/chat-messages/{id}/mark_read/
POST   /api/chat-messages/bulk_mark_read/
GET    /api/chat-messages/unread_count/
GET    /api/chat-messages/statistics/
```

### Calls
```
GET    /api/calls/
POST   /api/calls/
GET    /api/calls/{id}/
PATCH  /api/calls/{id}/
DELETE /api/calls/{id}/
POST   /api/calls/{id}/start/
POST   /api/calls/{id}/end/
POST   /api/calls/{id}/add_note/
GET    /api/calls/statistics/
GET    /api/calls/recent/
```

### WebSocket
```
ws://localhost:8000/ws/chat/?token=JWT
ws://localhost:8000/ws/calls/?token=JWT
```

---

## 🔌 WebSocket сообщения

### Chat - от клиента к серверу
```json
{"type": "typing_started", "entity_type": "contact", "entity_id": 1}
{"type": "typing_stopped", "entity_type": "contact", "entity_id": 1}
{"type": "pong"}
```

### Chat - от сервера к клиенту
```json
{"type": "connection_established", "user_id": 1, "username": "admin"}
{"type": "new_message", "payload": {...}}
{"type": "message_updated", "payload": {...}}
{"type": "message_deleted", "payload": {"id": 123}}
{"type": "typing_started", "payload": {...}}
{"type": "typing_stopped", "payload": {...}}
{"type": "ping"}
```

### Calls - от сервера к клиенту
```json
{"type": "incoming_call", "payload": {...}}
{"type": "call_started", "payload": {...}}
{"type": "call_ended", "payload": {...}}
{"type": "call_status_changed", "payload": {...}}
{"type": "call_missed", "payload": {...}}
```

---

## 🐛 Troubleshooting

### WebSocket не работает
```bash
ps aux | grep daphne  # Проверить процесс
redis-cli ping        # Проверить Redis
tail -f debug.log     # Проверить логи
```

### CORS ошибка
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### Миграции не применяются
```bash
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
python manage.py makemigrations
python manage.py migrate
```

### Redis не подключается
```bash
# Использовать InMemory для dev
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}
```

---

## 🔐 JWT токены

```python
# Django shell
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()
token = AccessToken.for_user(user)
print(str(token))
```

```javascript
// Frontend
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);
```

---

## 📝 Полезные запросы

### Создать тестовые данные
```python
# Django shell
from chat.models import ChatMessage
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType

User = get_user_model()
user = User.objects.first()
ct = ContentType.objects.get(model='contact')

ChatMessage.objects.create(
    message="Test message",
    sender=user,
    content_type=ct,
    object_id=1
)
```

### Проверить WebSocket в Python
```python
import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8000/ws/chat/?token=YOUR_TOKEN"
    async with websockets.connect(uri) as ws:
        # Получить приветствие
        response = await ws.recv()
        print(response)
        
        # Отправить typing
        await ws.send(json.dumps({
            "type": "typing_started",
            "entity_type": "contact",
            "entity_id": 1
        }))
        
        # Получить ответ
        response = await ws.recv()
        print(response)

asyncio.run(test())
```

---

## 🚀 Production команды

```bash
# Gunicorn для HTTP
gunicorn crm_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4

# Daphne для WebSocket
daphne -b 0.0.0.0 -p 8001 \
    crm_backend.asgi:application

# Systemd service
sudo systemctl start django-http
sudo systemctl start django-websocket
sudo systemctl status django-http
sudo systemctl status django-websocket

# Просмотр логов
sudo journalctl -u django-http -f
sudo journalctl -u django-websocket -f

# Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📦 Docker команды

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Execute command
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## 🔍 Мониторинг

```bash
# Просмотр процессов
ps aux | grep daphne
ps aux | grep gunicorn

# Просмотр портов
sudo netstat -tulpn | grep 8000
sudo lsof -i :8000

# Просмотр логов
tail -f debug.log
tail -f /var/log/nginx/error.log

# Redis мониторинг
redis-cli INFO stats
redis-cli CLIENT LIST

# Django queries
python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)
```

---

## 🎯 Переменные окружения

```bash
# Backend .env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.com
```

```bash
# Frontend .env
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_WS_URL=ws://localhost:8000/ws/chat/
VITE_WS_URL=ws://localhost:8000/ws/calls/
```

---

## 📚 Быстрые ссылки

- [DJANGO-WEBSOCKET-SETUP.md](../DJANGO-WEBSOCKET-SETUP.md) - Полная документация
- [BACKEND-SETUP-QUICK-START.md](../BACKEND-SETUP-QUICK-START.md) - Быстрый старт
- [README.md](README.md) - Подробное руководство
- [deployment_guide.md](deployment_guide.md) - Деплой
- [BACKEND-FILES-SUMMARY.md](../BACKEND-FILES-SUMMARY.md) - Список файлов

---

## ✅ Чеклист перед запуском

- [ ] Python 3.11+ установлен
- [ ] Redis запущен (redis-cli ping)
- [ ] Виртуальное окружение создано
- [ ] Зависимости установлены (pip install -r requirements.txt)
- [ ] Файлы скопированы из backend_examples/
- [ ] settings.py обновлен (CORS, Channels, JWT)
- [ ] asgi.py настроен
- [ ] Миграции применены (migrate)
- [ ] Superuser создан
- [ ] Daphne запущен (не runserver!)
- [ ] JWT токен получен и работает
- [ ] WebSocket подключается (wscat)
- [ ] Frontend .env обновлен

---

## 🎉 Готово!

```bash
# Запуск одной командой (dev)
daphne -p 8000 crm_backend.asgi:application

# Открыть в браузере
http://localhost:8000/admin/

# Проверить API
curl http://localhost:8000/api/token/

# Проверить WebSocket
wscat -c "ws://localhost:8000/ws/chat/?token=TOKEN"
```

**Все работает? Отлично! 🚀**
