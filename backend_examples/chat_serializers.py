"""
DRF Serializers for Chat API
Place this in: chat/serializers.py
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatMessage, ChatAttachment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User info in messages"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class ChatAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for chat attachments"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatAttachment
        fields = ['id', 'file_url', 'file_name', 'file_type', 'file_size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    sender = UserSerializer(read_only=True)
    attachments = ChatAttachmentSerializer(many=True, read_only=True)
    entity_type = serializers.CharField(source='content_type.model', read_only=True)
    entity_id = serializers.IntegerField(source='object_id', read_only=True)
    
    # Поля для создания сообщения
    content_type = serializers.CharField(write_only=True, required=True)
    object_id = serializers.IntegerField(write_only=True, required=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'message', 'sender', 'entity_type', 'entity_id',
            'content_type', 'object_id', 'parent', 'is_read', 'is_edited',
            'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'is_edited', 'created_at', 'updated_at']
    
    def validate_content_type(self, value):
        """Validate that content_type is one of allowed types"""
        allowed_types = ['contact', 'lead', 'deal', 'company']
        if value.lower() not in allowed_types:
            raise serializers.ValidationError(
                f"Invalid content_type. Must be one of: {', '.join(allowed_types)}"
            )
        return value.lower()
    
    def create(self, validated_data):
        """Create message with proper content_type"""
        from django.contrib.contenttypes.models import ContentType
        
        content_type_name = validated_data.pop('content_type')
        object_id = validated_data.pop('object_id')
        
        # Получаем ContentType по имени модели
        try:
            content_type = ContentType.objects.get(model=content_type_name)
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(
                f"Content type '{content_type_name}' does not exist"
            )
        
        # Создаем сообщение
        message = ChatMessage.objects.create(
            content_type=content_type,
            object_id=object_id,
            sender=self.context['request'].user,
            **validated_data
        )
        
        return message


class ChatMessageCreateSerializer(serializers.Serializer):
    """Simplified serializer for message creation via API"""
    message = serializers.CharField(required=True)
    content_type = serializers.CharField(required=True)
    object_id = serializers.IntegerField(required=True)
    parent = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_content_type(self, value):
        allowed_types = ['contact', 'lead', 'deal', 'company']
        if value.lower() not in allowed_types:
            raise serializers.ValidationError(
                f"Invalid content_type. Must be one of: {', '.join(allowed_types)}"
            )
        return value.lower()


class BulkMarkReadSerializer(serializers.Serializer):
    """Serializer for bulk mark as read operation"""
    message_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        allow_empty=False
    )


class ChatStatisticsSerializer(serializers.Serializer):
    """Serializer for chat statistics"""
    total_messages = serializers.IntegerField()
    unread_messages = serializers.IntegerField()
    total_conversations = serializers.IntegerField()
    messages_by_entity = serializers.DictField()
    recent_activity = serializers.ListField()
