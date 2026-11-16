// src/hooks/useChatWebSocket.ts
// Hook quản lý kết nối STOMP WebSocket: tin nhắn, reaction, presence, notification và báo hiệu cuộc gọi WebRTC
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { tokenStorage } from '../services/apiClient';
import type {
  Message,
  SendMessagePayload,
  SendReactionPayload,
  ReactionWebSocketEvent,
  MessageEditEvent,
  MessageDeleteEvent,
  ConversationDeleteEvent,
  UserPresenceEvent,
  NotificationItem,
} from '../types/chat.types';
import type { CallSignalPayload } from '../types/call.types';

interface UseChatWebSocketProps {
  onMessageReceived: (message: Message) => void;
  onReactionReceived?: (event: ReactionWebSocketEvent) => void;
  onMessageEdited?: (event: MessageEditEvent) => void;
  onMessageDeleted?: (event: MessageDeleteEvent) => void;
  onConversationDeleted?: (event: ConversationDeleteEvent) => void;
  onPresenceReceived?: (event: UserPresenceEvent) => void;
  onNotificationReceived?: (notification: NotificationItem) => void;
  onCallSignalReceived?: (signal: CallSignalPayload) => void;
}

export function useChatWebSocket({
  onMessageReceived,
  onReactionReceived,
  onMessageEdited,
  onMessageDeleted,
  onConversationDeleted,
  onPresenceReceived,
  onNotificationReceived,
  onCallSignalReceived,
}: UseChatWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onReactionReceivedRef = useRef(onReactionReceived);
  const onMessageEditedRef = useRef(onMessageEdited);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onConversationDeletedRef = useRef(onConversationDeleted);
  const onPresenceReceivedRef = useRef(onPresenceReceived);
  const onNotificationReceivedRef = useRef(onNotificationReceived);
  const onCallSignalReceivedRef = useRef(onCallSignalReceived);

  // Giữ ref callback mới nhất tránh re-subscribe không cần thiết
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onReactionReceivedRef.current = onReactionReceived;
    onMessageEditedRef.current = onMessageEdited;
    onMessageDeletedRef.current = onMessageDeleted;
    onConversationDeletedRef.current = onConversationDeleted;
    onPresenceReceivedRef.current = onPresenceReceived;
    onNotificationReceivedRef.current = onNotificationReceived;
    onCallSignalReceivedRef.current = onCallSignalReceived;
  }, [
    onMessageReceived,
    onReactionReceived,
    onMessageEdited,
    onMessageDeleted,
    onConversationDeleted,
    onPresenceReceived,
    onNotificationReceived,
    onCallSignalReceived,
  ]);

  useEffect(() => {
    const token = tokenStorage.get();

    const client = new Client({
      // Dùng SockJS làm webSocketFactory kết nối tương đối qua Vite Proxy (/ws)
      webSocketFactory: () => new SockJS('/ws'),
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
            } else if (parsed && parsed.type === 'MESSAGE_EDIT') {
              if (onMessageEditedRef.current) {
                onMessageEditedRef.current(parsed as MessageEditEvent);
              }
            } else if (parsed && parsed.type === 'MESSAGE_DELETE') {
              if (onMessageDeletedRef.current) {
                onMessageDeletedRef.current(parsed as MessageDeleteEvent);
              }
            } else if (parsed && parsed.type === 'CONVERSATION_DELETE') {
              if (onConversationDeletedRef.current) {
                onConversationDeletedRef.current(parsed as ConversationDeleteEvent);
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

        // 4. Lắng nghe tín hiệu WebRTC Call (Offer/Answer/Candidate/End) tại /user/queue/call
        client.subscribe('/user/queue/call', (stompMessage: IMessage) => {
          try {
            const signal = JSON.parse(stompMessage.body) as CallSignalPayload;
            if (onCallSignalReceivedRef.current && signal && signal.type) {
              onCallSignalReceivedRef.current(signal);
            }
          } catch (err) {
            console.error('[WebSocket] Lỗi parse call signal event:', err);
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

  /**
   * Publish tín hiệu WebRTC tới endpoint /app/call.signal
   */
  const sendCallSignal = useCallback((payload: CallSignalPayload): boolean => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/call.signal',
        body: JSON.stringify(payload),
      });
      return true;
    }
    console.warn('[WebSocket] Chưa kết nối, không thể gửi tín hiệu gọi');
    return false;
  }, []);

  return {
    isConnected,
    sendMessage,
    sendReaction,
    sendCallSignal,
  };
}

export default useChatWebSocket;
