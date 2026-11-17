// Hook quản lý danh sách tin nhắn: tải phân trang, giải mã E2EE 1-1 và K_nhom, sửa và thu hồi tin nhắn realtime
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { e2eeService } from '../services/e2eeService';
import type { Message, MessageReaction, ChatUser, GroupMember } from '../types/chat.types';

interface UseChatMessagesProps {
  conversationId: number | null;
  currentUserId?: number;
  activeChatUser?: ChatUser | null;
  isGroup?: boolean;
  groupMembers?: GroupMember[];
}

/**
 * Helper giải mã danh sách tin nhắn bằng E2EE Shared Key (1-1) hoặc K_nhom (Group)
 */
async function decryptMessageBatch(
  rawMessages: Message[],
  currentUserId?: number,
  partnerUser?: ChatUser | null,
  conversationId?: number | null,
  isGroup?: boolean,
  groupMembers?: GroupMember[]
): Promise<Message[]> {
  if (!currentUserId || !conversationId) {
    return rawMessages;
  }

  // 1. Trường hợp Group Chat: giải mã bằng K_nhom
  if (isGroup) {
    try {
      const groupKey = await e2eeService.getOrFetchGroupKey(
        conversationId,
        currentUserId,
        groupMembers
      );
      if (!groupKey) return rawMessages;

      return await Promise.all(
        rawMessages.map(async (msg) => {
          try {
            const decrypted = await e2eeService.decryptMessage(msg.content, groupKey);
            return { ...msg, content: decrypted };
          } catch {
            return msg;
          }
        })
      );
    } catch (err) {
      console.warn('[E2EE] Lỗi giải mã batch tin nhắn nhóm:', err);
      return rawMessages;
    }
  }

  // 2. Trường hợp Direct Chat 1-1: giải mã bằng ECDH Pairwise Shared Key
  if (!partnerUser?.id) {
    return rawMessages;
  }

  let partnerPubKey = partnerUser.publicKey;
  if (!partnerPubKey) {
    partnerPubKey = await e2eeService.fetchLatestPublicKey(partnerUser.id);
  }

  if (!partnerPubKey) {
    return rawMessages;
  }

  try {
    const sharedKey = await e2eeService.getSharedKey(
      currentUserId,
      partnerUser.id,
      partnerPubKey
    );

    if (!sharedKey) return rawMessages;

    return await Promise.all(
      rawMessages.map(async (msg) => {
        try {
          const decrypted = await e2eeService.decryptMessage(msg.content, sharedKey);
          return { ...msg, content: decrypted };
        } catch {
          return msg;
        }
      })
    );
  } catch (err) {
    console.warn('[E2EE] Lỗi giải mã batch tin nhắn 1-1:', err);
    return rawMessages;
  }
}

