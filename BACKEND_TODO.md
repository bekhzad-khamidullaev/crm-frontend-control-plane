# 🔧 TODO: Что нужно реализовать на стороне Django Backend

## 📊 Анализ: Frontend vs Backend API

На основе анализа Django-CRM API.yaml и текущего состояния фронтенда.

---

## ✅ Уже реализовано в Backend (работает)

### Core функционал
- ✅ Authentication (JWT tokens)
- ✅ Users & Profiles
- ✅ Leads (полный CRUD + assign/convert/disqualify)
- ✅ Contacts (полный CRUD)
- ✅ Companies (полный CRUD)
- ✅ Deals (полный CRUD)
- ✅ Tasks (полный CRUD)
- ✅ Projects (полный CRUD + assign/complete/reopen)
- ✅ Analytics & Dashboard
- ✅ Call Logs (полный CRUD)
- ✅ Chat Messages (полный CRUD + replies/thread)
- ✅ VoIP (connections + incoming calls)

### Reference Data (справочники)
- ✅ Stages (этапы сделок)
- ✅ Task Stages (этапы задач)
- ✅ Project Stages (этапы проектов)
- ✅ Lead Sources (источники лидов)
- ✅ Industries (отрасли)
- ✅ Countries (страны)
- ✅ Cities (города)
- ✅ Currencies (валюты + rates)
- ✅ Client Types (типы клиентов)
- ✅ Closing Reasons (причины закрытия)
- ✅ Departments (отделы + members)
- ✅ CRM Tags (теги)
- ✅ Task Tags (теги задач)

### Marketing & Email
- ✅ Marketing Campaigns (кампании)
- ✅ Marketing Segments (сегменты)
- ✅ Marketing Templates (шаблоны)
- ✅ Mass Mail (email accounts, mailings, messages, signatures)
- ✅ CRM Emails (переписка)

### Business Entities
- ✅ Memos (заметки + mark_postponed/mark_reviewed)
- ✅ Reminders (напоминания + upcoming)
- ✅ Payments (платежи + summary)
- ✅ Products (продукты + categories)
- ✅ Shipments (отгрузки)
- ✅ Outputs (расходы)
- ✅ Requests (заявки)

### Misc
- ✅ Help Pages & Paragraphs
- ✅ Export (projects export)
- ✅ Auth Stats

**Итого**: ~200 эндпоинтов полностью работают! 🎉

---

## ❌ НЕ реализовано в Backend (нужно добавить)

### 1. 🚫 SMS Functionality (критично для некоторых CRM)

**Отсутствующие эндпоинты:**
```python
# SMS Provider Settings
GET    /api/sms/provider-config/
PUT    /api/sms/provider-config/
POST   /api/sms/test-connection/

# SMS Operations  
POST   /api/sms/send/
POST   /api/sms/send-bulk/
GET    /api/sms/history/
GET    /api/sms/balance/
GET    /api/sms/stats/

# SMS Templates
GET    /api/sms/templates/
POST   /api/sms/templates/
PUT    /api/sms/templates/{id}/
DELETE /api/sms/templates/{id}/
```

**Что нужно:**
- Django app: `sms` или интеграция в существующий app
- Models: `SMSProvider`, `SMSMessage`, `SMSTemplate`
- Интеграция с SMS провайдерами (Twilio, SMS.ru, Vonage и т.д.)
- Celery tasks для отправки
- Webhook handlers для статусов доставки

**Приоритет**: 🟡 Средний (зависит от требований бизнеса)

---

### 2. 🚫 System Settings & Configuration

**Отсутствующие эндпоинты:**
```python
# General Settings
GET    /api/settings/
PATCH  /api/settings/

# Integration Settings
GET    /api/settings/integrations/{integration}/
PATCH  /api/settings/integrations/{integration}/

# API Keys Management
GET    /api/settings/api-keys/
POST   /api/settings/api-keys/
DELETE /api/settings/api-keys/{id}/

# Webhooks
GET    /api/settings/webhooks/
POST   /api/settings/webhooks/
DELETE /api/settings/webhooks/{id}/
POST   /api/settings/webhooks/{id}/test/

# Security Settings
GET    /api/settings/security/
PATCH  /api/settings/security/

# Integration Logs
GET    /api/settings/integration-logs/
```

**Что нужно:**
- Django app: `settings` или `configuration`
- Models: `SystemSetting`, `APIKey`, `Webhook`, `IntegrationLog`, `SecuritySettings`
- Permissions для admin-only доступа
- Webhook delivery system
- IP whitelist implementation
- Rate limiting configuration

