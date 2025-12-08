"""
WebSocket URL routing for Calls
Place this in: calls/routing.py
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/calls/$', consumers.CallsConsumer.as_asgi()),
]
