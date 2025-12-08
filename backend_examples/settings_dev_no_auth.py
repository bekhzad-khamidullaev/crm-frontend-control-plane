"""
Django settings для разработки БЕЗ аутентификации
Добавьте эти настройки в ваш settings.py для development

ВАЖНО: Только для локальной разработки! НЕ использовать в production!
"""

# Отключить аутентификацию для всех API endpoints
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # Закомментируйте эти строки для отключения аутентификации:
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',
        # 'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        # Измените на AllowAny для отключения проверки прав:
        'rest_framework.permissions.AllowAny',  # Вместо IsAuthenticated
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S.%fZ',
}

# Или создайте отдельный settings_dev.py:
"""
# settings_dev.py (наследуется от settings.py)

from .settings import *

# Отключаем аутентификацию только для development
REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] = [
    'rest_framework.permissions.AllowAny',
]

DEBUG = True
"""

# Затем запускайте с:
# python manage.py runserver --settings=your_project.settings_dev
