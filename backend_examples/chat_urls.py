"""
URL routing for Chat API
Place this in: chat/urls.py
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatMessageViewSet, ChatAttachmentViewSet

router = DefaultRouter()
router.register(r'chat-messages', ChatMessageViewSet, basename='chat-message')
router.register(r'chat-attachments', ChatAttachmentViewSet, basename='chat-attachment')

urlpatterns = [
    path('', include(router.urls)),
]
