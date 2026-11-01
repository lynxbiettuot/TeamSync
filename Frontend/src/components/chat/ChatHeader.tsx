// src/components/chat/ChatHeader.tsx
import React from 'react';
import type { ChatUser } from '../../types/chat.types';

interface ChatHeaderProps {
  user?: ChatUser | null;
  conversationName?: string | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ user, conversationName }) => {
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
      {/* Avatar */}
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
        {/* Status dot */}
        <span
          style={{
            position: 'absolute',
            bottom: '1px',
            right: '1px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#10B981',
            border: '2px solid #FFFFFF',
          }}
        />
      </div>

      {/* Name and Status */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B', lineHeight: 1.2 }}>
          {displayName}
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          {user?.status === 'ACTIVE' || !user?.status ? 'Đang hoạt động' : user.status}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
