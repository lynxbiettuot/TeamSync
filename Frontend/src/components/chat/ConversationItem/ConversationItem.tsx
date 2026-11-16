// src/components/chat/ConversationItem/ConversationItem.tsx
// Component hiển thị item cuộc trò chuyện đơn lẻ trong danh sách Sidebar (hỗ trợ cả 1-1 và Nhóm)
import React from 'react';
import type { Conversation } from '../../../types/chat.types';
import './ConversationItem.css';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  currentUserId?: number;
  isOnline?: boolean;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  isOnline = false,
}) => {
  const isGroup = conversation.type === 'GROUP' || conversation.conversationType === 'GROUP';

  const displayName = isGroup
    ? conversation.name || 'Nhóm trò chuyện'
    : conversation.otherUser?.displayName || conversation.name || 'Hội thoại';

  const avatar = isGroup
    ? conversation.avatarUrl || conversation.avatar_url
    : conversation.otherUser?.avatarUrl || conversation.avatarUrl || conversation.avatar_url;

  const initial = displayName.charAt(0).toUpperCase();

  const lastMsg = conversation.lastMessage || conversation.last_message || 'Chưa có tin nhắn nào';

  const timeStr = conversation.updatedAt || conversation.updated_at || '';
  const formattedTime = timeStr
    ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`chat-conv-item ${isActive ? 'chat-conv-item--active' : ''}`}
    >
      {/* Avatar với Chấm Xanh Online (nếu là 1-1) */}
      <div className="chat-conv-avatar-wrap">
        {avatar ? (
          <img src={avatar} alt={displayName} className="chat-conv-avatar-img" />
        ) : (
          <div
            className="chat-conv-avatar-fallback"
            style={isGroup ? { background: '#f5f3ff', color: '#7c3aed' } : undefined}
          >
            {isGroup ? '👥' : initial}
          </div>
        )}

        {!isGroup && isOnline && <span title="Đang hoạt động" className="chat-conv-online-dot" />}
      </div>

      {/* Thông tin hội thoại */}
      <div className="chat-conv-body">
        <div className="chat-conv-top">
          <span className="chat-conv-name">
            {isGroup && <span className="chat-conv-group-badge">Nhóm</span>}
            {displayName}
          </span>
          {formattedTime && <span className="chat-conv-time">{formattedTime}</span>}
        </div>
        <div className="chat-conv-preview">{lastMsg}</div>
      </div>
    </div>
  );
};

export default ConversationItem;
