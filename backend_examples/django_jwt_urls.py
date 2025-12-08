"""
Django URLs configuration for JWT Authentication
================================================

Add these URL patterns to your main urls.py file.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# =============================================================================
# BASIC JWT ENDPOINTS
# =============================================================================

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Your API endpoints
    path('api/', include('your_app.urls')),
]

# =============================================================================
# OPTIONAL: Custom Token View with additional data
# =============================================================================

# Если хотите кастомизировать response при получении токена:

"""
# your_app/views.py

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra responses here
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Затем в urls.py:
from your_app.views import CustomTokenObtainPairView

urlpatterns = [
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # ...
]
"""

# =============================================================================
# OPTIONAL: Logout endpoint with Token Blacklist
# =============================================================================

"""
# your_app/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    '''
    Logout user by blacklisting the refresh token
    '''
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

# В urls.py:
from your_app.views import logout_view

urlpatterns = [
    # ...
    path('api/logout/', logout_view, name='logout'),
]
"""

# =============================================================================
# TESTING JWT ENDPOINTS
# =============================================================================

"""
# 1. Получить токены:
curl -X POST http://localhost:8000/api/token/ \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "admin123"}'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# 2. Использовать access токен:
curl http://localhost:8000/api/contacts/ \\
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."

# 3. Обновить access токен:
curl -X POST http://localhost:8000/api/token/refresh/ \\
  -H "Content-Type: application/json" \\
  -d '{"refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."}'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."  # new refresh if ROTATE_REFRESH_TOKENS=True
}

# 4. Проверить токен:
curl -X POST http://localhost:8000/api/token/verify/ \\
  -H "Content-Type: application/json" \\
  -d '{"token": "eyJ0eXAiOiJKV1QiLCJhbGc..."}'

# Response (if valid):
{}

# Response (if invalid):
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
"""
