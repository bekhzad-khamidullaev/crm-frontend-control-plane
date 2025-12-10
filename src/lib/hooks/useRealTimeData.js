import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useRealTimeData - хук для real-time обновления данных
 * 
 * @param {Function} fetchFunction - функция для загрузки данных
 * @param {Object} options - опции
 *   - interval: интервал обновления в мс (по умолчанию 30000 - 30 сек)
 *   - enabled: включено ли автообновление (по умолчанию true)
 *   - onUpdate: callback при обновлении данных
 *   - onError: callback при ошибке
 * @returns {Object} { data, loading, error, refresh, isRealTime, toggleRealTime }
 */
export function useRealTimeData(fetchFunction, options = {}) {
  const {
    interval = 30000, // 30 секунд по умолчанию
    enabled = true,
    onUpdate,
    onError,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRealTime, setIsRealTime] = useState(enabled);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Функция загрузки данных
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      
      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
        
        if (onUpdate) {
          onUpdate(result);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        
        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, onUpdate, onError]);

  // Ручное обновление
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Переключение real-time режима
  const toggleRealTime = useCallback(() => {
    setIsRealTime(prev => !prev);
  }, []);

  // Начальная загрузка
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Настройка интервала
  useEffect(() => {
    // Очистка предыдущего интервала
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Установка нового интервала если включен real-time
    if (isRealTime && interval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, interval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTime, interval, fetchData]);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    isRealTime,
    toggleRealTime,
    lastUpdate,
  };
}

/**
 * useWebSocketData - хук для получения данных через WebSocket
 * 
 * @param {string} url - WebSocket URL
 * @param {Object} options - опции
 * @returns {Object} { data, connected, send, error }
 */
export function useWebSocketData(url, options = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!url || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnected(true);
        setError(null);
        
        if (onOpen) {
          onOpen();
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
          
          if (onMessage) {
            onMessage(parsedData);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        if (!isMountedRef.current) return;
        
        const err = new Error('WebSocket error');
        setError(err);
        
        if (onError) {
          onError(err);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        
        setConnected(false);
        
        if (onClose) {
          onClose();
        }

        // Попытка переподключения
        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err);
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval]);

  const send = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    connected,
    send,
    error,
    reconnect: connect,
    disconnect,
  };
}
