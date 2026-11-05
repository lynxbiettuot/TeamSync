// src/components/chat/MessageList.tsx
import React, { type UIEvent } from 'react';
import type { Message } from '../../types/chat.types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  currentUserId?: number;
  hasMore: boolean;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  onScrollToTop: () => void;
  onReplyMessage?: (message: Message) => void;
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
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94A3B8',
          fontSize: '14px',
        }}
      >
        Đang tải tin nhắn...
      </div>
    );
  }

  // Empty State: Nếu cuộc hội thoại chưa có tin nhắn nào, hiển thị "Send a message now" và ẩn phần scroll load thêm
  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94A3B8',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '32px' }}>💬</div>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#64748B' }}>
          Send a message now
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Vùng chỉ báo tải thêm ở đỉnh */}
      {isLoadingMore && (
        <div
          style={{
            textAlign: 'center',
            padding: '8px 0',
            fontSize: '12.5px',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid #CBD5E1',
              borderTopColor: '#2563EB',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
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
            onReply={onReplyMessage}
          />
        );
      })}
    </div>
  );
};

export default MessageList;
