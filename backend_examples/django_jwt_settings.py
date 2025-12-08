"""
Django JWT Authentication Settings
===================================

Add these settings to your Django settings.py file.

This configuration enables JWT authentication with djangorestframework-simplejwt.
"""

from datetime import timedelta

# =============================================================================
# JWT AUTHENTICATION SETTINGS
# =============================================================================

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... your existing apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # Optional: для token blacklist
    # ... your other apps
]

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # Optional: для admin
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # Требовать аутентификацию для всех endpoints
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S.%fZ',
}

# Simple JWT configuration
SIMPLE_JWT = {
    # Время жизни токенов
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),      # Access токен живет 1 час
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # Refresh токен живет 7 дней
    
    # Ротация refresh токенов
    'ROTATE_REFRESH_TOKENS': True,                    # Создавать новый refresh при обновлении
    'BLACKLIST_AFTER_ROTATION': True,                 # Добавлять старый refresh в blacklist
    'UPDATE_LAST_LOGIN': True,                        # Обновлять last_login пользователя
    
    # Алгоритм подписи
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,                        # Используем SECRET_KEY из settings
    'VERIFYING_KEY': None,
    
    # Заголовки аутентификации
    'AUTH_HEADER_TYPES': ('Bearer',),                # Тип заголовка: "Bearer <token>"
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # Claims (данные в токене)
    'USER_ID_FIELD': 'id',                            # Поле пользователя для user_id claim
    'USER_ID_CLAIM': 'user_id',                       # Имя claim для ID пользователя
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    # Типы токенов
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    # JTI (JWT ID) для уникальности
    'JTI_CLAIM': 'jti',
    
    # Дополнительные claims (можно добавить свои данные)
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    
    # Скользящие токены (sliding tokens) - альтернатива refresh токенам
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# =============================================================================
# CORS SETTINGS (если фронтенд на другом домене)
# =============================================================================

INSTALLED_APPS += ['corsheaders']

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # Добавить в начало middleware
    'django.middleware.security.SecurityMiddleware',
    # ... остальные middleware
]

# Разрешенные origins для CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

# Разрешить отправку cookies
CORS_ALLOW_CREDENTIALS = True

# Разрешенные методы
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Разрешенные заголовки
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =============================================================================
# OPTIONAL: Custom JWT Claims
# =============================================================================

# Если хотите добавить дополнительные данные в JWT токен,
# создайте custom serializer:

"""
# your_app/serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Добавьте свои данные
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        
        return token

# Затем в settings.py:
SIMPLE_JWT = {
    # ... other settings
    'TOKEN_OBTAIN_SERIALIZER': 'your_app.serializers.CustomTokenObtainPairSerializer',
}
"""

# =============================================================================
# OPTIONAL: Token Blacklist (для logout)
# =============================================================================

# Если используете token blacklist, выполните миграции:
# python manage.py migrate

# Затем в views.py можно сделать logout:
"""
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()  # Добавляет токен в blacklist
        return Response({'message': 'Logout successful'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)
"""

# =============================================================================
# LOGGING (для отладки JWT)
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'rest_framework_simplejwt': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
