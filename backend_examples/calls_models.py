"""
Django models for Calls application
Place this in: calls/models.py
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class Call(models.Model):
    """
    Call record model
    """
    CALL_TYPES = [
        ('incoming', 'Incoming'),
        ('outgoing', 'Outgoing'),
        ('missed', 'Missed'),
    ]
    
    CALL_STATUS = [
        ('ringing', 'Ringing'),
        ('answered', 'Answered'),
        ('busy', 'Busy'),
        ('failed', 'Failed'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
    ]
    
    call_type = models.CharField(max_length=20, choices=CALL_TYPES)
    status = models.CharField(max_length=20, choices=CALL_STATUS, default='ringing')
    
    # User who initiated/received the call
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='calls'
    )
    
    # Phone number
    phone_number = models.CharField(max_length=20)
    
    # Generic FK для привязки к сущности (Contact, Lead, etc.)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Call details
    duration = models.IntegerField(default=0, help_text="Duration in seconds")
    recording_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True)
    
    # SIP/WebRTC details
    sip_call_id = models.CharField(max_length=255, blank=True)
    session_id = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'call_type']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['status']),
            models.Index(fields=['-started_at']),
        ]
    
    def __str__(self):
        return f"{self.call_type} call - {self.phone_number} ({self.status})"
    
    def to_dict(self):
        """Serialize call for WebSocket and API"""
        return {
            'id': self.id,
            'call_type': self.call_type,
            'status': self.status,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'full_name': self.user.get_full_name() or self.user.username,
            },
            'phone_number': self.phone_number,
            'entity_type': self.content_type.model if self.content_type else None,
            'entity_id': self.object_id,
            'duration': self.duration,
            'recording_url': self.recording_url,
            'notes': self.notes,
            'sip_call_id': self.sip_call_id,
            'session_id': self.session_id,
            'started_at': self.started_at.isoformat(),
            'answered_at': self.answered_at.isoformat() if self.answered_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class CallNote(models.Model):
    """
    Notes and comments for calls
    """
    call = models.ForeignKey(
        Call,
        on_delete=models.CASCADE,
        related_name='call_notes'
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Note for call {self.call.id} by {self.user.username}"
