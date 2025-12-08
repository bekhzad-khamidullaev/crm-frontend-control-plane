"""
Django models for Chat application
Place this in: chat/models.py
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class ChatMessage(models.Model):
    """
    Chat message model with Generic Foreign Key for any entity
    """
    message = models.TextField()
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_messages'
    )
    
    # Generic FK для привязки к любой сущности (Contact, Lead, Deal, Company)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Threading support (ответы на сообщения)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    
    is_read = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['sender', 'is_read']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.sender.username}: {self.message[:50]}"
    
    def to_dict(self):
        """Serialize message for WebSocket and API"""
        return {
            'id': self.id,
            'message': self.message,
            'sender': {
                'id': self.sender.id,
                'username': self.sender.username,
                'first_name': self.sender.first_name,
                'last_name': self.sender.last_name,
            },
            'entity_type': self.content_type.model,
            'entity_id': self.object_id,
            'parent_id': self.parent_id,
            'is_read': self.is_read,
            'is_edited': self.is_edited,
            'attachments': [att.to_dict() for att in self.attachments.all()],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class ChatAttachment(models.Model):
    """
    File attachments for chat messages
    """
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='chat_attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()  # в байтах
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']
    
    def __str__(self):
        return f"{self.file_name} ({self.file_size} bytes)"
    
    def to_dict(self):
        """Serialize attachment"""
        return {
            'id': self.id,
            'file_url': self.file.url if self.file else None,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'uploaded_at': self.uploaded_at.isoformat(),
        }


class TypingIndicator(models.Model):
    """
    Temporary model to track typing indicators
    Can use Redis instead for better performance
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    
    started_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'started_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} typing in {self.content_type.model}:{self.object_id}"
