# ⚡ Быстрая настройка Chat и Calls - 5 минут

## 🎯 Самый быстрый способ

### Вариант 1: Автоматический (рекомендуется)

```bash
# В корне Django проекта
cd /path/to/your/django/project

# Скопируйте скрипт (из workspace)
# И запустите:
bash quick-chat-setup.sh
```

Скрипт автоматически:
- ✅ Создаст приложения chat и calls
- ✅ Скопирует все файлы
- ✅ Создаст миграции
- ✅ Применит миграции

---

### Вариант 2: Ручная установка (5 команд)

```bash
# 1. Создайте приложения
python manage.py startapp chat
python manage.py startapp calls

# 2. Скопируйте файлы (замените PATH на путь к frontend workspace)
cp PATH/backend_examples/chat_*.py chat/
cp PATH/backend_examples/calls_*.py calls/

# 3. Миграции
python manage.py makemigrations chat calls
python manage.py migrate
```

---

## ✅ Обновите конфигурацию

### 1. `settings.py` - добавьте в INSTALLED_APPS:

```python
INSTALLED_APPS = [
    # ... существующие
    'chat',
    'calls',
]
```

### 2. `urls.py` - добавьте endpoints:

```python
urlpatterns = [
    # ... существующие
    path('api/', include('chat.urls')),
    path('api/', include('calls.urls')),
]
```

### 3. Перезапустите Django:

```bash
python manage.py runserver
```

---

## 🧪 Проверка

### 1. Проверьте endpoints доступны:

```bash
# Получите токен (используйте свои credentials)
TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])")

# Проверьте chat
curl http://localhost:8000/api/chat-messages/ \
  -H "Authorization: Bearer $TOKEN"

# Должно вернуть: {"count":0,"next":null,"previous":null,"results":[]}
```

### 2. Создайте тестовое сообщение:

```bash
curl -X POST http://localhost:8000/api/chat-messages/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "content_type": "contact",
    "object_id": 1
  }'
```

---

## 🎉 Готово!

После этого:
- ✅ Chat страница заработает
- ✅ Calls страница заработает
- ✅ Ошибки 404 исчезнут
- ✅ Можно создавать сообщения и звонки

---

## 📋 Структура файлов

После установки у вас будет:

```
your_django_project/
├── chat/
│   ├── __init__.py
│   ├── models.py          (из chat_models.py)
│   ├── serializers.py     (из chat_serializers.py)
│   ├── views.py           (из chat_views.py)
│   ├── urls.py            (из chat_urls.py)
│   ├── admin.py
│   └── migrations/
├── calls/
│   ├── __init__.py
│   ├── models.py          (из calls_models.py)
│   ├── serializers.py     (из calls_serializers.py)
│   ├── views.py           (из calls_views.py)
│   ├── urls.py            (из calls_urls.py)
│   ├── admin.py
│   └── migrations/
```

---

## 🔍 Troubleshooting

### Ошибка: "No such file or directory"

Укажите полный путь к backend_examples:
```bash
cp /full/path/to/workspace/backend_examples/chat_*.py chat/
```

### Ошибка: "No module named 'chat'"

1. Добавьте в INSTALLED_APPS
2. Перезапустите Django

### Ошибка 404 на endpoints

Проверьте urls.py:
```python
path('api/', include('chat.urls')),
path('api/', include('calls.urls')),
```

### Ошибка миграций

```bash
# Очистите и создайте заново
rm -rf chat/migrations/ calls/migrations/
python manage.py makemigrations chat calls
python manage.py migrate
```

---

## 💡 Дополнительно: Admin панель

Если хотите управлять через Django Admin:

```bash
# Скопируйте admin.py
cp backend_examples/admin.py chat/admin.py
cp backend_examples/admin.py calls/admin.py
```

Или добавьте вручную в `chat/admin.py`:

```python
from django.contrib import admin
from .models import ChatMessage, ChatAttachment

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'message', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['message', 'sender__username']

@admin.register(ChatAttachment)
class ChatAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'file_name', 'uploaded_at']
```

---

## 🚀 Следующие шаги

После базовой настройки можно:

1. **Добавить WebSocket** для real-time обновлений
   - См. DJANGO-WEBSOCKET-SETUP.md

2. **Настроить уведомления**
   - Email уведомления о новых сообщениях
   - Push уведомления

3. **Расширить функциональность**
   - Группы чатов
   - Видео/аудио звонки
   - Отправка файлов

---

**Начинайте! Это займет всего 5 минут!** 🎉
