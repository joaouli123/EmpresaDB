import asyncio
import json
from typing import Set, Dict, Any
from fastapi import WebSocket
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketLogHandler(logging.Handler):
    """Handler de logging que envia logs para WebSocket"""
    def __init__(self, ws_manager):
        super().__init__()
        self.ws_manager = ws_manager
        
    def emit(self, record):
        try:
            # Mapeia níveis de logging para níveis do frontend
            level_map = {
                'DEBUG': 'debug',
                'INFO': 'info',
                'WARNING': 'warning',
                'ERROR': 'error',
                'CRITICAL': 'error'
            }
            
            level = level_map.get(record.levelname, 'info')
            message = self.format(record)
            
            # Cria uma task para enviar via WebSocket
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self.ws_manager.broadcast_log(level, message))
            except RuntimeError:
                pass  # Event loop não está rodando
        except Exception:
            self.handleError(record)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._log_handler = None
        
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
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "details": details or {}
            }
        }
        await self.broadcast(log_message)
    
    def attach_logger(self, logger_name: str):
        """Anexa um handler de logging ao logger especificado para capturar logs"""
        if self._log_handler is None:
            self._log_handler = WebSocketLogHandler(self)
            formatter = logging.Formatter('%(message)s')
            self._log_handler.setFormatter(formatter)
        
        target_logger = logging.getLogger(logger_name)
        if self._log_handler not in target_logger.handlers:
            target_logger.addHandler(self._log_handler)
            logger.info(f"📡 WebSocket handler anexado ao logger: {logger_name}")
    
    def detach_logger(self, logger_name: str):
        """Remove o handler de logging"""
        if self._log_handler:
            target_logger = logging.getLogger(logger_name)
            target_logger.removeHandler(self._log_handler)

ws_manager = WebSocketManager()
