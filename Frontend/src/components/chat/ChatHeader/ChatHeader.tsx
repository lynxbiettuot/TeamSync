// src/components/chat/ChatHeader/ChatHeader.tsx
import React from 'react';
import type { ChatUser } from '../../../types/chat.types';
import './ChatHeader.css';

interface ChatHeaderProps {
  user?: ChatUser | null;
  conversationName?: string | null;
  isOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  conversationName,
  isOnline = false,
}) => {
  const displayName = user?.displayName || conversationName || 'Cuộc trò chuyện';
  const avatar = user?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="chat-header">
      {/* Avatar với Chấm Trạng Thái */}
      <div className="chat-header-avatar-wrap">
        {avatar ? (
          <img src={avatar} alt={displayName} className="chat-header-avatar-img" />
        ) : (
          <div className="chat-header-avatar-fallback">{initial}</div>
        )}

        {/* Chấm tròn báo trạng thái */}
        <span
          title={isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
          className={`chat-header-dot ${
            isOnline ? 'chat-header-dot--online' : 'chat-header-dot--offline'
          }`}
        />
      </div>

      {/* Tên và Trạng thái */}
      <div>
        <div className="chat-header-name">{displayName}</div>
        <div
          className={`chat-header-status ${
            isOnline ? 'chat-header-status--online' : 'chat-header-status--offline'
          }`}
        >
          {isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
