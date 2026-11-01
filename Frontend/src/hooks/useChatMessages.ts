// src/hooks/useChatMessages.ts
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { chatService } from '../services/chatService';
import type { Message } from '../types/chat.types';

interface UseChatMessagesProps {
  conversationId: number | null;
}

export function useChatMessages({ conversationId }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(false);
  const shouldScrollToBottomRef = useRef<boolean>(false);

  // 1. Khi đổi conversationId: load danh sách tin nhắn đầu tiên (không truyền beforeId)
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(false);
      return;
    }

    let isCancelled = false;
    setIsLoadingInitial(true);
    setHasMore(true);

    chatService
      .getMessages(conversationId, 20)
      .then((res) => {
        if (isCancelled) return;
        setMessages(res.data || []);
        setHasMore(Boolean(res.hasMore));
        isInitialLoadRef.current = true;
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Lỗi khi tải lịch sử chat:', err);
        setMessages([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingInitial(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [conversationId]);

  // 2. Cuộn lên để tải thêm tin nhắn cũ (Cursor-based Pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !hasMore || isLoadingMore || isLoadingInitial || messages.length === 0) {
      return;
    }

    const container = chatContainerRef.current;
    if (!container) return;

    // Lấy id tin nhắn cũ nhất (tin nhắn trên cùng) làm beforeId
    const oldestMessage = messages[0];
    const beforeId = oldestMessage.id;

    setIsLoadingMore(true);

    try {
      const res = await chatService.getMessages(conversationId, 20, beforeId);
      const older = res.data || [];

      if (older.length === 0) {
        setHasMore(false);
        return;
      }

      // Lưu lại chiều cao hiện tại trước khi prepend
      prevScrollHeightRef.current = container.scrollHeight;
      isPrependRef.current = true;

      // Nối tin nhắn cũ vào đầu mảng
      setMessages((prev) => [...older, ...prev]);
      setHasMore(Boolean(res.hasMore));
    } catch (err) {
      console.error('Lỗi tải thêm tin nhắn cũ:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore, isLoadingInitial, messages]);

  // 3. Xử lý giữ nguyên vị trí cuộn bằng useLayoutEffect (Tránh giật màn hình)
  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (isPrependRef.current) {
      // Khi prepend tin nhắn cũ: điều chỉnh scrollTop theo độ chênh lệch scrollHeight
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;
      container.scrollTop = heightDifference;
      isPrependRef.current = false;
    } else if (isInitialLoadRef.current) {
      // Lần đầu tải tin nhắn xong: cuộn xuống đáy
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
    } else if (shouldScrollToBottomRef.current) {
      // Khi có tin nhắn mới được gửi hoặc nhận
      container.scrollTop = container.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [messages]);

  // Thêm tin nhắn mới vào danh sách (từ WebSocket hoặc người dùng gửi)
  const appendMessage = useCallback((newMsg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) {
        return prev;
      }
      return [...prev, newMsg];
    });
    shouldScrollToBottomRef.current = true;
  }, []);

  return {
    messages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    chatContainerRef,
    loadOlderMessages,
    appendMessage,
  };
}

export default useChatMessages;
