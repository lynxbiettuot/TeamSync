// src/components/chat/ConversationItem.tsx
import React from 'react';
import type { Conversation } from '../../types/chat.types';

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
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px',
        borderRadius: '10px',
        cursor: 'pointer',
        gap: '12px',
        background: isActive ? '#EFF6FF' : 'transparent',
        borderLeft: isActive ? '3.5px solid #2563EB' : '3.5px solid transparent',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = '#F8FAFC';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar với Chấm Xanh Online */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#E0E7FF',
              color: '#4338CA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            {initial}
          </div>
        )}

        {/* Chấm tròn xanh báo Online */}
        {isOnline && (
          <span
            title="Đang hoạt động"
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '11px',
              height: '11px',
              borderRadius: '50%',
              background: '#22C55E',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          />
        )}
      </div>

      {/* Thông tin hội thoại */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '14.5px',
              fontWeight: isActive ? 700 : 600,
              color: '#1E293B',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </span>
          {formattedTime && (
            <span style={{ fontSize: '11.5px', color: '#94A3B8', flexShrink: 0, marginLeft: '6px' }}>
              {formattedTime}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: isActive ? '#2563EB' : '#64748B',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {lastMsg}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
