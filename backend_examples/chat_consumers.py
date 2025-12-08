"""
Django Channels WebSocket Consumer for Chat
Place this in: chat/consumers.py
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        
        # Проверка аутентификации
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Глобальная группа для пользователя (получает все сообщения)
        self.user_group_name = f"user_{self.user.id}"
        
        # Подключаемся к группе пользователя
        await self.channel_layer.group_add(
            self.user_group_name,
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
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'typing_started':
                await self.handle_typing_started(data)
            elif message_type == 'typing_stopped':
                await self.handle_typing_stopped(data)
            elif message_type == 'pong':
                # Ответ на ping (keep-alive)
                pass
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
    
    async def handle_typing_started(self, data):
        """Handle typing indicator start"""
        entity_type = data.get('entity_type')
        entity_id = data.get('entity_id')
        
        if not entity_type or not entity_id:
            return
        
        # Создаем группу для этой сущности
        entity_group = f"chat_{entity_type}_{entity_id}"
        
        # Broadcast typing indicator всем в группе
        await self.channel_layer.group_send(
            entity_group,
            {
                'type': 'typing_started',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name() or self.user.username,
                'entity_type': entity_type,
                'entity_id': entity_id,
            }
        )
    
    async def handle_typing_stopped(self, data):
        """Handle typing indicator stop"""
        entity_type = data.get('entity_type')
        entity_id = data.get('entity_id')
        
        if not entity_type or not entity_id:
            return
        
        entity_group = f"chat_{entity_type}_{entity_id}"
        
        await self.channel_layer.group_send(
            entity_group,
            {
                'type': 'typing_stopped',
                'user_id': self.user.id,
                'entity_type': entity_type,
                'entity_id': entity_id,
            }
        )
    
    # Event handlers (вызываются из channel_layer.group_send)
    
    async def new_message(self, event):
        """Send new message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'payload': event['message']
        }))
    
    async def message_updated(self, event):
        """Send message update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message_updated',
            'payload': event['message']
        }))
    
    async def message_deleted(self, event):
        """Send message deletion to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'payload': {'id': event['message_id']}
        }))
    
    async def typing_started(self, event):
        """Send typing indicator to WebSocket"""
        # Не отправляем самому себе
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing_started',
                'payload': {
                    'user_id': event['user_id'],
                    'user_name': event['user_name'],
                    'entity_type': event['entity_type'],
                    'entity_id': event['entity_id'],
                }
            }))
    
    async def typing_stopped(self, event):
        """Send typing stopped to WebSocket"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing_stopped',
                'payload': {
                    'user_id': event['user_id'],
                    'entity_type': event['entity_type'],
                    'entity_id': event['entity_id'],
                }
            }))
    
    async def ping(self, event):
        """Handle ping (keep-alive)"""
        await self.send(text_data=json.dumps({
            'type': 'ping'
        }))
