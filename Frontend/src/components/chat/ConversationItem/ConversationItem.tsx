// src/components/chat/ConversationItem/ConversationItem.tsx
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
  // Ưu tiên tên của đối phương (nếu có otherUser) hoặc tên nhóm
  const displayName =
    conversation.otherUser?.displayName ||
    conversation.name ||
    'Hội thoại';

  const avatar = conversation.otherUser?.avatarUrl || conversation.avatarUrl || conversation.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  // Tin nhắn cuối cùng
  const lastMsg = conversation.lastMessage || conversation.last_message || 'Chưa có tin nhắn nào';

  // Định dạng thời gian
  const timeStr = conversation.updatedAt || conversation.updated_at || '';
  const formattedTime = timeStr
    ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`chat-conv-item ${isActive ? 'chat-conv-item--active' : ''}`}
    >
      {/* Avatar với Chấm Xanh Online */}
      <div className="chat-conv-avatar-wrap">
        {avatar ? (
          <img src={avatar} alt={displayName} className="chat-conv-avatar-img" />
        ) : (
          <div className="chat-conv-avatar-fallback">{initial}</div>
        )}

        {/* Chấm tròn xanh báo Online */}
        {isOnline && <span title="Đang hoạt động" className="chat-conv-online-dot" />}
      </div>

      {/* Thông tin hội thoại */}
      <div className="chat-conv-body">
        <div className="chat-conv-top">
          <span className="chat-conv-name">{displayName}</span>
          {formattedTime && <span className="chat-conv-time">{formattedTime}</span>}
        </div>
        <div className="chat-conv-preview">{lastMsg}</div>
      </div>
    </div>
  );
};

export default ConversationItem;
