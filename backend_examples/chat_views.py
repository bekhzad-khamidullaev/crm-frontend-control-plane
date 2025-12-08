"""
DRF Views for Chat API
Place this in: chat/views.py
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, Count
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import ChatMessage, ChatAttachment
from .serializers import (
    ChatMessageSerializer,
    ChatAttachmentSerializer,
    BulkMarkReadSerializer,
    ChatStatisticsSerializer
)


class ChatMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ChatMessage CRUD operations
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter messages based on query parameters"""
        queryset = ChatMessage.objects.select_related(
            'sender', 'content_type', 'parent'
        ).prefetch_related('attachments')
        
        # Фильтр по типу сущности
        content_type = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        
        if content_type and object_id:
            try:
                ct = ContentType.objects.get(model=content_type.lower())
                queryset = queryset.filter(
                    content_type=ct,
                    object_id=object_id
                )
            except ContentType.DoesNotExist:
                queryset = queryset.none()
        
        # Фильтр по статусу прочтения
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Фильтр по родительскому сообщению (для threads)
        parent = self.request.query_params.get('parent')
        if parent:
            queryset = queryset.filter(parent_id=parent)
        
        # Поиск по тексту
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(message__icontains=search)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create message and broadcast via WebSocket"""
        message = serializer.save(sender=self.request.user)
        
        # Отправляем через WebSocket
        self.broadcast_new_message(message)
    
    def perform_update(self, serializer):
        """Update message and broadcast changes"""
        message = serializer.save(is_edited=True)
        self.broadcast_message_update(message)
    
    def perform_destroy(self, instance):
        """Delete message and broadcast"""
        message_id = instance.id
        entity_type = instance.content_type.model
        entity_id = instance.object_id
        
        instance.delete()
        
        self.broadcast_message_delete(message_id, entity_type, entity_id)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark single message as read"""
        message = self.get_object()
        message.is_read = True
        message.save(update_fields=['is_read'])
        
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def bulk_mark_read(self, request):
        """Mark multiple messages as read"""
        serializer = BulkMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message_ids = serializer.validated_data['message_ids']
        
        updated = ChatMessage.objects.filter(
            id__in=message_ids,
            sender=request.user
        ).update(is_read=True)
        
        return Response({
            'status': 'success',
            'updated_count': updated
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread messages for current user"""
        count = ChatMessage.objects.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).count()
        
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get chat statistics"""
        user = request.user
        
        # Total messages
        total_messages = ChatMessage.objects.count()
        
        # Unread messages
        unread_messages = ChatMessage.objects.filter(
            is_read=False
        ).exclude(sender=user).count()
        
        # Total conversations (unique entity combinations)
        conversations = ChatMessage.objects.values(
            'content_type', 'object_id'
        ).distinct().count()
        
        # Messages by entity type
        messages_by_entity = {}
        entity_stats = ChatMessage.objects.values(
            'content_type__model'
        ).annotate(count=Count('id'))
        
        for stat in entity_stats:
            messages_by_entity[stat['content_type__model']] = stat['count']
        
        # Recent activity (last 10 messages)
        recent = ChatMessage.objects.select_related(
            'sender', 'content_type'
        ).order_by('-created_at')[:10]
        
        recent_activity = [{
            'id': msg.id,
            'sender': msg.sender.username,
            'entity_type': msg.content_type.model,
            'entity_id': msg.object_id,
            'created_at': msg.created_at.isoformat()
        } for msg in recent]
        
        data = {
            'total_messages': total_messages,
            'unread_messages': unread_messages,
            'total_conversations': conversations,
            'messages_by_entity': messages_by_entity,
            'recent_activity': recent_activity
        }
        
        serializer = ChatStatisticsSerializer(data)
        return Response(serializer.data)
    
    # WebSocket broadcast helpers
    
    def broadcast_new_message(self, message):
        """Broadcast new message to all users in entity group"""
        channel_layer = get_channel_layer()
        entity_group = f"chat_{message.content_type.model}_{message.object_id}"
        
        async_to_sync(channel_layer.group_send)(
            entity_group,
            {
                'type': 'new_message',
                'message': message.to_dict()
            }
        )
    
    def broadcast_message_update(self, message):
        """Broadcast message update"""
        channel_layer = get_channel_layer()
        entity_group = f"chat_{message.content_type.model}_{message.object_id}"
        
        async_to_sync(channel_layer.group_send)(
            entity_group,
            {
                'type': 'message_updated',
                'message': message.to_dict()
            }
        )
    
    def broadcast_message_delete(self, message_id, entity_type, entity_id):
        """Broadcast message deletion"""
        channel_layer = get_channel_layer()
        entity_group = f"chat_{entity_type}_{entity_id}"
        
        async_to_sync(channel_layer.group_send)(
            entity_group,
            {
                'type': 'message_deleted',
                'message_id': message_id
            }
        )


class ChatAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ChatAttachment operations
    """
    serializer_class = ChatAttachmentSerializer
    permission_classes = [IsAuthenticated]
    queryset = ChatAttachment.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Upload attachment to message"""
        message_id = request.data.get('message_id')
        file = request.FILES.get('file')
        
        if not message_id or not file:
            return Response(
                {'error': 'message_id and file are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            message = ChatMessage.objects.get(id=message_id)
        except ChatMessage.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        attachment = ChatAttachment.objects.create(
            message=message,
            file=file,
            file_name=file.name,
            file_type=file.content_type,
            file_size=file.size
        )
        
        serializer = self.get_serializer(attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
