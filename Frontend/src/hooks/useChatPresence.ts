import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import type { UserPresenceEvent } from '../types/chat.types';

export function useChatPresence() {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  // Lấy danh sách các userId đang Online ban đầu từ Redis
  useEffect(() => {
    chatService.getOnlineUsers().then((ids) => {
      if (ids && ids.length > 0) {
        setOnlineUserIds(new Set(ids));
      }
    });
  }, []);

  // Callback xử lý sự kiện presence realtime từ WebSocket (/topic/presence)
  const handlePresenceReceived = useCallback((event: UserPresenceEvent) => {
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      if (event.status === 'ONLINE') {
        next.add(event.userId);
      } else {
        next.delete(event.userId);
      }
      return next;
    });
  }, []);

  return {
    onlineUserIds,
    handlePresenceReceived,
  };
}

export default useChatPresence;

