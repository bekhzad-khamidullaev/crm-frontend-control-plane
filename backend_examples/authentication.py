"""
Custom authentication for WebSocket connections
Place this in: your_project/authentication.py
"""

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from urllib.parse import parse_qs

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    """Get user from JWT token"""
    try:
        # Validate token
        UntypedToken(token)
        
        # Decode token
        decoded_data = jwt_decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        
        # Get user
        user_id = decoded_data.get('user_id')
        if user_id:
            user = User.objects.get(id=user_id)
            return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        pass
    
    return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Authenticate user
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Helper function to wrap the ASGI application with JWT auth middleware
    """
    return JWTAuthMiddleware(inner)
