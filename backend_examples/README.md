# Django Backend Examples для CRM WebSocket

Эта папка содержит все необходимые файлы для настройки Django backend с WebSocket поддержкой.

## 📁 Структура файлов

### Chat модуль
- `chat_models.py` - модели для чатов (ChatMessage, ChatAttachment)
- `chat_consumers.py` - WebSocket consumer для real-time чатов
- `chat_serializers.py` - DRF сериализаторы для API
- `chat_views.py` - REST API views
- `chat_urls.py` - URL routing
- `chat_routing.py` - WebSocket routing

### Calls модуль
- `calls_models.py` - модели для звонков (Call, CallNote)
- `calls_consumers.py` - WebSocket consumer для уведомлений о звонках
- `calls_serializers.py` - DRF сериализаторы для API
- `calls_views.py` - REST API views
- `calls_urls.py` - URL routing
- `calls_routing.py` - WebSocket routing

### Конфигурация проекта
- `settings.py` - Django settings с Channels и CORS
- `asgi.py` - ASGI конфигурация для WebSocket
- `urls.py` - главный URL routing
- `authentication.py` - JWT аутентификация для WebSocket
- `admin.py` - Django Admin конфигурация

### Дополнительно
- `requirements.txt` - Python зависимости
- `deployment_guide.md` - полное руководство по деплою
- `README.md` - этот файл

## 🚀 Быстрая установка

### 1. Создайте Django проект (если еще нет)

```bash
django-admin startproject your_project
cd your_project
```

### 2. Создайте приложения

```bash
python manage.py startapp chat
python manage.py startapp calls
```

### 3. Скопируйте файлы

```bash
# Chat app
cp backend_examples/chat_models.py chat/models.py
cp backend_examples/chat_consumers.py chat/consumers.py
cp backend_examples/chat_serializers.py chat/serializers.py
cp backend_examples/chat_views.py chat/views.py
cp backend_examples/chat_urls.py chat/urls.py
cp backend_examples/chat_routing.py chat/routing.py

# Calls app
cp backend_examples/calls_models.py calls/models.py
cp backend_examples/calls_consumers.py calls/consumers.py
cp backend_examples/calls_serializers.py calls/serializers.py
cp backend_examples/calls_views.py calls/views.py
cp backend_examples/calls_urls.py calls/urls.py
cp backend_examples/calls_routing.py calls/routing.py

# Project config
cp backend_examples/authentication.py your_project/authentication.py
cp backend_examples/asgi.py your_project/asgi.py

# Copy admin.py to both apps
head -50 backend_examples/admin.py > chat/admin.py
tail -50 backend_examples/admin.py > calls/admin.py
```

### 4. Обновите settings.py

Добавьте настройки из `backend_examples/settings.py` в ваш `your_project/settings.py`:

```python
# Добавьте в INSTALLED_APPS
'rest_framework',
'rest_framework_simplejwt',
'corsheaders',
'channels',
'chat',
'calls',

# Добавьте остальные настройки (см. settings.py)
```

### 5. Обновите urls.py

Добавьте в `your_project/urls.py`:

```python
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('chat.urls')),
    path('api/', include('calls.urls')),
]
```

### 6. Установите зависимости

```bash
pip install -r backend_examples/requirements.txt
```

### 7. Запустите Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 8. Миграции

```bash
python manage.py makemigrations chat calls
python manage.py migrate
python manage.py createsuperuser
```

### 9. Запуск

```bash
# Для разработки (HTTP + WebSocket)
daphne -b 0.0.0.0 -p 8000 your_project.asgi:application

# Для production см. deployment_guide.md
```

## 🔍 Тестирование

### 1. REST API

```bash
# Получить JWT токен
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Создать сообщение
curl -X POST http://localhost:8000/api/chat-messages/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Test message",
    "content_type": "contact",
    "object_id": 1
  }'

# Получить список сообщений
curl http://localhost:8000/api/chat-messages/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. WebSocket

```bash
# Установите wscat
npm install -g wscat

# Подключитесь к чатам
wscat -c "ws://localhost:8000/ws/chat/?token=YOUR_JWT_TOKEN"

# Отправьте typing indicator
{"type": "typing_started", "entity_type": "contact", "entity_id": 1}

# Подключитесь к звонкам
wscat -c "ws://localhost:8000/ws/calls/?token=YOUR_JWT_TOKEN"
```

## 📊 API Endpoints

### Chat API

```
GET    /api/chat-messages/                 # Список
POST   /api/chat-messages/                 # Создать
GET    /api/chat-messages/{id}/            # Детали
PATCH  /api/chat-messages/{id}/            # Обновить
DELETE /api/chat-messages/{id}/            # Удалить
POST   /api/chat-messages/{id}/mark_read/  # Отметить прочитанным
POST   /api/chat-messages/bulk_mark_read/  # Массовая отметка
GET    /api/chat-messages/unread_count/    # Счетчик непрочитанных
GET    /api/chat-messages/statistics/      # Статистика
```

### Calls API

```
GET    /api/calls/                         # Список
POST   /api/calls/                         # Создать
GET    /api/calls/{id}/                    # Детали
PATCH  /api/calls/{id}/                    # Обновить
DELETE /api/calls/{id}/                    # Удалить
POST   /api/calls/{id}/start/              # Начать
POST   /api/calls/{id}/end/                # Завершить
POST   /api/calls/{id}/add_note/           # Добавить заметку
GET    /api/calls/statistics/              # Статистика
GET    /api/calls/recent/                  # Последние
```

### WebSocket

```
ws://localhost:8000/ws/chat/?token=JWT_TOKEN
ws://localhost:8000/ws/calls/?token=JWT_TOKEN
```

## 🔧 Интеграция с фронтендом

Фронтенд уже готов к работе! Просто обновите `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_WS_URL=ws://localhost:8000/ws/chat/
VITE_WS_URL=ws://localhost:8000/ws/calls/
```

WebSocket клиенты уже реализованы:
- `src/lib/websocket/ChatWebSocket.js`
- `src/lib/websocket/CallsWebSocket.js`

## 📚 Документация

- [DJANGO-WEBSOCKET-SETUP.md](../DJANGO-WEBSOCKET-SETUP.md) - основная документация
- [deployment_guide.md](deployment_guide.md) - руководство по деплою
- [CHAT-INTEGRATION.md](../CHAT-INTEGRATION.md) - фронтенд интеграция

## 🐛 Troubleshooting

### WebSocket не подключается

1. Проверьте Redis: `redis-cli ping`
2. Проверьте Daphne: `ps aux | grep daphne`
3. Проверьте токен: убедитесь, что передаете валидный JWT

### CORS ошибки

Добавьте frontend URL в `CORS_ALLOWED_ORIGINS` в settings.py

### Миграции не применяются

```bash
# Удалите старые миграции
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# Создайте заново
python manage.py makemigrations
python manage.py migrate
```

## 💡 Советы

1. **Development:** Используйте `InMemoryChannelLayer` если не хотите устанавливать Redis
2. **Production:** Обязательно используйте Redis для channel layer
3. **Security:** Не забудьте настроить SSL для WebSocket в production (wss://)
4. **Monitoring:** Добавьте логирование для отслеживания WebSocket подключений
5. **Testing:** Используйте `pytest` и `pytest-asyncio` для тестирования consumers

## 🎉 Готово!

Теперь у вас есть полностью рабочий Django backend с WebSocket!

Запустите:
```bash
daphne -p 8000 your_project.asgi:application
```

И ваш фронтенд сможет подключиться к WebSocket для real-time чатов и звонков!
