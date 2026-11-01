// src/hooks/useChatWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { tokenStorage } from '../services/apiClient';
import type { Message, SendMessagePayload } from '../types/chat.types';

interface UseChatWebSocketProps {
  onMessageReceived: (message: Message) => void;
}

export function useChatWebSocket({ onMessageReceived }: UseChatWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const onMessageReceivedRef = useRef(onMessageReceived);

  // Giữ ref callback mới nhất tránh re-subscribe không cần thiết
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    const token = tokenStorage.get();

    const client = new Client({
      // Dùng SockJS làm webSocketFactory để tương thích cấu hình Spring Boot withSockJS()
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {//STOM frame connect
        Authorization: token ? `Bearer ${token}` : '',
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);

        // Lắng nghe tin nhắn đến riêng cho user tại /user/queue/messages
        client.subscribe('/user/queue/messages', (stompMessage: IMessage) => {
          try {
            const parsed: Message = JSON.parse(stompMessage.body);
            if (onMessageReceivedRef.current) {
              onMessageReceivedRef.current(parsed);
            }
          } catch (err) {
            console.error('[WebSocket] Lỗi parse message:', err);
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('[WebSocket STOMP Error]:', frame.headers['message'], frame.body);
      },
    });

    client.activate();// kích hoạt gửi frame connect lên server
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  /**
   * Publish tin nhắn tới endpoint /app/chat.send
   */
  const sendMessage = useCallback((payload: SendMessagePayload): boolean => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
      });
      return true;
    }
    console.warn('[WebSocket] Chưa kết nối, không thể gửi tin');
    return false;
  }, []);

  return {
    isConnected,
    sendMessage,
  };
}

export default useChatWebSocket;
