import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { e2eeService } from '../services/e2eeService';
import type { Conversation, ChatUser } from '../types/chat.types';

export function useConversations(currentUserId?: number) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);

  // Helper giải mã lastMessage của danh sách cuộc hội thoại để hiển thị trên Sidebar
  const decryptConversationLastMessages = useCallback(
    async (rawList: Conversation[]): Promise<Conversation[]> => {
      if (!currentUserId) return rawList;

      return await Promise.all(
        rawList.map(async (conv) => {
          const other = conv.otherUser;
          if (!other || !other.publicKey || !conv.lastMessage) return conv;

          try {
            const sharedKey = await e2eeService.getSharedKey(currentUserId, other.id, other.publicKey);
            if (sharedKey) {
              const decrypted = await e2eeService.decryptMessage(conv.lastMessage, sharedKey);
              return {
                ...conv,
                lastMessage: decrypted,
                last_message: decrypted,
              };
            }
          } catch {
            // Giữ nguyên nếu giải mã thất bại
          }
          return conv;
        })
      );
    },
    [currentUserId]
  );

  // Tải danh sách hội thoại gần đây
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const list = await chatService.getConversations();
      const decryptedList = await decryptConversationLastMessages(list);
      setConversations(decryptedList);
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại:', err);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [decryptConversationLastMessages]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Chọn cuộc hội thoại
  const selectConversation = useCallback(
    (conversationId: number, otherUser?: ChatUser) => {
      setActiveConversationId(conversationId);
      if (otherUser) {
        setActiveChatUser(otherUser);
      } else {
        const found = conversations.find((c) => c.id === conversationId);
        setActiveChatUser(found?.otherUser || null);
      }
    },
    [conversations]
  );

  // Cập nhật tin nhắn cuối cùng và đẩy hội thoại lên đầu Sidebar
  const updateLastMessage = useCallback(
    (conversationId: number, lastMessage: string, timestamp?: string) => {
      const now = timestamp || new Date().toISOString();
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === conversationId);
        if (existingIndex > -1) {
          const updatedConv: Conversation = {
            ...prev[existingIndex],
            lastMessage,
            last_message: lastMessage,
            updatedAt: now,
            updated_at: now,
          };
          const nextList = [...prev];
          nextList.splice(existingIndex, 1);
          return [updatedConv, ...nextList];
        }

        // Nếu là conversation mới chưa có trong list, fetch lại toàn bộ
        fetchConversations();
        return prev;
      });
    },
    [fetchConversations]
  );

  return {
    conversations,
    setConversations,
    isLoadingConversations,
    activeConversationId,
    setActiveConversationId,
    activeChatUser,
    setActiveChatUser,
    fetchConversations,
    selectConversation,
    updateLastMessage,
  };
}

export default useConversations;

