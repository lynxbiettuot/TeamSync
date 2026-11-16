// src/components/chat/ChatHeader/ChatHeader.tsx
// Header hiển thị tên, avatar, trạng thái online, nút quay lại, nút gọi Video (1-1) và nút quản lý thông tin nhóm (Group)
import React, { useState } from 'react';
import type { ChatUser, Conversation } from '../../../types/chat.types';
import type { CallType } from '../../../types/call.types';
import { CallHeaderActions } from '../VideoCall/CallHeaderActions';
import { BackArrowIcon } from '../VideoCall/CallIcons';
import { GroupDetailsModal } from '../GroupModal/GroupDetailsModal';
import './ChatHeader.css';

interface ChatHeaderProps {
  user?: ChatUser | null;
  conversation?: Conversation | null;
  conversationName?: string | null;
  isOnline?: boolean;
  isInCall?: boolean;
  onBack?: () => void;
  onStartCall?: (partner: ChatUser, type: CallType) => void;
  onDeleteConversation?: () => void;
  onUpdateGroupName?: (conversationId: number, newName: string) => Promise<void>;
  onAddMembers?: (conversationId: number, memberIds: number[]) => Promise<void>;
  onRemoveMember?: (conversationId: number, targetUserId: number) => Promise<void>;
  onLeaveGroup?: (conversationId: number) => Promise<void>;
  currentUserId?: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  conversation,
  conversationName,
  isOnline = false,
  isInCall = false,
  onBack,
  onStartCall,
  onDeleteConversation,
  onUpdateGroupName,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  currentUserId,
}) => {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const isGroup = conversation?.type === 'GROUP' || conversation?.conversationType === 'GROUP';

  const displayName = isGroup
    ? conversation?.name || conversationName || 'Nhóm trò chuyện'
    : user?.displayName || conversationName || 'Cuộc trò chuyện';

  const avatar = isGroup
    ? conversation?.avatarUrl || conversation?.avatar_url
    : user?.avatarUrl;

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

      {/* Avatar với Chấm Trạng Thái (1-1) hoặc Biểu tượng nhóm */}
      <div className="chat-header-avatar-wrap">
        {avatar ? (
          <img src={avatar} alt={displayName} className="chat-header-avatar-img" />
        ) : (
          <div
            className="chat-header-avatar-fallback"
            style={isGroup ? { background: '#f5f3ff', color: '#7c3aed' } : undefined}
          >
            {isGroup ? '👥' : initial}
          </div>
        )}

        {/* Chấm tròn báo trạng thái (chỉ 1-1) */}
        {!isGroup && (
          <span
            title={isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
            className={`chat-header-dot ${
              isOnline ? 'chat-header-dot--online' : 'chat-header-dot--offline'
            }`}
          />
        )}
      </div>

      {/* Tên và Trạng thái / Số lượng thành viên */}
      <div className="chat-header-info">
        <div className="chat-header-name">{displayName}</div>
        <div
          className={`chat-header-status ${
            !isGroup && isOnline ? 'chat-header-status--online' : 'chat-header-status--offline'
          }`}
        >
          {isGroup
            ? `${conversation?.members?.length || 0} thành viên`
            : isOnline
            ? 'Đang hoạt động'
            : 'Không hoạt động'}
        </div>
      </div>

      {/* Action buttons góc phải: Gọi (1-1), Xem thông tin nhóm (Group) và Xóa cuộc trò chuyện */}
      <div className="chat-header-actions-wrap">
        {/* Nút mở modal thông tin nhóm nếu là Group */}
        {isGroup && (
          <button
            type="button"
            className="chat-header-group-btn"
            onClick={() => setIsGroupModalOpen(true)}
            title="Xem thông tin và thành viên nhóm"
            aria-label="Thông tin nhóm"
          >
            👥
          </button>
        )}

        {/* Nút gọi Video / Thoại nếu là 1-1 */}
        {!isGroup && onStartCall && user && (
          <CallHeaderActions
            partner={user}
            isOnline={isOnline}
            isInCall={isInCall}
            onStartCall={onStartCall}
          />
        )}

        {/* Nút xóa cuộc trò chuyện (1-1) */}
        {!isGroup && onDeleteConversation && (
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

      {/* Modal chi tiết nhóm */}
      {isGroup && conversation && (
        <GroupDetailsModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          conversation={conversation}
          currentUserId={currentUserId}
          onUpdateGroupName={onUpdateGroupName || (async () => {})}
          onAddMembers={onAddMembers || (async () => {})}
          onRemoveMember={onRemoveMember || (async () => {})}
          onLeaveGroup={onLeaveGroup || (async () => {})}
          onDisbandGroup={onDeleteConversation ? (async () => onDeleteConversation()) : (async () => {})}
        />
      )}
    </div>
  );
};

export default ChatHeader;
