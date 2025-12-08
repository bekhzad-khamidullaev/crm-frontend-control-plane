"""
DRF Views for Calls API
Place this in: calls/views.py
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import timedelta

from .models import Call, CallNote
from .serializers import CallSerializer, CallNoteSerializer


class CallViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Call CRUD operations
    """
    serializer_class = CallSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter calls based on query parameters"""
        queryset = Call.objects.select_related(
            'user', 'content_type'
        )
        
        # Фильтр по пользователю
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        else:
            # По умолчанию только свои звонки
            queryset = queryset.filter(user=self.request.user)
        
        # Фильтр по типу звонка
        call_type = self.request.query_params.get('call_type')
        if call_type:
            queryset = queryset.filter(call_type=call_type)
        
        # Фильтр по статусу
        call_status = self.request.query_params.get('status')
        if call_status:
            queryset = queryset.filter(status=call_status)
        
        # Фильтр по номеру телефона
        phone_number = self.request.query_params.get('phone_number')
        if phone_number:
            queryset = queryset.filter(phone_number__icontains=phone_number)
        
        # Фильтр по сущности
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
        
        # Фильтр по дате
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(started_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(started_at__lte=date_to)
        
        return queryset.order_by('-started_at')
    
    def perform_create(self, serializer):
        """Create call and broadcast via WebSocket"""
        call = serializer.save(user=self.request.user)
        
        # Отправляем через WebSocket
        if call.call_type == 'incoming':
            self.broadcast_incoming_call(call)
        else:
            self.broadcast_call_started(call)
    
    def perform_update(self, serializer):
        """Update call and broadcast changes"""
        call = serializer.save()
        
        # Если звонок завершен, отправляем уведомление
        if call.status in ['completed', 'failed', 'missed']:
            self.broadcast_call_ended(call)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Mark call as started (answered)"""
        call = self.get_object()
        
        if not call.answered_at:
            call.answered_at = timezone.now()
            call.status = 'answered'
            call.save(update_fields=['answered_at', 'status'])
            
            self.broadcast_call_started(call)
        
        return Response(CallSerializer(call).data)
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End the call"""
        call = self.get_object()
        
        if not call.ended_at:
            call.ended_at = timezone.now()
            call.status = 'completed'
            
            # Calculate duration
            if call.answered_at:
                duration = (call.ended_at - call.answered_at).total_seconds()
                call.duration = int(duration)
            
            call.save(update_fields=['ended_at', 'status', 'duration'])
            
            self.broadcast_call_ended(call)
        
        return Response(CallSerializer(call).data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add note to call"""
        call = self.get_object()
        note_text = request.data.get('note')
        
        if not note_text:
            return Response(
                {'error': 'Note text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        note = CallNote.objects.create(
            call=call,
            user=request.user,
            note=note_text
        )
        
        return Response(CallNoteSerializer(note).data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get call statistics"""
        user = request.user
        
        # Get date range (default: last 30 days)
        days = int(request.query_params.get('days', 30))
        date_from = timezone.now() - timedelta(days=days)
        
        queryset = Call.objects.filter(
            user=user,
            started_at__gte=date_from
        )
        
        # Total calls
        total_calls = queryset.count()
        
        # Calls by type
        calls_by_type = {
            'incoming': queryset.filter(call_type='incoming').count(),
            'outgoing': queryset.filter(call_type='outgoing').count(),
            'missed': queryset.filter(call_type='missed').count(),
        }
        
        # Calls by status
        calls_by_status = {}
        status_stats = queryset.values('status').annotate(count=Count('id'))
        for stat in status_stats:
            calls_by_status[stat['status']] = stat['count']
        
        # Average duration
        avg_duration = queryset.filter(
            duration__gt=0
        ).aggregate(avg=Avg('duration'))['avg'] or 0
        
        # Total duration
        total_duration = queryset.aggregate(
            total=Sum('duration')
        )['total'] or 0
        
        data = {
            'total_calls': total_calls,
            'calls_by_type': calls_by_type,
            'calls_by_status': calls_by_status,
            'average_duration': round(avg_duration, 2),
            'total_duration': total_duration,
            'period_days': days,
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent calls"""
        limit = int(request.query_params.get('limit', 10))
        
        calls = self.get_queryset()[:limit]
        serializer = self.get_serializer(calls, many=True)
        
        return Response(serializer.data)
    
    # WebSocket broadcast helpers
    
    def broadcast_incoming_call(self, call):
        """Broadcast incoming call to user"""
        channel_layer = get_channel_layer()
        user_group = f"calls_user_{call.user.id}"
        
        async_to_sync(channel_layer.group_send)(
            user_group,
            {
                'type': 'incoming_call',
                'call': call.to_dict()
            }
        )
    
    def broadcast_call_started(self, call):
        """Broadcast call start"""
        channel_layer = get_channel_layer()
        user_group = f"calls_user_{call.user.id}"
        
        async_to_sync(channel_layer.group_send)(
            user_group,
            {
                'type': 'call_started',
                'call': call.to_dict()
            }
        )
    
    def broadcast_call_ended(self, call):
        """Broadcast call end"""
        channel_layer = get_channel_layer()
        user_group = f"calls_user_{call.user.id}"
        
        async_to_sync(channel_layer.group_send)(
            user_group,
            {
                'type': 'call_ended',
                'call_id': call.id,
                'duration': call.duration,
                'status': call.status
            }
        )


class CallNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CallNote operations
    """
    serializer_class = CallNoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        call_id = self.request.query_params.get('call_id')
        if call_id:
            return CallNote.objects.filter(call_id=call_id)
        return CallNote.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
