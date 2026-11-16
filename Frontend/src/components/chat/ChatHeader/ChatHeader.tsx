// src/components/chat/ChatHeader/ChatHeader.tsx
// Header hiển thị tên, avatar, trạng thái online, nút quay lại trên mobile và các nút gọi Video/Thoại
import React from 'react';
import type { ChatUser } from '../../../types/chat.types';
import type { CallType } from '../../../types/call.types';
import { CallHeaderActions } from '../VideoCall/CallHeaderActions';
import { BackArrowIcon } from '../VideoCall/CallIcons';
import './ChatHeader.css';

interface ChatHeaderProps {
  user?: ChatUser | null;
  conversationName?: string | null;
  isOnline?: boolean;
  isInCall?: boolean;
  onBack?: () => void;
  onStartCall?: (partner: ChatUser, type: CallType) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  conversationName,
  isOnline = false,
  isInCall = false,
  onBack,
  onStartCall,
}) => {
  const displayName = user?.displayName || conversationName || 'Cuộc trò chuyện';
  const avatar = user?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="chat-header">
      {/* Nút quay lại trên mobile */}
      {onBack && (
        <button
          type="button"
          className="chat-header-back-btn"
          onClick={onBack}
          aria-label="Quay lại danh sách hội thoại"
        >
          <BackArrowIcon size={20} />
        </button>
      )}

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
      <div className="chat-header-info">
        <div className="chat-header-name">{displayName}</div>
        <div
          className={`chat-header-status ${
            isOnline ? 'chat-header-status--online' : 'chat-header-status--offline'
          }`}
        >
          {isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
        </div>
      </div>

      {/* Nút Gọi Thoại và Video ở góc phải */}
      {onStartCall && user && (
        <CallHeaderActions
          partner={user}
          isOnline={isOnline}
          isInCall={isInCall}
          onStartCall={onStartCall}
        />
      )}
    </div>
  );
};

export default ChatHeader;
