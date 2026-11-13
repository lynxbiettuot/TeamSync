// src/components/chat/MessageInput/MessageInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../../../types/chat.types';
import './MessageInput.css';

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
    <div className="chat-input-wrapper">
      {/* Banner hiển thị tin nhắn đang được phản hồi */}
      {replyingMessage && (
        <div className="chat-reply-banner">
          <div className="chat-reply-banner-body">
            <div className="chat-reply-banner-meta">
              <span className="chat-reply-banner-title">
                <span>↩ Đang trả lời</span>
                <span className="chat-reply-banner-author">
                  {replyingMessage.senderName || 'Tin nhắn'}
                </span>
              </span>
              <span className="chat-reply-banner-preview">{replyingMessage.content}</span>
            </div>
          </div>

          {/* Nút hủy reply */}
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              title="Hủy phản hồi (Esc)"
              className="chat-reply-cancel-btn"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Form nhập nội dung và nút gửi */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          ref={inputRef}
          type="text"
          placeholder={replyingMessage ? 'Nhập tin nhắn trả lời...' : 'Nhập tin nhắn...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`chat-input-field ${replyingMessage ? 'chat-input-field--replying' : ''}`}
        />
        <button type="submit" disabled={disabled || !content.trim()} className="chat-send-btn">
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
