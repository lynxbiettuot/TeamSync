// src/components/chat/ChatHeader.tsx
import React from 'react';
import type { ChatUser } from '../../types/chat.types';

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
    <div
      style={{
        height: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Avatar với Chấm Trạng Thái */}
      <div style={{ position: 'relative' }}>
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#E0E7FF',
              color: '#4338CA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            {initial}
          </div>
        )}

        {/* Chấm tròn báo trạng thái */}
        <span
          title={isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
          style={{
            position: 'absolute',
            bottom: '1px',
            right: '1px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isOnline ? '#22C55E' : '#94A3B8',
            border: '2px solid #FFFFFF',
            transition: 'background-color 0.2s ease',
          }}
        />
      </div>

      {/* Tên và Trạng thái */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B', lineHeight: 1.2 }}>
          {displayName}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: isOnline ? '#16A34A' : '#64748B',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: isOnline ? 500 : 400,
          }}
        >
          {isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
