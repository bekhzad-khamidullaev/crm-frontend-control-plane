"""
URL routing for Calls API
Place this in: calls/urls.py
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallViewSet, CallNoteViewSet

router = DefaultRouter()
router.register(r'calls', CallViewSet, basename='call')
router.register(r'call-notes', CallNoteViewSet, basename='call-note')

urlpatterns = [
    path('', include(router.urls)),
]
