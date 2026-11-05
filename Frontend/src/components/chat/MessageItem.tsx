// src/components/chat/MessageItem.tsx
import React, { useState } from 'react';
import type { Message } from '../../types/chat.types';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  onReply?: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isMe, onReply }) => {
  const [isHovered, setIsHovered] = useState(false);

  const timeRaw = message.createdAt || message.created_at || '';
  const timeFormatted = timeRaw
    ? new Date(timeRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const replyData = message.replyTo || message.reply_to;

  const handleScrollToParent = () => {
    if (replyData?.id) {
      const el = document.getElementById(`message-${replyData.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'background-color 0.4s ease';
        el.style.backgroundColor = 'rgba(37, 99, 235, 0.15)';
        setTimeout(() => {
          el.style.backgroundColor = 'transparent';
        }, 1200);
      }
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        width: '100%',
        borderRadius: '8px',
        padding: '2px 4px',
        position: 'relative',
      }}
    >
      {/* Sender name for other users */}
      {!isMe && message.senderName && (
        <span style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '3px', marginLeft: '4px' }}>
          {message.senderName}
        </span>
      )}

      {/* Row containing bubble and hover actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '72%',
          flexDirection: isMe ? 'row-reverse' : 'row',
        }}
      >
        {/* Main Bubble */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
            background: isMe ? '#2563EB' : '#FFFFFF',
            color: isMe ? '#FFFFFF' : '#1E293B',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
            fontSize: '14px',
            lineHeight: '1.45',
            wordBreak: 'break-word',
            border: isMe ? 'none' : '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: replyData ? '160px' : 'unset',
          }}
        >
          {/* Quoted Reply Preview */}
          {replyData && (
            <div
              onClick={handleScrollToParent}
              title="Nhấn để xem tin nhắn gốc"
              style={{
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
                background: isMe ? 'rgba(255, 255, 255, 0.18)' : '#F1F5F9',
                borderLeft: isMe ? '3.5px solid #FFFFFF' : '3.5px solid #2563EB',
                marginBottom: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isMe ? '#DBEAFE' : '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>↩</span>
                <span>{replyData.senderName || replyData.sender_name || 'Người dùng'}</span>
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: isMe ? '#F1F5F9' : '#475569',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '240px',
                }}
              >
                {replyData.content}
              </div>
            </div>
          )}

          {/* Actual message content */}
          <div>{message.content}</div>
        </div>

        {/* Hover Action: Nút Reply */}
        {onReply && (
          <button
            onClick={() => onReply(message)}
            title="Trả lời tin nhắn này"
            style={{
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? 'auto' : 'none',
              transition: 'opacity 0.15s ease, transform 0.15s ease',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2563EB';
              e.currentTarget.style.background = '#EFF6FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            {/* Curved reply arrow icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
          </button>
        )}
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
