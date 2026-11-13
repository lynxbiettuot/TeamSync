// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { e2eeService } from '../../services/e2eeService';
import { useConversations } from '../../hooks/useConversations';
import { useChatPresence } from '../../hooks/useChatPresence';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { ChatSidebar } from '../../components/chat/ChatSidebar/ChatSidebar';
import { ChatHeader } from '../../components/chat/ChatHeader/ChatHeader';
import { MessageList } from '../../components/chat/MessageList/MessageList';
import { MessageInput } from '../../components/chat/MessageInput/MessageInput';
import { NotificationBell } from '../../components/chat/Notification/NotificationBell';
import { NotificationToast } from '../../components/chat/Notification/NotificationToast';
import './ChatPage.css';
import type { Message, SendMessagePayload, ReactType } from '../../types/chat.types';

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const currentUserId = user?.id ? Number(user.id) : undefined;

  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  // 1. Quản lý danh sách hội thoại & chọn cuộc trò chuyện
  const {
    conversations,
    isLoadingConversations,
    activeConversationId,
    activeChatUser,
    selectConversation,
    updateLastMessage,
  } = useConversations(currentUserId);

  // 2. Quản lý trạng thái Online / Offline từ Redis qua WebSocket
  const { onlineUserIds, handlePresenceReceived } = useChatPresence();

  // 3. Quản lý thông báo realtime từ RabbitMQ & chuông thông báo
  const {
    notifications,
    toastNotification,
    unreadCount,
    handleNotificationReceived,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleDismissToast,
  } = useChatNotifications({
    activeConversationId,
    onNavigateToConversation: selectConversation,
  });

  // 4. Quản lý tin nhắn, cuộn trang & giải mã E2EE tự động
  const {
    messages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    chatContainerRef,
    loadOlderMessages,
    appendMessage,
    updateReaction,
  } = useChatMessages({
    conversationId: activeConversationId,
    currentUserId,
    activeChatUser,
  });

  // 5. Khởi tạo cặp khóa E2EE trong IndexedDB & luôn đồng bộ lên Server
  useEffect(() => {
    if (currentUserId) {
      e2eeService.initE2EE(currentUserId).catch((err) => {
        console.error('[E2EE] Lỗi khởi tạo E2EE:', err);
      });
    }
  }, [currentUserId]);

  // 6. Xử lý khi nhận tin nhắn mới từ WebSocket (/user/queue/messages)
  const handleIncomingMessage = useCallback(
    async (newMsg: Message) => {
      const msgConvId = newMsg.conversationId ?? newMsg.conversation_id;
      let decryptedContent = newMsg.content;

      // Tìm thông tin người bạn chat để giải mã
      const currentConv = conversations.find((c) => c.id === msgConvId);
      const partnerUser =
        currentConv?.otherUser || (activeConversationId === msgConvId ? activeChatUser : null);

      if (currentUserId && partnerUser?.id) {
        let pubKey = partnerUser.publicKey;
        if (!pubKey) {
          pubKey = await e2eeService.fetchLatestPublicKey(partnerUser.id);
        }

        if (pubKey) {
          try {
            const sharedKey = await e2eeService.getSharedKey(
              currentUserId,
              partnerUser.id,
              pubKey
            );
            if (sharedKey) {
              decryptedContent = await e2eeService.decryptMessage(newMsg.content, sharedKey);
            }
          } catch (err) {
            console.warn('[E2EE] Lỗi giải mã tin nhắn nhận:', err);
          }
        }
      }

      const displayMsg: Message = {
        ...newMsg,
        content: decryptedContent,
      };

      if (activeConversationId && msgConvId === activeConversationId) {
        appendMessage(displayMsg);
      }

      // Cập nhật nội dung đã giải mã lên Sidebar
      if (msgConvId) {
        updateLastMessage(
          msgConvId,
          decryptedContent,
          newMsg.createdAt || newMsg.created_at
        );
      }
    },
    [activeConversationId, activeChatUser, appendMessage, conversations, currentUserId, updateLastMessage]
  );

  // 7. Khởi tạo WebSocket STOMP
  const { isConnected, sendMessage, sendReaction } = useChatWebSocket({
    onMessageReceived: handleIncomingMessage,
    onReactionReceived: (event) => {
      updateReaction(event.messageId, event.reaction);
    },
    onPresenceReceived: handlePresenceReceived,
    onNotificationReceived: handleNotificationReceived,
  });

  // 8. Gửi tin nhắn qua STOMP (/app/chat.send) với E2EE
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !currentUserId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const receiverId = activeChatUser?.id || currentConv?.otherUser?.id;
    let receiverPublicKey = activeChatUser?.publicKey || currentConv?.otherUser?.publicKey;

    if (!receiverId) {
      console.warn('Không xác định được receiver_id');
      return;
    }

    // Nếu trong state chưa có thì lấy trực tiếp từ server
    if (!receiverPublicKey) {
      receiverPublicKey = await e2eeService.fetchLatestPublicKey(receiverId);
    }

    // Mã hóa tin nhắn nếu đối phương có Public Key (E2EE Tier 1)
    let messageContentToSend = content;
    if (receiverPublicKey) {
      try {
        const sharedKey = await e2eeService.getSharedKey(
          currentUserId,
          receiverId,
          receiverPublicKey
        );
        if (sharedKey) {
          messageContentToSend = await e2eeService.encryptMessage(content, sharedKey);
          console.log('[E2EE] Đã mã hóa tin nhắn thành công trước khi gửi!');
        }
      } catch (err) {
        console.error('[E2EE] Lỗi mã hóa tin nhắn, gửi dạng thường:', err);
      }
    }

    const payload: SendMessagePayload = {
      conversation_id: activeConversationId,
      receiver_id: receiverId,
      content: messageContentToSend,
      message_type: 'TEXT',
      reply_to_message_id: replyingMessage ? replyingMessage.id : null,
      replyToMessageId: replyingMessage ? replyingMessage.id : null,
    };

    const sent = sendMessage(payload);

    if (sent) {
      setReplyingMessage(null);
      // Cập nhật text rõ lên Sidebar của người gửi
      updateLastMessage(activeConversationId, content);
    }
  };

  // 9. Gửi reaction qua STOMP (/app/chat.react)
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
  const otherChatUserId = activeChatUser?.id || activeConv?.otherUser?.id;
  const isChatUserOnline = otherChatUserId !== undefined && onlineUserIds.has(otherChatUserId);

  return (
    <div className="chat-page">
      {/* Top Navbar */}
      <header className="chat-navbar">
        <div className="chat-brand">
          <div className="chat-brand-badge">T</div>
          <span className="chat-brand-name">TeamSync</span>
        </div>

        <div className="chat-navbar-actions">
          {/* Trạng thái kết nối WebSocket của chính mình */}
          <div
            className={`chat-ws-status ${
              isConnected ? 'chat-ws-status--online' : 'chat-ws-status--offline'
            }`}
          >
            <span className="chat-ws-dot" />
            {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </div>

          {/* Chuông thông báo */}
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={handleNotificationClick}
            onMarkAllAsRead={handleMarkAllAsRead}
          />

          {/* User Profile & Đăng xuất */}
          <div className="chat-user-menu">
            <span className="chat-user-name">{user?.displayName || user?.email}</span>
            <button onClick={logout} className="chat-logout-btn">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Workspace */}
      <div className="chat-workspace">
        {/* Left Sidebar: Danh sách chat và tìm kiếm người dùng */}
        <ChatSidebar
          conversations={conversations}
          isLoading={isLoadingConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(convId, user) => {
            setReplyingMessage(null);
            selectConversation(convId, user);
          }}
          onlineUserIds={onlineUserIds}
        />

        {/* Right Section: Khung Chat */}
        <main className="chat-main">
          {activeConversationId ? (
            <>
              {/* Header: Tên và Avatar người đang chat */}
              <ChatHeader
                user={activeChatUser || activeConv?.otherUser}
                conversationName={activeConv?.name}
                isOnline={isChatUserOnline}
              />

              {/* Message List: Danh sách tin nhắn & cuộn tải thêm */}
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

              {/* Message Input: Ô soạn thảo và gửi tin nhắn */}
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={false}
                replyingMessage={replyingMessage}
                onCancelReply={() => setReplyingMessage(null)}
              />
            </>
          ) : (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">💬</div>
              <div className="chat-empty-title">Chào mừng bạn đến với TeamSync Chat</div>
              <p className="chat-empty-subtitle">
                Hãy tìm kiếm người dùng ở ô bên trái hoặc chọn một cuộc hội thoại gần đây để bắt đầu
                nhắn tin.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Toast thông báo nổi khi có sự kiện mới */}
      <NotificationToast
        notification={toastNotification}
        onClick={handleNotificationClick}
        onDismiss={handleDismissToast}
      />
    </div>
  );
};

export default ChatPage;