**Приоритет**: 🔴 Высокий (важно для управления системой)

---

### 3. 🚫 User Session Management

**Отсутствующие эндпоинты:**
```python
# Sessions
GET    /api/users/me/sessions/
DELETE /api/users/me/sessions/{id}/
POST   /api/users/me/sessions/revoke-all/
```

**Что нужно:**
- Расширение User model или отдельная таблица `UserSession`
- Tracking IP, device, browser, last activity
- JWT token management (blacklist)
- Session revocation logic

**Приоритет**: 🟡 Средний (security feature)

---

### 4. 🚫 Two-Factor Authentication (2FA)

**Отсутствующие эндпоинты:**
```python
# 2FA Status & Setup
GET  /api/users/me/2fa/status/
POST /api/users/me/2fa/enable/
POST /api/users/me/2fa/disable/
POST /api/users/me/2fa/verify/

# QR Code for TOTP
GET  /api/users/me/2fa/qr-code/

# Backup Codes
GET  /api/users/me/2fa/backup-codes/
POST /api/users/me/2fa/backup-codes/regenerate/
```

**Что нужно:**
- Django package: `django-otp` или `django-two-factor-auth`
- Models: `TwoFactorAuth`, `BackupCode`
- TOTP implementation (Google Authenticator)
- SMS/Email 2FA опционально
- Backup codes generation

**Приоритет**: 🟡 Средний (security feature, не всегда нужен)

---

### 5. 🚫 Security & Audit Log

**Отсутствующие эндпоинты:**
```python
# Security Log
GET /api/users/me/security-log/
GET /api/admin/security-log/  # для админов

# Audit Trail
GET /api/audit/changes/{model}/{id}/
```

**Что нужно:**
- Django app: `audit` или использовать `django-auditlog`
- Models: `SecurityEvent`, `AuditLog`
- Логирование всех важных действий (login, password change, data modifications)
- IP tracking, geolocation
- Alerts для подозрительной активности

**Приоритет**: 🟢 Низкий (nice to have)

---

### 6. 🚫 Password Management Endpoints

**Отсутствующие эндпоинты:**
```python
# Password Change
POST /api/users/me/change-password/

# Password Reset Flow (если нет)
POST /api/auth/password-reset/
POST /api/auth/password-reset/confirm/
```

**Что нужно:**
- Если используется `dj-rest-auth` или `django-allauth` - уже есть
- Если нет - реализовать password reset flow
- Email отправка для reset links
- Token generation и validation

**Приоритет**: 🔴 Высокий (базовая функция)

---

### 7. 🚫 User Avatar Upload (проверить)

**Проверить наличие:**
```python
# Avatar Upload
POST   /api/users/me/avatar/
DELETE /api/users/me/avatar/
```

**Что может потребоваться:**
- File upload handling
- Image resizing (Pillow)
- Storage (local or S3/CDN)
- Cleanup old avatars

**Приоритет**: 🟡 Средний

---

### 8. 🚫 Export для других сущностей (опционально)

**Текущее состояние:**
- ✅ `/api/projects/export/` - работает

**Могут понадобиться:**
```python
GET /api/leads/export/
GET /api/contacts/export/
GET /api/deals/export/
GET /api/tasks/export/
GET /api/companies/export/
GET /api/payments/export/
```

**Что нужно:**
- Копировать логику из projects export
- CSV/XLSX generation
- Фильтры по датам, статусам и т.д.
- Background tasks для больших экспортов (Celery)

**Приоритет**: 🟢 Низкий (удобство)

---

### 9. 🚫 Advanced Search/Filtering (проверить)

**Проверить что есть в API:**
- Global search across entities
- Full-text search
- Advanced filters

**Если нет:**
```python
GET /api/search/?q=query&entities=leads,contacts,companies
GET /api/leads/?search_fields=name,email,phone&advanced_filters=...
```

**Что нужно:**
- Django Elasticsearch (опционально)
- Или PostgreSQL Full-Text Search
- Advanced filtering logic

**Приоритет**: 🟡 Средний

---

### 10. 🚫 Bulk Operations (проверить расширение)

**Что есть:**
- ✅ `/api/leads/bulk_tag/`
- ✅ `/api/projects/bulk_tag/`

**Могут понадобиться:**
```python
POST /api/leads/bulk_delete/
POST /api/leads/bulk_update/
POST /api/contacts/bulk_import/
POST /api/deals/bulk_assign/
```

**Приоритет**: 🟢 Низкий

---

