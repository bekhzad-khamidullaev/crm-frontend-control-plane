"""
DRF Serializers for Calls API
Place this in: calls/serializers.py
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Call, CallNote

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User info in calls"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class CallNoteSerializer(serializers.ModelSerializer):
    """Serializer for call notes"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CallNote
        fields = ['id', 'call', 'user', 'note', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CallSerializer(serializers.ModelSerializer):
    """Serializer for calls"""
    user = UserSerializer(read_only=True)
    entity_type = serializers.CharField(source='content_type.model', read_only=True)
    entity_id = serializers.IntegerField(source='object_id', read_only=True)
    call_notes = CallNoteSerializer(many=True, read_only=True)
    
    # Поля для создания звонка
    content_type = serializers.CharField(write_only=True, required=False, allow_null=True)
    object_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Call
        fields = [
            'id', 'call_type', 'status', 'user', 'phone_number',
            'entity_type', 'entity_id', 'content_type', 'object_id',
            'duration', 'recording_url', 'notes', 'sip_call_id', 'session_id',
            'started_at', 'answered_at', 'ended_at', 'created_at', 'updated_at',
            'call_notes'
        ]
        read_only_fields = [
            'id', 'user', 'duration', 'started_at', 'answered_at', 
            'ended_at', 'created_at', 'updated_at'
        ]
    
    def validate_call_type(self, value):
        """Validate call type"""
        allowed_types = ['incoming', 'outgoing', 'missed']
        if value not in allowed_types:
            raise serializers.ValidationError(
                f"Invalid call_type. Must be one of: {', '.join(allowed_types)}"
            )
        return value
    
    def validate_content_type(self, value):
        """Validate that content_type is one of allowed types"""
        if value:
            allowed_types = ['contact', 'lead', 'deal', 'company']
            if value.lower() not in allowed_types:
                raise serializers.ValidationError(
                    f"Invalid content_type. Must be one of: {', '.join(allowed_types)}"
                )
            return value.lower()
        return None
    
    def create(self, validated_data):
        """Create call with proper content_type"""
        from django.contrib.contenttypes.models import ContentType
        
        content_type_name = validated_data.pop('content_type', None)
        object_id = validated_data.pop('object_id', None)
        
        call = Call(
            user=self.context['request'].user,
            **validated_data
        )
        
        # Устанавливаем content_type если указан
        if content_type_name and object_id:
            try:
                content_type = ContentType.objects.get(model=content_type_name)
                call.content_type = content_type
                call.object_id = object_id
            except ContentType.DoesNotExist:
                pass
        
        call.save()
        return call
    
    def update(self, instance, validated_data):
        """Update call"""
        # Удаляем content_type и object_id из validated_data при обновлении
        validated_data.pop('content_type', None)
        validated_data.pop('object_id', None)
        
        return super().update(instance, validated_data)


class CallCreateSerializer(serializers.Serializer):
    """Simplified serializer for call creation"""
    call_type = serializers.ChoiceField(
        choices=['incoming', 'outgoing', 'missed'],
        required=True
    )
    phone_number = serializers.CharField(required=True, max_length=20)
    content_type = serializers.CharField(required=False, allow_null=True)
    object_id = serializers.IntegerField(required=False, allow_null=True)
    sip_call_id = serializers.CharField(required=False, allow_blank=True)
    session_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class CallStatisticsSerializer(serializers.Serializer):
    """Serializer for call statistics"""
    total_calls = serializers.IntegerField()
    calls_by_type = serializers.DictField()
    calls_by_status = serializers.DictField()
    average_duration = serializers.FloatField()
    total_duration = serializers.IntegerField()
    period_days = serializers.IntegerField()