export function useChatMessages({
  conversationId,
  currentUserId,
  activeChatUser,
  isGroup,
  groupMembers,
}: UseChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(false);
  const shouldScrollToBottomRef = useRef<boolean>(false);

  // 1. Khi đổi conversationId hoặc activeChatUser: load tin nhắn và giải mã E2EE
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
      .then(async (res) => {
        if (isCancelled) return;
        const rawList = res.data || [];
        const decryptedList = await decryptMessageBatch(
          rawList,
          currentUserId,
          activeChatUser,
          conversationId,
          isGroup,
          groupMembers
        );

        if (isCancelled) return;
        setMessages(decryptedList);
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
  }, [conversationId, currentUserId, activeChatUser, isGroup, groupMembers]);

  // 2. Cuộn lên để tải thêm tin nhắn cũ (Cursor-based Pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !hasMore || isLoadingMore || isLoadingInitial || messages.length === 0) {
      return;
    }

    const container = chatContainerRef.current;
    if (!container) return;

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

      // Giải mã E2EE cho các tin nhắn cũ vừa tải về
      const decryptedOlder = await decryptMessageBatch(
        older,
        currentUserId,
        activeChatUser,
        conversationId,
        isGroup,
        groupMembers
      );

      // Lưu lại chiều cao hiện tại trước khi prepend
      prevScrollHeightRef.current = container.scrollHeight;
      isPrependRef.current = true;

      // Nối tin nhắn cũ vào đầu mảng
      setMessages((prev) => [...decryptedOlder, ...prev]);
      setHasMore(Boolean(res.hasMore));
    } catch (err) {
      console.error('Lỗi tải thêm tin nhắn cũ:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore, isLoadingInitial, messages, currentUserId, activeChatUser, isGroup, groupMembers]);

  // 3. Xử lý giữ nguyên vị trí cuộn bằng useLayoutEffect (Tránh giật màn hình)
  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (isPrependRef.current) {
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;
      container.scrollTop = heightDifference;
      isPrependRef.current = false;
    } else if (isInitialLoadRef.current) {
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
    } else if (shouldScrollToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [messages]);

  // Thêm tin nhắn mới vào danh sách
  const appendMessage = useCallback((newMsg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) {
        return prev;
      }
      return [...prev, newMsg];
    });
    shouldScrollToBottomRef.current = true;
  }, []);

  // Cập nhật reaction của một tin nhắn
  const updateReaction = useCallback((messageId: number, reaction: MessageReaction) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const currentReactions = msg.reactions || [];
        let updatedReactions: MessageReaction[];

        if (!reaction.reactType) {
          updatedReactions = currentReactions.filter((r) => r.userId !== reaction.userId);
        } else {
          const existingIdx = currentReactions.findIndex((r) => r.userId === reaction.userId);
          if (existingIdx > -1) {
            updatedReactions = [...currentReactions];
            updatedReactions[existingIdx] = reaction;
          } else {
            updatedReactions = [...currentReactions, reaction];
          }
        }

        return {
          ...msg,
          reactions: updatedReactions,
        };
      })
    );
  }, []);

  // Cập nhật tin nhắn sau khi được chỉnh sửa
  const handleMessageEdited = useCallback(async (editedMsg: Message) => {
    let finalContent = editedMsg.content;
    if (isGroup && conversationId && currentUserId) {
      try {
        const groupKey = await e2eeService.getOrFetchGroupKey(conversationId, currentUserId, groupMembers);
        if (groupKey) {
          finalContent = await e2eeService.decryptMessage(editedMsg.content, groupKey);
        }
      } catch (err) {
        console.warn('[E2EE] Lỗi giải mã tin nhắn nhóm đã sửa:', err);
      }
    } else if (currentUserId && activeChatUser?.id) {
      try {
        let partnerPubKey = activeChatUser.publicKey;
        if (!partnerPubKey) {
          partnerPubKey = await e2eeService.fetchLatestPublicKey(activeChatUser.id);
        }
        if (partnerPubKey) {
          const sharedKey = await e2eeService.getSharedKey(currentUserId, activeChatUser.id, partnerPubKey);
          if (sharedKey) {
            finalContent = await e2eeService.decryptMessage(editedMsg.content, sharedKey);
          }
        }
      } catch (err) {
        console.warn('[E2EE] Lỗi giải mã tin nhắn 1-1 đã sửa:', err);
      }
    }

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== editedMsg.id) return msg;
        return {
          ...msg,
          content: finalContent,
          updatedAt: editedMsg.updatedAt || new Date().toISOString(),
          isDeleted: false,
        };
      })
    );
  }, [conversationId, isGroup, groupMembers, currentUserId, activeChatUser]);

  // Đánh dấu tin nhắn đã bị thu hồi
  const handleMessageDeleted = useCallback((messageId: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        return {
          ...msg,
          content: 'Tin nhắn đã bị thu hồi',
          isDeleted: true,
        };
      })
    );
  }, []);

  return {
    messages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    chatContainerRef,
    loadOlderMessages,
    appendMessage,
    updateReaction,
    handleMessageEdited,
    handleMessageDeleted,
  };
}

export default useChatMessages;
