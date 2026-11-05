// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageList } from '../../components/chat/MessageList';
import { MessageInput } from '../../components/chat/MessageInput';
import type {
  Conversation,
  ChatUser,
  Message,
  SendMessagePayload,
  ReactType,
} from '../../types/chat.types';

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const currentUserId = user?.id ? Number(user.id) : undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  // 1. Quản lý tin nhắn & Cursor-based Pagination
  const {
    messages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    chatContainerRef,
    loadOlderMessages,
    appendMessage,
    updateReaction,
  } = useChatMessages({ conversationId: activeConversationId });

  // 2. Tải danh sách hội thoại gần đây khi vào trang
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const list = await chatService.getConversations();
      setConversations(list);
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại:', err);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 3. Xử lý khi có tin nhắn mới từ WebSocket STOMP (/user/queue/messages)
  const handleIncomingMessage = useCallback(
    (newMsg: Message) => {
      const msgConvId = newMsg.conversationId ?? newMsg.conversation_id;

      // Nếu đang mở đúng conversation đó: append tin nhắn vào khung chat & cuộn xuống đáy
      if (activeConversationId && msgConvId === activeConversationId) {
        appendMessage(newMsg);
      }

      // Cập nhật và đẩy cuộc hội thoại lên đầu Sidebar
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === msgConvId);
        const now = new Date().toISOString();

        if (existingIndex > -1) {
          const updatedConv: Conversation = {
            ...prev[existingIndex],
            lastMessage: newMsg.content,
            last_message: newMsg.content,
            updatedAt: newMsg.createdAt || newMsg.created_at || now,
            updated_at: newMsg.createdAt || newMsg.created_at || now,
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
    [activeConversationId, appendMessage, fetchConversations]
  );

  // 4. Khởi tạo kết nối STOMP WebSocket
  const { isConnected, sendMessage, sendReaction } = useChatWebSocket({
    onMessageReceived: handleIncomingMessage,
    onReactionReceived: (event) => {
      updateReaction(event.messageId, event.reaction);
    },
  });

  // 5. Chọn cuộc hội thoại
  const handleSelectConversation = (conversationId: number, otherUser?: ChatUser) => {
    setActiveConversationId(conversationId);
    setReplyingMessage(null); // Đổi cuộc trò chuyện thì xóa trạng thái reply đang chờ
    if (otherUser) {
      setActiveChatUser(otherUser);
    } else {
      const found = conversations.find((c) => c.id === conversationId);
      setActiveChatUser(found?.otherUser || null);
    }
  };

  // 6. Gửi tin nhắn qua STOMP (/app/chat.send)
  const handleSendMessage = (content: string) => {
    if (!activeConversationId) return;

    // Tìm receiver_id từ activeChatUser hoặc otherUser trong conversation
    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const receiverId = activeChatUser?.id || currentConv?.otherUser?.id;

    if (!receiverId) {
      console.warn('Không xác định được receiver_id');
      return;
    }

    const payload: SendMessagePayload = {
      conversation_id: activeConversationId,
      receiver_id: receiverId,
      content,
      message_type: 'TEXT',
      reply_to_message_id: replyingMessage ? replyingMessage.id : null,
      replyToMessageId: replyingMessage ? replyingMessage.id : null,
    };

    const sent = sendMessage(payload);

    if (sent) {
      // Sau khi gửi thành công, reset trạng thái reply
      setReplyingMessage(null);

      // Cập nhật tin nhắn lên đầu sidebar ngay lập tức
      const now = new Date().toISOString();
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === activeConversationId);
        if (existingIndex > -1) {
          const updatedConv = {
            ...prev[existingIndex],
            lastMessage: content,
            last_message: content,
            updatedAt: now,
            updated_at: now,
          };
          const nextList = [...prev];
          nextList.splice(existingIndex, 1);
          return [updatedConv, ...nextList];
        }
        return prev;
      });
    }
  };

  // 7. Gửi reaction qua STOMP (/app/chat.react)
  const handleReactMessage = (messageId: number, reactType: ReactType) => {
    if (!activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const receiverId = activeChatUser?.id || currentConv?.otherUser?.id;

    if (!receiverId) {
      console.warn('Không xác định được receiver_id để thả reaction');
      return;
    }

    sendReaction({
      conversationId: activeConversationId,
      messageId,
      receiverId,
      reactType,
    });
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F8FAFC',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          height: '60px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            T
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>TeamSync</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Status Indicator: Trạng thái kết nối WebSocket */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: isConnected ? '#16A34A' : '#DC2626',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#16A34A' : '#DC2626',
              }}
            />
            {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </div>

          {/* User Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
              {user?.displayName || user?.email}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                color: '#64748B',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar: Danh sách chat và tìm kiếm người dùng */}
        <ChatSidebar
          conversations={conversations}
          isLoading={isLoadingConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onConversationCreated={fetchConversations}
        />

        {/* Right Section: Khung Chat */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#F1F5F9',
            overflow: 'hidden',
          }}
        >
          {activeConversationId ? (
            <>
              {/* Header: Tên và Avatar người đang chat */}
              <ChatHeader
                user={activeChatUser || activeConv?.otherUser}
                conversationName={activeConv?.name}
              />

              {/* Message List: Khung hiển thị tin nhắn (có scroll, cursor-based pagination) */}
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                hasMore={hasMore}
                isLoadingInitial={isLoadingInitial}
                isLoadingMore={isLoadingMore}
                chatContainerRef={chatContainerRef}
                onScrollToTop={loadOlderMessages}
                onReplyMessage={setReplyingMessage}
                onReactMessage={handleReactMessage}
              />

              {/* Message Input: Ô nhập tin nhắn và nút Gửi */}
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!isConnected && false} // Vẫn cho phép gõ tin nhắn
                replyingMessage={replyingMessage}
                onCancelReply={() => setReplyingMessage(null)}
              />
            </>
          ) : (
            /* Khi chưa chọn cuộc hội thoại nào */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                gap: '12px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                💬
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                Chào mừng bạn đến với TeamSync Chat
              </div>
              <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '360px', margin: 0 }}>
                Hãy tìm kiếm người dùng ở ô bên trái hoặc chọn một cuộc hội thoại gần đây để bắt đầu
                nhắn tin.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
