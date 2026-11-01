// src/components/chat/MessageItem.tsx
import React from 'react';
import type { Message } from '../../types/chat.types';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isMe }) => {
  const timeRaw = message.createdAt || message.created_at || '';
  const timeFormatted = timeRaw
    ? new Date(timeRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        width: '100%',
      }}
    >
      {/* Sender name for other users */}
      {!isMe && message.senderName && (
        <span style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '3px', marginLeft: '4px' }}>
          {message.senderName}
        </span>
      )}

      {/* Bubble */}
      <div
        style={{
          maxWidth: '68%',
          padding: '10px 14px',
          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
          background: isMe ? '#2563EB' : '#FFFFFF',
          color: isMe ? '#FFFFFF' : '#1E293B',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
          fontSize: '14px',
          lineHeight: '1.45',
          wordBreak: 'break-word',
          border: isMe ? 'none' : '1px solid #E2E8F0',
        }}
      >
        {message.content}
      </div>

      {/* Timestamp */}
      {timeFormatted && (
        <span
          style={{
            fontSize: '11px',
            color: '#94A3B8',
            marginTop: '3px',
            marginRight: isMe ? '4px' : '0',
            marginLeft: isMe ? '0' : '4px',
          }}
        >
          {timeFormatted}
        </span>
      )}
    </div>
  );
};

export default MessageItem;
