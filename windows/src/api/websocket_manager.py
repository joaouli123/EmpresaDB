import asyncio
import json
from typing import Set, Dict, Any
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Cliente conectado. Total: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Cliente desconectado. Total: {len(self.active_connections)}")
        
    async def send_message(self, message: Dict[str, Any], websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            self.disconnect(websocket)
            
    async def broadcast(self, message: Dict[str, Any]):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Erro no broadcast: {e}")
                disconnected.add(connection)
        
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_progress(self, event_type: str, data: Dict[str, Any]):
        """Envia evento de progresso para todos os clientes"""
        message = {
            "type": event_type,
            "data": data
        }
        await self.broadcast(message)
    
    async def broadcast_log(self, level: str, message: str, details: Dict[str, Any] = None):
        """Envia log para todos os clientes"""
        log_message = {
            "type": "log",
            "data": {
                "level": level,
                "message": message,
                "details": details or {}
            }
        }
        await self.broadcast(log_message)

ws_manager = WebSocketManager()
