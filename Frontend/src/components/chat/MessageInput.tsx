// src/components/chat/MessageInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../../types/chat.types';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  replyingMessage?: Message | null;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  replyingMessage,
  onCancelReply,
}) => {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Tự động focus vào ô gõ tin nhắn khi chọn reply
  useEffect(() => {
    if (replyingMessage && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape' && replyingMessage && onCancelReply) {
      e.preventDefault();
      onCancelReply();
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Banner hiển thị tin nhắn đang được phản hồi */}
      {replyingMessage && (
        <div
          style={{
            padding: '10px 24px 6px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            borderBottom: '1px solid #EDF2F7',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0,
              flex: 1,
              borderLeft: '3.5px solid #2563EB',
              paddingLeft: '10px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>↩ Đang trả lời</span>
                <span style={{ color: '#1E293B' }}>
                  {replyingMessage.senderName || 'Tin nhắn'}
                </span>
              </span>
              <span
                style={{
                  fontSize: '12.5px',
                  color: '#64748B',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '500px',
                  marginTop: '1px',
                }}
              >
                {replyingMessage.content}
              </span>
            </div>
          </div>

          {/* Nút hủy reply */}
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              title="Hủy phản hồi (Esc)"
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '14px',
                padding: 0,
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#EF4444';
                e.currentTarget.style.background = '#FEE2E2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Form nhập nội dung và nút gửi */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={replyingMessage ? 'Nhập tin nhắn trả lời...' : 'Nhập tin nhắn...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            flex: 1,
            height: '44px',
            padding: '0 16px',
            borderRadius: '8px',
            border: replyingMessage ? '1.5px solid #93C5FD' : '1.5px solid #E2E8F0',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#1E293B',
            background: disabled ? '#F8FAFC' : '#FFFFFF',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          style={{
            height: '44px',
            padding: '0 20px',
            borderRadius: '8px',
            background: disabled || !content.trim() ? '#93C5FD' : '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: disabled || !content.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Gửi</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
