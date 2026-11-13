// src/components/chat/MessageList/MessageList.tsx
import React, { type UIEvent } from 'react';
import type { Message, ReactType } from '../../../types/chat.types';
import { MessageItem } from '../MessageItem/MessageItem';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  currentUserId?: number;
  hasMore: boolean;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  onScrollToTop: () => void;
  onReplyMessage?: (message: Message) => void;
  onReactMessage?: (messageId: number, reactType: ReactType) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  hasMore,
  isLoadingInitial,
  isLoadingMore,
  chatContainerRef,
  onScrollToTop,
  onReplyMessage,
  onReactMessage,
}) => {
  // Lắng nghe sự kiện scroll để tải thêm khi chạm đỉnh (top)
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Khi cuộn lên chạm đỉnh (scrollTop === 0 hoặc <= 10px để nhạy) và còn dữ liệu để tải
    if (target.scrollTop <= 10 && hasMore && !isLoadingMore && !isLoadingInitial) {
      onScrollToTop();
    }
  };

  // Nếu đang tải tin nhắn lần đầu
  if (isLoadingInitial) {
    return <div className="chat-messages-loading">Đang tải tin nhắn...</div>;
  }

  // Empty State: Nếu cuộc hội thoại chưa có tin nhắn nào, hiển thị "Send a message now" và ẩn phần scroll load thêm
  if (messages.length === 0) {
    return (
      <div className="chat-messages-empty">
        <div className="chat-messages-empty-icon">💬</div>
        <div className="chat-messages-empty-text">Send a message now</div>
      </div>
    );
  }

  return (
    <div ref={chatContainerRef} onScroll={handleScroll} className="chat-messages-list">
      {/* Vùng chỉ báo tải thêm ở đỉnh */}
      {isLoadingMore && (
        <div className="chat-loading-more">
          <span className="chat-spinner" />
          Đang tải thêm tin nhắn cũ...
        </div>
      )}

      {/* Danh sách tin nhắn */}
      {messages.map((m) => {
        const isMe =
          currentUserId !== undefined &&
          (m.senderId === currentUserId ||
            m.sender_id === currentUserId ||
            m.user?.id === currentUserId);
        return (
          <MessageItem
            key={m.id}
            message={m}
            isMe={Boolean(isMe)}
            currentUserId={currentUserId}
            onReply={onReplyMessage}
            onReact={onReactMessage}
          />
        );
      })}
    </div>
  );
};

export default MessageList;