### 11. 🚫 Notifications System (если нет)

**Возможные эндпоинты:**
```python
GET    /api/notifications/
PATCH  /api/notifications/{id}/mark-read/
POST   /api/notifications/mark-all-read/
DELETE /api/notifications/{id}/

# Settings
GET   /api/notifications/settings/
PATCH /api/notifications/settings/
```

**Что нужно:**
- Django app: `notifications`
- Models: `Notification`, `NotificationSettings`
- WebSocket для real-time (Django Channels)
- Email/Push notifications integration

**Приоритет**: 🟡 Средний

---

### 12. 🚫 File Attachments (если нет)

**Проверить наличие:**
```python
# Attachments для разных сущностей
POST   /api/leads/{id}/attachments/
GET    /api/leads/{id}/attachments/
DELETE /api/attachments/{id}/

POST   /api/deals/{id}/attachments/
POST   /api/tasks/{id}/attachments/
```

**Что нужно:**
- Generic Foreign Key для attachments
- File storage (S3/local)
- Virus scanning (опционально)
- File size limits

**Приоритет**: 🟡 Средний

---

## 📋 Сводная таблица приоритетов

| Функционал | Эндпоинтов | Приоритет | Сложность | Время |
|------------|------------|-----------|-----------|-------|
| System Settings | ~15 | 🔴 Высокий | Средняя | 2-3 дня |
| Password Management | ~3 | 🔴 Высокий | Низкая | 1 день |
| SMS Integration | ~12 | 🟡 Средний | Высокая | 3-5 дней |
| Session Management | ~3 | 🟡 Средний | Средняя | 1-2 дня |
| Two-Factor Auth | ~7 | 🟡 Средний | Средняя | 2-3 дня |
| Notifications | ~5 | 🟡 Средний | Средняя | 2-3 дня |
| File Attachments | ~5 | 🟡 Средний | Низкая | 1-2 дня |
| Avatar Upload | ~2 | 🟡 Средний | Низкая | 1 день |
| Security Audit Log | ~3 | 🟢 Низкий | Средняя | 2-3 дня |
| Export Extensions | ~6 | 🟢 Низкий | Низкая | 1-2 дня |
| Bulk Operations | ~5 | 🟢 Низкий | Низкая | 1-2 дня |
| Advanced Search | ~2 | 🟢 Низкий | Высокая | 3-5 дней |

**ИТОГО**: ~68 новых эндпоинтов | **Время**: 3-6 недель разработки

---

## 🎯 Рекомендуемый план реализации

### Фаза 1: Критичное (неделя 1-2)
1. ✅ System Settings & Configuration
2. ✅ Password Management
3. ✅ Avatar Upload

### Фаза 2: Важное (неделя 3-4)
4. ✅ Session Management
5. ✅ Notifications System
6. ✅ File Attachments

### Фаза 3: Security (неделя 5)
7. ✅ Two-Factor Authentication
8. ✅ Security Audit Log

### Фаза 4: Опциональное (неделя 6)
9. ✅ SMS Integration (если нужно)
10. ✅ Export Extensions
11. ✅ Bulk Operations
12. ✅ Advanced Search

---

## 🔍 Как проверить что нужно реализовать

### Шаг 1: Проверить существующий Django проект
```bash
cd /path/to/django-crm-backend

# Показать все URL эндпоинты
python manage.py show_urls | grep api

# Или
python manage.py show_urls > backend_urls.txt
```

### Шаг 2: Сравнить с Django-CRM API.yaml
```bash
# Эндпоинты из YAML
grep "^  /" Django-CRM API.yaml | sort > api_yaml_endpoints.txt

# Эндпоинты из Django
python manage.py show_urls | grep "/api/" | sort > backend_endpoints.txt

# Найти отличия
comm -23 api_yaml_endpoints.txt backend_endpoints.txt
```

### Шаг 3: Проверить Django apps
```bash
ls -la /path/to/django-crm/apps/
# Проверить наличие: sms/, settings/, notifications/, audit/
```

---

## 📝 Примеры реализации

### Пример 1: SMS Integration

