"""
Django Admin configuration for Chat and Calls
Place this in: chat/admin.py and calls/admin.py
"""

# chat/admin.py
from django.contrib import admin
from .models import ChatMessage, ChatAttachment


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'message_preview', 'entity_info', 'is_read', 'created_at']
    list_filter = ['is_read', 'is_edited', 'content_type', 'created_at']
    search_fields = ['message', 'sender__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Message Info', {
            'fields': ('message', 'sender', 'parent', 'is_read', 'is_edited')
        }),
        ('Entity Link', {
            'fields': ('content_type', 'object_id')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'
    
    def entity_info(self, obj):
        return f"{obj.content_type.model}:{obj.object_id}"
    entity_info.short_description = 'Entity'


@admin.register(ChatAttachment)
class ChatAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'file_name', 'file_type', 'file_size_kb', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['file_name', 'message__message']
    readonly_fields = ['uploaded_at']
    
    def file_size_kb(self, obj):
        return f"{obj.file_size / 1024:.2f} KB"
    file_size_kb.short_description = 'File Size'


# calls/admin.py
from django.contrib import admin
from .models import Call, CallNote


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = ['id', 'call_type', 'status', 'user', 'phone_number', 'duration_formatted', 'started_at']
    list_filter = ['call_type', 'status', 'started_at']
    search_fields = ['phone_number', 'user__username', 'notes']
    readonly_fields = ['started_at', 'answered_at', 'ended_at', 'created_at', 'updated_at']
    date_hierarchy = 'started_at'
    
    fieldsets = (
        ('Call Info', {
            'fields': ('call_type', 'status', 'user', 'phone_number', 'duration')
        }),
        ('Entity Link', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Call Details', {
            'fields': ('notes', 'recording_url', 'sip_call_id', 'session_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('started_at', 'answered_at', 'ended_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def duration_formatted(self, obj):
        if obj.duration:
            minutes = obj.duration // 60
            seconds = obj.duration % 60
            return f"{minutes}m {seconds}s"
        return "0s"
    duration_formatted.short_description = 'Duration'


@admin.register(CallNote)
class CallNoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'call', 'user', 'note_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['note', 'user__username']
    readonly_fields = ['created_at']
    
    def note_preview(self, obj):
        return obj.note[:50] + '...' if len(obj.note) > 50 else obj.note
    note_preview.short_description = 'Note'
