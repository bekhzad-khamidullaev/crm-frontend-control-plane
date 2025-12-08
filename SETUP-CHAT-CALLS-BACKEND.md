# 🚀 Настройка Chat и Calls Backend - Быстрое руководство

## 📋 Что нужно сделать

Настроить backend endpoints для Chat и Calls модулей.

---

## ✅ Шаг 1: Создайте Django приложения

```bash
# В директории вашего Django проекта
python manage.py startapp chat
python manage.py startapp calls
```

---

## ✅ Шаг 2: Скопируйте файлы

### Chat приложение:

```bash
# Скопируйте файлы из backend_examples в chat/
cp backend_examples/chat_models.py chat/models.py
cp backend_examples/chat_serializers.py chat/serializers.py
cp backend_examples/chat_views.py chat/views.py
cp backend_examples/chat_urls.py chat/urls.py

# Если нужен WebSocket:
cp backend_examples/chat_consumers.py chat/consumers.py
cp backend_examples/chat_routing.py chat/routing.py
```

### Calls приложение:

```bash
# Скопируйте файлы из backend_examples в calls/
cp backend_examples/calls_models.py calls/models.py
cp backend_examples/calls_serializers.py calls/serializers.py
cp backend_examples/calls_views.py calls/views.py
cp backend_examples/calls_urls.py calls/urls.py

# Если нужен WebSocket:
cp backend_examples/calls_consumers.py calls/consumers.py
cp backend_examples/calls_routing.py calls/routing.py
```

---

## ✅ Шаг 3: Обновите settings.py

Добавьте в `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ... существующие приложения
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'chat',
    'calls',
]
```

---

## ✅ Шаг 4: Обновите urls.py

Добавьте в главный `urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... существующие URLs
    
    # Chat and Calls API
    path('api/', include('chat.urls')),
    path('api/', include('calls.urls')),
]
```

---

## ✅ Шаг 5: Создайте миграции

```bash
python manage.py makemigrations chat calls
python manage.py migrate
```

---

## ✅ Шаг 6: Перезапустите Django

```bash
python manage.py runserver
```

---

## 🧪 Проверка

### 1. Проверьте Chat endpoints:

```bash
# Получите токен
TOKEN="your_jwt_token_here"

# Создайте сообщение
curl -X POST http://localhost:8000/api/chat-messages/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "content_type": "contact",
    "object_id": 1
  }'

# Получите список сообщений
curl http://localhost:8000/api/chat-messages/ \
  -H "Authorization: Bearer $TOKEN"

# Статистика
curl http://localhost:8000/api/chat-messages/statistics/ \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Проверьте Calls endpoints:

```bash
# Создайте звонок
curl -X POST http://localhost:8000/api/calls/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "call_type": "incoming",
    "phone_number": "+1234567890",
    "content_type": "contact",
    "object_id": 1
  }'

# Получите список звонков
curl http://localhost:8000/api/calls/ \
  -H "Authorization: Bearer $TOKEN"

# Статистика
curl http://localhost:8000/api/calls/statistics/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Готово!

После этого:
- ✅ Chat модуль заработает
- ✅ Calls модуль заработает
- ✅ Ошибки 404 исчезнут

---

## 📚 Дополнительно: WebSocket (опционально)

Если хотите real-time обновления, см. **DJANGO-WEBSOCKET-SETUP.md**

---

## 🔍 Troubleshooting

### Ошибка: "No module named 'chat'"

Убедитесь что:
1. Создали приложения: `python manage.py startapp chat`
2. Добавили в `INSTALLED_APPS`
3. Скопировали файлы

### Ошибка: "relation chat_chatmessage does not exist"

Выполните миграции:
```bash
python manage.py makemigrations chat calls
python manage.py migrate
```

### Ошибка 404 на endpoints

Проверьте `urls.py`:
```python
path('api/', include('chat.urls')),
path('api/', include('calls.urls')),
```

---

**Готово! Давайте настроим!** 🚀
