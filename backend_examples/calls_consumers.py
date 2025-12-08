"""
Django Channels WebSocket Consumer for Calls
Place this in: calls/consumers.py
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class CallsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time call notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        
        # Проверка аутентификации
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Группа для пользователя (получает уведомления о звонках)
        self.user_group_name = f"calls_user_{self.user.id}"
        
        # Глобальная группа для всех пользователей (для общих событий)
        self.global_group_name = "calls_global"
        
        # Подключаемся к группам
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.channel_layer.group_add(
            self.global_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Отправляем подтверждение подключения
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'user_id': self.user.id,
            'username': self.user.username,
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
        
        if hasattr(self, 'global_group_name'):
            await self.channel_layer.group_discard(
                self.global_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'call_status_update':
                await self.handle_call_status_update(data)
            elif message_type == 'ping':
                # Ответ на ping (keep-alive)
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def handle_call_status_update(self, data):
        """Handle call status update from client"""
        call_id = data.get('call_id')
        status = data.get('status')
        
        if not call_id or not status:
            return
        
        # Здесь можно обновить статус звонка в БД
        # await self.update_call_status(call_id, status)
        
        # Broadcast обновление всем заинтересованным пользователям
        await self.channel_layer.group_send(
            self.global_group_name,
            {
                'type': 'call_status_changed',
                'call_id': call_id,
                'status': status,
                'user_id': self.user.id,
            }
        )
    
    # Event handlers (вызываются из channel_layer.group_send)
    
    async def incoming_call(self, event):
        """Send incoming call notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'incoming_call',
            'payload': event['call']
        }))
    
    async def call_started(self, event):
        """Notify about call start"""
        await self.send(text_data=json.dumps({
            'type': 'call_started',
            'payload': event['call']
        }))
    
    async def call_ended(self, event):
        """Notify about call end"""
        await self.send(text_data=json.dumps({
            'type': 'call_ended',
            'payload': {
                'call_id': event['call_id'],
                'duration': event.get('duration', 0),
                'status': event.get('status', 'completed')
            }
        }))
    
    async def call_status_changed(self, event):
        """Notify about call status change"""
        await self.send(text_data=json.dumps({
            'type': 'call_status_changed',
            'payload': {
                'call_id': event['call_id'],
                'status': event['status'],
                'user_id': event['user_id'],
            }
        }))
    
    async def call_missed(self, event):
        """Notify about missed call"""
        await self.send(text_data=json.dumps({
            'type': 'call_missed',
            'payload': event['call']
        }))
    
    async def ping(self, event):
        """Handle ping (keep-alive)"""
        await self.send(text_data=json.dumps({
            'type': 'ping'
        }))
