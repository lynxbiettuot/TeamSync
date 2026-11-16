// Header hiển thị tên, avatar, trạng thái online, nút quay lại trên mobile, nút gọi Video/Thoại và xóa hội thoại
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
  onDeleteConversation?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  conversationName,
  isOnline = false,
  isInCall = false,
  onBack,
  onStartCall,
  onDeleteConversation,
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

      {/* Action buttons góc phải: Gọi và Xóa cuộc trò chuyện */}
      <div className="chat-header-actions-wrap">
        {onStartCall && user && (
          <CallHeaderActions
            partner={user}
            isOnline={isOnline}
            isInCall={isInCall}
            onStartCall={onStartCall}
          />
        )}

        {onDeleteConversation && (
          <button
            type="button"
            className="chat-header-delete-btn"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ cuộc trò chuyện này? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.')) {
                onDeleteConversation();
              }
            }}
            title="Xóa cuộc trò chuyện"
            aria-label="Xóa cuộc trò chuyện"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
