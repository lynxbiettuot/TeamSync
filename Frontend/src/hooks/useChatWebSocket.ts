// src/hooks/useChatWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { tokenStorage } from '../services/apiClient';
import type {
  Message,
  SendMessagePayload,
  SendReactionPayload,
  ReactionWebSocketEvent,
  UserPresenceEvent,
  NotificationItem,
} from '../types/chat.types';

interface UseChatWebSocketProps {
  onMessageReceived: (message: Message) => void;
  onReactionReceived?: (event: ReactionWebSocketEvent) => void;
  onPresenceReceived?: (event: UserPresenceEvent) => void;
  onNotificationReceived?: (notification: NotificationItem) => void;
}

export function useChatWebSocket({
  onMessageReceived,
  onReactionReceived,
  onPresenceReceived,
  onNotificationReceived,
}: UseChatWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onReactionReceivedRef = useRef(onReactionReceived);
  const onPresenceReceivedRef = useRef(onPresenceReceived);
  const onNotificationReceivedRef = useRef(onNotificationReceived);

  // Giữ ref callback mới nhất tránh re-subscribe không cần thiết
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onReactionReceivedRef.current = onReactionReceived;
    onPresenceReceivedRef.current = onPresenceReceived;
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onMessageReceived, onReactionReceived, onPresenceReceived, onNotificationReceived]);

  useEffect(() => {
    const token = tokenStorage.get();

    const client = new Client({
      // Dùng SockJS làm webSocketFactory để tương thích cấu hình Spring Boot withSockJS()
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        //STOM frame connect
        Authorization: token ? `Bearer ${token}` : '',
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);

        // 1. Lắng nghe tin nhắn đến riêng cho user tại /user/queue/messages
        client.subscribe('/user/queue/messages', (stompMessage: IMessage) => {
          try {
            const parsed = JSON.parse(stompMessage.body);
            if (parsed && parsed.type === 'REACTION') {
              if (onReactionReceivedRef.current) {
                onReactionReceivedRef.current(parsed as ReactionWebSocketEvent);
              }
            } else {
              if (onMessageReceivedRef.current) {
                onMessageReceivedRef.current(parsed as Message);
              }
            }
          } catch (err) {
            console.error('[WebSocket] Lỗi parse message:', err);
          }
        });

        // 2. Lắng nghe trạng thái Online / Offline từ kênh chung /topic/presence
        client.subscribe('/topic/presence', (stompMessage: IMessage) => {
          try {
            const parsed = JSON.parse(stompMessage.body) as UserPresenceEvent;
            if (onPresenceReceivedRef.current && parsed && parsed.userId) {
              onPresenceReceivedRef.current(parsed);
            }
          } catch (err) {
            console.error('[WebSocket] Lỗi parse presence event:', err);
          }
        });

        // 3. Lắng nghe thông báo realtime từ RabbitMQ Consumer tại /user/queue/notifications
        client.subscribe('/user/queue/notifications', (stompMessage: IMessage) => {
          try {
            const raw = JSON.parse(stompMessage.body) as Record<string, unknown>;
            if (onNotificationReceivedRef.current && raw && raw.id) {
              const notification: NotificationItem = {
                id: Number(raw.id),
                notificationType:
                  (raw.notificationType as NotificationItem['notificationType']) || 'MESSAGE',
                content: String(raw.content ?? ''),
                referenceId:
                  raw.referenceId !== undefined && raw.referenceId !== null
                    ? Number(raw.referenceId)
                    : null,
                isRead: Boolean(raw.isRead ?? raw.read),
                createdAt: String(raw.createdAt ?? ''),
              };
              onNotificationReceivedRef.current(notification);
            }
          } catch (err) {
            console.error('[WebSocket] Lỗi parse notification event:', err);
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

    client.activate(); // kích hoạt gửi frame connect lên server
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

  /**
   * Publish reaction tới endpoint /app/chat.react
   */
  const sendReaction = useCallback((payload: SendReactionPayload): boolean => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.react',
        body: JSON.stringify(payload),
      });
      return true;
    }
    console.warn('[WebSocket] Chưa kết nối, không thể gửi reaction');
    return false;
  }, []);

  return {
    isConnected,
    sendMessage,
    sendReaction,
  };
}

export default useChatWebSocket;
