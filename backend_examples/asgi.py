"""
ASGI config for Django project with Channels support
Place this in: your_project/asgi.py
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing after Django initialization
from chat.routing import websocket_urlpatterns as chat_patterns
from calls.routing import websocket_urlpatterns as calls_patterns
from your_project.authentication import JWTAuthMiddlewareStack

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(
                chat_patterns + calls_patterns
            )
        )
    ),
})