```python
# apps/sms/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SMSProvider(models.Model):
    PROVIDERS = [
        ('twilio', 'Twilio'),
        ('smsru', 'SMS.ru'),
        ('vonage', 'Vonage'),
    ]
    
    name = models.CharField(max_length=50, choices=PROVIDERS)
    api_key = models.CharField(max_length=255)
    api_secret = models.CharField(max_length=255)
    sender_id = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'sms_providers'

class SMSMessage(models.Model):
    STATUSES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    
    provider = models.ForeignKey(SMSProvider, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUSES, default='pending')
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    external_id = models.CharField(max_length=100, null=True)
    
    # Relations (опционально)
    lead = models.ForeignKey('leads.Lead', null=True, on_delete=models.SET_NULL)
    contact = models.ForeignKey('contacts.Contact', null=True, on_delete=models.SET_NULL)
    
    class Meta:
        db_table = 'sms_messages'
        ordering = ['-sent_at']

class SMSTemplate(models.Model):
    name = models.CharField(max_length=100)
    content = models.TextField()
    variables = models.JSONField(default=list)  # ['name', 'company']
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sms_templates'

# apps/sms/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SMSMessage, SMSTemplate, SMSProvider
from .serializers import SMSMessageSerializer, SMSTemplateSerializer
from .tasks import send_sms_task

class SMSViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=['post'])
    def send(self, request):
        """Send single SMS"""
        phone = request.data.get('phone_number')
        message = request.data.get('message')
        
        # Async with Celery
        task = send_sms_task.delay(phone, message, request.user.id)
        
        return Response({
            'status': 'queued',
            'task_id': task.id
        })
    
    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        """Send bulk SMS"""
        phone_numbers = request.data.get('phone_numbers', [])
        message = request.data.get('message')
        
        for phone in phone_numbers:
            send_sms_task.delay(phone, message, request.user.id)
        
        return Response({
            'status': 'queued',
            'count': len(phone_numbers)
        })
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get SMS history"""
        messages = SMSMessage.objects.filter(sent_by=request.user)
        # pagination, serialization...
        
    @action(detail=False, methods=['get'])
    def balance(self, request):
        """Get SMS balance"""
        provider = SMSProvider.objects.filter(is_active=True).first()
        return Response({
            'balance': provider.balance if provider else 0
        })

# apps/sms/tasks.py (Celery)
from celery import shared_task
from .services import SMSService

@shared_task
def send_sms_task(phone, message, user_id):
    service = SMSService()
    return service.send_sms(phone, message, user_id)
```

### Пример 2: System Settings

```python
# apps/settings/models.py
from django.db import models
from django.contrib.postgres.fields import JSONField

class SystemSetting(models.Model):
    CATEGORIES = [
        ('general', 'General'),
        ('email', 'Email'),
        ('security', 'Security'),
        ('integrations', 'Integrations'),
    ]
    
    category = models.CharField(max_length=50, choices=CATEGORIES)
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)  # Can be accessed by non-admins
    
    class Meta:
        db_table = 'system_settings'
        unique_together = ['category', 'key']

class APIKey(models.Model):
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=100, unique=True)
    created_by = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True)
    is_active = models.BooleanField(default=True)
    permissions = models.JSONField(default=list)
    
    class Meta:
        db_table = 'api_keys'

class Webhook(models.Model):
    url = models.URLField()
    event = models.CharField(max_length=100)  # lead.created, deal.updated, etc.
    is_active = models.BooleanField(default=True)
    secret = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'webhooks'
```

---

## 🚀 Быстрый старт для Backend разработчика

### 1. Установить зависимости
```bash
pip install django-otp qrcode  # для 2FA
pip install twilio  # для SMS
pip install celery redis  # для async tasks
pip install pillow  # для image processing
```

### 2. Создать новые apps
```bash
python manage.py startapp sms
python manage.py startapp settings
python manage.py startapp notifications
python manage.py startapp audit
```

### 3. Добавить в INSTALLED_APPS
```python
INSTALLED_APPS = [
    # ...
    'sms',
    'settings',
    'notifications',
    'audit',
]
```

### 4. Создать модели и миграции
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Создать ViewSets и URL routes
```python
# urls.py
from sms.views import SMSViewSet
from settings.views import SystemSettingsViewSet

router.register('sms', SMSViewSet, basename='sms')
router.register('settings', SystemSettingsViewSet, basename='settings')
```

### 6. Обновить Django-CRM API.yaml
После реализации - добавить новые эндпоинты в YAML для документации.

---

## 📞 Контакты и вопросы

Если нужна помощь с реализацией конкретного функционала:
1. Проверьте примеры выше
2. Изучите Django REST Framework documentation
3. Посмотрите существующий код в проекте (patterns)

**Приоритеты:** System Settings → Password Management → SMS → остальное

---

**Создано**: Текущая сессия  
**Статус**: 📋 Требуется реализация на Backend  
**Приоритетность**: 🔴 Высокий → 🟡 Средний → 🟢 Низкий
